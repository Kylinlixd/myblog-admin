<template>
  <div class="blog-shell">
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
.blog-shell { display: flex; min-height: 100vh; flex-direction: column; overflow-x: hidden; background: #060b14; color: #edf3ff; }
.site-header { position: sticky; z-index: 100; top: 14px; height: 0; }
.site-header-panel { display: grid; min-height: 62px; grid-template-columns: minmax(180px, 1fr) auto minmax(240px, 1fr); align-items: center; gap: 24px; border: 1px solid rgb(142 169 216 / 16%); border-radius: 20px; padding: 0 12px 0 18px; background: rgb(8 17 30 / 78%); box-shadow: 0 18px 50px rgb(0 0 0 / 22%); backdrop-filter: blur(22px); }
.brand { display: flex; width: max-content; align-items: center; gap: 10px; }
.brand-mark { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 10px; background: #315bea; color: white; font-size: 17px; font-weight: 800; box-shadow: 0 8px 24px rgb(49 91 234 / 32%); }
.brand > span:last-child { display: flex; flex-direction: column; line-height: 1.05; }
.brand strong { font-size: 13px; letter-spacing: .1em; }
.brand small { margin-top: 5px; color: #627896; font-size: 8px; letter-spacing: .09em; }
.desktop-nav { display: flex; align-items: center; justify-content: center; gap: 4px; }
.desktop-nav a, .mobile-nav a { min-height: 44px; padding: 0 13px; border-radius: 12px; color: #91a2bc; font-size: 13px; font-weight: 600; line-height: 44px; }
.desktop-nav a:hover, .desktop-nav a.nav-link--active, .mobile-nav a.nav-link--active { background: rgb(109 145 255 / 12%); color: #edf3ff; }
.header-actions { display: flex; min-width: 0; align-items: center; justify-content: flex-end; gap: 9px; }
.quick-search { display: flex; width: 188px; height: 40px; align-items: center; gap: 8px; padding: 0 12px; border: 1px solid #263a57; border-radius: 999px; background: rgb(17 30 49 / 72%); color: #7185a3; }
.quick-search:focus-within { border-color: #668aff; box-shadow: 0 0 0 3px rgb(80 119 255 / 15%); }
.quick-search-button { display: grid; flex: 0 0 20px; width: 20px; height: 20px; place-items: center; border: 0; padding: 0; background: transparent; color: inherit; cursor: pointer; }
.quick-search-button:hover { color: #a9bfff; }
.quick-search input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: #edf3ff; }
.quick-search input::placeholder { color: #627690; }
.admin-link { min-height: 40px; padding: 0 14px; border-radius: 999px; background: #edf3ff; color: #07101d; font-size: 12px; font-weight: 750; line-height: 40px; }
.menu-button { display: none; width: 44px; height: 44px; border: 1px solid #2a3e5c; border-radius: 12px; background: #101d30; color: #edf3ff; }
.mobile-nav { display: none; margin-top: 8px; padding: 12px; border: 1px solid #223650; border-radius: 18px; background: rgb(8 17 30 / 96%); box-shadow: 0 24px 60px rgb(0 0 0 / 35%); }
.mobile-admin-link { display: none; }
.site-main { flex: 1; padding-top: 62px; }
.site-footer { border-top: 1px solid #17263b; background: #060b14; color: #72849f; }
.footer-inner { display: flex; min-height: 112px; align-items: center; justify-content: space-between; gap: 20px; font-size: 12px; }
.footer-inner div { display: flex; gap: 20px; }
.footer-inner a:hover { color: #a8bcdb; }
.page-enter-active, .page-leave-active { transition: opacity var(--transition-fast), transform var(--transition-fast); }
.page-enter-from { opacity: 0; transform: translateY(5px); }
.page-leave-to { opacity: 0; }
@media (max-width: 960px) { .site-header-panel { grid-template-columns: minmax(150px, 1fr) auto; } .desktop-nav, .admin-link { display: none; } .menu-button, .mobile-nav { display: flex; } .mobile-nav { flex-direction: column; gap: 4px; } .mobile-admin-link { display: flex; min-height: 44px; align-items: center; justify-content: center; margin-top: 5px; background: #edf3ff; color: #07101d !important; font-weight: 750; } }
@media (max-width: 620px) { .site-header { top: 8px; } .site-header-panel { width: calc(100% - 20px); min-height: 58px; gap: 8px; padding-inline: 10px; } .brand-mark { width: 34px; height: 34px; } .header-actions { min-width: 0; } .quick-search { flex: 1 1 138px; width: auto; min-width: 118px; max-width: 174px; height: 40px; padding: 0 10px; } .quick-search input { width: 100%; min-width: 0; font-size: 12px; } .brand small { display: none; } .footer-inner { align-items: flex-start; flex-direction: column; justify-content: center; } }
@media (max-width: 390px) { .brand > span:last-child { display: none; } .site-header-panel { grid-template-columns: auto 1fr; } }
</style>
