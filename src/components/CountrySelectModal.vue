<template>
  <div class="country-modal-mask" v-if="visible" @click.self="handleClose">
    <div class="country-modal">
      <button class="modal-close" @click="handleClose">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>
      <div class="modal-header">
        <div class="modal-title">{{ t('user.subscription.selectCountryTitle') }}</div>
      </div>
      <div class="country-list">
        <div
          class="country-item"
          :class="{ active: selectedCode === country.code }"
          v-for="country in countries"
          :key="country.code"
          @click="selectedCode = country.code"
        >
          <img
            class="flag-icon"
            :style="flagPosition(country.code)"
            :src="flagsSvg"
            :alt="country.code"
            loading="lazy"
          />
          <span class="country-name">{{ country.name }}</span>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" @click="handleClose">{{ t('cancel') }}</button>
        <button class="btn-confirm" @click="handleConfirm">{{ t('confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="CountrySelectModal">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import flagsSvg from '@/assets/images/user/flags.svg';

const { t, locale } = useI18n();

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select', country: string): void;
}>();

const selectedCode = ref('JP');

const countries = computed(() => {
  const localeMap: Record<string, Record<string, string>> = {
    zh: {
      AU: '澳大利亚', AT: '奥地利', BE: '比利时', BR: '巴西', BG: '保加利亚',
      CA: '加拿大', HR: '克罗地亚', CY: '塞浦路斯', CZ: '捷克', DK: '丹麦',
      EE: '爱沙尼亚', FI: '芬兰', FR: '法国', DE: '德国', GI: '直布罗陀',
      GR: '希腊', HK: '香港', HU: '匈牙利', IE: '爱尔兰', IT: '意大利',
      JP: '日本', LV: '拉脱维亚', LI: '列支敦士登', LT: '立陶宛', LU: '卢森堡',
      MY: '马来西亚', MT: '马耳他', MX: '墨西哥', NL: '荷兰', NZ: '新西兰',
      NO: '挪威', PL: '波兰', PT: '葡萄牙', RO: '罗马尼亚', SG: '新加坡',
      SK: '斯洛伐克', SI: '斯洛文尼亚', ES: '西班牙', SE: '瑞典', CH: '瑞士',
      TH: '泰国', AE: '阿联酋', GB: '英国', US: '美国',
    },
    tc: {
      AU: '澳大利亞', AT: '奧地利', BE: '比利時', BR: '巴西', BG: '保加利亞',
      CA: '加拿大', HR: '克羅地亞', CY: '塞浦路斯', CZ: '捷克', DK: '丹麥',
      EE: '愛沙尼亞', FI: '芬蘭', FR: '法國', DE: '德國', GI: '直布羅陀',
      GR: '希臘', HK: '香港', HU: '匈牙利', IE: '愛爾蘭', IT: '意大利',
      JP: '日本', LV: '拉脫維亞', LI: '列支敦士登', LT: '立陶宛', LU: '盧森堡',
      MY: '馬來西亞', MT: '馬耳他', MX: '墨西哥', NL: '荷蘭', NZ: '新西蘭',
      NO: '挪威', PL: '波蘭', PT: '葡萄牙', RO: '羅馬尼亞', SG: '新加坡',
      SK: '斯洛伐克', SI: '斯洛文尼亞', ES: '西班牙', SE: '瑞典', CH: '瑞士',
      TH: '泰國', AE: '阿聯酋', GB: '英國', US: '美國',
    },
    en: {
      AU: 'Australia', AT: 'Austria', BE: 'Belgium', BR: 'Brazil', BG: 'Bulgaria',
      CA: 'Canada', HR: 'Croatia', CY: 'Cyprus', CZ: 'Czech Republic', DK: 'Denmark',
      EE: 'Estonia', FI: 'Finland', FR: 'France', DE: 'Germany', GI: 'Gibraltar',
      GR: 'Greece', HK: 'Hong Kong', HU: 'Hungary', IE: 'Ireland', IT: 'Italy',
      JP: 'Japan', LV: 'Latvia', LI: 'Liechtenstein', LT: 'Lithuania', LU: 'Luxembourg',
      MY: 'Malaysia', MT: 'Malta', MX: 'Mexico', NL: 'Netherlands', NZ: 'New Zealand',
      NO: 'Norway', PL: 'Poland', PT: 'Portugal', RO: 'Romania', SG: 'Singapore',
      SK: 'Slovakia', SI: 'Slovenia', ES: 'Spain', SE: 'Sweden', CH: 'Switzerland',
      TH: 'Thailand', AE: 'United Arab Emirates', GB: 'United Kingdom', US: 'United States',
    },
    jp: {
      AU: 'オーストラリア', AT: 'オーストリア', BE: 'ベルギー', BR: 'ブラジル', BG: 'ブルガリア',
      CA: 'カナダ', HR: 'クロアチア', CY: 'キプロス', CZ: 'チェコ', DK: 'デンマーク',
      EE: 'エストニア', FI: 'フィンランド', FR: 'フランス', DE: 'ドイツ', GI: 'ジブラルタル',
      GR: 'ギリシャ', HK: '香港', HU: 'ハンガリー', IE: 'アイルランド', IT: 'イタリア',
      JP: '日本', LV: 'ラトビア', LI: 'リヒテンシュタイン', LT: 'リトアニア', LU: 'ルクセンブルク',
      MY: 'マレーシア', MT: 'マルタ', MX: 'メキシコ', NL: 'オランダ', NZ: 'ニュージーランド',
      NO: 'ノルウェー', PL: 'ポーランド', PT: 'ポルトガル', RO: 'ルーマニア', SG: 'シンガポール',
      SK: 'スロバキア', SI: 'スロベニア', ES: 'スペイン', SE: 'スウェーデン', CH: 'スイス',
      TH: 'タイ', AE: 'アラブ首長国連邦', GB: 'イギリス', US: 'アメリカ合衆国',
    },
  };
  const lang = locale.value === 'tc' ? 'tc' : locale.value === 'jp' ? 'jp' : locale.value === 'zh' ? 'zh' : 'en';
  const names = localeMap[lang] || localeMap.en;
  const codes = ['AU','AT','BE','BR','BG','CA','HR','CY','CZ','DK','EE','FI','FR','DE','GI','GR','HK','HU','IE','IT','JP','LV','LI','LT','LU','MY','MT','MX','NL','NZ','NO','PL','PT','RO','SG','SK','SI','ES','SE','CH','TH','AE','GB','US'];
  return codes.map(code => ({ code, name: names[code] || code }));
});

function handleClose() {
  emit('close');
}

function handleConfirm() {
  if (!selectedCode.value) return;
  emit('select', selectedCode.value);
}

const flagPositions: Record<string, { x: number; y: number }> = {
  AU: { x: -322, y: -10 }, AT: { x: -296, y: -10 }, BE: { x: -504, y: -10 },
  BR: { x: -270, y: -36 }, BG: { x: -36, y: -36 }, CA: { x: -452, y: -36 },
  HR: { x: -478, y: -114 }, CY: { x: -374, y: -62 }, CZ: { x: -400, y: -62 },
  DK: { x: -478, y: -62 }, EE: { x: -88, y: -88 }, FI: { x: -270, y: -88 },
  FR: { x: -400, y: -88 }, DE: { x: -426, y: -62 }, GI: { x: -88, y: -114 },
  GR: { x: -244, y: -114 }, HK: { x: -400, y: -114 }, HU: { x: -10, y: -140 },
  IE: { x: -62, y: -140 }, IT: { x: -270, y: -140 }, JP: { x: -374, y: -140 },
  LV: { x: -400, y: -166 }, LI: { x: -244, y: -166 }, LT: { x: -348, y: -166 },
  LU: { x: -374, y: -166 }, MY: { x: -478, y: -192 }, MT: { x: -348, y: -192 },
  MX: { x: -452, y: -192 }, NL: { x: -166, y: -218 }, NZ: { x: -296, y: -218 },
  NO: { x: -192, y: -218 }, PL: { x: -504, y: -218 }, PT: { x: -114, y: -244 },
  RO: { x: -244, y: -244 }, SG: { x: -478, y: -244 }, SK: { x: -62, y: -270 },
  SI: { x: -10, y: -270 }, ES: { x: -192, y: -88 }, SE: { x: -452, y: -244 },
  CH: { x: -62, y: -62 }, TH: { x: -504, y: -270 }, AE: { x: -62, y: -10 },
  GB: { x: -452, y: -88 }, US: { x: -400, y: -296 },
};

function flagPosition(code: string) {
  const pos = flagPositions[code];
  if (!pos) return {};
  return { objectPosition: `${pos.x}px ${pos.y}px` };
}
</script>

<style scoped lang="scss">
.country-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(22, 17, 34, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 600;
  padding: 24px;
}

.country-modal {
  width: min(690px, 94%);
  max-height: 80vh;
  background: #FFFFFF;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  border-radius: 14px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.modal-close {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #fff;
  border: 2px solid #161122;
  box-shadow: 2px 2px 0 #161122;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 6px;
  transition: transform .2s;
  z-index: 10;

  &:hover { transform: scale(1.1) rotate(90deg); }
}

.modal-header {
  margin-bottom: 16px;
  padding-right: 40px;
}

.modal-title {
  font-weight: 800;
  font-size: 20px;
  color: #161122;
  margin: 0;
  padding: 20px 0 0 20px;
}

.country-list {
  flex: 1;
  overflow-y: auto;
  max-height: calc(80vh - 200px);
  padding-right: 4px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  align-content: start;
  padding: 0 20px 20px
}

.country-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
  border: 2px solid transparent;
  box-sizing: border-box;

  &:hover:not(.active) {
    background: #F5F5F5;
  }

  &.active {
    border-color: #161122;
  }
}

.flag-icon {
  width: 16px;
  height: 16px;
  object-fit: none;
  flex-shrink: 0;
  border-radius: 2px;
}

.country-name {
  font-size: 14px;
  font-weight: 600;
  color: #161122;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 20px;
}

.btn-cancel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 136px;
  height: 48px;
  background: #FFFFFF;
  color: #161122;
  border: 2.5px solid #161122;
  border-radius: 13px;
  box-shadow: 3px 3px 0 #161122;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  padding: 0 16px;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #161122;
  }
  &:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0 #161122;
  }
}

.btn-confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 136px;
  height: 48px;
  background: #FF4D8D;
  color: #FFFFFF;
  border: 2.5px solid #161122;
  border-radius: 13px;
  box-shadow: 3px 3px 0 #161122;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  padding: 0 16px;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #161122;
  }
  &:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0 #161122;
  }
}

@media (max-width: 480px) {
  .country-list {
    grid-template-columns: 1fr;
  }
}
</style>
