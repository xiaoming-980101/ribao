# CHANGELOG

## [1.0.0] - 2026-07-09

### Added
- 引入 bcryptjs 对用户密码进行强哈希存储与验证。
- 添加速率限制 `express-rate-limit`，加固注册和登录接口。
- 新增认证中间件 `authMiddleware` 校验请求来源用户。
- 引入原子化数据库写入流程，通过临时文件机制避免故障数据损毁。
- 新增 ESLint 和 Prettier 代码风格校验体系。
- 引入 Vitest 单元测试框架，并针对核心逻辑补充测试覆盖。

### Changed
- 重构后端入口服务为模块化结构。
- 拆分前端大组件 `DailyGenerator.tsx`，提取公共 Hooks 与子组件。
- 迁移项目内的 `ssh2` 依赖到 `devDependencies`。
