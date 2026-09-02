/**
 * 日志草稿自动保存
 *
 * 用户在日频生成/编辑表单中输入过程中，自动将未保存的编辑内容暂存到
 * localStorage（按 用户 + 日期 维度隔离）。刷新/关闭/切换日期后重新进入时，
 * 可自动恢复草稿，避免内容丢失。
 */

import { getCurrentUser } from './storage';

export interface LogDraft {
  title: string;
  hours: number;
  cooperation: boolean;
  difficulty: boolean;
  content: string;
  updatedAt: number;
}

/** 草稿在 localStorage 中的 TTL：7 天（防止无限堆积无使用价值的旧草稿） */
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function draftKey(date: string, user: string = getCurrentUser()): string {
  return `winner_daily_draft_${user}_${date}`;
}

/** 保存指定日期草稿 */
export function saveDraft(
  date: string,
  fields: { title: string; hours: number; cooperation: boolean; difficulty: boolean; content: string },
  user?: string
): void {
  if (!date) return;
  try {
    const draft: LogDraft = { ...fields, updatedAt: Date.now() };
    localStorage.setItem(draftKey(date, user), JSON.stringify(draft));
  } catch (e) {
    console.warn('[draft] 保存草稿失败:', e);
  }
}

/** 读取指定日期草稿（过期的视为无效） */
export function loadDraft(date: string, user?: string): LogDraft | null {
  if (!date) return null;
  try {
    const raw = localStorage.getItem(draftKey(date, user));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LogDraft;
    if (!parsed || typeof parsed.content !== 'string') return null;
    // 过期清理
    if (Date.now() - (parsed.updatedAt || 0) > DRAFT_TTL_MS) {
      clearDraft(date, user);
      return null;
    }
    return parsed;
  } catch (e) {
    return null;
  }
}

/** 清除指定日期草稿（保存成功后调用） */
export function clearDraft(date: string, user?: string): void {
  try {
    localStorage.removeItem(draftKey(date, user));
  } catch (e) {
    /* ignore */
  }
}

/** 清除某用户全部草稿（登出时调用，与密钥隔离同策略） */
export function clearAllDrafts(user: string = getCurrentUser()): void {
  try {
    const prefix = `winner_daily_draft_${user}_`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    /* ignore */
  }
}