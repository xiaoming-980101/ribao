/**
 * ESLint 扁平配置（flat config）
 *
 * ESLint 10 已移除对 .eslintrc.* 与 .eslintignore 的支持，忽略规则统一在此声明。
 * 检查范围覆盖前端 src/、后端 server/ 与测试脚本 tests/，
 * 后端此前长期不在 lint 范围内，不要再把它排除出去。
 */
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'backups/**', 'vite.config.ts']
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      'react-hooks': reactHooks
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // 该项目大量使用 any 承接上游动态响应，不作硬性约束
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }
      ]
    }
  }
);
