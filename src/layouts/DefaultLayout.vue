<template>
  <a-layout class="layout-container">
    <a-layout-sider
      v-model:collapsed="isCollapse"
      :trigger="null"
      collapsible
      :breakpoint="'md'"
      :width="240"
      class="aside"
      @collapse="onCollapse"
      @breakpoint="onBreakpoint"
    >
      <div class="logo">
        <!-- <img src="../assets/logo.png" alt="Logo" /> -->
        <span v-if="!isCollapse">博客管理系统</span>
      </div>
      <a-menu
        :selectedKeys="[activeMenu]"
        mode="inline"
        theme="dark"
        @click="handleMenuClick"
      >
        <a-menu-item key="/dashboard">
          <template #icon><MonitorOutlined /></template>
          <span>仪表盘</span>
        </a-menu-item>
        <a-sub-menu key="dynamics">
          <template #icon><FileOutlined /></template>
          <template #title>动态管理</template>
          <a-menu-item key="/dashboard/dynamics">
            <template #icon><UnorderedListOutlined /></template>
            <span>动态列表</span>
          </a-menu-item>
          <a-menu-item key="/dashboard/dynamics/create">
            <template #icon><PlusOutlined /></template>
            <span>新建动态</span>
          </a-menu-item>
        </a-sub-menu>
        <a-menu-item key="/dashboard/categories">
          <template #icon><FolderOutlined /></template>
          <span>分类管理</span>
        </a-menu-item>
        <a-menu-item key="/dashboard/tags">
          <template #icon><TagsOutlined /></template>
          <span>标签管理</span>
        </a-menu-item>
        <a-menu-item key="/dashboard/comments">
          <template #icon><CommentOutlined /></template>
          <span>评论管理</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    
    <a-layout>
      <a-layout-header class="header">
        <div class="header-left">
          <div class="toggle-sidebar" @click="toggleSidebar">
            <menu-unfold-outlined v-if="isCollapse" />
            <menu-fold-outlined v-else />
          </div>
          <breadcrumb />
        </div>
        <div class="header-right">
          <theme-toggle />
          <a-dropdown>
            <div class="user-info">
              <a-avatar :src="userStore.avatar">{{ userStore.nickname ? userStore.nickname.charAt(0) : '管' }}</a-avatar>
              <span>{{ userStore.nickname || '管理员' }}</span>
            </div>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="router.push('/dashboard/profile')">个人信息</a-menu-item>
                <a-menu-divider />
                <a-menu-item @click="handleLogout">退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      
      <a-layout-content class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { computed, onMounted, ref, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MonitorOutlined, FileOutlined, FolderOutlined, TagsOutlined, CommentOutlined, MenuUnfoldOutlined, MenuFoldOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'
import { useAppStore } from '../stores/app'
import { Modal } from 'ant-design-vue'
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

// 添加响应式相关变量
const isMobile = ref(false)

// 检测屏幕宽度是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value && !isCollapse.value) {
    appStore.toggleSidebar(true) // 在移动设备上默认折叠
  }
}

// 监听断点变化
const onBreakpoint = (broken) => {
  console.log('屏幕断点变化:', broken)
  isMobile.value = broken
  if (broken && !isCollapse.value) {
    appStore.toggleSidebar(true)
  }
}

// 处理侧边栏折叠状态变化
const onCollapse = (collapsed) => {
  appStore.setSidebarCollapsed(collapsed)
}

// 统一的导航方法
const navigateTo = (path) => {
  console.log('导航到路径:', path)
  router.push(path)
  // 在移动设备上点击菜单后自动折叠侧边栏
  if (isMobile.value && !isCollapse.value) {
    appStore.toggleSidebar(true)
  }
}

// 切换侧边栏
const toggleSidebar = () => {
  appStore.toggleSidebar()
}

// 初始化主题和响应式设置
onMounted(() => {
  themeStore.initTheme()
  
  // 初始检测设备类型
  checkMobile()
  
  // 监听窗口大小变化
  window.addEventListener('resize', checkMobile)
  
  // 组件卸载时移除事件监听
  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })
})

const handleLogout = async () => {
  try {
    await Modal.confirm({
      title: '提示',
      content: '确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      type: 'warning',
      onOk: async () => {
        await userStore.logout()
        // 确保在路由跳转前已完全清除登录状态
        localStorage.removeItem('token')
        setTimeout(() => {
          router.push('/login')
        }, 100)
      },
      onCancel() {
        // 用户取消操作
        console.log('用户取消退出登录')
      }
    })
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

// 处理菜单点击事件
const handleMenuClick = ({ key }) => {
  console.log('菜单点击:', key)
  router.push(key)
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
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 修复dark主题样式
:global(.dark) {
  .layout-container {
    .header {
      background-color: #141414;
      
      .toggle-sidebar {
        color: rgba(255, 255, 255, 0.65);
        
        &:hover {
          color: #1890ff;
        }
      }
      
      .user-info {
        span {
          color: rgba(255, 255, 255, 0.65);
        }
      }
    }
    
    .main {
      background-color: #141414;
    }
  }
}
</style>

// 更新为Ant Design Vue样式
<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  
  .aside {
    background-color: #001529;
    
    .logo {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 16px;
      overflow: hidden;
      white-space: nowrap;
      background: #002140;
      
      span {
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
      }
    }
  }
  
  .header {
    background-color: #fff;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    line-height: 64px;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .toggle-sidebar {
        font-size: 18px;
        cursor: pointer;
        transition: color 0.3s;
        
        &:hover {
          color: #1890ff;
        }
      }
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        
        span {
          color: rgba(0, 0, 0, 0.65);
        }
        
        &:hover {
          color: #1890ff;
        }
      }
    }
  }
  
  .main {
    background-color: #f0f2f5;
    padding: 24px;
    margin: 24px;
    min-height: 280px;
    border-radius: 2px;
  }
}

// 暗黑模式适配
:global(.dark) {
  .layout-container {
    .header {
      background-color: #141414;
      
      .toggle-sidebar {
        color: rgba(255, 255, 255, 0.65);
      }
      
      .user-info span {
        color: rgba(255, 255, 255, 0.65);
      }
    }
    
    .main {
      background-color: #141414;
    }
  }
}

// 添加移动设备响应式样式
@media (max-width: 768px) {
  .layout-container {
    .header {
      padding: 0 12px;
      
      .header-left {
        gap: 8px;
      }
      
      .header-right {
        gap: 8px;
        
        .user-info {
          span {
            display: none;
          }
        }
      }
    }
    
    .main {
      padding: 12px;
      margin: 12px;
    }
  }
}
</style> 