<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>文章总数</span>
              <el-icon><Document /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <span class="number">128</span>
            <span class="trend up">
              <el-icon><ArrowUp /></el-icon>
              12%
            </span>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>分类数量</span>
              <el-icon><Folder /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <span class="number">12</span>
            <span class="trend up">
              <el-icon><ArrowUp /></el-icon>
              5%
            </span>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>标签数量</span>
              <el-icon><Collection /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <span class="number">36</span>
            <span class="trend up">
              <el-icon><ArrowUp /></el-icon>
              8%
            </span>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>访问量</span>
              <el-icon><View /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <span class="number">1,234</span>
            <span class="trend up">
              <el-icon><ArrowUp /></el-icon>
              15%
            </span>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="mt-20">
      <el-col :span="16">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>访问趋势</span>
            </div>
          </template>
          <div class="chart-placeholder">
            图表区域（后续集成 ECharts）
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="list-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最新文章</span>
            </div>
          </template>
          <el-scrollbar height="300px">
            <ul class="article-list">
              <li v-for="i in 5" :key="i" class="article-item">
                <div class="article-title">示例文章标题 {{ i }}</div>
                <div class="article-meta">
                  <span>2024-03-{{ i }}</span>
                  <span>阅读量: {{ 100 + i * 10 }}</span>
                </div>
              </li>
            </ul>
          </el-scrollbar>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { Document, Folder, Collection, View, ArrowUp } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
.dashboard {
  .stat-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .el-icon {
        font-size: 20px;
        color: var(--primary-color);
      }
    }
    
    .card-content {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      
      .number {
        font-size: 28px;
        font-weight: 600;
        color: var(--text-primary);
      }
      
      .trend {
        display: flex;
        align-items: center;
        font-size: 14px;
        
        &.up {
          color: #67C23A;
        }
        
        &.down {
          color: #F56C6C;
        }
        
        .el-icon {
          margin-right: 4px;
        }
      }
    }
  }
  
  .chart-card {
    .chart-placeholder {
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-light);
      border-radius: var(--border-radius);
      color: var(--text-light);
    }
  }
  
  .list-card {
    .article-list {
      list-style: none;
      padding: 0;
      margin: 0;
      
      .article-item {
        padding: 12px 0;
        border-bottom: 1px solid var(--border-light);
        
        &:last-child {
          border-bottom: none;
        }
        
        .article-title {
          font-size: 14px;
          color: var(--text-primary);
          margin-bottom: 8px;
          
          &:hover {
            color: var(--primary-color);
            cursor: pointer;
          }
        }
        
        .article-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-light);
        }
      }
    }
  }
}

.mt-20 {
  margin-top: 20px;
}
</style> 