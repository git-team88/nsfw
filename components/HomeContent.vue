<script setup lang="ts">
defineProps<{
  initialData?: any;
}>();

defineEmits<{
  (e: 'selectType', type: string): void;
}>();
</script>

<template>
  <div class="home-content">
    <div class="content-type-tabs">
      <button @click="$emit('selectType', 'novel')" class="tab active">小说</button>
      <button @click="$emit('selectType', 'comic')" class="tab">漫画</button>
      <button @click="$emit('selectType', 'video')" class="tab">视频</button>
    </div>
    
    <div class="content-list">
      <div v-if="initialData && initialData.data" class="items">
        <div 
          v-for="item in initialData.data" 
          :key="item.id" 
          class="item-card"
        >
          <img :src="item.cover" :alt="item.title" class="cover" />
          <h3 class="title">{{ item.title }}</h3>
          <p class="description">{{ item.description }}</p>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>暂无数据</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-content {
  padding: 20px;
}

.content-type-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #f0f0f0;
  transition: all 0.3s;
}

.tab.active {
  background: #fb64b6;
  color: white;
}

.content-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.item-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.cover {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.title {
  padding: 10px;
  margin: 0;
  font-size: 16px;
}

.description {
  padding: 0 10px 10px;
  margin: 0;
  font-size: 14px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
