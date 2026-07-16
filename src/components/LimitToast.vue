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
    background: #ffffff;
    border-radius: 4px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0px 0px 32px 0px rgba(0, 0, 0, 0.2);

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(250, 45, 71, 0.06);
      border-radius: 4px;
    }

    .limit-toast-msg {
      position: relative;
      font-size: 16px;
      color: #fa2d47;
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
