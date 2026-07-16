<template>
  <div class="agree-box" v-if="isShowAgree">
    <div class="bg" @click="closeAgree()"></div>
    <div class="agree">
      <button class="close" @click="closeAgree()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>

      <div class="title">{{ t('closedBetaAgreementTitle') }}</div>
      <div class="content" ref="contentContainer" @scroll="handleScrollFunc">
        <div v-html="t('closedBetaAgreement')"></div>
      </div>
      <div class="tip">{{ t('agreeTip') }}</div>
      <button class="agree-btn" :class="isFinishAgree ? 'on' : ''" @click="goRegister()">
        {{ btnText }}
      </button>
      <div class="agree-check" @click="isAgree = !isAgree">
        <span class="check-box" :class="isAgree ? 'checked' : ''">
          <svg v-if="isAgree" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </span>
        <span class="check-text">{{ t('checkAgreeText') }}</span>
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
  let timerTicker: ReturnType<typeof setInterval> | null = null
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

      if (timer.value <= 0) {
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
      toast(t('pleaseAgreeAgreement'))
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
    width: 100vw;
    height: 100vh;
    z-index: 640;

    .bg {
      position: fixed;
      left: 0;
      top: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(22, 17, 34, 0.4);
      z-index: 640;
    }

    .agree{
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 650;
      width: 680px;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
      padding: 32px 36px 28px;
      border: 3px solid #161122;
      border-radius: 6px;
      background: #FFFDF7;
      box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);

      .close{
        position: absolute;
        top: 14px;
        right: 16px;
        width: 28px;
        height: 28px;
        border: 2px solid #161122;
        border-radius: 8px;
        background: #fff;
        display: grid;
        place-items: center;
        cursor: pointer;
        z-index: 660;
        transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
        box-shadow: 2px 2px 0 #161122;

        &:hover{
          transform: translateY(-1px);
          box-shadow: 3px 3px 0 #161122;
        }
      }

      .title{
        margin: 0 0 20px;
        padding: 0 0 20px;
        font-size: 22px;
        font-weight: 800;
        text-align: center;
        color: #161122;
        border-bottom: 2px solid rgba(22, 17, 34, 0.12);
      }

      .content{
        max-height: 340px;
        margin: 24px 0 12px;
        font-size: 14px;
        font-weight: 600;
        overflow-y: auto;
        line-height: 1.7;
        color: #5b5566;
        padding: 16px;
        border: 2.5px solid #161122;
        border-radius: 12px;
        background: #fff;

        :deep(h1) { font-weight: 800; font-size: 24px; margin: 0 0 16px 0; color: #161122;}
        :deep(.sub) { color: #5b5566; margin-top: 0; }
        :deep(.meta) { color: #5b5566; margin-bottom: 24px; font-size: 14px; }
        :deep(.meta a) { color: #FF4D8D; text-decoration: none; }
        :deep(.meta a:hover) { text-decoration: underline; }
        :deep(h2) { font-weight: 800; font-size: 20px; margin: 32px 0; border-left: 4px solid #FF4D8D; padding-left: 8px; color: #161122;}
        :deep(h3) { font-weight: 800; font-size: 18px; margin: 28px 0; color: #161122;}
        :deep(p) { margin: 16px 0; }
        :deep(ul) { padding-left: 24px; list-style: disc;}
        :deep(li) { list-style: disc;}
        :deep(code) { background: rgba(255, 77, 141, 0.12); padding: 6px 8px; border-radius: 4px; }
        :deep(table) { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;}
        :deep(th), :deep(td){ border: 1px solid rgba(22, 17, 34, 0.12); padding: 12px; vertical-align: top;}
        :deep(thead th){ background: rgba(22, 17, 34, 0.06); text-align: left; }
        :deep(.notice){ background: rgba(255, 77, 141, 0.12); border: 2px solid #FF4D8D; padding: 16px; border-radius: 12px; }
        :deep(footer){ margin-top: 48px; color: #9a93a4; font-size: 14px;}
      }

      .tip{
        margin: 0 0 8px;
        font-size: 13px;
        font-weight: 700;
        text-align: center;
        color: #E5484D;
      }

      .agree-btn{
        width: 100%;
        border: 2.5px solid #161122;
        border-radius: 13px;
        background: rgba(255, 77, 141, 0.4);
        color: #ffffff;
        font-size: 16px;
        font-weight: 800;
        padding: 14px;
        cursor: not-allowed;
        box-shadow: 3px 3px 0 #161122;
        transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s, background 0.2s;

        &.on{
          background: #FF4D8D;
          cursor: pointer;

          &:hover{
            transform: translate(-1px, -1px);
            box-shadow: 4px 4px 0 #161122;
          }

          &:active{
            transform: translate(0, 0);
            box-shadow: 2px 2px 0 #161122;
          }
        }
      }

      .agree-check{
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        cursor: pointer;
        user-select: none;

        .check-box{
          width: 22px;
          height: 22px;
          border: 2.5px solid #161122;
          border-radius: 7px;
          background: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.16s;
          flex-shrink: 0;

          &.checked{
            background: #FF4D8D;
            animation: checkBounce 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        }

        .check-text{
          font-size: 12.5px;
          font-weight: 600;
          line-height: 1.7;
          color: #161122;
          opacity: 0.8;
        }
      }
    }
  }

  @keyframes checkBounce {
    0% { transform: scale(1); }
    45% { transform: scale(1.2); }
    70% { transform: scale(0.93); }
    100% { transform: scale(1); }
  }
</style>
