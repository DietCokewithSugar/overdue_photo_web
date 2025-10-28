# 过期相册（Expired Album）产品设计方案

## 1. 项目概述
- **目标**：构建一个围绕摄影作品分享与摄影比赛的移动优先（Mobile-first）站点，为普通用户提供发布与互动体验，为管理员提供内容与比赛管理能力。
- **站点名称**：过期相册（Expired Album）。
- **受众**：主要是移动端访问者，同时兼顾平板与桌面端的响应式展示。
- **核心价值主张**：
  - 轻量顺滑的照片浏览体验（懒加载、图片压缩、多尺寸处理）。
  - 丰富的互动机制（评论、点赞、比赛投稿）。
  - 专业的摄影比赛承载能力（限制、审核、展示）。

## 2. 用户角色与关键场景
- **游客**：可浏览公开帖子、比赛信息及投稿作品，无法进行互动与投稿。
- **注册用户**：
  - 创建帖子（标题、描述、图片）。
  - 浏览帖子流、帖子详情，点赞与评论。
  - 浏览比赛列表、详情并在投稿期内提交单张或图集作品。
  - 管理个人已提交的比赛作品（编辑、删除，仅限投稿期内）。
- **管理员**（拥有普通用户权限的 superset）：
  - 设置用户角色（用户 ↔ 管理员）。
  - 审核、编辑、删除任何帖子与评论。
  - 将帖子置顶/精选。
  - 创建、编辑、关闭比赛，管理投稿内容。

## 3. 功能需求
### 3.1 帖子流与展示
- 首页展示以瀑布流/卡片布局呈现帖子缩略图，默认按发布时间倒序（最新帖子）。
- 精选帖子拥有独立区域或标签筛选，突出展示管理员精选内容。
- 帖子详情页展示：
  - 标题、作者信息、发布时间。
  - 全尺寸图库（滑动/轮播形式）。
  - 支持简单富文本的正文描述（粗体、斜体、列表、链接）。
  - 点赞数与评论数。
  - 评论区域（时间顺序）。

### 3.2 互动能力
- **评论**：已登录用户可发表评论；支持删除/编辑自己的评论；管理员可编辑/删除任何评论。
- **点赞**：单击操作，支持取消点赞；同一用户对同一帖子仅计一次。

### 3.3 帖子创建
- 表单字段：标题（必填）、正文（富文本编辑器）、图片选择（1-N 张）。
- 图片上传前在浏览器端使用 `browser-image-compression` 进行压缩与尺寸限制。
- 支持多图排序；预览压缩后的图片信息。
- 提交后由后端获取签名上传 URL，将文件存入 Supabase Storage，对应记录写入数据库。

### 3.4 比赛模块
- 管理员创建比赛：名称、说明、海报、投稿起止时间、单张/图集投稿限制（N、M）、单张文件大小上限（如 ≤ 20MB）。
- 比赛列表：展示进行中、已结束比赛；卡片包含海报、名称、状态（征集中/已截止/即将开始）。
- 比赛详情：
  - 比赛说明、时间、海报。
  - 投稿限制提醒。
  - 投稿按钮（仅在投稿窗口内并登录后显示）。
  - 以画廊展示全部有效投稿，支持按投稿时间或热门排序。
- 投稿流程（用户）：
  - 选择投稿类型（单张 / 组图）。
  - 上传照片（受数量与大小限制），填写标题（必填），组图类型需额外描述。
  - 系统校验投稿次数是否超限，记录与 Storage 存储同步更新。
  - 投稿期内可编辑或删除自己的投稿。
- 投稿管理（管理员）：
  - 查看投稿列表（筛选：待审核、通过、拒绝）。
  - 编辑投稿状态、备注；违规内容可切换为“拒绝”状态，前台不再展示。

### 3.5 管理端能力
- 管理面板入口（仅管理员账户显示）。
- 功能模块：
  - 用户列表与角色切换。
  - 帖子管理（搜索、筛选、置顶/精选、删除）。
  - 评论管理。
  - 比赛管理：新建、编辑、上下架、配置投稿限制、审核投稿。
  - 全站统计面板（帖子数量、互动量、比赛投稿量等）。

## 4. 非功能需求
- **移动优先**：首要设计与开发面向窄屏，组件在 ≥ 375px 视口下有最佳体验，再按断点拓展。
- **性能**：
  - 图片懒加载 + Skeleton 占位，根据容器尺寸加载不同质量/尺寸图片。
  - 浏览器端压缩 + 服务端使用 `sharp` 或 `@squoosh/lib` 生成缩略图。
  - 列表页分页/无限滚动，减少一次性加载量。
- **可维护性**：TypeScript 全覆盖；模块化架构，清晰的前后端分层。
- **可观测性**：关键 API 添加日志；错误监控（如 Sentry）。
- **可扩展性**：比赛机制可按需扩展点评、评审等后续功能。

## 5. 技术架构
### 5.1 整体结构
```
Next.js (App Router) + React Query + Tailwind
        │
        ├─ 前端页面（SSR/CSR 混合，移动优先 UI）
        │
        ├─ API Route / Route Handler
        │   ├─ 业务逻辑（认证、权限校验、输入校验）
        │   └─ Supabase Admin Client（Service Role Key）
        │
        └─ Supabase
            ├─ Auth（Email、OAuth）
            ├─ Postgres（多表数据存储）
            └─ Storage（图片文件，私有桶 + 签名 URL）
```

### 5.2 前端
- **框架**：Next.js 14（App Router）+ TypeScript，支持 SSR/ISR 提升首屏加载速度。
- **UI 与样式**：Tailwind CSS + Headless UI 组件；针对移动端设计底部导航、全屏模态、滑动手势。
- **状态管理**：TanStack Query（React Query）处理数据获取、缓存、乐观更新；Zustand 管理全局 UI 状态（模态、Toast）。
- **表单与富文本**：React Hook Form + Zod 做表单校验；TipTap 或 Lexical 实现轻量富文本编辑器（限定样式）。
- **图片上传**：
  - 使用 `browser-image-compression` 在前端压缩。
  - 调用后端 API 获取签名 URL，再上传到 Supabase Storage。
  - 上传成功后更新对应数据库记录。

### 5.3 后端（Next.js Route Handlers）
- **认证**：通过 Supabase Auth，前端获取 session token；API 端使用服务端 SDK 验证 `Authorization` 头。
- **权限**：
  - 中间件区分游客、用户、管理员。
  - 管理操作必须检测用户角色。
  - 所有写操作执行数据级别权限校验（作者本人、投稿限制等）。
- **业务逻辑**：
  - 参数验证（Zod）、速率限制（Upstash Redis 或 Supabase Rate Limit 规则），防止滥用。
  - 图片上传流程：后端生成短期有效的签名 URL；上传后回调 API 写入记录。
  - 互动逻辑：点赞、评论按幂等性处理。
  - 比赛投稿校验投稿次数、时间窗口、文件大小。
- **部署模式**：主站部署在 Vercel；若需后台任务，可使用 Vercel Cron + Supabase Functions（仅在必要时）。

### 5.4 Supabase 使用策略
- **Auth**：Email + Magic Link；可扩展 OAuth；使用 `auth.users` + `public.profiles` 保存扩展信息。
- **Database**：使用 `public` schema 建表；通过 RLS 加固（尽管大部分逻辑在后端，仍需防止直接访问）。
- **Storage**：
  - `post-images` 桶：存储帖子图片（原图 + 多尺寸）。
  - `contest-posters` 桶：比赛海报。
  - `contest-entries` 桶：比赛投稿图集。
  - 桶默认私有，通过签名 URL 控制访问。列表页图片使用公开 CDN 域名对应的压缩版本。
- **行级安全（RLS）**：
  - 只对必要表开放直接查询权限（例如前台读取数据）。
  - 所有写操作通过服务端使用 Service Role Key 执行，或在 RLS 中限制“仅本人写”。推荐：前台仅读、写全走后端。

## 6. 数据模型（Postgres / Supabase）

### 6.1 基础表
| 表名 | 关键字段 | 描述 |
| --- | --- | --- |
| `profiles` | `id (uuid, pk, references auth.users)`, `display_name`, `avatar_url`, `bio`, `role` (`user`/`admin`), `created_at`, `updated_at` | 用户扩展资料与角色。 |
| `follows` *(可选扩展)* | `follower_id`, `followed_id`, `created_at` | 用户关注关系（后续扩展动态）。 |

### 6.2 帖子与互动
| 表名 | 关键字段 | 描述 |
| --- | --- | --- |
| `posts` | `id uuid pk`, `author_id`, `title`, `content_richtext (jsonb)`, `content_plaintext`, `is_featured boolean`, `status` (`published`/`draft`/`archived`), `published_at`, `updated_at` | 帖子主表。 |
| `post_images` | `id uuid pk`, `post_id`, `storage_path`, `thumbnail_path`, `width`, `height`, `blurhash`, `sort_order` | 一对多图片信息。 |
| `post_likes` | `post_id`, `user_id`, `created_at`, 唯一约束 `(post_id, user_id)` | 点赞记录。 |
| `post_comments` | `id uuid pk`, `post_id`, `author_id`, `body`, `parent_comment_id (nullable)`, `created_at`, `updated_at`, `status` (`active`/`deleted`/`hidden`) | 评论主表，可拓展楼中楼。 |
| `post_features` | `post_id`, `featured_at`, `featured_by` | 保留精选操作历史。 |

### 6.3 比赛模块
| 表名 | 关键字段 | 描述 |
| --- | --- | --- |
| `contests` | `id uuid pk`, `title`, `slug`, `description`, `poster_path`, `submission_starts_at`, `submission_ends_at`, `single_submission_limit`, `collection_submission_limit`, `single_file_size_limit_mb`, `status` (`draft`/`published`/`closed`), `created_by`, `created_at`, `updated_at` | 比赛基本信息。 |
| `contest_entries` | `id uuid pk`, `contest_id`, `author_id`, `entry_type` (`single`/`collection`), `title`, `description`, `status` (`pending`/`approved`/`rejected`), `submitted_at`, `updated_at` | 投稿主表。 |
| `contest_entry_images` | `id uuid pk`, `entry_id`, `storage_path`, `thumbnail_path`, `width`, `height`, `sort_order` | 投稿图片。 |
| `contest_entry_audit_logs` | `id uuid pk`, `entry_id`, `action` (`submitted`/`approved`/`rejected`/`edited`), `operator_id`, `notes`, `created_at` | 审核记录。 |

### 6.4 系统与辅助
| 表名 | 关键字段 | 描述 |
| --- | --- | --- |
| `user_settings` | `user_id`, `receive_notifications`, `language`, `timezone`, `updated_at` | 用户偏好。 |
| `media_variants` | `id uuid pk`, `original_path`, `variant_type` (`thumbnail`/`medium`/`large`), `storage_path`, `width`, `height`, `filesize` | 图片多尺寸记录。 |
| `admin_notes` | `id uuid pk`, `resource_type`, `resource_id`, `note`, `author_id`, `created_at` | 管理批注。 |

## 7. API 设计（RESTful）

### 7.1 认证与公共接口
| 方法 | 路径 | 描述 | 认证 |
| --- | --- | --- | --- |
| `GET` | `/api/health` | 健康检查 | 无 |
| `GET` | `/api/profile/me` | 获取当前用户资料 | 必须 |
| `PATCH` | `/api/profile/me` | 更新昵称、头像等 | 必须 |

### 7.2 帖子
| 方法 | 路径 | 描述 | 认证 |
| --- | --- | --- | --- |
| `GET` | `/api/posts` | 查询帖子列表，支持分页、`filter=featured/latest`, `author`, `contestId` | 可选 |
| `POST` | `/api/posts` | 创建帖子（标题、正文、图片元数据） | 必须 |
| `GET` | `/api/posts/{id}` | 帖子详情，包含图片、评论摘要、点赞数 | 可选 |
| `PATCH` | `/api/posts/{id}` | 更新帖子（作者本人或管理员） | 必须 |
| `DELETE` | `/api/posts/{id}` | 删除帖子（管理员或作者） | 必须 |
| `POST` | `/api/posts/{id}/feature` | 设置/取消精选 | 管理员 |

### 7.3 评论与点赞
| 方法 | 路径 | 描述 | 认证 |
| --- | --- | --- | --- |
| `GET` | `/api/posts/{id}/comments` | 评论列表（分页） | 可选 |
| `POST` | `/api/posts/{id}/comments` | 发表评论 | 必须 |
| `PATCH` | `/api/comments/{id}` | 编辑评论 | 必须 |
| `DELETE` | `/api/comments/{id}` | 删除评论 | 必须（作者或管理员） |
| `POST` | `/api/posts/{id}/likes` | 点赞 | 必须 |
| `DELETE` | `/api/posts/{id}/likes` | 取消点赞 | 必须 |

### 7.4 比赛
| 方法 | 路径 | 描述 | 认证 |
| --- | --- | --- | --- |
| `GET` | `/api/contests` | 比赛列表（状态筛选） | 可选 |
| `GET` | `/api/contests/{id}` | 比赛详情 + 投稿摘要 | 可选 |
| `POST` | `/api/contests` | 创建比赛 | 管理员 |
| `PATCH` | `/api/contests/{id}` | 更新比赛信息 | 管理员 |
| `POST` | `/api/contests/{id}/publish` | 发布比赛 | 管理员 |
| `POST` | `/api/contests/{id}/close` | 关闭比赛 | 管理员 |

### 7.5 投稿
| 方法 | 路径 | 描述 | 认证 |
| --- | --- | --- | --- |
| `GET` | `/api/contests/{id}/entries` | 投稿列表（分页、状态过滤） | 可选（公开仅返回 `approved`） |
| `POST` | `/api/contests/{id}/entries` | 提交投稿（单张/组图） | 必须 |
| `PATCH` | `/api/contest-entries/{id}` | 编辑投稿 | 必须 |
| `DELETE` | `/api/contest-entries/{id}` | 删除投稿 | 必须 |
| `POST` | `/api/contest-entries/{id}/status` | 审核更新状态 | 管理员 |

### 7.6 媒体签名 URL
| 方法 | 路径 | 描述 | 认证 |
| --- | --- | --- | --- |
| `POST` | `/api/uploads/sign` | 生成上传签名（指定资源类型） | 必须 |
| `POST` | `/api/uploads/complete` | 上传完成回调，写库 | 必须 |

### 7.7 响应约定
- 列表响应采用 `{ data: T[], pagination: { page, pageSize, total } }`。
- 失败时返回 `{ error: { code, message, details? } }`。
- 使用 401/403 区分未登录与权限不足。
- 针对速率限制返回 429，附带剩余冷却时间。

## 8. 前端信息架构与交互

### 8.1 导航结构（移动端）
- 底部导航四个主入口：
  1. `首页`（最新 + 精选 Tab）
  2. `比赛`
  3. `发布`（中心浮动按钮，打开全屏模态）
  4. `个人`（个人资料、我的帖子、我的投稿）
- 管理员在“个人”页进入“管理后台”。

### 8.2 页面/模块设计
- **首页**：
  - 顶部搜索栏（放大镜 + 文本）。
  - Tab：`最新`、`精选`。
  - 瀑布流卡片：图片（带模糊占位）、标题、作者头像、点赞/评论计数。
  - 下拉刷新、上拉加载更多。
- **帖子详情**：
  - 顶部返回 + 分享按钮。
  - 图片轮播支持双击放大、滑动切换。
  - 富文本正文（限制 Heading 级别，避免失控）。
  - 点赞按钮、评论输入框固定底部。
  - 评论列表支持折叠回复（如需楼中楼）。
- **发布帖子**：
  - 多步骤表单（步骤指示：内容 → 图片 → 预览确认）。
  - 图片选择后展示压缩提示、进度条。
  - 错误提示（超过大小、数量超限）。
- **比赛列表**：
  - 标签：`进行中`、`即将开始`、`已结束`。
  - 卡片包含海报缩略图、名称、状态标签（颜色区分）。
- **比赛详情**：
  - 首屏展示海报（渐进加载）。
  - 显示投稿倒计时。
  - 投稿按钮（显著 CTA），若已投稿显示“管理投稿”。
  - 投稿展示区支持瀑布流/网格，点击进入作品详情（全屏模态）。
- **投稿流程**：
  - Stepper：选择类型 → 上传作品 → 填写信息 → 确认提交。
  - 上传区复用帖子上传组件，支持排序、删除。
  - 限制提示（剩余可投数量、文件大小）。
- **个人中心**：
  - 个人资料、我的帖子列表、我的比赛投稿。
  - 设置入口：通知偏好、语言、退出登录。
- **管理后台**（移动端适配）：
  - 侧滑菜单切换模块。
  - 列表视图 + 搜索过滤。
  - 审核投稿时采用卡片展示重点信息，支持批量操作（长按多选）。

### 8.3 组件库与复用
- `PhotoCard`：通用卡片（用于帖子、比赛投稿）。
- `ImageGallery`：支持触摸手势、懒加载的图库组件。
- `RichTextViewer` / `RichTextEditor`：分别用于展示与编辑。
- `ContestCountdown`：展示剩余时间。
- `FloatingActionButton`：用于发布入口。
- `AdminTable`：简化版列表组件，支持移动端筛选抽屉。

## 9. 性能与体验优化
- **图片策略**：
  - 客户端压缩设置最大宽度（如 2048px），JPEG 品质 0.8。
  - 服务端调用 `sharp` 生成三档尺寸（`thumb`、`medium`、`large`）与 WebP 格式。
  - 使用 BlurHash 或 LQIP，列表先展示模糊占位。
  - Lazy loading（Intersection Observer），在滚动中动态加载。
- **数据缓存**：
  - React Query 缓存列表与详情；分页时合并。
  - Vercel Edge Cache + ISR（例如比赛详情 60s 重建）。
- **骨架屏**：卡片、详情页、评论使用 Skeleton。
- **离线体验**（可选增强）：利用 PWA Manifest + Service Worker 缓存静态资源。
- **可访问性**：ARIA 标签、键盘导航、对比度测试。

## 10. 安全与权限
- Supabase Auth + RLS 防止越权访问。
- 后端使用服务端 Supabase Client（Service Role）执行必要操作，并手动校验权限。
- 防范措施：
  - CSRF：API 仅接受 `Authorization` Bearer Token + SameSite 策略。
  - XSS：富文本输入限制允许标签；服务端对 HTML 消毒（DOMPurify）。
  - 速率限制：基于 IP + 用户的速率限制器。
  - 审计日志：管理员操作写入 `admin_notes` 或独立日志表。
- 媒体访问：公开列表使用临时签名 URL，防止滥用。

## 11. 开发流程与项目结构

### 11.1 推荐目录结构（Next.js App Router）
```
/
├─ app/
│  ├─ (public)/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                  # 首页（最新、精选）
│  │  ├─ posts/[id]/page.tsx
│  │  ├─ contests/page.tsx
│  │  └─ contests/[id]/page.tsx
│  ├─ (auth)/                      # 登录/注册/重置
│  ├─ (dashboard)/admin/…          # 管理后台
│  ├─ api/                         # Route Handlers（REST）
│  └─ upload-callback/route.ts     # 上传完成回调
├─ components/                     # 通用 UI 组件
├─ features/                       # 领域模块化（posts、contests、comments…）
├─ lib/                            # Supabase 客户端、权限、中间件
├─ server/                         # 后端服务逻辑划分
├─ hooks/
├─ utils/
├─ public/
└─ tests/                          # Playwright / Vitest
```

### 11.2 工具链与质量保障
- **编码规范**：ESLint（Next.js + Tailwind 插件）、Prettier、TypeScript 严格模式。
- **测试**：
  - 单元测试：Vitest + Testing Library。
  - 集成测试：对 API Route 使用 Supertest。
  - 端到端测试：Playwright（覆盖发布帖子、投稿流程）。
- **CI/CD**：
  - GitHub Actions：Lint → Test → Build → Deploy。
  - Preview 部署：每个 PR 自动部署 Vercel Preview。
- **监控**：接入 Sentry（前后端）、Supabase 监控面板。

### 11.3 里程碑建议
1. **MVP (v0.1)**：用户注册 / 登录、发布帖子、浏览、点赞、评论；基础管理员功能（精选、删除）。
2. **比赛模块 (v0.2)**：完成比赛 CRUD、投稿流程、投稿展示。
3. **性能增强 (v0.3)**：图片多尺寸、懒加载、骨架屏、缓存策略。
4. **管理后台优化 (v0.4)**：统计面板、批量审核。
5. **体验升级 (v0.5)**：PWA、通知（邮件/推送）、多语言。

## 12. 依赖清单（部分）
- 前端：`next`, `react`, `react-dom`, `@tanstack/react-query`, `zustand`, `tailwindcss`, `@headlessui/react`, `@heroicons/react`, `browser-image-compression`, `@tiptap/react`。
- 后端：`@supabase/supabase-js`, `zod`, `sharp`, `jsonwebtoken`, `upstash/ratelimit`.
- 工具：`eslint`, `prettier`, `typescript`, `vitest`, `@testing-library/react`, `playwright`.

## 13. 后续扩展方向
- 添加专题页面（年度最佳、摄影师专访）。
- 引入收藏夹、关注、私信等社区功能。
- 比赛评审流程（评委打分、公布榜单）。
- 接入通知服务（邮件提醒投稿结果）。
- 用户成长体系（勋章、积分）。

---
此方案覆盖过期相册的核心业务需求、技术架构、数据模型及交互设计，可直接指导后续的工程实施与迭代规划。
