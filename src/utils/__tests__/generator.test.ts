import { describe, it, expect } from 'vitest';
import {
  calculateSimilarity,
  getSimilarityLevel,
  getJobDisplayName,
  expandUserInput,
  generateRandomDaily,
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

    it('should detect high similarity even when sentences are reordered', () => {
      const original = '1. 排查慢SQL慢查询日志并重建索引\n2. 联调用户中心第三方SSO单点登录鉴权接口';
      const reordered = '1. 联调用户中心第三方SSO单点登录鉴权接口\n2. 排查慢SQL慢查询日志并重建索引';
      const sim = calculateSimilarity(original, reordered);
      // 原编辑距离往往极低，而混合 N-gram 能够精准识别并判定 >= 70% 高雷同度
      expect(sim).toBeGreaterThanOrEqual(70);
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
    it('should return correct job name for various roles', () => {
      expect(getJobDisplayName('frontend')).toBe('前端开发工程师');
      expect(getJobDisplayName('backend')).toBe('后端开发工程师');
      expect(getJobDisplayName('fullstack')).toBe('全栈开发工程师');
      expect(getJobDisplayName('tester')).toBe('测试工程师');
      expect(getJobDisplayName('designer')).toBe('UI/UX 视觉设计师');
      expect(getJobDisplayName('pm')).toBe('产品经理');
      expect(getJobDisplayName('devops')).toBe('运维与SRE工程师');
    });

    it('should return custom job name if custom is selected', () => {
      expect(getJobDisplayName('custom', 'UI设计师')).toBe('UI设计师');
    });
  });

  describe('expandUserInput', () => {
    it('should return GeneratedLogResult structure for frontend', () => {
      const res = expandUserInput('联调接口', 'frontend');
      expect(res).toHaveProperty('title');
      expect(res).toHaveProperty('content');
      expect(res.content).toContain('联调接口');
    });

    it('should return rich content for backend keywords', () => {
      const res = expandUserInput('优化慢sql,排查redis缓存', 'backend');
      expect(res).toHaveProperty('title');
      expect(res).toHaveProperty('content');
      expect(res.content.length).toBeGreaterThan(30);
    });
  });

  describe('generateRandomDaily', () => {
    it('should generate non-empty daily logs for all roles', () => {
      const roles = ['backend', 'frontend', 'fullstack', 'tester', 'designer', 'pm', 'devops'];
      roles.forEach(role => {
        const res = generateRandomDaily('2026-08-28', false, role);
        expect(res.title).toBeTruthy();
        expect(res.content.length).toBeGreaterThan(20);
      });
    });
  });

  describe('generateAIPrompt', () => {
    it('should generate containing job name and user input', () => {
      const prompt = generateAIPrompt('修复Bug', 'backend');
      expect(prompt).toContain('后端开发工程师');
      expect(prompt).toContain('修复Bug');
    });
  });
});

