FROM node:20-alpine

WORKDIR /app

# 仅拷贝后端依赖并安装
COPY package*.json ./
RUN npm install --omit=dev

# 直接拷贝本地打包好的静态资源 dist 和后端服务
COPY dist ./dist
COPY server.js ./

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "server.js"]
