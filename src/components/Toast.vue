<template>
  <div
    class="toast"
    v-if="isShowToast"
    :style="{ 'min-width': minWidth }">
    {{ toastMsg }}
  </div>
</template>

<script setup lang="ts" name="Toast">
  import { ref } from 'vue'

  const props = withDefaults(defineProps<{
    minWidth?: string
  }>(), {
    minWidth: 'auto'
  })

  const isShowToast = ref(false)
  const toastMsg = ref('')

  const show = (msg: string) => {
    toastMsg.value = msg
    isShowToast.value = true
    setTimeout(() => {
      isShowToast.value = false
      toastMsg.value = ''
    }, 4000)
  }

  defineExpose({ show })
</script>

<style lang="scss" scoped>
  .toast {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    padding: 12px 20px;
    font-size: 16px;
    border-radius: 6px;
    background: rgba(0, 0, 0, .75);
    color: #ffffff;
    z-index: 2000;
    max-width: 500px;
    text-align: center;
    word-break: break-word;
  }
</style>
