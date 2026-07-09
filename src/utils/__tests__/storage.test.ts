import { describe, it, expect } from 'vitest';
import { isOpenRouterApiUrl } from '../storage';

describe('storage utils', () => {
  describe('isOpenRouterApiUrl', () => {
    it('should return true for openrouter urls', () => {
      expect(isOpenRouterApiUrl('https://openrouter.ai/api/v1')).toBe(true);
      expect(isOpenRouterApiUrl('https://openrouter.ai/api/v1/')).toBe(true);
    });

    it('should return false for other urls', () => {
      expect(isOpenRouterApiUrl('https://api.openai.com/v1')).toBe(false);
    });
  });
});
