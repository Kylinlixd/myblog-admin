<template>
  <div class="blog-shell" :class="{ 'blog-shell--home': route.name === 'BlogHome' }">
    <div v-if="route.name !== 'BlogHome'" class="blog-atmosphere" aria-hidden="true">
      <span class="blog-atmosphere__orb blog-atmosphere__orb--one" />
      <span class="blog-atmosphere__orb blog-atmosphere__orb--two" />
      <span class="blog-atmosphere__noise" />
    </div>
    <header class="site-header" @keydown.esc="mobileOpen = false">
      <div class="site-header-panel app-container header-inner">
        <router-link class="brand" to="/blog" aria-label="时不语之间首页">
          <span class="brand-mark"><img src="/logo-coffee-code.png" alt="" aria-hidden="true" /></span>
          <span><strong>时不语之间</strong><small>Silent Time</small></span>
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
            <input v-model.trim="query" type="search" autocomplete="off" aria-label="搜索博客" placeholder="搜索文章" />
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
        <span>© {{ year }} 时不语之间。保持好奇，持续构建。</span>
        <div><router-link to="/blog/about">自叙</router-link><router-link to="/blog/categories">拾光</router-link></div>
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
  { label: '此间', to: '/blog' },
  { label: '书遇', to: '/blog/blogdynamic' },
  { label: '拾光', to: '/blog/categories' },
  { label: '自叙', to: '/blog/about' }
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
.blog-shell { position: relative; display: flex; min-height: 100vh; flex-direction: column; /* clip 而不是 hidden：保持横向裁切的同时不产生滚动容器，sticky（导航、表格表头）才能生效 */ overflow-x: clip; background: var(--blog-bg); color: var(--blog-text); isolation: isolate; /* 悬浮导航的几何：药丸 top 偏移与整体高度；首页 hero 的 min-height 也用 --header-height，两边必须同源 */ --header-top: 14px; --header-height: 76px; /* 阅读线：药丸底边（top + height = 76px）再加 20px 余量 = 96px。
   页面上所有吸顶/固定元素（文章目录、阅读进度条锚点、书遇的时间轴）都读它，
   免得各页各写一个 top，撞上悬浮导航就被压住。 */ --reading-offset: calc(var(--header-height) + 20px); }
.blog-shell--home { --header-height: 76px; }
.blog-shell--home .site-main { padding-top: var(--header-height); }
.blog-shell--home .site-footer { background: #eee8dd; backdrop-filter: none; content-visibility: auto; contain-intrinsic-size: auto 112px; }
.site-header { position: sticky; z-index: var(--z-header); top: var(--header-top); height: 0; }
/*
 * 导航遮罩带（实底，不再渐隐）。
 * 悬浮药丸只有 62px 高、离顶 14px，横向还被 .app-container 收窄；若只靠半透明玻璃，
 * 正文向上滚时会从药丸后面"透"出来、也从上方 14px 与左右两侧留白"绕过"，看起来像
 * 正文穿过了导航栏。所以这里在导航这一层铺一条**通栏实底**的带子，垂直正好盖住
 * 药丸的完整跨度（从视口顶 -header-top 到药丸底边 = top + height），正文滚到带子下沿
 * 就被干净地挡住，而不是"渐隐到某处突然断"。
 * 带子颜色取 .blog-atmosphere 的顶部同色，而氛围层本身是 fixed 的，两者永远接得上。
 * z-index: -1 让带子待在药丸之下，但仍在 header 的层叠上下文里（不会掉到正文下面）。
 */
.site-header::before { position: absolute; z-index: -1; top: calc(-1 * var(--header-top)); right: 0; left: 0; height: calc(var(--header-height) + var(--header-top)); background: #f8f3e9; content: ''; pointer-events: none; }
.site-header-panel { display: grid; min-height: 62px; grid-template-columns: minmax(180px, 1fr) auto minmax(240px, 1fr); align-items: center; gap: 24px; border: 1px solid rgb(108 82 54 / 18%); border-radius: 20px; padding: 0 12px 0 18px; background: #fffaf2; box-shadow: 0 18px 50px rgb(89 61 34 / 12%); }
.brand { display: flex; width: max-content; align-items: center; gap: 10px; }
.brand-mark { display: grid; width: 40px; height: 40px; flex: 0 0 auto; place-items: center; }
.brand-mark img { display: block; width: 100%; height: 100%; object-fit: contain; }
.brand > span:last-child { display: flex; flex-direction: column; line-height: 1.05; }
.brand strong { font-size: 13px; letter-spacing: .1em; }
.brand small { margin-top: 5px; color: var(--blog-text-muted); font-size: 8px; letter-spacing: .09em; }
.desktop-nav { display: flex; align-items: center; justify-content: center; gap: 4px; }
.desktop-nav a, .mobile-nav a { position: relative; min-height: 44px; padding: 0 13px; border-radius: 12px; color: var(--blog-text-soft); font-size: 13px; font-weight: 650; line-height: 44px; transition: color .28s ease, background-color .28s ease; }
.desktop-nav a::after, .mobile-nav a::after { position: absolute; bottom: 7px; left: 50%; width: calc(100% - 26px); height: 2px; border-radius: 999px; background: var(--blog-accent-strong); content: ''; opacity: 0; transform: translateX(-50%) scaleX(0); transform-origin: center; transition: opacity .28s ease, transform .34s cubic-bezier(.22, .7, .25, 1); }
.desktop-nav a:hover, .mobile-nav a:hover { background: rgb(200 111 55 / 11%); color: var(--blog-accent-strong); }
.desktop-nav a.nav-link--active, .mobile-nav a.nav-link--active { background: transparent; color: var(--blog-accent-strong); }
.desktop-nav a.nav-link--active::after, .mobile-nav a.nav-link--active::after { opacity: 1; transform: translateX(-50%) scaleX(1); }
.desktop-nav a:not(.nav-link--active)::after { transform: translateX(-50%) scaleX(0); }
.header-actions { display: flex; min-width: 0; align-items: center; justify-content: flex-end; gap: 9px; }
.quick-search { display: flex; min-width: 0; width: 188px; height: 40px; align-items: center; gap: 8px; padding: 0 12px; border: 1px solid var(--blog-line); border-radius: 999px; background: rgb(255 253 248 / 84%); color: var(--blog-text-muted); transition: border-color .28s ease, box-shadow .28s ease; }
.quick-search:hover { border-color: rgb(108 82 54 / 28%); }
.quick-search:focus-within { border-color: var(--blog-accent); box-shadow: 0 0 0 3px rgb(200 111 55 / 12%); }
.quick-search-button { display: grid; flex: 0 0 20px; width: 20px; height: 20px; place-items: center; border: 0; padding: 0; background: transparent; color: inherit; cursor: pointer; }
.quick-search-button:hover { color: var(--blog-accent); }
.quick-search input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--blog-text); }
.quick-search input::-webkit-search-cancel-button { cursor: pointer; }
.quick-search input::placeholder { color: #8d857a; }
.admin-link { min-height: 40px; padding: 0 14px; border-radius: 999px; background: var(--blog-text); color: #fffaf2; font-size: 12px; font-weight: 750; line-height: 40px; transition: background-color .28s ease; }
.admin-link:hover { background: #10202f; }
.menu-button { display: none; width: 44px; height: 44px; border: 1px solid var(--blog-line); border-radius: 12px; background: var(--blog-paper); color: var(--blog-text); }
.mobile-nav { display: none; margin-top: 8px; padding: 12px; border: 1px solid var(--blog-line); border-radius: 18px; background: rgb(255 250 242 / 96%); box-shadow: 0 24px 60px rgb(89 61 34 / 18%); }
.mobile-admin-link { display: none; }
/* 内容整体住在 --z-content 这一层：里面的固定元素（右侧目录、阅读进度条）再怎么写
   z-index 也翻不过 --z-header，这就是「正文永远不会盖住导航」的结构保证。 */
.site-main { position: relative; z-index: var(--z-content); flex: 1; padding-top: var(--header-height); }
.site-footer { position: relative; z-index: var(--z-content); border-top: 1px solid var(--blog-line); background: rgb(239 229 212 / 78%); color: var(--blog-text-muted); backdrop-filter: blur(18px); }
.footer-inner { display: flex; min-height: 112px; align-items: center; justify-content: space-between; gap: 20px; font-size: 12px; }
.footer-inner div { display: flex; gap: 20px; }
.footer-inner a:hover { color: var(--blog-accent-strong); }
.page-enter-active, .page-leave-active { transition: opacity var(--transition-fast), transform var(--transition-fast); }
.page-enter-from { opacity: 0; transform: translateY(5px); }
.page-leave-to { opacity: 0; }
@media (max-width: 960px) { .site-header-panel { grid-template-columns: minmax(150px, 1fr) auto; } .desktop-nav, .admin-link { display: none; } .menu-button, .mobile-nav { display: flex; } .mobile-nav { flex-direction: column; gap: 4px; } .mobile-admin-link { display: flex; min-height: 44px; align-items: center; justify-content: center; margin-top: 5px; background: var(--blog-text); color: #fffaf2 !important; font-weight: 750; } }
@media (max-width: 620px) { .blog-shell { --header-top: 8px; --header-height: 66px; } .site-header-panel { width: calc(100% - 20px); min-height: 58px; gap: 7px; padding-inline: 10px; } .brand { flex: 0 0 auto; } .brand-mark { width: 38px; height: 38px; } .header-actions { min-width: 0; flex: 1 1 auto; gap: 6px; } .quick-search { flex: 1 1 auto; width: auto; min-width: 0; max-width: none; height: 40px; padding: 0 11px; } .quick-search input { width: 100%; min-width: 0; font-size: 13px; } .menu-button { flex: 0 0 40px; width: 40px; height: 40px; } .brand small { display: none; } .footer-inner { align-items: flex-start; flex-direction: column; justify-content: center; } }
@media (max-width: 390px) { .brand > span:last-child { display: none; } .site-header-panel { grid-template-columns: auto minmax(0, 1fr); } .quick-search { height: 36px; padding-inline: 10px; } .quick-search-button { flex-basis: 16px; width: 16px; height: 16px; } .quick-search input { font-size: 12px; } }
</style>
