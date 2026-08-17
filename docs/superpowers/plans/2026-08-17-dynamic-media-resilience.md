# Dynamic Media Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every attached dynamic media item render consistently and degrade locally when its source cannot be read.

**Architecture:** Django emits one object-shaped `mediaUrls` contract from actual attachments, with legacy URL records normalized only when no attachment exists. Vue renders each item by its own file type and stores only failed item URLs, so a 404/503 never affects the dynamic API request, body, or sibling media.

**Tech Stack:** Django REST Framework, Vue 3 Composition API, Jest, Django test runner.

---

### Task 1: Normalize server media responses

**Files:**
- Modify: `apps/dynamic/serializers.py`
- Modify: `apps/dynamic/tests.py`

- [ ] **Step 1: Write failing API tests**

```python
def test_public_media_uses_attached_file_objects(self):
    image = UploadFile.objects.create(name='cover.png', file_type='image', file_size=3,
        file_url='/api/upload/public/1/', uploader=self.user, is_public=True)
    self.published.files.add(image)
    response = self.client.get(f'/api/blog/dynamics/{self.published.pk}/')
    self.assertEqual(response.data['data']['mediaUrls'][0]['url'], image.file_url)
    self.assertEqual(response.data['data']['mediaUrls'][0]['type'], 'image')

def test_public_media_keeps_legacy_urls_when_no_file_is_attached(self):
    self.published.type = 'audio'
    self.published.media_urls = ['/media/legacy.mp3']
    self.published.save()
    response = self.client.get(f'/api/blog/dynamics/{self.published.pk}/')
    self.assertEqual(response.data['data']['mediaUrls'], [{'url': '/media/legacy.mp3', 'type': 'audio'}])
```

- [ ] **Step 2: Run the two tests and verify they fail against the old serializer**

Run: `python3 manage.py test apps.dynamic.tests.DynamicAPITests -v 2`

- [ ] **Step 3: Add one private serializer helper and use it for detail and list serializers**

```python
def _media_urls(obj):
    files = list(obj.files.all())
    if files:
        return [{'url': file.file_url, 'type': file.file_type, 'name': file.name,
                 'size': file.file_size, 'poster_url': file.poster_url} for file in files]
    return [{'url': url, 'type': obj.type} for url in obj.media_urls if url]
```

- [ ] **Step 4: Re-run the Django media tests and full dynamic test module**

Run: `python3 manage.py test apps.dynamic.tests -v 2`

### Task 2: Render public media by item type with local fallback

**Files:**
- Modify: `src/views/blog/BlogDynamic.vue`
- Modify: `src/views/blog/BlogDynamicDetail.vue`
- Modify: `src/views/blog/__tests__/BlogDynamicDetailLayout.spec.js`

- [ ] **Step 1: Write failing component assertions**

```javascript
expect(source).toContain("item.type === 'image'")
expect(source).toContain('@error="markMediaUnavailable(item.url)"')
expect(source).toContain('该媒体已不可用')
```

- [ ] **Step 2: Run the focused Jest test and verify the assertions fail**

Run: `npm test -- --runInBand src/views/blog/__tests__/BlogDynamicDetailLayout.spec.js`

- [ ] **Step 3: Normalize list/detail objects and use `img`, `audio`, `video`, or a download link by `item.type`**

```javascript
const unavailableMedia = ref(new Set())
const markMediaUnavailable = (url) => unavailableMedia.value.add(url)
const isMediaUnavailable = (url) => unavailableMedia.value.has(url)
```

`@error` changes only the failed item's card. Video poster failures do not mark the playable video unavailable.

- [ ] **Step 4: Re-run focused public component tests**

Run: `npm test -- --runInBand src/views/blog/__tests__/BlogDynamicDetailLayout.spec.js`

### Task 3: Apply the same resilience to the admin dynamic preview

**Files:**
- Modify: `src/views/dynamics/DynamicPreview.vue`
- Modify: `src/views/dynamics/__tests__/DynamicPreviewMountedInteractions.spec.js`

- [ ] **Step 1: Add a failing assertion for the unavailable state and media error handler**

```javascript
expect(source).toContain('markMediaUnavailable')
expect(source).toContain('该媒体已不可用')
```

- [ ] **Step 2: Run the focused Jest test and verify it fails**

Run: `npm test -- --runInBand src/views/dynamics/__tests__/DynamicPreviewMountedInteractions.spec.js`

- [ ] **Step 3: Add per-item error handling and generic-file download rendering without new dependencies**

```vue
<div v-if="isMediaUnavailable(item.url)" class="media-unavailable">该媒体已不可用</div>
<audio v-else-if="item.type === 'audio'" @error="markMediaUnavailable(item.url)" />
```

- [ ] **Step 4: Re-run the focused test**

Run: `npm test -- --runInBand src/views/dynamics/__tests__/DynamicPreviewMountedInteractions.spec.js`

### Task 4: Validate and release

**Files:**
- Modify: no additional source files

- [ ] **Step 1: Run full backend and frontend gates**

Run: `python3 manage.py test && python3 manage.py check` in `blog_li`; `npm run check` in `blog-admin`.

- [ ] **Step 2: Commit each repository, push `main`, and back up the existing server application directory**

Run: `git add ... && git commit ... && git push origin main`; remotely create a timestamped tar backup before copying both checked revisions.

- [ ] **Step 3: Deploy and verify production**

Run: install backend requirements only if changed, run `manage.py check`, restart `blog-li`, build admin, atomically publish the built assets, validate Nginx, reload it, then request public dynamics and media endpoints.
