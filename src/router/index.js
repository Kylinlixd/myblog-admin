import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useAppStore } from '../stores/app'


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

router.beforeEach(async (to, from, next) => {
  const appStore = useAppStore()
  let loadingTimer
  const showLoading = to.meta.showLoading !== false
  

  try {
    // 显示加载状态（仅主内容区域）
    if (showLoading && isMainRouteTransition(to, from)) {
      loadingTimer = setTimeout(() => {
        appStore.setLoadingError('加载时间过长，请检查网络')
      }, 10000)
      appStore.startLoading()
    }

    // 页面标题
    document.title = to.meta.title ? `${to.meta.title} - 博客系统` : '博客系统'

    // 认证检查
    if (to.meta.requiresAuth) {
      const userStore = useUserStore()
      
      if (!userStore.isLoggedIn) {
        return redirectToLogin(to, next)
      }

      // 按需加载用户信息
      if (!userStore.userInfo) {
        loadUserInfo(userStore).catch((error) => {
          console.error('加载用户信息失败:', error)
        })
      }
      next() 
    }

    next()
  } catch (error) {
    console.error('路由守卫错误:', error)
    next(false)
  } finally {
    clearTimeout(loadingTimer)
    if (showLoading) {
      appStore.endLoading()
    }
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
router.afterEach(() => {
  // 结束进度条
})

export default router 