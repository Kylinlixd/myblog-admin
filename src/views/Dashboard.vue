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
          <div class="performance-chart" ref="loadTimeChart"></div>
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
          <div class="performance-chart" ref="resourceChart"></div>
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
          <div class="performance-chart" ref="memoryChart"></div>
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
import * as echarts from 'echarts'
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
    loadTimeChartInstance = echarts.init(loadTimeChart.value)
    loadTimeChartInstance.setOption({
      title: {
        text: '页面加载时间',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>{a}: {c} ms'
      },
      grid: {
        top: 60,
        right: 20,
        bottom: 40,
        left: 50,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: [],
        axisLabel: {
          rotate: 45,
          fontSize: 12
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '时间 (ms)',
        nameTextStyle: {
          fontSize: 12
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#ddd'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#eee'
          }
        }
      },
      series: [{
        name: '加载时间',
        type: 'line',
        data: [],
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 3,
          color: '#1890ff'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0,
            color: 'rgba(24, 144, 255, 0.3)'
          }, {
            offset: 1,
            color: 'rgba(24, 144, 255, 0.1)'
          }])
        }
      }]
    })
  }
  
  // 资源加载图表
  if (resourceChart.value) {
    resourceChartInstance = echarts.init(resourceChart.value)
    resourceChartInstance.setOption({
      title: {
        text: '资源加载时间',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: '{b}<br/>{a}: {c} ms'
      },
      grid: {
        top: 60,
        right: 20,
        bottom: 40,
        left: 50,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['图片', 'API'],
        axisLabel: {
          fontSize: 12
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '时间 (ms)',
        nameTextStyle: {
          fontSize: 12
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#ddd'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#eee'
          }
        }
      },
      series: [{
        name: '加载时间',
        type: 'bar',
        data: [0, 0],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0,
            color: '#1890ff'
          }, {
            offset: 1,
            color: '#40a9ff'
          }])
        },
        barWidth: '40%'
      }]
    })
  }
  
  // 内存使用图表
  if (memoryChart.value) {
    memoryChartInstance = echarts.init(memoryChart.value)
    memoryChartInstance.setOption({
      title: {
        text: '内存使用',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>{a}: {c} MB'
      },
      grid: {
        top: 60,
        right: 20,
        bottom: 40,
        left: 50,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: [],
        axisLabel: {
          rotate: 45,
          fontSize: 12
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '内存 (MB)',
        nameTextStyle: {
          fontSize: 12
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#ddd'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#eee'
          }
        }
      },
      series: [{
        name: '内存使用',
        type: 'line',
        data: [],
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 3,
          color: '#722ed1'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0,
            color: 'rgba(114, 46, 209, 0.3)'
          }, {
            offset: 1,
            color: 'rgba(114, 46, 209, 0.1)'
          }])
        }
      }]
    })
  }
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
}

// 处理窗口大小变化
const handleResize = () => {
  loadTimeChartInstance?.resize()
  resourceChartInstance?.resize()
  memoryChartInstance?.resize()
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
      const option = loadTimeChartInstance.getOption()
      
      // 保持最近10个数据点
      if (option.xAxis[0].data.length >= 10) {
        option.xAxis[0].data.shift()
        option.series[0].data.shift()
      }
      
      option.xAxis[0].data.push(now)
      option.series[0].data.push(loadTime)
      
      loadTimeChartInstance.setOption(option)
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
      resourceChartInstance.setOption({
        series: [{
          data: [imageLoadTime, apiLoadTime]
        }]
      })
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
      const option = memoryChartInstance.getOption()
      
      // 保持最近10个数据点
      if (option.xAxis[0].data.length >= 10) {
        option.xAxis[0].data.shift()
        option.series[0].data.shift()
      }
      
      option.xAxis[0].data.push(now)
      option.series[0].data.push(usedMemory)
      
      memoryChartInstance.setOption(option)
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
    window.removeEventListener('resize', handleResize)
    
    // 销毁图表实例
    loadTimeChartInstance?.dispose()
    resourceChartInstance?.dispose()
    memoryChartInstance?.dispose()
  })
})
</script>

<style scoped lang="scss">
.dashboard {
  padding: 24px;
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
    
    .stat-card {
      position: relative;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, rgba(24, 144, 255, 0.05) 0%, rgba(24, 144, 255, 0) 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        
        &::before {
          opacity: 1;
        }
        
        .stat-header i {
          transform: scale(1.1);
        }
      }
      
      .stat-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        
        i {
          font-size: 28px;
          margin-right: 16px;
          color: #1890ff;
          transition: transform 0.3s ease;
          background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 500;
          color: #595959;
          letter-spacing: 0.5px;
        }
      }
      
      .stat-content {
        position: relative;
        
        .stat-number {
          font-size: 36px;
          font-weight: 600;
          color: #262626;
          animation: countUp 0.5s ease-out;
          background: linear-gradient(135deg, #262626 0%, #595959 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }
        
        &::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 0;
          width: 40px;
          height: 3px;
          background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
          border-radius: 3px;
        }
      }
    }
  }
  
  .performance-panel {
    background: #ffffff;
    border-radius: 20px;
    padding: 28px;
    margin-bottom: 32px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.05);
    
    h2 {
      margin: 0 0 28px;
      font-size: 24px;
      font-weight: 600;
      color: #262626;
      letter-spacing: 0.5px;
    }
    
    .performance-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
      
      .performance-card {
        background: #ffffff;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
        border: 1px solid rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
        }
        
        h3 {
          margin: 0 0 20px;
          font-size: 18px;
          font-weight: 500;
          color: #595959;
          letter-spacing: 0.5px;
        }
        
        .performance-chart {
          height: 300px;
          margin-bottom: 20px;
          width: 100%;
        }
        
        .performance-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          
          .stat-item {
            display: flex;
            flex-direction: column;
            
            span:first-child {
              font-size: 14px;
              color: #8c8c8c;
              margin-bottom: 6px;
            }
            
            span:last-child {
              font-size: 18px;
              font-weight: 500;
              color: #262626;
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