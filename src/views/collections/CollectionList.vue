<template>
  <div class="collection-list admin-page">
    <PageHeader compact title="合集管理" subtitle="维护系列合集的封面、简介与章节顺序；隐藏的合集不会出现在拾光页。">
      <template #actions>
        <a-button type="primary" @click="goCreate">
          <template #icon><PlusOutlined /></template>
          新建合集
        </a-button>
      </template>
    </PageHeader>

    <a-form layout="inline" class="search-form admin-filter">
      <div class="search-form-left">
        <a-form-item label="名称">
          <a-input
            v-model:value="searchForm.keyword"
            placeholder="搜索合集标题或系列"
            allowClear
            @pressEnter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" placeholder="全部状态" allowClear>
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="hidden">隐藏</a-select-option>
          </a-select>
        </a-form-item>
      </div>
      <div class="search-form-right">
        <a-form-item>
          <a-space size="middle">
            <a-button type="primary" @click="handleSearch">
              <template #icon><SearchOutlined /></template>
              搜索
            </a-button>
            <a-button @click="resetSearch">
              <template #icon><ReloadOutlined /></template>
              重置
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
      empty-title="暂无合集"
      empty-description="新建一个合集，把系列文章按顺序组织起来。"
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
              <span v-else class="collection-cover__empty">无封面</span>
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
            <span v-else class="collection-muted">未关联</span>
          </template>

          <template v-else-if="column.dataIndex === 'count'">
            <span>{{ record.publishedCount }} 篇</span>
            <span v-if="record.itemCount > record.publishedCount" class="collection-muted">
              （含 {{ record.itemCount - record.publishedCount }} 篇草稿）
            </span>
          </template>

          <template v-else-if="column.dataIndex === 'status'">
            <a-tag :color="record.status === 'active' ? 'success' : 'default'">
              {{ record.status === 'active' ? '启用' : '隐藏' }}
            </a-tag>
          </template>

          <template v-else-if="column.dataIndex === 'updatedAt'">
            {{ formatDate(record.updatedAt) }}
          </template>

          <template v-else-if="column.dataIndex === 'action'">
            <a-space class="table-row-actions">
              <a-button type="text" size="small" class="row-action row-action--primary" @click="goEdit(record)">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>
              <a-popconfirm
                :title="record.itemCount ? '合集内有文章，将改为隐藏而不是删除。确定？' : '确定删除这个空合集？'"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <a-button type="text" size="small" danger class="row-action" :loading="deletingId === record.id">
                  <template #icon><DeleteOutlined /></template>
                  {{ record.itemCount ? '隐藏' : '删除' }}
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

const router = useRouter()

const assetUrl = (url) => buildApiUrl(url)

const columns = [
  { title: '封面', dataIndex: 'cover', key: 'cover', width: 96, align: 'center' },
  { title: '合集', dataIndex: 'title', key: 'title', width: 300 },
  { title: '系列', dataIndex: 'series', key: 'series', width: 150 },
  { title: '篇数', dataIndex: 'count', key: 'count', width: 130 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 76, align: 'center' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90, align: 'center' },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 150 },
  { title: '操作', dataIndex: 'action', key: 'action', width: 170, fixed: 'right' }
]

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
  showTotal: (total) => `共 ${total} 个合集`,
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
    errorMessage.value = error?.message || '合集加载失败'
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
    message.success(result?.action === 'hidden' ? '合集已隐藏' : '合集已删除')
    if (collectionList.value.length === 1 && pagination.current > 1) pagination.current -= 1
    await fetchCollections()
  } catch (error) {
    message.error(error?.message || '操作失败')
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
