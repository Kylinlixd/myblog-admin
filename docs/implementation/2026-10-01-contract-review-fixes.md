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

## 后端契约统一（2026-10-02 已完成，blog_li@01345e0，已同步生产）

用户拍板：字段统一 snake_case、分页统一 `{total,items}` 信封、SEO 三件套全做、提交+同步生产+重启。`cc11a6e` + `2f1f150` 落地：

1. **P2-2 分页治理 ✅**：StandardPagination/FilePagination/CommentPagination/AccessLogPagination 统一输出 `{total, items}`；公开分类从裸数组改为 `{total, items}`；分类/标签动态流 `dynamics` 键改 `items`；公开评论 `list` 键改 `items`（thread 保留 commentTotal）；`page_size` 参数统一为 `pageSize`。例外：timeline/hot/recent/access-log-rules 保持裸数组，profiles 保持 `{list,…}`。
2. **P2-3 命名治理 ✅**：响应字段全部 snake_case——去掉 `createdAt` 双写、`useCount` 冗余（直接移除）、`mediaUrls/mediaCount/media_urls` 归一、`totalBytes→total_bytes`、评论 `createTime→created_at`。写接口仍接受 camel 请求体。
3. **P2-4 错误信封 ✅**：login/register 校验失败 message 拼为字符串；分类/标签"下有动态"删除改回真实 HTTP 400；404/400/403 补齐 `data:null`；文件删除 403 裸 `detail` 入信封；logout 补 `data:null`。507/413 的语义化字符串 code 保留（前端透传）。
4. **P2-1 SEO ✅**：新增 `blog/seo_views.py`——`/sitemap.xml`（15 分钟缓存）、`/feed.xml`（RSS 2.0）、`/robots.txt`；域名取 `PUBLIC_SITE_URL` 环境变量；nginx 三条路径精确转发（前端仓库 snippet 同步更新）。
5. **性能**：公开列表 queryset 改用预注解 Prefetch（category/tags 的 `dynamic_count`），消除每行 COUNT（审查发现的查询数回归一并修复）。
6. **P2-6 部署卫生 ✅**：7 个 `admin.py`、`dashboard/models.py`、`templates/` 收编入库；生产 `.bak`/`._*` 文件清理；上线方式=仓库 commit → rsync 变更文件到 `/opt/blog_li` → 重启 `blog-li.service` → 健康探测。

**遗留（未处理）**：
- dashboard 每日发布时区用例 `test_daily_publishing_uses_local_calendar_day` 在本次改动**之前**就失败（基线已验证），疑似本地时区环境问题，需单独排查。
- P3 清扫：`DynamicListView` 死代码、`CommentViewSet` 公开分支、`searchType` 未使用参数、`/api/users/*` 重复路由、`DynamicUpdateSerializer` snake-only 路径。
- 前端：路由 `meta.permissions: ['comment:view']` 无守卫实现；`collectAllPages` 可改传 `pageSize=100`（后端已支持）。
- 本机（2GB 内存 VPS）不要跑 `vite build`——已安装用户级 Node 22（/opt/node22）也扛不住，构建一律走 CI。

## 验证口径

- 全量 `npm run test:ci`（91 套件）+ `npm run build` 通过后推送，CI（deploy.yml）自动原子发布。
- 线上验收点：分类页文章数 >12 时出现"加载更多"；搜索选分类后结果只含该分类文章；断网时登录/搜索提示"网络"而非"结果为空"；评论区嵌套回复可展开全部。
