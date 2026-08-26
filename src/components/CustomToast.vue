<template>
  <transition name="toast-fade">
    <div class="custom-toast" :class="theme" v-if="visible">
      <div class="toast-content">
        <img v-if="icon" :src="icon" class="toast-icon" />
        <span class="toast-msg">{{ message }}</span>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean;
  message: string;
  icon?: string;
  theme?: string;
}>();
</script>

<style scoped lang="scss">
.custom-toast {
  position: fixed;
  top: 110px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;

  &.pink {
    .toast-content {
      box-shadow: 0px 0px 32px 0px rgba(0,0,0,0.2);

      &::before {
        content: "";
        position: absolute;
        top: 0;
        width: 0;
        width: 100%;
        height: 100%;
        background: rgba(250, 45, 71, 0.06);
      }

      .toast-msg {
        color: #E5484D;
      }
    }
  }

  &.blue {
    .toast-content {
      box-shadow: 0px 0px 32px 0px rgba(0,0,0,0.2);

      &::before {
        content: "";
        position: absolute;
        top: 0;
        width: 0;
        width: 100%;
        height: 100%;
        background: rgba(5, 223, 114, 0.06);
      }

      .toast-msg {
        color: #05DF72;
      }
    }
  }

  .toast-content {
    position: relative;
    max-width: 250px;
    background: #1a1a1a;
    border: 1px solid #3d3d3d;
    border-radius: 4px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    box-shadow: 0px 0px 32px 0px rgba(0, 0, 0, 0.2);

    .toast-icon {
      width: 24px;
      height: 24px;
    }

    .toast-msg {
      font-size: 16px;
      word-break: break-word;
    }
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -40%);
}
</style>
