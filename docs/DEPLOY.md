# 前端部署指南

推荐使用 Nginx 提供静态文件，并把 `/api/`、`/blog/` 和 `/media/` 转发到 Django 服务。这样前端无需写入生产 API 域名，也不会产生跨域问题。

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
        # /blog 同时承载 SPA 路由和公开 API；浏览器页面导航返回 index.html。
        if ($http_accept ~* "text/html") {
            rewrite ^ /index.html last;
        }
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /media/ {
        alias /srv/blog_li/media/;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

注意：`/blog/` 同时是前端路由和 API 前缀，因此必须按 `Accept: text/html` 区分页面导航与 XHR。上线前应实际验证文章详情刷新；长期建议将公开 API 迁移到 `/api/public/` 以彻底消除路径重叠。

## 3. 发布检查

- `npm run check` 全部通过
- `/blog`、文章详情和 `/login` 刷新不返回 404
- 登录、令牌刷新、退出流程正常
- `/assets/` 使用长期缓存，`index.html` 不使用长期缓存
- HTTPS、压缩、访问日志和错误日志已开启
- 与后端的 `CORS_ALLOWED_ORIGINS`、主机名和 Cookie 安全配置一致

回滚时保留上一版 `dist` 目录，通过原子切换软链接恢复，再 reload Nginx。
