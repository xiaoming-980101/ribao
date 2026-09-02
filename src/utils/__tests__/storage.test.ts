import { describe, it, expect, beforeEach } from 'vitest';
import {
  isOpenRouterApiUrl,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getAuthHeaders
} from '../storage';

describe('storage utils', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    global.localStorage = {
      getItem: (key: string) => mockStore[key] || null,
      setItem: (key: string, value: string) => { mockStore[key] = String(value); },
      removeItem: (key: string) => { delete mockStore[key]; },
      clear: () => { mockStore = {}; },
      length: 0,
      key: (_i: number) => null
    } as any;
  });

  describe('isOpenRouterApiUrl', () => {
    it('should return true for openrouter urls', () => {
      expect(isOpenRouterApiUrl('https://openrouter.ai/api/v1')).toBe(true);
      expect(isOpenRouterApiUrl('https://openrouter.ai/api/v1/')).toBe(true);
    });

    it('should return false for other urls', () => {
      expect(isOpenRouterApiUrl('https://api.openai.com/v1')).toBe(false);
    });
  });

  describe('auth token and headers', () => {
    it('should correctly save, read, and remove auth token', () => {
      expect(getAuthToken()).toBe('');
      setAuthToken('sample_signed_token_123');
      expect(getAuthToken()).toBe('sample_signed_token_123');
      removeAuthToken();
      expect(getAuthToken()).toBe('');
    });

    it('should include Authorization and X-Auth-Token headers when token is present', () => {
      localStorage.setItem('winner_daily_user', 'alex');
      setAuthToken('token_xyz');

      const headers = getAuthHeaders({ 'Custom-Header': 'test' });
      expect(headers['X-User-Name']).toBe('alex');
      expect(headers['Authorization']).toBe('Bearer token_xyz');
      expect(headers['X-Auth-Token']).toBe('token_xyz');
      expect(headers['Custom-Header']).toBe('test');
    });
  });
});
