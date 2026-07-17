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
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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
  background: #FFFBF4;
}
.container {
  max-width: 1160px;
  margin: 0 auto;
  display: flex;
  gap: 18px;
  padding: 0 30px;
}
.main {
  flex: 1;
  padding-top: 100px;
}
.panel-title {
  margin-bottom: 24px;
  font-weight: 700;
  font-size: 20px;
  color: #161122;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.invite-link-section {
  margin-bottom: 24px;
}

.withdraw-banner {
  margin: 0 0 24px;
  padding: 28px 26px;
  background: radial-gradient(ellipse at 30% 15%, #FFE885, #FF9E45 58%, #FF5FA2);
  border: 3px solid #161122;
  border-radius: 18px;
  box-shadow: 5px 5px 0 rgba(22, 17, 34, 0.18);
  display: flex;
  align-items: center;
  justify-content: space-between;

  .banner-left {
    flex: 1;
    max-width: 720px;
    .banner-tip {
      font-size: 14px;
      color: #161122;
      line-height: 24px;
      word-break: break-word;

      :deep(a) {
        color: #161122;
        font-weight: 600;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .copy-link-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 136px;
    height: 48px;
    padding: 0 24px;
    background: #FF4D8D;
    border: 2.5px solid #161122;
    border-radius: 12px;
    box-shadow: 3px 3px 0 #161122;
    color: #FFFDF7;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;

    &:hover {
      color: #FFFDF7;
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 #161122;
    }

    &:active {
      transform: translate(1px, 1px);
      box-shadow: 1px 1px 0 #161122;
    }
  }
}

.metrics {
  display: flex;
  gap: 30px;
  margin: 0 0 24px;
}
.metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  height: 146px;
  border: 2.5px solid #161122;
  border-radius: 13px;
  box-shadow: 3px 3px 0 #161122;
  padding: 24px;
  background: #FFFDF7;
}

.metric-label {
  color: #161122;
  font-size: 14px;
  font-weight: 600;
}
.metric-value {
  margin-top: 16px;
  font-weight: 700;
  font-size: 32px;
  color: #161122;
}

.metrics-footer {
  display: flex;
  justify-content: flex-end;
  margin: 0 0 24px;
  font-size: 14px;
  font-weight: 600;
  color: #FF4D8D;
  cursor: pointer;
}

.block-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #161122;
}

.rules-content {
  font-size: 14px;
  color: #161122;
  line-height: 24px;
  background: #FFFDF7;
  border: 2.5px solid #161122;
  border-radius: 13px;
  box-shadow: 3px 3px 0 #161122;
  padding: 20px;
}

@media (max-width: 900px) {
  .container {
    flex-direction: column;
    padding: 80px 20px 24px;
  }
  .main {
    padding-top: 20px;
  }
  .withdraw-banner {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  .withdraw-banner .banner-left {
    max-width: 100%;
  }
  .metric {
    height: auto;
    padding: 20px;
  }
  .metric-value {
    font-size: 24px;
  }
}

@media (max-width: 420px) {
  .container {
    padding: 0 12px;
  }
  .metrics {
    flex-direction: column;
    gap: 12px;
  }
  .metric {
    padding: 16px;
  }
  .metric-value {
    font-size: 20px;
  }
  .copy-link-btn {
    width: 100%;
    min-width: auto;
  }
  .withdraw-banner {
    padding: 20px 16px;
  }
}
</style>