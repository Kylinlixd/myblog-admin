# 前端部署指南

推荐使用 Nginx 提供静态文件，并把 `/api/` 和 `/media/` 转发到 Django 服务。公开博客 API 统一在 `/api/blog/`，`/blog/` 仅作为前端 SPA 路由。这样前端无需写入生产 API 域名，也不会产生跨域问题。

## 1. 构建

```bash
npm ci
npm run check
```

产物位于 `dist/`。不要直接用 `vite preview` 承载生产流量。

## 2. Nginx 示例

```nginx
server {
    listen 443 ssl http2;
    server_name blog.example.com;

    root /srv/myblog-admin/dist;
    index index.html;

    location /assets/ {
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /blog/ {
        try_files $uri $uri/ /index.html;
    }

    location /media/ {
        alias /srv/blog_li/media/;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

注意：公开 API 已统一迁移到 `/api/blog/`，`/blog/` 不再代理到 Django，避免前端路由与 API 前缀重叠。上线前应实际验证文章详情刷新。

## 3. 发布检查

- `npm run check` 全部通过
- `/blog`、文章详情和 `/login` 刷新不返回 404
- 登录、令牌刷新、退出流程正常
- `/assets/` 使用长期缓存，`index.html` 不使用长期缓存
- HTTPS、压缩、访问日志和错误日志已开启
- 与后端的 `CORS_ALLOWED_ORIGINS`、主机名和 Cookie 安全配置一致
- 管理端文件中心能打开“使用教程”，桌面和 390px 移动布局无横向溢出
- PNG、PDF、DOCX、TXT 上传显示进度并被正确分类，下载保留原文件名
- 新文件显示 Xion 存储状态，历史 `/media/` 文件仍可预览或下载

前端不需要、也禁止配置 `XION_SERVICE_TOKEN` 或 Xion 内部地址。存储开关与服务端凭据全部由 Django 生产环境管理。

## 4. 原子发布

为每次构建创建独立目录，再切换 `current` 软链接：

```bash
release="/var/www/myblog-admin/releases/<commit>"
sudo mkdir -p "$release"
sudo tar -xzf myblog-admin-dist.tar.gz -C "$release"
sudo ln -sfn "$release" /var/www/myblog-admin/current
sudo nginx -t
sudo systemctl reload nginx
```

至少保留上一 release。回滚只需把 `current` 指回旧目录并再次执行 `nginx -t` 与 reload；不要在回滚时删除博客媒体或 Xion 数据。

回滚时保留上一版 `dist` 目录，通过原子切换软链接恢复，再 reload Nginx。
