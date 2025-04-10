# 博客管理系统

## 项目介绍
这是一个基于 Vue 3 + Vite + Element Plus 开发的博客管理系统。

## 技术栈
- Vue 3
- Vite
- Vue Router
- Pinia
- Element Plus
- SCSS
- TypeScript

## 功能特性
- 用户认证
- 文章管理
- 分类管理
- 标签管理
- 评论管理
- 主题切换

## 开发环境
- Node.js >= 16
- npm >= 7

## 安装和运行
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## API 文档

### 基础信息
- 基础路径: `/`
- 请求方式: REST
- 数据格式: JSON
- 认证方式: Bearer Token

### 认证相关

#### 1. 用户注册
- **接口**: `/auth/register`
- **方法**: POST
- **描述**: 用户注册接口
- **请求参数**:
```json
{
  "username": "string", // 用户名
  "password": "string", // 密码
  "nickname": "string"  // 昵称
}
```
- **响应数据**:
```json
{
  "code": 200,
  "data": {
    "token": "string",      // JWT token
    "userInfo": {
      "id": "number",       // 用户ID
      "username": "string", // 用户名
      "nickname": "string", // 昵称
      "avatar": "string"    // 头像URL
    }
  },
  "message": "string"
}
```

#### 2. 用户登录
- **接口**: `/auth/login`
- **方法**: POST
- **描述**: 用户登录接口
- **请求参数**:
```json
{
  "username": "string", // 用户名
  "password": "string"  // 密码
}
```
- **响应数据**:
```json
{
  "code": 200,
  "data": {
    "token": "string",      // JWT token
    "userInfo": {
      "id": "number",       // 用户ID
      "username": "string", // 用户名
      "nickname": "string", // 昵称
      "avatar": "string"    // 头像URL
    }
  },
  "message": "string"
}
```

#### 3. 获取用户信息
- **接口**: `/auth/info`
- **方法**: GET
- **描述**: 获取当前登录用户信息
- **请求头**:
  - Authorization: Bearer {token}
- **响应数据**:
```json
{
  "code": 200,
  "data": {
    "id": "number",
    "username": "string", 
    "nickname": "string",
    "email": "string",
    "bio": "string",
    "avatar": "string",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "message": "string"
}
```

#### 4. 修改密码
- **接口**: `/auth/password`
- **方法**: PUT
- **描述**: 修改用户密码
- **请求头**:
  - Authorization: Bearer {token}
- **请求参数**:
```json
{
  "oldPassword": "string", // 旧密码
  "newPassword": "string"  // 新密码
}
```
- **响应数据**:
```json
{
  "code": 200,
  "message": "string"
}
```

#### 5. 更新个人资料
- **接口**: `/auth/profile`
- **方法**: PUT
- **描述**: 更新用户个人资料
- **请求头**:
  - Authorization: Bearer {token}
- **请求参数**:
```json
{
  "nickname": "string", // 昵称
  "email": "string",    // 邮箱
  "bio": "string",      // 个人简介
  "avatar": "string"    // 头像URL
}
```
- **响应数据**:
```json
{
  "code": 200,
  "data": {
    "id": "number",
    "username": "string",
    "nickname": "string",
    "email": "string",
    "bio": "string",
    "avatar": "string",
    "updatedAt": "string"
  },
  "message": "string"
}
```

#### 6. 刷新token
- **接口**: `/token/refresh`
- **方法**: POST
- **描述**: 刷新token
- **响应数据**:
```json
{
  "code": 200,
  "data": {
    "token": "string"
  },
  "message": "string"
}
```

#### 7. 退出登录
- **接口**: 无
- **方法**: 无
- **描述**: 退出登录
- **操作**: 移除本地存储中的token

### 文章管理

#### 1. 获取文章列表
- **接口**: `/posts`
- **方法**: GET
- **描述**: 获取文章列表，支持分页和筛选
- **请求头**:
  - Authorization: Bearer {token}
- **请求参数**:
  - page: number (页码，默认1)
  - pageSize: number (每页数量，默认10)
  - keyword: string (搜索关键词)
  - categoryId: number (分类ID)
  - tagId: number (标签ID)
  - status: string (状态：draft/published)
- **响应数据**:
```json
{
  "code": 200,
  "data": {
    "total": "number",
    "items": [{
      "id": "number",
      "title": "string",
      "content": "string",
      "summary": "string",
      "categoryId": "number",
      "categoryName": "string",
      "tags": [{
        "id": "number",
        "name": "string"
      }],
      "status": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }]
  },
  "message": "string"
}
```

#### 2. 创建文章
- **接口**: `/posts`
- **方法**: POST
- **描述**: 创建新文章
- **请求头**:
  - Authorization: Bearer {token}
- **请求参数**:
```json
{
  "title": "string",      // 文章标题
  "content": "string",    // 文章内容
  "summary": "string",    // 文章摘要
  "categoryId": "number", // 分类ID
  "tagIds": ["number"],   // 标签ID列表
  "status": "string"      // 状态：draft/published
}
```
- **响应数据**:
```json
{
  "code": 200,
  "data": {
    "id": "number"
  },
  "message": "string"
}
```

#### 3. 更新文章
- **接口**: `/posts/{id}`
- **方法**: PUT
- **描述**: 更新文章信息
- **请求头**:
  - Authorization: Bearer {token}
- **请求参数**:
```json
{
  "title": "string",
  "content": "string",
  "summary": "string",
  "categoryId": "number",
  "tagIds": ["number"],
  "status": "string"
}
```
- **响应数据**:
```json
{
  "code": 200,
  "message": "string"
}
```

#### 4. 删除文章
- **接口**: `/posts/{id}`
- **方法**: DELETE
- **描述**: 删除文章
- **请求头**:
  - Authorization: Bearer {token}
- **响应数据**:
```json
{
  "code": 200,
  "message": "string"
}
```

### 分类管理

#### 1. 获取分类列表
- **接口**: `/categories`
- **方法**: GET
- **描述**: 获取分类列表
- **请求头**:
  - Authorization: Bearer {token}
- **响应数据**:
```json
{
  "code": 200,
  "data": [{
    "id": "number",
    "name": "string",
    "description": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }],
  "message": "string"
}
```

#### 2. 创建分类
- **接口**: `/categories`
- **方法**: POST
- **描述**: 创建新分类
- **请求头**:
  - Authorization: Bearer {token}
- **请求参数**:
```json
{
  "name": "string",        // 分类名称
  "description": "string"  // 分类描述
}
```
- **响应数据**:
```json
{
  "code": 200,
  "data": {
    "id": "number"
  },
  "message": "string"
}
```

#### 3. 更新分类
- **接口**: `/categories/{id}`
- **方法**: PUT
- **描述**: 更新分类信息
- **请求头**:
  - Authorization: Bearer {token}
- **请求参数**:
```json
{
  "name": "string",        // 分类名称
  "description": "string"  // 分类描述
}
```
- **响应数据**:
```json
{
  "code": 200,
  "message": "string"
}
```

#### 4. 删除分类
- **接口**: `/categories/{id}`
- **方法**: DELETE
- **描述**: 删除分类
- **请求头**:
  - Authorization: Bearer {token}
- **响应数据**:
```json
{
  "code": 200,
  "message": "string"
}
```

### 标签管理

#### 1. 获取标签列表
- **接口**: `/tags`
- **方法**: GET
- **描述**: 获取标签列表
- **请求头**:
  - Authorization: Bearer {token}
- **响应数据**:
```json
{
  "code": 200,
  "data": [{
    "id": "number",
    "name": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }],
  "message": "string"
}
```

#### 2. 创建标签
- **接口**: `/tags`
- **方法**: POST
- **描述**: 创建新标签
- **请求头**:
  - Authorization: Bearer {token}
- **请求参数**:
```json
{
  "name": "string"  // 标签名称
}
```
- **响应数据**:
```json
{
  "code": 200,
  "data": {
    "id": "number"
  },
  "message": "string"
}
```

#### 3. 更新标签
- **接口**: `/tags/{id}`
- **方法**: PUT
- **描述**: 更新标签信息
- **请求头**:
  - Authorization: Bearer {token}
- **请求参数**:
```json
{
  "name": "string"  // 标签名称
}
```
- **响应数据**:
```json
{
  "code": 200,
  "message": "string"
}
```

#### 4. 删除标签
- **接口**: `/tags/{id}`
- **方法**: DELETE
- **描述**: 删除标签
- **请求头**:
  - Authorization: Bearer {token}
- **响应数据**:
```json
{
  "code": 200,
  "message": "string"
}
```

### 评论管理

#### 1. 获取评论列表
- **接口**: `/comments`
- **方法**: GET
- **描述**: 获取评论列表，支持分页和筛选
- **请求头**:
  - Authorization: Bearer {token}
- **请求参数**:
  - page: number (页码，默认1)
  - pageSize: number (每页数量，默认10)
  - postTitle: string (文章标题)
  - author: string (评论者)
  - status: string (状态：pending/approved/rejected)
- **响应数据**:
```json
{
  "code": 200,
  "data": {
    "total": "number",
    "items": [{
      "id": "number",
      "content": "string",
      "postId": "number",
      "postTitle": "string",
      "author": "string",
      "email": "string",
      "status": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }]
  },
  "message": "string"
}
```

#### 2. 通过评论
- **接口**: `/comments/{id}/approve`
- **方法**: PUT
- **描述**: 批准评论
- **请求头**:
  - Authorization: Bearer {token}
- **响应数据**:
```json
{
  "code": 200,
  "message": "string"
}
```

#### 3. 拒绝评论
- **接口**: `/comments/{id}/reject`
- **方法**: PUT
- **描述**: 拒绝评论
- **请求头**:
  - Authorization: Bearer {token}
- **响应数据**:
```json
{
  "code": 200,
  "message": "string"
}
```

#### 4. 删除评论
- **接口**: `/comments/{id}`
- **方法**: DELETE
- **描述**: 删除评论
- **请求头**:
  - Authorization: Bearer {token}
- **响应数据**:
```json
{
  "code": 200,
  "message": "string"
}
```

### 文件上传

#### 1. 上传头像
- **接口**: `/api/upload/avatar`
- **方法**: POST
- **描述**: 上传用户头像
- **请求头**:
  - Authorization: Bearer {token}
  - Content-Type: multipart/form-data
- **请求参数**:
  - file: File (图片文件，JPG或PNG格式，大小不超过2MB)
- **响应数据**:
```json
{
  "code": 200,
  "data": {
    "url": "string"  // 头像URL
  },
  "message": "string"
}
```

### 仪表盘API

#### 1. 获取统计数据
- **接口**: `/api/stats`
- **方法**: GET
- **描述**: 获取博客统计数据，包括文章、分类、标签数量和总浏览量
- **请求头**:
  - Authorization: Bearer {token}
- **响应数据**:
```json
{
  "code": 200,
  "message": "获取统计数据成功",
  "data": {
    "postCount": 24,       // 文章总数
    "categoryCount": 6,    // 分类总数
    "tagCount": 18,        // 标签总数
    "totalViews": 4328     // 总浏览量
  }
}
```

#### 2. 获取最近文章
- **接口**: `/api/posts/recent`
- **方法**: GET
- **描述**: 获取最近发布的文章列表
- **请求头**:
  - Authorization: Bearer {token}
- **请求参数**:
  - limit: number (可选，默认为5，返回的文章数量)
- **响应数据**:
```json
{
  "code": 200,
  "message": "获取最近文章成功",
  "data": [
    {
      "id": 1,
      "title": "如何提高博客访问量：10个实用技巧",
      "createdAt": "2023-09-15 14:30:00",
      "views": 158
    },
    {
      "id": 2,
      "title": "前端开发中常见的10个性能优化方法",
      "createdAt": "2023-09-10 09:15:00",
      "views": 245
    },
    {
      "id": 3,
      "title": "Vue3和React18：前端框架的未来发展趋势",
      "createdAt": "2023-09-05 16:45:00",
      "views": 362
    },
    {
      "id": 4,
      "title": "如何构建一个安全可靠的博客系统",
      "createdAt": "2023-08-28 11:20:00",
      "views": 183
    },
    {
      "id": 5,
      "title": "Markdown写作技巧：让你的博客更加专业",
      "createdAt": "2023-08-20 08:45:00",
      "views": 217
    }
  ]
}
```

#### 3. 请求超时处理
- 所有API请求默认有15秒的超时时间
- 当请求超时时，前端会显示友好的错误提示
- 响应格式：
```json
{
  "code": 408,
  "message": "请求超时，请检查网络连接"
}
```

#### 4. 错误处理
- 当API请求失败时，将返回统一格式的错误响应：
```json
{
  "code": 400,           // HTTP状态码
  "message": "错误信息",  // 用户友好的错误消息
  "error": {             // 可选，详细错误信息
    "type": "ValidationError",
    "details": ["字段错误详情"]
  }
}
```

### 错误码说明
- 200: 成功
- 400: 请求参数错误
- 401: 未授权或token过期
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器内部错误

### 注意事项
1. 所有需要认证的接口都需要在请求头中携带 token
2. 分页接口的响应数据中 total 表示总记录数
3. 时间格式统一使用 ISO 8601 格式
4. 文件上传接口需要设置 Content-Type: multipart/form-data

## 博客前台API

博客前台API主要供博客访问者使用，无需登录即可访问。这些接口用于展示博客文章、分类、标签等内容。

### 1. 获取博客文章列表

- **接口**: `/blog/posts`
- **方法**: GET
- **描述**: 获取博客首页文章列表，支持分页
- **请求参数**:
  - page: number (页码，默认1)
  - pageSize: number (每页数量，默认10)
  - keyword: string (可选，搜索关键词)
- **响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 10,
    "items": [
      {
        "id": 1,
        "title": "博客文章标题 1",
        "summary": "这是博客文章 1 的摘要内容，简要介绍了文章的主要内容和观点...",
        "createTime": "2023-09-20T10:00:00.000Z",
        "updateTime": "2023-09-20T15:30:00.000Z",
        "categoryId": 1,
        "categoryName": "分类1",
        "viewCount": 356,
        "tags": [
          {
            "id": 1,
            "name": "标签1"
          },
          {
            "id": 2,
            "name": "标签2"
          }
        ]
      }
    ]
  }
}
```

### 2. 获取博客文章详情

- **接口**: `/blog/posts/{id}`
- **方法**: GET
- **描述**: 获取指定ID的博客文章详情
- **请求参数**:
  - id: number (文章ID，路径参数)
- **响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "title": "博客文章标题 1",
    "content": "# 文章标题\n\n## 第一部分\n这是文章的第一部分内容，主要介绍了...\n\n## 第二部分\n这是文章的第二部分内容，进一步阐述了...\n\n## 总结\n通过本文，我们了解了...",
    "summary": "这是博客文章 1 的摘要内容，简要介绍了文章的主要内容和观点...",
    "createTime": "2023-09-20T10:00:00.000Z",
    "updateTime": "2023-09-20T15:30:00.000Z",
    "categoryId": 1,
    "categoryName": "分类1",
    "viewCount": 356,
    "tags": [
      {
        "id": 1,
        "name": "标签1"
      },
      {
        "id": 2,
        "name": "标签2"
      },
      {
        "id": 3,
        "name": "标签3"
      }
    ]
  }
}
```

### 3. 获取相邻文章

- **接口**: `/blog/posts/{id}/adjacent`
- **方法**: GET
- **描述**: 获取指定文章的上一篇和下一篇文章
- **请求参数**:
  - id: number (文章ID，路径参数)
- **响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "prev": {
      "id": 2,
      "title": "博客文章标题 2"
    },
    "next": null
  }
}
```

### 4. 获取热门文章

- **接口**: `/blog/posts/hot`
- **方法**: GET
- **描述**: 获取热门文章列表
- **请求参数**:
  - limit: number (可选，默认5，返回的文章数量)
- **响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "热门文章 1",
      "viewCount": 1000,
      "createTime": "2023-09-20T10:00:00.000Z"
    },
    {
      "id": 2,
      "title": "热门文章 2",
      "viewCount": 900,
      "createTime": "2023-09-19T10:00:00.000Z"
    }
  ]
}
```

### 5. 获取最新文章

- **接口**: `/blog/posts/recent`
- **方法**: GET
- **描述**: 获取最新文章列表
- **请求参数**:
  - limit: number (可选，默认5，返回的文章数量)
- **响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "最新文章 1",
      "createTime": "2023-09-20T10:00:00.000Z"
    },
    {
      "id": 2,
      "title": "最新文章 2",
      "createTime": "2023-09-19T10:00:00.000Z"
    }
  ]
}
```

### 6. 获取分类下的文章

- **接口**: `/blog/categories/{categoryId}/posts`
- **方法**: GET
- **描述**: 获取指定分类下的文章列表
- **请求参数**:
  - categoryId: number (分类ID，路径参数)
  - page: number (可选，页码，默认1)
  - pageSize: number (可选，每页数量，默认10)
- **响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 5,
    "items": [
      {
        "id": 1,
        "title": "分类1的文章 1",
        "summary": "这是分类1下的文章 1 的摘要内容...",
        "createTime": "2023-09-20T10:00:00.000Z",
        "updateTime": "2023-09-20T15:30:00.000Z",
        "categoryId": 1,
        "categoryName": "分类1",
        "viewCount": 356
      }
    ]
  }
}
```

### 7. 获取标签下的文章

- **接口**: `/blog/tags/{tagId}/posts`
- **方法**: GET
- **描述**: 获取指定标签下的文章列表
- **请求参数**:
  - tagId: number (标签ID，路径参数)
  - page: number (可选，页码，默认1)
  - pageSize: number (可选，每页数量，默认10)
- **响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 5,
    "items": [
      {
        "id": 1,
        "title": "标签1的文章 1",
        "summary": "这是标签1下的文章 1 的摘要内容...",
        "createTime": "2023-09-20T10:00:00.000Z",
        "updateTime": "2023-09-20T15:30:00.000Z",
        "categoryId": 1,
        "categoryName": "分类1",
        "viewCount": 356
      }
    ]
  }
}
```

### 8. 获取博客统计信息

- **接口**: `/blog/stats`
- **方法**: GET
- **描述**: 获取博客统计信息，包括文章、分类、标签数量和总浏览量
- **响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "postCount": 35,
    "categoryCount": 5,
    "tagCount": 18,
    "totalViews": 12500
  }
}
```

### 9. 获取关于我的信息

- **接口**: `/blog/about`
- **方法**: GET
- **描述**: 获取博主的个人信息和技能等
- **响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "name": "博主名称",
    "avatar": "https://placeholder.pics/svg/200",
    "introduction": "# 关于我\n\n这里是关于我的详细介绍，包括我的专业背景、兴趣爱好和技术栈等。\n\n## 专业背景\n- 全栈开发工程师\n- 5年Web开发经验\n\n## 技术栈\n- 前端: Vue.js, React, JavaScript, TypeScript\n- 后端: Node.js, Java, Spring Boot\n- 数据库: MySQL, MongoDB",
    "email": "example@example.com",
    "github": "https://github.com/example",
    "skills": [
      {
        "name": "JavaScript",
        "level": 95
      },
      {
        "name": "Vue.js",
        "level": 90
      },
      {
        "name": "Node.js",
        "level": 85
      },
      {
        "name": "Java",
        "level": 80
      },
      {
        "name": "Database",
        "level": 75
      }
    ]
  }
}
```

### 10. 增加文章浏览量

- **接口**: `/blog/posts/{id}/view`
- **方法**: POST
- **描述**: 增加文章浏览量
- **请求参数**:
  - id: number (文章ID，路径参数)
- **响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

## 模拟数据

在开发环境中，博客前台API使用模拟数据响应请求，无需真实后端服务即可运行。
生产环境需要配置实际的后端API地址。要启用/禁用模拟数据，可以设置环境变量：

```
VITE_USE_MOCK=true  # 启用模拟数据
VITE_USE_MOCK=false # 禁用模拟数据，使用真实API
```

默认情况下，开发环境（development）自动启用模拟数据。