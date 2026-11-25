# syntax=docker/dockerfile:1

# ---------- 构建阶段：装依赖 + 打包静态文件 ----------
FROM node:22-alpine AS build

WORKDIR /app

# 先只拷依赖清单，命中缓存后改业务代码不会重装 node_modules
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- 运行阶段：只留 Nginx + 静态产物 ----------
FROM nginx:alpine AS runtime

# 覆盖镜像自带站点，换成我们的静态托管 + 反代配置
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q --spider http://127.0.0.1/ || exit 1

STOPSIGNAL SIGQUIT
