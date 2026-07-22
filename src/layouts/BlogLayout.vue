<template>
  <div class="blog-shell">
    <header class="site-header">
      <div class="app-container header-inner">
        <router-link class="brand" to="/blog" aria-label="LiXD 博客首页">
          <span class="brand-mark">L</span>
          <span><strong>LiXD</strong><small>开发与生活笔记</small></span>
        </router-link>

        <nav class="desktop-nav" aria-label="主导航">
          <router-link v-for="item in navigation" :key="item.to" :to="item.to">{{ item.label }}</router-link>
        </nav>

        <div class="header-actions">
          <form class="quick-search" role="search" @submit.prevent="search">
            <search-outlined />
            <input v-model.trim="query" aria-label="搜索博客" placeholder="搜索文章" />
          </form>
          <router-link class="admin-link" to="/login">管理后台</router-link>
          <button class="menu-button" type="button" aria-label="打开导航" @click="mobileOpen = !mobileOpen">
            <menu-outlined />
          </button>
        </div>
      </div>
      <nav v-if="mobileOpen" class="mobile-nav app-container" aria-label="移动端导航">
        <router-link v-for="item in navigation" :key="item.to" :to="item.to" @click="mobileOpen = false">{{ item.label }}</router-link>
      </nav>
    </header>

    <main class="site-main">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" :key="$route.fullPath" />
        </transition>
      </router-view>
    </main>

    <footer class="site-footer">
      <div class="app-container footer-inner">
        <span>© {{ year }} LiXD. 保持好奇，持续构建。</span>
        <div><router-link to="/blog/about">关于</router-link><router-link to="/blog/categories">归档</router-link></div>
      </div>
    </footer>
    <a-back-top :visibility-height="400" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { MenuOutlined, SearchOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const query = ref('')
const mobileOpen = ref(false)
const year = new Date().getFullYear()
const navigation = [
  { label: '首页', to: '/blog' },
  { label: '动态', to: '/blog/blogdynamic' },
  { label: '归档', to: '/blog/categories' },
  { label: '关于', to: '/blog/about' }
]

function search() {
  if (query.value) router.push({ path: '/blog/search', query: { keyword: query.value } })
}
</script>

<style scoped>
.blog-shell { display: flex; min-height: 100vh; flex-direction: column; background: var(--color-page); }
.site-header { position: sticky; z-index: 100; top: 0; border-bottom: 1px solid rgb(226 231 239 / 82%); background: rgb(255 255 255 / 90%); backdrop-filter: blur(18px); }
.header-inner { display: flex; min-height: 72px; align-items: center; gap: 32px; }
.brand { display: flex; flex-shrink: 0; align-items: center; gap: 10px; }
.brand-mark { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 11px; background: var(--color-primary); color: white; font-size: 20px; font-weight: 800; box-shadow: 0 8px 20px rgb(49 91 234 / 25%); }
.brand > span:last-child { display: flex; flex-direction: column; line-height: 1.2; }
.brand small { margin-top: 3px; color: var(--color-text-muted); font-size: 11px; }
.desktop-nav { display: flex; align-items: center; gap: 6px; }
.desktop-nav a, .mobile-nav a { padding: 9px 13px; border-radius: var(--radius-sm); color: var(--color-text-secondary); font-weight: 550; }
.desktop-nav a:hover, .desktop-nav a.router-link-active { background: var(--color-primary-soft); color: var(--color-primary); }
.header-actions { display: flex; margin-left: auto; align-items: center; gap: 10px; }
.quick-search { display: flex; width: 190px; height: 40px; align-items: center; gap: 8px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 999px; background: var(--color-surface-muted); color: var(--color-text-muted); }
.quick-search:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgb(49 91 234 / 10%); }
.quick-search input { width: 100%; border: 0; outline: 0; background: transparent; color: var(--color-text); }
.admin-link { padding: 9px 14px; border-radius: 999px; background: var(--color-text); color: white; font-size: 13px; font-weight: 650; }
.menu-button { display: none; width: 40px; height: 40px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: white; color: var(--color-text); }
.mobile-nav { display: none; padding-block: 8px 16px; }
.site-main { flex: 1; }
.site-footer { border-top: 1px solid var(--color-border); background: white; color: var(--color-text-secondary); }
.footer-inner { display: flex; min-height: 92px; align-items: center; justify-content: space-between; gap: 20px; font-size: 13px; }
.footer-inner div { display: flex; gap: 20px; }
.page-enter-active, .page-leave-active { transition: opacity var(--transition-fast), transform var(--transition-fast); }
.page-enter-from { opacity: 0; transform: translateY(5px); }
.page-leave-to { opacity: 0; }
@media (max-width: 900px) { .desktop-nav, .admin-link { display: none; } .menu-button, .mobile-nav { display: flex; } .mobile-nav { flex-direction: column; } }
@media (max-width: 620px) { .quick-search { width: 42px; padding: 0 12px; } .quick-search input { width: 0; } .quick-search:focus-within { position: absolute; right: 64px; left: 14px; width: auto; background: white; } .quick-search:focus-within input { width: 100%; } .footer-inner { align-items: flex-start; flex-direction: column; justify-content: center; } }
</style>
