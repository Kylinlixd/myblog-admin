<template>
  <a-layout class="layout-container">
    <a-layout-sider
      v-model:collapsed="isCollapse"
      :trigger="null"
      collapsible
      class="aside"
    >
      <div class="logo">
        <span class="full-title">博客管理系统</span>
        <span class="short-title">博客</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        v-model:openKeys="openKeys"
        mode="inline"
        theme="dark"
      >
        <a-menu-item key="dashboard" @click="navigateTo('/dashboard')">
          <template #icon><monitor-outlined /></template>
          <span>仪表盘</span>
        </a-menu-item>
        
        <a-menu-item key="Dynamics" @click="navigateTo('/dashboard/dynamics')">
          <template #icon><file-outlined /></template>
          <span>动态管理</span>
        </a-menu-item>

        <a-menu-item key="Category" @click="navigateTo('/dashboard/category')">
          <template #icon><folder-outlined /></template>
          <span>分类管理</span>
        </a-menu-item>

        <a-menu-item key="Tags" @click="navigateTo('/dashboard/tags')">
          <template #icon><tags-outlined /></template>
          <span>标签管理</span>
        </a-menu-item>
        
        <a-menu-item key="Comments" @click="navigateTo('/dashboard/comments')">
          <template #icon><comment-outlined /></template>
          <span>评论管理</span>
        </a-menu-item>

        <a-menu-item key="files" @click="navigateTo('/dashboard/files')">
          <template #icon><file-outlined /></template>
          <span>文件管理</span>
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
          <a-button type="link" @click="goToBlog">
            <template #icon><home-outlined /></template>
            博客主页
          </a-button>
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
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { computed, onMounted, ref, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  MonitorOutlined, 
  FileOutlined, 
  FolderOutlined, 
  TagsOutlined, 
  CommentOutlined, 
  MenuUnfoldOutlined, 
  MenuFoldOutlined, 
  PlusOutlined, 
  UnorderedListOutlined,
  HomeOutlined 
} from '@ant-design/icons-vue'
import { useUserStore } from '../stores/user'
import { useAppStore } from '../stores/app'
import { Modal } from 'ant-design-vue'
import Breadcrumb from '../components/Breadcrumb.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

// 侧边栏折叠状态
const isCollapse = ref(false)

// 菜单选中状态
const selectedKeys = ref([route.name])
const openKeys = ref(['dynamics'])

// 切换侧边栏
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

// 导航到指定路由
const navigateTo = (path) => {
  router.push(path)
}

// 检查是否为移动设备
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    isCollapse.value = true
  }
}

// 初始化响应式设置
onMounted(() => {
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

// 跳转到博客主页
const goToBlog = () => {
  router.push('/blog')
}
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  display: flex;
  
  .aside {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 10;
    background-color: #001529;
    transition: all 0.2s;
    
    .logo {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 16px;
      overflow: hidden;
      white-space: nowrap;
      background: #002140;
      position: relative;
      
      .full-title {
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        transition: all 0.2s;
        opacity: 1;
      }
      
      .short-title {
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        position: absolute;
        opacity: 0;
        transition: all 0.2s;
      }
    }
    
    &.ant-layout-sider-collapsed {
      .logo {
        .full-title {
          opacity: 0;
          width: 0;
        }
        
        .short-title {
          opacity: 1;
        }
      }
    }
  }
  
  .header {
    position: fixed;
    top: 0;
    right: 0;
    left: 200px;
    z-index: 9;
    background-color: #fff;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    line-height: 64px;
    transition: all 0.2s;
    
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
      
      .ant-btn-link {
        color: rgba(0, 0, 0, 0.65);
        
        &:hover {
          color: #1890ff;
        }
      }
      
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
    margin-left: 200px;
    margin-top: 64px;
    padding: 24px;
    min-height: calc(100vh - 64px);
    background-color: #f0f2f5;
    overflow-y: auto;
    transition: all 0.2s;
  }
  
  // 当侧边栏折叠时的样式
  .aside.ant-layout-sider-collapsed + .ant-layout {
    .header {
      left: 80px;
    }
    
    .main {
      margin-left: 80px;
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
</style> 