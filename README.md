# Time Line Web

一个基于 React + Node.js 的照片管理项目骨架，重点支持“时间线聚合”浏览。

## 项目结构

- `apps/web`: React 前端（Vite）
- `apps/server`: Node.js 后端（Express）
- `packages/shared`: 前后端共享类型

## 核心功能骨架

- 照片基础能力：新增、删除、列表
- 时间线能力：按 `year / month / week` 聚合并返回分组
- MongoDB 持久化：后端使用 Mongoose 存储照片数据
- 图片上传能力：支持本地磁盘存储并通过 `/uploads/*` 访问
- EXIF 自动解析：拍摄时间未手动填写时，后端自动从图片 EXIF 读取
- 去重能力：按图片内容哈希去重，重复图片会返回 `409`
- 标题可选：创建照片时标题可留空，前端统一展示为“未命名照片”
- 首次启动自动写入几条示例照片（仅在空库时）

## 快速开始

```bash
npm install
npm run dev
```

在启动前请确保本地 MongoDB 可用（默认连接 `mongodb://127.0.0.1:27017`）。
可选：在 `apps/server` 下创建 `.env`（参考 `.env.example`）。
可选：`SEED_ON_START=true|false` 控制是否在空库自动写入示例数据（默认 `false`）。

默认端口：

- Web: `http://localhost:5174`
- Server: `http://localhost:4000`

## Docker 部署

项目已提供容器化文件：

- `Dockerfile.server`: Node.js + MongoDB 客户端的后端镜像
- `Dockerfile.web`: 前端构建后由 Nginx 托管
- `docker/nginx/web.conf`: Web 容器内反向代理 `/api` 到后端
- `docker-compose.yml`: 一键启动 `web + server + mongo`

启动：

```bash
docker compose up -d --build
```

如果你的 Docker 版本不支持 `docker compose` 子命令，请先升级 Docker Desktop（新版本默认支持）。

访问：

- Web: `http://localhost:8080`
- API: `http://localhost:4000`

停止：

```bash
docker compose down
```

如果要连同数据卷一起删除：

```bash
docker compose down -v
```

## API 简要

- `GET /api/photos`: 获取照片列表，可按阶段/标签/时间过滤
- `GET /api/photos/:id`: 获取照片详情
- `POST /api/photos`: 新增照片
- `DELETE /api/photos/:id`: 删除照片
- `GET /api/timeline?granularity=month`: 获取时间线分组
- `POST /api/uploads`: 上传图片文件（`multipart/form-data`, 字段名 `files`）
- `DELETE /api/uploads/:filename`: 删除已上传但未入库的图片文件（用于失败回滚）

本地上传文件会保存到 `apps/server/uploads` 目录。

## 批量导入本地目录图片

如果你有大量历史图片，不需要一张一张上传，可以直接批量导入：

```bash
npm run import:photos -- --dir /Users/yourname/Pictures
```

说明：

- 脚本会递归扫描目录中的常见图片格式（jpg/jpeg/png/webp/heic/heif/avif/tif/tiff）。
- 文件会复制到 `apps/server/uploads`，并写入 MongoDB。
- 拍摄时间会自动从 EXIF 解析；如果解析不到，自动使用导入当下时间。
- 标题默认留空（前端显示“未命名照片”），可通过参数启用文件名作为标题。

常用参数：

```bash
# 仅扫描预览，不落盘不入库
npm run import:photos -- --dir /Users/yourname/Pictures --dry-run

# 不递归子目录
npm run import:photos -- --dir /Users/yourname/Pictures --no-recursive

# 批量附加阶段、标签、权限
npm run import:photos -- --dir /Users/yourname/Pictures --stage "家庭相册" --tags "家人,旅行" --privacy family

# 使用文件名作为标题
npm run import:photos -- --dir /Users/yourname/Pictures --use-filename-title
```

## 清空当前数据（准备导入真实数据）

会删除 MongoDB 中所有照片记录，并清理本地上传目录：

```bash
npm run reset:data
```

## 按拍摄月份补齐默认分组

会把 `stage` 为空的照片回填为 `YYYY.MM`（按 `capturedAt` 计算）：

```bash
npm run backfill:stage-month
```

## 回填内容哈希（用于旧数据去重）

为历史照片补齐 `contentHash`，让后续去重能覆盖旧数据：

```bash
npm run backfill:content-hash
```

## 后续建议

1. 接入对象存储（S3/OSS）用于图片上传与缩略图。
2. 加入用户系统与权限隔离。
3. 增加 AI 标签、地点识别、相册自动归档。
4. 为照片上传链路增加对象存储签名上传（目前仍使用 URL 字段）。
