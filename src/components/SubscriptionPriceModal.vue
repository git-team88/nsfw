<template>
  <div v-if="visible" class="sub-price-overlay">
    <div class="sub-price-modal">
      <button class="close-btn" @click="onCancel"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="modal-title">{{ t("user.subscription.title") }}</div>

      <div class="modal-body">
        <div class="section">
          <div class="label">
            <span><b class="required">*</b>{{ t("user.subscription.priceLabel") }}</span>
            <span class="info">{{ t("user.subscription.priceLimit") }}</span>
          </div>
          <div class="price-options">
            <div
              class="price-option"
              v-for="option in priceOptions"
              :key="option.plan_id"
              @click="selectedId = option.plan_id"
            >
              <div class="radio-circle">
                <img src="@/assets/images/header/check_active.png" alt="" v-if="selectedId == option.plan_id" />
                <img src="@/assets/images/header/check.png" alt="" v-else />
              </div>
              <span class="price-text">{{ trimZeros(option.web3?.price || '') }} USDT</span>
            </div>
          </div>
        </div>
        <div class="section">
          <div class="label">
            {{ t("user.subscription.benefitsLabel") }}
            <span class="count">{{ benefits.length }}/500</span>
          </div>
          <textarea
            class="textarea"
            v-model="benefits"
            :maxlength="500"
            spellcheck="false"
            :placeholder="t('user.subscription.benefitsText')"
          ></textarea>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-cancel" @click="onCancel">{{ t("user.interactive.cancel") }}</button>
        <button class="btn btn-save" :disabled="saving || !selectedId" @click="onSave">{{ t("user.profile.save") }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="SubscriptionPriceModal">
// 发布页「订阅用户可见」未设置订阅价格时弹出，直接在弹窗里设置价格和权益说明。
// 只有「没设置过价格」才会打开，所以不请求 post/getSubscriptionPlan 回显：
// 价格默认选第一个档位；关闭订阅后 plan 为空、拿不到以前的说明，权益说明直接从空开始。
// 保存后不跳页，emit('saved', planId) 交给发布页处理（关闭弹窗、自动选中订阅用户可见）。
import { ref, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import api from "@/api/index";
import { toast } from "@/util/toast";
const { t, locale } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits<{
  (e: "cancel"): void;
  (e: "saved", planId: string): void;
}>();

const priceOptions = ref<any[]>([]);
const selectedId = ref<string>("");
const benefits = ref("");
const loading = ref(false);
const plansLoaded = ref(false);
const saving = ref(false);

function trimZeros(val: string | number): string {
  const s = String(val);
  if (s === "" || s === "0") return s;
  const num = parseFloat(s);
  if (isNaN(num)) return s;
  return num.toString();
}

function apiMsg(data: any) {
  return locale.value == "en" ? data.msg : locale.value == "zh" ? data.msg_cn : locale.value == "tc" ? data.msg_tc : data.msg_jp;
}

// 价格档位随发布页一起预加载（组件跟页面一起挂载），打开弹窗时直接可用，
// 保存按钮不会因为等接口先灰一下再变亮；预加载失败不提示，打开弹窗时再补请求并提示
async function loadPlans(showError: boolean) {
  if (loading.value) return;
  loading.value = true;
  try {
    const listRes = (await api.subscriptionList()) as any;
    if (listRes.code == 200 || listRes.code == 0) {
      priceOptions.value = listRes.data?.plans || [];
      plansLoaded.value = true;
    } else if (showError) {
      toast(apiMsg(listRes));
    }
  } catch (error) {
    console.error(error);
    if (showError) toast(t("fail"));
  } finally {
    loading.value = false;
  }
  // 弹窗已打开但还没选中（打开时档位还没回来）→ 默认选第一个
  if (props.visible && !selectedId.value) {
    selectedId.value = priceOptions.value[0]?.plan_id || "";
  }
}

onMounted(() => {
  loadPlans(false);
});

// 每次打开：默认选中第一个档位，权益说明清空
watch(
  () => props.visible,
  (val) => {
    if (!val) return;
    benefits.value = "";
    selectedId.value = priceOptions.value[0]?.plan_id || "";
    if (!plansLoaded.value) loadPlans(true);
  }
);

function onCancel() {
  if (saving.value) return;
  emit("cancel");
}

async function onSave() {
  if (saving.value || !selectedId.value) return;
  saving.value = true;
  try {
    // 打开弹窗说明当前没有生效的价格，所以始终连同档位一起提交
    const res = await api.modifySubscription({ plan_id: selectedId.value, description: benefits.value });
    const data = res as any;
    if (data.code === 200 || data.code === 0) {
      toast(t("success"));
      emit("saved", String(selectedId.value));
    } else {
      toast(apiMsg(data));
    }
  } catch (error) {
    console.error(error);
    toast(t("fail"));
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.sub-price-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.sub-price-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 560px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
  gap: 24px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
  border-radius: 18px;
}

.close-btn {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 6px;
  transition: transform .2s;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: none;

  &:hover { transform: scale(1.1) rotate(90deg); }
}

.modal-title {
  padding-right: 40px;
  font-size: 18px;
  font-weight: 800;
  line-height: 32px;
  color: #f5f5f5;
}

.section + .section {
  margin-top: 24px;
}

.label {
  font-size: 14px;
  font-weight: 800;
  color: #f5f5f5;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;

  .required {
    color: #ff4f9a;
    margin-right: 4px;
  }

  .count,
  .info {
    font-size: 12px;
    font-weight: 800;
    color: #f5f5f5;
  }
}

.price-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 16px;
  gap: 20px;
}

.price-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  .radio-circle {
    width: 20px;
    height: 20px;

    img {
      width: 100%;
      height: 100%;
    }
  }

  .price-text {
    font-size: 16px;
    font-weight: 800;
    color: #f5f5f5;
  }
}

.textarea {
  width: 100%;
  height: 140px;
  margin-top: 16px;
  padding: 18px 16px;
  box-sizing: border-box;
  font-family: inherit;
  outline: none;
  resize: none;
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  background: #111;
  color: #f5f5f5;

  &:focus {
    border-color: #ff4f9a;
    box-shadow: 0 0 0 2px rgba(255, 79, 154, 0.25);
  }
  &::placeholder {
    color: #f5f5f5;
    opacity: 0.4;
  }
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  height: 48px;
  min-width: 136px;
  padding: 0 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  position: relative;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.06);
  color: #f5f5f5;
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  box-shadow: none;
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: #ff4f9a;
    color: #ff4f9a;
  }
}

.btn-save {
  background: linear-gradient(145deg, #ff65ab, #f02c80);
  color: #FFFFFF;
  border: 2px solid #ff9aca;
  border-radius: 14px;
  box-shadow: 0 0 16px rgba(255, 61, 134, .3);
  transition: box-shadow 0.15s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
  transform: none;
}

@media (max-width: 420px) {
  .sub-price-modal {
    padding: 20px 16px;
  }
  .price-options {
    gap: 12px;
  }
  .textarea {
    height: 120px;
  }
  .actions {
    gap: 8px;
  }
  .btn {
    min-width: auto;
    flex: 1;
  }
}
</style>
