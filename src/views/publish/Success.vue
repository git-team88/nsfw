<template>
  <div class="submit-success">
    <Header :cur="-1"></Header>

    <div class="container">
      <div class="content">
        <h2>{{ t('submit.success.title') }}</h2>
        <div class="icon">
          <img src="@/assets/images/publish/success.png" alt="" />
        </div>
        <div class="actions">
          <button class="btn secondary" @click="toProfile">{{ t('submit.success.back') }}</button>
          <button class="btn primary" @click="postAnother">{{ t('submit.success.post') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/Header.vue'
import router from '@/router'
import { useRoute } from 'vue-router'
const route = useRoute()
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

function goBack() {
  router.go(-1)
}
function toProfile() {
  const uid = localStorage.getItem('uid')
  if (uid) {
    router.push(`/user-home?id=${uid}`)
  } else {
    router.push('/user-home')
  }
}
function postAnother() {
  router.push('/publish/video')
  // const type = (route.query.type as string)
  // const map: Record<string, string> = {
  //   3: '/publish/video',
  //   1: '/publish/image',
  //   2: '/publish/article'
  // }
  // router.push(map[type] || '/publish/video')
}
</script>

<style scoped lang="scss">
.submit-success{
  width: 100%;
  min-height: 100vh;
  padding: 12rem 0 0;
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #FFFFFF;
}
.container{
  position: relative;
  max-width: 90rem;
  min-height: calc(100vh - 12rem);
  margin: 0 auto;
  padding: 6rem 0;
  border: 1px solid rgba(251,100,182,0.2);
  -webkit-border-radius: 1.2rem;
  border-radius: 1.2rem;
  background:rgba(255,255,255,0.8);
}

.content{
  h2{
    font: {
      weight: 600;
      size: 2rem;
    }
    text-align: center;
    color: #101828;
  }
  .icon{
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 4rem 0 6rem;
    img{ width: 34.8rem; height: 20rem; }
  }
  .actions{
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2.4rem;
    .btn{
      min-width: 24rem;
      height: 4.8rem;
      border: none;
      -webkit-border-radius: .8rem;
      border-radius: .8rem;
      font: {
        weight: 600;
        size: 1.6rem;
      }
      cursor: pointer;

      &.secondary{
        border: 1px solid #FB64B6;
        background: none;
        color: #FB64B6;
      }
      &.primary{
        background: #FB64B6;
        color: #FFFFFF;
      }
    }
  }
}
</style>
