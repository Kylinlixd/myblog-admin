# 2026-10-01 前后端联合契约审查与修复

对前端（本仓库）与后端（`/opt/blog_li` 生产副本 + `Kylinlixd/blog_li` 仓库）做了一次全量契约审查：双侧逐行核对路由、参数、响应字段与异常分支，并对线上 14 组只读探测验证。本文记录结论与已执行的修复；问题分级沿用审查报告的 P0-P3。

## 审查总体结论

- **P0：无。** 文章流、详情、评论、点赞、搜索、登录、上传、审核、统计等核心链路契约全部闭合。
- 两处初审疑点经核实排除：`normalizeCollectionResponse` 会先解信封（首页/归档页两种用法均成立）；匿名重复点赞返回 200 + `already_liked`（前端能正常提示）。
- 主要债务集中在：分页形状四种并存、字段 snake/camel 混用、部分错误信封不统一、SEO（sitemap/RSS）缺失、后端部署副本与仓库存在漂移。

## 本次已修复（前端，随 CI 上线）

| 编号 | 问题 | 修复 |
| --- | --- | --- |
| P1-1 | 登录把网络/5xx 一律报"用户名或密码错误" | `stores/user.js` 仅将 400/401 折叠为 `false`（凭证错误），其余异常向上抛，登录页展示真实原因；补两条 store 回归测试 |
| P1-2 | 公开分类页只取默认前 10 篇，超出静默丢失 | `BlogCategoryDetail.vue` 增加"加载更多"分页（pageSize=12，`total` 驱动 hasMore），并区分 404（"该分类不存在或已被删除"+返回首页）、守护 `response.data` 缺失 |
| P1-3 | 搜索关键词模式下分类/标签筛选静默失效 | `searchFilters.js` 的 `refineItems` 新增 category/tag 本地过滤（字符串/数字 id 均可匹配，tag/category 伪条目在筛选时排除）；`BlogSearch.vue` relevance 分支不再把 `hasMedia` 等无效参数塞进 query；网络错误改用 `error.code === 'NETWORK_ERROR'` 判定（原字符串比对恒假） |
| P2-7 | 评论区"查看更多回复"按钮无效果 | `CommentThread.vue` 增加 loading 态；详情页 `@more` 拉全量平铺评论按 `root_id` 归位填充 `replies_preview`，加载中禁用按钮 |
| P2-5 | 评论审核/删除、动态删除不校验响应体 | `api/comment.js`、`deleteDynamic` 统一过 `unwrapApiResponse`；`HTTP 200 + code!=200` 现在会正确抛错 |
| P2-3(部分) | 管理端写操作后公开页 30s 缓存不失效 | `tag/category/dynamic` 写操作成功后调用 `clearRequestCache()` |
| P3 | `error.response` 死分支 4 处、搜索网络错误死分支 | 全部清理（`ApiError` 无 `response` 字段，统一走 `error.message` / `error.status`） |

新增/更新测试：`user.spec.js`（登录错误归因 ×2）、`searchFilters.spec.js`（分类/标签筛选 ×2）。提交前全量 `test:ci` + `build` 通过。

## 已记录、待后端排期（不改动 `blog_li`）

以下项需要后端仓库改动或规范决策，本轮**未动**，避免制造"生产与仓库再漂移"：

1. **P2-1 SEO**：`/sitemap.xml`、`/rss.xml` 目前被 nginx 兜底成 SPA HTML（比 404 更糟）。需后端实现 sitemap/RSS 视图 + nginx 精确转发，并补 robots.txt。
2. **P2-2 分页治理**：四种分页形状、`pageSize`/`page_size` 双轨统一；`collectAllPages`（25 页/250 条上限）可改为直接 `pageSize=100`。
3. **P2-3 命名治理**：snake/camel 统一（建议响应层统一 camelCase），移除 `created_at`+`createdAt` 双写、`useCount` 与 `dynamicCount` 冗余。
4. **P2-4 错误信封**：404/400 补齐 `data:null`；`message` 保证字符串（login 校验失败当前是 errors dict）；分类/标签"有动态不能删除"改用真实 HTTP 状态码；文件删除 403 的裸 `{"detail"}` 入信封；507/413 的 `code` 字符串枚举规范化。
5. **P2-6 部署卫生**：生产侧 7 个 `admin.py` 未入库、6 个 `.bak` 文件散落、仓库 tests.py 有未部署改动；建议对齐前端"发布 = 仓库 commit"的纪律。
6. **P3 清扫**：`DynamicListView` 死代码、`CommentViewSet` 公开分支、`searchType` 未使用参数、`/api/users/*` 重复路由、`DynamicUpdateSerializer` snake-only 路径。
7. **前端遗留**：路由 `meta.permissions: ['comment:view']` 无守卫实现（`router/index.js`），在明确权限值语义前保持现状未动。

## 验证口径

- 全量 `npm run test:ci`（91 套件）+ `npm run build` 通过后推送，CI（deploy.yml）自动原子发布。
- 线上验收点：分类页文章数 >12 时出现"加载更多"；搜索选分类后结果只含该分类文章；断网时登录/搜索提示"网络"而非"结果为空"；评论区嵌套回复可展开全部。
