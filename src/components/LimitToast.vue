<template>
  <transition name="limit-toast-fade">
    <div class="limit-toast" v-if="visible">
      <div class="limit-toast-content">
        <span class="limit-toast-msg">{{ message }}</span>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const message = ref('')

const show = (msg: string) => {
  message.value = msg
  visible.value = true
  setTimeout(() => {
    visible.value = false
    message.value = ''
  }, 3000)
}

defineExpose({ show })
</script>

<style lang="scss" scoped>
.limit-toast {
  position: fixed;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;

  .limit-toast-content {
    max-width: 250px;
    background: #1a1a1a;
    border: 1px solid #3d3d3d;
    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
    border-radius: 14px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(229, 72, 77, 0.08);
      border-radius: 14px;
    }

    .limit-toast-msg {
      position: relative;
      font-size: 16px;
      color: #E5484D;
      word-break: break-word;
    }
  }
}

.limit-toast-fade-enter-active,
.limit-toast-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.limit-toast-fade-enter-from,
.limit-toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -40%);
}
</style>
