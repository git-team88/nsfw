<template>
  <footer class="footer">
    <!-- Navigation Links -->
    <div class="footer-nav">
      <router-link to="/" class="nav-item">{{ t('footer.nav.home') }}</router-link>
      <a href="#" class="nav-item" @click.prevent="navigateTo('/my-projects')">{{ t('footer.nav.myProjects') }}</a>
      <a href="#" class="nav-item" @click.prevent="navigateTo('/character-library')">{{ t('footer.nav.characterLibrary') }}</a>
      <a href="#" class="nav-item" @click.prevent="navigateTo('/user-home')">{{ t('footer.nav.myCommunity') }}</a>
      <a href="#" class="nav-item" @click.prevent="navigateTo('/user-personal')">{{ t('footer.nav.profile') }}</a>
    </div>

    <!-- Policy Links -->
    <div class="footer-policies">
      <router-link to="/community-convention" class="policy-item">{{ t('footer.policies.communityGuidelines') }}</router-link>
      <router-link to="/terms" class="policy-item">{{ t('footer.policies.termsOfService') }}</router-link>
      <router-link to="/privacy" class="policy-item">{{ t('footer.policies.privacyPolicy') }}</router-link>
      <router-link to="/payment-terms" class="policy-item">{{ t('footer.policies.paidServices') }}</router-link>
    </div>

    <!-- Copyright -->
    <div class="footer-copyright">
      {{ t('footer.copyright') }}
    </div>
  </footer>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 2.4rem 2.4rem;
  margin-top: 3rem;
  border-top: 1px solid rgba(251,100,182,0.1);
  background: rgba(255,255,255,0.8);
}

.footer-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3.8rem;
  width: 100%;
  height: 7rem;
  margin-bottom: 2.4rem;
  border-bottom: 1px solid rgba(251,100,182,0.1);
}

.nav-item {
  color: #6A7282;
  text-decoration: none;
  font-size: 1.4rem;
}

.footer-policies {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7.5rem;
  width: 100%;
  margin-bottom: 2.4rem;
  align-items: center;
}

.policy-item {
  color: #99A1AF;
  text-decoration: none;
  font-size: 1.2rem;
}

.footer-copyright {
  color: #99A1AF;
  font-size: 1.2rem;
}
</style>