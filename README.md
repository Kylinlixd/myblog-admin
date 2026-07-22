# Kylin Blog Web

个人博客的公开站点与内容管理端。项目使用 Vue 3、Vite、Pinia 和 Ant Design Vue，同一套应用提供 `/blog` 公开阅读区与 `/dashboard` 管理工作台。

## 功能

- 博客首页、文章列表与详情、分类、标签、搜索和评论
- JWT 登录、会话续期与统一错误处理
- 内容、分类、标签、评论和文件管理
- 响应式管理布局、加载/空数据/错误状态
- Jest 组件与业务单元测试

## 本地启动

要求 Node.js 20+，后端默认运行在 `http://127.0.0.1:8000`。

```bash
git clone https://github.com/Kylinlixd/myblog-admin.git
cd myblog-admin
npm ci
npm run dev
```

访问：

- 公开博客：`http://localhost:3000/blog`
- 管理后台：`http://localhost:3000/login`

如后端地址不同，创建 `.env.local`：

```dotenv
VITE_DEV_API_TARGET=http://127.0.0.1:8000
```

## 常用命令

```bash
npm run dev          # 本地开发
npm run test:ci      # 单次执行测试
npm run test:watch   # 监听测试
npm run build        # 生产构建
npm run check        # 测试 + 生产构建
npm run preview      # 预览 dist
```

## 文档

- [开发指南](docs/DEV_GUIDE.md)
- [前端接口约定](docs/API_REFERENCE.md)
- [部署指南](docs/DEPLOY.md)

后端仓库：[Kylinlixd/blog_li](https://github.com/Kylinlixd/blog_li)

## License

MIT
