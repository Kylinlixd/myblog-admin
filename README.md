# 博客管理系统

一个基于 Vue 3 + Element Plus + Vite 的现代化博客后台管理系统。

## 特点

- 🎨 温暖细腻的设计风格
- 🚀 基于 Vue 3 + Vite 构建
- 💪 使用 Element Plus 组件库
- 📱 响应式设计
- 🔒 安全的用户认证
- 📊 数据可视化展示

## 技术栈

- Vue 3
- Vite
- Element Plus
- Vue Router
- Pinia
- SCSS
- Axios

## 开始使用

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run dev
```

### 生产环境构建

```bash
npm run build
```

## 项目结构

```
src/
├── api/           # API 接口
├── assets/        # 静态资源
├── components/    # 公共组件
├── layouts/       # 布局组件
├── router/        # 路由配置
├── stores/        # 状态管理
├── styles/        # 样式文件
├── utils/         # 工具函数
└── views/         # 页面组件
```

## 功能模块

- [x] 用户认证
- [x] 仪表盘
- [x] 文章管理
- [x] 分类管理
- [x] 标签管理
- [x] 评论管理
- [ ] 系统设置

## API 接口文档

### 评论管理

#### 获取评论列表
- 请求方式：GET
- 接口路径：`/api/comments`
- 请求参数：
  ```typescript
  {
    page: number;      // 页码，从1开始
    pageSize: number;  // 每页数量
    postTitle?: string; // 文章标题（可选）
    author?: string;    // 评论作者（可选）
    status?: string;    // 评论状态（可选）
  }
  ```
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: {
      list: Array<{
        id: number;           // 评论ID
        content: string;      // 评论内容
        status: string;       // 评论状态：pending/approved/rejected
        postTitle: string;    // 文章标题
        author: string;       // 评论作者
        email: string;        // 评论者邮箱
        createTime: string;   // 创建时间
      }>;
      total: number;         // 总记录数
    }
  }
  ```

#### 审核评论
- 请求方式：POST
- 接口路径：`/api/comments/:id/approve`
- 请求参数：
  ```typescript
  {
    id: number;  // 评论ID（路径参数）
  }
  ```
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: null
  }
  ```

#### 拒绝评论
- 请求方式：POST
- 接口路径：`/api/comments/:id/reject`
- 请求参数：
  ```typescript
  {
    id: number;  // 评论ID（路径参数）
  }
  ```
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: null
  }
  ```

#### 删除评论
- 请求方式：DELETE
- 接口路径：`/api/comments/:id`
- 请求参数：
  ```typescript
  {
    id: number;  // 评论ID（路径参数）
  }
  ```
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: null
  }
  ```

### 文章管理

#### 获取文章列表
- 请求方式：GET
- 接口路径：`/api/posts`
- 请求参数：
  ```typescript
  {
    page: number;      // 页码，从1开始
    pageSize: number;  // 每页数量
    title?: string;    // 文章标题（可选）
    category?: string; // 分类（可选）
    status?: string;   // 状态（可选）
  }
  ```
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: {
      list: Array<{
        id: number;           // 文章ID
        title: string;        // 文章标题
        content: string;      // 文章内容
        summary: string;      // 文章摘要
        category: string;     // 分类
        tags: string[];       // 标签
        status: string;       // 状态：draft/published
        createTime: string;   // 创建时间
        updateTime: string;   // 更新时间
      }>;
      total: number;         // 总记录数
    }
  }
  ```

#### 创建文章
- 请求方式：POST
- 接口路径：`/api/posts`
- 请求参数：
  ```typescript
  {
    title: string;     // 文章标题
    content: string;   // 文章内容
    summary: string;   // 文章摘要
    category: string;  // 分类
    tags: string[];    // 标签
    status: string;    // 状态：draft/published
  }
  ```
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: {
      id: number;      // 文章ID
    }
  }
  ```

#### 更新文章
- 请求方式：PUT
- 接口路径：`/api/posts/:id`
- 请求参数：
  ```typescript
  {
    id: number;        // 文章ID（路径参数）
    title?: string;    // 文章标题
    content?: string;  // 文章内容
    summary?: string;  // 文章摘要
    category?: string; // 分类
    tags?: string[];   // 标签
    status?: string;   // 状态：draft/published
  }
  ```
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: null
  }
  ```

#### 删除文章
- 请求方式：DELETE
- 接口路径：`/api/posts/:id`
- 请求参数：
  ```typescript
  {
    id: number;  // 文章ID（路径参数）
  }
  ```
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: null
  }
  ```

### 分类管理

#### 获取分类列表
- 请求方式：GET
- 接口路径：`/api/categories`
- 请求参数：无
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: Array<{
      id: number;      // 分类ID
      name: string;    // 分类名称
      description: string; // 分类描述
      createTime: string;  // 创建时间
    }>
  }
  ```

#### 创建分类
- 请求方式：POST
- 接口路径：`/api/categories`
- 请求参数：
  ```typescript
  {
    name: string;        // 分类名称
    description: string; // 分类描述
  }
  ```
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: {
      id: number;      // 分类ID
    }
  }
  ```

#### 更新分类
- 请求方式：PUT
- 接口路径：`/api/categories/:id`
- 请求参数：
  ```typescript
  {
    id: number;         // 分类ID（路径参数）
    name?: string;      // 分类名称
    description?: string; // 分类描述
  }
  ```
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: null
  }
  ```

#### 删除分类
- 请求方式：DELETE
- 接口路径：`/api/categories/:id`
- 请求参数：
  ```typescript
  {
    id: number;  // 分类ID（路径参数）
  }
  ```
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: null
  }
  ```

### 标签管理

#### 获取标签列表
- 请求方式：GET
- 接口路径：`/api/tags`
- 请求参数：无
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: Array<{
      id: number;      // 标签ID
      name: string;    // 标签名称
      createTime: string; // 创建时间
    }>
  }
  ```

#### 创建标签
- 请求方式：POST
- 接口路径：`/api/tags`
- 请求参数：
  ```typescript
  {
    name: string;  // 标签名称
  }
  ```
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: {
      id: number;      // 标签ID
    }
  }
  ```

#### 更新标签
- 请求方式：PUT
- 接口路径：`/api/tags/:id`
- 请求参数：
  ```typescript
  {
    id: number;    // 标签ID（路径参数）
    name: string;  // 标签名称
  }
  ```
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: null
  }
  ```

#### 删除标签
- 请求方式：DELETE
- 接口路径：`/api/tags/:id`
- 请求参数：
  ```typescript
  {
    id: number;  // 标签ID（路径参数）
  }
  ```
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: null
  }
  ```

### 用户认证

#### 登录
- 请求方式：POST
- 接口路径：`/api/auth/login`
- 请求参数：
  ```typescript
  {
    username: string;  // 用户名
    password: string;  // 密码
  }
  ```
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: {
      token: string;   // JWT令牌
      user: {
        id: number;    // 用户ID
        username: string; // 用户名
        role: string;  // 用户角色
      }
    }
  }
  ```

#### 登出
- 请求方式：POST
- 接口路径：`/api/auth/logout`
- 请求参数：无
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: null
  }
  ```

#### 获取当前用户信息
- 请求方式：GET
- 接口路径：`/api/auth/me`
- 请求参数：无
- 响应数据：
  ```typescript
  {
    code: number;      // 状态码
    message: string;   // 提示信息
    data: {
      id: number;      // 用户ID
      username: string; // 用户名
      role: string;    // 用户角色
      email: string;   // 邮箱
      createTime: string; // 创建时间
    }
  }
  ```

## 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 许可证

MIT License
