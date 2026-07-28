<template>
  <div class="admin-page access-log-page">
    <PageHeader title="访问日志" subtitle="记录 API 请求来源与响应状态，快速识别异常访问。" />
    <div class="access-log-note"><info-circle-outlined /> 仅保存接口访问的 IP、路径和状态，不记录请求正文。</div>
    <a-form class="access-log-filters" layout="inline" @submit.prevent="applyFilters">
      <a-form-item label="IP"><a-input v-model:value="filters.ip" allow-clear placeholder="例如 203.0.113.8" /></a-form-item>
      <a-form-item label="状态"><a-select v-model:value="filters.status" allow-clear placeholder="全部状态" style="width: 128px"><a-select-option value="2">2xx 成功</a-select-option><a-select-option value="3">3xx 重定向</a-select-option><a-select-option value="4">4xx 客户端错误</a-select-option><a-select-option value="5">5xx 服务端错误</a-select-option></a-select></a-form-item>
      <a-form-item label="路径"><a-input v-model:value="filters.path" allow-clear placeholder="例如 /api/stats" /></a-form-item>
      <a-button type="primary" html-type="submit">筛选</a-button><a-button @click="resetFilters">重置</a-button>
    </a-form>
    <DataTable :data="logs" :columns="columns" :loading="loading" row-key="id">
      <template #status_code="{ row }"><a-tag :color="row.status_code < 400 ? 'success' : 'error'">{{ row.status_code }}</a-tag></template>
      <template #created_at="{ row }">{{ formatDate(row.created_at) }}</template>
    </DataTable>
    <Pagination :total="total" :current-page="page" :page-size="pageSize" @current-change="changePage" @size-change="changeSize" />
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { InfoCircleOutlined } from '@ant-design/icons-vue'
import { getAccessLogList } from '@/api/accessLog'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import PageHeader from '@/components/common/PageHeader.vue'
const columns = [
  { label: '访问时间', prop: 'created_at', slot: 'created_at', width: '180px' }, { label: 'IP 地址', prop: 'ip_address', width: '150px' },
  { label: '方法', prop: 'method', width: '90px' }, { label: '请求路径', prop: 'path' }, { label: '状态', prop: 'status_code', slot: 'status_code', width: '90px' }, { label: '用户', prop: 'username', width: '130px' }
]
const logs = ref([]); const loading = ref(false); const total = ref(0); const page = ref(1); const pageSize = ref(20)
const filters = ref({ ip: '', status: undefined, path: '' })
const formatDate = (value) => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-'
async function load() { loading.value = true; try { const params = Object.fromEntries(Object.entries(filters.value).filter(([, value]) => value)); const response = await getAccessLogList({ page: page.value, pageSize: pageSize.value, ...params }); logs.value = response?.data?.list || []; total.value = response?.data?.total || 0 } catch (error) { message.error(error?.message || '访问日志加载失败') } finally { loading.value = false } }
function applyFilters() { page.value = 1; load() }
function resetFilters() { filters.value = { ip: '', status: undefined, path: '' }; applyFilters() }
function changePage(value) { page.value = value; load() }
function changeSize(value) { pageSize.value = value; page.value = 1; load() }
onMounted(load)
</script>
<style scoped>
.access-log-note { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border: 1px solid #dbe5ff; border-radius: 10px; background: #f6f8ff; color: #52617a; font-size: 13px; }
.access-log-filters { padding: 14px; border: 1px solid var(--color-border); border-radius: 12px; background: #fff; }
</style>
