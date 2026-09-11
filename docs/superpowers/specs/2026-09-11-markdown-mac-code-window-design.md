# Markdown Mac 窗口代码块设计

## 目标

当文章内容包含 fenced code block（例如 `````json`````）时，博客动态列表、博客动态详情和后台动态预览统一输出浅色 Mac 窗口样式代码容器。保留现有语法高亮、行号、复制和折叠能力，不改变 Markdown 文本语义或接口。

## 现状与范围

项目已有三个 Markdown-it 渲染入口：`BlogDynamic.vue`、`BlogDynamicDetail.vue` 和 `DynamicPreview.vue`。详情页已有一个渲染后 DOM 增强器，但列表页和预览页未使用，且二次改造可能产生结构和样式短暂不一致。本次只调整 Markdown 渲染和代码块呈现，保留媒体、评论、目录、阅读进度与其他页面功能。

## 方案

新增共享 Markdown 渲染工厂并注册 `macCodeWindow` fence 插件。插件覆盖 Markdown-it 的 fence renderer，在解析代码 token 时直接生成以下结构：

- `pre.blog-code-window[data-blog-code-window]`
- `div.blog-code-header`：三色圆点、语言标签、折叠按钮、复制按钮
- `div.blog-code-body`：行号栏和代码内容栏

语言名、属性和未高亮代码使用 Markdown-it 的 HTML 转义；已知语言继续交给 highlight.js，未知语言回退为转义文本。输出不包含内联事件脚本。

共享交互绑定函数在渲染完成后初始化代码块按钮，使用 `data-blog-code-action` 标记并保证幂等。复制使用 Clipboard API，失败时回退到临时 textarea；折叠只切换当前代码块的状态，并同步 `aria-expanded` 和提示文本。

## 样式

将现有详情页代码窗口样式提取为共享样式：浅色标题栏、红黄绿圆点、等宽字体、行号分隔线、统一圆角和阴影。正文限制最大高度；代码内容在容器内部横向滚动。移动端缩小标题栏间距并保留至少 44px 的按钮触控区域，页面本身不产生横向溢出。

## 数据流

1. 页面调用共享 Markdown 渲染器。
2. Markdown-it 解析普通 token；fence token 由 Mac 窗口插件生成安全 HTML。
3. 页面继续通过 DOMPurify 清洗渲染结果。
4. Vue 更新 DOM 后调用共享绑定函数，连接复制和折叠交互。
5. 内容更新或组件缓存恢复时重复调用不会增加重复监听。

列表页仍先按现有规则截断内容；详情页保持完整内容；后台预览保持完整预览。

## 安全与兼容

- 不使用 `onclick` 等内联事件属性，遵守现有 CSP。
- 代码中的 HTML 和脚本只作为代码文本显示。
- 保留现有 `DOMPurify.sanitize` 边界。
- 不修改 API、Markdown 数据格式或媒体渲染逻辑。
- 保留现有 DOM 增强器的兼容测试，或将其调整为共享绑定函数测试，避免旧内容结构回归。

## 验证

- 插件单元测试覆盖语言、未知语言、空代码、多行代码和特殊字符。
- 交互测试覆盖复制、复制失败回退、折叠、重复初始化和键盘属性。
- 三个页面源代码/挂载测试确认统一使用共享渲染器和绑定函数。
- 执行 Jest 全量测试与生产构建。
- 使用桌面和手机视口检查标题栏、行号、按钮、横向滚动和页面溢出。
