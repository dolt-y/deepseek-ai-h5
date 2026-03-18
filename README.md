# 项目重制说明 

- 2026-2-28项目迁移目标: 为了更好的统一前后端开发及Vibe Coding协作方式，将项目重制为monorepo模式。

## 一、项目定位
一个 H5/小程序通用的 AI 对话系统，包含：
- 前端：Vue 3 + Vite 的 H5 聊天界面
- 后端：Express + SQLite 的 AI 服务接口

## 二、当前仓库结构
- `wechat-ai-fontend/`：H5 前端（Vite + Vue 3）
- `wechat-ai-backend/`：Node.js 后端（Express + SQLite）
- `plan/`：迭代需求与发布文档规范
- `AGENTS.md`：协作与运行说明

## 三、运行方式（Monorepo）
根目录一次性安装依赖：
```bash
npm install
```

启动前后端：
```bash
npm run dev:all
```

单独启动：
```bash
npm run dev:frontend
npm run dev:backend
```

## 四、环境变量
后端（`wechat-ai-backend/.env`）：
- `JWT_SECRET`
- `DB_FILE`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `WX_APP_ID` / `WX_APP_SECRET`（可选）
- `WHISPER_ROOT` / `WHISPER_SAMPLE_PATH`（可选）
- `PORT`

前端（`wechat-ai-fontend/.env.development` 或 `.env.local`）：
- `VITE_OPENAI_BASE_URL=http://localhost:3000`

## 五、主要能力（现状对齐）
- JWT 登录与鉴权（支持 H5 账号登录）
- 对话接口（SSE 流式回复）
- 会话列表与历史记录
- 消息点赞与重新生成
- 图片上传与存储（聊天消息支持图片 URL 持久化）
- 语音识别（whisper.cpp）
- Swagger API 文档（`/docs`）

## 六、已知限制
- 未配置自动化测试与 CI。
- 前后端仍需各自维护环境配置与启动方式。

## 七、文档入口
- 后端统一文档：`wechat-ai-backend/README.md`
- 前端说明：`wechat-ai-fontend/README.md`
- 迭代规范：`plan/README.md`

## 八、whisper.cpp 本地模型编译说明
后端语音识别依赖 `whisper.cpp` 本地可执行程序，建议在 `wechat-ai-backend` 目录下执行：

```bash
cd wechat-ai-backend
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
```

下载需要的模型（如 `tiny` / `base` / `small`）：

```bash
bash ./models/download-ggml-model.sh tiny
```

使用 CMake 编译：

```bash
mkdir build
cd build
cmake ..
make -j4
```

编译完成后会生成 `build/bin/whisper-cli`，模型位于 `models/ggml-*.bin`。  
若按默认配置运行后端，无需额外设置 `WHISPER_ROOT`；如放在其他目录，请在后端 `.env` 中显式配置 `WHISPER_ROOT`。

# 线上nginx 配置

```js
server {
    listen 80;
    server_name 8.145.57.251;   # 如果有域名，替换成你的域名

    root /www/wwwroot/your-h5-dist;  # 改成你的 dist 目录
    index index.html;

    # Vue 单页应用
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE 关键配置
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
        add_header X-Accel-Buffering no;
    }

    # 上传文件访问
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }

    # Swagger（可选）
    location /docs {
        proxy_pass http://127.0.0.1:3000;
    }
    location = /docs.json {
        proxy_pass http://127.0.0.1:3000;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 7d;
        access_log off;
    }
}
```

##  线上体验地址:http://8.145.57.251