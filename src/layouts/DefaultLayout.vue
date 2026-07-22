<template>
  <a-layout class="admin-shell">
    <a-layout-sider v-if="!isMobile" v-model:collapsed="collapsed" :trigger="null" collapsible :width="232" :collapsed-width="76" class="admin-sidebar">
      <router-link class="admin-brand" to="/dashboard">
        <span class="brand-mark">L</span><span v-if="!collapsed">LiXD Studio<small>内容管理中心</small></span>
      </router-link>
      <AdminNavigation />
    </a-layout-sider>

    <a-drawer v-model:open="mobileOpen" placement="left" :closable="false" :width="272" class="admin-drawer">
      <router-link class="admin-brand admin-brand--drawer" to="/dashboard" @click="mobileOpen = false">
        <span class="brand-mark">L</span><span>LiXD Studio<small>内容管理中心</small></span>
      </router-link>
      <AdminNavigation @navigate="mobileOpen = false" />
    </a-drawer>

    <a-layout class="workspace">
      <a-layout-header class="workspace-header">
        <div class="header-left">
          <button type="button" class="icon-button" :aria-label="isMobile ? '打开导航' : '折叠导航'" @click="toggleSidebar">
            <menu-unfold-outlined v-if="collapsed || isMobile" /><menu-fold-outlined v-else />
          </button>
          <Breadcrumb />
        </div>
        <div class="header-actions">
          <router-link class="blog-link" to="/blog"><home-outlined /> <span>查看博客</span></router-link>
          <a-dropdown trigger="click">
            <button class="user-button" type="button">
              <a-avatar :src="userStore.avatar" :size="36">{{ userInitial }}</a-avatar>
              <span class="user-copy"><strong>{{ userStore.nickname || '管理员' }}</strong><small>内容管理员</small></span>
              <down-outlined />
            </button>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="router.push('/dashboard/profile')"><user-outlined /> 个人资料</a-menu-item>
                <a-menu-divider />
                <a-menu-item danger @click="handleLogout"><logout-outlined /> 退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <a-layout-content class="workspace-content">
        <router-view v-slot="{ Component }">
          <transition name="workspace-page" mode="out-in"><component :is="Component" :key="route.fullPath" /></transition>
        </router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CommentOutlined, DashboardOutlined, DownOutlined, FileOutlined, FolderOutlined, HomeOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, ReadOutlined, TagsOutlined, UserOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import { adminMenu } from '@/config/adminMenu'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const collapsed = ref(localStorage.getItem('admin.sidebarCollapsed') === 'true')
const isMobile = ref(window.innerWidth < 992)
const mobileOpen = ref(false)
const iconMap = { dashboard: DashboardOutlined, content: ReadOutlined, category: FolderOutlined, tags: TagsOutlined, comments: CommentOutlined, files: FileOutlined }
const selectedKey = computed(() => [...adminMenu].sort((a, b) => b.path.length - a.path.length).find((item) => route.path === item.path || route.path.startsWith(`${item.path}/`))?.key || 'dashboard')
const userInitial = computed(() => (userStore.nickname || '管').slice(0, 1))

const AdminNavigation = defineComponent({
  emits: ['navigate'],
  setup(_, { emit }) {
    return () => h('nav', { class: 'admin-navigation', 'aria-label': '管理导航' }, adminMenu.map((item) =>
      h('button', {
        type: 'button',
        class: ['nav-item', { 'nav-item--active': selectedKey.value === item.key }],
        title: collapsed.value ? item.label : undefined,
        onClick: () => { router.push(item.path); emit('navigate') }
      }, [h(iconMap[item.icon]), !collapsed.value || isMobile.value ? h('span', item.label) : null])
    ))
  }
})

function updateViewport() { isMobile.value = window.innerWidth < 992; if (!isMobile.value) mobileOpen.value = false }
function toggleSidebar() { if (isMobile.value) mobileOpen.value = true; else collapsed.value = !collapsed.value }
watch(collapsed, (value) => localStorage.setItem('admin.sidebarCollapsed', String(value)))
onMounted(() => window.addEventListener('resize', updateViewport))
onBeforeUnmount(() => window.removeEventListener('resize', updateViewport))

function handleLogout() {
  Modal.confirm({
    title: '退出管理后台？',
    content: '退出后需要重新登录才能管理内容。',
    okText: '退出登录', cancelText: '取消', okButtonProps: { danger: true },
    async onOk() { await userStore.logout(); await router.replace('/login') }
  })
}
</script>

<style lang="scss">
.admin-drawer .ant-drawer-body { padding: 0; background: #10182b; }
.admin-shell { min-height: 100vh; background: var(--color-page); }
.admin-sidebar { position: sticky !important; top: 0; height: 100vh; overflow: hidden auto; background: #10182b !important; }
.admin-brand { display: flex; height: 76px; align-items: center; gap: 11px; padding: 0 18px; color: white; white-space: nowrap; }
.admin-brand--drawer { padding-inline: 22px; }
.admin-brand .brand-mark { display: grid; width: 38px; height: 38px; flex: 0 0 auto; place-items: center; border-radius: 11px; background: var(--color-primary); font-size: 20px; font-weight: 800; }
.admin-brand > span:last-child { display: flex; flex-direction: column; font-weight: 750; line-height: 1.2; }
.admin-brand small { margin-top: 4px; color: #8290ab; font-size: 10px; font-weight: 500; letter-spacing: .06em; }
.admin-navigation { display: grid; gap: 5px; padding: 14px 12px; }
.admin-navigation .nav-item { display: flex; min-height: 44px; align-items: center; gap: 13px; padding: 0 14px; border: 0; border-radius: 10px; background: transparent; color: #9daac1; cursor: pointer; text-align: left; transition: var(--transition-fast); }
.admin-navigation .nav-item svg { width: 17px; height: 17px; }
.admin-navigation .nav-item:hover { background: rgb(255 255 255 / 6%); color: white; }
.admin-navigation .nav-item--active { background: var(--color-primary) !important; color: white !important; box-shadow: 0 10px 22px rgb(49 91 234 / 24%); }
.workspace { min-width: 0; background: var(--color-page); }
.workspace-header { position: sticky; z-index: 50; top: 0; display: flex; height: 72px; padding: 0 28px; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-border); background: rgb(255 255 255 / 92%) !important; line-height: normal; backdrop-filter: blur(16px); }
.header-left, .header-actions, .user-button, .blog-link { display: flex; align-items: center; }
.header-left { min-width: 0; gap: 16px; }
.header-actions { gap: 16px; }
.icon-button { display: grid; width: 38px; height: 38px; place-items: center; border: 1px solid var(--color-border); border-radius: 10px; background: white; color: var(--color-text-secondary); cursor: pointer; }
.blog-link { gap: 7px; color: var(--color-text-secondary); font-size: 13px; font-weight: 650; }
.user-button { gap: 10px; padding: 5px 7px; border: 0; border-radius: 12px; background: transparent; color: var(--color-text-secondary); cursor: pointer; }
.user-button:hover { background: var(--color-surface-muted); }
.user-copy { display: flex; align-items: flex-start; flex-direction: column; }
.user-copy strong { color: var(--color-text); font-size: 13px; }
.user-copy small { color: var(--color-text-muted); font-size: 10px; }
.workspace-content { min-width: 0; padding: 30px; }
.workspace-page-enter-active, .workspace-page-leave-active { transition: opacity var(--transition-fast), transform var(--transition-fast); }
.workspace-page-enter-from { opacity: 0; transform: translateY(5px); }
.workspace-page-leave-to { opacity: 0; }
@media (max-width: 720px) { .workspace-header { padding: 0 16px; } .workspace-content { padding: 18px 14px; } .blog-link span, .user-copy { display: none; } }
</style>
