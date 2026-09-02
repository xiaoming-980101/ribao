import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  enqueue,
  getOfflineQueue,
  flushOfflineQueue,
  getOfflineQueueCount,
  subscribeOfflineQueue,
  clearOfflineQueue,
  OfflineOp
} from '../offlineQueue';

describe('offlineQueue utils', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => mockStore[key] || null,
      setItem: (key: string, value: string) => { mockStore[key] = String(value); },
      removeItem: (key: string) => { delete mockStore[key]; },
      clear: () => { mockStore = {}; },
      length: 0,
      key: (_i: number) => null
    };

    // 清空重置队列
    clearOfflineQueue();
    mockStore = {};
  });

  it('enqueue 应当支持将操作加入队列并持久化到 localStorage', () => {
    enqueue({ kind: 'save_log', date: '2026-09-01', payload: { title: '测试1' } });
    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].kind).toBe('save_log');
    expect(queue[0].date).toBe('2026-09-01');
    expect(queue[0].payload.title).toBe('测试1');

    // 验证 localStorage 是否已写入
    const raw = mockStore['winner_daily_offline_queue'];
    expect(raw).toBeDefined();
    expect(JSON.parse(raw).length).toBe(1);
  });

  it('enqueue 相同日期的 save_log 应当自动去重覆盖，保留最新数据', () => {
    enqueue({ kind: 'save_log', date: '2026-09-01', payload: { title: '版本1' } });
    enqueue({ kind: 'save_log', date: '2026-09-01', payload: { title: '版本2' } });

    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].payload.title).toBe('版本2');
  });

  it('enqueue save_settings 应当只保留最新的一份配置', () => {
    enqueue({ kind: 'save_settings', payload: { theme: 'dark' } });
    enqueue({ kind: 'save_settings', payload: { theme: 'light' } });

    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].payload.theme).toBe('light');
  });

  it('enqueue reset 应当清空所有挂起操作', () => {
    enqueue({ kind: 'save_log', date: '2026-09-01', payload: { title: '测试' } });
    enqueue({ kind: 'save_settings', payload: { theme: 'light' } });
    expect(getOfflineQueueCount()).toBe(2);

    enqueue({ kind: 'reset' });
    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].kind).toBe('reset');
  });

  it('flushOfflineQueue 应当按严格 FIFO 顺序回放所有操作并清空队列', async () => {
    const executed: string[] = [];
    enqueue({ kind: 'save_log', date: '2026-09-01', payload: { id: 1 } });
    enqueue({ kind: 'save_log', date: '2026-09-02', payload: { id: 2 } });
    enqueue({ kind: 'save_settings', payload: { id: 3 } });

    const result = await flushOfflineQueue(async (op: OfflineOp) => {
      executed.push(op.kind + '_' + (op.date || 'settings'));
      return true;
    });

    expect(result.successCount).toBe(3);
    expect(result.failCount).toBe(0);
    expect(executed).toEqual(['save_log_2026-09-01', 'save_log_2026-09-02', 'save_settings_settings']);
    expect(getOfflineQueueCount()).toBe(0);
  });

  it('flushOfflineQueue 在中途失败时，必须保持剩余队列的严格 FIFO 顺序，绝不能出现逆序反转', async () => {
    enqueue({ kind: 'save_log', date: '2026-09-01', payload: { step: 1 } });
    enqueue({ kind: 'delete_log', date: '2026-09-01' });
    enqueue({ kind: 'save_log', date: '2026-09-02', payload: { step: 3 } });

    // 模拟第一个成功，第二个失败（如网络中断）
    const result = await flushOfflineQueue(async (op: OfflineOp) => {
      if (op.kind === 'delete_log') {
        return false;
      }
      return true;
    });

    expect(result.successCount).toBe(1);
    expect(result.failCount).toBe(1);

    // 剩余队列必须是：[delete_log 2026-09-01, save_log 2026-09-02]，绝不能被倒序颠倒
    const remaining = getOfflineQueue();
    expect(remaining.length).toBe(2);
    expect(remaining[0].kind).toBe('delete_log');
    expect(remaining[0].date).toBe('2026-09-01');
    expect(remaining[1].kind).toBe('save_log');
    expect(remaining[1].date).toBe('2026-09-02');
  });

  it('subscribeOfflineQueue 应当能监听队列变动通知', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeOfflineQueue(listener);

    expect(listener).toHaveBeenCalledTimes(1); // 立即收到一次当前状态

    enqueue({ kind: 'save_log', date: '2026-09-03', payload: { title: '新事件' } });
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    enqueue({ kind: 'save_log', date: '2026-09-04', payload: { title: '退订后' } });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
