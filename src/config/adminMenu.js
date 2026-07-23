export const adminMenu = [
  {
    key: 'dashboard',
    label: '仪表盘',
    description: '数据概览与运营状态',
    path: '/dashboard',
    icon: 'dashboard',
    group: 'overview',
    groupLabel: '总览'
  },
  {
    key: 'dynamics',
    label: '内容管理',
    description: '文章、动态与发布状态',
    path: '/dashboard/dynamics',
    icon: 'content',
    group: 'content',
    groupLabel: '内容'
  },
  {
    key: 'category',
    label: '分类管理',
    description: '归档结构与栏目',
    path: '/dashboard/category',
    icon: 'category',
    group: 'content',
    groupLabel: '内容'
  },
  {
    key: 'tags',
    label: '标签管理',
    description: '主题标签与检索',
    path: '/dashboard/tags',
    icon: 'tags',
    group: 'content',
    groupLabel: '内容'
  },
  {
    key: 'comments',
    label: '评论管理',
    description: '读者互动与审核',
    path: '/dashboard/comments',
    icon: 'comments',
    group: 'community',
    groupLabel: '互动'
  },
  {
    key: 'files',
    label: '文件管理',
    description: '图片、附件与下载',
    path: '/dashboard/files',
    icon: 'files',
    group: 'system',
    groupLabel: '资源'
  }
]
