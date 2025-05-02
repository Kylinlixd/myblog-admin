# 项目开发文档

## 目录结构说明

- `src/api/auth.js`：认证与用户相关接口
- `src/api/dynamic.js`：动态内容相关接口
- `src/api/tag.js`：标签相关接口
- `src/api/blog.js`：博客内容相关接口
- `src/api/comment.js`：评论相关接口
- `src/api/category.js`：分类相关接口

---

## API 接口汇总

### 1. 认证与用户

- **POST** `/api/auth/login` 用户登录
- **POST** `/api/auth/register` 用户注册
- **GET** `/api/auth/info` 获取当前用户信息
- **PUT** `/api/auth/password` 修改密码
- **PUT** `/api/auth/profile` 更新用户资料
- **POST** `/api/token/refresh` 刷新 token

### 2. 动态内容

- **GET** `/api/dynamics` 获取动态列表（支持分页、类型、状态筛选）
- **GET** `/api/dynamics/{id}` 获取动态详情
- **POST** `/api/dynamics` 创建动态
- **PUT** `/api/dynamics/{id}` 更新动态
- **DELETE** `/api/dynamics/{id}` 删除动态

### 3. 标签管理

- **GET** `/api/tags` 获取标签列表
- **POST** `/api/tags` 创建标签
- **PUT** `/api/tags/{id}` 更新标签
- **DELETE** `/api/tags/{id}` 删除标签

### 4. 分类管理

- **GET** `/api/categories` 获取分类列表
- **POST** `/api/categories` 创建分类
- **PUT** `/api/categories/{id}` 更新分类
- **DELETE** `/api/categories/{id}` 删除分类

### 5. 评论管理

- **GET** `/api/comments` 获取评论列表（支持分页、作者、状态筛选）
- **PUT** `/api/comments/{id}/approve` 通过评论
- **PUT** `/api/comments/{id}/reject` 拒绝评论
- **DELETE** `/api/comments/{id}` 删除评论

### 6. 博客内容（部分接口，详见 blog.js）

- **GET** `/blog/categories` 获取博客分类
- **GET** `/blog/dynamics` 获取博客动态列表
- **GET** `/blog/dynamics/{id}` 获取博客动态详情
- **GET** `/blog/dynamics/{id}/adjacent` 获取相邻动态
- **GET** `/blog/dynamics/hot` 获取热门动态
- **GET** `/blog/dynamics/recent` 获取最近动态
- **GET** `/blog/categories/{categoryId}/dynamics` 获取分类下动态
- **GET** `/blog/dynamics/search` 搜索动态
- **GET** `/blog/tags` 获取博客标签
- **POST** `/blog/dynamics` 创建博客动态
- **PUT** `/blog/dynamics/{id}` 更新博客动态
- **DELETE** `/blog/dynamics/{id}` 删除博客动态
- **POST** `/blog/dynamics/{id}/like` 点赞动态
- **POST** `/blog/dynamics/{id}/comment` 评论动态
- **GET** `/blog/dynamics/{id}/comments` 获取动态评论
- **DELETE** `/blog/dynamics/{dynamicId}/comments/{commentId}` 删除动态评论
- **GET** `/blog/stats` 获取博客统计信息
- **GET** `/blog/about` 获取关于信息
- **PUT** `/blog/about` 更新关于信息

---

## 权限与安全

- 绝大多数接口需携带 `Authorization: Bearer <token>` 头部
- 用户角色分为：`admin`、`user`、`company`
- 不同角色接口权限需后端校验

---

## 错误码说明

- 200：成功
- 400：请求参数错误
- 401：未授权
- 403：权限不足
- 404：资源不存在
- 500：服务器内部错误

---

如需详细每个接口的请求参数、响应结构、权限说明，请告知具体接口或模块。

---

## 详细接口说明

### 1. 认证与用户模块

#### 1.1 用户登录
- **POST** `/api/auth/login`
- **请求参数**：
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **响应结构**：
  ```json
  {
    "code": 200,
    "data": {
      "token": "jwt_token_string",
      "userInfo": {
        "id": 1,
        "username": "string",
        "nickname": "string",
        "avatar": "string",
        "role": "admin|user|company",
        "permissions": ["*"]
      }
    },
    "message": "登录成功"
  }
  ```
- **权限说明**：所有用户可访问

#### 1.2 用户注册
- **POST** `/api/auth/register`
- **请求参数**：
  ```json
  {
    "username": "string",
    "password": "string",
    "nickname": "string"
  }
  ```
- **响应结构**：
  ```json
  {
    "code": 200,
    "data": null,
    "message": "注册成功"
  }
  ```
- **权限说明**：所有用户可访问

#### 1.3 获取当前用户信息
- **GET** `/api/auth/info`
- **请求参数**：无
- **响应结构**：
  ```json
  {
    "code": 200,
    "data": {
      "id": 1,
      "username": "string",
      "nickname": "string",
      "avatar": "string",
      "role": "string",
      "permissions": ["string"]
    },
    "message": "success"
  }
  ```
- **权限说明**：登录用户

#### 1.4 修改密码
- **PUT** `/api/auth/password`
- **请求参数**：
  ```json
  {
    "oldPassword": "string",
    "newPassword": "string"
  }
  ```
- **响应结构**：
  ```json
  {
    "code": 200,
    "data": null,
    "message": "密码修改成功"
  }
  ```
- **权限说明**：登录用户

#### 1.5 更新用户资料
- **PUT** `/api/auth/profile`
- **请求参数**：
  ```json
  {
    "nickname": "string",
    "email": "string",
    "bio": "string",
    "avatar": "string"
  }
  ```
- **响应结构**：
  ```json
  {
    "code": 200,
    "data": {
      "id": 1,
      "nickname": "string",
      "email": "string",
      "bio": "string",
      "avatar": "string"
    },
    "message": "资料更新成功"
  }
  ```
- **权限说明**：登录用户

---

### 2. 动态内容模块

#### 2.1 获取动态列表
- **GET** `/api/dynamics`
- **请求参数**（Query）：
  - `page`：页码（可选）
  - `pageSize`：每页数量（可选）
  - `type`：动态类型（可选）
  - `status`：状态（可选）
- **响应结构**：
  ```json
  {
    "code": 200,
    "data": {
      "list": [
        {
          "id": 1,
          "type": "text|image|video|audio",
          "content": "string",
          "status": "draft|published",
          "mediaUrls": ["string"],
          "categoryId": 1,
          "tags": ["string"],
          "author": "string",
          "createdAt": "2024-01-01T00:00:00Z"
        }
      ],
      "total": 100
    },
    "message": "success"
  }
  ```
- **权限说明**：登录用户

#### 2.2 获取动态详情
- **GET** `/api/dynamics/{id}`
- **请求参数**：无
- **响应结构**：
  ```json
  {
    "code": 200,
    "data": {
      "id": 1,
      "type": "text|image|video|audio",
      "content": "string",
      "status": "draft|published",
      "mediaUrls": ["string"],
      "categoryId": 1,
      "tags": ["string"],
      "author": "string",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "message": "success"
  }
  ```
- **权限说明**：登录用户

#### 2.3 创建动态
- **POST** `/api/dynamics`
- **请求参数**：
  ```json
  {
    "type": "text|image|video|audio",
    "content": "string",
    "status": "draft|published",
    "mediaUrls": ["string"],
    "categoryId": 1,
    "tags": ["string"]
  }
  ```
- **响应结构**：
  ```json
  {
    "code": 200,
    "data": {
      "id": 1
    },
    "message": "创建成功"
  }
  ```
- **权限说明**：登录用户

#### 2.4 更新动态
- **PUT** `/api/dynamics/{id}`
- **请求参数**：
  ```json
  {
    "type": "text|image|video|audio",
    "content": "string",
    "status": "draft|published",
    "mediaUrls": ["string"],
    "categoryId": 1,
    "tags": ["string"]
  }
  ```
- **响应结构**：
  ```json
  {
    "code": 200,
    "data": null,
    "message": "更新成功"
  }
  ```
- **权限说明**：动态作者、管理员

#### 2.5 删除动态
- **DELETE** `/api/dynamics/{id}`
- **请求参数**：无
- **响应结构**：
  ```json
  {
    "code": 200,
    "data": null,
    "message": "删除成功"
  }
  ```
- **权限说明**：动态作者、管理员

---

### 3. 标签管理模块

#### 3.1 获取标签列表
- **GET** `/api/tags`
- **请求参数**：无
- **响应结构**：
  ```json
  {
    "code": 200,
    "data": {
      "count": 10,
      "results": [
        {
          "id": 1,
          "name": "string"
        }
      ]
    },
    "message": "success"
  }
  ```
- **权限说明**：所有用户

#### 3.2 创建标签
- **POST** `/api/tags`
- **请求参数**：
  ```json
  {
    "name": "string"
  }
  ```
- **响应结构**：
  ```json
  {
    "code": 200,
    "data": {
      "id": 1
    },
    "message": "创建成功"
  }
  ```
- **权限说明**：管理员

#### 3.3 更新标签
- **PUT** `/api/tags/{id}`
- **请求参数**：
  ```json
  {
    "name": "string"
  }
  ```
- **响应结构**：
  ```json
  {
    "code": 200,
    "data": null,
    "message": "更新成功"
  }
  ```
- **权限说明**：管理员

#### 3.4 删除标签
- **DELETE** `/api/tags/{id}`
- **请求参数**：无
- **响应结构**：
  ```json
  {
    "code": 200,
    "data": null,
    "message": "删除成功"
  }
  ```
- **权限说明**：管理员 