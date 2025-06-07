# 部署文档

## 前端部署

### 1. 构建生产包
```bash
npm run build
# 或
yarn build
```
产物在 `dist/` 目录。

### 2. Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/myblog-admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /blog/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
重启 Nginx：
```bash
sudo nginx -s reload
```

### 3. 自动化部署脚本（可选）
可参考项目根目录的 `deploy.sh`，支持一键构建、备份、回滚。

---

## 后端部署

### 1. 环境准备
- Python >= 3.8
- MySQL 8.0+
- Redis（可选）
- 推荐使用虚拟环境

### 2. 安装依赖
```bash
pip install -r requirements.txt
```

### 3. 配置数据库
- 修改 `settings.py` 数据库配置
- 执行数据库迁移：
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. 创建超级用户
```bash
python manage.py createsuperuser
```

### 5. 启动服务（开发）
```bash
python manage.py runserver
```

### 6. 生产环境部署
- 推荐 Gunicorn + Nginx
- Gunicorn 启动示例：
```bash
gunicorn blog.wsgi:application -b 0.0.0.0:8000 --workers 3
```
- 配置 systemd 服务和 Nginx 反向代理

### 7. 常见问题
- 静态文件未加载：请执行 `python manage.py collectstatic`
- 数据库连接失败：检查配置和权限
- 权限/跨域问题：检查 CORS 和 JWT 配置

### 8. 生产环境建议
- 关闭 DEBUG
- 配置 ALLOWED_HOSTS
- 配置 HTTPS
- 定期备份数据库和静态文件 