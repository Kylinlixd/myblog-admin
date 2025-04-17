import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useAppStore } from '../stores/app'


const routes = [
  {
    path: '/',
    redirect: (to) => {
      const userStore = useUserStore()
      return userStore.isLoggedIn ? '/dashboard' : '/blog'
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
      keepAlive: false
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
          keepAlive: true
        }
      },
      {
        path: 'dynamic',
        name: 'BlogDynamic',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogDynamic.vue'),
        meta: { 
          title: '动态',
          keepAlive: true
        }
      },
      {
        path: 'categories',
        name: 'BlogCategories',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogCategories.vue'),
        meta: { 
          title: '文章归类',
          keepAlive: true
        }
      },
      {
        path: 'about',
        name: 'BlogAbout',
        component: () => import(/* webpackPrefetch: true */ '../views/blog/BlogAbout.vue'),
        meta: { 
          title: '关于我',
          keepAlive: true
        }
      }
    ]
  },
  {
    path: '/dashboard',
    component: () => import(/* webpackPrefetch: true */ '../layouts/DefaultLayout.vue'),
    meta: { 
      requiresAuth: true,
      title: '后台首页'
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
          icon: 'dynamic',
          roles: ['admin']
        }
      },
      {
        path: 'dynamics/create',
        name: 'CreateDynamic',
        component: () => import(/* webpackPrefetch: true */ '../views/dynamics/DynamicEdit.vue'),
        meta: {
          title: '新建动态',
          icon: 'dynamic',
          roles: ['admin']
        }
      },
      {
        path: 'dynamics/edit/:id',
        name: 'EditDynamic',
        component: () => import(/* webpackPrefetch: true */ '../views/dynamics/DynamicEdit.vue'),
        meta: {
          title: '编辑动态',
          icon: 'dynamic',
          roles: ['admin']
        }
      },
      {
        path: 'dynamics/preview/:id',
        name: 'PreviewDynamic',
        component: () => import(/* webpackPrefetch: true */ '../views/dynamics/DynamicPreview.vue'),
        meta: {
          title: '预览动态',
          icon: 'dynamic',
          roles: ['admin']
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

router.beforeEach(async (to, from, next) => {
    // 仅在开发环境记录路由切换
    if (process.env.NODE_ENV === 'development') {
      console.log('App路由切换:', from.path, '->', to.path)
    }
    
    // 重置错误状态
    const appStore = useAppStore()
    appStore.hasError = false
    
    // 检查权限
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth === true)
    const userStore = useUserStore()
    
    // 如果目标路由是登录页面，且用户未登录，重定向到博客首页
    if (to.path === '/login' && !userStore.isLoggedIn) {
      console.log('未登录用户访问登录页面，重定向到博客首页')
      next({
        path: '/blog',
        replace: true
      })
      return
    }
    
    // 如果目标路由是注册页面，直接放行
    if (to.path === '/register') {
      next()
      return
    }
    
    if (requiresAuth && !userStore.isLoggedIn) {
      console.log('需要登录权限，重定向到博客首页')
      next({
        path: '/blog',
        replace: true
      })
      return
    }
    
    // 首先确保导航继续
    next()
    
    // 然后后台预加载组件，不阻塞导航
    if (to.matched && to.matched.length > 0) {
      // 预加载当前路由组件及其子组件
      const componentsToLoad = []
      to.matched.forEach(record => {
        if (record.components) {
          Object.values(record.components).forEach(component => {
            if (typeof component === 'function') {
              componentsToLoad.push(component())
            }
          })
        }
      })
      
      // 并行预加载所有组件，但不阻塞导航
      if (componentsToLoad.length > 0) {
        try {
          Promise.all(componentsToLoad).catch(error => {
            console.error('组件预加载失败:', error)
          })
        } catch (error) {
          console.error('组件预加载执行错误:', error)
        }
      }
    }
    
    // 处理首次加载或从空路由跳转的情况
    if (from.name === null || from.path === '/loading-redirect') {
      // 立即显示加载状态
      appStore.startLoading(to.meta.loadingText || '页面加载中...')
    }
})

// 辅助函数
function isMainRouteTransition(to, from) {
  return !from.name || to.matched.some(record => record.path !== from.path)
}

async function loadUserInfo(userStore) {
  try {
    await userStore.getUserInfo()
  } catch (error) {
    userStore.logout()
    throw error
  }
}

function redirectToLogin(to, next) {
  next({
    path: '/login',
    query: { redirect: to.fullPath }
  })
}

// 路由加载完成后处理
router.afterEach((to) => {
  const appStore = useAppStore()
  
  // 设置文档标题
  if (to.meta && to.meta.title) {
    document.title = to.meta.title
  }
  
  // 延迟很短的时间来确保组件已渲染
  if (appStore.isLoading) {
    setTimeout(() => {
      appStore.endLoading()
    }, 100)
  }
})

export default router