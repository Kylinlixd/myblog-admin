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
    redirect: '/blog'
  },
  {
    path: '/blog',
    component: () => import('../layouts/BlogLayout.vue'),
    meta: { 
      requiresAuth: false,
      title: '博客首页'
    },
    children: [
      {
        path: '',
        name: 'BlogHome',
        component: () => import('../views/blog/BlogHome.vue'),
        meta: { 
          title: '博客首页',
          keepAlive: true
        }
      },
      {
        path: 'categories',
        name: 'BlogCategories',
        component: () => import('../views/blog/BlogCategories.vue'),
        meta: { 
          title: '文章分类',
          keepAlive: true
        }
      },
      {
        path: 'categories/:id',
        name: 'BlogCategoryDetail',
        component: () => import('../views/blog/BlogCategories.vue'),
        props: true,
        meta: { 
          title: '分类文章',
          keepAlive: false
        }
      },
      {
        path: 'tags',
        name: 'BlogTags',
        component: () => import('../views/blog/BlogTags.vue'),
        meta: { 
          title: '文章标签',
          keepAlive: true
        }
      },
      {
        path: 'tags/:id',
        name: 'BlogTagDetail',
        component: () => import('../views/blog/BlogTags.vue'),
        props: true,
        meta: { 
          title: '标签文章',
          keepAlive: false
        }
      },
      {
        path: 'post/:id',
        name: 'BlogPost',
        component: () => import('../views/blog/BlogPost.vue'),
        props: true,
        meta: { 
          title: '文章详情',
          keepAlive: false
        }
      },
      {
        path: 'about',
        name: 'BlogAbout',
        component: () => import('../views/blog/BlogAbout.vue'),
        meta: { 
          title: '关于我',
          keepAlive: true
        }
      }
    ]
  },
  {
    path: '/dashboard',
    component: () => import('../layouts/DefaultLayout.vue'),
    meta: { 
      requiresAuth: true,
      title: '后台首页'
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
        path: 'posts',
        name: 'Posts',
        component: () => import('../views/posts/PostList.vue'),
        meta: { 
          title: '文章管理',
          icon: 'Document',
          keepAlive: true
        }
      },
      {
        path: 'posts/create',
        name: 'CreatePost',
        component: () => import('../views/posts/PostEdit.vue'),
        meta: { 
          title: '创建文章',
          icon: 'EditPen',
          keepAlive: false,
          hideInMenu: true
        }
      },
      {
        path: 'posts/edit/:id',
        name: 'EditPost',
        component: () => import('../views/posts/PostEdit.vue'),
        props: true,
        meta: { 
          title: '编辑文章',
          icon: 'EditPen',
          keepAlive: false,
          hideInMenu: true
        }
      },
      {
        path: 'posts/preview/:id',
        name: 'PreviewPost',
        component: () => import('../views/posts/PostPreview.vue'),
        props: true,
        meta: { 
          title: '预览文章',
          icon: 'View',
          keepAlive: false,
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
    document.title = `${to.meta.title} - 博客系统`
  }

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      clearTimeout(routeTimeout)
      appStore.endLoading()
      
      // 如果未登录，重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // 已登录，检查是否有用户信息，没有则获取
    if (!userStore.userInfo) {
      try {
        await userStore.getUserInfo()
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    }

    // 权限检查
    const requiredPermissions = to.meta.permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      // 这里实现权限检查的逻辑，根据项目需要自行完善
      // 如果不包含所需权限，可以重定向到401页面或首页
      // const hasPermission = userStore.hasPermission(requiredPermissions)
      // if (!hasPermission) {
      //   clearTimeout(routeTimeout)
      //   appStore.endLoading()
      //   next('/401')
      //   return
      // }
    }
  } else {
    // 不需要认证的页面直接放行
    clearTimeout(routeTimeout)
  }

  // 放行
  next()
})

router.afterEach(() => {
  // 结束进度条
  NProgress.done()
})

export default router 