# 移动端媒体上传与网页优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 为移动端新建动态增加清晰的媒体上传状态，支持 iPhone MOV/HEVC 与 HEIC/HEIF，并在后端生成网页友好的 MP4 与封面图。

**Architecture:** 前端继续使用现有 `a-upload` 和上传 API，在 `DynamicEdit` 内显示上传百分比、转码中和完成状态。后端新增独立的 FFmpeg 处理模块，上传接口先校验并生成处理后临时文件，再交给现有本地/Xion 存储边界；`UploadFile` 保存处理后媒体与封面元数据。当前采用同步转码，不引入队列系统。

**Tech Stack:** Vue 3、Ant Design Vue、Axios、Django 5、Django REST Framework、FFmpeg/ffprobe、现有 Local/Xion storage backend、MySQL。

---

## 文件边界

前端仓库：`/Users/leexd/Documents/ChatGPT/blog-admin`

- `src/views/dynamics/DynamicEdit.vue`：移动端上传卡片、状态、格式识别、视频封面预览。
- `src/utils/upload.js`：格式检查与上传进度回调。
- `src/api/file.js`：规范化 `poster_url` 等上传响应字段。
- `src/views/dynamics/DynamicPreview.vue`：管理端预览使用视频封面。
- `src/views/blog/BlogDynamicDetail.vue`：公开详情页使用媒体对象和视频封面。
- `src/views/dynamics/__tests__/DynamicEditMountedInteractions.spec.js`：上传入口、格式识别和状态测试。
- `src/views/blog/__tests__/BlogDynamicDetailLayout.spec.js`：公开视频封面回退测试。

后端仓库：`/Users/leexd/blog_li`

- `apps/upload/media_processing.py`：新增纯 FFmpeg 处理边界，负责视频转码、封面提取和 HEIC/HEIF 转 JPEG。
- `apps/upload/models.py`：为 `UploadFile` 增加封面存储字段。
- `apps/upload/migrations/0004_uploadfile_poster_fields.py`：数据库迁移。
- `apps/upload/serializers.py`：返回封面字段和处理后媒体元数据。
- `apps/upload/views.py`：接入处理模块、校验 iPhone 格式、处理临时文件和存储补偿。
- `apps/upload/tests.py`：上传校验、FFmpeg 命令、封面保存和失败清理测试。
- `requirements.txt`：不增加 Python 转码依赖；服务器通过系统包安装 FFmpeg。

---

### Task 1: 后端先写媒体处理失败测试

**Files:**

- Create: `/Users/leexd/blog_li/apps/upload/media_processing.py`
- Modify: `/Users/leexd/blog_li/apps/upload/tests.py`

- [ ] **Step 1: 写 FFmpeg 命令和清理行为的失败测试**

在 `apps/upload/tests.py` 增加 `MediaProcessingTests(SimpleTestCase)`，使用 `tempfile.TemporaryDirectory()`、`SimpleUploadedFile` 和 `unittest.mock.patch('apps.upload.media_processing.subprocess.run')`，固定覆盖以下三个测试名和断言：`test_video_command_outputs_web_mp4_and_poster` 断言命令包含 `libx264`、`aac`、`yuv420p`、`+faststart`、`1920`，且返回 MP4 与 JPEG 路径；`test_heic_command_outputs_jpeg` 断言 HEIC 输入返回 `image/jpeg` 和 `.jpg` 文件名；`test_processing_failure_removes_temporary_outputs` 让 `subprocess.run` 抛出 `subprocess.CalledProcessError`，断言 MP4/JPEG 临时输出均不存在。

- [ ] **Step 2: 运行测试确认当前失败**

运行：

```bash
cd /Users/leexd/blog_li
/opt/anaconda3/envs/blog/bin/python manage.py test apps.upload.tests.MediaProcessingTests -v 2
```

预期：失败，因为 `apps.upload.media_processing` 和处理函数尚未实现。

- [ ] **Step 3: 实现最小媒体处理模块**

在 `media_processing.py` 中实现带中文注释的 `ProcessedMedia` 数据结构和 `process_uploaded_media(uploaded_file, file_type)`：

```python
VIDEO_EXTENSIONS = {'mp4', 'mov', 'm4v', 'webm', 'hevc'}
IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'heic', 'heif'}

# 视频统一输出 H.264/AAC MP4，避免移动端 HEVC 在浏览器中无法解码。
VIDEO_ARGUMENTS = [
    '-map', '0:v:0', '-map', '0:a?',
    '-vf', "scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',
]
```

使用参数列表调用 `subprocess.run(command, check=True, timeout=300, capture_output=True, text=True)`，禁止 `shell=True`。视频输出 `.mp4` 和首帧 `.jpg`，HEIC/HEIF 输出 `.jpg`；返回媒体临时文件、封面临时文件、处理后文件名和 MIME 类型，并提供统一的 `cleanup()`。

- [ ] **Step 4: 运行后端媒体处理测试确认通过**

运行同一个测试命令，预期 `MediaProcessingTests` 全部通过。

- [ ] **Step 5: 提交后端处理模块**

```bash
cd /Users/leexd/blog_li
git add apps/upload/media_processing.py apps/upload/tests.py
git commit -m "新增：媒体转码与封面处理"
```

### Task 2: 后端扩展模型、校验与上传接口

**Files:**

- Modify: `/Users/leexd/blog_li/apps/upload/models.py`
- Create: `/Users/leexd/blog_li/apps/upload/migrations/0004_uploadfile_poster_fields.py`
- Modify: `/Users/leexd/blog_li/apps/upload/serializers.py`
- Modify: `/Users/leexd/blog_li/apps/upload/views.py`
- Modify: `/Users/leexd/blog_li/apps/upload/tests.py`

- [ ] **Step 1: 为 `UploadFile` 添加封面字段并生成迁移**

增加以下字段，默认空字符串以兼容历史记录：

```python
poster_url = models.CharField(max_length=500, blank=True, default='')
poster_storage_backend = models.CharField(max_length=16, blank=True, default='')
poster_storage_key = models.CharField(max_length=500, blank=True, default='')
```

运行：

```bash
cd /Users/leexd/blog_li
/opt/anaconda3/envs/blog/bin/python manage.py makemigrations upload
```

确认迁移文件是 `0004_uploadfile_poster_fields.py`，不覆盖已有迁移。

- [ ] **Step 2: 先补接口校验和序列化失败测试**

在 `apps/upload/tests.py` 增加测试，断言 MOV、M4V、HEVC、HEIC、HEIF 的合法扩展名/MIME 能通过，错误格式仍返回 400；上传响应包含 `poster_url`、`file_size` 和处理后的 `content_type`。

- [ ] **Step 3: 扩展校验表和序列化字段**

在 `validate_file_type()` 与 `FileUploadSerializer` 中加入：

```python
VIDEO_EXTENSIONS = {'mp4', 'mov', 'm4v', 'avi', 'webm', 'hevc'}
VIDEO_MIME_TYPES = {'video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm', 'video/hevc'}
IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'heic', 'heif'}
IMAGE_MIME_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/heic', 'image/heif'}
```

对处理后的媒体使用处理模块返回的文件名、MIME 和大小；在 `UploadFileSerializer.Meta.fields` 现有字段列表末尾追加 `'poster_url'`。

- [ ] **Step 4: 接入临时文件处理和存储补偿**

在 `FileUploadView.post()` 中按顺序执行：验证原始文件 → `process_uploaded_media()` → 保存处理后主文件 → 保存封面文件（如果有）→ 事务写入数据库。处理失败、主文件存储失败、封面存储失败都调用 `cleanup()` 并删除已保存的对象；没有半成品记录。

视频主文件使用 `file_type='video'` 存储，封面使用 `file_type='image'` 存储；`poster_url` 通过现有 `_stable_file_url()` 生成，封面删除逻辑复用现有 storage backend。

- [ ] **Step 5: 运行后端上传测试和迁移检查**

```bash
cd /Users/leexd/blog_li
/opt/anaconda3/envs/blog/bin/python manage.py test apps.upload -v 2
/opt/anaconda3/envs/blog/bin/python manage.py check
```

预期：上传相关测试通过，Django check 无错误。

- [ ] **Step 6: 提交后端上传链路**

```bash
cd /Users/leexd/blog_li
git add apps/upload/models.py apps/upload/migrations/0004_uploadfile_poster_fields.py apps/upload/serializers.py apps/upload/views.py apps/upload/tests.py
git commit -m "支持：iPhone媒体格式与视频封面"
```

### Task 3: 前端上传响应、进度和兼容格式

**Files:**

- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/api/file.js`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/utils/upload.js`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/views/dynamics/DynamicEdit.vue`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/views/dynamics/__tests__/DynamicEditMountedInteractions.spec.js`

- [ ] **Step 1: 写前端失败测试**

增加测试覆盖：

```javascript
expect(wrapper.vm.detectMediaType({ name: 'IMG_1001.HEIC', type: 'image/heic' })).toBe('image')
expect(wrapper.vm.detectMediaType({ name: 'IMG_1001.MOV', type: 'video/quicktime' })).toBe('video')
expect(wrapper.find('.media-upload-status').text()).toContain('支持 MOV')
```

- [ ] **Step 2: 扩展上传格式识别和 Axios 进度回调**

`src/utils/upload.js` 保留原有 API，并让 `uploadFile(file, type, onProgress)` 将进度传给 `src/api/file.js`；`normalizeFileItem()` 增加 `posterUrl` 与 `poster_url` 的兼容归一化。

- [ ] **Step 3: 修改 `DynamicEdit` 上传卡片**

在 `DynamicEdit.vue` 中增加带中文注释的状态：

```javascript
const uploadState = ref({ stage: 'idle', progress: 0, message: '' })
```

状态值固定为 `idle`、`uploading`、`processing`、`success`、`error`。上传进度来自 Axios；进度达到 100% 但请求尚未返回时显示“正在优化视频”。上传卡片展示 `MOV / MP4 / HEVC · HEIC / HEIF`、大小上限和状态文本；移动端在 640px 下单列铺满。

扩展 `detectMediaType()`：MIME 优先，扩展名兜底；加入 `mov`、`m4v`、`hevc`、`heic`、`heif`。成功响应把 `poster_url` 写入 `fileList`，视频预览绑定 `poster`。

- [ ] **Step 4: 运行定向前端测试**

```bash
cd /Users/leexd/Documents/ChatGPT/blog-admin
npm test -- --runInBand src/views/dynamics/__tests__/DynamicEditMountedInteractions.spec.js
```

预期：上传入口、格式识别、封面字段和状态测试通过。

- [ ] **Step 5: 提交前端上传交互**

```bash
cd /Users/leexd/Documents/ChatGPT/blog-admin
git add src/api/file.js src/utils/upload.js src/views/dynamics/DynamicEdit.vue src/views/dynamics/__tests__/DynamicEditMountedInteractions.spec.js
git commit -m "优化：移动端媒体上传状态"
```

### Task 4: 管理端与公开博客展示封面

**Files:**

- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/views/dynamics/DynamicPreview.vue`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/views/blog/BlogDynamicDetail.vue`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/views/blog/__tests__/BlogDynamicDetailLayout.spec.js`

- [ ] **Step 1: 写封面回退测试**

断言视频元素带 `poster` 绑定，并且没有 `poster_url` 的历史媒体仍然能使用视频 URL 播放。

- [ ] **Step 2: 统一动态媒体对象归一化**

将媒体条目归一化为 `{ url, posterUrl, name, type, size }`，同时兼容旧字符串数组；视频渲染使用 `:poster="item.posterUrl || undefined"`，图片/音频保持现有行为。

- [ ] **Step 3: 优化视频展示和移动端尺寸**

为公开详情页视频增加 `preload="metadata"`、`playsinline`、圆角和稳定的宽高比容器；不自动播放、不预加载完整视频，避免移动端首屏流量浪费。

- [ ] **Step 4: 运行博客展示测试**

```bash
cd /Users/leexd/Documents/ChatGPT/blog-admin
npm test -- --runInBand src/views/blog/__tests__/BlogDynamicDetailLayout.spec.js src/views/dynamics/__tests__/DynamicEditMountedInteractions.spec.js
```

- [ ] **Step 5: 提交媒体展示**

```bash
cd /Users/leexd/Documents/ChatGPT/blog-admin
git add src/views/dynamics/DynamicPreview.vue src/views/blog/BlogDynamicDetail.vue src/views/blog/__tests__/BlogDynamicDetailLayout.spec.js
git commit -m "优化：视频封面与移动端展示"
```

### Task 5: 服务器依赖、完整验证与部署

**Files:**

- Modify: `/Users/leexd/blog_li/requirements.txt`（仅在检查后确认无需 Python 依赖时保持不变）
- Verify: `/Users/leexd/blog_li/apps/upload/media_processing.py`
- Verify: `/Users/leexd/Documents/ChatGPT/blog-admin/dist/`

- [ ] **Step 1: 安装并验证服务器 FFmpeg**

在 `root@192.3.221.53` 执行：

```bash
apt-get update
apt-get install -y ffmpeg
ffmpeg -version
ffprobe -version
```

确认 FFmpeg 包含 H.264 编码器和 HEIC 解码能力；若发行版 FFmpeg 不含 HEIC 解码，则同时安装 `libheif-examples` 并在处理模块中使用 `heif-convert`。

- [ ] **Step 2: 运行后端全量测试和迁移**

```bash
cd /Users/leexd/blog_li
/opt/anaconda3/envs/blog/bin/python manage.py migrate
/opt/anaconda3/envs/blog/bin/python manage.py test -v 2
```

- [ ] **Step 3: 运行前端全量检查**

```bash
cd /Users/leexd/Documents/ChatGPT/blog-admin
npm run check
```

预期：所有 Jest 测试通过，Vite production build 成功。

- [ ] **Step 4: 部署后端并重启服务**

将 `/Users/leexd/blog_li` 的中文提交推送到 `main`，服务器拉取对应提交，在 `/opt/anaconda3/envs/blog` 下执行迁移，重启 `blog-li.service`，检查服务为 `active`。

- [ ] **Step 5: 部署前端静态资源**

打包 `dist` 到 `/var/www/myblog-admin/releases/本次前端短提交号`，切换 `current`，执行 `nginx -t` 后 reload；实际部署时把“本次前端短提交号”替换为真实提交号，例如 `f4f2e1b`，失败时恢复上一个 release。

- [ ] **Step 6: 真实媒体验收**

使用一段 iPhone MOV/HEVC、一个 HEIC/HEIF 图片和一个普通 MP4：

1. 在移动端新建动态上传，确认状态依次显示上传中、正在优化、完成。
2. 检查接口响应主文件为 MP4，返回 `poster_url`，处理后体积小于原文件或在无法压缩时保持可用。
3. 在管理端预览和公开博客详情页播放，确认封面、横竖屏比例、声音和拖动播放正常。
4. 检查旧视频记录没有封面时仍可播放。

- [ ] **Step 7: 提交部署记录**

```bash
cd /Users/leexd/Documents/ChatGPT/blog-admin
git status --short
git log -1 --oneline
```

后端和前端均保持 `main` 干净；所有新提交信息使用中文。
