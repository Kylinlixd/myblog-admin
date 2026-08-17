# Automatic Dynamic Media Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the manual dynamic type selector and derive the legacy type field from selected attachments.

**Architecture:** `DynamicEdit.vue` becomes attachment-first: one upload control and one file-library workflow handle all supported file types. The client derives the legacy `type` before saving, while the Django serializer derives it again from `fileIds` to prevent mismatched direct API requests. Detail media objects include file IDs so edits preserve existing associations.

**Tech Stack:** Vue 3, Ant Design Vue, Jest, Django REST Framework.

---

### Task 1: Lock down backend type derivation

**Files:**
- Modify: `/Users/leexd/Documents/ChatGPT/blog_li/apps/dynamic/tests.py`
- Modify: `/Users/leexd/Documents/ChatGPT/blog_li/apps/dynamic/serializers.py`

- [ ] **Step 1: Write the failing API test**

```python
def test_create_derives_type_and_returns_file_ids(self):
    image = UploadFile.objects.create(
        name='cover.png', file_type='image', file_size=3,
        file_url='/api/upload/public/1/', uploader=self.user, is_public=True,
    )
    self.client.force_authenticate(self.user)
    response = self.client.post('/api/dynamics/', {
        'title': '自动类型', 'content': '', 'type': 'video', 'status': 'draft',
        'mediaUrls': [image.file_url], 'fileIds': [image.pk],
    }, format='json')
    created = Dynamic.objects.get(pk=response.data['data']['id'])
    self.assertEqual(created.type, 'image')
```

Also extend the existing detail-media assertion with `id: image.pk`.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `/opt/anaconda3/envs/blog/bin/python manage.py test apps.dynamic.tests.DynamicAPITests.test_create_derives_type_and_returns_file_ids -v 2`

Expected: failure because the submitted `video` value is stored and media objects omit `id`.

- [ ] **Step 3: Add the minimal serializer helpers**

```python
def _dynamic_type_for_file_ids(file_ids):
    files = UploadFile.objects.in_bulk(file_ids)
    for file_id in file_ids:
        file = files.get(file_id)
        if file and file.file_type in {'image', 'audio', 'video'}:
            return file.file_type
        return 'text'
    return 'text'
```

Include `id: file.pk` in `_media_urls`. In `DynamicCreateSerializer.create` and `update`, when `fileIds` is supplied, set `validated_data['type']` to the helper result before saving.

- [ ] **Step 4: Run backend tests**

Run: `/opt/anaconda3/envs/blog/bin/python manage.py test apps.dynamic.tests -v 1 && /opt/anaconda3/envs/blog/bin/python manage.py check`

Expected: all dynamic tests pass and Django reports no system-check issues.

### Task 2: Make the editor attachment-first

**Files:**
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/views/dynamics/DynamicEdit.vue`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/views/dynamics/__tests__/DynamicEditMountedInteractions.spec.js`
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/src/views/dynamics/__tests__/DynamicEditFileSelector.spec.js`

- [ ] **Step 1: Write failing editor tests**

```js
it('uses one attachment area instead of a manual content type choice', async () => {
  const wrapper = await mountEditor()
  expect(wrapper.find('[label="内容类型"]').exists()).toBe(false)
  expect(wrapper.find('.media-upload-field').text()).toContain('添加附件')
})

it('keeps mixed selected files and derives the compatibility type', async () => {
  const wrapper = mountEditor()
  wrapper.vm.selectedFiles = [
    { id: 7, name: 'cover.png', type: 'image', url: '/media/cover.png' },
    { id: 8, name: 'voice.mp3', type: 'audio', url: '/media/voice.mp3' }
  ]
  wrapper.vm.handleFileConfirm()
  expect(wrapper.vm.form.fileIds).toEqual([7, 8])
  expect(wrapper.vm.form.type).toBe('image')
})
```

- [ ] **Step 2: Run focused Jest tests and verify they fail**

Run: `npm test -- --runInBand src/views/dynamics/__tests__/DynamicEditMountedInteractions.spec.js src/views/dynamics/__tests__/DynamicEditFileSelector.spec.js`

Expected: failure because the selector remains and mixed types are rejected.

- [ ] **Step 3: Replace type-driven controls with one attachment control**

Use a single `a-upload` accepting image/audio/video extensions, dispatch uploads using `detectMediaType(file)`, and keep every successful upload. Remove the type-change watcher, the type form rule, and same-type selection validation. Add a `syncDynamicType()` helper that uses the first attached file type (otherwise `text`) after hydration, upload, removal, or file-library confirmation.

- [ ] **Step 4: Preserve existing file associations on edit**

When loading details, use each media object's `id` to populate `form.fileIds`; retain its `type` in `fileList`. Send the derived compatibility type only as an API compatibility field.

- [ ] **Step 5: Run focused Jest tests**

Run: `npm test -- --runInBand src/views/dynamics/__tests__/DynamicEditMountedInteractions.spec.js src/views/dynamics/__tests__/DynamicEditFileSelector.spec.js src/views/dynamics/__tests__/DynamicEditNormalizedResponses.spec.js`

Expected: all selected suites pass.

### Task 3: Verify and release

**Files:**
- Modify: `/Users/leexd/Documents/ChatGPT/blog-admin/docs/superpowers/plans/2026-08-17-automatic-dynamic-media-type.md`

- [ ] **Step 1: Run complete verification**

Run backend: `/opt/anaconda3/envs/blog/bin/python manage.py test apps.dynamic.tests -v 1 && /opt/anaconda3/envs/blog/bin/python manage.py check`

Run frontend from a clean dependency directory: `npm ci && npm test -- --runInBand --forceExit && npm run build`

Expected: backend tests and system check pass; all Jest suites pass; Vite exits 0.

- [ ] **Step 2: Commit and deploy**

Commit the backend serializer and test changes with `fix: infer dynamic type from attachments`. Commit the frontend editor and test changes with `fix: simplify dynamic media editor`. Push both `main` branches. Archive only tracked backend source and the verified frontend `dist`, upload them, run the existing backend virtualenv's `manage.py check`, restart `blog-li`, atomically update `/var/www/myblog-admin/current`, and reload Nginx. Do not install, upgrade, or alter server environment packages.
