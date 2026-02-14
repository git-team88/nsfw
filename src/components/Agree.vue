<template>
  <div class="agree-box" v-if="isShowAgree">
    <div class="bg"></div>
    <div class="agree">
      <img class="close" src="@/assets/images/base/close.png" alt="" @click="closeAgree()" />

      <div class="title">{{ t('agreeTitle') }}</div>
      <div class="content" ref="contentContainer" @scroll="handleScrollFunc">
        <div v-html="t('agreement')"></div>
      </div>
      <div class="tip">{{ t('agreeTip') }}</div>
      <div class="agree-btn" :class="isFinishAgree ? 'on' : ''" @click="goRegister()">
        <span>{{ btnText }}</span>
      </div>
      <div class="agree-check" @click="isAgree = !isAgree">
        <img src="@/assets/images/register/check_active.png" alt="" v-if="isAgree" />
        <img src="@/assets/images/register/check.png" alt="" v-else />
        <span>{{ t('checkAgreeText') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="Header">
  import { toast } from "@/util/toast"
  import { onBeforeUnmount, onMounted, ref } from "vue"
  import { useI18n } from "vue-i18n"

  const { t } = useI18n()

  const isAgree = ref(false)
  const isShowAgree = ref(false)
  const isFinishAgree = ref(false)
  const timer = ref(3)
  let timerTicker: number | null = null
  const contentContainer = ref(null)
  const isReachedBottom = ref(false)
  const agreeText = t('agreeBtn')
  const btnText = ref('3s')

  const emit = defineEmits(['toRegister'])

  onBeforeUnmount(() => {
    handleScroll.cancel()

    if (timerTicker) {
      clearInterval(timerTicker)
    }
  })

  function showAgree() {
    if (timerTicker) {
      clearInterval(timerTicker)
    }
    timer.value = 3

    isShowAgree.value = true

    timerTicker = setInterval(() => {
      timer.value = timer.value-1
      btnText.value = timer.value + 's'

      if (timer.value <= 0) {
        timer.value = 0

        btnText.value = agreeText
      }

      if (timer.value <=0 && isReachedBottom.value) {
        if (!isFinishAgree.value) {
          isFinishAgree.value = true
        }

        if (timerTicker) {
          clearInterval(timerTicker);
          timerTicker = null
        }
      }
    }, 1000)
  }

  function debounce(func: Function, delay: number) {
    let timer: ReturnType<typeof setTimeout> | null = null
    return {
      func: function (...args: any[]) {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => func.apply(this, args), delay)
      },
      cancel: function () {
        if (timer) clearTimeout(timer)
        timer = null
      }
    }
  }

  const handleScroll = debounce(() => {
    if (!contentContainer.value) return

    const { scrollTop, scrollHeight, clientHeight } = contentContainer.value
    const threshold = 50

    if (isReachedBottom.value) return

    isReachedBottom.value = scrollTop + clientHeight >= scrollHeight - threshold
  }, 150)

  const handleScrollFunc = (event: Event) => {
    handleScroll.func(event)
  }

  function closeAgree() {
    timer.value = 3
    isAgree.value = false
    if (timerTicker) {
      clearInterval(timerTicker)
    }
    timerTicker = null
    btnText.value = '3s'
    isFinishAgree.value = false
    isReachedBottom.value = false
    isShowAgree.value = false
  }

  function goRegister() {
    if (!isFinishAgree.value) {
        return false;
      }

    if (!isAgree.value) {
      toast('Please agree to the user agreement')
      return false
    }

    emit('toRegister')

    timer.value = 3
    btnText.value = '3s'
    isAgree.value = false
    if (timerTicker) {
      clearInterval(timerTicker)
    }
    timerTicker = null
    isFinishAgree.value = false
    isReachedBottom.value = false
    isShowAgree.value = false
  }

  defineExpose({
    showAgree
  })
</script>

<style lang="scss" scoped>
  .agree-box {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 640;

    .bg {
      width: 100%;
      height: 100vh;
      background: rgba(0, 0, 0, 0.3);
    }

    .agree{
      position: absolute;
      left: 50%;
      top: 50%;
      width: 68rem;
      padding: 2rem;
      transform: translateX(-50%) translateY(-50%);
      -webkit-border-radius: 1.2rem;
      border-radius: 1.2rem;
      background: #FFFFFF;
      z-index: 650;

      .close{
        position: absolute;
        top: 1.4rem;
        right: 2rem;
        width: 3rem;
        height: 3rem;
        z-index: 660;
        cursor: pointer;
        &:hover{
          opacity: .8;
        }
      }

      .title{
        margin: 0 0 2rem;
        padding: 0 0 2rem;
        font: {
          weight: bold;
          size: 1.8rem;
        }
        text-align: center;
        color: #364153;
      }

      .content{
        height: 34rem;
        margin: 2.4rem 0 3rem;
        overflow-y: scroll;
        line-height: 1.7;
        color: #4A5565;

        :deep(h1) { font-weight: bold; font-size: 2.4rem; margin: 0 0 1rem 0; color: #4A5565;}
        :deep(.sub) { color: #4A5565; margin-top: 0; }
        :deep(.meta) { color: #4A5565; margin-bottom: 2rem; font-size: 1.4rem; }
        :deep(.meta a) { color: #00FFFF; text-decoration: none; }
        :deep(.meta a:hover) { text-decoration: underline; }
        :deep(h2) { font-weight: bold; font-size: 2rem; margin: 3rem 0; border-left: 4px solid #00FFFF; padding-left: .6rem; color: #4A5565;}
        :deep(h3) { font-weight: bold; font-size: 1.75rem; margin: 2.8rem 0; color: #4A5565;}
        :deep(p) { margin: 1.5rem 0; }
        :deep(ul) { padding-left: 1.8rem; list-style: disc;}
        :deep(li) { list-style: disc;}
        :deep(code) { background: rgba(0, 255, 255, 0.12); padding:.7rem .9rem; border-radius:4px; }
        :deep(table) { width:100%; border-collapse: collapse; margin: 1.6rem 0; font-size: 1.6rem;}
        :deep(th), :deep(td){ border:1px solid rgba(255, 255, 255, 0.12); padding:1.2rem 1.1rem; vertical-align: top;}
        :deep(thead th){ background:rgba(255, 255, 255, 0.06); text-align:left; }
        :deep(.notice){ background: rgba(0, 255, 255, 0.12); border:1px solid #00FFFF; padding: 1.4rem 1.6rem; border-radius:8px; }
        :deep(footer){ margin-top:5rem; color:#6A7282; font-size:1.4rem;}
      }

      .tip{
        margin: 0 0 1rem;
        font: {
          size: 1.4rem;
        }
        text-align: center;
        color: #FA2D47;
      }

      .agree-btn{
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 0 2rem;
        span{
          position: relative;
          min-width: 18rem;
          height: 4.8rem;
          padding: 0 1rem;
          font: {
            size: 1.6rem;
          }
          text-align: center;
          line-height: 4.8rem;
          -webkit-border-radius: .8rem;
          border-radius: .8rem;
          background: #FB64B6;
          color: #FFFFFF;
          cursor: default;

          &::after{
            position: absolute;
            left: 0;
            top: 0;
            content: '';
            width: 100%;
            height: 4.8rem;
            background: rgba(255, 255, 255, 0.5);
            z-index: 1;
          }
        }
        &.on{
          span{
            cursor: pointer;

            &::after{
              position: absolute;
              left: 0;
              top: 0;
              content: '';
              width: 100%;
              height: 4.8rem;
              background: none;
              z-index: -1;
            }
          }
        }
      }

      .agree-check{
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        img{
          width: 1.6rem;
          height: 1.6rem;
          margin: 0 1rem 0 0;
        }
        span{
          font: {
            size: 1.4rem;
          }
          color: #6A7282;
        }
      }
    }
  }
</style>