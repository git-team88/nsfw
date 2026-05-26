<script setup lang="ts">
import { useHead, useRouter } from '#imports';

const router = useRouter();

useHead({
  htmlAttrs: {
    lang: 'zh'
  }
});
</script>

<template>
  <NuxtPage />
</template>

<style>
@import '@/base.css';
</style>
