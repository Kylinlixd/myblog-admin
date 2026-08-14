<template>
  <div class="blog-shell" :class="{ 'blog-shell--home': route.name === 'BlogHome' }">
    <div class="blog-atmosphere" aria-hidden="true">
      <span class="blog-atmosphere__orb blog-atmosphere__orb--one" />
      <span class="blog-atmosphere__orb blog-atmosphere__orb--two" />
      <span class="blog-atmosphere__grid" />
      <span class="blog-atmosphere__noise" />
    </div>
    <header class="site-header" @keydown.esc="mobileOpen = false">
      <div class="site-header-panel app-container header-inner">
        <router-link class="brand" to="/blog" aria-label="LiXD 博客首页">
          <span class="brand-mark">L</span>
          <span><strong>LIXD</strong><small>DIGITAL GARDEN</small></span>
        </router-link>

        <nav class="desktop-nav" aria-label="主导航">
          <router-link
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            active-class=""
            exact-active-class=""
            :class="{ 'nav-link--active': isNavigationActive(item) }"
          >
            {{ item.label }}
          </router-link>
        </nav>

        <div class="header-actions">
          <form class="quick-search" role="search" @submit.prevent="search">
            <button class="quick-search-button" type="submit" aria-label="提交搜索">
              <search-outlined />
            </button>
            <input v-model.trim="query" aria-label="搜索博客" placeholder="搜索文章" />
          </form>
          <router-link class="admin-link" to="/login">管理后台</router-link>
          <button
            class="menu-button"
            type="button"
            aria-label="打开导航"
            aria-controls="mobile-navigation"
            :aria-expanded="mobileOpen"
            @click="mobileOpen = !mobileOpen"
          >
            <menu-outlined />
          </button>
        </div>
      </div>
      <nav v-if="mobileOpen" id="mobile-navigation" class="mobile-nav app-container" aria-label="移动端导航">
        <router-link
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          active-class=""
          exact-active-class=""
          :class="{ 'nav-link--active': isNavigationActive(item) }"
          @click="mobileOpen = false"
        >
          {{ item.label }}
        </router-link>
        <router-link class="mobile-admin-link" to="/login" @click="mobileOpen = false">管理后台</router-link>
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
import { useRoute, useRouter } from 'vue-router'
import { MenuOutlined, SearchOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
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
  if (!query.value) return
  router.push({ path: '/blog/search', query: { keyword: query.value } })
  mobileOpen.value = false
}

function isNavigationActive(item) {
  const currentPath = route.path
  if (item.to === '/blog') {
    return currentPath === '/blog' || currentPath === '/blog/'
  }
  return currentPath === item.to || currentPath.startsWith(`${item.to}/`)
}
</script>

<style scoped>
.blog-shell { position: relative; display: flex; min-height: 100vh; flex-direction: column; overflow-x: hidden; background: var(--blog-bg); color: var(--blog-text); isolation: isolate; }
.blog-shell--home { --content-width: min(1480px, calc(100vw - 64px)); }
.site-header { position: sticky; z-index: 100; top: 14px; height: 0; }
.site-header-panel { display: grid; min-height: 62px; grid-template-columns: minmax(180px, 1fr) auto minmax(240px, 1fr); align-items: center; gap: 24px; border: 1px solid rgb(108 82 54 / 15%); border-radius: 20px; padding: 0 12px 0 18px; background: rgb(255 250 242 / 82%); box-shadow: 0 18px 50px rgb(89 61 34 / 12%); backdrop-filter: blur(22px); }
.brand { display: flex; width: max-content; align-items: center; gap: 10px; }
.brand-mark { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 10px; background: var(--blog-accent); color: white; font-size: 17px; font-weight: 800; box-shadow: 0 8px 24px rgb(200 111 55 / 27%); }
.brand > span:last-child { display: flex; flex-direction: column; line-height: 1.05; }
.brand strong { font-size: 13px; letter-spacing: .1em; }
.brand small { margin-top: 5px; color: var(--blog-text-muted); font-size: 8px; letter-spacing: .09em; }
.desktop-nav { display: flex; align-items: center; justify-content: center; gap: 4px; }
.desktop-nav a, .mobile-nav a { min-height: 44px; padding: 0 13px; border-radius: 12px; color: var(--blog-text-soft); font-size: 13px; font-weight: 650; line-height: 44px; }
.desktop-nav a:hover, .desktop-nav a.nav-link--active, .mobile-nav a.nav-link--active { background: rgb(200 111 55 / 11%); color: var(--blog-accent-strong); }
.header-actions { display: flex; min-width: 0; align-items: center; justify-content: flex-end; gap: 9px; }
.quick-search { display: flex; width: 188px; height: 40px; align-items: center; gap: 8px; padding: 0 12px; border: 1px solid var(--blog-line); border-radius: 999px; background: rgb(255 253 248 / 84%); color: var(--blog-text-muted); }
.quick-search:focus-within { border-color: var(--blog-accent); box-shadow: 0 0 0 3px rgb(200 111 55 / 12%); }
.quick-search-button { display: grid; flex: 0 0 20px; width: 20px; height: 20px; place-items: center; border: 0; padding: 0; background: transparent; color: inherit; cursor: pointer; }
.quick-search-button:hover { color: var(--blog-accent); }
.quick-search input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--blog-text); }
.quick-search input::placeholder { color: #8d857a; }
.admin-link { min-height: 40px; padding: 0 14px; border-radius: 999px; background: var(--blog-text); color: #fffaf2; font-size: 12px; font-weight: 750; line-height: 40px; }
.menu-button { display: none; width: 44px; height: 44px; border: 1px solid var(--blog-line); border-radius: 12px; background: var(--blog-paper); color: var(--blog-text); }
.mobile-nav { display: none; margin-top: 8px; padding: 12px; border: 1px solid var(--blog-line); border-radius: 18px; background: rgb(255 250 242 / 96%); box-shadow: 0 24px 60px rgb(89 61 34 / 18%); }
.mobile-admin-link { display: none; }
.site-main { position: relative; z-index: 1; flex: 1; padding-top: 62px; }
.site-footer { position: relative; z-index: 1; border-top: 1px solid var(--blog-line); background: rgb(239 229 212 / 78%); color: var(--blog-text-muted); backdrop-filter: blur(18px); }
.footer-inner { display: flex; min-height: 112px; align-items: center; justify-content: space-between; gap: 20px; font-size: 12px; }
.footer-inner div { display: flex; gap: 20px; }
.footer-inner a:hover { color: var(--blog-accent-strong); }
.page-enter-active, .page-leave-active { transition: opacity var(--transition-fast), transform var(--transition-fast); }
.page-enter-from { opacity: 0; transform: translateY(5px); }
.page-leave-to { opacity: 0; }
@media (max-width: 960px) { .site-header-panel { grid-template-columns: minmax(150px, 1fr) auto; } .desktop-nav, .admin-link { display: none; } .menu-button, .mobile-nav { display: flex; } .mobile-nav { flex-direction: column; gap: 4px; } .mobile-admin-link { display: flex; min-height: 44px; align-items: center; justify-content: center; margin-top: 5px; background: var(--blog-text); color: #fffaf2 !important; font-weight: 750; } }
@media (max-width: 620px) { .site-header { top: 8px; } .site-header-panel { width: calc(100% - 20px); min-height: 58px; gap: 8px; padding-inline: 10px; } .brand-mark { width: 34px; height: 34px; } .header-actions { min-width: 0; } .quick-search { flex: 1 1 138px; width: auto; min-width: 118px; max-width: 174px; height: 40px; padding: 0 10px; } .quick-search input { width: 100%; min-width: 0; font-size: 12px; } .brand small { display: none; } .footer-inner { align-items: flex-start; flex-direction: column; justify-content: center; } }
@media (max-width: 390px) { .brand > span:last-child { display: none; } .site-header-panel { grid-template-columns: auto 1fr; } }
</style>
