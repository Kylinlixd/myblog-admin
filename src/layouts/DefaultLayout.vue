<template>
  <a-layout class="admin-shell">
    <a-layout-sider v-if="!isMobile" v-model:collapsed="collapsed" :trigger="null" collapsible :width="232" :collapsed-width="76" class="admin-sidebar">
      <router-link class="admin-brand" to="/dashboard">
        <span class="brand-mark">L</span><span v-if="!collapsed">LiXD Studio<small>内容工作台</small></span>
      </router-link>
      <AdminNavigation />
      <div v-if="!collapsed" class="sidebar-status">
        <span class="status-dot"></span>
        <div><strong>本地开发</strong><small>API 已代理到 8000</small></div>
      </div>
    </a-layout-sider>

    <a-drawer v-model:open="mobileOpen" placement="left" :closable="false" :width="272" class="admin-drawer">
      <router-link class="admin-brand admin-brand--drawer" to="/dashboard" @click="mobileOpen = false">
        <span class="brand-mark">L</span><span>LiXD Studio<small>内容工作台</small></span>
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
              <a-menu class="account-menu">
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
const groupedMenu = computed(() => adminMenu.reduce((groups, item) => {
  const group = groups.find((entry) => entry.key === item.group)
  if (group) group.items.push(item)
  else groups.push({ key: item.group, label: item.groupLabel, items: [item] })
  return groups
}, []))

const AdminNavigation = defineComponent({
  emits: ['navigate'],
  setup(_, { emit }) {
    return () => h('nav', { class: 'admin-navigation', 'aria-label': '管理导航' }, groupedMenu.value.map((group) =>
      h('section', { class: 'nav-group', key: group.key }, [
        !collapsed.value || isMobile.value ? h('p', { class: 'nav-group__label' }, group.label) : null,
        ...group.items.map((item) =>
          h('button', {
            type: 'button',
            class: ['nav-item', { 'nav-item--active': selectedKey.value === item.key }],
            title: collapsed.value && !isMobile.value ? `${item.label} · ${item.description}` : undefined,
            onClick: () => { router.push(item.path); emit('navigate') }
          }, [
            h('span', { class: 'nav-item__icon' }, [h(iconMap[item.icon])]),
            !collapsed.value || isMobile.value ? h('span', { class: 'nav-item__copy' }, [h('strong', item.label), h('small', item.description)]) : null
          ])
        )
      ])
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
    title: '退出登录',
    content: '当前管理会话会被清除，再次管理内容需要重新登录。',
    okText: '确认退出',
    cancelText: '继续停留',
    class: 'logout-confirm',
    okButtonProps: { danger: true },
    async onOk() { await userStore.logout(); await router.replace('/login') }
  })
}
</script>

<style lang="scss">
.admin-drawer .ant-drawer-body { padding: 0; background: #10182b; }
.admin-shell { min-height: 100vh; background: var(--color-page); }
.admin-sidebar { position: sticky !important; top: 0; height: 100vh; overflow: hidden auto; border-right: 1px solid rgb(255 255 255 / 6%); background: #10182b !important; }
.admin-brand { display: flex; height: 76px; align-items: center; gap: 11px; padding: 0 18px; color: white; white-space: nowrap; }
.admin-brand--drawer { padding-inline: 22px; }
.admin-brand .brand-mark { display: grid; width: 38px; height: 38px; flex: 0 0 auto; place-items: center; border-radius: 10px; background: var(--color-primary); font-size: 20px; font-weight: 800; }
.admin-brand > span:last-child { display: flex; flex-direction: column; font-weight: 750; line-height: 1.2; }
.admin-brand small { margin-top: 4px; color: #8290ab; font-size: 10px; font-weight: 500; letter-spacing: .06em; }
.admin-navigation { display: grid; gap: 16px; padding: 10px 12px 18px; }
.nav-group { display: grid; gap: 5px; }
.nav-group__label { margin: 0 10px 4px; color: #66748d; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.admin-navigation .nav-item { display: flex; width: 100%; min-height: 50px; align-items: center; gap: 11px; padding: 7px 10px; border: 0; border-radius: 8px; background: transparent; color: #9daac1; cursor: pointer; text-align: left; transition: var(--transition-fast); }
.nav-item__icon { display: grid; width: 30px; height: 30px; flex: 0 0 auto; place-items: center; border-radius: 8px; background: rgb(255 255 255 / 5%); }
.nav-item__copy { display: flex; min-width: 0; flex-direction: column; line-height: 1.25; }
.nav-item__copy strong { overflow: hidden; color: inherit; font-size: 13px; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
.nav-item__copy small { overflow: hidden; margin-top: 3px; color: #6f7e98; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.admin-navigation .nav-item svg { width: 16px; height: 16px; }
.admin-navigation .nav-item:hover { background: rgb(255 255 255 / 6%); color: white; }
.admin-navigation .nav-item--active { background: #315bea !important; color: white !important; box-shadow: 0 10px 22px rgb(49 91 234 / 24%); }
.admin-navigation .nav-item--active .nav-item__icon { background: rgb(255 255 255 / 16%); }
.admin-navigation .nav-item--active small { color: rgb(255 255 255 / 72%); }
.sidebar-status { display: flex; gap: 10px; align-items: center; margin: 12px; padding: 12px; border: 1px solid rgb(255 255 255 / 8%); border-radius: 8px; background: rgb(255 255 255 / 4%); color: white; }
.status-dot { width: 8px; height: 8px; flex: 0 0 auto; border-radius: 50%; background: var(--color-success); box-shadow: 0 0 0 5px rgb(22 163 106 / 12%); }
.sidebar-status strong { display: block; font-size: 12px; }
.sidebar-status small { color: #8290ab; font-size: 11px; }
.workspace { min-width: 0; background: var(--color-page); }
.workspace-header { position: sticky; z-index: 50; top: 0; display: flex; height: 72px; padding: 0 28px; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-border); background: rgb(255 255 255 / 92%) !important; line-height: normal; backdrop-filter: blur(16px); }
.header-left, .header-actions, .user-button, .blog-link { display: flex; align-items: center; }
.header-left { min-width: 0; gap: 16px; }
.header-actions { gap: 16px; }
.icon-button { display: grid; width: 38px; height: 38px; place-items: center; border: 1px solid var(--color-border); border-radius: 10px; background: white; color: var(--color-text-secondary); cursor: pointer; }
.blog-link { gap: 7px; color: var(--color-text-secondary); font-size: 13px; font-weight: 650; }
.user-button { min-height: 46px; gap: 10px; padding: 5px 7px; border: 0; border-radius: 12px; background: transparent; color: var(--color-text-secondary); cursor: pointer; }
.user-button:hover { background: var(--color-surface-muted); }
.user-copy { display: flex; align-items: flex-start; flex-direction: column; justify-content: center; gap: 2px; line-height: 1.1; }
.user-copy strong { display: block; color: var(--color-text); font-size: 13px; line-height: 1.2; }
.user-copy small { display: block; color: var(--color-text-muted); font-size: 10px; line-height: 1.2; }
.workspace-content { min-width: 0; padding: 30px; }
.account-menu { min-width: 168px; }
.logout-confirm .ant-modal-confirm-title { font-weight: 750; }
.logout-confirm .ant-modal-confirm-content { color: var(--color-text-secondary); }
.workspace-page-enter-active, .workspace-page-leave-active { transition: opacity var(--transition-fast), transform var(--transition-fast); }
.workspace-page-enter-from { opacity: 0; transform: translateY(5px); }
.workspace-page-leave-to { opacity: 0; }
@media (max-width: 720px) { .workspace-header { padding: 0 16px; } .workspace-content { padding: 18px 14px; } .blog-link span, .user-copy { display: none; } }
</style>
