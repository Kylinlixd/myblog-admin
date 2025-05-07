<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <i class="icon-folder"></i>
          <h3>分类总数</h3>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.categoryCount }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <i class="icon-collection"></i>
          <h3>标签总数</h3>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.tagCount }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <i class="icon-view"></i>
          <h3>总浏览量</h3>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalViews }}</div>
        </div>
      </div>
    </div>
    
    <!-- 性能监控面板 -->
    <div class="performance-panel">
      <h2>性能监控</h2>
      <div class="performance-grid">
        <div class="performance-card">
          <h3>页面加载时间</h3>
          <div class="performance-chart">
            <canvas ref="loadTimeChart"></canvas>
          </div>
          <div class="performance-stats">
            <div class="stat-item">
              <span>平均加载时间</span>
              <span>{{ performanceStats.avgLoadTime }}ms</span>
            </div>
            <div class="stat-item">
              <span>最大加载时间</span>
              <span>{{ performanceStats.maxLoadTime }}ms</span>
            </div>
          </div>
        </div>
        
        <div class="performance-card">
          <h3>资源加载</h3>
          <div class="performance-chart">
            <canvas ref="resourceChart"></canvas>
          </div>
          <div class="performance-stats">
            <div class="stat-item">
              <span>图片加载时间</span>
              <span>{{ performanceStats.avgImageLoadTime }}ms</span>
            </div>
            <div class="stat-item">
              <span>API响应时间</span>
              <span>{{ performanceStats.avgApiResponseTime }}ms</span>
            </div>
          </div>
        </div>
        
        <div class="performance-card">
          <h3>内存使用</h3>
          <div class="performance-chart">
            <canvas ref="memoryChart"></canvas>
          </div>
          <div class="performance-stats">
            <div class="stat-item">
              <span>当前内存使用</span>
              <span>{{ performanceStats.currentMemory }}MB</span>
            </div>
            <div class="stat-item">
              <span>峰值内存使用</span>
              <span>{{ performanceStats.peakMemory }}MB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Chart from 'chart.js/auto'
import request from '../utils/request'
import { useAppStore } from '../stores/app'
import { message } from 'ant-design-vue'

// 应用状态
const appStore = useAppStore()
const loading = ref(true)

// 统计数据
const stats = ref({
  categoryCount: 0,
  tagCount: 0,
  totalViews: 0
})

// 性能统计数据
const performanceStats = ref({
  avgLoadTime: 0,
  maxLoadTime: 0,
  avgImageLoadTime: 0,
  avgApiResponseTime: 0,
  currentMemory: 0,
  peakMemory: 0
})

// 图表引用
const loadTimeChart = ref(null)
const resourceChart = ref(null)
const memoryChart = ref(null)

// 图表实例
let loadTimeChartInstance = null
let resourceChartInstance = null
let memoryChartInstance = null

// 获取统计数据
const getStats = async () => {
  try {
    const res = await request.get('/api/stats/')
    console.log('仪表盘统计数据响应:', res);
    
    if (res.code === 200 && res.data) {
      // 从 data.total 中获取各项统计数据
      const { total } = res.data;
      stats.value = {
        categoryCount: total?.categories || 0,
        tagCount: total?.tags || 0,
        totalViews: total?.dynamics || 0
      };
      
      // 更新分类和标签数据
      if (res.data.categories) {
        appStore.setCategories(res.data.categories);
      }
      if (res.data.tags) {
        appStore.setTags(res.data.tags);
      }
      
      console.log('更新后的统计数据:', stats.value);
    } else {
      throw new Error(res.message || '获取统计数据失败');
    }
  } catch (error) {
    console.error('获取统计数据失败:', error);
    // 只在第一次失败时显示错误提示
    if (!stats.value.categoryCount && !stats.value.tagCount && !stats.value.totalViews) {
      message.error('获取统计数据失败: ' + (error.response?.data?.message || error.message || '未知错误'));
    }
  }
}

// 加载所有数据
const loadAllData = async () => {
  // 设置加载状态
  loading.value = true
  
  // 显示仪表盘加载状态
  appStore.startLoading('加载仪表盘数据...')
  
  try {
    // 获取统计数据
    await getStats()
    
    // 数据加载完成后，结束加载状态
    setTimeout(() => {
      loading.value = false
      appStore.endLoading()
    }, 500)
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    
    // 设置错误状态
    appStore.setLoadingError(error.response?.data?.message || error.message || '加载仪表盘数据失败')
    loading.value = false
    
    // 只在第一次加载失败时显示错误提示
    if (!stats.value.categoryCount && 
        !stats.value.tagCount && 
        !stats.value.totalViews) {
      message.error({
        content: '加载仪表盘数据失败: ' + (error.response?.data?.message || error.message || '未知错误'),
        duration: 5000
      })
    }
  }
}

// 添加自动重试机制
const retryLoadData = async (maxRetries = 3, delay = 2000) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await loadAllData();
      return; // 成功则退出
    } catch (error) {
      retries++;
      if (retries < maxRetries) {
        console.log(`第 ${retries} 次重试加载数据...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

// 初始化性能监控
const initPerformanceMonitoring = () => {
  // 初始化图表
  initCharts()
  
  // 开始性能监控
  startPerformanceMonitoring()
}

// 初始化图表
const initCharts = () => {
  // 加载时间图表
  if (loadTimeChart.value) {
    loadTimeChartInstance = new Chart(loadTimeChart.value, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: '页面加载时间',
          data: [],
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    })
  }
  
  // 资源加载图表
  if (resourceChart.value) {
    resourceChartInstance = new Chart(resourceChart.value, {
      type: 'bar',
      data: {
        labels: ['图片', 'API'],
        datasets: [{
          label: '加载时间',
          data: [0, 0],
          backgroundColor: [
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 99, 132, 0.5)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    })
  }
  
  // 内存使用图表
  if (memoryChart.value) {
    memoryChartInstance = new Chart(memoryChart.value, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: '内存使用',
          data: [],
          borderColor: 'rgb(153, 102, 255)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    })
  }
}

// 开始性能监控
const startPerformanceMonitoring = () => {
  // 监控页面加载时间
  if (window.performance) {
    const timing = window.performance.timing
    const loadTime = timing.loadEventEnd - timing.navigationStart
    performanceStats.value.avgLoadTime = loadTime
    performanceStats.value.maxLoadTime = loadTime
    
    // 更新图表
    if (loadTimeChartInstance) {
      const now = new Date().toLocaleTimeString()
      loadTimeChartInstance.data.labels.push(now)
      loadTimeChartInstance.data.datasets[0].data.push(loadTime)
      
      // 保持最近10个数据点
      if (loadTimeChartInstance.data.labels.length > 10) {
        loadTimeChartInstance.data.labels.shift()
        loadTimeChartInstance.data.datasets[0].data.shift()
      }
      
      loadTimeChartInstance.update()
    }
  }
  
  // 监控资源加载
  if (window.performance && window.performance.getEntriesByType) {
    const resources = window.performance.getEntriesByType('resource')
    const imageLoadTime = resources
      .filter(r => r.initiatorType === 'img')
      .reduce((acc, curr) => acc + curr.duration, 0) / resources.filter(r => r.initiatorType === 'img').length || 0
    
    const apiLoadTime = resources
      .filter(r => r.initiatorType === 'xmlhttprequest' || r.initiatorType === 'fetch')
      .reduce((acc, curr) => acc + curr.duration, 0) / resources.filter(r => r.initiatorType === 'xmlhttprequest' || r.initiatorType === 'fetch').length || 0
    
    performanceStats.value.avgImageLoadTime = Math.round(imageLoadTime)
    performanceStats.value.avgApiResponseTime = Math.round(apiLoadTime)
    
    // 更新图表
    if (resourceChartInstance) {
      resourceChartInstance.data.datasets[0].data = [imageLoadTime, apiLoadTime]
      resourceChartInstance.update()
    }
  }
  
  // 监控内存使用
  if (window.performance && window.performance.memory) {
    const memory = window.performance.memory
    const usedMemory = Math.round(memory.usedJSHeapSize / 1024 / 1024)
    performanceStats.value.currentMemory = usedMemory
    performanceStats.value.peakMemory = Math.max(performanceStats.value.peakMemory, usedMemory)
    
    // 更新图表
    if (memoryChartInstance) {
      const now = new Date().toLocaleTimeString()
      memoryChartInstance.data.labels.push(now)
      memoryChartInstance.data.datasets[0].data.push(usedMemory)
      
      // 保持最近10个数据点
      if (memoryChartInstance.data.labels.length > 10) {
        memoryChartInstance.data.labels.shift()
        memoryChartInstance.data.datasets[0].data.shift()
      }
      
      memoryChartInstance.update()
    }
  }
}

// 在组件挂载时初始化
onMounted(() => {
  // 加载数据
  loadAllData()
  
  // 初始化性能监控
  initPerformanceMonitoring()
  
  // 定期更新性能数据
  const performanceInterval = setInterval(startPerformanceMonitoring, 5000)
  
  // 在组件卸载时清理
  onUnmounted(() => {
    clearInterval(performanceInterval)
    
    // 销毁图表实例
    if (loadTimeChartInstance) {
      loadTimeChartInstance.destroy()
    }
    if (resourceChartInstance) {
      resourceChartInstance.destroy()
    }
    if (memoryChartInstance) {
      memoryChartInstance.destroy()
    }
  })
})
</script>

<style scoped lang="scss">
.dashboard {
  padding: 24px;
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
    
    .stat-card {
      background: rgba(var(--background-primary-rgb), 0.8);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
      
      .stat-header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        
        i {
          font-size: 24px;
          margin-right: 12px;
          color: var(--primary-color);
        }
        
        h3 {
          margin: 0;
          font-size: 18px;
          color: var(--text-secondary);
        }
      }
      
      .stat-content {
        .stat-number {
          font-size: 32px;
          font-weight: 600;
          color: var(--text-primary);
          animation: countUp 0.5s ease-out;
        }
      }
    }
  }
  
  .performance-panel {
    background: rgba(var(--background-primary-rgb), 0.8);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 32px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    h2 {
      margin: 0 0 24px;
      font-size: 24px;
      color: var(--text-primary);
    }
    
    .performance-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
      
      .performance-card {
        background: rgba(var(--background-light-rgb), 0.5);
        border-radius: 12px;
        padding: 20px;
        
        h3 {
          margin: 0 0 16px;
          font-size: 18px;
          color: var(--text-secondary);
        }
        
        .performance-chart {
          height: 200px;
          margin-bottom: 16px;
        }
        
        .performance-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          
          .stat-item {
            display: flex;
            flex-direction: column;
            
            span:first-child {
              font-size: 14px;
              color: var(--text-secondary);
              margin-bottom: 4px;
            }
            
            span:last-child {
              font-size: 16px;
              font-weight: 500;
              color: var(--text-primary);
            }
          }
        }
      }
    }
  }
}

@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 