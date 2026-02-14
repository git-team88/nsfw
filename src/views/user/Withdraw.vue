<template>
  <div class="user-withdraw">
    <Header :cur="-1"></Header>
    <div class="container">
      <div class="back" @click="router.back()">
        <img src="@/assets/images/base/back.png" alt="" />
      </div>

      <div class="main">
        <div class="panel">
          <div class="withdraw-card">
            <div class="title">{{ t("user.withdraw.title") }}</div>

            <div class="amount-section">
              <div class="label">{{ t("user.withdraw.total") }}</div>
              <div class="value">$148,234</div>
            </div>

            <div class="method-section">
              <div class="label">{{ t("user.withdraw.method") }}</div>
              <div class="method-list">
                <div
                  class="method-item"
                  v-for="m in methods"
                  :key="m.id"
                  :class="{ active: selectedMethod === m.id }"
                  @click="selectedMethod = m.id"
                >
                  <div class="radio">
                    <img
                      v-if="selectedMethod == m.id"
                      src="@/assets/images/header/check_active.png"
                      alt=""
                    />
                    <img v-else src="@/assets/images/header/check.png" alt="" />
                  </div>
                  <div class="name">{{ m.name }}</div>
                </div>
              </div>
            </div>

            <div class="agree-section">
              <div class="checkbox" @click="agree = !agree">
                <img v-if="agree" src="@/assets/images/register/check_active.png" alt="" />
                <img v-else src="@/assets/images/register/check.png" alt="" />
              </div>

              <span>
                {{ t("user.withdraw.agree") }}
                <a href="#" target="_blank">{{ t("user.withdraw.terms") }}</a>
              </span>
            </div>

            <button class="submit-btn" :disabled="!agree" @click="handleWithdraw">
              {{ t("user.withdraw.btn") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from "@/components/Header.vue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t, locale } = useI18n();
const router = useRouter();

const methods = [
  { id: 1, name: "AAAAAAA" },
  { id: 2, name: "BBBBBBB" },
];
const selectedMethod = ref(1);
const agree = ref(false);

function handleWithdraw() {
  console.log("withdraw");
  router.back();
}
</script>

<style scoped lang="scss">
.user-withdraw {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #ffffff;
}
.container {
  max-width: 72rem;
  margin: 0 auto;
}
.main {
  padding-top: 12rem;
  display: flex;
  justify-content: center;
}
.panel {
  width: 72rem;
  min-height: calc(100vh - 14rem);
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 1.2rem;
  padding: 2.4rem 3.6rem;
}
.back {
  position: fixed;
  left: 50%;
  top: 12rem;
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(-55rem);
  border: 1px solid rgba(251, 100, 182, 0.2);
  -webkit-border-radius: 0.8rem;
  border-radius: 0.8rem;
  cursor: pointer;
  z-index: 10;

  &:hover {
    border: 1px solid rgba(251, 100, 182, 0.5);
    background: rgba(251, 100, 182, 0.06);
  }

  img {
    width: 2.4rem;
    height: 2.4rem;
  }
}

.withdraw-card {
  padding: 0 4rem;
}
.title {
  font-size: 2rem;
  font-weight: bold;
  color: #101828;
  margin-bottom: 2.4rem;
}

.amount-section {
  margin-bottom: 2.4rem;
  .label {
    font-size: 1.6rem;
    color: #6a7282;
    margin-bottom: 1rem;
  }
  .value {
    font-size: 3.2rem;
    font-weight: bold;
    color: #fb64b6;
  }
}

.method-section {
  margin-bottom: 2.4rem;
  .label {
    font-size: 1.6rem;
    font-weight: bold;
    color: #101828;
    margin-bottom: 1.2rem;
  }
  .method-list {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }
  .method-item {
    height: 5.6rem;
    padding: 0 1.8rem;
    background: #f5f5f5;
    font-weight: bold;
    font-size: 1.4rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.8rem;
    display: flex;
    align-items: center;
    gap: 1.2rem;
    cursor: pointer;
    .radio {
      width: 2.8rem;
      height: 2.8rem;
      img {
        width: 100%;
        height: 100%;
      }
    }

    span {
      font-size: 1.4rem;
      color: #101828;
      font-weight: 600;
    }
  }
}

.agree-section {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.8rem;
  font-size: 1.4rem;
  color: #6a7282;

  .checkbox {
    width: 2.4rem;
    height: 2.4rem;
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
    }
  }

  a {
    color: #fb64b6;
    text-decoration: none;
    margin-left: 0.4rem;
  }
}

.submit-btn {
  width: 100%;
  height: 4.8rem;
  background: #fb64b6;
  color: #ffffff;
  border: none;
  border-radius: 0.8rem;
  font-size: 1.6rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    position: relative;

    &::after {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.2);
    }
  }

  &:disabled {
    background: rgba(251, 100, 182, 0.5);
    cursor: not-allowed;

    &:hover {
      &::after {
        opacity: 0;
      }
    }
  }
}
</style>
