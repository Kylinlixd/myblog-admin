<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '240px'" class="aside">
      <div class="logo">
        <!-- <img src="../assets/logo.png" alt="Logo" /> -->
        <span v-if="!isCollapse">博客管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        :collapse="isCollapse"
        background-color="var(--background-color)"
        text-color="var(--text-primary)"
        active-text-color="#ffffff"
        @open="handleOpen"
      >
        <el-menu-item index="/dashboard" @click="navigateTo('/dashboard')">
          <el-icon><Monitor /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        
        <el-sub-menu popper-class="dynamic-submenu">
          <template #title>
            <div class="submenu-title" @click.stop="handleSubmenuClick">
              <el-icon><Document /></el-icon>
              <span>动态管理</span>
            </div>
          </template>
          <el-menu-item index="/dashboard/dynamics" @click="navigateTo('/dashboard/dynamics')">
            <el-icon><Document /></el-icon>
            <span>动态列表</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/dynamics/create" @click="navigateTo('/dashboard/dynamics/create')">
            <el-icon><Plus /></el-icon>
            <span>新建动态</span>
          </el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/dashboard/categories" @click="navigateTo('/dashboard/categories')">
          <el-icon><Folder /></el-icon>
          <template #title>分类管理</template>
        </el-menu-item>
        <el-menu-item index="/dashboard/tags" @click="navigateTo('/dashboard/tags')">
          <el-icon><Collection /></el-icon>
          <template #title>标签管理</template>
        </el-menu-item>
        <el-menu-item index="/dashboard/comments" @click="navigateTo('/dashboard/comments')">
          <el-icon><ChatDotRound /></el-icon>
          <template #title>评论管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="toggle-sidebar" @click="toggleSidebar">
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
          <breadcrumb />
        </div>
        <div class="header-right">
          <theme-toggle />
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.avatar" />
              <span>{{ userStore.nickname || '管理员' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/dashboard/profile')">个人信息</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Monitor, Document, Folder, Collection, Fold, Expand, ChatDotRound, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'
import { useAppStore } from '../stores/app'
import { ElMessageBox } from 'element-plus'
import ThemeToggle from '../components/ThemeToggle.vue'
import Breadcrumb from '../components/Breadcrumb.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const appStore = useAppStore()
const activeMenu = computed(() => {
  // 打印当前路径，帮助调试
  console.log('当前路由路径:', route.path)
  
  // 处理子路由高亮
  if (route.path.startsWith('/dashboard/dynamics/')) {
    return '/dashboard/dynamics'
  }
  
  // 处理其他路由
  return route.path
})
const isCollapse = computed(() => appStore.sidebarCollapsed)

// 统一的导航方法
const navigateTo = (path) => {
  console.log('导航到路径:', path)
  router.push(path)
}

// 切换侧边栏
const toggleSidebar = () => {
  appStore.toggleSidebar()
}

// 初始化主题
onMounted(() => {
  themeStore.initTheme()
})

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.logout()
    // 确保在路由跳转前已完全清除登录状态
    localStorage.removeItem('token')
    setTimeout(() => {
      router.push('/login')
    }, 100)
  } catch (error) {
    // 用户取消操作
    console.log('用户取消退出登录')
  }
}

// 处理子菜单点击事件 - 停止事件传播防止菜单自动导航
const handleSubmenuClick = (event) => {
  event.stopPropagation()
  console.log('子菜单标题点击，直接导航到/dashboard/dynamics')
  navigateTo('/dashboard/dynamics')
}

// 处理菜单打开事件
const handleOpen = (key, keyPath) => {
  console.log('菜单打开:', key, keyPath)
  // 如果是动态管理菜单打开，可以自动导航到动态列表页面
  if (key === 'dynamics' || key.includes('dynamics')) {
    navigateTo('/dashboard/dynamics')
  }
}
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  display: flex;
  
  .aside {
    background-color: var(--background-color);
    border-right: 1px solid var(--border-color);
    transition: width 0.3s;
    overflow: hidden;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    
    .logo {
      height: 60px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      border-bottom: 1px solid var(--border-color);
      overflow: hidden;
      white-space: nowrap;
      background: linear-gradient(135deg, #409EFF 0%, #36cfc9 100%);
      
      img {
        width: 32px;
        height: 32px;
        margin-right: 12px;
      }
      
      span {
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      }
    }
    
    .el-menu {
      border-right: none;
      
      :deep(.el-menu-item),
      :deep(.el-sub-menu__title) {
        height: 50px;
        line-height: 50px;
        margin: 4px 0;
        border-radius: 4px;
        margin-left: 8px;
        margin-right: 8px;
        width: calc(100% - 16px);
        
        &.is-active {
          background: linear-gradient(90deg, #409EFF 0%, #36cfc9 100%);
          color: #ffffff;
          box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.3);
          
          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background-color: #ffffff;
            border-radius: 0 4px 4px 0;
          }
        }
        
        &:hover {
          background-color: rgba(64, 158, 255, 0.1);
        }
        
        .el-icon {
          font-size: 18px;
        }
      }
      
      :deep(.el-sub-menu) {
        .el-sub-menu__title {
          color: var(--text-primary);
        }
        
        &.is-active {
          > .el-sub-menu__title {
            color: #409EFF;
          }
        }
        
        .el-menu {
          background-color: transparent;
        }
        
        .el-menu-item {
          height: 40px;
          line-height: 40px;
          padding-left: 40px !important;
          
          &.is-active {
            background: linear-gradient(90deg, #409EFF 0%, #36cfc9 100%);
          }
        }
      }
    }
    
    .el-menu--collapse {
      width: 64px;
    }
  }
  
  .header {
    height: 60px;
    background-color: var(--background-color);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;
      
      .toggle-sidebar {
        font-size: 20px;
        cursor: pointer;
        color: var(--text-primary);
        transition: all 0.3s;
        
        &:hover {
          color: #409EFF;
          transform: scale(1.1);
        }
      }
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.3s;
        
        &:hover {
          background-color: rgba(64, 158, 255, 0.1);
        }
        
        span {
          color: var(--text-primary);
        }
      }
    }
  }
  
  .main {
    background-color: var(--background-light);
    padding: 20px;
    overflow-y: auto;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #409EFF 0%, #36cfc9 100%);
      opacity: 0.1;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-duration) ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.submenu-title {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
  
  .el-icon {
    margin-right: 8px;
  }
}

// 父菜单标题样式修复
:deep(.el-sub-menu__title) {
  padding: 0 !important;
  
  .submenu-title {
    padding: 0 20px;
  }
}
</style> 