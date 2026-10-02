# 前端 API 约定

开发环境由 Vite 代理到 Django；生产环境应由同一域名的反向代理转发。因此前端始终请求相对路径。

本文契约依据 2026-10 的前后端联合审查逐条核对过线上实现；后端仓库 `docs/api.md` 仍是最终权威。

## 响应格式

多数业务接口返回 `{code, message, data}` 信封，`code === 200` 表示业务成功。HTTP 状态码仍是判断成败的第一依据；出现 `HTTP 200 + code != 200` 时（分类/标签"有动态不能删除"），以信封 `code` 为准，`unwrapApiResponse` 会直接抛错。

**分页形状按模块分四种，这是历史现状，新增接口请勿再引入新形状：**

| 模块 | 成功响应 data（或分页体） | 分页参数 |
| --- | --- | --- |
| `/api/blog/dynamics/`、`/api/blog/search/`、`/api/dynamics/` | `{ total, items }` | `page` / `pageSize` |
| `/api/comments/`、`/api/access-logs/` | `{ list, total, page, pageSize }` | `page` / `pageSize` |
| `/api/categories/`、`/api/tags/`、`/api/upload/files/`、`/api/users/` | DRF 原生 `{ count, next, previous, results }`（无信封） | `page` / `pageSize`（upload 为 `page_size`） |
| `/api/blog/dynamics/hot|recent/`、`timeline/`、`/api/access-log-rules/`、`/api/blog/categories/` | 裸数组（categories 在信封内全量返回，不分页） | 无或 `limit` |

前端统一通过 `api/collections.js` 的 `normalizeCollectionResponse` / `collectAllPages` 兼容以上形状；新代码不要在视图里手写第四种解包分支。

## 字段命名

响应字段已统一 snake_case（`created_at`、`dynamic_count`、`media_urls`、`use_count` 已移除）。
写接口仍接受既有的 camelCase 请求体（`mediaUrls`、`categoryId`、`fileIds`、`tags`）。
过渡期前端消费点保留了 camel 兜底（`??` 双读），稳定后可逐步拆除；
新增页面直接按 snake 编写，不要新增 camel fallback。

## 搜索契约

`GET /api/blog/search/` 只接受 `keyword`、`page`、`pageSize`、`sortBy`（当前仅 `relevance` 生效）、`includeTags`、`includeCategories`。`category`、`tag`、`time`、`hasMedia` 由前端在 `views/blog/searchFilters.js` 本地过滤（含分类/标签的 id 匹配），不要把它们塞进请求。

## 认证

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | `/api/auth/login/` | 登录并返回 access；refresh 写入 HttpOnly Cookie |
| POST | `/api/auth/register/` | 仅管理员可创建账号 |
| POST | `/api/token/refresh/` | 依据 Cookie 刷新 access token（请求体为空） |
| POST | `/api/auth/logout/` | 退出并拉黑当前 access token |
| GET | `/api/auth/info/` | 当前用户资料 |
| PUT | `/api/auth/password/` | 修改密码 |
| PUT | `/api/auth/profile/` | 修改资料 |

受保护请求自动携带 `Authorization: Bearer <access>` 与 `X-Request-ID`（写操作幂等键，5 分钟内重复返回 409）。公开博客 GET 不携带令牌；公开评论 POST 例外（携带，但后端对公开路径令牌无效时降级为匿名，不会 401）。

## 公开博客

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/blog/dynamics/` | 已发布内容列表，支持 `keyword`、`month=YYYY-MM` |
| GET | `/api/blog/dynamics/{id}/` | 内容详情（草稿对公开请求返回 404） |
| GET | `/api/blog/dynamics/timeline/` | 按月归档 |
| GET | `/api/blog/dynamics/hot/` | 热门内容，支持 `limit`（1-100） |
| GET | `/api/blog/dynamics/recent/` | 最近内容，支持 `limit` |
| GET | `/api/blog/dynamics/{id}/adjacent/` | 上一篇 / 下一篇 |
| PUT | `/api/blog/dynamics/{id}/view/` | 增加阅读量（IP+文章 24h 去重） |
| POST | `/api/blog/dynamics/{id}/like/` | 点赞（匿名按 IP 去重，重复返回 `already_liked`） |
| GET/POST | `/api/blog/comments/` | 查询已审核评论（`thread=1` 楼栋模式）或提交评论（10 次/分钟） |
| GET | `/api/blog/categories/` | 分类列表（信封内全量数组） |
| GET | `/api/blog/categories/{id}/dynamics/` | 分类内容，支持 `page` / `pageSize` |
| GET | `/api/blog/tags/` | 标签列表（DRF 原生分页，无信封） |
| GET | `/api/blog/tags/{id}/dynamics/` | 标签内容 |
| GET | `/api/blog/search/` | 搜索公开内容（60 次/分钟） |

读取文章详情不会隐式增加阅读量；前端仅通过显式 `PUT /api/blog/dynamics/{id}/view/` 上报一次阅读。公开评论列表只展示审核通过的评论。

SEO 三件套已上线：`/sitemap.xml`（15 分钟缓存）、`/feed.xml`（RSS 2.0）、`/robots.txt`，
由 Django 提供、nginx 精确转发（`ops/nginx/myblog-admin.conf`）；域名取后端 `PUBLIC_SITE_URL`。

## 管理端

`/api/dynamics/`、`/api/categories/`、`/api/tags/`、`/api/comments/` 提供标准列表、创建、详情、更新和删除操作，全部需要登录（角色阈值见后端 `IsContentEditor` / `IsUserAdmin`）。`/api/stats/` 返回管理仪表盘统计且必须登录。文件接口位于 `/api/upload/`（单文件上限 1GB；`code` 在 507/413 场景为字符串枚举）。

写操作（创建/更新/删除动态、分类、标签）成功后前端会调用 `clearRequestCache()`，清掉公开接口 30 秒缓存；评论审核与删除统一经 `unwrapApiResponse` 校验信封后再提示成功。

## 错误处理

请求层将网络错误、Django/DRF 错误标准化为 `ApiError { status, code, message, fieldErrors, requestId }`。页面不要读取 `error.response`，而应读取：

```js
try {
  await getBlogDynamics({ page: 1 })
} catch (error) {
  errorMessage.value = error.message   // 网络错误时 error.code === 'NETWORK_ERROR'
}
```

接口定义以配套后端仓库的 `docs/api.md` 为准。
