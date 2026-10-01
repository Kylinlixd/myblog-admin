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
- 错误统一为 `{ status, code, message, fieldErrors }`，页面直接展示 `message`；网络错误 `code === 'NETWORK_ERROR'`。不要读取 `error.response`（拦截器抛出的 ApiError 上没有这个字段）。
- 公开 API 统一由 `api/blog.js` 生成 `/api/blog/.../` 路径，不提供静默模拟数据。

### 前后端契约要点（2026-10 联合审查后沉淀）

完整的形状表见 [API_REFERENCE](./API_REFERENCE.md)；改动请求/解析逻辑前先读一遍。核心规则：

1. **分页解析不要手写**：后端并存 `{total,items}`、`{list,total,page,pageSize}`、DRF `{count,results}`、裸数组四种形状，统一走 `api/collections.js` 的 `normalizeCollectionResponse` / `collectAllPages`。
2. **写操作必须过 `unwrapApiResponse`**：后端存在 `HTTP 200 + code != 200` 的业务失败（如分类删除），只看 HTTP 状态码会把失败当成功；`api/comment.js`、`api/dynamic.js` 是参照实现。
3. **管理端写操作后调用 `clearRequestCache()`**：公开页的「最新/热门/分类」有 30 秒缓存（`services/http/publicRequestCache.js`），不清会导致"改完公开页还是旧数据"。
4. **字段命名现状是 snake/camel 混用**（详见 API_REFERENCE 的字段命名现状一节）：优先复用 `searchFilters.js`、`api/file.js` 里已有的归一函数；给某接口新增消费字段时，先到后端 serializer 确认实际命名，再决定是否加 fallback。
5. **登录失败归因**：`stores/user.js` 只把 400/401 折叠成 `false`（凭证错误），其余异常向上抛；登录页不要把网络故障渲染成"用户名或密码错误"。

## 4. 页面与样式约定

- 全局视觉变量位于 `styles/theme.scss`，页面优先使用变量，不重复硬编码品牌色。
- 读取远程数据的页面必须处理 loading、empty、error 三种状态。
- 列表项优先复用 `ArticleCard.vue`，通用异步状态复用 `AsyncState.vue`。
- 保持键盘可访问性；仅图标按钮必须有 `aria-label`。
- 大型编辑器、Markdown 高亮等依赖只在对应路由加载。

### 文件中心

`views/files/FileList.vue` 是博客资源工作台，`FileTutorialDrawer.vue` 提供五步内置教程。新增行为需保持以下契约：

- 浏览器只调用 Django `/api/upload/`，不得访问 Xion 的 8081 端口或读取服务密钥。
- 单文件上限为 1 GB，上传进度由 `api/file.js` 的 `onProgress` 回调提供。
- 图片、音频、视频、PDF/Word/Excel/TXT 分别归类；未知类型归为 `other`。
- 列表同时兼容 `storage_backend=local` 和 `storage_backend=xion`，只使用 Django 返回的稳定 `file_url`。
- 删除失败时保留可重试状态；不要在前端假设底层对象已经消失。
- 桌面使用表格，移动端使用资源卡片；改动后至少检查 390px 和 1200px 视口。

教程更新时同步维护 `FileTutorialDrawer.spec.js`，确保上传、复制链接、插入文章、下载/删除、常见问题五个步骤仍完整。

## 5. 测试

测试文件与业务文件相邻放置在 `__tests__` 中，重点覆盖纯数据转换、请求契约、会话和可复用组件。

```bash
npm run test:ci
npm run test:coverage
npm run build
```

提交前执行 `npm run check`。构建成功仍出现大分包警告时，应先确认该依赖是否只在懒加载路由中使用，再决定拆分策略。

文件中心定向测试：

```bash
npm test -- --runInBand \
  src/api/__tests__/file.spec.js \
  src/views/files/__tests__/FileList.spec.js \
  src/views/files/__tests__/FileListMounted.spec.js \
  src/views/files/__tests__/FileTutorialDrawer.spec.js
```

## 6. 新增功能流程

1. 在 `api/` 增加最小 API 封装。
2. 将可测试的数据转换提取为纯函数并先写测试。
3. 页面使用现有设计变量和异步状态组件。
4. 添加路由及 `meta.title`、`requiresAuth`。
5. 执行 `npm run check`，再进行浏览器响应式检查。
