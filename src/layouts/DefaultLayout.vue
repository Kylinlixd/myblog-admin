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
        :router="true"
        :collapse="isCollapse"
        background-color="var(--background-color)"
        text-color="var(--text-primary)"
        active-text-color="var(--primary-color)"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Monitor /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/dashboard/posts">
          <el-icon><Document /></el-icon>
          <template #title>文章管理</template>
        </el-menu-item>
        <el-menu-item index="/dashboard/categories">
          <el-icon><Folder /></el-icon>
          <template #title>分类管理</template>
        </el-menu-item>
        <el-menu-item index="/dashboard/tags">
          <el-icon><Collection /></el-icon>
          <template #title>标签管理</template>
        </el-menu-item>
        <el-menu-item index="/dashboard/comments">
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
import { Monitor, Document, Folder, Collection, Fold, Expand, ChatDotRound } from '@element-plus/icons-vue'
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
const activeMenu = computed(() => route.path)
const isCollapse = computed(() => appStore.sidebarCollapsed)

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
    userStore.logout()
    router.push('/login')
  } catch (error) {
    // 用户取消操作
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
    
    .logo {
      height: 60px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      border-bottom: 1px solid var(--border-color);
      overflow: hidden;
      white-space: nowrap;
      
      img {
        width: 32px;
        height: 32px;
        margin-right: 12px;
      }
      
      span {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
      }
    }
    
    .el-menu {
      border-right: none;
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
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;
      
      .toggle-sidebar {
        font-size: 20px;
        cursor: pointer;
        color: var(--text-primary);
        
        &:hover {
          color: var(--primary-color);
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
</style> 