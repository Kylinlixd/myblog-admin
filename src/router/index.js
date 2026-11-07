import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useUserStore } from '../stores/user'
import { t, setLocale, currentLocale } from '../i18n'
import { message } from 'ant-design-vue'

const routes = [
  {
    path: '/',
    redirect: '/blog'
  },
  {
    path: '/dynamics',
    component: () => import(/* webpackPrefetch: true */ '../views/dynamics/DynamicList.vue'),
    meta: { 
      requiresAuth: true,
      title: 'shell.menu.dynamics'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackPrefetch: true */ '../views/Login.vue'),
    meta: { 
      title: 'login.title',
      requiresAuth: false
    }
  },
  {
    // 可选 locale 前缀：/blog = 中文（SEO 默认），/en/blog = English……
    // 单一路由树：keep-alive 按 fullPath 分实例、命名路由全部保留。
    // 语言切换 = 切换 URL 前缀（BlogLayout onLocalePick → router.push）。
    path: '/:locale(en|ja|ko|es|fr)?',
    component: () => import(/* webpackPrefetch: true */ '../layouts/BlogLayout.vue'),
    meta: {
      blog: true,
      requiresAuth: false
    },
    children: [
      {
        path: 'blog',
        name: 'BlogHome',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogHome.vue'),
        meta: { 
          title: 'nav.home',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'blog/blogdynamic',
        name: 'BlogDynamic',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogDynamic.vue'),
        meta: { 
          title: 'nav.book',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'blog/categories',
        name: 'BlogCategories',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogCategories.vue'),
        meta: { 
          title: 'nav.light',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'blog/collections/:id',
        name: 'BlogCollectionDetail',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogCollectionDetail.vue'),
        meta: {
          title: 'collection.kicker',
          keepAlive: false,
          requiresAuth: false
        }
      },
      {
        path: 'blog/categories/:id/',
        name: 'BlogCategoryDetail',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogCategoryDetail.vue'),
        meta: { 
          title: 'nav.light',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'blog/dynamics/:id',
        name: 'BlogDynamicDetail',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogDynamicDetail.vue'),
        meta: { 
          title: 'nav.book',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'blog/about',
        name: 'BlogAbout',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogAbout.vue'),
        meta: { 
          title: 'nav.about',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'blog/tools',
        name: 'BlogTools',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogTools.vue'),
        meta: {
          title: 'nav.tools',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'blog/search',
        name: 'BlogSearch',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogSearch.vue'),
        meta: { 
          title: 'search.heroTitle',
          keepAlive: false,
          requiresAuth: false
        }
      },
      {
        path: 'blog/tags/:id',
        name: 'BlogTagDetail',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogTagDetail.vue'),
        meta: { 
          title: 'nav.book',
          keepAlive: false,
          requiresAuth: false
        }
      }
    ]
  },
  {
    path: '/dashboard',
    component: () => import(/* webpackPrefetch: true */ '../layouts/DefaultLayout.vue'),
    redirect: '/dashboard',
    meta: { 
      requiresAuth: true,
      title: 'shell.console'
    },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import(/* webpackPrefetch: true */ '../views/Dashboard.vue'),
        meta: { 
          title: 'shell.menu.dashboard',
          icon: 'Monitor',
          keepAlive: true
        }
      },
      {
        path: 'dynamics',
        name: 'Dynamics',
        component: () => import(/* webpackPrefetch: true */ '../views/dynamics/DynamicList.vue'),
        meta: {
          title: 'shell.menu.dynamics',
          icon: 'dynamic'
        }
      },
      {
        path: 'dynamics/create',
        name: 'CreateDynamic',
        component: () => import(/* webpackPrefetch: true */ '../views/dynamics/DynamicEdit.vue'),
        meta: {
          title: 'dynamicMgr.createTitle',
          icon: 'dynamic'
        }
      },
      {
        path: 'dynamics/edit/:id',
        name: 'EditDynamic',
        component: () => import(/* webpackPrefetch: true */ '../views/dynamics/DynamicEdit.vue'),
        meta: {
          title: 'dynamicMgr.editTitle',
          icon: 'dynamic'
        }
      },
      {
        path: 'dynamics/preview',
        redirect: {
          name: 'PreviewDynamic',
          params: { id: 'draft' }
        }
      },
      {
        path: 'dynamics/preview/:id',
        name: 'PreviewDynamic',
        component: () => import(/* webpackPrefetch: true */ '../views/dynamics/DynamicPreview.vue'),
        meta: {
          title: 'dynamicMgr.previewPageTitle',
          icon: 'dynamic'
        }
      },
      {
        path: 'category',
        name: 'Category',
        component: () => import(/* webpackPrefetch: true */ '../views/categories/CategoryList.vue'),
        meta: {
          title: 'shell.menu.category',
          icon: 'Folder',
          keepAlive: true
        }
      },
      {
        path: 'collections',
        name: 'Collections',
        component: () => import(/* webpackPrefetch: true */ '../views/collections/CollectionList.vue'),
        meta: {
          title: 'shell.menu.collections',
          icon: 'collection',
          keepAlive: true
        }
      },
      {
        path: 'collections/create',
        name: 'CreateCollection',
        component: () => import(/* webpackPrefetch: true */ '../views/collections/CollectionEdit.vue'),
        meta: {
          title: 'collectionMgr.createTitle',
          icon: 'collection'
        }
      },
      {
        path: 'collections/edit/:id',
        name: 'EditCollection',
        component: () => import(/* webpackPrefetch: true */ '../views/collections/CollectionEdit.vue'),
        meta: {
          title: 'collectionMgr.editTitle',
          icon: 'collection'
        }
      },
      {
        path: 'tags',
        name: 'Tags',
        component: () => import(/* webpackPrefetch: true */ '../views/tags/TagList.vue'),
        meta: {
          title: 'shell.menu.tags',
          icon: 'Collection',
          keepAlive: true
        }
      },
      {
        path: 'comments',
        name: 'Comments',
        component: () => import('../views/comments/CommentList.vue'),
        meta: { 
          title: 'shell.menu.comments',
          icon: 'ChatDotRound',
          keepAlive: true,
          permissions: ['comment:view']
        }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/user/Profile.vue'),
        meta: { 
          title: 'shell.profile',
          icon: 'User',
          keepAlive: false,
          hideInMenu: true
        }
      },
      {
        path: 'files',
        name: 'FileList',
        component: () => import('@/views/files/FileList.vue'),
        meta: {
          title: 'shell.menu.files',
          requiresAuth: true
        }
      },
      {
        path: 'access-logs',
        name: 'AccessLogs',
        component: () => import('@/views/accessLogs/AccessLogList.vue'),
        meta: { title: 'shell.menu.logs', requiresAuth: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: {
      title: 'notFound.title',
      hideInMenu: true,
      requiresAuth: false
    }
  }
]

const router = createRouter({
  history: process.env.NODE_ENV === 'test' ? createMemoryHistory() : createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 应用内当前博客语言：null = zh（无前缀）。应用内点击任何未带前缀的
// /blog 链接时守卫自动补前缀，链接代码无需感知 locale。
let activeBlogLocale = null

/**
 * 语言切换器专用：切到 zh 时把守卫的「应用内语言记忆」清空，
 * 否则 push('/blog') 会被「保持当前语言」改写回带前缀路径。
 */
export function resetBlogLocaleState() {
  activeBlogLocale = null
}

router.beforeEach(async (to, from) => {
  const appStore = useAppStore()
  const userStore = useUserStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth === true)
  const isAuthPage = to.name === 'Login'

  appStore.hasError = false
  appStore.startNavigation()

  /* ---- URL 语言解析（SEO：URL 是博客语言的唯一事实源） ----
   * - /en/blog 直达 → en；/blog 直达（首次导航）→ zh（无前缀即默认语言）
   * - 应用内点未带前缀的博客链接 → 自动补当前语言前缀（保持语言）
   * - /en、/ja 等空父级匹配 → 重定向到对应语言的博客首页
   * - 非博客路由（/dashboard、/login）不参与，仍走 localStorage */
  if (to.matched.some((record) => record.meta.blog)) {
    const prefix = typeof to.params.locale === 'string' && to.params.locale ? to.params.locale : null
    // 空父级（/en）：仅父级匹配，先于 prefix 分支重定向，否则会渲染空布局
    if (to.matched.length === 1) {
      return { path: `/${prefix}/blog` }
    }
    if (prefix) {
      activeBlogLocale = prefix
      if (currentLocale.value !== prefix) setLocale(prefix)
      return true
    }
    const isInitialNavigation = from.matched.length === 0
    if (isInitialNavigation) {
      // 直接访问无前缀博客路由 = 默认语言（爬虫看到的 /blog 恒为中文）
      activeBlogLocale = 'zh'
      if (currentLocale.value !== 'zh') setLocale('zh')
      return true
    }
    if (activeBlogLocale && activeBlogLocale !== 'zh') {
      return { path: `/${activeBlogLocale}${to.fullPath}` }
    }
    activeBlogLocale = 'zh'
    return true
  }

  if ((requiresAuth || isAuthPage) && !to.path.startsWith('/blog') && !userStore.initialized) {
    await userStore.initialize()
  }

  if (isAuthPage && userStore.isLoggedIn) {
    return { name: 'Dashboard' }
  }

  if (requiresAuth && !userStore.isLoggedIn) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  const requiredRoles = to.meta.roles || []
  const userRoles = userStore.userInfo?.roles || []
  if (requiredRoles.length && !requiredRoles.some((role) => userRoles.includes(role))) {
    message.error(t('shell.noPermission'))
    return { name: 'Dashboard' }
  }

  return true
})

// 路由加载完成后处理
router.afterEach((to) => {
  const appStore = useAppStore()
  appStore.endNavigation()
  sessionStorage.removeItem('vite-chunk-recovery')
  document.title = to.meta.title ? `${t(to.meta.title)}｜${t('common.siteName')}` : `${t('nav.home')}｜${t('common.siteName')}`
})

// 添加路由错误处理
router.onError((error) => {
  console.error('[Router]', error)
  const isChunkLoadError = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(error?.message || '')
  if (isChunkLoadError && !sessionStorage.getItem('vite-chunk-recovery')) {
    sessionStorage.setItem('vite-chunk-recovery', '1')
    window.location.reload()
    return
  }
  sessionStorage.removeItem('vite-chunk-recovery')
  const appStore = useAppStore()
  appStore.hasError = true
  appStore.errorMessage = error.message || t('shell.routeLoadFailed')
  appStore.endNavigation()
})

export default router
