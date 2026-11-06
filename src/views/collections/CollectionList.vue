<template>
  <div class="collection-list admin-page">
    <PageHeader compact :title="t('shell.menu.collections')" :subtitle="t('collectionMgr.subtitle')">
      <template #actions>
        <a-button type="primary" @click="goCreate">
          <template #icon><PlusOutlined /></template>
          {{ t('collectionMgr.create') }}
        </a-button>
      </template>
    </PageHeader>

    <a-form layout="inline" class="search-form admin-filter">
      <div class="search-form-left">
        <a-form-item :label="t('adminShared.nameLabel')">
          <a-input
            v-model:value="searchForm.keyword"
            :placeholder="t('collectionMgr.searchPlaceholder')"
            allowClear
            @pressEnter="handleSearch"
          />
        </a-form-item>
        <a-form-item :label="t('adminShared.status')">
          <a-select v-model:value="searchForm.status" :placeholder="t('adminShared.allStatus')" allowClear>
            <a-select-option value="active">{{ t('adminShared.status.active') }}</a-select-option>
            <a-select-option value="hidden">{{ t('adminShared.status.hidden') }}</a-select-option>
          </a-select>
        </a-form-item>
      </div>
      <div class="search-form-right">
        <a-form-item>
          <a-space size="middle">
            <a-button type="primary" @click="handleSearch">
              <template #icon><SearchOutlined /></template>
              {{ t('component.search') }}
            </a-button>
            <a-button @click="resetSearch">
              <template #icon><ReloadOutlined /></template>
              {{ t('component.reset') }}
            </a-button>
          </a-space>
        </a-form-item>
      </div>
    </a-form>

    <AsyncState
      v-if="loading || errorMessage || !collectionList.length"
      data-testid="collection-async-state"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage"
      :empty-title="t('collectionMgr.empty')"
      :empty-description="t('collectionMgr.emptyHint')"
      @retry="fetchCollections"
    />

    <a-card v-else class="admin-table-card">
      <a-table
        :columns="columns"
        :data-source="collectionList"
        :loading="loading"
        :pagination="pagination"
        :row-key="(record) => record.id"
        :scroll="{ x: 940 }"
        class="responsive-table"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'cover'">
            <div class="collection-cover">
              <img v-if="record.cover" :src="assetUrl(record.cover)" :alt="record.title" loading="lazy" />
              <span v-else class="collection-cover__empty">{{ t('collectionMgr.noCover') }}</span>
            </div>
          </template>

          <template v-else-if="column.dataIndex === 'title'">
            <div class="collection-title">
              <strong>{{ record.title }}</strong>
              <span v-if="record.description">{{ record.description }}</span>
            </div>
          </template>

          <template v-else-if="column.dataIndex === 'series'">
            <span v-if="record.series" class="collection-series">{{ record.series }}</span>
            <span v-else class="collection-muted">{{ t('collectionMgr.notLinked') }}</span>
          </template>

          <template v-else-if="column.dataIndex === 'count'">
            <span>{{ record.publishedCount }} {{ t('dashboard.unit.pieces') }}</span>
            <span v-if="record.itemCount > record.publishedCount" class="collection-muted">
              {{ t('collectionMgr.draftCount', { n: record.itemCount - record.publishedCount }) }}
            </span>
          </template>

          <template v-else-if="column.dataIndex === 'status'">
            <a-tag :color="record.status === 'active' ? 'success' : 'default'">
              {{ record.status === 'active' ? t('adminShared.status.active') : t('adminShared.status.hidden') }}
            </a-tag>
          </template>

          <template v-else-if="column.dataIndex === 'updatedAt'">
            {{ formatDate(record.updatedAt) }}
          </template>

          <template v-else-if="column.dataIndex === 'action'">
            <a-space class="table-row-actions">
              <a-button type="text" size="small" class="row-action row-action--primary" @click="goEdit(record)">
                <template #icon><EditOutlined /></template>
                {{ t('adminShared.edit') }}
              </a-button>
              <a-popconfirm
                :title="record.itemCount ? t('collectionMgr.deleteConfirmWithItems') : t('collectionMgr.deleteEmptyConfirm')"
                :ok-text="t('adminShared.confirm')"
                :cancel-text="t('adminShared.cancel')"
                @confirm="handleDelete(record)"
              >
                <a-button type="text" size="small" danger class="row-action" :loading="deletingId === record.id">
                  <template #icon><DeleteOutlined /></template>
                  {{ record.itemCount ? t('adminShared.status.hidden') : t('adminShared.delete') }}
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import AsyncState from '@/components/common/AsyncState.vue'
import { deleteCollection, getAdminCollectionList } from '@/api/collections'
import { buildApiUrl } from '@/utils/apiBaseUrl'
import { t } from '@/i18n'

const router = useRouter()

const assetUrl = (url) => buildApiUrl(url)

const columns = computed(() => [
  { title: t('collectionMgr.column.cover'), dataIndex: 'cover', key: 'cover', width: 96, align: 'center' },
  { title: t('collectionMgr.column.title'), dataIndex: 'title', key: 'title', width: 300 },
  { title: t('collectionMgr.column.series'), dataIndex: 'series', key: 'series', width: 150 },
  { title: t('collectionMgr.column.count'), dataIndex: 'count', key: 'count', width: 130 },
  { title: t('categoryMgr.column.sort'), dataIndex: 'sort', key: 'sort', width: 76, align: 'center' },
  { title: t('adminShared.status'), dataIndex: 'status', key: 'status', width: 90, align: 'center' },
  { title: t('adminShared.updateTime'), dataIndex: 'updatedAt', key: 'updatedAt', width: 150 },
  { title: t('adminShared.actions'), dataIndex: 'action', key: 'action', width: 170, fixed: 'right' }
])

const collectionList = ref([])
const loading = ref(false)
const errorMessage = ref('')
const deletingId = ref(null)

const searchForm = reactive({ keyword: '', status: undefined })

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => t('collectionMgr.totalItems', { n: total }),
  onChange: (page, pageSize) => {
    pagination.current = pageSize !== pagination.pageSize ? 1 : page
    pagination.pageSize = pageSize
    fetchCollections()
  }
})

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function fetchCollections() {
  loading.value = true
  errorMessage.value = ''
  try {
    const { count, results } = await getAdminCollectionList({
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined
    })
    collectionList.value = results
    pagination.total = count
  } catch (error) {
    errorMessage.value = error?.message || t('collectionMgr.loadFailed')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  fetchCollections()
}

function resetSearch() {
  searchForm.keyword = ''
  searchForm.status = undefined
  pagination.current = 1
  fetchCollections()
}

function handleTableChange() {
  // 翻页由 pagination.onChange 统一处理，排序暂由后端 sort 字段决定。
}

async function handleDelete(record) {
  deletingId.value = record.id
  try {
    const result = await deleteCollection(record.id)
    message.success(result?.action === 'hidden' ? t('collectionMgr.hiddenSuccess') : t('collectionMgr.deleteSuccess'))
    if (collectionList.value.length === 1 && pagination.current > 1) pagination.current -= 1
    await fetchCollections()
  } catch (error) {
    message.error(error?.message || t('adminShared.operationFailed'))
  } finally {
    deletingId.value = null
  }
}

function goCreate() {
  router.push('/dashboard/collections/create')
}

function goEdit(record) {
  router.push(`/dashboard/collections/edit/${record.id}`)
}

onMounted(fetchCollections)
</script>

<style scoped>
.collection-cover {
  width: 68px;
  height: 44px;
  margin: 0 auto;
  border-radius: 10px;
  overflow: hidden;
  background: var(--color-fill-1, #f5f2ec);
  display: grid;
  place-items: center;
}

.collection-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collection-cover__empty {
  font-size: 11px;
  color: var(--color-text-3, #9a9389);
}

.collection-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.collection-title strong {
  font-weight: 600;
  color: var(--color-text-1, #2d2a25);
}

.collection-title span {
  font-size: 12px;
  color: var(--color-text-3, #8c857b);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 290px;
}

.collection-series {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-fill-1, #f3efe7);
  color: var(--color-text-2, #6f675d);
}

.collection-muted {
  font-size: 12px;
  color: var(--color-text-3, #9a9389);
}
</style>
