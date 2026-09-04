import { useState, useEffect, useMemo, useCallback } from 'react';
import { calculateSimilarity } from '../utils/generator';

/**
 * 查重防抖延时（ms）。
 * 查重是 O(候选条数 × 文本长度²) 的编辑距离计算，若跟随每次按键同步执行，
 * 在「长内容 + 历史日志较多」时单次耗时可达数十毫秒，会直接造成输入掉帧。
 */
const SIMILARITY_DEBOUNCE_MS = 300;

/** 参与比对的候选文本及其展示标签 */
interface SimilarityCandidate {
  text: string;
  label: string;
}

export interface SimilarityResult {
  maxSimilarity: number;
  similarDate: string;
}

interface UseSimilarityCheckProps {
  content: string;
  selectedDate: string;
  logs: Record<string, { content: string }>;
  sessionHistory: string[];
}

/** 构建候选集：过去 30 天内除当天以外的已存日志 + 本会话连续生成历史 */
function buildCandidates(
  logs: Record<string, { content: string }>,
  selectedDate: string,
  sessionHistory: string[]
): SimilarityCandidate[] {
  const candidates: SimilarityCandidate[] = [];
  const baseTime = selectedDate ? new Date(selectedDate).getTime() : NaN;

  Object.entries(logs).forEach(([date, log]) => {
    if (date === selectedDate) return;
    if (!Number.isNaN(baseTime)) {
      const diffDays = Math.ceil(Math.abs(baseTime - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 30) return;
    }
    candidates.push({ text: log.content, label: `${date} 已保存的日志` });
  });

  sessionHistory.forEach((histContent, idx) => {
    candidates.push({ text: histContent, label: `刚才生成的第 ${idx + 1} 稿草稿` });
  });

  return candidates;
}

/** 在候选集中求最高相似度 */
function computeMaxSimilarity(content: string, candidates: SimilarityCandidate[]): SimilarityResult {
  if (!content) return { maxSimilarity: 0, similarDate: '' };

  let maxSimilarity = 0;
  let similarDate = '';

  for (const candidate of candidates) {
    // 与自身完全一致的会话草稿不计入（原逻辑：避免把刚生成的当前稿判成雷同）
    if (candidate.text === content) continue;

    const sim = calculateSimilarity(content, candidate.text);
    if (sim > maxSimilarity) {
      maxSimilarity = sim;
      similarDate = candidate.label;
    }
  }

  return { maxSimilarity, similarDate };
}

export function useSimilarityCheck({ content, selectedDate, logs, sessionHistory }: UseSimilarityCheckProps) {
  const [maxSimilarity, setMaxSimilarity] = useState<number>(0);
  const [similarDate, setSimilarDate] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // 候选集只在日志/日期/会话历史变化时重建，不随每次输入重复构造
  const candidates = useMemo(
    () => buildCandidates(logs, selectedDate, sessionHistory),
    [logs, selectedDate, sessionHistory]
  );

  /**
   * 同步立即查重。保存前的绩效红线校验必须走这里：
   * 防抖窗口内直接点保存时，state 中的值仍是上一次输入的结果，
   * 用陈旧值判定会让高相似度告警被静默绕过。
   */
  const checkNow = useCallback((text: string): SimilarityResult => {
    const result = computeMaxSimilarity(text, candidates);
    setMaxSimilarity(result.maxSimilarity);
    setSimilarDate(result.similarDate);
    setIsChecking(false);
    return result;
  }, [candidates]);

  useEffect(() => {
    if (!content) {
      setMaxSimilarity(0);
      setSimilarDate('');
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    const timer = window.setTimeout(() => {
      const result = computeMaxSimilarity(content, candidates);
      setMaxSimilarity(result.maxSimilarity);
      setSimilarDate(result.similarDate);
      setIsChecking(false);
    }, SIMILARITY_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [content, candidates]);

  return { maxSimilarity, similarDate, isChecking, checkNow };
}
