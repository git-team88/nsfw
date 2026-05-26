<script setup lang="ts">
defineProps<{
  data: any;
}>();
</script>

<template>
  <div class="detail-content">
    <div v-if="data" class="detail-wrapper">
      <img :src="data.cover" :alt="data.title" class="cover" />
      <h1 class="title">{{ data.title }}</h1>
      <p class="author">作者：{{ data.author }}</p>
      <p class="description">{{ data.description }}</p>
      
      <div class="chapters">
        <h2>章节列表</h2>
        <div v-if="data.chapters" class="chapter-list">
          <a 
            v-for="chapter in data.chapters" 
            :key="chapter.id"
            :href="`/chapter/${chapter.id}`"
            class="chapter-link"
          >
            {{ chapter.title }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-content {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.cover {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 8px;
}

.title {
  font-size: 28px;
  margin: 20px 0 10px;
}

.author {
  color: #666;
  margin: 0 0 15px;
}

.description {
  line-height: 1.8;
  color: #333;
}

.chapters {
  margin-top: 30px;
}

.chapters h2 {
  font-size: 20px;
  margin-bottom: 15px;
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chapter-link {
  padding: 12px 15px;
  background: #f5f5f5;
  border-radius: 6px;
  text-decoration: none;
  color: #333;
  transition: background 0.3s;
}

.chapter-link:hover {
  background: #eee;
}
</style>
