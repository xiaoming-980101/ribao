# =================阶段一：前端静态资源构建=================
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖配置并安装
COPY package*.json ./
RUN npm install

# 复制源码并构建前端静态资源 (产出 dist 目录)
COPY . .
RUN npm run build

# =================阶段二：极轻量运行环境=================
FROM node:20-alpine AS runner

WORKDIR /app

# 仅拷贝后端运行所需的依赖配置
COPY package*.json ./
RUN npm install --omit=dev

# 从构建阶段拷贝前端静态产物
COPY --from=builder /app/dist ./dist

# 拷贝后端服务文件
COPY server.js ./

# 暴露服务端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production

# 启动后端服务 (同时托管了静态前端 dist)
CMD ["node", "server.js"]
