# 接口详情文档

## 认证与用户
- `POST   /api/auth/register/`      用户注册
- `POST   /api/auth/login/`         用户登录
- `POST   /api/token/refresh/`      刷新JWT
- `GET    /api/auth/info/`          获取当前用户信息
- `PUT    /api/auth/password/`      修改密码
- `PUT    /api/auth/profile/`       修改个人资料

### 用户注册示例
请求：
```json
{
  "username": "testuser",
  "password": "123456",
  "email": "test@example.com"
}
```
响应：
```json
{
  "code": 200,
  "data": {
    "token": "jwt-token-string",
    "userInfo": {"id": 1, "username": "testuser", "email": "test@example.com"}
  },
  "message": "注册成功"
}
```

## 动态内容（Dynamic）
- `GET    /api/dynamics/`           动态列表（支持分页、类型、状态筛选）
- `POST   /api/dynamics/`           创建动态
- `GET    /api/dynamics/{id}/`      动态详情
- `PUT    /api/dynamics/{id}/`      更新动态
- `DELETE /api/dynamics/{id}/`      删除动态

### 动态内容主要字段
- id: int
- type: string
- content: string
- status: string
- media_urls: array
- category: object
- tags: array
- created_at: string
- updated_at: string

### 动态列表响应示例
```json
{
  "code": 200,
  "data": {
    "items": [
      {"id": 1, "type": "text", "content": "内容", "status": "published", "created_at": "2024-06-01T12:00:00Z"}
    ],
    "total": 1
  },
  "message": "success"
}
```

## 分类（Category）
- `GET    /api/categories/`         分类列表
- `POST   /api/categories/`         创建分类
- `GET    /api/categories/{id}/`    分类详情
- `PUT    /api/categories/{id}/`    更新分类
- `DELETE /api/categories/{id}/`    删除分类

### 分类主要字段
- id: int
- name: string
- parent: int/null

## 标签（Tag）
- `GET    /api/tags/`               标签列表
- `POST   /api/tags/`               创建标签
- `GET    /api/tags/{id}/`          标签详情
- `PUT    /api/tags/{id}/`          更新标签
- `DELETE /api/tags/{id}/`          删除标签

### 标签主要字段
- id: int
- name: string
- description: string

## 评论（Comment）
- `GET    /api/comments/`           评论列表
- `POST   /api/comments/`           创建评论
- `GET    /api/comments/{id}/`      评论详情
- `PUT    /api/comments/{id}/`      更新评论
- `DELETE /api/comments/{id}/`      删除评论

### 评论主要字段
- id: int
- content: string
- author: object
- dynamic: int
- parent: int/null
- status: string
- created_at: string

## 文件上传
- `POST   /api/upload/file/`        文件上传

### 文件主要字段
- id: int
- name: string
- file_type: string
- file_url: string
- uploader: object
- created_at: string

## 响应格式示例
```json
{
  "code": 200,
  "data": { ... },
  "message": "success"
}
```
详细参数和返回结构请参考后端API文档或 serializers.py。 