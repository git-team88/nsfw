<template>
  <div class="large-viewer" v-if="visible">
    <div class="close-viewer-btn" @click.stop="close">
      <span></span>
    </div>

    <div class="viewer-content" @click.stop>
      <img
        :src="images[currentIndex].image_url"
        alt=""
        :style="{ transform: `scale(${zoomLevel / 100})` }"
      />
    </div>

    <!-- Viewer Nav -->
    <div
      class="viewer-nav prev"
      :class="!hasPrevImage ? 'dis' : ''"
      v-if="images && images.length > 1"
      @click.stop="prevImage"
    >
      <span></span>
    </div>
    <div
      class="viewer-nav next"
      :class="!hasNextImage ? 'dis' : ''"
      v-if="images && images.length > 1"
      @click.stop="nextImage"
    >
      <span></span>
    </div>

    <!-- Zoom Controls -->
    <div class="zoom-controls" @click.stop>
      <img
        class="zoom-btn left"
        :class="zoomLevel <= 10 ? 'dis' : ''"
        src="../assets/images/detail/reduce.png"
        @click="zoomOut"
        alt=""
      />
      <span class="zoom-text">{{ zoomLevel }}%</span>
      <img
        class="zoom-btn right"
        :class="zoomLevel >= 100 ? 'dis' : ''"
        src="../assets/images/detail/add.png"
        @click="zoomIn"
        alt=""
      />
    </div>
  </div>
</template>

<script setup lang="ts" name="ImageViewer">
import { ref, computed } from "vue";

interface ImageItem {
  image_url: string;
}

const props = defineProps<{
  visible: boolean;
  images: ImageItem[];
  initialIndex?: number;
}>();

const emit = defineEmits<{
  close: [];
}>();

// State
const currentIndex = ref(props.initialIndex || 0);
const zoomLevel = ref(100);

// Computed properties
const hasPrevImage = computed(() => {
  return currentIndex.value > 0;
});

const hasNextImage = computed(() => {
  return currentIndex.value < props.images.length - 1;
});

// Methods
function close() {
  emit('close');
}

function prevImage() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
}

function nextImage() {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++;
  }
}

function zoomIn() {
  if (zoomLevel.value < 100) {
    zoomLevel.value += 10;
  }
}

function zoomOut() {
  if (zoomLevel.value > 10) {
    zoomLevel.value -= 10;
  }
}
</script>

<style lang="scss" scoped>
.large-viewer {
  position: fixed;
  inset: 0;
  background: #1f1f21;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;

  .close-viewer-btn {
    position: fixed;
    top: 2.4rem;
    left: 2.4rem;
    width: 4.8rem;
    height: 4.8rem;
    display: flex;
    align-items: center;
    cursor: pointer;
    z-index: 2100;

    span {
      width: 4.8rem;
      height: 4.8rem;
      background: url("@/assets/images/detail/big_close.png");
      background-size: 100% 100%;
    }
  }

  .viewer-content {
    width: 100%;
    height: 100%;
    img {
      max-width: 100%;
      max-height: 100%;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .viewer-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 4.8rem;
    height: 4.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 5;

    span {
      width: 4.8rem;
      height: 4.8rem;
    }

    &.prev {
      left: 2.4rem;
      span {
        background: url("@/assets/images/detail/left.png") no-repeat;
        background-size: 100% 100%;
      }

      &.dis {
        cursor: not-allowed;
        span {
          background: url("@/assets/images/detail/left_dis.png") no-repeat;
          background-size: 100% 100%;
        }
      }
    }
    &.next {
      right: 2.4rem;
      span {
        background: url("@/assets/images/detail/right.png") no-repeat;
        background-size: 100% 100%;
      }

      &.dis {
        cursor: not-allowed;
        span {
          background: url("@/assets/images/detail/right_dis.png") no-repeat;
          background-size: 100% 100%;
        }
      }
    }
  }

  .zoom-controls {
    position: absolute;
    bottom: 2.4rem;
    right: 2.4rem;
    height: 3.2rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 1.6rem;
    padding: 0 3.2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    color: #fff;

    .zoom-btn {
      position: absolute;
      top: 0;
      width: 3.2rem;
      height: 3.2rem;
      cursor: pointer;
      z-index: 2110;

      &.left {
        left: 0;
      }

      &.right {
        right: 0;
      }

      &.dis {
        opacity: 0.7;
        cursor: not-allowed;
      }

      img {
        width: 100%;
        height: 100%;
      }
    }

    .zoom-text {
      font-size: 1.6rem;
      min-width: 5.6rem;
      text-align: center;
      color: #ffffff;
    }
  }
}
</style>