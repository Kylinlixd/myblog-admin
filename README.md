# MyBlog Admin 后台管理系统

基于 Vue 3 + Vite + Ant Design Vue 开发的博客后台管理系统。

## 系统架构

### 技术栈
- 前端框架：Vue 3
- 构建工具：Vite
- UI 框架：Ant Design Vue
- 状态管理：Pinia
- 路由管理：Vue Router
- HTTP 客户端：Axios
- 图表库：ECharts
- 代码规范：ESLint + Prettier

### 目录结构
```
myblog-admin/
├── public/                 # 静态资源目录
├── src/                    # 源代码目录
│   ├── api/               # API 接口定义
│   ├── assets/            # 静态资源
│   ├── components/        # 公共组件
│   ├── layouts/           # 布局组件
│   ├── router/            # 路由配置
│   ├── stores/            # Pinia 状态管理
│   ├── styles/            # 全局样式
│   ├── utils/             # 工具函数
│   ├── views/             # 页面组件
│   ├── App.vue            # 根组件
│   └── main.js            # 入口文件
├── .env                   # 环境变量
├── .eslintrc.js          # ESLint 配置
├── .prettierrc           # Prettier 配置
├── index.html            # HTML 模板
├── package.json          # 项目依赖
└── vite.config.js        # Vite 配置
```

## 功能特性

- 用户认证与授权
- 文章管理（CRUD）
- 分类管理
- 标签管理
- 评论管理
- 用户管理
- 系统设置
- 性能监控
- 数据统计

## 开发环境

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 部署说明

### 1. 构建项目
```bash
npm run build
```
构建完成后，会在 `dist` 目录下生成可部署的文件。

### 2. 配置 Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://your-backend-api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. 环境变量配置
创建 `.env.production` 文件：
```
VITE_API_BASE_URL=https://api.your-domain.com
VITE_APP_TITLE=MyBlog Admin
```

## API 接口

### 认证相关
#### 用户登录
- **POST** `/api/auth/login`
- **请求参数**：
```json
{
  "username": "admin",
  "password": "password123"
}
```
- **响应数据**：
```json
{
  "code": 200,
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "userInfo": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "avatar": "https://example.com/avatar.jpg",
      "email": "admin@example.com",
      "role": "admin",
      "permissions": ["*"]
    }
  },
  "message": "登录成功"
}
```

#### 用户登出
- **POST** `/api/auth/logout`
- **响应数据**：
```json
{
  "code": 200,
  "data": null,
  "message": "登出成功"
}
```

#### 修改密码
- **PUT** `/api/auth/password`
- **请求参数**：
```json
{
  "oldPassword": "oldpass123",
  "newPassword": "newpass123"
}
```
- **响应数据**：
```json
{
  "code": 200,
  "data": null,
  "message": "密码修改成功"
}
```

### 动态管理
#### 获取动态列表
- **GET** `/api/dynamics`
- **请求参数**：
```
?page=1&pageSize=10&type=text&status=published
```
- **响应数据**：
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "title": "动态标题",
        "type": "text",
        "content": "这是一条动态内容",
        "status": "published",
        "mediaUrls": ["https://example.com/image.jpg"],
        "categoryId": 1,
        "tags": ["标签1", "标签2"],
        "author": "admin",
        "createdAt": "2024-03-20T10:00:00Z",
        "updatedAt": "2024-03-20T10:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  },
  "message": "success"
}
```

#### 获取动态详情
- **GET** `/api/dynamics/:id`
- **响应数据**：
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "type": "text",
    "content": "这是一条动态内容",
    "status": "published",
    "mediaUrls": ["https://example.com/image.jpg"],
    "categoryId": 1,
    "category": {
      "id": 1,
      "name": "技术"
    },
    "tags": ["标签1", "标签2"],
    "author": "admin",
    "createdAt": "2024-03-20T10:00:00Z",
    "updatedAt": "2024-03-20T10:00:00Z",
    "comments": [
      {
        "id": 1,
        "content": "评论内容",
        "author": "user1",
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ]
  },
  "message": "success"
}
```

#### 创建动态
- **POST** `/api/dynamics`
- **请求参数**：
```json
{
  "title": "新动态标题",
  "type": "text",
  "content": "新动态内容",
  "status": "draft",
  "mediaUrls": ["https://example.com/image.jpg"],
  "categoryId": 1,
  "tags": ["标签1", "标签2"]
}
```
- **响应数据**：
```json
{
  "code": 200,
  "data": {
    "id": 1
  },
  "message": "创建成功"
}
```

#### 更新动态
- **PUT** `/api/dynamics/:id`
- **请求参数**：
```json
{
  "title": "更新后的标题",
  "type": "text",
  "content": "更新后的内容",
  "status": "published",
  "mediaUrls": ["https://example.com/image.jpg"],
  "categoryId": 1,
  "tags": ["标签1", "标签2"]
}
```
- **响应数据**：
```json
{
  "code": 200,
  "data": null,
  "message": "更新成功"
}
```

#### 删除动态
- **DELETE** `/api/dynamics/:id`
- **响应数据**：
```json
{
  "code": 200,
  "data": null,
  "message": "删除成功"
}
```

### 分类管理
#### 获取分类列表
- **GET** `/api/categories`
- **响应数据**：
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "name": "技术",
        "description": "技术相关文章",
        "dynamicCount": 10,
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ],
    "total": 1
  },
  "message": "success"
}
```

#### 获取分类详情
- **GET** `/api/categories/:id`
- **响应数据**：
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "技术",
    "description": "技术相关文章",
    "dynamicCount": 10,
    "dynamics": [
      {
        "id": 1,
        "title": "动态标题",
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ],
    "createdAt": "2024-03-20T10:00:00Z"
  },
  "message": "success"
}
```

#### 创建分类
- **POST** `/api/categories`
- **请求参数**：
```json
{
  "name": "生活",
  "description": "生活相关文章"
}
```
- **响应数据**：
```json
{
  "code": 200,
  "data": {
    "id": 2
  },
  "message": "创建成功"
}
```

#### 更新分类
- **PUT** `/api/categories/:id`
- **请求参数**：
```json
{
  "name": "生活随笔",
  "description": "生活随笔相关文章"
}
```
- **响应数据**：
```json
{
  "code": 200,
  "data": null,
  "message": "更新成功"
}
```

#### 删除分类
- **DELETE** `/api/categories/:id`
- **响应数据**：
```json
{
  "code": 200,
  "data": null,
  "message": "删除成功"
}
```

### 标签管理
#### 获取标签列表
- **GET** `/api/tags`
- **响应数据**：
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "name": "Vue",
        "dynamicCount": 5,
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ],
    "total": 1
  },
  "message": "success"
}
```

#### 获取标签详情
- **GET** `/api/tags/:id`
- **响应数据**：
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "Vue",
    "dynamicCount": 5,
    "dynamics": [
      {
        "id": 1,
        "title": "动态标题",
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ],
    "createdAt": "2024-03-20T10:00:00Z"
  },
  "message": "success"
}
```

#### 创建标签
- **POST** `/api/tags`
- **请求参数**：
```json
{
  "name": "React"
}
```
- **响应数据**：
```json
{
  "code": 200,
  "data": {
    "id": 2
  },
  "message": "创建成功"
}
```

#### 更新标签
- **PUT** `/api/tags/:id`
- **请求参数**：
```json
{
  "name": "React.js"
}
```
- **响应数据**：
```json
{
  "code": 200,
  "data": null,
  "message": "更新成功"
}
```

#### 删除标签
- **DELETE** `/api/tags/:id`
- **响应数据**：
```json
{
  "code": 200,
  "data": null,
  "message": "删除成功"
}
```

### 评论管理
#### 获取评论列表
- **GET** `/api/comments`
- **请求参数**：
```
?page=1&pageSize=10&status=pending
```
- **响应数据**：
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "content": "这是一条评论",
        "status": "pending",
        "author": "user1",
        "dynamicId": 1,
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10
  },
  "message": "success"
}
```

#### 获取评论详情
- **GET** `/api/comments/:id`
- **响应数据**：
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "content": "这是一条评论",
    "status": "pending",
    "author": "user1",
    "dynamicId": 1,
    "dynamic": {
      "id": 1,
      "title": "动态标题"
    },
    "createdAt": "2024-03-20T10:00:00Z"
  },
  "message": "success"
}
```

#### 更新评论状态
- **PUT** `/api/comments/:id/status`
- **请求参数**：
```json
{
  "status": "approved"
}
```
- **响应数据**：
```json
{
  "code": 200,
  "data": null,
  "message": "更新成功"
}
```

#### 删除评论
- **DELETE** `/api/comments/:id`
- **响应数据**：
```json
{
  "code": 200,
  "data": null,
  "message": "删除成功"
}
```

### 数据统计
#### 获取统计数据
- **GET** `/api/stats`
- **响应数据**：
```json
{
  "code": 200,
  "data": {
    "total": {
      "categories": 10,
      "tags": 20,
      "dynamics": 100,
      "comments": 500
    },
    "recent": {
      "dynamics": [
        {
          "date": "2024-03-20",
          "count": 5
        }
      ],
      "comments": [
        {
          "date": "2024-03-20",
          "count": 10
        }
      ]
    }
  },
  "message": "success"
}
```

### 性能监控
#### 获取性能统计数据
- **GET** `/api/stats/performance`
- **响应数据**：
```json
{
  "code": 200,
  "data": {
    "loadTime": {
      "avg": 600,
      "max": 1000,
      "min": 300
    },
    "resourceLoad": {
      "images": 200,
      "api": 150
    },
    "memory": {
      "current": 50,
      "peak": 80
    }
  },
  "message": "success"
}
```

### 错误码说明
- 200: 成功
- 400: 请求参数错误
- 401: 未授权
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器内部错误

### 通用响应格式
```json
{
  "code": 200,
  "data": null,
  "message": "success"
}
```

### 分页参数说明
- page: 页码，从1开始
- pageSize: 每页数量
- sort: 排序字段
- order: 排序方式（asc/desc）

### 认证方式
所有需要认证的接口都需要在请求头中携带 token：
```
Authorization: Bearer <token>
```

## 开发规范

### 代码风格
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 Vue 3 组合式 API 风格指南

### Git 提交规范
- feat: 新功能
- fix: 修复问题
- docs: 文档修改
- style: 代码格式修改
- refactor: 代码重构
- test: 测试用例修改
- chore: 其他修改

## 性能优化

### 已实现的优化
- 路由懒加载
- 组件按需加载
- 图片懒加载
- 数据缓存
- 防抖和节流
- 性能监控

### 待优化项
- [ ] 实现虚拟滚动
- [ ] 优化大数据渲染
- [ ] 添加骨架屏
- [ ] 优化首屏加载
- [ ] 实现 PWA

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

[MIT License](LICENSE) 