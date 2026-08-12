# 页面加载性能优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 降低博客前台与管理后台的首屏 JavaScript、重复请求和静态资源传输开销，同时保持现有登录、编辑、上传、发布和路由行为不变。

**Architecture:** 管理后台使用按模板自动导入替代全量 Ant Design 全局注册，保留路由懒加载；博客前台在公开 GET 请求层增加短时内存去重/缓存，并把首页非首屏热门数据延后到浏览器空闲时间；两端使用稳定 vendor 拆分，线上 Nginx 对文本资源启用 gzip 并继续使用 hash 资源和严格 `/assets/` 404 规则。

**Tech Stack:** Vue 3、React 19、Vite、Ant Design Vue、React Router、Vitest、Jest、Nginx、Chrome DevTools Protocol。

---

## 基线与验收指标

当前本地生产构建基线：

- `blog-web`：入口 JS 271.05 kB，gzip 85.70 kB；React chunk 122.94 kB，gzip 40.22 kB。
- `blog-admin`：Ant Design chunk 990.34 kB，gzip 296.23 kB；编辑器路由 chunk 784.08 kB，gzip 257.98 kB。

验收标准：

- 博客首页不加载管理后台、编辑器和文章详情业务 chunk。
- 管理后台总览不加载编辑器、文件预览和评论管理业务 chunk。
- 相同公开 GET 请求在 30 秒窗口内只发出一次，显式变更操作不进入缓存。
- 图片保持异步解码和懒加载；首屏主视觉保持高优先级。
- 文本资源线上响应带 gzip，hash 资源仍为长期缓存，HTML 不使用 immutable。
- 两个前端项目测试、生产构建和关键浏览器路由均通过。

### Task 1: 建立性能测试边界

**Files:**
- Modify: `/Users/leexd/Documents/ChatGPT/blog-web/src/lib/__tests__/api.test.ts`
- Create: `/Users/leexd/Documents/ChatGPT/blog-web/src/features/public/__tests__/PublicHomePerformance.test.tsx`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/__tests__/assetDeployment.spec.js`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/ops/nginx/myblog-admin.conf`

- [ ] **Step 1: 写失败测试，锁定请求去重和首页延后请求**

在 `api.test.ts` 增加以下测试：

```ts
it('deduplicates identical public GET requests during the cache window', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ code: 200, message: 'success', data: [] }), { status: 200 }),
  );

  await Promise.all([api.public.categories(), api.public.categories()]);

  expect(fetchMock).toHaveBeenCalledTimes(1);
});
```

在首页性能测试中 mock 四个公开接口，断言首次渲染只等待 `recent`、`categories`、`tags`，`hot` 在 idle 回调执行后才调用。在后台资源测试中断言 Nginx 配置包含 `gzip on;`、`gzip_comp_level 5;`、`gzip_types` 和 `application/javascript`。

- [ ] **Step 2: 运行测试确认先失败**

```bash
cd /Users/leexd/Documents/ChatGPT/blog-web
npm test -- --run src/lib/__tests__/api.test.ts src/features/public/__tests__/PublicHomePerformance.test.tsx
cd /Users/leexd/Documents/ChatGPT/blog-admin
npm test -- --runInBand src/__tests__/assetDeployment.spec.js
```

预期：缓存测试、首页延后请求测试和 gzip 配置测试失败；不得修改测试绕过失败。

### Task 2: 管理后台按需加载 Ant Design Vue

**Files:**
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/package.json`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/package-lock.json`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/vite.config.js`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/main.js`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/config/antComponents.js`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/config/__tests__/antComponents.spec.js`

- [ ] **Step 1: 安装自动导入插件**

```bash
cd /Users/leexd/Documents/ChatGPT/blog-admin
npm install -D unplugin-vue-components
```

- [ ] **Step 2: 配置按模板导入并移除运行时全量注册**

在 `vite.config.js` 引入 `Components` 和 `AntDesignVueResolver`，并把插件配置为：

```js
Components({
  resolvers: [AntDesignVueResolver({ importStyle: false })]
})
```

删除 `main.js` 对 `registerAntComponents` 的导入和调用；保留 `ant-design-vue/dist/reset.css` 全局基础样式。删除 `antComponents` 数组和运行时注册函数，测试改为检查 Vite 配置包含自动导入 resolver，并继续检查 `App.vue` 的中文分页 locale。

- [ ] **Step 3: 验证后台构建体积**

```bash
cd /Users/leexd/Documents/ChatGPT/blog-admin
npm test -- --runInBand src/config/__tests__/antComponents.spec.js
npm run build 2>&1 | tee /tmp/blog-admin-build-after-components.log
```

预期：测试和构建通过；总览首屏不再强制加载全部后台组件，`DynamicEdit` 仍为路由懒加载 chunk。

### Task 3: 博客前台请求去重和首屏请求调整

**Files:**
- Create: `/Users/leexd/Documents/ChatGPT/blog-web/src/lib/request-cache.ts`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-web/src/lib/api.ts`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-web/src/features/public/PublicHome.tsx`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-web/src/features/public/ArticlePage.tsx`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-web/src/lib/__tests__/api.test.ts`
- Create: `/Users/leexd/Documents/ChatGPT/blog-web/src/features/public/__tests__/PublicHomePerformance.test.tsx`

- [ ] **Step 1: 创建公开 GET 短时缓存模块**

创建 `request-cache.ts`，使用 `Map<string, { expiresAt: number; promise: Promise<unknown> }>`，导出：

```ts
export function cachedRequest<T>(key: string, loader: () => Promise<T>, ttl = 30_000): Promise<T>;
export function clearRequestCache(prefix?: string): void;
```

并发命中时复用同一个 Promise；请求失败时删除对应项；不传前缀清空全部缓存，传前缀只清理匹配项。

- [ ] **Step 2: 只缓存公开 GET，不缓存写操作**

在 `api.ts` 将现有 fetch/401 处理抽为 `performRequest`；`request` 仅在 method 为 GET、路径以 `/blog/` 开头且无 body 时调用 `cachedRequest`。管理 API、登录、点赞、浏览量、评论提交和上传不进入缓存。保留公开接口不附带旧管理 Token 的行为。

- [ ] **Step 3: 首页先加载首屏数据，热门数据空闲加载**

`PublicHome` 首次只等待 `recent`、`categories`、`tags`；设置首屏内容后，使用 `requestIdleCallback`，不支持时使用 250ms `setTimeout`，再请求 `hot`。组件卸载时取消 idle 回调。热门数据失败只影响热门卡片，不阻塞首页。

- [ ] **Step 4: 没有真实媒体时使用本地回退图**

`PublicHome.tsx` 和 `ArticlePage.tsx` 无真实媒体时返回 `/editorial-fallback.svg`，删除对 `picsum.photos` 的依赖。保留当前媒体 lazy/eager、`fetchPriority`、`decoding` 和失败回退行为。

- [ ] **Step 5: 运行前台测试和构建**

```bash
cd /Users/leexd/Documents/ChatGPT/blog-web
npm test -- --run src/lib/__tests__/api.test.ts src/features/public/__tests__/PublicHomePerformance.test.tsx
npm run build
```

预期：新增测试通过，构建成功，首页业务 chunk 不包含编辑器和后台模块。

### Task 4: 双端稳定拆包和 Nginx 压缩

**Files:**
- Modify: `/Users/leexd/Documents/ChatGPT/blog-web/vite.config.ts`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/vite.config.js`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/ops/nginx/myblog-admin.conf`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/__tests__/assetDeployment.spec.js`

- [ ] **Step 1: 配置博客前台稳定 vendor 拆分**

在 `blog-web/vite.config.ts` 通过 `manualChunks(id)` 按路径拆分：React/React DOM 为 `react`，React Router 为 `router`，Phosphor 为 `icons`，Motion 为 `motion`；非 node_modules 返回 `undefined`。保留 hash 文件名和 CSS code splitting。

- [ ] **Step 2: 调整后台拆包**

移除后台 Vite 中将整个 `ant-design-vue` 强制合并为单一手工 chunk 的规则，仅保留 Vue、Vue Router、Pinia 和 Axios 稳定 vendor。不得删除 `/assets/` hash 命名。

- [ ] **Step 3: 启用 Nginx gzip**

在 `ops/nginx/myblog-admin.conf` 的 `/assets/` location 之前添加以下配置，保留现有严格 404 和 immutable 缓存：

```nginx
gzip on;
gzip_comp_level 5;
gzip_min_length 1024;
gzip_vary on;
gzip_types text/plain text/css application/javascript application/json application/xml image/svg+xml;
```

- [ ] **Step 4: 构建并记录前后体积**

```bash
cd /Users/leexd/Documents/ChatGPT/blog-admin
npm run build 2>&1 | tee /tmp/blog-admin-build-final.log
cd /Users/leexd/Documents/ChatGPT/blog-web
npm run build 2>&1 | tee /tmp/blog-web-build-final.log
```

记录入口、vendor、Ant Design、编辑器和最大业务 chunk 的 raw/gzip 大小，与本计划基线比较。

### Task 5: 全量回归、提交、部署和线上验收

**Files:**
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/docs/DELIVERY_2026-07-27.md`
- Verify: `/Users/leexd/Documents/ChatGPT/blog-admin/dist/`
- Verify: `/Users/leexd/Documents/ChatGPT/blog-web/dist/`

- [ ] **Step 1: 运行完整测试和构建**

```bash
cd /Users/leexd/Documents/ChatGPT/blog-web
npm test -- --run
npm run build
cd /Users/leexd/Documents/ChatGPT/blog-admin
npm test -- --runInBand
npm run build
git diff --check
```

预期：两个项目测试、构建和 diff check 均成功。

- [ ] **Step 2: 用 Chrome CDP 验证资源瀑布和路由**

访问首页、文章详情、搜索、管理后台总览和编辑器；记录 `performance.getEntriesByType('resource')`。确认首页不加载后台编辑器 chunk，进入编辑器后才加载编辑器 chunk；点击“管理后台”成功进入仪表盘，控制台没有动态 import、MIME 或 401 错误。

- [ ] **Step 3: 发布并验证线上响应头**

将两个项目按现有 release/current 方式部署。管理后台发布时同时安装 `myblog-admin-assets.conf`，先执行 `nginx -t` 再 reload。验证首页 200、新 JS 200 且 MIME 为 `application/javascript`、旧 hash 404；带 `Accept-Encoding: gzip` 的 JS/CSS/JSON 返回 `Content-Encoding: gzip`；公开 API 无 Token 和过期 Token 均为 200。

- [ ] **Step 4: 推送两个 main 分支并记录结果**

管理后台提交信息使用 `性能：优化页面资源加载与静态缓存`，博客前台使用 `性能：优化博客首屏请求与资源加载`。推送前确认两个仓库工作区干净；在 `docs/DELIVERY_2026-07-27.md` 记录实际提交号、构建体积、资源计数、线上响应头和回滚路径，不记录密码、Token 或 Cookie。

