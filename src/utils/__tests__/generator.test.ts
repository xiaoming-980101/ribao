import { describe, it, expect } from 'vitest';
import {
  calculateSimilarity,
  getSimilarityLevel,
  getJobDisplayName,
  expandUserInput,
  generateAIPrompt
} from '../generator';

describe('generator utils', () => {
  describe('calculateSimilarity', () => {
    it('should return 100 for identical strings', () => {
      expect(calculateSimilarity('今天写了代码', '今天写了代码')).toBe(100);
    });

    it('should return 0 for completely different strings', () => {
      expect(calculateSimilarity('abc', 'xyz')).toBe(0);
    });

    it('should calculate correct similarity percentage', () => {
      const sim = calculateSimilarity('前端重构完成', '前端重构');
      expect(sim).toBeGreaterThan(0);
      expect(sim).toBeLessThan(100);
    });
  });

  describe('getSimilarityLevel', () => {
    it('should return correct level below threshold but above 30', () => {
      const level = getSimilarityLevel(30, 50);
      expect(level.level).toBe('warning');
    });

    it('should return correct level above threshold', () => {
      const level = getSimilarityLevel(60, 50);
      expect(level.level).toBe('danger');
    });

    it('should return correct level below 30', () => {
      const level = getSimilarityLevel(10, 50);
      expect(level.level).toBe('safe');
    });
  });

  describe('getJobDisplayName', () => {
    it('should return default job name', () => {
      expect(getJobDisplayName('frontend')).toBe('前端开发工程师');
    });

    it('should return custom job name if custom is selected', () => {
      expect(getJobDisplayName('custom', 'UI设计师')).toBe('UI设计师');
    });
  });

  describe('expandUserInput', () => {
    it('should return GeneratedLogResult structure', () => {
      const res = expandUserInput('联调接口', 'frontend');
      expect(res).toHaveProperty('title');
      expect(res).toHaveProperty('content');
      expect(res.content).toContain('联调接口');
    });
  });

  describe('generateAIPrompt', () => {
    it('should generate containing job name and user input', () => {
      const prompt = generateAIPrompt('修复Bug', 'frontend');
      expect(prompt).toContain('前端开发工程师');
      expect(prompt).toContain('修复Bug');
    });
  });
});
