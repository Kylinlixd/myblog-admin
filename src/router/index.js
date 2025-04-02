import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import NProgress from 'nprogress'
import { useAppStore } from '../stores/app'

// 配置 NProgress
NProgress.configure({ 
  showSpinner: false,
  easing: 'ease',
  speed: 500,
  trickleSpeed: 200,
  minimum: 0.3
})

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/dashboard',
    component: () => import('../layouts/DefaultLayout.vue'),
    meta: { 
      requiresAuth: true,
      title: '首页'
    },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { 
          title: '仪表盘',
          icon: 'Monitor',
          keepAlive: true
        }
      },
      {
        path: '/posts',
        name: 'Posts',
        component: () => import('../views/posts/PostList.vue'),
        meta: { 
          title: '文章管理',
          icon: 'Document',
          keepAlive: true,
          permissions: ['post:view']
        }
      },
      {
        path: '/posts/create',
        name: 'CreatePost',
        component: () => import('../views/posts/PostEdit.vue'),
        meta: { 
          title: '创建文章',
          icon: 'EditPen',
          keepAlive: false,
          permissions: ['post:create'],
          hideInMenu: true
        }
      },
      {
        path: '/posts/edit/:id',
        name: 'EditPost',
        component: () => import('../views/posts/PostEdit.vue'),
        props: true,
        meta: { 
          title: '编辑文章',
          icon: 'EditPen',
          keepAlive: false,
          permissions: ['post:edit'],
          hideInMenu: true
        }
      },
      {
        path: '/posts/preview/:id',
        name: 'PreviewPost',
        component: () => import('../views/posts/PostPreview.vue'),
        props: true,
        meta: { 
          title: '预览文章',
          icon: 'View',
          keepAlive: false,
          permissions: ['post:view'],
          hideInMenu: true
        }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('../views/categories/CategoryList.vue'),
        meta: { 
          title: '分类管理',
          icon: 'Folder',
          keepAlive: true,
          permissions: ['category:view']
        }
      },
      {
        path: 'tags',
        name: 'Tags',
        component: () => import('../views/tags/TagList.vue'),
        meta: { 
          title: '标签管理',
          icon: 'Collection',
          keepAlive: true,
          permissions: ['tag:view']
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
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { 
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { 
      title: '注册',
      requiresAuth: false
    }
  },
  {
    path: '/loading-redirect',
    name: 'LoadingRedirect',
    component: () => import('../views/LoadingRedirect.vue'),
    meta: { 
      title: '正在重新加载',
      hideInMenu: true,
      showLoading: false // 不显示全局加载状态
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: {
      title: '页面未找到',
      hideInMenu: true
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

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 开始进度条
  NProgress.start()

  // 启用全局加载状态 - 仅在页面初次加载或切换主页面时显示
  const appStore = useAppStore()
  if (to.meta.showLoading !== false && (from.name === null || to.path.split('/').length <= 2)) {
    appStore.startLoading(to.meta.loadingText || '页面加载中...')
  }
  
  // 设置页面加载超时（30秒后自动取消）
  const routeTimeout = setTimeout(() => {
    console.log('路由切换超时，自动取消加载状态')
    appStore.setLoadingError('页面加载超时，请检查网络连接')
    NProgress.done()
  }, 30000)

  // 页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 博客管理系统`
  }

  const userStore = useUserStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  if (requiresAuth) {
    if (!userStore.isLoggedIn) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // 如果已登录但没有用户信息，获取用户信息
    if (!userStore.userInfo) {
      try {
        await userStore.getUserInfo()
      } catch (error) {
        console.error('获取用户信息失败:', error)
        userStore.logout()
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }
  } else if ((to.path === '/login' || to.path === '/register') && userStore.isLoggedIn) {
    // 已登录用户访问登录页或注册页，重定向到仪表盘
    next('/dashboard')
    return
  }
  
  next()
  
  // 清除超时
  clearTimeout(routeTimeout)
})

// 路由后置钩子
router.afterEach(() => {
  // 结束进度条
  NProgress.done()
  
  // 页面加载完成后，延迟300ms关闭全局加载状态，给内容渲染留出时间
  setTimeout(() => {
    const appStore = useAppStore()
    appStore.endLoading()
  }, 300)
})

export default router 