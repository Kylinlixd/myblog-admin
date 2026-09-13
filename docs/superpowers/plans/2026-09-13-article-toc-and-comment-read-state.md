# 文章详情目录与评论未读基线实施计划

> 目标：优化文章详情阅读导航，并以数据库管理员已读基线替换前端本地计数。
> 前端：`/Users/leexd/Documents/ChatGPT/blog-admin`
> 后端：`/Users/leexd/Documents/ChatGPT/blog_li`

## Task 1：后端阅读基线模型与迁移

- 新增按用户唯一的评论阅读状态模型，包含 `last_seen_comment_id`、`initialized_at`、`updated_at` 和必要索引。
- 编写幂等迁移/初始化逻辑：已有管理员以部署快照 ID作为基线，新评论不回填。
- 将未读查询限定为可见状态、非本人、非 rejected 的评论，并利用主键条件与索引，避免加载全量数据。

## Task 2：后端接口与兼容层

- 更新 `/api/comments/unread-summary/` 返回数量、最新评论 ID、初始化状态。
- 更新 `/api/comments/mark-read/` 只接受最大 ID，使用事务和 `GREATEST` 语义单调更新，返回最新摘要。
- 保留旧请求字段的短期兼容，补充权限、空结果、并发请求和重复请求测试。
- 在评论分页响应中保留兼容 `is_unread`，但主逻辑使用基线条件。

## Task 3：前端通知状态迁移

- `commentNotifications` 解析新摘要与 mark-read 响应，移除 localStorage 数量基线和首次加载猜测。
- 仪表盘保留总评论数，将摘要未读数作为独立角标；进入评论管理且当前批次渲染成功后确认已读。
- 增加网络失败与新增评论竞态测试。

## Task 4：文章目录性能实现

- 重构 `articleNavigation`，收集正文 `h2–h4` 并生成稳定 ID；提供 IntersectionObserver 绑定和清理函数，观察器不可用时使用 rAF 节流回退。
- `BlogDynamicDetail.vue` 在正文 DOM 更新后绑定目录，路由切换/卸载时完整清理；目录点击保持平滑定位和移动端收起。
- 调整 sticky 侧栏、正文宽度、断点与 reduced-motion 样式，确保无标题时单列。

## Task 5：验证与发布

- 运行前端目录/仪表盘/评论通知聚焦测试、后端迁移与接口测试、前端生产构建。
- 通过 GitHub API 提交前端与后端各自变更，等待 CI；发布后检查文章详情目录、滚动高亮、匿名新评论登录提醒和不同管理员隔离。
- 更新交付记录，注明数据库迁移边界、接口返回和回滚方式。
