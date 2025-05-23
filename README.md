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

## API连接问题修复

为了解决前端应用无法连接后端API的问题，我们进行了以下修改：

1. **修复了代理配置中的路径处理**
   - 修改了URL路径重写逻辑，确保请求路径格式与后端兼容
   - 添加了请求参数格式转换功能，处理嵌套对象和特殊字符
   - 增加了响应头和请求头日志，方便调试跨域问题

2. **增强了错误处理和日志记录**
   - 改进了API错误处理逻辑，提供更详细的错误信息
   - 针对500错误增加了特定的调试提示
   - 增加了完整的请求响应日志，便于问题排查

3. **添加了请求格式兼容处理**
   - 添加了`formatRequestParams`和`formatRequestData`函数，确保请求格式与后端兼容
   - 处理了嵌套对象的参数展平

4. **添加了API代理对比测试功能**
   - 在调试页面中添加了直接请求后端和通过代理请求的对比功能
   - 自动分析并提示可能存在的问题

5. **增强了CORS配置**
   - 配置了详细的CORS选项，解决跨域访问问题
   - 确保认证信息正确传递

这些修改确保了前端应用能够正确连接到后端API，并提供了更好的调试和错误处理能力 

## 已知问题与解决方案

### 1. 后端API返回HTTP 500错误

**问题描述：**
通过代理访问后端API时，返回HTTP 500错误，但是内容格式正确。直接使用curl访问同一个API则能正常返回200状态码。

**报错信息：**
```
[500错误响应内容] {"code": 500, "message": "服务器内部错误", "data": null}
```

**临时解决方案：**
1. 已默认启用模拟数据模式，允许在后端修复前继续开发
2. 增强了错误处理，尝试从500错误中提取有效数据
3. 在调试页面中添加了HTTP状态码检测工具，辅助诊断问题

**后端修复方向：**
1. 检查Django视图函数或中间件中是否有状态码设置问题
2. 修复CORS配置，确保正确处理跨域请求
3. 检查请求头处理逻辑，特别是Authorization头

**如何切换模拟数据模式：**
1. 在调试页面中使用"模拟数据切换"按钮
2. 或者手动修改localStorage中的`useMockData`值 

### 2. JWT令牌无效问题

**问题描述：**
使用JWT令牌访问后端API时，收到"令牌对任何类型的令牌无效"的错误，错误代码为"token_not_valid"。

**错误信息：**
```
获取最近动态失败: detail: 此令牌对任何类型的令牌无效；code: token_not_valid；messages: {'token_class': ErrorDetail(string='AccessToken', code='token_not_valid'), 'token_type': ErrorDetail(string='access', code='token_not_valid'), 'message': ErrorDetail(string='Token is invalid', code='token_not_valid')}
```

**解决方案：**
1. 增强了令牌处理逻辑，确保正确添加Bearer前缀
2. 实现了令牌刷新机制，自动处理过期令牌
3. 添加了令牌调试工具，帮助诊断JWT相关问题
4. 在调试页面中提供了令牌检查、解码和刷新功能

**使用说明：**
1. 遇到令牌问题时，可以在调试页面中检查令牌状态
2. 如果令牌已过期，可以使用刷新功能获取新令牌
3. 如果刷新失败，可以清除令牌并重新登录

**技术实现：**
- 增加了令牌格式检查和标准化处理
- 实现了基于refreshToken的令牌刷新机制
- 增强了401错误处理流程 

# 博客管理系统

## 项目介绍

这是一个基于Vue 3 + Ant Design Vue的博客管理系统，提供博客内容管理、用户管理、评论管理等功能。

## 技术栈

- 前端框架：Vue 3
- UI组件库：Ant Design Vue
- 状态管理：Pinia
- 路由：Vue Router
- HTTP客户端：Axios
- 构建工具：Vite

## 开发环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0
- Python >= 3.8 (后端API)

## 开发环境搭建

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/myblog-admin.git
cd myblog-admin
```

### 2. 安装依赖

```bash
# 使用npm
npm install

# 或使用yarn
yarn install
```

### 3. 配置环境变量

复制`.env.example`文件为`.env.development`，并根据需要修改配置：

```bash
cp .env.example .env.development
```

主要配置项：
```bash
# 开发环境配置
VITE_APP_TITLE=博客管理系统(开发)

# API配置（只用于管理后台）
VITE_API_BASE_URL=
# 前台博客API配置（明确区分）
VITE_BLOG_API_BASE_URL=/blog
VITE_USE_MOCK=false

# 调试配置
VITE_APP_DEBUG=true
```

### 4. 启动开发服务器

```bash
# 使用npm
npm run dev

# 或使用yarn
yarn dev
```

开发服务器将在 http://localhost:5173 启动。

## 项目结构

```
myblog-admin/
├── public/                 # 静态资源
├── src/                    # 源代码
│   ├── api/                # API接口
│   ├── assets/             # 资源文件
│   ├── components/         # 公共组件
│   ├── layouts/            # 布局组件
│   ├── router/             # 路由配置
│   ├── stores/             # 状态管理
│   ├── utils/              # 工具函数
│   ├── views/              # 页面组件
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
├── .env                    # 环境变量
├── .env.development        # 开发环境变量
├── .env.production         # 生产环境变量
├── index.html              # HTML模板
├── package.json            # 项目配置
├── vite.config.js          # Vite配置
└── README.md               # 项目文档
```

## 开发规范

### 1. 代码风格

- 使用ESLint进行代码检查
- 使用Prettier进行代码格式化
- 遵循Vue 3组合式API风格指南

### 2. 命名规范

- 组件名：使用PascalCase（如`BlogDynamic.vue`）
- 文件名：使用kebab-case（如`blog-dynamic.vue`）
- 变量名：使用camelCase（如`dynamicList`）
- 常量名：使用UPPER_SNAKE_CASE（如`API_BASE_URL`）

### 3. 注释规范

- 组件顶部添加功能说明
- 复杂逻辑添加详细注释
- API接口添加参数和返回值说明

## 构建部署

### 1. 构建生产版本

```bash
# 使用npm
npm run build

# 或使用yarn
yarn build
```

构建产物将生成在`dist`目录。

### 2. 预览生产版本

```bash
# 使用npm
npm run preview

# 或使用yarn
yarn preview
```

### 3. 部署到服务器

#### 使用Nginx部署

1. 安装Nginx
2. 配置Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/myblog-admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理配置
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /blog/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. 重启Nginx：

```bash
sudo nginx -s reload
```

## 常见问题

### 1. 开发环境API请求失败

- 检查后端服务是否正常运行
- 确认API代理配置是否正确
- 查看浏览器控制台网络请求

### 2. 构建失败

- 检查Node.js版本是否符合要求
- 清除node_modules并重新安装依赖
- 检查是否有语法错误或类型错误

### 3. 部署后页面404

- 检查Nginx配置是否正确
- 确认构建产物是否正确部署
- 检查路由配置是否正确

## 贡献指南

1. Fork本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'Add some feature'`
4. 推送到分支：`git push origin feature/your-feature`
5. 提交Pull Request

## 许可证

MIT License 

## 自动化部署

### 1. 部署脚本

在项目根目录创建 `deploy.sh` 文件：

```bash
#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 配置信息
APP_NAME="myblog-admin"
DEPLOY_PATH="/var/www/myblog-admin"
BACKUP_PATH="/var/www/backups"
NGINX_CONF="/etc/nginx/conf.d/myblog-admin.conf"
NODE_VERSION="16.0.0"

# 日志函数
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# 检查环境
check_env() {
    log "检查环境..."
    
    # 检查Node.js版本
    if ! command -v node &> /dev/null; then
        error "Node.js未安装"
    fi
    
    node_version=$(node -v | cut -d'v' -f2)
    if [ "$(printf '%s\n' "$NODE_VERSION" "$node_version" | sort -V | head -n1)" != "$NODE_VERSION" ]; then
        error "Node.js版本必须 >= $NODE_VERSION"
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        error "npm未安装"
    fi
    
    # 检查部署目录
    if [ ! -d "$DEPLOY_PATH" ]; then
        log "创建部署目录: $DEPLOY_PATH"
        sudo mkdir -p "$DEPLOY_PATH"
    fi
    
    # 检查备份目录
    if [ ! -d "$BACKUP_PATH" ]; then
        log "创建备份目录: $BACKUP_PATH"
        sudo mkdir -p "$BACKUP_PATH"
    fi
}

# 安装依赖
install_deps() {
    log "安装依赖..."
    npm install || error "依赖安装失败"
}

# 构建项目
build() {
    log "构建项目..."
    npm run build || error "项目构建失败"
}

# 备份当前版本
backup() {
    if [ -d "$DEPLOY_PATH/dist" ]; then
        local backup_name="${APP_NAME}_$(date +'%Y%m%d_%H%M%S')"
        log "备份当前版本到: $BACKUP_PATH/$backup_name"
        sudo cp -r "$DEPLOY_PATH/dist" "$BACKUP_PATH/$backup_name" || error "备份失败"
    fi
}

# 部署新版本
deploy() {
    log "部署新版本..."
    sudo cp -r dist/* "$DEPLOY_PATH/" || error "部署失败"
}

# 配置Nginx
configure_nginx() {
    if [ ! -f "$NGINX_CONF" ]; then
        log "配置Nginx..."
        sudo tee "$NGINX_CONF" > /dev/null << EOF
server {
    listen 80;
    server_name your-domain.com;

    root $DEPLOY_PATH;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /blog/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF
        sudo nginx -t && sudo systemctl reload nginx || error "Nginx配置失败"
    fi
}

# 回滚到指定版本
rollback() {
    local version=$1
    if [ -z "$version" ]; then
        error "请指定要回滚的版本"
    fi
    
    if [ ! -d "$BACKUP_PATH/$version" ]; then
        error "指定的版本不存在: $version"
    fi
    
    log "回滚到版本: $version"
    sudo rm -rf "$DEPLOY_PATH/dist" || error "删除当前版本失败"
    sudo cp -r "$BACKUP_PATH/$version" "$DEPLOY_PATH/dist" || error "回滚失败"
    sudo systemctl reload nginx || error "Nginx重载失败"
    log "回滚完成"
}

# 清理旧备份
cleanup() {
    log "清理30天前的备份..."
    find "$BACKUP_PATH" -maxdepth 1 -type d -name "${APP_NAME}_*" -mtime +30 -exec rm -rf {} \;
}

# 主函数
main() {
    case "$1" in
        "deploy")
            check_env
            install_deps
            build
            backup
            deploy
            configure_nginx
            cleanup
            log "部署完成"
            ;;
        "rollback")
            rollback "$2"
            ;;
        *)
            echo "用法: $0 {deploy|rollback <version>}"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@" 