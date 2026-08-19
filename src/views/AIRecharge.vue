<template>
  <div class="ai-recharge">
    <Header ref="headerRef" :cur="-1"></Header>
    <div class="container">
      <div class="back" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
      </div>

      <div class="content-box">
        <h1 class="page-title">{{ t('aiRecharge.title') }}</h1>

        <div class="tab-box">
          <div class="tab-left">
            <div class="tab-group payment-tab-group">
              <div
                class="tab-item"
                :class="{ active: paymentTab === 'wallet' }"
                @click="switchPaymentTab('wallet')"
              >
                {{ t('aiRecharge.walletTab') }}
              </div>
              <div
                class="tab-item"
                :class="{ active: paymentTab === 'usdt' }"
                @click="switchPaymentTab('usdt')"
              >
                {{ t('aiRecharge.usdtTab') }}
              </div>
            </div>

            <div class="type-tab-list">
              <div
                class="type-tab-item"
                :class="{ active: activeTab === 'subscription' }"
                @click="switchTab('subscription')"
              >
                {{ t('aiRecharge.subscriptionTab') }}
              </div>
              <div
                class="type-tab-item"
                :class="{ active: activeTab === 'credits_pack' }"
                @click="switchTab('credits_pack')"
              >
                {{ t('aiRecharge.creditsPackTab') }}
              </div>
            </div>
          </div>

          <div class="rules-links">
            <span @click="goToComputingPowerRules">{{ t('aiRecharge.computingPowerRules') }} →</span>
            <span @click="goToPointsDetails">{{ t('aiRecharge.pointsDetails') }} →</span>
          </div>
        </div>

        <div class="recharge-plan-section">

          <div v-if="activeTab == 'subscription' && hasFirstMonthDiscount && rechargePlans.some(p => planHasDiscount(p))" class="first-month-off-banner">
            <span class="banner-highlight">{{ t('aiRecharge.firstMonth30OffPrefix') }}</span>{{ t('aiRecharge.firstMonth30OffSuffix') }}
          </div>

          <div v-if="activeTab == 'credits_pack'" class="credits-pack-tip">
            {{ t('aiRecharge.creditsPackTip') }}
          </div>

          <div v-if="isLoading && rechargePlans.length === 0" class="list-loading">
            <div class="list-loading-spinner"></div>
            <div class="list-loading-text">{{ t('loading') }}</div>
          </div>

          <div v-else-if="!isLoading && rechargePlans.length === 0" class="plan-empty-state">
            <img src="@/assets/images/base/no_data.png" alt="empty" />
            <p class="plan-empty-text">{{ t('common.noData') }}</p>
          </div>

          <div v-else class="plan-grid">
            <div
              v-for="(plan, index) in rechargePlans"
              :key="plan.plan_id"
              class="plan-card"
              :style="{ animationDelay: `${Math.min(index * 35, 300)}ms` }"
              @click="selectPlan(plan.plan_id)"
            >
              <div v-if="index == 0 && isUserNew && promotionTitle" class="zero-plan-badge">{{ promotionTitle }}</div>

              <img v-if="selectedPlan != plan.plan_id" class="plan-bg" src="@/assets/images/recharge/bg.png" alt="" />

              <div class="plan-card-inner" :class="{ active: selectedPlan == plan.plan_id, 'discount-card': activeTab == 'subscription' && hasFirstMonthDiscount && planHasDiscount(plan), 'credits-card': activeTab == 'credits_pack' }">
                <span class="plan-mode" v-if="!(paymentTab === 'usdt' && activeTab === 'subscription') && getPlanTitle(plan) !== t('aiRecharge.unknownPlan')">{{ getPlanTitle(plan) }}</span>

                <div v-if="activeTab == 'subscription' && hasFirstMonthDiscount && planHasDiscount(plan)" class="plan-price-section">
                  <div class="plan-discount-price">
                    <span class="price-num">{{ formatPrice(getFirstMonthPrice(plan)) }}</span>
                    <span class="price-unit">{{ priceUnit }}{{ getBillingPeriodText(plan.billing_period || '1') }}</span>
                  </div>
                  <div class="plan-original-price">{{ formatPrice(plan.price) }}{{ priceUnit }}</div>
                  <div class="plan-price-desc">
                    <span class="desc-highlight">{{ t('aiRecharge.firstMonth30Off') }}，</span><br>
                    <span class="desc-then">{{ t('aiRecharge.firstMonth30OffThenPrice', { price: formatPrice(plan.price), unit: priceUnit }) }}。</span>
                  </div>
                </div>

                <div v-else class="plan-price-section">
                  <div class="plan-price-value">
                    <span class="price-num">{{ formatPrice(plan.price) }}</span>
                    <span class="price-unit">{{ priceUnit }}{{ activeTab == 'credits_pack' ? '' : getBillingPeriodText(plan.billing_period || '1') }}</span>
                  </div>
                  <div v-if="activeTab === 'credits_pack' && plan.original_price" class="plan-strikethrough-price">
                    <span>{{ formatPrice(plan.original_price) }}{{ priceUnit }}</span>
                  </div>
                </div>

                <div class="plan-credits-box">
                  <div class="plan-credits-main">
                    <span class="credits-label">{{ t('aiRecharge.includes') }}</span>
                    <span class="credits-value">{{ formatCredits(plan.credits) }}</span>
                    <span class="credits-label"> {{ t('aiRecharge.compute') }}</span>
                  </div>
                  <div class="plan-credits-bonus" v-if="plan.bonus_credits && plan.bonus_credits !== '0' && activeTab === 'subscription'">
                    <span class="bonus-includes">{{ t('aiRecharge.bonusGift') }}</span>
                    <span class="bonus-value">{{ formatCredits(plan.bonus_credits) }} {{ t('aiRecharge.compute') }}</span>
                  </div>
                  <div class="plan-credits-valid" v-if="activeTab === 'credits_pack'">{{ t('aiRecharge.permanentValid') }}</div>
                  <div class="plan-credits-valid" v-else-if="paymentTab === 'usdt' && plan.valid_days">{{ t('aiRecharge.validityPeriod', { months: Math.ceil(Number(plan.valid_days) / 30) }) }}</div>
                  <div class="plan-credits-valid" v-else>{{ getValidityText(plan.expiry_months) }}</div>
                </div>

                <div v-if="activeTab == 'subscription'" class="plan-estimated-output">
                  <div class="estimated-title">{{ t('aiRecharge.estimatedOutput') }}</div>
                  <div class="estimated-list">
                    <div class="estimated-item" v-if="plan.estimated_novel_chapters !== '0'">{{ t('aiRecharge.novelLabel') }}<span class="estimated-num">{{ plan.estimated_novel_chapters }}</span>{{ t('aiRecharge.novelUnit') }}</div>
                    <div class="estimated-item estimated-empty" v-else>--</div>
                    <div class="estimated-item" v-if="plan.estimated_comic_episodes !== '0'">{{ t('aiRecharge.comicLabel') }}<span class="estimated-num">{{ plan.estimated_comic_episodes }}</span>{{ t('aiRecharge.comicUnit') }}</div>
                    <div class="estimated-item estimated-empty" v-else>--</div>
                    <div class="estimated-item" v-if="plan.estimated_short_drama_episodes !== '0'">{{ t('aiRecharge.mangaLabel') }}<span class="estimated-num">{{ plan.estimated_short_drama_episodes }}</span>{{ t('aiRecharge.mangaUnit') }}</div>
                    <div class="estimated-item estimated-empty" v-else>--</div>
                    <div class="estimated-item" v-if="plan.estimated_images !== '0'">{{ t('aiRecharge.imageLabel') }}<span class="estimated-num">{{ plan.estimated_images }}</span>{{ t('aiRecharge.imageUnitSuffix') }}</div>
                    <div class="estimated-item estimated-empty" v-else>--</div>
                    <div class="estimated-item" v-if="plan.estimated_video !== '0'">{{ t('aiRecharge.videoLabel') }}<span class="estimated-num">{{ plan.estimated_video }}</span>{{ t('aiRecharge.videoUnitSuffix') }}</div>
                    <div class="estimated-item estimated-empty" v-else>--</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isUserNew && promotionContent" class="zero-plan-rules">
          <img src="@/assets/images/home/arrow.png" alt="" />
          <div class="rules-content" v-html="promotionContent"></div>
        </div>

        <div v-if="rechargePlans.length > 0" class="bottom-bar">
          <div class="bottom-block">
            <div class="block-label">{{ t('aiRecharge.originalPrice') }}</div>
            <div class="block-value"><span class="price-num">{{ formatPrice(planOriginalPrice.toString()) }}</span><span class="price-unit">{{ priceYen }}</span></div>
          </div>

          <div v-if="activeTab !== 'subscription' || !(hasFirstMonthDiscount && currentPlanHasDiscount)" v-show="paymentTab !== 'usdt'" class="bottom-bar-divider"></div>

          <div v-if="(activeTab !== 'subscription' || !(hasFirstMonthDiscount && currentPlanHasDiscount)) && paymentTab !== 'usdt'" class="bottom-block">
            <div class="block-label">
              {{ t('aiRecharge.coupon') }}
              <div class="coupon-info-icon">
                <img src="@/assets/images/user/notice.png" alt="Info" />
                <div class="coupon-tooltip">
                  {{ t('aiRecharge.couponInfo') }}
                </div>
              </div>
            </div>
            <div class="block-value" v-if="couponCode">
              <button class="cancel-coupon-btn" @click="cancelCoupon">{{ t('aiRecharge.cancelCoupon') }}</button>
              <span class="discount-amount">-<span class="price-num">{{ formatPrice(discountAmount.toString()) }}</span><span class="price-unit">{{ priceYen }}</span></span>
            </div>
            <div class="block-value" v-else>
              <span class="coupon-link" @click="goToCoupon">{{ t('aiRecharge.addCoupon') }}></span>
            </div>
          </div>

          <div class="bottom-bar-divider"></div>

          <div class="bottom-block">
            <div class="block-label">{{ t('aiRecharge.actualAmount') }}</div>
            <div class="block-value total-value"><span class="price-num">{{ formatPrice(discountedPrice.toString()) }}</span><span class="price-unit">{{ priceYen }}</span></div>
          </div>

          <div class="bottom-bar-divider"></div>

          <div class="bottom-block bottom-block-btn">
            <div class="agreements">
              <div class="check-item">
                <div class="checkbox" @click="agreeTerms = !agreeTerms">
                  <img v-if="agreeTerms" src="@/assets/images/register/check_active.png" alt="" />
                  <img v-else src="@/assets/images/register/check.png" alt="" />
                </div>
                <span>
                  {{ t("subscribe.agree") }}
                  <a>{{ t("subscribe.paymentTerms") }}</a>
                </span>
              </div>
            </div>
            <button class="pay-btn" :disabled="isPaying" :class="{ loading: isPaying }" @click="handleRecharge">
              <span>{{ t('aiRecharge.subscribeNow') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <UploadMask :visible="isPaying" :text="t('loading')" />

    <CouponModal
      :visible="showCouponModal"
      @close="handleCouponClose"
      @confirm="handleCouponConfirm"
    />

    <WalletSelectModal
      :visible="showWalletModal"
      @close="showWalletModal = false"
      @select="handleWalletSelect"
    />
  </div>
</template>

<script setup lang="ts" name="AIRecharge">
import Header from "@/components/Header.vue";
import UploadMask from "@/components/UploadMask.vue";
import CouponModal from "@/components/CouponModal.vue";
import WalletSelectModal from "@/components/WalletSelectModal.vue";
import { ref, watch, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import api from "@/api/index";
import { toast } from "@/util/toast";
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import erc20Abi from "@/util/abi/erc20Abi.json";
import { USDT_CONTRACT_ADDRESS, BSC_TESTNET_CHAIN_ID, SUBSCRIPTION_RECEIVER_ADDRESS } from "@/util/config";
import { connectWalletConnect, getWalletConnectProvider } from "@/util/walletconnect";

const { t, locale } = useI18n();
const router = useRouter();
const headerRef = ref<InstanceType<typeof Header> | null>(null);

interface RechargePlan {
  plan_id: number | string;
  info: Array<{
    language: string;
    name: string;
    promotion_title?: string;
    promotion_content?: string;
  }>;
  price: string;
  period: string;
  credits: string;
  expiry_months?: number;
  valid_days?: string;
  billing_period?: string;
  bonus_credits?: string;
  discount_desc?: any[];
  discount_price?: string;
  original_price?: string;
  estimated_novel_chapters?: string;
  estimated_comic_episodes?: string;
  estimated_short_drama_episodes?: string;
  estimated_images?: string;
  estimated_video?: string;
}

const rechargePlans = ref<RechargePlan[]>([]);
const selectedPlan = ref<number | string>(0);
const agreeTerms = ref(true);
const isLoading = ref(true);
const isPaying = ref(false);
const showCouponModal = ref(false);
const couponCode = ref('');
const couponInfo = ref<{ code: string; type: string; discount_value: string; } | null>(null);
const isUserNew = ref(false);
const promotionTitle = ref('');
const promotionContent = ref('');
const activeTab = ref('subscription');
const paymentTab = ref('wallet');
const hasFirstMonthDiscount = ref(false);
const showWalletModal = ref(false);

const tabModeMap: Record<string, string> = {
  subscription: 'subscription',
  credits_pack: 'payment',
};

const currentPlanHasDiscount = computed(() => {
  const plan = rechargePlans.value.find(p => p.plan_id === selectedPlan.value);
  if (!plan) return false;
  return planHasDiscount(plan);
});

const priceUnit = computed(() => paymentTab.value === 'usdt' ? 'USDT' : t('aiRecharge.unit'));
const priceYen = computed(() => paymentTab.value === 'usdt' ? 'USDT' : t('aiRecharge.yen'));

const planOriginalPrice = computed(() => {
  const plan = rechargePlans.value.find(p => p.plan_id === selectedPlan.value);
  if (!plan) return 0;
  return parseFloat(plan.price);
});

const originalPrice = computed(() => {
  const plan = rechargePlans.value.find(p => p.plan_id === selectedPlan.value);
  if (!plan) return 0;
  if (activeTab.value == 'subscription' && hasFirstMonthDiscount.value && planHasDiscount(plan)) {
    return getFirstMonthPrice(plan);
  }
  return parseFloat(plan.price);
});

const discountAmount = computed(() => {
  const price = originalPrice.value;
  if (!couponInfo.value) return 0;

  const { type, discount_value } = couponInfo.value;
  const discountValue = parseInt(discount_value);

  if (type == '1') {
    return discountValue;
  } else if (type == '2') {
    return Math.round(price * (1 - discountValue / 100));
  }

  return 0;
});

const discountedPrice = computed(() => {
  const price = originalPrice.value;
  return Math.max(0, price - discountAmount.value);
});

const currentBillingPeriod = computed(() => {
  if (activeTab.value !== 'subscription') return '';
  const plan = rechargePlans.value.find(p => p.plan_id === selectedPlan.value);
  if (!plan) return '';
  return getBillingPeriodText(plan.billing_period || '1');
});

watch(locale, (newLang) => {
  if (isUserNew.value && rechargePlans.value.length > 0) {
    const firstPlan = rechargePlans.value[0];
    if (firstPlan.info && Array.isArray(firstPlan.info)) {
      const currentLang = newLang == 'zh' ? 'cn' : newLang;

      const infoItem = firstPlan.info.find((item: any) => item.language == currentLang);
      if (infoItem) {
        promotionTitle.value = infoItem.promotion_title || '';
        promotionContent.value = infoItem.promotion_content || '';
      }
    }
  }
});

onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/');
    return false;
  }

  await checkFirstMonthDiscount();
  getList();
});

async function checkFirstMonthDiscount() {
  try {
    const res = await api.getFirstMonthDiscountStatus() as any;
    if (res.code == 0) {
      const isFirstMonth = res.data?.is_first_month;
      hasFirstMonthDiscount.value = isFirstMonth == 1;
      if (isFirstMonth == 0) {
        await checkRechargeUser();
      }
    }
  } catch (error) {
    console.error('Error checking first month discount:', error);
  }
}

async function checkRechargeUser() {
  try {
    const response = await api.checkRechargeUser({});
    const res = response.data;

    let userData = null;
    if (res.code !== undefined) {
      if (res.code == 0) {
        userData = res.data;
      }
    } else {
      userData = res;
    }

    if (userData) {
      isUserNew.value = userData.is_user_new || false;
    }
  } catch (error) {
    console.error('Error checking recharge user:', error);
  }
}

function getList() {
  isLoading.value = true;
  const mode = tabModeMap[activeTab.value] || activeTab.value;
  const requestApi = paymentTab.value === 'usdt' ? api.getAIUPlanListPublic : api.aIRechargePlan;
  requestApi(mode).then((res: any) => {
    if (res.code == 0) {
      if (res.data) {
        const planList = paymentTab.value === 'usdt' ? res.data.list : res.data;
        if (Array.isArray(planList)) {
          rechargePlans.value = planList.map((plan: any) => {
            return {
              plan_id: plan.plan_id || plan.id || Math.random(),
              info: plan.info || [],
              price: plan.price || '0',
              period: plan.period || '',
              credits: plan.credits || '0',
              expiry_months: plan.expiry_months,
              valid_days: plan.valid_days,
              billing_period: plan.billing_period,
              bonus_credits: plan.bonus_credits,
              discount_desc: plan.discount_desc || [],
              discount_price: plan.discount_price || '0',
              original_price: plan.original_price || '',
              estimated_novel_chapters: plan.estimated_novel_chapters || '0',
              estimated_comic_episodes: plan.estimated_comic_episodes || '0',
              estimated_short_drama_episodes: plan.estimated_short_drama_episodes || '0',
              estimated_images: plan.estimated_images || '0',
              estimated_video: plan.estimated_video || '0'
            };
          });
          if (rechargePlans.value.length > 0) {
            selectedPlan.value = rechargePlans.value[0].plan_id;

            if (isUserNew.value) {
              const firstPlan = rechargePlans.value[0];
              if (firstPlan.info && Array.isArray(firstPlan.info)) {
                const currentLang = locale.value == 'zh' ? 'cn' : locale.value;
                const infoItem = firstPlan.info.find((item: any) => item.language == currentLang);
                if (infoItem) {
                  promotionTitle.value = infoItem.promotion_title || '';
                  promotionContent.value = infoItem.promotion_content || '';
                }
              }
            }
          }
        }
      }
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
    }
  }).catch((error) => {
    console.error('Error fetching recharge plans:', error);
    toast(t('error'));
  }).finally(() => {
    isLoading.value = false;
  });
}

function switchTab(tab: string) {
  activeTab.value = tab;
  selectedPlan.value = 0;
  couponCode.value = '';
  couponInfo.value = null;
  rechargePlans.value = [];
  getList();
}

function switchPaymentTab(tab: string) {
  if (paymentTab.value === tab) return;
  paymentTab.value = tab;
  activeTab.value = 'subscription';
  selectedPlan.value = 0;
  couponCode.value = '';
  couponInfo.value = null;
  rechargePlans.value = [];
  getList();
}

function selectPlan(planId: number | string) {
  selectedPlan.value = planId;
  if (couponCode.value) {
    couponCode.value = '';
    couponInfo.value = null;
  }
}

function planHasDiscount(plan: RechargePlan): boolean {
  if (plan.discount_price && parseInt(plan.discount_price) > 0) return true;
  if (plan.discount_desc && plan.discount_desc.length > 0 && plan.discount_desc[0] > 0) return true;
  return false;
}

function getFirstMonthPrice(plan: RechargePlan): number {
  if (plan.discount_price) {
    return parseInt(plan.discount_price) || 0;
  }
  const price = parseFloat(plan.price);
  const discount = (plan.discount_desc && plan.discount_desc[0]) || 0;
  return Math.round(price * (1 - discount / 100));
}

function formatCredits(credits: string | undefined): string {
  if (!credits) return '0';
  const num = parseInt(credits);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

async function handleRecharge() {
  if (!agreeTerms.value) {
    toast(t('subscribe.agreeFirst'));
    return;
  }

  if (paymentTab.value === 'usdt') {
    if (!selectedPlan.value) {
      return;
    }
    showWalletModal.value = true;
    return;
  }

  isPaying.value = true;
  try {
    if (!selectedPlan.value) {
      return false;
    }

    const params: any = {
      plan_id: selectedPlan.value,
      promo_code: couponCode.value
    };

    const response = await api.AIRecharge(params);

    const data = response as any;
    if (data.code == 0 || data.code == 200) {
      if (data.data) {
        window.location.href = data.data?.url.url;
      }
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
    }
  } catch (error) {
    toast(t('error'));
  } finally {
    isPaying.value = false;
  }
}

async function handleWalletSelect(wallet: { id: string; name: string }) {
  showWalletModal.value = false;

  let walletProvider: any;
  let account: string;

  if (wallet.id === 'walletconnect') {
    try {
      const accounts = await connectWalletConnect();
      if (!accounts || accounts.length === 0) {
        return;
      }
      walletProvider = getWalletConnectProvider();
      account = accounts[0];
    } catch (error) {
      return;
    }
  } else {
    walletProvider = getWalletProvider(wallet.id);
    if (!walletProvider) {
      toast(t('error'));
      return;
    }

    isPaying.value = true;
    try {
      await switchChain(walletProvider);

      const accounts = await walletProvider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        toast(t('error'));
        isPaying.value = false;
        return;
      }
      account = accounts[0];
    } catch (error) {
      console.error('Wallet connect error:', error);
      toast(t('error'));
      isPaying.value = false;
      return;
    }
  }

  isPaying.value = true;
  try {
    const res = await api.generateUAIOrder({ plan_id: selectedPlan.value, address: account });
    const data = res as any;
    if (data.code === 0 || data.code === 200) {
      const orderId = data.data?.order_id || '';
      const plan = rechargePlans.value.find(p => p.plan_id === selectedPlan.value);
      const usdtAmount = plan?.price || '';
      if (usdtAmount && parseFloat(usdtAmount) > 0) {
        const txHash = await transferUSDT(walletProvider, account, usdtAmount);
        if (txHash && orderId) {
          await api.webThreeCallbackUPaid({ order_id: orderId, tx_hash: txHash }).catch(() => {});
          router.push('/aitool-payment-success');
          return;
        } else {
          router.push('/aitool-payment-fail');
          return;
        }
      }
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : locale.value == 'jp' ? data.msg_jp : data.msg);
    }
  } catch (error) {
    console.error('Wallet pay error:', error);
    toast(t('error'));
    router.push('/aitool-payment-fail');
  } finally {
    isPaying.value = false;
  }
}

async function transferUSDT(provider: any, fromAddress: string, amount: string): Promise<string | null> {
  try {
    const web3 = new Web3(provider);
    const tokenContract = new web3.eth.Contract(erc20Abi as any, USDT_CONTRACT_ADDRESS);

    const decimals: number = await tokenContract.methods.decimals().call();

    // 余额检查
    const balance: string = await tokenContract.methods.balanceOf(fromAddress).call();
    const needAmount = new BigNumber(amount).times(new BigNumber(10).pow(decimals));
    if (new BigNumber(balance).isLessThan(needAmount)) {
      toast(t('subscribe.insufficientUsdtBalance'));
      return null;
    }

    // 使用 Web3.js Contract 发起 transfer，与 MetaMask 兼容性最好
    const receipt: any = await tokenContract.methods
      .transfer(SUBSCRIPTION_RECEIVER_ADDRESS, needAmount.toFixed())
      .send({ from: fromAddress });

    const txHash = receipt?.transactionHash || receipt?.status?.transactionHash || null;
    if (txHash) {
      toast(t('success'));
      return txHash;
    } else {
      toast(t('error'));
      return null;
    }
  } catch (error: any) {
    console.error('USDT transfer error:', error);
    const errMsg = error?.data?.message || error?.message || '';
    if (errMsg.toLowerCase().includes('insufficient')) {
      toast(t('subscribe.insufficientUsdtOrGas'));
    } else if (errMsg) {
      toast(errMsg);
    } else {
      toast(t('error'));
    }
    return null;
  }
}

function getWalletProvider(walletId: string): any {
  const w = window as any;
  switch (walletId) {
    case 'metamask':
      return w.ethereum || null;
    case 'okx':
      return w.okxwallet || null;
    case 'phantom':
      return w.phantom?.ethereum || null;
    default:
      return null;
  }
}

async function switchChain(provider: any) {
  const chainId = await provider.request({ method: 'eth_chainId' });
  if (chainId !== BSC_TESTNET_CHAIN_ID) {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BSC_TESTNET_CHAIN_ID }],
    });
  }
}

function goToPointsDetails() {
  router.push('/ai-points-details');
}

function goBack() {
  router.back();
}

function getPlanTitle(plan: any) {
  if (plan.info && Array.isArray(plan.info)) {
    const currentLang = locale.value || 'zh';
    const infoItem = plan.info.find((item: any) => item.language === currentLang);
    if (infoItem && infoItem.name) {
      return infoItem.name;
    } else if (plan.info.length > 0) {
      return plan.info[0].name || t('aiRecharge.unknownPlan');
    }
  }
  return t('aiRecharge.unknownPlan');
}

function getBillingPeriodText(billingPeriod: String) {
  switch (billingPeriod) {
    case '1':
      return t('aiRecharge.periodMonth');
    case '3':
      return t('aiRecharge.period3Month');
    case '6':
      return t('aiRecharge.period6Month');
    case '12':
      return t('aiRecharge.periodYear');
    default:
      return t('aiRecharge.periodMonth');
  }
}

function getValidityText(expiryMonths: number | undefined) {
  if (expiryMonths) {
    return t('aiRecharge.validityPeriod', { months: expiryMonths });
  }
  return t('aiRecharge.permanentValid');
}

function formatPrice(price: string | number): string {
  const cleanPrice = String(price).replace(/[^0-9.]/g, '');
  const parts = cleanPrice.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function openLink() {
  localStorage.setItem("isBack", "1");
  window.open("/payment-terms", "_blank");
}

function goToComputingPowerRules() {
  localStorage.setItem("isBack", "1");
  window.open("/computing-rules", "_blank");
}

function goToCoupon() {
  showCouponModal.value = true;
}

function handleCouponClose() {
  showCouponModal.value = false;
}

function handleCouponConfirm(info: any) {
  couponCode.value = info.code;
  couponInfo.value = info;
  showCouponModal.value = false;
}

function cancelCoupon() {
  couponCode.value = '';
  couponInfo.value = null;
}
</script>

<style lang="scss" scoped>
$ink: #161122;
$paper: #FFFDF7;
$cream: #FFFBF4;
$pink: #FF4D8D;
$muted: #9a93a4;
$sub: #5b5566;
$line: #e7e1d8;
$yellow: #FFD23F;
$green: #22A06B;

.ai-recharge {
  width: 100%;
  background: $cream;
}

.container {
  max-width: 1160px;
  margin: 140px auto 20px;
  padding: 0 30px;
  position: relative;

  .back {
    position: absolute;
    top: -52px;
    left: 30px;
    width: auto;
    height: 40px;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #161122;
    cursor: pointer;
    z-index: 10;
    border: 2.5px solid #161122;
    border-radius: 13px;
    background: #FFFDF7;
    box-shadow: 3px 3px 0 #161122;
    padding: 0 10px;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    .back-text {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 4px 4px 0 #161122;
    }
  }
}

.content-box {
  .page-title {
    position: relative;
    font-size: 20px;
    font-weight: 800;
    color: $ink;
    margin-bottom: 20px;
    letter-spacing: 0.01em;
    text-align: center;
  }

  .tab-box {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;

    .tab-left {
      display: flex;
      align-items: center;
      gap: 30px;
    }

    .tab-group {
      display: flex;
      border: 2.5px solid $ink;
      border-radius: 14px;
      padding: 5px;
    }

    .tab-item {
      display: flex;
      align-items: center;
      height: 36px;
      font-size: 14px;
      font-weight: 800;
      color: $ink;
      cursor: pointer;
      padding: 0 20px;
      border-radius: 10px;
      transition: background-color 0.16s, color 0.16s;
      background: transparent;

      &.active {
        background: $ink;
        color: #fff;
      }

      &:hover:not(.active) {
        background: $paper;
      }
    }

    .type-tab-list {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .type-tab-item {
      display: flex;
      align-items: center;
      height: 36px;
      font-size: 14px;
      font-weight: 800;
      color: $ink;
      cursor: pointer;
      padding: 0 20px;
      border-radius: 10px;
      border: 2.5px solid $ink;
      transition: background-color 0.16s, color 0.16s;
      background: transparent;

      &.active {
        background: $ink;
        color: #fff;
      }

      &:hover:not(.active) {
        background: $paper;
      }
    }

    .rules-links {
      display: flex;
      align-items: center;
      gap: 10px;

      span {
        font-weight: 700;
        font-size: 13px;
        color: $muted;
        cursor: pointer;
        transition: color 0.16s;

        &:hover {
          color: $pink;
        }
      }
    }
  }

  .first-month-off-banner {
    font-size: 16px;
    color: $ink;
    margin: 10px 0 0;
    text-align: center;
    font-weight: 700;

    .banner-highlight {
      font-weight: 800;
      color: $pink;
    }
  }

  .credits-pack-tip {
    font-size: 14px;
    color: $muted;
    font-weight: 600;
    margin-top: 10px;
    text-align: center;
  }

  .list-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;

    .list-loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid $line;
      border-top: 4px solid $ink;
      border-radius: 50%;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 16px;
    }

    .list-loading-text {
      font-size: 14px;
      color: $muted;
      font-weight: 600;
    }
  }

  .plan-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10rem 2rem 0;

    img {
      width: 12rem;
      height: 12rem;
      margin-bottom: 2rem;
      opacity: 0.6;
    }

    .plan-empty-text {
      font-size: 1.4rem;
      color: #99A1AF;
      font-weight: 300;
    }
  }

  .recharge-plan-section {
    margin: 0 0 30px;

    .plan-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 24px;

      @media (max-width: 720px) {
        grid-template-columns: 1fr;
      }

      .plan-card {
        position: relative;
        animation: projCardIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;

        .plan-bg {
          position: absolute;
          right: 0;
          top: 0;
          width: 120px;
          pointer-events: none;
          z-index: 10;
        }

        .plan-card-inner {
          position: relative;
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
          border: 3px solid $ink;
          border-radius: 16px;
          box-shadow: 4px 4px 0 rgba(22,17,34,0.14);
          font-size: 14px;
          color: $muted;
          cursor: pointer;
          padding: 24px 20px;
          z-index: 5;
          overflow: hidden;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;

          &:hover {
            transform: translateY(-5px);
            box-shadow: 7px 9px 0 rgba(22,17,34,0.18);
          }

          &.discount-card {
            background: #FFF3D6;
          }

          &.credits-card {
            height: auto;
          }

          &.active {
            background: #FFF3D6;
            border-color: $ink;
            box-shadow: 4px 4px 0 $ink;

            &:hover {
              box-shadow: 7px 9px 0 $ink;
            }

            .plan-credits-box {
              background: rgba(255,77,141,0.12);
            }
          }

          .plan-mode {
            font-size: 14px;
            font-weight: 800;
            color: $muted;
            margin-bottom: 20px;
            text-align: left;
          }

          .plan-price-section {
            margin-bottom: 12px;

            .plan-discount-price {
              display: flex;
              align-items: baseline;
              margin-bottom: 4px;

              .price-num {
                font-size: 28px;
                font-weight: 800;
                color: $ink;
              }

              .price-unit {
                font-size: 15px;
                color: $sub;
                margin-left: 4px;
              }
            }

            .plan-original-price {
              font-size: 12px;
              color: $muted;
              text-decoration: line-through;
              margin-bottom: 10px;
            }

            .plan-price-desc {
              font-size: 12px;
              line-height: 16px;

              .desc-highlight {
                color: $pink;
                font-weight: 800;
              }

              .desc-then {
                color: $muted;
                font-weight: 600;
              }
            }

            .plan-price-value {
              display: flex;
              align-items: baseline;

              .price-num {
                font-size: 28px;
                font-weight: 800;
                color: $ink;
              }

              .price-unit {
                font-size: 15px;
                color: $sub;
                margin-left: 4px;
              }
            }

            .plan-strikethrough-price {
              font-size: 14px;
              color: $muted;
              text-decoration: line-through;
              margin-top: 4px;
            }
          }

          .plan-credits-box {
            width: 100%;
            background: #F7F7F8;
            border-radius: 12px;
            padding: 12px;
            display: flex;
            flex-direction: column;

            .plan-credits-main {
              font-size: 14px;
              color: $sub;
              margin-bottom: 6px;

              .credits-value {
                margin: 0 4px;
                color: $ink;
                font-weight: 800;
              }
            }

            .plan-credits-bonus {
              font-size: 14px;
              color: $sub;
              margin-bottom: 6px;

              .bonus-includes {
                margin-right: 4px;
                color: $pink;
                font-weight: 800;
              }

              .bonus-value {
                color: $sub;
              }
            }

            .plan-credits-valid {
              font-size: 14px;
              color: $sub;
            }
          }

          .plan-estimated-output {
            margin-top: 16px;

            .estimated-title {
              font-size: 14px;
              font-weight: 800;
              color: $ink;
              margin-bottom: 8px;
            }

            .estimated-list {
              .estimated-item {
                font-size: 14px;
                line-height: 20px;
                color: $muted;
                margin-bottom: 6px;

                &:last-child {
                  margin-bottom: 0;
                }

                .estimated-num {
                  margin: 0 2px;
                  color: $pink;
                  font-weight: 800;
                }
              }
            }
          }
        }

        .zero-plan-badge {
          position: absolute;
          top: -26px;
          left: 0;
          right: 0;
          height: 40px;
          border-radius: 12px 12px 0 0;
          background: $pink;
          color: #ffffff;
          font-weight: 800;
          font-size: 12px;
          padding-top: 6px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          border: 2px solid $ink;
          box-shadow: 2px 2px 0 $ink;
          animation: chChip 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.5s backwards;
        }
      }
    }
  }

  .bottom-bar {
    display: flex;
    align-items: stretch;
    margin-top: 30px;
    background: $paper;
    border: 3px solid $ink;
    border-radius: 24px;
    box-shadow: 6px 6px 0 rgba(22,17,34,0.14);
    padding: 24px 0;
    animation: chPanelIn 0.6s cubic-bezier(0.16,1,0.3,1) both;

    @media (max-width: 720px) {
      flex-direction: column;
      padding: 20px;
      border-radius: 16px;
    }

    .bottom-block {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      padding: 0 20px;

      @media (max-width: 720px) {
        padding: 10px 0;
        align-items: center;
      }

      &.bottom-block-btn {
        align-items: center;
      }

      .block-label {
        font-size: 14px;
        font-weight: 800;
        color: $ink;
        margin-bottom: 20px;
        display: flex;
        align-items: center;

        @media (max-width: 720px) {
          margin-bottom: 10px;
        }

        .coupon-info-icon {
          position: relative;
          margin-left: 6px;
          cursor: pointer;

          img {
            width: 16px;
            height: 16px;
          }

          .coupon-tooltip {
            display: none;
            position: absolute;
            left: 20px;
            top: -10px;
            max-width: 280px;
            width: max-content;
            padding: 10px 16px;
            background: #FFFFFF;
            border: 2px solid $ink;
            box-shadow: 3px 3px 0 $ink;
            color: $muted;
            font-size: 12px;
            font-weight: 600;
            border-radius: 10px;
            z-index: 100;
          }

          &:hover .coupon-tooltip {
            display: block;
          }
        }
      }

      .block-value {
        display: flex;
        align-items: baseline;
        gap: 4px;

        .price-num {
          font-size: 20px;
          font-weight: 800;
          color: $ink;
        }

        .price-unit {
          font-size: 15px;
          color: $sub;
        }

        &.total-value {
          .price-num {
            font-size: 24px;
            color: $pink;
          }
        }
      }

      .coupon-link {
        color: $pink;
        font-weight: 800;
        font-size: 14px;
        cursor: pointer;
        text-decoration: underline;
        text-underline-offset: 2px;
      }

      .discount-amount {
        font-size: 14px;
        color: $ink;
        font-weight: 800;
      }

      .cancel-coupon-btn {
        min-width: 80px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 800;
        color: $muted;
        border: 2px solid $line;
        background: none;
        cursor: pointer;
        padding: 4px 10px;
        border-radius: 10px;
        transition: background-color 0.2s;

        &:hover {
          background-color: $line;
        }
      }

      &.bottom-block-btn {
        .agreements {
          margin-bottom: 20px;
        }
      }
    }

    .bottom-bar-divider {
      width: 1px;
      background: $line;
      align-self: stretch;

      @media (max-width: 720px) {
        width: 100%;
        height: 1px;
      }
    }
  }

  .agreements {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    .check-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 700;
      color: $muted;
      cursor: pointer;

      .checkbox {
        width: 22px;
        height: 22px;
        border: 2.5px solid $ink;
        border-radius: 7px;
        background: #fff;
        position: relative;
        display: inline-block;
        cursor: pointer;
        transition: background 0.16s;

        img {
          width: 100%;
          height: 100%;
        }
      }

      .checkbox.on {
        background: $pink;
        animation: chCheckBounce 0.38s cubic-bezier(0.34,1.56,0.64,1);

        &::after {
          content: '';
          position: absolute;
          left: 6px;
          top: 2px;
          width: 6px;
          height: 11px;
          border: solid #fff;
          border-width: 0 3px 3px 0;
          transform: rotate(45deg);
        }
      }

      a {
        color: $pink;
        text-decoration: underline;
        text-underline-offset: 2px;
        cursor: pointer;
      }
    }
  }

  .pay-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 200px;
    height: 44px;
    background: linear-gradient(135deg, $pink, #FF7A45);
    color: #ffffff;
    border: 2.5px solid $ink;
    border-radius: 13px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 3px 3px 0 $ink;
    transition: transform 0.16s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.16s;

    &:hover {
      transform: translate(-2px, -2px);
      box-shadow: 5px 5px 0 $ink;
    }

    &:active {
      transform: translate(0, 0);
      box-shadow: 2px 2px 0 $ink;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;

      &:hover {
        transform: none;
        box-shadow: 3px 3px 0 $ink;
      }
    }

    &.loading {
      span::before {
        content: '';
        display: inline-block;
        width: 16px;
        height: 16px;
        margin-right: 8px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #ffffff;
        animation: spin 1s ease-in-out infinite;
      }
    }

    span {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .zero-plan-rules {
    position: relative;
    border: 2px solid rgba(255,77,141,0.1);
    background: rgba(255,77,141,0.06);
    border-radius: 12px;
    padding: 10px;

    img {
      position: absolute;
      top: calc(-12px - 1px);
      left: 86px;
      width: 31px;
      height: 12px;
      z-index: 10;
    }

    .rules-content {
      font-size: 12px;
      color: $muted;
      font-weight: 600;
      line-height: 24px;
      white-space: pre-line;
      position: relative;

      &::before {
        content: '';
        display: inline-block;
        width: 18px;
        height: 14px;
      }

      &::first-line {
        font-size: 14px;
        color: $sub;
        font-weight: 800;
      }
    }
  }
}

@keyframes chPanelIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
}

@keyframes projCardIn {
  from { opacity: 0; transform: translateY(18px) scale(0.95); }
  to { opacity: 1; transform: none; }
}

@keyframes chChip {
  from { opacity: 0; transform: scale(0.4) rotate(-12deg); }
  to { opacity: 1; transform: none; }
}

@keyframes chCheckBounce {
  0% { transform: scale(1); }
  45% { transform: scale(1.22); }
  70% { transform: scale(0.92); }
  100% { transform: scale(1); }
}

@keyframes chUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .plan-card-inner,
  .bottom-bar,
  .zero-plan-badge {
    animation: none !important;
  }
  .plan-card-inner:hover,
  .pay-btn:hover {
    transform: none;
  }
  .plan-list-enter-active {
    transition: none !important;
  }
}
</style>
