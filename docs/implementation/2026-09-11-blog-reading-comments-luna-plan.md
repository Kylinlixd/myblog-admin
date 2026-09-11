# 博客阅读体验与评论优化：Luna 执行计划

本轮只编写计划。由用户切换 Luna 后按此文实施；不要自动创建任务或切换模型。先交付本地可验收结果，用户明确同意后再提交、推送、部署。沿用暖米色、暖棕强调色和柔和圆角；首页 Hero、后台工作台不在本轮改动范围。

## 目标和范围

1. 缩小动态详情标题、收紧头部留白，在正文右侧显示可跟随阅读的分级目录。
2. 缩小“探索动态”并减少它与导航栏之间的空白。
3. 正文代码块改成浅色 macOS 窗口式外观，支持独立折叠、展开、复制和行号。
4. 将“平路”按上下文理解为“评论”：参考截图的一体式评论框，上方昵称/邮箱/网址，下方正文和提交区，三项身份字段都可选。
5. 默认评论头像使用适合 Coffee & Code 主题的图形，保留用户真实头像。

前端目录 F：`/Users/leexd/Documents/ChatGPT/blog-admin`。
后端目录 B：`/Users/leexd/Documents/ChatGPT/blog_li`。
执行开始时分别检查 git status、最近提交及各仓库说明，保留其他任务改动。本次排查时前端 HEAD 为 cdd495c，存在未跟踪的 `docs/superpowers/plans/2026-09-11-admin-density-security-summary.md`；实际执行以当时状态为准。

## 已核实的现状

- F/src/views/blog/BlogDynamicDetail.vue：当前头部是 `.article-header`，标题规则为 `clamp(2.15rem, 5vw, 4.6rem)`，手机规则可达 3.1rem。头部 margin 最大 92px，padding 最大 64px。旧 `.dynamic-header` 与新阅读样式并存，要清理实际冲突，不能继续在文件末尾堆覆盖。
- F/src/styles/blog-cinematic.scss：`.cinematic-hero .page-title` 有 `clamp(2.7rem, 6vw, 5.7rem) !important`，会盖过列表页局部 `.page-title`。详情的旧全局选择器 `.dynamic-detail-container .dynamic-header .dynamic-title` 不匹配当前 `.article-header`，不能误判它就是当前详情标题的唯一根因。
- 详情页已经有 `tocItems`、`syncArticleNavigation`、移动折叠目录及桌面 aside。只提取 h2/h3，aside 从正文开始，sticky top 是 34px，标题 scroll-margin-top 是 28px，未与顶部导航占位协调，也没有当前章节高亮。
- 只读核验线上 `/api/blog/dynamics/66/`：该文确实含 7 个 Markdown 二级标题。目录缺失不能归因于文章没有标题。要核验渲染时机、实际 DOM、断点与目录的纵向位置；截图只有头部，尚不能证明目录始终不存在。
- F/src/layouts/BlogLayout.vue：非首页导航 sticky top 为 14px、header 高度为 0，main padding-top 为 62px；手机另有 top/高度规则。内容定位应按实际导航底边测量，不直接删除占位。
- 详情用 markdown-it、highlight.js 核心及有限语言包、DOMPurify，正文通过 `v-html="renderMarkdown(dynamic.content)"` 渲染。保留清洗及高亮能力，不额外引入完整 Markdown/编辑器框架。
- 评论列表页和详情页有两套表单，昵称/邮箱已非必填，正文前端上限 500 字。详情有 CommentThread、回复、分页和审核反馈，必须保留。
- F/src/api/blog.js 的 commentDynamic 只传 content/nickname/email/parent_id 等既有字段，没有 website。B/apps/comment/models.py 和 serializers.py 也没有 website。因此网址不能只画输入框而不保存。
- F/src/components/blog/CommentThread.vue 已复用 UserAvatar 的 warm 模式；列表页仍用 `/assets/default-avatar.png` 回退。UserAvatar 的 warm 模式当前是米色底、通用人物轮廓。

## 第一步：阅读版式和标题

- [ ] 修改 F/src/views/blog/BlogDynamicDetail.vue 的现有 article 样式，删去确认失效或互相覆盖的旧规则，仅整理本次涉及部分。
- [ ] 文章标题桌面 32–40px、手机 24–30px，建议 `clamp(1.5rem, 2.8vw, 2.5rem)`，字重 700–750，行高 1.35，字距 -0.02em。允许长标题自然换行，不截断、省略、固定高度或强制单行。长英文允许断开。
- [ ] 头部到导航底边的可见间距：桌面 24–32px、手机 16–24px；头部内边距桌面 24–32px、手机 18–20px；头部到正文间距 24px。将相邻容器的 margin/padding 一起计算。
- [ ] 正文宽度 720–780px，桌面右侧目录 200–220px，中间间距 32–40px，外层宽度约 1120px。标题和正文共用主列左边界；正文 16–18px、行高 1.85–1.95。元信息保持 12–13px 并自然换行。
- [ ] 将头部放入主阅读列，右侧目录从头部附近开始，避免巨大头卡之后才出现目录。手机目录紧接文章头部，位于正文之前。无目录时主列居中，不留空侧栏。
- [ ] F/src/views/blog/BlogDynamic.vue：“探索动态”桌面 32–40px、手机 26–30px，说明移到标题下方，间距 8–12px；标题区到列表 24–32px。导航底部到标题 24–32px，手机 16–24px。
- [ ] F/src/styles/blog-cinematic.scss：从通用大字号规则中明确排除该列表页，或给该页使用独立页头 class；保留其他页面既有样式。检查实际 computed font-size，不能只看声明。布局外框和 BlogLayout 只在确有占位问题时做最小修复。

## 第二步：复用并修好文章目录

- [ ] 在现有 `syncArticleNavigation` 上改造，提取正文 h2/h3/h4，三级层次缩进 0/12/24px。标题取 textContent，不使用不可信 HTML。
- [ ] 为重复标题生成唯一且稳定的 ID；正文内容不变时 ID 不变，切换文章时重建。无语义标题不将普通段落或粗体猜成目录，不改线上文章来制造目录。
- [ ] 将正文渲染结果改为仅随文章内容变化而计算的 computed。对清洗后正文做一次目录/代码增强，避免滚动进度、评论输入引起 v-html 重建，导致 ID 或代码折叠状态丢失。
- [ ] 正文渲染完成后初始化目录。用现有滚动更新逻辑或一个经过节流的滚动处理定位当前章节，禁止每帧重新解析 Markdown。目录高亮用暖棕文字和短侧边标记，并设置 aria-current。
- [ ] 统一导航偏移值：测量 site-header-panel 下边缘并加 16px，供 sticky top 和标题 scroll-margin-top 使用，响应式切换时更新。目录最大高度为视口剩余高度，长目录可内部滚动。
- [ ] 点击目录平滑滚动，URL 不增加 hash、不触发文章路由重新加载；reduced-motion 时立即定位。手机按钮补 aria-expanded/aria-controls，选中章节后收起。
- [ ] 路由 ID 改变和组件卸载时清理监听器/观察器、活动项及折叠状态。切换文章、图片加载改变布局、代码折叠后目录定位仍准确。

## 第三步：macOS 风格代码块

新增 F/src/utils/blogCodeBlocks.js（代码块生成与交互增强，直接配套测试），样式放 F/src/styles/blog-code-blocks.scss，仅作用在指定博客代码块 class。详情接入；动态列表正文中的代码块若实际存在，同样复用。不要改变后台编辑器和管理预览器。

- [ ] 顶栏高度约 40px：左侧 3 个 8–10px 红/黄/绿装饰圆点和语言名，右侧真实折叠按钮、复制按钮。圆点 aria-hidden，不伪装可用的系统按钮。
- [ ] 浅奶白代码底、浅灰暖调顶栏、1px 淡边框、12px 圆角、极轻阴影。移除当前 pre 深色描边与重阴影覆盖。代码字号桌面 13–14px、手机 12–13px，等宽字体、行高 1.65–1.75。
- [ ] 延用 highlight.js 核心和现有语言包；支持已有别名，未知语言按纯文本转义，语言标签只能安全文本输出。
- [ ] 默认展开；各块独立折叠，收起后仅显示顶栏及行数，例如“JSON · 32 行”。按钮使用 aria-expanded/aria-controls，键盘 Enter/Space 可操作。不嵌套交互元素，不使用注入 onclick 或 Vue 模板指令。
- [ ] 可用安全生成的静态 HTML + 原生按钮 + 正文容器事件委托实现。Markdown 先完整清洗，增强阶段只插入受控节点/安全转义文本，不放宽 DOMPurify 允许脚本与危险 URL 的规则。处理旧文章原生 pre/code，重复初始化不得多包一层。
- [ ] 行号与代码分离，不混进原代码文本；复制拿原始源码，保留换行和缩进，不带语言名、按钮或行号。复制成功显示“已复制”约 1.5 秒，失败显示可理解提示，仍允许手动选择。
- [ ] 长行只在代码区域横向滚动，不撑宽页面；长块展开最大高度约 480px 后内部纵向滚动，完整源码仍可选择和复制。
- [ ] 避免每行创建 Vue 组件、重复加载高亮器、整段高度动画。手机图标按钮点击区域至少 40px。

## 第四步：一体式评论表单和网址保存

新增 F/src/components/blog/CommentComposer.vue，用于 BlogDynamicDetail.vue 和 BlogDynamic.vue 的主评论表单。组件只负责输入/展示校验结果/emit submit；父页继续负责现有发布请求、评论刷新、回复关系和审核反馈。回复区沿用其现有流程并协调视觉，不重做评论数据模型。

- [ ] 一张奶白色圆角卡片：第一行三个等宽字段，下方分隔线和正文输入框，底部左侧轻提示、右侧字数及提交按钮。正文 textarea 高度约 150–180px。
- [ ] 固定可见标签“昵称”“邮箱”“网址”，三个 placeholder 均为“可选”；各自有清楚的浅底色和 1px 边框，焦点使用暖棕边框及浅色光环。标签不可只由 placeholder 代替。
- [ ] 三项都可留空；匿名昵称沿用既有回退。邮箱非空时校验格式，网址非空时仅接受完整 http/https URL。正文仍必填，trim 后空白禁止提交，上限沿用当前 500 字，字数按实际可见字符合理统计。
- [ ] 桌面三列，手机单列，输入字号至少 16px 避免 iOS 自动放大。错误显示在对应字段下方。提交中防重入，失败保留输入，成功清空正文；已通过/待审核/被拒提示必须区分，评论总数依据服务器刷新。
- [ ] 不增加截图中未要求的 GIF、图片上传、Markdown 工具栏或假登录按钮。评论仍按现有纯文本展示，不能突然把访客评论当 HTML 渲染。
- [ ] F/src/api/blog.js：commentDynamic 显式传递 website，可选值标准化为空字符串；保留 parent_id 协议。更新请求协议测试。
- [ ] B/apps/comment/models.py：新增 `website = models.URLField(max_length=500, blank=True, default='')`，通过 makemigrations 生成独立可回滚迁移，不猜迁移编号，不编辑旧迁移。
- [ ] B/apps/comment/serializers.py：创建及需要展示的评论序列化器加入 website；创建字段 required=False/allow_blank=True，限制 500 字符，仅 http/https，无服务器请求或网址预览。旧客户端不传字段仍可正常创建。
- [ ] 核验 B/apps/comment 下实际公开视图链路是否再过滤字段，并补齐保存/读取测试；公开序列化器继续不返回 email。历史评论 website 为空，不影响现有数据。
- [ ] 有有效 website 时评论昵称可链接到该网址；目标加 `rel="nofollow ugc noopener noreferrer"`，新窗口打开；旧记录或异常协议回退普通文本。空网址不产生空链接。
- [ ] 本地先迁移测试数据库并测试后端，再验收前端完整提交；前端不得静默丢弃网址。最终部署顺序为兼容性后端迁移/API → 前端，需用户发布授权。

## 第五步：博客默认头像

- [ ] F/src/components/common/UserAvatar.vue：仅优化 warm 模式的默认图形，采用暖米色圆底、暖棕色简化咖啡杯 SVG；图形有完整杯身和把手、少量蒸汽，线宽适合 28–36px 尺寸。不要直接缩小复杂 Logo 使线条变淡。
- [ ] 真实头像优先；空头像、历史默认路径、加载失败均回退到同一主题图形，换 src 后能够再次尝试加载。图形为本地内联 SVG，无远程头像服务。
- [ ] F/src/components/blog/CommentThread.vue 保持已有 warm 模式；F/src/views/blog/BlogDynamic.vue 也替换为 UserAvatar warm，消除两处回退不一致。
- [ ] 后台 cool 模式和用户已上传头像不受影响。不依赖邮箱生成对外可追踪头像，不把匿名评论共用的 guest 账号头像当作不同访客真实头像。

## 第六步：验证与本地交付

新增测试聚焦实际行为，不写单纯检查 CSS 字符串的测试。已有源码断言若因合理抽取变更失效，迁移到新模块的行为断言，不删除安全保证。

- [ ] 目录：有 7 个 h2 的文章显示 7 项；重复标题 ID 唯一；h3/h4 层级正确；无标题不显示空栏；从 A 切到 B 不残留目录；滚动后高亮更新；点击不改变 URL。
- [ ] 代码：两个块独立折叠，复制保留原码和空白；未知语言/恶意语言名/含 HTML 的代码均安全；重复增强无嵌套；剪贴板失败可见；评论输入和滚动不重置折叠状态。
- [ ] 评论：三个选项全空、有效网址、无效邮箱、危险网址、正文全空、重复点击、网络失败保留输入、待审核反馈、回复及分页。后端覆盖 website 保存往返、旧请求兼容、旧记录、公开不泄露 email。
- [ ] 头像：有效图片、空值、404、历史路径、warm/cool 模式和回复小头像。
- [ ] 执行相关现有前端测试：`npx jest --runInBand src/views/blog/__tests__/BlogDynamicDetailLayout.spec.js src/views/blog/__tests__/BlogDetailSecurity.spec.js src/api/__tests__/blog.test.js`。另新建 `src/views/blog/__tests__/BlogDynamicDetailInteraction.spec.js` 验证目录定位及代码块交互，再单独执行该文件。
- [ ] 执行本轮新增的目录、代码、表单和头像行为测试；后端按仓库现有测试配置跑评论专项及迁移检查。随后 `npm run build` 和 `git diff --check`。
- [ ] 浏览器实测 1440×900、1366×768、390×844、360×800。第 66 篇长标题完整自然换行，桌面首屏可看到正文开头与目录；列表页可见首条内容；手机页面无横向溢出。
- [ ] 录一段或提供连续截图验证目录定位、代码折叠复制、表单 focus 和失败反馈；hover 截图不能替代功能验证。检查导航始终可见且不遮住目标章节，桌面目录 sticky 真正生效（祖先 overflow/transform 也要核验）。
- [ ] 本地验证使用测试文章、测试评论和本地后端，不向线上第 66 篇发布测试评论。若本地身份会话缺失，准备隔离的本地测试数据并明确标记，不能凭源码测试宣称完成浏览器验收。
- [ ] 交付实际本地 URL、桌面/手机截图、完成项、验证结果及后端迁移说明。等待用户验收，通过前不 commit/push、不部署。

## 给 Luna 的起始指令

“读取 docs/implementation/2026-09-11-blog-reading-comments-luna-plan.md，按六个步骤实施。先核对当前代码，复用现有目录、Markdown、回复与头像实现；处理全局 CSS 覆盖并完成网址前后端保存。完成本地桌面/手机视觉及功能验证后交给我验收，不自动推送或部署。不要重新执行历史后台或首页 Hero 优化。”
