## 实施计划

### 1. Generate.vue：添加发布按钮

在图片记录和视频记录的 footer 区域，`regenerate-btn` 旁边添加发布按钮：

**图片 footer**（第 145 行 `.photo-footer` 内）：
```html
<div class="publish-btn" v-if="isTaskSuccess(record.step_status || record.status)" @click="publishPhoto(record)">
  <img src="@/assets/images/home/send.png" alt="publish" />
</div>
```

**视频 footer**（第 317 行 `.video-footer` 内）：
```html
<div class="publish-btn" v-if="isTaskSuccess(record.step_status || record.status)" @click="publishVideo(record)">
  <img src="@/assets/images/home/send.png" alt="publish" />
</div>
```

**publishPhoto / publishVideo 函数**：
```js
const publishPhoto = (record: any) => {
  const images = (record.images || []).filter(Boolean);
  const cover = images[0] || record.cover || '';
  router.push({
    path: '/publish/image',
    query: { session_id: record.session_id, image_urls: images.join(','), cover }
  });
};

const publishVideo = (record: any) => {
  router.push({
    path: '/publish/generate-video',
    query: {
      session_id: record.session_id,
      video_url: record.videoUrl || record.video_url || '',
      cover: record.videoCover || ''
    }
  });
};
```

**样式**（Generate.scss）：`.publish-btn` 复用 `.regenerate-btn` 的样式（flex 居中 + 20px 图标）。

### 2. 新建 PublishImage.vue（精简版图片发布页）

路径：`src/views/publish/PublishImage.vue`

基于 Comic.vue 精简，保留核心功能：
- `onMounted` 读取 `route.query`：`session_id`、`image_urls`（逗号分隔）、`cover`
- 显示图片预览（第一张作为封面）
- 表单：标题（60字）、描述（4000字）、权限（public/partial/private）、原创（yes/no）
- 合集选择（搜索 + 新建合集）
- 发布接口：`POST {baseUrl}post/addPost`，payload `type: 1`，`image_urls: string[]`
- 成功后跳转 `/publish/success?type=1`
- 去掉：项目列表、批量发布、编辑模式、上传逻辑（图片URL已有）

### 3. 新建 PublishGenerateVideo.vue（精简版视频发布页）

路径：`src/views/publish/PublishGenerateVideo.vue`

基于 Video.vue 精简，保留核心功能：
- `onMounted` 读取 `route.query`：`session_id`、`video_url`、`cover`
- 显示视频预览 + 封面
- 表单：标题、描述、权限、原创（同上）
- 合集选择（搜索 + 新建合集，type=3）
- 发布接口：`POST {baseUrl}post/addPost`，payload `type: 3`，`video_url: string`
- 成功后跳转 `/publish/success?type=3`
- 去掉：项目列表、批量发布、编辑模式、分片上传逻辑（视频URL已有）

### 4. 路由注册（src/router/index.ts）

在现有 publish 路由后面添加：
```js
{
  path: "/publish/image",
  name: "PublishImage",
  component: () => import("@/views/publish/PublishImage.vue"),
},
{
  path: "/publish/generate-video",
  name: "PublishGenerateVideo",
  component: () => import("@/views/publish/PublishGenerateVideo.vue"),
},
```

### 5. SCSS 文件

- `src/scss/PublishImage.scss` — 基于 Comic.scss 精简
- `src/scss/PublishGenerateVideo.scss` — 基于 Video.scss 精简

### 涉及文件

| 文件 | 操作 |
|---|---|
| `src/views/Generate.vue` | 添加发布按钮 + publishPhoto/publishVideo 函数 |
| `src/scss/Generate.scss` | 添加 .publish-btn 样式 |
| `src/views/publish/PublishImage.vue` | 新建 |
| `src/views/publish/PublishGenerateVideo.vue` | 新建 |
| `src/scss/PublishImage.scss` | 新建 |
| `src/scss/PublishGenerateVideo.scss` | 新建 |
| `src/router/index.ts` | 注册 2 个新路由 |