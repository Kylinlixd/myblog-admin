# 车辆信息管理系统开发文档

## 技术栈

- 后端：Golang（Gin 框架，GORM ORM，JWT 认证）
- 前端：Angular
- 数据库：MySQL/PostgreSQL
- 安全：JWT（JSON Web Token）

## 系统角色

- **Admin**：系统管理员，拥有所有权限
- **User**：普通用户，仅能管理自己的车辆信息
- **Company**：公司用户，可管理本公司下所有用户及车辆

## API 接口文档

### 1. 认证相关接口

#### 1.1 用户登录
- **POST** `/api/auth/login`
- **请求体**：
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **响应**：
  ```json
  {
    "token": "jwt_token_string",
    "userInfo": {
      "id": 1,
      "username": "string",
      "nickname": "string",
      "avatar": "string",
      "role": "admin|user|company",
      "permissions": ["*"]
    }
  }
  ```

#### 1.2 用户注册
- **POST** `/api/auth/register`
- **请求体**：
  ```json
  {
    "username": "string",
    "password": "string",
    "nickname": "string"
  }
  ```
- **响应**：
  ```json
  {
    "message": "注册成功"
  }
  ```

#### 1.3 获取用户信息
- **GET** `/api/auth/info`
- **Header**：`Authorization: Bearer <token>`
- **响应**：
  ```json
  {
    "id": 1,
    "username": "string",
    "nickname": "string",
    "avatar": "string",
    "role": "string",
    "permissions": ["string"]
  }
  ```

#### 1.4 修改密码
- **PUT** `/api/auth/password`
- **Header**：`Authorization: Bearer <token>`
- **请求体**：
  ```json
  {
    "oldPassword": "string",
    "newPassword": "string"
  }
  ```
- **响应**：
  ```json
  {
    "message": "密码修改成功"
  }
  ```

#### 1.5 更新用户资料
- **PUT** `/api/auth/profile`
- **Header**：`Authorization: Bearer <token>`
- **请求体**：
  ```json
  {
    "nickname": "string",
    "email": "string",
    "bio": "string",
    "avatar": "string"
  }
  ```
- **响应**：
  ```json
  {
    "message": "资料更新成功"
  }
  ```

### 2. 车辆管理接口

#### 2.1 创建车辆
- **POST** `/api/vehicles`
- **Header**：`Authorization: Bearer <token>`
- **请求体**：
  ```json
  {
    "plate_number": "string",
    "brand": "string",
    "model": "string",
    "color": "string"
  }
  ```
- **响应**：
  ```json
  {
    "id": 1,
    "plate_number": "string",
    "brand": "string",
    "model": "string",
    "color": "string",
    "owner_id": 1
  }
  ```

#### 2.2 获取车辆列表
- **GET** `/api/vehicles`
- **Header**：`Authorization: Bearer <token>`
- **查询参数**：
  - `page`: 页码
  - `pageSize`: 每页数量
- **响应**：
  ```json
  {
    "total": 100,
    "list": [
      {
        "id": 1,
        "plate_number": "string",
        "brand": "string",
        "model": "string",
        "color": "string",
        "owner_id": 1
      }
    ]
  }
  ```

#### 2.3 获取车辆详情
- **GET** `/api/vehicles/{id}`
- **Header**：`Authorization: Bearer <token>`
- **响应**：
  ```json
  {
    "id": 1,
    "plate_number": "string",
    "brand": "string",
    "model": "string",
    "color": "string",
    "owner_id": 1
  }
  ```

#### 2.4 更新车辆信息
- **PUT** `/api/vehicles/{id}`
- **Header**：`Authorization: Bearer <token>`
- **请求体**：
  ```json
  {
    "plate_number": "string",
    "brand": "string",
    "model": "string",
    "color": "string"
  }
  ```
- **响应**：
  ```json
  {
    "message": "更新成功"
  }
  ```

#### 2.5 删除车辆
- **DELETE** `/api/vehicles/{id}`
- **Header**：`Authorization: Bearer <token>`
- **响应**：
  ```json
  {
    "message": "删除成功"
  }
  ```

### 3. 公司管理接口

#### 3.1 创建公司
- **POST** `/api/companies`
- **Header**：`Authorization: Bearer <token>`
- **请求体**：
  ```json
  {
    "name": "string",
    "address": "string",
    "contact": "string",
    "phone": "string"
  }
  ```
- **响应**：
  ```json
  {
    "id": 1,
    "name": "string",
    "address": "string",
    "contact": "string",
    "phone": "string"
  }
  ```

#### 3.2 获取公司列表
- **GET** `/api/companies`
- **Header**：`Authorization: Bearer <token>`
- **查询参数**：
  - `page`: 页码
  - `pageSize`: 每页数量
- **响应**：
  ```json
  {
    "total": 100,
    "list": [
      {
        "id": 1,
        "name": "string",
        "address": "string",
        "contact": "string",
        "phone": "string"
      }
    ]
  }
  ```

#### 3.3 获取公司详情
- **GET** `/api/companies/{id}`
- **Header**：`Authorization: Bearer <token>`
- **响应**：
  ```json
  {
    "id": 1,
    "name": "string",
    "address": "string",
    "contact": "string",
    "phone": "string"
  }
  ```

#### 3.4 更新公司信息
- **PUT** `/api/companies/{id}`
- **Header**：`Authorization: Bearer <token>`
- **请求体**：
  ```json
  {
    "name": "string",
    "address": "string",
    "contact": "string",
    "phone": "string"
  }
  ```
- **响应**：
  ```json
  {
    "message": "更新成功"
  }
  ```

#### 3.5 删除公司
- **DELETE** `/api/companies/{id}`
- **Header**：`Authorization: Bearer <token>`
- **响应**：
  ```json
  {
    "message": "删除成功"
  }
  ```

## 权限说明

1. **Admin 权限**：
   - 可以管理所有用户、车辆和公司信息
   - 可以创建、修改、删除任何资源
   - 可以查看系统统计信息

2. **User 权限**：
   - 只能管理自己的车辆信息
   - 可以查看自己所属公司的信息
   - 不能创建或删除公司

3. **Company 权限**：
   - 可以管理本公司下的所有用户和车辆
   - 可以创建、修改、删除本公司下的资源
   - 可以查看本公司统计信息

## 安全说明

1. 所有 API 请求都需要在 Header 中携带 JWT Token
2. Token 格式：`Authorization: Bearer <token>`
3. Token 过期时间：24小时
4. 密码使用 bcrypt 加密存储
5. 敏感操作需要二次验证

## 错误码说明

- 200：成功
- 400：请求参数错误
- 401：未授权
- 403：权限不足
- 404：资源不存在
- 500：服务器内部错误

## 开发环境配置

1. 后端环境：
   ```bash
   go version >= 1.16
   mysql >= 5.7
   ```

2. 前端环境：
   ```bash
   node >= 14
   npm >= 6
   ```

3. 配置文件：
   - 后端：`config/config.yaml`
   - 前端：`src/config/environment.ts`

## 部署说明

1. 后端部署：
   ```bash
   go build -o main
   ./main
   ```

2. 前端部署：
   ```bash
   npm run build
   ```

3. 数据库初始化：
   ```bash
   mysql -u root -p < init.sql
   ```

## 注意事项

1. 所有接口都需要进行参数验证
2. 敏感数据需要进行加密处理
3. 文件上传需要限制大小和类型
4. 日志需要记录关键操作
5. 定期备份数据库 