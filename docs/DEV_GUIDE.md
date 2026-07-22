# 前端开发指南

## 1. 环境与启动

- Node.js 20+
- npm 10+
- 后端服务默认地址：`http://127.0.0.1:8000`

```bash
npm ci
npm run dev
```

Vite 同时代理 `/api`（管理端）与 `/blog`（公开端）。仅在本地后端地址不同时创建 `.env.local`：

```dotenv
VITE_DEV_API_TARGET=http://127.0.0.1:8000
```

不要提交令牌、密码或生产域名凭据。环境文件只保存非敏感构建配置。

## 2. 目录

```text
src/
├── api/                 # 按业务划分的 API 函数
├── components/          # 可复用界面组件
├── config/              # 菜单等静态配置
├── layouts/             # 博客与管理端布局
├── router/              # 路由和访问控制
├── services/http/       # Axios、令牌、错误标准化
├── stores/              # Pinia 状态
├── styles/              # 设计变量与全局样式
└── views/               # 路由页面
```

`main.js` 是唯一入口；公开站点和管理端共用请求基础设施，但使用不同的 URL 前缀。

## 3. 请求与会话约定

- 业务代码统一导入 `@/utils/request` 或 `@/services/http/client`，不要创建新的 Axios 实例。
- Access/Refresh Token 只能通过 `services/http/tokenStorage.js` 读写。
- 401 时请求层只执行一次并发刷新；刷新失败会清理会话并触发 `auth:expired`。
- 错误统一为 `{ status, code, message, details }`，页面直接展示 `message`。
- 公开 API 统一由 `api/blog.js` 生成 `/blog/.../` 路径，不提供静默模拟数据。

## 4. 页面与样式约定

- 全局视觉变量位于 `styles/theme.scss`，页面优先使用变量，不重复硬编码品牌色。
- 读取远程数据的页面必须处理 loading、empty、error 三种状态。
- 列表项优先复用 `ArticleCard.vue`，通用异步状态复用 `AsyncState.vue`。
- 保持键盘可访问性；仅图标按钮必须有 `aria-label`。
- 大型编辑器、Markdown 高亮等依赖只在对应路由加载。

## 5. 测试

测试文件与业务文件相邻放置在 `__tests__` 中，重点覆盖纯数据转换、请求契约、会话和可复用组件。

```bash
npm run test:ci
npm run test:coverage
npm run build
```

提交前执行 `npm run check`。构建成功仍出现大分包警告时，应先确认该依赖是否只在懒加载路由中使用，再决定拆分策略。

## 6. 新增功能流程

1. 在 `api/` 增加最小 API 封装。
2. 将可测试的数据转换提取为纯函数并先写测试。
3. 页面使用现有设计变量和异步状态组件。
4. 添加路由及 `meta.title`、`requiresAuth`。
5. 执行 `npm run check`，再进行浏览器响应式检查。
