<template>
  <div class="collection-edit admin-page">
    <PageHeader
      compact
      :title="isEdit ? '编辑合集' : '新建合集'"
      :subtitle="isEdit ? '调整合集信息与章节顺序；文章本身的内容不受影响。' : '先建合集，再把相关文章按阅读顺序加进来。'"
    >
      <template #actions>
        <a-space>
          <a-button @click="goBack">取消</a-button>
          <a-button type="primary" :loading="saving" @click="handleSave">
            <template #icon><SaveOutlined /></template>
            保存
          </a-button>
        </a-space>
      </template>
    </PageHeader>

    <a-spin :spinning="loading">
      <div class="collection-edit__layout">
        <a-card class="collection-edit__form admin-table-card" title="合集信息">
          <a-form layout="vertical">
            <a-form-item label="标题" required>
              <a-input v-model:value="form.title" :maxlength="100" placeholder="例如：Java 技术文章合集" show-count />
            </a-form-item>

            <a-form-item label="简介">
              <a-textarea
                v-model:value="form.description"
                :rows="3"
                :maxlength="300"
                show-count
                placeholder="一两句话说明这条阅读路径解决什么问题"
              />
            </a-form-item>

            <a-form-item label="系列">
              <a-input v-model:value="form.series" :disabled="seriesLocked" :maxlength="50" placeholder="例如：Java与Spring" />
              <template #extra>
                <span v-if="seriesLocked">系列名由发布器自动维护，改名后发布器可能找不到这个合集。</span>
                <span v-else>可选；填写后发布器会按系列把新文章追加到合集末尾。</span>
              </template>
            </a-form-item>

            <div class="collection-edit__row">
              <a-form-item label="排序">
                <a-input-number v-model:value="form.sort" :min="0" :step="1" style="width: 100%" />
              </a-form-item>
              <a-form-item label="状态">
                <a-select v-model:value="form.status">
                  <a-select-option value="active">启用</a-select-option>
                  <a-select-option value="hidden">隐藏</a-select-option>
                </a-select>
              </a-form-item>
            </div>

            <a-form-item label="封面">
              <div class="collection-cover-editor">
                <div class="collection-cover-preview">
                  <img v-if="form.cover" :src="assetUrl(form.cover)" alt="合集封面预览" />
                  <span v-else>暂无封面</span>
                </div>
                <div class="collection-cover-actions">
                  <a-input v-model:value="form.cover" placeholder="/media/images/... 或完整地址" />
                  <a-upload
                    :show-upload-list="false"
                    accept="image/*"
                    :before-upload="handleCoverUpload"
                  >
                    <a-button :loading="uploadingCover" size="small">
                      <template #icon><UploadOutlined /></template>
                      上传图片
                    </a-button>
                  </a-upload>
                </div>
              </div>
            </a-form-item>
          </a-form>
        </a-card>

        <a-card class="collection-edit__items admin-table-card">
          <template #title>
            <div class="collection-items__title">
              <span>章节</span>
              <span class="collection-items__count">{{ items.length }} 篇</span>
            </div>
          </template>

          <div class="collection-items__search">
            <a-input
              v-model:value="searchKeyword"
              placeholder="按标题搜索已发布文章"
              allowClear
              @pressEnter="searchArticles"
            />
            <a-button type="primary" :loading="searching" @click="searchArticles">
              <template #icon><SearchOutlined /></template>
              搜索
            </a-button>
          </div>

          <div v-if="searchResults.length" class="collection-search-results">
            <div v-for="article in searchResults" :key="article.id" class="collection-search-item">
              <div class="collection-search-item__copy">
                <strong>{{ article.title }}</strong>
                <span>
                  {{ article.status === 'published' ? '已发布' : '草稿' }}
                  <template v-if="article.category?.name"> · {{ article.category.name }}</template>
                </span>
              </div>
              <a-button size="small" :disabled="hasItem(article.id)" @click="addItem(article)">
                {{ hasItem(article.id) ? '已添加' : '添加' }}
              </a-button>
            </div>
          </div>

          <div v-if="!items.length" class="collection-items__empty">
            还没有章节。搜索文章并添加，顺序就是读者的阅读顺序。
          </div>

          <ol v-else class="collection-item-list">
            <li v-for="(item, index) in items" :key="item.id" class="collection-item">
              <span class="collection-item__index">{{ String(index + 1).padStart(2, '0') }}</span>
              <div class="collection-item__copy">
                <strong>{{ item.title }}</strong>
                <span>{{ item.status === 'published' ? '已发布' : '草稿' }}</span>
              </div>
              <div class="collection-item__actions">
                <a-button type="text" size="small" :disabled="index === 0" title="上移" @click="moveItem(index, -1)">
                  <template #icon><ArrowUpOutlined /></template>
                </a-button>
                <a-button type="text" size="small" :disabled="index === items.length - 1" title="下移" @click="moveItem(index, 1)">
                  <template #icon><ArrowDownOutlined /></template>
                </a-button>
                <a-button type="text" size="small" danger title="移除" @click="removeItem(index)">
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </div>
            </li>
          </ol>
        </a-card>
      </div>
    </a-spin>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  SaveOutlined,
  SearchOutlined,
  UploadOutlined
} from '@ant-design/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import {
  createCollection,
  getAdminCollectionDetail,
  getCollectionItems,
  saveCollectionItems,
  updateCollection
} from '@/api/collections'
import { getDynamicList } from '@/api/dynamic'
import { buildApiUrl } from '@/utils/apiBaseUrl'
import { uploadImage } from '@/utils/upload'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => Boolean(route.params.id))
const loading = ref(false)
const saving = ref(false)
const uploadingCover = ref(false)
const searching = ref(false)
const searchKeyword = ref('')
const searchResults = ref([])
const items = ref([])
const originalSeries = ref('')
const seriesLocked = computed(() => Boolean(originalSeries.value))

const form = reactive({
  title: '',
  description: '',
  series: '',
  sort: 0,
  status: 'active',
  cover: ''
})

const assetUrl = (url) => buildApiUrl(url)

function hasItem(id) {
  return items.value.some((item) => item.id === id)
}

function addItem(article) {
  if (hasItem(article.id)) return
  items.value.push({
    id: article.id,
    title: article.title,
    status: article.status,
    sort: items.value.length + 1
  })
}

function removeItem(index) {
  items.value.splice(index, 1)
}

function moveItem(index, delta) {
  const target = index + delta
  if (target < 0 || target >= items.value.length) return
  const [item] = items.value.splice(index, 1)
  items.value.splice(target, 0, item)
}

async function searchArticles() {
  searching.value = true
  try {
    const { results } = await getDynamicList({
      title: searchKeyword.value.trim() || undefined,
      pageSize: 8,
      sort: 'createdAt:desc'
    })
    searchResults.value = results.filter((article) => article.status !== 'trash')
  } catch (error) {
    message.error(error?.message || '文章搜索失败')
  } finally {
    searching.value = false
  }
}

async function handleCoverUpload(file) {
  uploadingCover.value = true
  try {
    const result = await uploadImage(file)
    form.cover = result?.url || result?.fileUrl || ''
    message.success('封面上传成功')
  } catch (error) {
    message.error(error?.message || '封面上传失败')
  } finally {
    uploadingCover.value = false
  }
  return false
}

async function loadCollection(id) {
  loading.value = true
  try {
    const [detail, collectionItems] = await Promise.all([
      getAdminCollectionDetail(id),
      getCollectionItems(id)
    ])
    form.title = detail.title || ''
    form.description = detail.description || ''
    form.series = detail.series || ''
    form.sort = detail.sort || 0
    form.status = detail.status || 'active'
    form.cover = detail.cover || ''
    originalSeries.value = detail.series || ''
    items.value = (collectionItems || []).map((item, index) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      sort: item.sort ?? index + 1
    }))
  } catch (error) {
    message.error(error?.message || '合集加载失败')
    router.replace('/dashboard/collections')
  } finally {
    loading.value = false
  }
}

function validate() {
  if (!form.title.trim()) {
    message.warning('请填写合集标题')
    return false
  }
  return true
}

async function handleSave() {
  if (!validate()) return
  saving.value = true
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      series: form.series.trim(),
      sort: Number(form.sort) || 0,
      status: form.status,
      cover: form.cover.trim()
    }
    let collectionId = route.params.id
    if (collectionId) {
      await updateCollection(collectionId, payload)
    } else {
      const created = await createCollection(payload)
      collectionId = created?.id
    }
    if (!collectionId) throw new Error('合集保存失败：缺少合集 ID')

    await saveCollectionItems(
      collectionId,
      items.value.map((item) => ({ dynamicId: item.id }))
    )
    message.success('合集已保存')
    router.push('/dashboard/collections')
  } catch (error) {
    message.error(error?.message || '合集保存失败')
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push('/dashboard/collections')
}

onMounted(() => {
  if (route.params.id) loadCollection(route.params.id)
})
</script>

<style scoped>
.collection-edit__layout {
  display: grid;
  grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.collection-edit__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.collection-cover-editor {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.collection-cover-preview {
  width: 96px;
  height: 64px;
  flex: none;
  border-radius: 10px;
  overflow: hidden;
  background: var(--color-fill-1, #f4f0e8);
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--color-text-3, #9a9389);
}

.collection-cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collection-cover-actions {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.collection-cover-actions :deep(.ant-input) {
  width: 100%;
}

.collection-items__title {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.collection-items__count {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-3, #9a9389);
}

.collection-items__search {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.collection-search-results {
  margin-bottom: 16px;
  border: 1px solid var(--color-border-2, #e8e1d5);
  border-radius: 12px;
  overflow: hidden;
}

.collection-search-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
}

.collection-search-item + .collection-search-item {
  border-top: 1px solid var(--color-border-2, #f0e9de);
}

.collection-search-item__copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.collection-search-item__copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.collection-search-item__copy span {
  font-size: 12px;
  color: var(--color-text-3, #9a9389);
}

.collection-items__empty {
  padding: 40px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-3, #9a9389);
  border: 1px dashed var(--color-border-2, #e8e1d5);
  border-radius: 12px;
}

.collection-item-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.collection-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--color-border-2, #ece5d9);
  border-radius: 12px;
  background: var(--color-bg-container, #fffdf8);
}

.collection-item__index {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: var(--color-text-3, #9a9389);
}

.collection-item__copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.collection-item__copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.collection-item__copy span {
  font-size: 12px;
  color: var(--color-text-3, #9a9389);
}

.collection-item__actions {
  display: flex;
  gap: 2px;
}

@media (max-width: 1100px) {
  .collection-edit__layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
