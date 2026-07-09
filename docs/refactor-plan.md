# 赢日志项目全面修复实施方案

> 生成日期：2026-07-09
> 项目：Winner Daily（赢日志）
> 目标：对项目进行全面修复，覆盖安全加固、工程化基础、架构重构、生产加固四大维度。

---

## 目录

- [概述](#概述)
- [Phase 1：安全紧急修复](#phase-1安全紧急修复不破坏现有功能)
  - [1.1 修复 db.json 泄露](#11-修复-dbjson-泄露)
  - [1.2 密码哈希升级为 bcrypt](#12-密码哈希升级为-bcrypt)
  - [1.3 认证中间件 + 速率限制](#13-认证中间件--速率限制)
  - [1.4 数据库写入原子化](#14-数据库写入原子化)
- [Phase 2：工程化基础](#phase-2工程化基础)
  - [2.1 ESLint + Prettier](#21-eslint--prettier)
  - [2.2 核心单元测试（Vitest）](#22-核心单元测试vitest)
  - [2.3 .env 环境变量支持](#23-env-环境变量支持)
  - [2.4 文档完善](#24-文档完善)
  - [2.5 清理依赖](#25-清理依赖)
- [Phase 3：架构重构](#phase-3架构重构)
  - [3.1 server.js 拆分为模块化结构](#31-serverjs-拆分为模块化结构)
  - [3.2 DailyGenerator.tsx 拆分](#32-dailygeneratortsx-拆分)
- [Phase 4：生产加固](#phase-4生产加固)
  - [4.1 错误监控准备](#41-错误监控准备)
  - [4.2 CI/CD 增强](#42-cicd-增强)
  - [4.3 开发体验](#43-开发体验)
- [执行策略](#执行策略)
- [风险控制](#风险控制)

---

## 概述

分 4 个阶段，从高到低优先级，覆盖安全加固、工程化基础、架构重构、生产加固。

---

## Phase 1：安全紧急修复（不破坏现有功能）

### 1.1 修复 db.json 泄露

- **`.gitignore`** 新增 `db.json`、`.env`、`.env.local`、`*.log`、`/nul`
- **创建 `db.example.json`** 作为模板（空 users 结构）
- **`db.json`** 清除真实 API Key，密码重置为示例占位
- 提醒用户轮换已泄露的 OpenRouter API Key（需手动操作）

### 1.2 密码哈希升级为 bcrypt

- **`package.json`** 新增依赖 `bcryptjs`（纯 JS 实现，无需编译原生模块，兼容 Alpine/Docker）
- **`server.js`**：
  - `hashPassword()` 改用 `bcrypt.hashSync(password, 10)`
  - 新增 `verifyPassword(password, hash)` 用 `bcrypt.compareSync`
  - 登录端点改用 `verifyPassword`
  - **兼容旧 SHA-256 哈希**：登录时若 `compareSync` 失败，检测是否为旧 64 位 hex（SHA-256），验证通过则自动升级为 bcrypt 哈希（透明迁移，老用户无感）

### 1.3 认证中间件 + 速率限制

- **`package.json`** 新增 `express-rate-limit`
- **`server.js`** 新增 `authMiddleware`：从 `X-User-Name` 头读取用户，校验 db 中存在该用户（`/api/data`、`/api/logs`、`/api/settings` 等需要登录态的接口）
- 登录/注册端点加 `rateLimit`（15 分钟内最多 10 次）

### 1.4 数据库写入原子化

- **`server.js`** 的 `writeDB()` 改为"写临时文件 + rename"模式，防止写入中断导致数据损坏

---

## Phase 2：工程化基础

### 2.1 ESLint + Prettier

- **`package.json`** devDependencies 新增 `eslint`、`@typescript-eslint/parser`、`@typescript-eslint/eslint-plugin`、`eslint-plugin-react-hooks`、`prettier`
- 新增 scripts：`lint`、`lint:fix`、`format`
- **`.eslintrc.cjs`**：TypeScript + React Hooks 规则
- **`.prettierrc`**：单引号、无分号、2 空格（匹配现有风格）
- **`.eslintignore`**、**`.prettierignore`**

### 2.2 核心单元测试（Vitest）

- **`package.json`** devDependencies 新增 `vitest`
- 新增 script：`test`
- **`src/utils/__tests__/generator.test.ts`**：测试 `calculateSimilarity`、`getSimilarityLevel`、`expandUserInput`、`generateRandomFrontendDaily`
- **`src/utils/__tests__/storage.test.ts`**：测试 `isOpenRouterApiUrl`、`normalizeModelId`（从 DailyGenerator 提取的纯函数）

### 2.3 .env 环境变量支持

- **`package.json`** 新增 `dotenv` 依赖
- **`.env.example`**：示例配置（PORT、DB_PATH、DEFAULT_AI_API_URL）
- **`server.js`**：`import 'dotenv/config'`，PORT/DB_FILE 等改为读取 `process.env`

### 2.4 文档完善

- **`README.md`** 扩充：技术栈、项目结构、开发指南、API 文档、部署说明、贡献指南
- **`CHANGELOG.md`**：基于 git 历史生成
- **`LICENSE`**：MIT 许可证

### 2.5 清理依赖

- **`package.json`**：`ssh2` 移到 devDependencies（仅 CI/CD 用，非运行时依赖）

---

## Phase 3：架构重构

### 3.1 server.js 拆分为模块化结构

```
server/
├── index.js              # 入口，启动 Express
├── config.js             # 环境变量、常量
├── db.js                 # 数据库读写、原子写入、迁移
├── middleware/
│   ├── auth.js           # 认证中间件
│   └── rateLimit.js      # 速率限制
├── utils/
│   ├── password.js       # bcrypt 哈希/验证/迁移
│   ├── aiPrompt.js       # prompt 构建、parseGeneratedLog
│   └── modelUtils.js     # normalizeModelId、classifyGenerateError 等
└── routes/
    ├── auth.js           # /api/register, /api/login
    ├── data.js           # /api/data, /api/logs, /api/settings, /api/reset
    └── ai.js             # /api/generate, /api/models
```

### 3.2 DailyGenerator.tsx 拆分

```
src/
├── components/
│   ├── DailyGenerator.tsx        # 主容器组件（协调状态，~300行）
│   ├── daily/
│   │   ├── InputPanel.tsx        # 左侧输入面板（日期、岗位、模式、任务输入）
│   │   ├── PreviewPanel.tsx      # 右侧表单预览（标题、内容、相似度、保存）
│   │   ├── AIModelControls.tsx   # AI 模型选择、对比、搜索下拉
│   │   └── CompareResults.tsx    # 多模型对比结果展示
├── hooks/
│   ├── useAIGeneration.ts        # AI 生成、降级队列、对比逻辑
│   └── useSimilarityCheck.ts     # 查重检测逻辑
├── types/
│   └── ai.ts                     # RouteInfo、CompareResult 类型
└── utils/
    ├── modelHelpers.ts           # checkIsRecommended、buildFallbackQueue、formatErrorReason 等
    └── clipboard.ts              # copyTextToClipboard
```

**重构原则**：

- 纯函数和类型先提取（零风险）
- 业务逻辑提取到自定义 hooks
- UI 拆分为子组件，props 传递状态
- **保持所有现有功能和行为不变**，仅改变代码组织

---

## Phase 4：生产加固

### 4.1 错误监控准备

- **`server.js`** 新增全局错误处理中间件，统一 JSON 错误响应格式
- 新增未捕获异常/拒绝处理日志

### 4.2 CI/CD 增强

- **`.github/workflows/deploy-jd.yml`**：新增 `lint` 和 `test` 步骤（在 build 前）
- 新增 `audit` 步骤（`npm audit --audit-level=high`）

### 4.3 开发体验

- **`vite.config.ts`** 新增 dev server proxy（`/api` → `localhost:3001`），消除跨域
- **`Dockerfile`** 添加 `.dockerignore` 已有，确认 `db.json` 不被打包（仅运行时挂载）

---

## 执行策略

- **L 级别串行执行**，按 Phase 顺序推进
- 每个 Phase 完成后做一次构建验证（`npm run build`）
- 重构阶段保持功能不变，通过对比重构前后的行为确认无回归
- 所有新增依赖安装后验证 `npm run build` + `npm test` 通过

---

## 风险控制

- bcrypt 迁移有兼容逻辑，老用户无感
- server.js 拆分后入口仍为 `server.js`（re-export），保证 `npm run server` 和 Dockerfile 不变
- DailyGenerator 拆分为渐进式，先提取纯函数和 hooks，再拆 UI
