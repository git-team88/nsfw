## 实施计划

### 1. 重写 Image.vue（图片发布页）

参考 Comic.vue 的 tab 结构，精简版：

**顶部导航 tab**（5个）：
- 小说 → `/publish/novel`
- 漫画 → `/publish/comic`
- 漫剧 → `/publish/video`
- 图片 → `/publish/image`（当前页，默认选中）
- 视频 → `/publish/clip`

**上传方式 tab**（2个）：
- `history` — 从生成历史中选择
- `local` — 本地上传

**history tab 内容**：
- 调 `api.getProject(0, 'photo', currentPage, 12, 1)` 加载图片生成历史
- 项目网格展示（封面用 `result_async.final_images?.[0]` 或 `cover`）
- 点击项目 → 直接进入发布表单（不要章节选择、不要合集）
- 分页

**local tab 内容**：
- 拖拽上传区 + 点击上传按钮
- accept: image/jpeg, image/jpg, image/png, image/webp
- 上传后进入发布表单

**发布表单**：
- 标题（60字）、描述（4000字）、权限（public/partial/private）、原创（yes/no）
- 图片预览区（第一张为封面）
- 发布按钮 → `POST {baseUrl}post/addPost`，type=1，image_urls 数组
- 成功后跳转 `/publish/success?type=1`

**URL跳转入口**：保留从 Generate.vue 带 `session_id` + `image_urls` + `cover` 跳转的功能，有参数时直接进发布表单。

### 2. 重写 Clip.vue（视频发布页）

参考 Video.vue 的 tab 结构，精简版：

**顶部导航 tab**（5个，同 Image.vue）

**上传方式 tab**（2个）：
- `history` — 从生成历史中选择
- `local` — 本地上传

**history tab 内容**：
- 调 `api.getProject(0, 'manju', currentPage, 10, 1)` 加载视频生成历史
- 项目网格展示（封面用 `result_async.generate_manju_cover`）
- 点击项目 → 选择章节后进入发布表单（简化：直接进表单，不要合集）
- 分页

**local tab 内容**：
- 拖拽上传区 + 点击上传按钮
- accept: video/mp4, video/quicktime
- 分片上传（复用 Video.vue 的 getVideoId → uploadCosPart → getVideoMerge）
- 上传后进入发布表单

**发布表单**：
- 标题、描述、权限、原创
- 视频预览 + 封面
- 发布按钮 → `POST {baseUrl}post/addPost`，type=3，video_url
- 成功后跳转 `/publish/success?type=3`

**URL跳转入口**：保留从 Generate.vue 带 `session_id` + `video_url` + `cover` 跳转的功能。

### 3. 更新现有页面的 tabList

在 Comic.vue、Video.vue、Novel.vue 的 `tabList` 中增加图片和视频 tab：
```js
const tabList = [
  { name: t("submit.tabs.novel"), path: "/publish/novel" },
  { name: t("submit.tabs.manhua"), path: "/publish/comic" },
  { name: t("submit.tabs.manju"), path: "/publish/video" },
  { name: t("submit.tabs.photo"), path: "/publish/image" },
  { name: t("submit.tabs.video"), path: "/publish/clip" },
];
```

### 4. 更新 Header.vue typeList

```js
const typeList = ref([
  { name: t("header.type4"), path: "/publish/novel" },     // 小说
  { name: t("header.type3"), path: "/publish/comic" },     // 漫画
  { name: t("header.type2"), path: "/publish/video" },     // 漫剧
  { name: t("header.type5"), path: "/publish/image" },     // 图片
  { name: t("header.type6"), path: "/publish/clip" },      // 视频
]);
```

### 5. SCSS 文件

- `Image.scss` — 更新为完整的 tab + 上传区 + 表单样式
- `Clip.scss` — 更新为完整的 tab + 上传区 + 表单样式

### 涉及文件

| 文件 | 操作 |
|---|---|
| `src/views/publish/Image.vue` | 重写（加 tab + 上传 + 表单） |
| `src/views/publish/Clip.vue` | 重写（加 tab + 上传 + 表单） |
| `src/scss/Image.scss` | 更新样式 |
| `src/scss/Clip.scss` | 更新样式 |
| `src/views/publish/Comic.vue` | tabList 加图片+视频 |
| `src/views/publish/Video.vue` | tabList 加图片+视频 |
| `src/views/publish/Novel.vue` | tabList 加图片+视频 |
| `src/components/Header.vue` | typeList 修正 type6 指向 /publish/clip |