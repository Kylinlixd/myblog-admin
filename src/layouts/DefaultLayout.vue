<template>
  <a-layout class="admin-shell" :class="{ 'admin-shell--mobile': isMobile, 'admin-shell--sidebar-collapsed': collapsed && !isMobile }">
    <a-layout-sider v-if="!isMobile" v-model:collapsed="collapsed" :trigger="null" collapsible :width="232" :collapsed-width="76" class="admin-sidebar">
      <div class="admin-brand">
        <router-link class="admin-brand__link" to="/dashboard">
          <span class="brand-mark">L</span><span v-if="!collapsed">LiXD Studio<small>内容工作台</small></span>
        </router-link>
      </div>
      <AdminNavigation />
    </a-layout-sider>

    <a-drawer id="admin-mobile-navigation" v-model:open="mobileOpen" placement="left" :closable="false" :width="272" class="admin-drawer">
      <router-link class="admin-brand admin-brand--drawer" to="/dashboard" @click="mobileOpen = false">
        <span class="brand-mark">L</span><span>LiXD Studio<small>内容工作台</small></span>
      </router-link>
      <AdminNavigation @navigate="mobileOpen = false" />
    </a-drawer>

    <a-layout class="workspace">
      <a-layout-header class="workspace-header">
        <div class="header-left">
          <button
            v-if="!isMobile"
            type="button"
            class="sidebar-collapse-control workspace-sidebar-toggle"
            :aria-label="collapsed ? '展开导航' : '折叠导航'"
            :aria-expanded="!collapsed"
            :title="collapsed ? '展开导航' : '折叠导航'"
            @click="toggleSidebar"
          >
            <menu-unfold-outlined v-if="collapsed" />
            <menu-fold-outlined v-else />
          </button>
          <button v-if="isMobile" type="button" class="icon-button" :aria-label="mobileOpen ? '关闭导航' : '打开导航'" :aria-expanded="mobileOpen" aria-controls="admin-mobile-navigation" @click="toggleSidebar">
            <menu-unfold-outlined />
          </button>
        </div>
        <div class="header-actions">
          <span class="workspace-status"><i /> 系统在线</span>
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
import { CommentOutlined, DashboardOutlined, DownOutlined, FileOutlined, FolderOutlined, HomeOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, ReadOutlined, TagsOutlined, UserOutlined, HistoryOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { adminMenu } from '@/config/adminMenu'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const collapsed = ref(localStorage.getItem('admin.sidebarCollapsed') === 'true')
const isMobile = ref(window.innerWidth < 992)
const mobileOpen = ref(false)
const iconMap = { dashboard: DashboardOutlined, content: ReadOutlined, category: FolderOutlined, tags: TagsOutlined, comments: CommentOutlined, files: FileOutlined, logs: HistoryOutlined }
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
            'aria-current': selectedKey.value === item.key ? 'page' : undefined,
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
function toggleSidebar() { if (isMobile.value) mobileOpen.value = !mobileOpen.value; else collapsed.value = !collapsed.value }
watch(collapsed, (value) => localStorage.setItem('admin.sidebarCollapsed', String(value)))
watch(() => route.fullPath, () => { mobileOpen.value = false })
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
.admin-shell { width: 100%; max-width: 100%; min-height: 100vh; overflow-x: clip; background: var(--color-page); transition: padding-left var(--transition-fast); }
.admin-shell:not(.admin-shell--mobile) { --admin-sidebar-width: 232px; padding-left: var(--admin-sidebar-width); }
.admin-shell.admin-shell--sidebar-collapsed { --admin-sidebar-width: 76px; padding-left: var(--admin-sidebar-width); }
.admin-shell--mobile { flex-direction: column !important; padding-left: 0 !important; }
.admin-sidebar { position: fixed !important; inset: 0 auto 0 0; z-index: 60; display: flex !important; height: 100dvh !important; min-height: 100dvh; max-height: 100dvh; flex-direction: column; overflow: hidden !important; border-right: 1px solid rgb(255 255 255 / 6%); background: #10182b !important; }
.admin-sidebar .ant-layout-sider-children { display: flex; min-height: 0; flex: 1 1 auto; flex-direction: column; }
.admin-brand { position: relative; display: flex; height: 76px; align-items: center; padding: 0 18px; color: white; white-space: nowrap; }
.admin-brand__link { display: flex; min-width: 0; align-items: center; gap: 11px; color: inherit; text-decoration: none; }
.admin-brand--drawer { padding-inline: 22px; gap: 11px; }
.admin-brand .brand-mark { display: grid; width: 38px; height: 38px; flex: 0 0 auto; place-items: center; border-radius: 10px; background: var(--color-primary); font-size: 20px; font-weight: 800; }
.admin-brand__link > span:last-child, .admin-brand--drawer > span:last-child { display: flex; flex-direction: column; font-weight: 750; line-height: 1.2; }
.admin-brand small { margin-top: 4px; color: #8290ab; font-size: 10px; font-weight: 500; letter-spacing: .06em; }
.admin-navigation { display: grid; max-height: calc(100vh - 76px); overflow-x: hidden; overflow-y: auto; gap: 16px; padding: 46px 12px 18px; }
.admin-sidebar .admin-navigation { min-height: 0; max-height: none; flex: 1 1 auto; overscroll-behavior: contain; scrollbar-color: rgb(174 187 208 / 38%) transparent; scrollbar-gutter: stable; scrollbar-width: thin; }
.sidebar-collapse-control { display: grid; width: 40px; height: 40px; flex: 0 0 auto; place-items: center; border: 1px solid var(--color-border); border-radius: 11px; background: var(--color-surface); color: var(--color-text-secondary); cursor: pointer; transition: color var(--transition-fast), background-color var(--transition-fast), transform var(--transition-fast), opacity var(--transition-fast); }
.workspace-sidebar-toggle { position: relative; z-index: 1; }
.sidebar-collapse-control:hover { background: #315bea; color: white; transform: none; }
.sidebar-collapse-control:active { transform: translateY(1px) scale(.96); }
.sidebar-collapse-control:focus-visible { outline: 2px solid #8ba7ff; outline-offset: 3px; }
.admin-sidebar.ant-layout-sider-collapsed .admin-brand { justify-content: center; padding-inline: 0; }
.admin-sidebar.ant-layout-sider-collapsed .admin-brand__link { transform: none; }
.nav-group { display: grid; gap: 5px; }
.nav-group__label { margin: 0 10px 4px; color: #66748d; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.admin-navigation .nav-item { display: flex; width: 100%; min-height: 50px; align-items: center; gap: 11px; padding: 7px 10px; border: 0; border-radius: 8px; background: transparent; color: #9daac1; cursor: pointer; text-align: left; transition: color var(--transition-fast), background-color var(--transition-fast), transform var(--transition-fast), opacity var(--transition-fast); }
.nav-item__icon { display: grid; width: 30px; height: 30px; flex: 0 0 auto; place-items: center; border-radius: 8px; background: rgb(255 255 255 / 5%); }
.nav-item__copy { display: flex; min-width: 0; flex-direction: column; line-height: 1.25; }
.nav-item__copy strong { overflow: hidden; color: inherit; font-size: 13px; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
.nav-item__copy small { overflow: hidden; margin-top: 3px; color: #6f7e98; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.admin-navigation .nav-item svg { width: 16px; height: 16px; }
.admin-navigation .nav-item:hover { background: rgb(255 255 255 / 6%); color: white; }
.admin-navigation .nav-item--active { background: #315bea !important; color: white !important; box-shadow: 0 10px 22px rgb(49 91 234 / 24%); }
.admin-navigation .nav-item--active .nav-item__icon { background: rgb(255 255 255 / 16%); }
.admin-navigation .nav-item--active small { color: rgb(255 255 255 / 72%); }
.admin-shell:not(.admin-shell--mobile) .workspace { padding-top: 72px; }
.workspace-header { position: fixed; z-index: 50; top: 0; right: 0; left: var(--admin-sidebar-width); display: flex; box-sizing: border-box; min-width: 0; height: 72px; padding: 0 28px 0 0 !important; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-border); background: var(--color-surface) !important; line-height: normal; }
.header-left, .header-actions, .user-button, .blog-link { display: flex; align-items: center; }
.header-left { min-width: 0; gap: 8px; overflow: hidden; }
.workspace-status { display: inline-flex; align-items: center; gap: 6px; color: var(--color-text-muted); font-size: 11px; white-space: nowrap; }
.workspace-status i { width: 6px; height: 6px; border-radius: 50%; background: #35b77a; box-shadow: 0 0 0 3px rgb(53 183 122 / 14%); }
.header-actions { min-width: 0; gap: 16px; }
.icon-button { display: grid; width: 36px; height: 36px; place-items: center; border: 1px solid var(--color-border); border-radius: 10px; background: white; color: var(--color-text-secondary); cursor: pointer; }
.blog-link { gap: 7px; color: var(--color-text-secondary); font-size: 13px; font-weight: 650; }
.user-button { min-height: 46px; gap: 10px; padding: 5px 7px; border: 0; border-radius: 12px; background: transparent; color: var(--color-text-secondary); cursor: pointer; }
.user-button:hover { background: var(--color-surface-muted); }
.user-copy { display: flex; align-items: flex-start; flex-direction: column; justify-content: center; gap: 2px; line-height: 1.1; }
.user-copy strong { display: block; color: var(--color-text); font-size: 13px; line-height: 1.2; }
.user-copy small { display: block; color: var(--color-text-muted); font-size: 10px; line-height: 1.2; }
.workspace-content { min-width: 0; max-width: 100%; padding: 30px; overflow-x: hidden; }
.account-menu { min-width: 168px; }
.logout-confirm .ant-modal-confirm-title { font-weight: 750; }
.logout-confirm .ant-modal-confirm-content { color: var(--color-text-secondary); }
.workspace-page-enter-active, .workspace-page-leave-active { transition: opacity var(--transition-fast), transform var(--transition-fast); }
.workspace-page-enter-from { opacity: 0; transform: translateY(5px); }
.workspace-page-leave-to { opacity: 0; }
@media (max-width: 992px) {
  .admin-shell--mobile > .workspace { width: 100%; }
  .admin-shell--mobile .workspace-header { position: sticky; right: auto; left: auto; }
}
@media (max-width: 720px) {
  .workspace-header { height: auto; min-height: 64px; padding: 8px 12px !important; }
  .workspace-content { padding: 18px 14px; }
  .header-left { gap: 8px; }
  .header-actions { gap: 8px; }
  .blog-link span, .user-copy, .workspace-status { display: none; }
}
</style>
