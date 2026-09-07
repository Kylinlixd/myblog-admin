# 安全与功能审计修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use inline execution with test-first checkpoints.

**Goal:** 修复博客管理端、博客前台和 Django 后端的高风险权限、隐私、认证、上传与展示问题，并在保留 root 密码登录的前提下加固线上服务。

**Architecture:** 后端以权限类和安全序列化器收紧管理接口，以 HttpOnly refresh cookie 替代前端持久化 refresh token；前端只保存短期 access token，并统一处理刷新、Markdown 清洗和移动端展示。线上使用原子发布、非 root 应用进程和可回滚 systemd/nginx 配置。

**Tech Stack:** Django REST Framework、SimpleJWT、Vue/Vite、React/Vite、Vitest/Jest、Gunicorn、Nginx、systemd、UFW/SSH。

---

### Task 1: 后端权限、隐私与状态模型

**Files:**
- Create: `/Users/leexd/Documents/ChatGPT/blog_li/apps/user/permissions.py`
- Modify: `/Users/leexd/Documents/ChatGPT/blog_li/apps/user/views.py`, `serializers.py`
- Modify: `/Users/leexd/Documents/ChatGPT/blog_li/apps/blog/views.py`, `serializers.py`, `models.py`
- Modify: `/Users/leexd/Documents/ChatGPT/blog_li/apps/comment/views.py`, `serializers.py`
- Modify: `/Users/leexd/Documents/ChatGPT/blog_li/apps/upload/views.py`, `serializers.py`
- Create: `/Users/leexd/Documents/ChatGPT/blog_li/apps/blog/migrations/0002_category_status.py`
- Test: existing app test modules plus new regression cases

- [ ] 先写并运行权限越权、公开作者隐私、草稿评论泄露和分类状态回归测试，确认旧行为失败。
- [ ] 增加基于角色的内容编辑权限；普通用户只能访问自己的 profile，不得枚举或修改用户管理资源。
- [ ] 公共动态和评论使用脱敏序列化器；评论只允许出现在已发布动态下。
- [ ] 为分类补齐 active/inactive 状态并修正列表排序/筛选；内容、分类、标签、文件的写入统一要求内容编辑权限。
- [ ] 约束上传文件绑定动态时的授权范围，并统一扩展名、MIME、文件头和大小校验。

### Task 2: Cookie 认证与前端内容安全

**Files:**
- Modify: `/Users/leexd/Documents/ChatGPT/blog_li/blog/urls.py`, `/Users/leexd/Documents/ChatGPT/blog_li/apps/user/views.py`, `/Users/leexd/Documents/ChatGPT/blog_li/blog/settings.py`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/services/http/client.js`, `src/services/auth.js`, `src/services/auth/tokenStorage.js`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-web/src/services/api.ts`, `src/services/storage.ts`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/views/content/DynamicPreview.vue`, related Markdown views

- [ ] 先写 refresh cookie 和 refresh token 不落盘的测试，确认旧客户端行为失败。
- [ ] 登录/注册写入 HttpOnly、Secure、SameSite=Lax refresh cookie；刷新只接受 cookie（兼容旧 body 一段迁移期），响应不再返回 refresh token。
- [ ] 两套前端只持久化 access token，统一 `credentials`/`withCredentials`，刷新失败清理会话并回登录页。
- [ ] 所有管理端 Markdown 预览统一经过 DOMPurify；前台链接协议保持白名单。

### Task 3: 回归测试、构建和部署链路

**Files:**
- Create/modify: `/Users/leexd/Documents/ChatGPT/blog-admin/.github/workflows/deploy.yml`
- Create: `/Users/leexd/Documents/ChatGPT/blog-web/.github/workflows/ci.yml`
- Create: `/Users/leexd/Documents/ChatGPT/blog_li/.github/workflows/ci.yml`

- [ ] 后端运行 Django tests/check/deploy check；两套前端运行完整测试和 production build。
- [ ] 修复构建或测试回归，保留中文提交信息和核心代码注释。
- [ ] 后端原子同步到 `/opt/blog_li` 并执行迁移/collectstatic；前端按 releases + current symlink 发布。
- [ ] systemd 改为专用非 root 用户，SSH 保留 root/password 登录但关闭 X11、限制认证尝试并验证 `sshd -t` 后 reload。
- [ ] 线上执行 API、静态资源、认证刷新、博客详情和上传入口的冒烟检查，失败则回滚发布目录或服务配置。
