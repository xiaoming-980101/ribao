/**
 * 离线操作队列 + 网络恢复自动同步
 *
 * 当后端不可用（离线模式） 时，前端将 增/删/改 操作暂存至本地队列；
 * 一旦网络或后端服务恢复，自动按序回放队列中的操作，最终保证本地与服务器数据一致。
 *
 * 特性：
 *  - localStorage 持久化队列（刷新不丢）
 *  - BroadcastChannel 跨标签页自动同步状态
 *  - 去重：连续相同 key 的保存操作仅保留最新一条（避免回放堆积）
 *  - 事件通知：队列变化 / 同步完成时触发，供 UI 展示状态
 */

const QUEUE_STORAGE_KEY = 'winner_daily_offline_queue';
const CHANNEL_NAME = 'winner-daily-sync';

/** 离线操作条目 */
export interface OfflineOp {
  id: string;
  kind: 'save_log' | 'delete_log' | 'restore_log' | 'save_settings' | 'save_report' | 'clear_trash' | 'reset';
  date?: string;         // save_log / delete_log / restore_log 专属
  payload?: any;          // save_log / save_settings 数据
  createdAt: number;
}

type Listener = (queue: OfflineOp[], busy: boolean) => void;

let queue: OfflineOp[] = [];
let busy = false;
let channel: BroadcastChannel | null = null;
let listeners: Listener[] = [];

/** 加密后的本地队列状态变化广播 */
function broadcast(type: 'changed' | 'busy' | 'synced') {
  try {
    if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type });
  } catch (e) { /* 旧浏览器忽略 */ }
}

function isLocalStorageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function' && typeof localStorage.setItem === 'function';
  } catch (e) {
    return false;
  }
}

function persist() {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('[offlineQueue] 持久化队列失败:', e);
  }
}

function load() {
  if (!isLocalStorageAvailable()) return;
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) queue = parsed;
    }
  } catch (e) {
    console.warn('[offlineQueue] 加载队列失败，重置:', e);
    queue = [];
    try {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    } catch (_) {}
  }
}

// 模块加载时立即恢复持久化的离线队列
load();

function notify() {
  listeners.forEach((l) => l([...queue], busy));
  broadcast('changed');
}

function isBackendUp(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
}

/**
 * 将离线操作加入队列。
 * save_log 若同日期已存在则用最新操作覆盖（去重）。
 */
export function enqueue(op: Omit<OfflineOp, 'id' | 'createdAt'>): void {
  // save_log / save_settings 同类去重，仅保留最新
  if (op.kind === 'save_log' && op.date) {
    queue = queue.filter((q) => !(q.kind === 'save_log' && q.date === op.date));
  }
  if (op.kind === 'save_settings') {
    queue = queue.filter((q) => q.kind !== 'save_settings');
  }
  if (op.kind === 'reset') {
    queue = [];   // 重置清空所有挂起操作
  }

  queue.push({
    ...op,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now()
  });
  persist();
  notify();
}

/** 获取当前离线队列（拷贝） */
export function getOfflineQueue(): OfflineOp[] {
  return [...queue];
}

/** 是否正在执行同步 */
export function isSyncBusy(): boolean {
  return busy;
}

/** 订阅队列变化 */
export function subscribeOfflineQueue(listener: Listener): () => void {
  listeners.push(listener);
  // 立即回传当前状态
  listener([...queue], busy);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

/** 队列中待同步操作数 */
export function getOfflineQueueCount(): number {
  return queue.length;
}

/** 清空离线队列（重置/测试用） */
export function clearOfflineQueue(): void {
  queue = [];
  persist();
  notify();
}

/**
 * 尝试回放整个离线队列。
 * 逐条调用 syncOne 传回的 sync 回调（实际进行服务器请求）；
 * 保持严格 FIFO 顺序，若网络中断或失败则安全保留剩余队列。
 * @returns 成功处理条数
 */
export async function flushOfflineQueue(
  syncOne: (op: OfflineOp) => Promise<boolean>,
): Promise<{ successCount: number; failCount: number; done: boolean }> {
  if (busy) return { successCount: 0, failCount: 0, done: false };
  if (queue.length === 0 || !isBackendUp()) return { successCount: 0, failCount: 0, done: true };

  busy = true;
  notify();
  let successCount = 0;
  let failCount = 0;

  // 逐条快照处理
  const pending = [...queue];
  queue = [];
  persist();

  const remaining: OfflineOp[] = [];

  for (let i = 0; i < pending.length; i++) {
    const op = pending[i];
    try {
      const ok = await syncOne(op);
      if (ok) {
        successCount++;
      } else {
        failCount++;
        // 当前失败项及后续未执行项按原顺序保留，中断本次回放
        remaining.push(...pending.slice(i));
        break;
      }
    } catch (e) {
      console.warn('[offlineQueue] 同步单条操作失败:', op.kind, op.date, e);
      failCount++;
      remaining.push(...pending.slice(i));
      break;
    }
  }

  // 将未完成的剩余项与同步过程中新入队的操作合并（保持 FIFO）
  queue = [...remaining, ...queue];

  if (queue.length > 0) {
    persist();
  } else {
    persist();
    broadcast('synced');
  }

  busy = false;
  notify();
  return { successCount, failCount, done: true };
}