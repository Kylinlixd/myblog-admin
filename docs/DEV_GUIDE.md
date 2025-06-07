# 开发指南

## 项目简介
本项目为博客管理系统，基于 Vue3 + Ant Design Vue，支持内容管理、用户管理、评论管理等功能。

## 技术栈
- 前端：Vue 3, Ant Design Vue, Vue Router, Pinia, Axios, Vite
- 后端：Django + DRF（API文档见下方）
- 依赖管理：npm/yarn

## 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0
- Python >= 3.8（后端）

## 本地开发流程
1. 克隆项目  
   ```bash
   git clone https://github.com/yourusername/myblog-admin.git
   cd myblog-admin
   ```
2. 安装依赖  
   ```bash
   npm install
   # 或
   yarn install
   ```
3. 配置环境变量  
   ```bash
   cp .env.example .env.development
   # 根据实际情况修改
   ```
4. 启动开发服务器  
   ```bash
   npm run dev
   # 或
   yarn dev
   ```
   访问 http://localhost:5173

## 代码规范
- 采用 ESLint + Prettier 统一代码风格
- 组件命名：PascalCase
- 文件命名：kebab-case
- 变量命名：camelCase
- 详细注释复杂逻辑

## 分支管理
- main: 主分支，用于生产环境
- develop: 开发分支，用于日常开发
- feature/*: 功能分支
- hotfix/*: 热修复分支

## Git 提交规范
- feat: 新功能
- fix: 修复 bug
- docs: 文档变更
- style: 代码格式（不影响功能）
- refactor: 重构
- test: 测试
- chore: 构建/工具变更

## 常用命令
- `npm run dev` 启动开发环境
- `npm run build` 构建生产包
- `npm run lint` 代码检查

## 常见问题
- 启动报错：请检查 Node.js 版本和依赖安装情况
- API 请求失败：请检查后端服务和代理配置
- 构建失败：清理 node_modules 重新安装依赖

## 贡献指南
1. Fork 本仓库
2. 新建分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: 新增某功能'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request 