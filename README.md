<div align="center">

# ✍️ 时不语之间 · Kylin Blog

个人博客公开站点与内容管理端 —— 同一套 Vue 3 应用，`/blog` 公开阅读区 + `/dashboard` 管理工作台。

[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Pinia](https://img.shields.io/badge/Pinia-2-F7D336?logo=pinia&logoColor=white)](https://pinia.vuejs.org/)
[![Ant Design Vue](https://img.shields.io/badge/Ant%20Design%20Vue-4-1677FF)](https://antdv.com/)
[![Node](https://img.shields.io/badge/Node-20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![CI](https://img.shields.io/badge/CI-Deploy%20on%20push-2088FF?logo=githubactions&logoColor=white)](.github/workflows/deploy.yml)
[![License](https://img.shields.io/badge/License-MIT-C86F37)](#license)

**线上地址**：[https://leexd.top/](https://leexd.top/)

</div>

---

## ✨ 功能亮点

| 板块 | 说明 |
| --- | --- |
| 📖 公开博客 | 首页、文章列表与详情、分类、标签、搜索、评论 |
| 🧭 信息架构 | 此间（首页）/ 书遇（动态）/ 拾光（归档）/ 自叙（关于），品牌副标题 Silent Time |
| 📚 合集 | 拾光页合集板块 + 目录式合集页（`/blog/collections/:id`），数据由自动发布器按系列维护 |
| 🎨 正文版式 | 导语框、💡/⚠️/✅/🔥 提示块、对照表格与自动题图 |
| 🛠 管理工作台 | 内容、分类、标签、评论、文件管理；编辑页可直接新建分类/标签 |
| 🔐 账户 | JWT 登录、会话续期、资料/昵称/用户名/密码设置 |
| 🛡 风控 | 访问日志、设备识别、评论批量审核与违规内容拦截 |
| 📱 移动端 | 响应式管理布局、统一操作栏、稳定加载与空态设计 |
| 🧪 测试 | Jest 组件与业务单元测试 |

## 🚀 本地启动

要求 Node.js 20+，后端默认运行在 `http://127.0.0.1:8000`。

```bash
git clone https://github.com/Kylinlixd/myblog-admin.git
cd myblog-admin
npm ci
npm run dev
```

| 入口 | 地址 |
| --- | --- |
| 公开博客 | http://localhost:3000/blog |
| 管理后台 | http://localhost:3000/login |

> ⚠️ 管理后台只允许管理员账号登录，公开注册默认关闭。
> 首个账号在后端执行 `createsuperuser`，或由已有管理员通过受保护接口创建。

后端地址不同时，创建 `.env.local`：

```dotenv
VITE_DEV_API_TARGET=http://127.0.0.1:8000
```

## 🛠 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发 |
| `npm run test:ci` | 单次执行测试 |
| `npm run test:watch` | 监听测试 |
| `npm run build` | 生产构建 |
| `npm run check` | 测试 + 生产构建（提交前必跑） |
| `npm run preview` | 预览 dist |

## 📐 前后端契约速览

- 响应统一为 `{code, message, data}` 信封，但分页形状按模块分四种
  （`{total,items}` / `{list,total,…}` / DRF `{count,results}` / 裸数组），
  解析一律走 `src/api/collections.js`，不要手写解包。
- 字段命名 snake/camel 混用是历史现状：Category/Tag/评论为 camel，User/Stats/文件/日志为 snake，
  公开文章列表双写。新增消费字段前先查后端 serializer。
- 公开页「最新/热门/分类」有 30 秒缓存；管理端写操作成功后会调用 `clearRequestCache()` 失效它。
- 搜索接口只接受 `keyword/page/pageSize/sortBy/includeTags/includeCategories`，
  分类/标签/时间/多媒体筛选由 `views/blog/searchFilters.js` 本地完成。

详见 [开发指南 · 前后端契约要点](docs/DEV_GUIDE.md)。

## 📚 文档

| 文档 | 内容 |
| --- | --- |
| [开发指南](docs/DEV_GUIDE.md) | 本地开发约定 |
| [前端接口约定](docs/API_REFERENCE.md) | 接口清单与契约 |
| [部署指南](docs/DEPLOY.md) | 服务器与环境 |
| [交付记录](docs/DELIVERY_2026-07-27.md) | 历史交付说明 |
| [契约审查与修复记录](docs/implementation/2026-10-01-contract-review-fixes.md) | 前后端契约梳理 |

## 🔗 配套系统

后端仓库：[Kylinlixd/blog_li](https://github.com/Kylinlixd/blog_li) —— Django REST API、合集接口与 SEO 输出。
自动发布器（`/opt/blog_autopilot`，稿件在本仓库 `output/articles/`）负责按随机节奏发文、维护合集与配图。

## License

MIT
