# 过期相册后端验证清单

以下步骤用于本地或预发布环境的手动验证，确保最新的后端逻辑正常运行：

## 1. 环境准备
- `npm install`（Node ≥ 20.9）。
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` 等环境变量配置完成。
- Supabase 数据库运行最新迁移，Storage 桶已创建。

## 2. 认证流程
1. `POST /api/auth/sign-up`：使用新邮箱注册，确认返回 `requiresEmailConfirmation` 字段；SUPABASE 控制台检验 `profiles` 同步创建。
2. `POST /api/auth/sign-in`：使用已验证账户登录，确认响应包含 `session`；前端 Cookie 持久化。
3. `POST /api/auth/sign-out`：退出后再次访问受保护 API 应返回 401。

## 3. 用户资料
1. `GET /api/profile/me`：登录态下返回用户昵称、头像、角色等。
2. `PATCH /api/profile/me`：修改昵称/头像/简介，确认 Supabase `profiles` 表同步更新。

## 4. 帖子与互动
1. `POST /api/posts`：上传签名 URL 后提交帖子，确认 `post_images` 记录生成。
2. `GET /api/posts?status=draft|published`：后台筛选正常。
3. `POST /api/posts/{id}/likes` 与 `DELETE`：点赞计数随之变化。
4. `POST /api/posts/{id}/comments`：发表评论；后台 `/api/admin/comments` 应可看到该条记录并可删除。

## 5. 比赛与投稿
1. `POST /api/contests`（管理员）：创建草稿。
2. `PATCH /api/contests/{id}`：更新为 `published` 并调整投稿窗口。
3. `POST /api/contests/{id}/entries`：测试单张/图集投稿流，验证数量与文件大小限制；管理员接口 `PATCH /api/contest-entries/{id}/status` 审核通过。

## 6. 管理后台 API
1. `GET /api/admin/overview`：返回统计数字。
2. `GET /api/admin/users`：列出用户列表，分页 `cursor` 生效。
3. `PATCH /api/admin/users/{id}/role`：切换为 `admin` 后重试访问后台页面。
4. `GET /api/admin/comments`：分页查看评论列表。

## 7. 中间件校验
1. 未登录访问 `/admin` 或 `/api/admin/*` 重定向至 `/login` 或返回 401。
2. 普通用户访问 `/admin` 重定向至 `/`。

完成上述检查后，可记录结果并准备回归测试或自动化用例。
