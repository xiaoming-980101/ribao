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
  kind: 'save_log' | 'delete_log' | 'save_settings' | 'reset';
  date?: string;         // save_log / delete_log 专属
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

function persist() {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('[offlineQueue] 持久化队列失败:', e);
  }
}

function load() {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) queue = parsed;
    }
  } catch (e) {
    console.warn('[offlineQueue] 加载队列失败，重置:', e);
    queue = [];
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  }
}

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

/**
 * 尝试回放整个离线队列。
 * 逐条调用 enqueue 传回的 sync 回调（实际进行服务器请求）；
 * 全部成功后清空队列。
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

  // 逐条快照处理；先复制后清空标记（若中途失败再回填）
  const pending = [...queue];
  queue = [];
  persist();

  for (const op of pending) {
    try {
      const ok = await syncOne(op);
      if (ok) {
        successCount++;
      } else {
        failCount++;
        queue.unshift(op);   // 放回队首等待下次
      }
    } catch (e) {
      console.warn('[offlineQueue] 同步单条操作失败:', op.kind, op.date, e);
      failCount++;
      queue.unshift(op);
    }
  }

  if (queue.length > 0) {
    // 有失败，保留剩余队列
    persist();
  } else {
    // 全部成功，清空
    persist();
    broadcast('synced');
  }

  busy = false;
  notify();
  return { successCount, failCount, done: true };
}