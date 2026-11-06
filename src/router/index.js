import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useUserStore } from '../stores/user'
import { t } from '../i18n'
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
    path: '/blog',
    component: () => import(/* webpackPrefetch: true */ '../layouts/BlogLayout.vue'),
    meta: { 
      requiresAuth: false,
      title: 'nav.home'
    },
    children: [
      {
        path: '',
        name: 'BlogHome',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogHome.vue'),
        meta: { 
          title: 'nav.home',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'blogdynamic',
        name: 'BlogDynamic',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogDynamic.vue'),
        meta: { 
          title: 'nav.book',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'categories',
        name: 'BlogCategories',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogCategories.vue'),
        meta: { 
          title: 'nav.light',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'collections/:id',
        name: 'BlogCollectionDetail',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogCollectionDetail.vue'),
        meta: {
          title: 'collection.kicker',
          keepAlive: false,
          requiresAuth: false
        }
      },
      {
        path: 'categories/:id/',
        name: 'BlogCategoryDetail',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogCategoryDetail.vue'),
        meta: { 
          title: 'nav.light',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'dynamics/:id',
        name: 'BlogDynamicDetail',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogDynamicDetail.vue'),
        meta: { 
          title: 'nav.book',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'about',
        name: 'BlogAbout',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogAbout.vue'),
        meta: { 
          title: 'nav.about',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'tools',
        name: 'BlogTools',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogTools.vue'),
        meta: {
          title: 'nav.tools',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'search',
        name: 'BlogSearch',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogSearch.vue'),
        meta: { 
          title: 'search.heroTitle',
          keepAlive: false,
          requiresAuth: false
        }
      },
      {
        path: 'tags/:id',
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

router.beforeEach(async (to) => {
  const appStore = useAppStore()
  const userStore = useUserStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth === true)
  const isAuthPage = to.name === 'Login'

  appStore.hasError = false
  appStore.startNavigation()

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
