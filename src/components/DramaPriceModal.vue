<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content">
      <button class="modal-close" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <h3 class="modal-title">{{ t('collectionSettings.priceModalTitle') }}</h3>

      <div class="modal-body">
        <div class="perm-section">
          <div class="section-label">{{ t('collectionSettings.paidSetting') }}</div>
          <div class="perm-options">
            <div class="perm-option" :class="{ selected: selectedId === OFF }" @click="selectedId = OFF">
              <img :src="selectedId === OFF ? selectActive : select" alt="" />
              <span>{{ t('collectionSettings.priceOff') }}</span>
            </div>
            <div
              class="perm-option"
              :class="{ selected: selectedId === planKey(plan) }"
              v-for="plan in plans"
              :key="planKey(plan)"
              @click="selectedId = planKey(plan)"
            >
              <img :src="selectedId === planKey(plan) ? selectActive : select" alt="" />
              <span>{{ planPriceText(plan, t('aiRecharge.unit')) }}/{{ t('submit.perSeries') }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="modal-btn cancel" @click="handleClose">{{ t('cancel') }}</button>
        <button class="modal-btn confirm" :disabled="saving" @click="handleSave">{{ t('user.profile.save') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="DramaPriceModal">
// 漫剧合集设置页「修改价格」弹窗：不开启（全部章节设为公开）或选一个付费档位。
// 保存：选档位 → 修改合集的 plan_id / price；不开启 → 档位清零，并把全部章节批量设为公开。
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/index';
import { toast } from '@/util/toast';
import { apiErrorMessage } from '@/util/utils';
import { fetchBookRechargePlans, planPriceText, type BookRechargePlan } from '@/util/bookRechargePlan';
import select from '@/assets/images/publish/select.png';
import selectActive from '@/assets/images/publish/select_active.png';
const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  bookId: string | number;
  /** 合集当前价格（美分原始值），用于回显选中档位；空 = 未开启 */
  currentPrice?: string | number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', payload: { plan: BookRechargePlan | null }): void;
}>();

const OFF = 'off';
const plans = ref<BookRechargePlan[]>([]);
const selectedId = ref<string>(OFF);
const saving = ref(false);
const planKey = (plan: BookRechargePlan) => String(plan.plan_id ?? plan.id ?? '');

watch(() => props.visible, async (v) => {
  if (!v) return;
  try {
    plans.value = await fetchBookRechargePlans();
  } catch {
    plans.value = [];
  }
  const cur = props.currentPrice;
  const hit = cur !== undefined && cur !== null && cur !== ''
    ? plans.value.find(pl => String(pl.price) === String(cur))
    : undefined;
  selectedId.value = hit ? planKey(hit) : OFF;
});

function handleClose() {
  if (saving.value) return;
  emit('close');
}

async function handleSave() {
  if (saving.value) return;
  saving.value = true;
  try {
    const plan = plans.value.find(pl => planKey(pl) === selectedId.value) || null;
    const res = await api.modifyCollection({
      book_id: props.bookId,
      // 不开启付费：plan_id 传 0 清掉档位
      plan_id: plan ? planKey(plan) : 0,
      price: plan ? plan.price : 0,
    }) as any;
    if (!(res.code == 0 || res.code == 200)) {
      toast(apiErrorMessage(res) || t('fail'));
      return;
    }
    if (!plan) {
      // 不开启：全部章节设为公开
      const r2 = await api.batchModifyPostAccessRights({ book_id: props.bookId, type: 1 }) as any;
      if (!(r2.code == 0 || r2.code == 200)) {
        toast(apiErrorMessage(r2) || t('fail'));
        return;
      }
    }
    toast(t('success'));
    emit('saved', { plan });
    emit('close');
  } catch (e) {
    console.error(e);
    toast(t('fail'));
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  border-radius: 18px;
  width: 520px;
  display: flex;
  flex-direction: column;
  position: relative;

  .modal-close {
    position: absolute;
    right: 14px;
    top: 14px;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    background: #1a1a1a;
    border: 1px solid #3d3d3d;
    box-shadow: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 6px;
    transition: transform .2s;
    z-index: 10;

    &:hover { transform: scale(1.1) rotate(90deg); }
  }

  .modal-title {
    font-size: 16px;
    font-weight: 600;
    color: #f5f5f5;
    margin: 0;
    padding: 18px 20px;
  }

  .modal-body {
    flex: 1;
    padding: 0 20px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.15);
      border-radius: 3px;
    }
  }

  .perm-section {
    margin-bottom: 20px;

    .section-label {
      font-size: 14px;
      font-weight: 600;
      color: #f5f5f5;
      margin-bottom: 12px;

      .required {
        color: #ff4f9a;
        margin-right: 4px;
      }
    }
  }

  /* 横向排列，一行放得下几个放几个，放不下自动换行；每项按内容宽度，文字不折行 */
  .perm-options {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .perm-option {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    white-space: nowrap;

    > img {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    span {
      font-size: 12px;
      font-weight: 700;
      color: #f5f5f5;
      line-height: 30px;
    }

    .perm-content{
      display: flex;
      align-items: center;
      font-size: 12px;
      font-weight: 700;
      color: #f5f5f5;
      line-height: 30px;
    }

    .partial-end-text {
      flex: 1;
      margin-left: 12px;
    }

    .partial-chapter-inline-select {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      background-color: #1a1a1a;
      border-radius: 11px;
      width: 100px;
      height: 40px;
      border: 1px solid #3d3d3d;
      margin-left: 4px;
      padding: 0 8px 0 14px;
      cursor: pointer;
      position: relative;
      vertical-align: middle;
      box-shadow: none;

      .partial-chapter-inline-input {
        width: 100%;
        border: none;
        outline: none;
        background: transparent;
        font-size: 14px;
        font-weight: 700;
        color: #f5f5f5;
        line-height: 22px;

        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      }

      > img {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }
    }

    .partial-chapter-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 8px;
      background: #1a1a1a;
      border-radius: 6px;
      border: 1px solid #3d3d3d;
      box-shadow: 0 15px 35px rgba(0,0,0,0.5);
      z-index: 100;
      max-height: 200px;
      overflow-y: auto;
      padding: 8px;

      .partial-chapter-dropdown-item {
        padding: 6px 4px;
        font-size: 14px;
        font-weight: 700;
        color: #f5f5f5;
        text-align: center;
        opacity: 0.65;
        cursor: pointer;
        border-radius: 11px;
        transition: background 0.15s, opacity 0.15s;

        &:hover {
          opacity: 1;
          background: rgba(255,79,154,0.12);
        }

        &.selected {
          opacity: 1;
          font-weight: 800;
        }
      }
    }
  }

  .preview-section {
    .section-label {
      font-size: 14px;
      font-weight: 600;
      color: #f5f5f5;
      margin-bottom: 12px;
    }
  }

  .chapter-list {
    max-height: 190px;
    border: 1px solid #3d3d3d;
    border-radius: 10px;
    overflow-y: auto;
  }

  .chapter-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    font-weight: 600;

    .chapter-index {
      font-size: 14px;
      color: #f5f5f5;
    }

    .chapter-perm {
      font-size: 14px;
      color: #f5f5f5;

      &.perm-partial {
        color: #ff4f9a;
      }
    }
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 18px 20px;

    .modal-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 136px;
      height: 48px;
      border: 1px solid #3d3d3d;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;

      &.cancel {
        background: #1a1a1a;
        color: #aaa;
        box-shadow: none;

        &:hover {
          color: #ff4f9a;
          border-color: #ff4f9a;
          box-shadow: none;
        }

        &:active {
          box-shadow: none;
        }
      }

      &.confirm {
        background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
        color: #ffffff;
        border: 1px solid #ff9aca;
        box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);

        &:hover {
          box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
        }

        &:active {
          box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
        }
      }
    }
  }
}
</style>
