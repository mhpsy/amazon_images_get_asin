# Docker 部署指南

本项目已添加完整的Docker支持，可以轻松地在容器中运行Amazon图片处理API服务。

## 快速开始

### 1. 构建Docker镜像

```bash
# 使用npm脚本构建
npm run docker:build

# 或直接使用docker命令
docker build -t amazon-image-asin .
```

### 2. 运行容器

```bash
# 使用npm脚本运行
npm run docker:run

# 或直接使用docker命令
docker run -p 8000:8000 amazon-image-asin
```

### 3. 使用Docker Compose

```bash
# 启动生产环境
docker-compose up -d

# 启动开发环境
docker-compose --profile dev up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 环境配置

### 生产环境

- **端口**: 8000
- **健康检查**: `/health` 接口
- **日志**: 持久化到 `./logs` 目录
- **临时文件**: 持久化到 `./temp` 目录

### 开发环境

- **端口**: 8001 (避免与生产环境冲突)
- **热重载**: 支持源代码修改自动重启
- **调试**: 完整的开发工具链

## 可用命令

### 构建和运行

```bash
# 构建镜像
npm run docker:build

# 运行生产容器
npm run docker:run

# 运行开发容器
npm run docker:dev
```

### Docker Compose

```bash
# 生产环境
docker-compose up -d app
docker-compose down

# 开发环境
docker-compose --profile dev up -d app-dev
docker-compose --profile dev down

# 查看状态
docker-compose ps
docker-compose logs app
```

## 健康检查

容器包含内置的健康检查：

- **检查间隔**: 30秒
- **超时时间**: 10秒
- **重试次数**: 3次
- **启动等待**: 40秒

健康检查通过访问 `http://localhost:8000/health` 接口来验证服务状态。

## 环境变量

可以通过环境变量自定义配置：

```bash
docker run -p 8000:8000 \
  -e NODE_ENV=production \
  -e PORT=8000 \
  -e HOST=0.0.0.0 \
  amazon-image-asin
```

## 数据持久化

### 生产环境持久化目录

- `./logs` → `/app/logs` - 应用日志
- `./temp` → `/app/temp` - 临时文件和截图

### 开发环境额外挂载

- `.` → `/app` - 源代码（支持热重载）
- 排除 `/app/node_modules` - 使用容器内的依赖

## 镜像优化

### 多阶段构建

Dockerfile 使用多阶段构建：

1. **base**: 基础环境和依赖安装
2. **development**: 开发环境配置
3. **production**: 生产环境构建和优化

### 安全性

- 使用非root用户运行应用
- 最小化镜像体积
- 只包含必要的运行时依赖

## 故障排除

### 查看容器日志

```bash
# Docker直接运行
docker logs <container_id>

# Docker Compose
docker-compose logs app
```

### 进入容器调试

```bash
# Docker直接运行
docker exec -it <container_id> /bin/bash

# Docker Compose
docker-compose exec app /bin/bash
```

### 常见问题

1. **端口冲突**: 确保端口8000未被其他服务占用
2. **权限问题**: 确保挂载目录有正确的读写权限
3. **Playwright依赖**: 镜像已包含所有必要的系统依赖

## 生产部署建议

1. **资源限制**: 建议设置内存和CPU限制
2. **日志轮转**: 配置日志轮转避免磁盘空间问题
3. **监控**: 集成健康检查到你的监控系统
4. **备份**: 定期备份持久化数据

```bash
# 带资源限制的运行示例
docker run -d \
  --name amazon-image-api \
  --memory=2g \
  --cpus=1.0 \
  -p 8000:8000 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/temp:/app/temp \
  --restart=unless-stopped \
  amazon-image-asin
```
