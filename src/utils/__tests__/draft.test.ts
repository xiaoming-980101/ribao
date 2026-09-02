import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveDraft,
  loadDraft,
  clearDraft,
  clearAllDrafts,
  LogDraft
} from '../draft';

describe('draft utils', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => mockStore[key] || null,
      setItem: (key: string, value: string) => { mockStore[key] = String(value); },
      removeItem: (key: string) => { delete mockStore[key]; },
      clear: () => { mockStore = {}; },
      get length() { return Object.keys(mockStore).length; },
      key: (i: number) => Object.keys(mockStore)[i] || null
    };
  });

  it('saveDraft 与 loadDraft 应当能正确存取指定日期的草稿', () => {
    const fields = {
      title: '排查慢查询与联合索引调优',
      hours: 8,
      cooperation: true,
      difficulty: false,
      content: '今天核对了最近的慢 SQL 日志，并在测试环境验证了索引效果。'
    };

    saveDraft('2026-09-02', fields, 'user_a');
    const draft = loadDraft('2026-09-02', 'user_a');

    expect(draft).not.toBeNull();
    expect(draft?.title).toBe(fields.title);
    expect(draft?.content).toBe(fields.content);
    expect(draft?.hours).toBe(8);
    expect(draft?.cooperation).toBe(true);
    expect(draft?.updatedAt).toBeGreaterThan(0);
  });

  it('草稿应当支持多用户物理隔离', () => {
    saveDraft('2026-09-02', { title: 'UserA标题', hours: 8, cooperation: false, difficulty: false, content: 'UserA内容' }, 'alice');
    saveDraft('2026-09-02', { title: 'UserB标题', hours: 4, cooperation: true, difficulty: false, content: 'UserB内容' }, 'bob');

    const draftA = loadDraft('2026-09-02', 'alice');
    const draftB = loadDraft('2026-09-02', 'bob');

    expect(draftA?.title).toBe('UserA标题');
    expect(draftB?.title).toBe('UserB标题');
  });

  it('clearDraft 应当只清除指定日期的草稿', () => {
    saveDraft('2026-09-01', { title: 'D1', hours: 8, cooperation: false, difficulty: false, content: 'C1' }, 'alice');
    saveDraft('2026-09-02', { title: 'D2', hours: 8, cooperation: false, difficulty: false, content: 'C2' }, 'alice');

    clearDraft('2026-09-01', 'alice');

    expect(loadDraft('2026-09-01', 'alice')).toBeNull();
    expect(loadDraft('2026-09-02', 'alice')).not.toBeNull();
  });

  it('clearAllDrafts 应当清除该用户的所有草稿，且不影响其他用户', () => {
    saveDraft('2026-09-01', { title: 'D1', hours: 8, cooperation: false, difficulty: false, content: 'C1' }, 'alice');
    saveDraft('2026-09-02', { title: 'D2', hours: 8, cooperation: false, difficulty: false, content: 'C2' }, 'alice');
    saveDraft('2026-09-01', { title: 'Bob-D1', hours: 8, cooperation: false, difficulty: false, content: 'Bob-C1' }, 'bob');

    clearAllDrafts('alice');

    expect(loadDraft('2026-09-01', 'alice')).toBeNull();
    expect(loadDraft('2026-09-02', 'alice')).toBeNull();
    expect(loadDraft('2026-09-01', 'bob')).not.toBeNull();
  });

  it('超过 7 天 TTL 的草稿应当自动判定为过期并清理', () => {
    const expiredTime = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 天前
    const expiredDraft: LogDraft = {
      title: '过期草稿',
      hours: 8,
      cooperation: false,
      difficulty: false,
      content: '旧内容',
      updatedAt: expiredTime
    };

    mockStore['winner_daily_draft_alice_2026-08-01'] = JSON.stringify(expiredDraft);

    const result = loadDraft('2026-08-01', 'alice');
    expect(result).toBeNull();
    // 验证已被自动清理
    expect(mockStore['winner_daily_draft_alice_2026-08-01']).toBeUndefined();
  });
});
