<template>
  <div class="footer">
    <!-- Policy Links -->
    <div class="footer-policies">
      <span class="policy-item">{{ t('footer.policies.communityGuidelines') }}</span>
      <b></b>
      <span class="policy-item">{{ t('footer.policies.termsOfService') }}</span>
      <b></b>
      <span class="policy-item">{{ t('footer.policies.privacyPolicy') }}</span>
      <b></b>
      <span class="policy-item">{{ t('footer.policies.paidServices') }}</span>
    </div>

    <!-- Copyright -->
    <div class="footer-copyright">
      {{ t('footer.copyright') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

// Router
const router = useRouter();

// I18n
const { t } = useI18n();

const isLoggedIn = computed(() => {
  return localStorage.getItem('token') !== null;
});

const navigateTo = (path: string) => {
  if (!isLoggedIn.value) {
    router.push('/login');
    return;
  }

  if (path === '/user-home') {
    const uid = localStorage.getItem('uid') || '';
    router.push({ path: '/user-home', query: { id: uid } });
  } else {
    router.push(path);
  }
};
</script>

<style scoped>
.footer {
  position: fixed;
  left: 0;
  bottom: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 34px;
  padding: 0 40px;
  border-top: 1px solid rgba(22, 17, 34, 0.12);
  background: rgba(255, 255, 255, 0.96);
  z-index: 30;
}

.footer-policies {
  display: flex;
  align-items: center;
  gap: 36px;

  b{
    width: 3px;
    height: 3px;
    border-radius: 100%;
    background: #9a93a4;
  }
}

.policy-item {
  color: #9a93a4;
  font-size: 12px;
}

.footer-copyright {
  color: #9a93a4;
  font-size: 12px;
}
</style>