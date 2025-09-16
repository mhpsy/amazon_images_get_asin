# 构建阶段
FROM node:20-bullseye-slim as builder

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制package文件
COPY package.json pnpm-lock.yaml ./

# 安装所有依赖（包含devDependencies用于构建）
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 生产运行阶段
FROM node:20-bullseye-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖（Playwright需要）
RUN apt-get update && apt-get install -y \
    # Playwright dependencies
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    libatspi2.0-0 \
    libgtk-3-0 \
    # 添加curl用于健康检查
    curl \
    # 清理缓存
    && rm -rf /var/lib/apt/lists/*

# 安装pnpm
RUN npm install -g pnpm

# 复制package文件并仅安装生产依赖
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod && pnpm store prune

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 创建必要的目录
RUN mkdir -p temp/screenshot logs

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8000
ENV HOST=0.0.0.0

# 暴露端口
EXPOSE 8000

# 添加健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# 创建非root用户
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# 启动应用
CMD ["node", "dist/index.mjs"]
