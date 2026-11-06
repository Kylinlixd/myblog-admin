<template>
  <div class="collection-edit admin-page">
    <PageHeader
      compact
      :title="isEdit ? t('collectionMgr.editTitle') : t('collectionMgr.createTitle')"
      :subtitle="isEdit ? t('collectionMgr.editSubtitle') : t('collectionMgr.createSubtitle')"
    >
      <template #actions>
        <a-space>
          <a-button @click="goBack">{{ t('adminShared.cancel') }}</a-button>
          <a-button type="primary" :loading="saving" @click="handleSave">
            <template #icon><SaveOutlined /></template>
            {{ t('adminShared.save') }}
          </a-button>
        </a-space>
      </template>
    </PageHeader>

    <a-spin :spinning="loading">
      <div class="collection-edit__layout">
        <a-card class="collection-edit__form admin-table-card" :title="t('collectionMgr.formTitle')">
          <a-form layout="vertical">
            <a-form-item :label="t('adminShared.title')" required>
              <a-input v-model:value="form.title" :maxlength="100" :placeholder="t('collectionMgr.titlePlaceholder')" show-count />
            </a-form-item>

            <a-form-item :label="t('collectionMgr.introLabel')">
              <a-textarea
                v-model:value="form.description"
                :rows="3"
                :maxlength="300"
                show-count
                :placeholder="t('collectionMgr.introPlaceholder')"
              />
            </a-form-item>

            <a-form-item :label="t('collectionMgr.column.series')">
              <a-input v-model:value="form.series" :disabled="seriesLocked" :maxlength="50" placeholder="Java · Spring" />
              <template #extra>
                <span v-if="seriesLocked">{{ t('collectionMgr.seriesLockedHint') }}</span>
                <span v-else>{{ t('collectionMgr.seriesHint') }}</span>
              </template>
            </a-form-item>

            <div class="collection-edit__row">
              <a-form-item :label="t('categoryMgr.column.sort')">
                <a-input-number v-model:value="form.sort" :min="0" :step="1" style="width: 100%" />
              </a-form-item>
              <a-form-item :label="t('adminShared.status')">
                <a-select v-model:value="form.status">
                  <a-select-option value="active">{{ t('adminShared.status.active') }}</a-select-option>
                  <a-select-option value="hidden">{{ t('adminShared.status.hidden') }}</a-select-option>
                </a-select>
              </a-form-item>
            </div>

            <a-form-item :label="t('collectionMgr.coverLabel')">
              <div class="collection-cover-editor">
                <div class="collection-cover-preview">
                  <img v-if="form.cover" :src="assetUrl(form.cover)" :alt="t('collectionMgr.coverPreviewAlt')" />
                  <span v-else>{{ t('collectionMgr.noCoverYet') }}</span>
                </div>
                <div class="collection-cover-actions">
                  <a-input v-model:value="form.cover" :placeholder="t('collectionMgr.coverPlaceholder')" />
                  <a-upload
                    :show-upload-list="false"
                    accept="image/*"
                    :before-upload="handleCoverUpload"
                  >
                    <a-button :loading="uploadingCover" size="small">
                      <template #icon><UploadOutlined /></template>
                      {{ t('collectionMgr.uploadCover') }}
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
              <span>{{ t('collectionMgr.sectionChapters') }}</span>
              <span class="collection-items__count">{{ items.length }} {{ t('dashboard.unit.pieces') }}</span>
            </div>
          </template>

          <div class="collection-items__search">
            <a-input
              v-model:value="searchKeyword"
              :placeholder="t('collectionMgr.searchArticles')"
              allowClear
              @pressEnter="searchArticles"
            />
            <a-button type="primary" :loading="searching" @click="searchArticles">
              <template #icon><SearchOutlined /></template>
              {{ t('component.search') }}
            </a-button>
          </div>

          <div v-if="searchResults.length" class="collection-search-results">
            <div v-for="article in searchResults" :key="article.id" class="collection-search-item">
              <div class="collection-search-item__copy">
                <strong>{{ article.title }}</strong>
                <span>
                  {{ article.status === 'published' ? t('dynamicMgr.status.published') : t('dynamicMgr.status.draft') }}
                  <template v-if="article.category?.name"> · {{ article.category.name }}</template>
                </span>
              </div>
              <a-button size="small" :disabled="hasItem(article.id)" @click="addItem(article)">
                {{ hasItem(article.id) ? t('collectionMgr.added') : t('collectionMgr.add') }}
              </a-button>
            </div>
          </div>

          <div v-if="!items.length" class="collection-items__empty">
            {{ t('collectionMgr.chaptersEmpty') }}
          </div>

          <ol v-else class="collection-item-list">
            <li v-for="(item, index) in items" :key="item.id" class="collection-item">
              <span class="collection-item__index">{{ String(index + 1).padStart(2, '0') }}</span>
              <div class="collection-item__copy">
                <strong>{{ item.title }}</strong>
                <span>{{ item.status === 'published' ? t('dynamicMgr.status.published') : t('dynamicMgr.status.draft') }}</span>
              </div>
              <div class="collection-item__actions">
                <a-button type="text" size="small" :disabled="index === 0" :title="t('collectionMgr.moveUp')" @click="moveItem(index, -1)">
                  <template #icon><ArrowUpOutlined /></template>
                </a-button>
                <a-button type="text" size="small" :disabled="index === items.length - 1" :title="t('collectionMgr.moveDown')" @click="moveItem(index, 1)">
                  <template #icon><ArrowDownOutlined /></template>
                </a-button>
                <a-button type="text" size="small" danger :title="t('collectionMgr.remove')" @click="removeItem(index)">
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
import { t } from '@/i18n'

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
    message.error(error?.message || t('collectionMgr.articleSearchFailed'))
  } finally {
    searching.value = false
  }
}

async function handleCoverUpload(file) {
  uploadingCover.value = true
  try {
    const result = await uploadImage(file)
    form.cover = result?.url || result?.fileUrl || ''
    message.success(t('collectionMgr.coverUploadSuccess'))
  } catch (error) {
    message.error(error?.message || t('collectionMgr.coverUploadFailed'))
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
    message.error(error?.message || t('collectionMgr.loadFailed'))
    router.replace('/dashboard/collections')
  } finally {
    loading.value = false
  }
}

function validate() {
  if (!form.title.trim()) {
    message.warning(t('collectionMgr.titleRequired'))
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
    if (!collectionId) throw new Error(t('collectionMgr.saveMissingId'))

    await saveCollectionItems(
      collectionId,
      items.value.map((item) => ({ dynamicId: item.id }))
    )
    message.success(t('collectionMgr.saved'))
    router.push('/dashboard/collections')
  } catch (error) {
    message.error(error?.message || t('collectionMgr.saveFailed'))
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
