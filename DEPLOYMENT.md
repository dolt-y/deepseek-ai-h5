# Docker 部署文档

本文档记录本项目在 Linux 服务器上的 Docker 部署流程。当前项目为前后端同仓库：

- 前端：`ui/`，Vue 3 + Vite，生产环境构建后由 Nginx 提供静态文件服务。
- 后端：`backend/`，Node.js + Express，默认监听容器内部 `3000` 端口。
- 数据库：SQLite，生产环境数据库文件保存在 Docker volume。
- 队列/缓存：Redis 容器，供限流和 BullMQ 使用。

## 部署架构

```text
公网用户
  -> 服务器:8080
  -> frontend 容器 Nginx:80
  -> /api 反向代理到 backend 容器:3000
  -> backend 使用 Redis 容器和 SQLite volume
```

默认情况下，只有前端容器的 `8080` 端口暴露给公网。后端 `3000`、Redis `6379` 只在 Docker 内部网络访问。

## Ubuntu 部署流程

以下流程适用于 Ubuntu 服务器。实际部署时，本项目已在 Ubuntu 环境验证通过。

### 1. 安装基础工具

```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-v2
```

检查 Docker 和 Compose：

```bash
docker --version
docker compose version
```

如果 `docker compose version` 不可用，可以尝试：

```bash
sudo apt install -y docker-compose-plugin
docker compose version
```

如果当前用户没有 Docker 权限，可以临时使用 `sudo`：

```bash
sudo docker compose version
```

也可以把当前用户加入 `docker` 用户组：

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 2. 拉取项目

```bash
git clone <你的仓库地址> deepseek-ai-h5
cd deepseek-ai-h5
```

如果已经拉取过项目：

```bash
cd ~/deepseek-ai-h5
git pull
```

### 3. 配置环境变量

复制环境变量模板：

```bash
cp docker.env.example docker.env
nano docker.env
```

生产环境建议至少配置：

```env
JWT_SECRET=换成一串足够长的随机字符串

OPENAI_API_KEY=你的AI接口KEY
OPENAI_BASE_URL=你的AI接口BaseURL

WX_APP_ID=你的微信APPID
WX_APP_SECRET=你的微信密钥

SWAGGER_SERVER_URL=http://你的服务器IP:8080
CORS_ORIGIN=*
```

可选限流和后台任务配置：

```env
LOGIN_RATE_LIMIT_WINDOW_MS=600000
LOGIN_RATE_LIMIT_MAX=20
AI_RATE_LIMIT_WINDOW_MS=60000
AI_RATE_LIMIT_MAX=60
SPEECH_RATE_LIMIT_WINDOW_MS=3600000
SPEECH_RATE_LIMIT_MAX=30

CLEANUP_UPLOADS_EVERY_MS=3600000
UPLOAD_FILE_MAX_AGE_MS=86400000
SPEECH_WORKER_CONCURRENCY=1
```

以下变量由 `docker-compose.yml` 注入，通常不需要写进 `docker.env`：

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
DB_FILE=/app/data/wechat-mini.db
REDIS_URL=redis://redis:6379
WHISPER_ROOT=/app/whisper.cpp
```

前端 `VITE_OPENAI_BASE_URL` 在 Docker 生产部署中默认为空，表示前端请求同域 `/api`，再由 Nginx 转发到后端。

### 4. 构建并启动

```bash
docker compose up -d --build
```

如果当前环境只支持旧版 Compose 命令：

```bash
docker-compose up -d --build
```

启动后检查容器：

```bash
docker compose ps
```

正常情况下会看到：

```text
frontend   0.0.0.0:8080->80/tcp
backend    3000/tcp
redis      6379/tcp
```

其中 `frontend` 暴露到公网，`backend` 和 `redis` 只在 Docker 内部网络访问。

### 5. 访问服务

前端地址：

```text
http://你的服务器IP:8080
```

Swagger 文档：

```text
http://你的服务器IP:8080/docs
```

接口 JSON：

```text
http://你的服务器IP:8080/docs.json
```

如果浏览器无法访问，检查云服务器安全组或防火墙是否放行 `8080` 端口。

## 端口说明

`docker-compose.yml` 中前端端口配置如下：

```yaml
frontend:
  ports:
    - "8080:80"
```

含义是：

```text
服务器公网 8080 端口 -> frontend 容器内部 80 端口
```

后端配置：

```yaml
backend:
  environment:
    PORT: 3000
```

后端没有配置 `ports` 映射，因此 `3000` 端口只在 Docker 内部网络可访问。

如果希望使用默认 HTTP 端口访问前端，可以把前端端口改为：

```yaml
ports:
  - "80:80"
```

然后重新启动：

```bash
docker compose up -d
```

访问地址变为：

```text
http://你的服务器IP
```

## 常用运维命令

查看容器状态：

```bash
docker compose ps
```

查看后端日志：

```bash
docker compose logs --tail=100 backend
docker compose logs -f backend
```

查看前端日志：

```bash
docker compose logs --tail=100 frontend
docker compose logs -f frontend
```

重启所有服务：

```bash
docker compose restart
```

停止服务但保留数据：

```bash
docker compose down
```

更新代码并重新部署：

```bash
git pull
docker compose up -d --build
```

启用 BullMQ worker：

```bash
docker compose --profile worker up -d --build
```

## 数据持久化

生产环境 SQLite 文件配置为：

```text
/app/data/wechat-mini.db
```

该路径挂载到 Docker volume：

```text
backend_data
```

上传文件、临时文件和 Redis 数据也使用 Docker volume 保存：

```text
backend_uploads
backend_temp
redis_data
```

不要随意执行：

```bash
docker compose down -v
```

该命令会删除 volume，可能导致 SQLite 数据、上传文件和 Redis 数据丢失。

## 国内服务器构建慢处理

如果构建卡在后端 Dockerfile 的 `apt-get update` 或 `apt-get install`，可以把 Debian 官方源切换为云厂商镜像源。

腾讯云服务器可在 `Dockerfile.backend` 中使用：

```dockerfile
RUN sed -i 's|http://deb.debian.org/debian|http://mirrors.tencentyun.com/debian|g; s|http://deb.debian.org/debian-security|http://mirrors.tencentyun.com/debian-security|g' /etc/apt/sources.list.d/debian.sources \
  && apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*
```

然后重新构建：

```bash
docker compose up -d --build
```

如果构建卡在 npm 依赖下载，可考虑在 Dockerfile 中配置 npm 镜像源，或在网络稳定后重新执行构建。

## 其他 Linux 系统

### Debian

```bash
sudo apt update
sudo apt install -y git ca-certificates curl docker.io docker-compose-v2
sudo systemctl enable --now docker
docker compose version
```

### CentOS / RHEL / Rocky Linux / AlmaLinux

```bash
sudo dnf install -y git dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
docker compose version
```

如果系统使用 `yum`：

```bash
sudo yum install -y git yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
docker compose version
```

### Fedora

```bash
sudo dnf install -y git dnf-plugins-core
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
docker compose version
```

如果官方 Docker 源访问不稳定，可以优先使用系统源提供的 Docker 和 Compose 包；只要最终能正常执行 `docker compose version` 即可。

## 排障

### `unknown shorthand flag: 'd' in -d`

说明当前环境没有可用的 Docker Compose v2。先检查：

```bash
docker compose version
docker-compose version
```

如果 `docker-compose` 可用，可以使用旧命令：

```bash
docker-compose up -d --build
```

否则安装 Compose v2：

```bash
sudo apt install -y docker-compose-v2
```

### 访问不到页面

检查容器：

```bash
docker compose ps
```

检查前端端口映射是否存在：

```text
0.0.0.0:8080->80/tcp
```

检查云服务器安全组或防火墙是否放行 `8080`。

### 后端接口异常

查看后端日志：

```bash
docker compose logs --tail=100 backend
```

检查后端容器环境变量：

```bash
docker compose exec backend printenv | grep -E 'NODE_ENV|PORT|DB_FILE|REDIS_URL|OPENAI_BASE_URL|WX_APP_ID|SWAGGER_SERVER_URL'
```

不要把包含 `OPENAI_API_KEY`、`JWT_SECRET`、`WX_APP_SECRET` 的输出发送到公开环境。

### 重新构建仍然使用旧配置

执行：

```bash
docker compose up -d --build
```

如果改了前端构建参数，必须重新构建前端镜像，因为 Vite 环境变量在构建阶段写入产物。

