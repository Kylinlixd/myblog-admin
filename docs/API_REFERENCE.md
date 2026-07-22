# 前端 API 约定

开发环境由 Vite 代理到 Django；生产环境应由同一域名的反向代理转发。因此前端始终请求相对路径。

## 响应格式

多数业务接口返回：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

分页内容列表使用 `data.items` 与 `data.total`；评论列表使用 `data.list` 与 `data.total`。HTTP 状态码仍是判断成功与否的首要依据。

## 认证

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | `/api/auth/login/` | 登录并返回 access、refresh |
| POST | `/api/auth/register/` | 注册并返回令牌 |
| POST | `/api/token/refresh/` | 刷新 access token |
| POST | `/api/auth/logout/` | 退出并拉黑当前 access token |
| GET | `/api/auth/info/` | 当前用户资料 |
| PUT | `/api/auth/password/` | 修改密码 |
| PUT | `/api/auth/profile/` | 修改资料 |

受保护请求自动携带 `Authorization: Bearer <access>` 和 `X-Request-ID`。

## 公开博客

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/blog/dynamics/` | 已发布内容列表 |
| GET | `/blog/dynamics/{id}/` | 内容详情 |
| GET | `/blog/dynamics/hot/` | 热门内容，支持 `limit` |
| GET | `/blog/dynamics/recent/` | 最近内容，支持 `limit` |
| PUT | `/blog/dynamics/{id}/view/` | 增加阅读量 |
| POST | `/blog/dynamics/{id}/like/` | 点赞 |
| GET/POST | `/blog/comments/` | 查询已审核评论或提交评论 |
| GET | `/blog/categories/` | 分类列表 |
| GET | `/blog/categories/{id}/dynamics/` | 分类内容 |
| GET | `/blog/tags/` | 标签列表 |
| GET | `/blog/tags/{id}/dynamics/` | 标签内容 |
| GET | `/blog/search/` | 搜索公开内容 |

## 管理端

`/api/dynamics/`、`/api/categories/`、`/api/tags/`、`/api/comments/` 提供标准列表、创建、详情、更新和删除操作，全部需要登录。`/api/stats/` 返回管理仪表盘统计且必须登录。文件接口位于 `/api/upload/`。

读取文章详情不会隐式增加阅读量；前端仅通过显式 `PUT /blog/dynamics/{id}/view/` 上报一次阅读。公开评论列表只展示审核通过的评论。

## 错误处理

请求层将网络错误、Django/DRF 错误标准化。页面不要读取 `error.response`，而应读取：

```js
try {
  await getBlogDynamics({ page: 1 })
} catch (error) {
  errorMessage.value = error.message
}
```

接口定义以配套后端仓库的 `docs/api.md` 为准。
