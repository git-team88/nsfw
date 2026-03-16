<template>
  <div class="invite-revenue">
    <Header :cur="-1" @userInfoLoaded="handleUserInfoLoaded"></Header>

    <div class="container">
      <UserSidebar modelValue="inviteRevenue" />
      <div class="main">
        <div class="panel">
          <div class="panel-title">{{ t('user.inviteRevenue.title') }}</div>

          <div class="invite-link-section">
            <div class="withdraw-banner">
              <div class="banner-left">
                <div class="banner-tip" v-html="t('user.inviteRevenue.inviteText', { link: inviteLink, code: inviteCode })"></div>
              </div>
              <button class="copy-link-btn" @click="copyInviteLink">{{ t('user.inviteRevenue.copy') }}</button>
            </div>
          </div>

          <div class="metrics">
            <div class="metric">
              <div class="metric-label">{{ t('user.inviteRevenue.firstPurchaseStars') }}</div>
              <div class="metric-value">{{ firstPurchaseStars }}</div>
            </div>
            <div class="metric">
              <div class="metric-label">{{ t('user.inviteRevenue.totalRevenue') }}</div>
              <div class="metric-value">{{ totalRevenue }}</div>
            </div>
          </div>

          <div class="metrics-footer">
            <span @click="goToAiPointsDetails">{{ t('user.inviteRevenue.viewDetails') }}</span>
          </div>

          <div class="rules-section">
            <div class="block-title">{{ t('user.inviteRevenue.rulesTitle') }}</div>
            <div class="rules-content" v-html="t('user.inviteRevenue.rule')">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
import { redirectUrl } from "@/util/config";
import router from "@/router";
import api from "@/api/index";

const { t, locale } = useI18n();

const inviteCode = ref('');
const inviteLink = ref('');
const inviteText = ref('');

const firstPurchaseStars = ref('--');
const totalRevenue = ref('--');

function handleUserInfoLoaded(userData: any) {
  inviteCode.value = userData?.code || '';
  inviteLink.value = `${redirectUrl}/register?from=${inviteCode.value}`;
  inviteText.value = t('user.inviteRevenue.copyText', { link: inviteLink.value, code: inviteCode.value });
}

function fetchInviteInfo() {
  api.userInviteInfo().then((res: any) => {
    if (res.code == 0) {
      firstPurchaseStars.value = res.data?.user_num || res.data?.userNum || '--';
      totalRevenue.value = res.data?.credit.toString() || '--';
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
    }
  }).catch((error) => {
    console.error('Error fetching invite info:', error);
    toast(t('fail'));
  });
}

onMounted(() => {
  fetchInviteInfo();
});

const copyInviteLink = () => {
  navigator.clipboard.writeText(inviteText.value).then(() => {
    toast(t('user.inviteRevenue.copySuccess'));
  }).catch(() => {
    toast(t('fail'));
  });
};

function goToAiPointsDetails() {
  router.push('/ai-points-details?type=3')
}
</script>

<style scoped lang="scss">
.invite-revenue {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #ffffff;
}
.container {
  max-width: 139.2rem;
  margin: 0 auto;
  display: flex;
  gap: 2.4rem;
}
.main {
  flex: 1;
  margin-bottom: 2rem;
  padding: 12rem 0 0;
}
.panel {
  min-height: calc(100vh - 14rem);
  padding: 2.4rem 3.6rem 0;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 1.2rem;
}
.panel-title {
  font-weight: 500;
  font-size: 2rem;
  color: #101828;
  margin-bottom: 2.4rem;
}

.invite-link-section {
  margin-bottom: 2.4rem;
}

.withdraw-banner {
  margin: 0 0 2.4rem;
  padding: 1.6rem 1.8rem;
  background: rgba(251, 100, 182, 0.06);
  border-radius: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .banner-left {
    flex: 1;
    max-width: 72rem;
    .banner-tip {
      font-size: 1.4rem;
      color: #364153;
      line-height: 2.2rem;
      word-break: break-word;

      :deep(a){
        color: #FB64B6;

        &:hover{
          text-decoration: underline;
        }
      }
    }
  }

  .copy-link-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 13.6rem;
    height: 4.8rem;
    padding: 0 2.4rem;
    background: #FFFFFF;
    border: 1px solid #FB64B6;
    border-radius: 0.8rem;
    color: #FB64B6;
    font-weight: 500;
    font-size: 1.6rem;
    cursor: pointer;
  }
}

.metrics {
  display: flex;
  gap: 2rem;
  margin: 0 0 2.4rem;
}
.metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  height: 14.6rem;
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 0.8rem;
  padding: 2.4rem;
  background: #fff;
}

.metric-label {
  color: #99A1AF;
  font-size: 1.2rem;
}
.metric-value {
  margin-top: 1.6rem;
  font-weight: 500;
  font-size: 3.2rem;
  color: #fb64b6;

  .stats-unit {
    font-size: 1.4rem;
    color: #99A1AF;
  }
}

.metrics-footer {
  display: flex;
  justify-content: flex-end;
  margin: 0 0 2.4rem;
  font-size: 1.4rem;
  color: #FB64B6;
  cursor: pointer;
}

.block-title {
  margin-bottom: 1.8rem;
  font-size: 1.6rem;
  font-weight: 500;
}

.rules-content {
  font-size: 1.4rem;
  color: #6A7282;
  line-height: 2.4rem;
}
</style>