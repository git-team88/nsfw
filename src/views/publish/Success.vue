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
  const type = (route.query.type as string)
  const map: Record<string, string> = {
    3: '/publish/video',
    1: '/publish/comic',
    2: '/publish/novel'
  }
  router.push(map[type] || '/publish/video')
}
</script>

<style scoped lang="scss">
.submit-success{
  width: 100%;
  min-height: 100vh;
  padding: 140px 0 0;
  background: #FFFBF4;
}
.container{
  position: relative;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 28px;
}

.content{
  h2{
    font-weight: 800;
    font-size: 20px;
    text-align: center;
    color: #161122;
  }
  .icon{
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 40px 0 60px;
    img{ width: 348px; height: 200px; }
  }
  .actions{
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    .btn{
      min-width: 240px;
      height: 48px;
      border: 2px solid #161122;
      border-radius: 14px;
      font-weight: 800;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 2px 2px 0 #161122;
      transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

      &.secondary{
        background: #FFFFFF;
        color: #161122;

        &:hover {
          border-color: #FF4D8E;
          color: #FF4D8E;
          transform: translateY(-1px);
          box-shadow: 3px 3px 0 #161122;
        }
      }
      &.primary{
        background: linear-gradient(135deg, #FF4D8D, #FF7A45);
        color: #FFFFFF;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 3px 3px 0 #161122;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .submit-success {
    padding: 80px 0 0;

    .container {
      padding: 0 20px;
    }

    .content {
      h2 {
        font-size: 18px;
      }

      .icon {
        margin: 30px 0 40px;
        img {
          width: 240px;
          height: auto;
        }
      }

      .actions {
        gap: 16px;

        .btn {
          min-width: 160px;
          height: 44px;
          font-size: 14px;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .submit-success {
    padding: 70px 0 0;

    .container {
      padding: 0 16px;
    }

    .content {
      h2 {
        font-size: 16px;
      }

      .icon {
        margin: 24px 0 30px;
        img {
          width: 100%;
          height: auto;
        }
      }

      .actions {
        flex-direction: column;
        gap: 12px;

        .btn {
          width: 100%;
          min-width: unset;
        }
      }
    }
  }
}
</style>
