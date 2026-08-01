# LiXD Studio · Kylin Blog

个人博客公开站点与内容管理端。项目使用 Vue 3、Vite、Pinia 和 Ant Design Vue，同一套应用提供 `/blog` 公开阅读区与 `/dashboard` 管理工作台。

线上地址：https://leexd.top/

## 功能

- 博客首页、文章列表与详情、分类、标签、搜索和评论
- JWT 登录、会话续期与统一错误处理
- 内容、分类、标签、评论和文件管理
- 内容编辑页可直接新建分类和标签，并自动选中新建项
- 响应式管理布局、稳定加载动画、空数据和错误状态
- 访问日志、设备识别、评论批量审核与违规内容拦截
- 账户资料、昵称简介、用户名和密码设置
- 移动端内容列表、统一操作栏和工作区顶部导航
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

管理后台只允许已创建的管理员账号登录，公开注册默认关闭。首次创建账号请在后端执行 `createsuperuser`，或由已有管理员通过受保护接口创建。

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

提交前建议执行：

```bash
npm run check        # Jest 单测 + Vite 生产构建
```

## 文档

- [开发指南](docs/DEV_GUIDE.md)
- [前端接口约定](docs/API_REFERENCE.md)
- [部署指南](docs/DEPLOY.md)
- [交付记录](docs/DELIVERY_2026-07-27.md)

后端仓库：[Kylinlixd/blog_li](https://github.com/Kylinlixd/blog_li)

## License

MIT
