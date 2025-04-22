import { createI18n } from 'vue-i18n'

// 导入语言包
const messages = {
  zh: {
    common: {
      confirm: '确认',
      cancel: '取消',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      create: '创建',
      search: '搜索',
      reset: '重置',
      loading: '加载中...',
      success: '操作成功',
      error: '操作失败',
      warning: '警告',
      info: '提示'
    },
    login: {
      title: '登录',
      username: '用户名',
      password: '密码',
      remember: '记住我',
      submit: '登录',
      forgot: '忘记密码？'
    },
    dashboard: {
      title: '仪表盘',
      stats: {
        categories: '分类总数',
        tags: '标签总数',
        views: '总浏览量'
      },
      performance: {
        title: '性能监控',
        loadTime: '页面加载时间',
        resources: '资源加载',
        memory: '内存使用'
      }
    },
    categories: {
      title: '分类管理',
      create: '新建分类',
      edit: '编辑分类',
      list: {
        name: '名称',
        description: '描述',
        createTime: '创建时间',
        actions: '操作'
      },
      form: {
        name: '名称',
        description: '描述',
        parent: '父分类',
        sort: '排序'
      }
    },
    tags: {
      title: '标签管理',
      create: '新建标签',
      edit: '编辑标签',
      list: {
        name: '名称',
        description: '描述',
        createTime: '创建时间',
        actions: '操作'
      },
      form: {
        name: '名称',
        description: '描述',
        sort: '排序'
      }
    },
    comments: {
      title: '评论管理',
      list: {
        content: '内容',
        author: '作者',
        post: '文章',
        status: '状态',
        createTime: '创建时间',
        actions: '操作'
      },
      status: {
        pending: '待审核',
        approved: '已通过',
        rejected: '已拒绝'
      }
    }
  },
  en: {
    common: {
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
      reset: 'Reset',
      loading: 'Loading...',
      success: 'Operation successful',
      error: 'Operation failed',
      warning: 'Warning',
      info: 'Info'
    },
    login: {
      title: 'Login',
      username: 'Username',
      password: 'Password',
      remember: 'Remember me',
      submit: 'Login',
      forgot: 'Forgot password?'
    },
    dashboard: {
      title: 'Dashboard',
      stats: {
        categories: 'Total Categories',
        tags: 'Total Tags',
        views: 'Total Views'
      },
      performance: {
        title: 'Performance Monitor',
        loadTime: 'Page Load Time',
        resources: 'Resource Loading',
        memory: 'Memory Usage'
      }
    },
    categories: {
      title: 'Category Management',
      create: 'Create Category',
      edit: 'Edit Category',
      list: {
        name: 'Name',
        description: 'Description',
        createTime: 'Create Time',
        actions: 'Actions'
      },
      form: {
        name: 'Name',
        description: 'Description',
        parent: 'Parent Category',
        sort: 'Sort'
      }
    },
    tags: {
      title: 'Tag Management',
      create: 'Create Tag',
      edit: 'Edit Tag',
      list: {
        name: 'Name',
        description: 'Description',
        createTime: 'Create Time',
        actions: 'Actions'
      },
      form: {
        name: 'Name',
        description: 'Description',
        sort: 'Sort'
      }
    },
    comments: {
      title: 'Comment Management',
      list: {
        content: 'Content',
        author: 'Author',
        post: 'Post',
        status: 'Status',
        createTime: 'Create Time',
        actions: 'Actions'
      },
      status: {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected'
      }
    }
  }
}

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: localStorage.getItem('language') || 'zh', // 默认语言
  fallbackLocale: 'en', // 备用语言
  messages
})

export default i18n 