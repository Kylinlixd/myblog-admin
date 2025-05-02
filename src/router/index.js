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
        path: 'dynamics/preview/:id',
        name: 'PreviewDynamic',
        component: () => import(/* webpackPrefetch: true */ '../views/dynamics/DynamicPreview.vue'),
        meta: {
          title: '预览动态',
          icon: 'dynamic'
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

router.beforeEach(async (to, from, next) => {
    // 仅在开发环境记录路由切换
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('App路由切换:', from.path, '->', to.path)
    //   console.log('目标路由元数据:', to.meta)
    // }
    
    // 重置错误状态
    const appStore = useAppStore()
    appStore.hasError = false
    
    // 判断是否为博客前台页面
    const isBlogPage = to.path.startsWith('/blog')
    
    // 检查权限
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth === true)
    const userStore = useUserStore()
    
    // 调试用户状态
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('用户登录状态:', userStore.isLoggedIn)
    //   console.log('用户信息:', userStore.userInfo)
    //   console.log('路由需要验证:', requiresAuth)
    //   console.log('匹配到的路由:', to.matched.map(r => ({path: r.path, name: r.name})))
    // }
    
    // 如果目标路由是登录页面或注册页面，直接放行
    if (to.path === '/login' || to.path === '/register') {
      // 如果已登录且试图访问登录页，重定向到首页
      if (userStore.isLoggedIn && to.path === '/login') {
        next({ path: '/dashboard', replace: true })
        return
      }
      next()
      return
    }
    
    // 如果是博客前台页面，无需登录验证，直接放行
    if (isBlogPage) {
      // console.log('博客前台页面，无需验证')
      next()
      return
    }
    
    // 如果访问的是需要登录的页面，且用户未登录，则重定向到登录页
    if (requiresAuth && !userStore.isLoggedIn) {
      // console.log('需要登录权限，重定向到登录页面')
      next({ path: '/login', query: { redirect: to.fullPath }, replace: true })
      return
    }
    
    // 验证角色权限
    const requiredRoles = to.meta.roles
    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = userStore.userInfo?.roles || []
      // console.log('检查角色权限:', requiredRoles, '用户角色:', userRoles)
      
      const hasRole = requiredRoles.some(role => userRoles.includes(role))
      if (!hasRole) {
        // console.log('用户没有所需角色权限')
        next({ path: '/dashboard', replace: true })
        message.error('您没有权限访问该页面')
        return
      }
    }
    
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

// 添加路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  const appStore = useAppStore()
  appStore.hasError = true
  appStore.errorMessage = error.message || '路由加载失败'
})

export default router