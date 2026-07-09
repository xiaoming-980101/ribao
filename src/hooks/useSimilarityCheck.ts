import { useState, useEffect } from 'react';
import { calculateSimilarity } from '../utils/generator';

interface UseSimilarityCheckProps {
  content: string;
  selectedDate: string;
  logs: Record<string, { content: string }>;
  sessionHistory: string[];
}

export function useSimilarityCheck({ content, selectedDate, logs, sessionHistory }: UseSimilarityCheckProps) {
  const [maxSimilarity, setMaxSimilarity] = useState<number>(0);
  const [similarDate, setSimilarDate] = useState<string>('');

  useEffect(() => {
    if (!content) {
      setMaxSimilarity(0);
      setSimilarDate('');
      return;
    }

    let maxSim = 0;
    let simDate = '';

    // 1. 对比过去 30 天内除当天以外的日志
    Object.entries(logs).forEach(([date, log]) => {
      if (date === selectedDate) return;

      const todayDate = new Date(selectedDate);
      const logDate = new Date(date);
      const diffTime = Math.abs(todayDate.getTime() - logDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) return;

      const sim = calculateSimilarity(content, log.content);
      if (sim > maxSim) {
        maxSim = sim;
        simDate = `${date} 已保存的日志`;
      }
    });

    // 2. 对比本会话连续生成历史
    sessionHistory.forEach((histContent, idx) => {
      if (histContent === content) return;
      const sim = calculateSimilarity(content, histContent);
      if (sim > maxSim) {
        maxSim = sim;
        simDate = `刚才生成的第 ${idx + 1} 稿草稿`;
      }
    });

    setMaxSimilarity(maxSim);
    setSimilarDate(simDate);
  }, [content, selectedDate, logs, sessionHistory]);

  return { maxSimilarity, similarDate };
}
