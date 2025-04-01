<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <i class="icon-document"></i>
          <h3>文章总数</h3>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.postCount }}</div>
        </div>
      </div>
      
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
    
    <!-- 最近文章列表 -->
    <div class="recent-posts">
      <h2>最近文章</h2>
      <div class="post-list">
        <div v-for="post in recentPosts" :key="post.id" class="post-item">
          <div class="post-title">{{ post.title }}</div>
          <div class="post-meta">
            <span>{{ post.createTime }}</span>
            <span>{{ post.views }} 次浏览</span>
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

// 统计数据
const stats = ref({
  postCount: 0,
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

// 最近文章
const recentPosts = ref([])

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
    const data = await request.get('/stats')
    stats.value = data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取最近文章
const getRecentPosts = async () => {
  try {
    const data = await request.get('/posts/recent')
    recentPosts.value = data
  } catch (error) {
    console.error('获取最近文章失败:', error)
  }
}

// 初始化性能监控
const initPerformanceMonitoring = () => {
  // 页面加载性能
  window.addEventListener('load', () => {
    const timing = window.performance.timing
    const loadTime = timing.loadEventEnd - timing.navigationStart
    performanceStats.value.avgLoadTime = loadTime
    performanceStats.value.maxLoadTime = Math.max(performanceStats.value.maxLoadTime, loadTime)
  })
  
  // 资源加载性能
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach(entry => {
      if (entry.initiatorType === 'img') {
        performanceStats.value.avgImageLoadTime = entry.duration
      }
    })
  })
  observer.observe({ entryTypes: ['resource'] })
  
  // 内存使用监控
  if (performance.memory) {
    setInterval(() => {
      performanceStats.value.currentMemory = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
      performanceStats.value.peakMemory = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    }, 1000)
  }
}

// 初始化图表
const initCharts = () => {
  // 加载时间图表
  loadTimeChartInstance = new Chart(loadTimeChart.value, {
    type: 'line',
    data: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      datasets: [{
        label: '页面加载时间',
        data: [1200, 1900, 1500, 1800, 1600, 1700],
        borderColor: '#409EFF',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })
  
  // 资源加载图表
  resourceChartInstance = new Chart(resourceChart.value, {
    type: 'bar',
    data: {
      labels: ['图片', 'JS', 'CSS', 'API'],
      datasets: [{
        label: '加载时间(ms)',
        data: [300, 200, 150, 250],
        backgroundColor: '#67C23A'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })
  
  // 内存使用图表
  memoryChartInstance = new Chart(memoryChart.value, {
    type: 'line',
    data: {
      labels: ['1分钟前', '30秒前', '现在'],
      datasets: [{
        label: '内存使用(MB)',
        data: [50, 60, 55],
        borderColor: '#E6A23C',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })
}

onMounted(() => {
  getStats()
  getRecentPosts()
  initPerformanceMonitoring()
  initCharts()
})

onUnmounted(() => {
  if (loadTimeChartInstance) loadTimeChartInstance.destroy()
  if (resourceChartInstance) resourceChartInstance.destroy()
  if (memoryChartInstance) memoryChartInstance.destroy()
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
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
      }
      
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
          font-size: 16px;
          color: var(--text-secondary);
        }
      }
      
      .stat-content {
        .stat-number {
          font-size: 36px;
          font-weight: 600;
          color: var(--text-primary);
          animation: countUp 1s ease-out;
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
  
  .recent-posts {
    background: rgba(var(--background-primary-rgb), 0.8);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    h2 {
      margin: 0 0 24px;
      font-size: 24px;
      color: var(--text-primary);
    }
    
    .post-list {
      display: grid;
      gap: 16px;
      
      .post-item {
        background: rgba(var(--background-light-rgb), 0.5);
        border-radius: 12px;
        padding: 16px;
        transition: all 0.3s ease;
        cursor: pointer;
        
        &:hover {
          transform: translateX(5px);
          background: rgba(var(--background-light-rgb), 0.8);
        }
        
        .post-title {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .post-meta {
          display: flex;
          gap: 16px;
          font-size: 14px;
          color: var(--text-secondary);
          
          span {
            display: flex;
            align-items: center;
            
            i {
              margin-right: 4px;
              font-size: 16px;
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