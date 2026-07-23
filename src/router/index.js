import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useUserStore } from '../stores/user'
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
      title: '动态管理'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackPrefetch: true */ '../views/Login.vue'),
    meta: { 
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import(/* webpackPrefetch: true */ '../views/Register.vue'),
    meta: { 
      title: '注册',
      requiresAuth: false
    }
  },
  {
    path: '/test',
    name: 'TestLampEffect',
    component: () => import('../components/TestLampEffect.vue'),
    meta: { 
      title: '测试页面',
      keepAlive: false,
      requiresAuth: true // 测试页面需要登录验证
    }
  },
  {
    path: '/blog',
    component: () => import(/* webpackPrefetch: true */ '../layouts/BlogLayout.vue'),
    meta: { 
      requiresAuth: false,
      title: '博客首页'
    },
    children: [
      {
        path: '',
        name: 'BlogHome',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogHome.vue'),
        meta: { 
          title: '博客首页',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'blogdynamic',
        name: 'BlogDynamic',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogDynamic.vue'),
        meta: { 
          title: '博客动态',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'categories',
        name: 'BlogCategories',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogCategories.vue'),
        meta: { 
          title: '文章归类',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'categories/:id/',
        name: 'BlogCategoryDetail',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogCategoryDetail.vue'),
        meta: { 
          title: '分类文章',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'dynamics/:id',
        name: 'BlogDynamicDetail',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogDynamicDetail.vue'),
        meta: { 
          title: '文章详情',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'about',
        name: 'BlogAbout',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogAbout.vue'),
        meta: { 
          title: '关于我',
          keepAlive: true,
          requiresAuth: false
        }
      },
      {
        path: 'search',
        name: 'BlogSearch',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogSearch.vue'),
        meta: { 
          title: '搜索结果',
          keepAlive: false,
          requiresAuth: false
        }
      },
      {
        path: 'tags/:id',
        name: 'BlogTagDetail',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogTagDetail.vue'),
        meta: { 
          title: '标签文章',
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
      title: '控制台'
    },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import(/* webpackPrefetch: true */ '../views/Dashboard.vue'),
        meta: { 
          title: '仪表盘',
          icon: 'Monitor',
          keepAlive: true
        }
      },
      {
        path: 'dynamics',
        name: 'Dynamics',
        component: () => import(/* webpackPrefetch: true */ '../views/dynamics/DynamicList.vue'),
        meta: {
          title: '动态管理',
          icon: 'dynamic'
        }
      },
      {
        path: 'dynamics/create',
        name: 'CreateDynamic',
        component: () => import(/* webpackPrefetch: true */ '../views/dynamics/DynamicEdit.vue'),
        meta: {
          title: '新建动态',
          icon: 'dynamic'
        }
      },
      {
        path: 'dynamics/edit/:id',
        name: 'EditDynamic',
        component: () => import(/* webpackPrefetch: true */ '../views/dynamics/DynamicEdit.vue'),
        meta: {
          title: '编辑动态',
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
          title: '预览动态',
          icon: 'dynamic'
        }
      },
      {
        path: 'category',
        name: 'Category',
        component: () => import(/* webpackPrefetch: true */ '../views/categories/CategoryList.vue'),
        meta: {
          title: '分类管理',
          icon: 'Folder',
          keepAlive: true
        }
      },
      {
        path: 'tags',
        name: 'Tags',
        component: () => import(/* webpackPrefetch: true */ '../views/tags/TagList.vue'),
        meta: {
          title: '标签管理',
          icon: 'Collection',
          keepAlive: true
        }
      },
      {
        path: 'comments',
        name: 'Comments',
        component: () => import('../views/comments/CommentList.vue'),
        meta: { 
          title: '评论管理',
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
          title: '个人资料',
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
          title: '文件管理',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/debug',
    name: 'Debug',
    component: () => import('../views/Debug.vue'),
    meta: { 
      title: '调试页面',
      requiresAuth: false  // 设置为false使得未登录状态也可访问
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: {
      title: '页面未找到',
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
  const isAuthPage = to.name === 'Login' || to.name === 'Register'

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
    message.error('您没有权限访问该页面')
    return { name: 'Dashboard' }
  }

  return true
})

// 路由加载完成后处理
router.afterEach((to) => {
  const appStore = useAppStore()
  appStore.endNavigation()
  document.title = to.meta.title ? `${to.meta.title} · Kylin Blog` : 'Kylin Blog'
})

// 添加路由错误处理
router.onError((error) => {
  console.error('[Router]', error)
  const appStore = useAppStore()
  appStore.hasError = true
  appStore.errorMessage = error.message || '路由加载失败'
  appStore.endNavigation()
})

export default router
