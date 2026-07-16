<template>
  <div class="user-kyc">
    <Header :cur="-1"></Header>
    <div class="container">
      <div class="main">
        <div class="kyc-back" @click="goBack">
          <img src="@/assets/images/base/back.png" alt="" />
        </div>

        <!-- 页面标题 -->
        <div class="page-header">
          <h1 class="page-title">{{ t("user.personal.kyc") }}</h1>
          <span>{{ t("user.personal.kycFormDesc") }}</span>
        </div>

        <!-- 提示信息 -->
        <div class="warning-banner">
          {{ t("user.personal.kycWarning") }}
        </div>

        <!-- 步骤导航 -->
        <div class="step-nav">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="step-item"
            :class="{ active: currentStep == index, completed: currentStep > index }"
            @click="goToStep(index)"
          >
            <div class="step-num">
              <img v-if="currentStep > index" class="check-icon" src="@/assets/images/user/ok.png" alt="check">
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="step-label">{{ step.label }}</div>
            <div class="step-line" v-if="index < steps.length - 1"></div>
          </div>
        </div>

        <!-- 步骤内容 -->
        <div class="step-content">
          <!-- 第一步：本人信息 -->
          <div v-show="currentStep == 0" class="step-form">
            <div class="section-title-row">
              <span class="section-num">1</span>
              <span class="section-title">{{ t("user.personal.step1Title") }}</span>
              <span class="section-hint">※{{ t("user.personal.step1Hint") }}</span>
            </div>

            <div class="field-row full-width-row">
              <div class="field-label required">
                {{ t("user.materialProvider.fullName") }}
              </div>
              <div class="two-inputs-container">
                <div class="field">
                  <input type="text" class="input" :class="{ error: kycFieldErrors.last_name }" v-model="kycForm.last_name" :placeholder="t('user.materialProvider.lastNamePlaceholder')" @input="clearFieldError('last_name')" spellcheck="false" />
                  <div class="field-error" v-if="kycFieldErrors.last_name">{{ kycFieldErrors.last_name }}</div>
                </div>
                <div class="field">
                  <input type="text" class="input" :class="{ error: kycFieldErrors.first_name }" v-model="kycForm.first_name" :placeholder="t('user.materialProvider.firstNamePlaceholder')" @input="clearFieldError('first_name')"  spellcheck="false" />
                  <div class="field-error" v-if="kycFieldErrors.first_name">{{ kycFieldErrors.first_name }}</div>
                </div>
              </div>
            </div>

            <div class="field-row">
              <div class="field half-width-field">
                <label class="field-label required">{{ t("user.personal.country") }}</label>
                <div class="custom-select" :class="{ active: showCountryDropdown, hasValue: kycForm.country }">
                  <div class="custom-select-input-wrap">
                    <input
                      type="text"
                      class="custom-select-input"
                      :value="countrySearchText || (kycForm.country ? selectedCountryName : '')"
                      @focus="handleCountryInputFocus"
                      @blur="handleCountryInputBlur"
                      @input="handleCountrySearch"
                      @click.stop
                    />
                    <img :src="arrowIcon" alt="arrow" class="custom-select-arrow" @click.stop="toggleCountryDropdown" />
                  </div>
                  <div ref="countryDropdownRef" class="custom-select-options" v-if="showCountryDropdown">
                    <div
                      v-for="country in filteredCountries"
                      :key="country.code"
                      class="custom-select-option"
                      :class="{ selected: kycForm.country == country.code }"
                      @click.stop="selectCountry(country.code)"
                    >
                      {{ country.name }}
                    </div>
                    <div v-if="filteredCountries.length === 0" class="custom-select-empty">
                      {{ t('user.materialProvider.noCountryFound') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="field-row full-width-row" v-if="isJapan">
              <div class="field-label required">
                {{ t("user.materialProvider.fullNameKana") }}
              </div>
              <div class="two-inputs-container">
                <div class="field">
                  <input type="text" class="input" :class="{ error: kycFieldErrors.last_name_kana }" v-model="kycForm.last_name_kana"
                    :placeholder="t('user.materialProvider.lastNameKanaPlaceholder')"
                    @input="clearFieldError('last_name_kana')" @blur="validateKycField('last_name_kana')" spellcheck="false" />
                  <div class="field-error" v-if="kycFieldErrors.last_name_kana">{{ kycFieldErrors.last_name_kana }}</div>
                </div>
                <div class="field">
                  <input type="text" class="input" :class="{ error: kycFieldErrors.first_name_kana }" v-model="kycForm.first_name_kana"
                          :placeholder="t('user.materialProvider.firstNameKanaPlaceholder')"
                          @input="clearFieldError('first_name_kana')" @blur="validateKycField('first_name_kana')"  spellcheck="false" />
                  <div class="field-error" v-if="kycFieldErrors.first_name_kana">{{ kycFieldErrors.first_name_kana }}</div>
                </div>
              </div>
            </div>

            <div class="field-row">
              <div class="field half-width-field">
                <label class="field-label required">{{ t("user.materialProvider.postalCode") }}</label>
                <input type="text" class="input" :class="{ error: kycFieldErrors.postal_code }" v-model="kycForm.postal_code" :placeholder="t('user.materialProvider.postalCodePlaceholder')" maxlength="10" @input="onKycPostalCodeInputAndClear" @blur="validateKycField('postal_code')" spellcheck="false" />
                <div class="field-error" v-if="kycFieldErrors.postal_code">{{ kycFieldErrors.postal_code }}</div>
              </div>
            </div>

            <!-- 日本地址字段 -->
            <template v-if="isJapan">
              <div class="field-row">
                <div class="field">
                  <label class="field-label required">{{ t("user.materialProvider.prefecture") }}</label>
                  <div class="custom-select" :class="{ active: showPrefectureDropdown, hasValue: kycForm.prefecture, error: kycFieldErrors.prefecture }" @click="togglePrefectureDropdown">
                    <div class="custom-select-selected">
                      {{ kycForm.prefecture || t("user.materialProvider.selectPlaceholder") }}
                    </div>
                    <img :src="arrowIcon" alt="arrow" class="custom-select-arrow">
                    <div class="custom-select-options" v-if="showPrefectureDropdown">
                      <div
                        v-for="pref in currentPrefectures"
                        :key="pref"
                        class="custom-select-option"
                        :class="{ selected: kycForm.prefecture == pref }"
                        @click.stop="selectPrefecture(pref)"
                      >
                        {{ pref }}
                      </div>
                    </div>
                  </div>
                  <div class="field-error" v-if="kycFieldErrors.prefecture">{{ kycFieldErrors.prefecture }}</div>
                </div>
              </div>

              <div class="field">
                <label class="field-label required">{{ t("user.personal.addressCity") }}</label>
                <input type="text" class="input" :class="{ error: kycFieldErrors.address_line1 }" v-model="kycForm.address_line1" :placeholder="t('user.personal.addressCityPlaceholder')" @input="clearFieldError('address_line1')" spellcheck="false" />
                <div class="field-error" v-if="kycFieldErrors.address_line1">{{ kycFieldErrors.address_line1 }}</div>
              </div>

              <div class="field">
                <label class="field-label">{{ t("user.personal.addressBuilding") }}</label>
                <input type="text" class="input" v-model="kycForm.address_line2" :placeholder="t('user.personal.addressBuildingPlaceholder')" spellcheck="false" />
              </div>
            </template>

            <!-- 其他国家地址字段 -->
            <template v-else>
              <div class="field">
                <label class="field-label required">{{ t("user.materialProvider.stateProvinceCounty") }}</label>
                <input type="text" class="input" :class="{ error: kycFieldErrors.state_province }" v-model="kycForm.state_province" :placeholder="t('user.materialProvider.stateProvinceCountyPlaceholder')" @input="clearFieldError('state_province')" spellcheck="false" />
                <div class="field-error" v-if="kycFieldErrors.state_province">{{ kycFieldErrors.state_province }}</div>
              </div>

              <div class="field">
                <label class="field-label required">{{ t("user.materialProvider.cityTown") }}</label>
                <input type="text" class="input" :class="{ error: kycFieldErrors.city }" v-model="kycForm.city" :placeholder="t('user.materialProvider.cityTownPlaceholder')" @input="clearFieldError('city')" spellcheck="false" />
                <div class="field-error" v-if="kycFieldErrors.city">{{ kycFieldErrors.city }}</div>
              </div>

              <div class="field">
                <label class="field-label required">{{ t("user.materialProvider.streetAddress") }}</label>
                <input type="text" class="input" :class="{ error: kycFieldErrors.address_line1 }" v-model="kycForm.address_line1" :placeholder="t('user.materialProvider.streetAddressPlaceholder')" @input="clearFieldError('address_line1')" spellcheck="false" />
                <div class="field-error" v-if="kycFieldErrors.address_line1">{{ kycFieldErrors.address_line1 }}</div>
              </div>
            </template>

            <div class="field-row">
              <div class="field half-width-field">
                <label class="field-label required">{{ t("user.materialProvider.contactEmail") }}</label>
                <input type="email" class="input" :class="{ error: kycFieldErrors.contact_email }" v-model="kycForm.contact_email"
                        :placeholder="t('user.materialProvider.contactEmailPlaceholder')"
                        @input="clearFieldError('contact_email')" @blur="validateKycField('contact_email')" />
                <div class="email-hint">{{ t("user.materialProvider.contactEmailHint") }}</div>
                <div class="field-error" v-if="kycFieldErrors.contact_email">{{ kycFieldErrors.contact_email }}</div>
              </div>
              <div class="field half-width-field">
                <label class="field-label required">{{ t("user.personal.emailCode") }}</label>
                <div class="code-input-group" :class="{ error: kycFieldErrors.email_code }">
                  <input type="text" class="code-input" v-model="kycForm.email_code" :placeholder="t('user.personal.emailCodePlaceholder')" @input="onEmailCodeInputAndClear" spellcheck="false" />
                  <button type="button" class="send-code-btn" @click="sendEmailCode" :disabled="isSendCode" :class="{ 'disabled': isSendCode }">{{ emailCodeTxt }}</button>
                </div>
                <div class="field-error" v-if="kycFieldErrors.email_code">{{ kycFieldErrors.email_code }}</div>
              </div>
            </div>
          </div>

          <!-- 第二步：身份证明 -->
          <div v-show="currentStep == 1" class="step-form">
            <div class="step-2-header">
              <span class="step-2-badge">2</span>
              <span class="step-2-title">{{ t("user.personal.step2Title") }}</span>
              <span class="step-2-desc">{{ t("user.personal.step2Desc") }}</span>
            </div>

            <!-- 受理要求 -->
            <div class="acceptance-box">
              <div class="acceptance-title">{{ t("user.personal.docRequirements") }}</div>
              <div class="acceptance-list">
                <div class="acceptance-item">
                  <span class="bullet">•</span>
                  <span>{{ t("user.personal.docReq1") }}</span>
                </div>
                <div class="acceptance-item">
                  <span class="bullet">•</span>
                  <span>{{ t("user.personal.docReq2") }}</span>
                </div>
                <div class="acceptance-item">
                  <span class="bullet">•</span>
                  <span>{{ t("user.personal.docReq3") }}</span>
                </div>
                <div class="acceptance-item">
                  <span class="bullet">•</span>
                  <span>{{ t("user.personal.docReq4") }}</span>
                </div>
                <div class="acceptance-item">
                  <span class="bullet">•</span>
                  <span>{{ t("user.personal.docReq5") }}</span>
                </div>
                <div class="acceptance-item">
                  <span class="bullet">•</span>
                  <span>{{ t("user.personal.docReq6") }}</span>
                </div>
              </div>
            </div>

            <div class="field">
              <label class="field-label required">{{ t("user.personal.idDocumentType") }}</label>
              <div class="doc-type-cards">
                <label class="doc-type-card" :class="{ active: kycForm.id_document_type == 'license' }">
                  <input type="radio" v-model="kycForm.id_document_type" value="license" @change="onIdDocumentTypeChange" />
                  <img class="doc-icon" src="@/assets/images/user/license.png" alt="license" />
                  <span class="doc-type-label">{{ t("user.personal.driverLicense") }}</span>
                  <span class="selected-indicator" v-if="kycForm.id_document_type == 'license'"></span>
                </label>
                <label class="doc-type-card" :class="{ active: kycForm.id_document_type == 'passport' }">
                  <input type="radio" v-model="kycForm.id_document_type" value="passport" @change="onIdDocumentTypeChange" />
                  <img class="doc-icon" src="@/assets/images/user/passport.png" alt="passport" />
                  <span class="doc-type-label">{{ t("user.personal.passport") }}</span>
                  <span class="selected-indicator" v-if="kycForm.id_document_type == 'passport'"></span>
                </label>
                <label class="doc-type-card" :class="{ active: kycForm.id_document_type == 'mynumber' }">
                  <input type="radio" v-model="kycForm.id_document_type" value="mynumber" @change="onIdDocumentTypeChange" />
                  <img class="doc-icon" src="@/assets/images/user/card.png" alt="card" />
                  <span class="doc-type-label">{{ t("user.personal.myNumberCard") }}</span>
                  <span class="selected-indicator" v-if="kycForm.id_document_type == 'mynumber'"></span>
                </label>
              </div>
            </div>

            <div class="field" v-if="kycForm.id_document_type">
              <label class="field-label required">{{ idFrontLabel }}</label>
              <div class="upload-area" @click="triggerKycUpload('id_front')">
                <input type="file" ref="kycIdFrontInput" :accept="acceptTypes" @change="onKycFileChange($event, 'id_document_front')" style="display:none" />
                <template v-if="!kycForm.id_document_front && !kycForm.id_document_front_url">
                  <img class="upload-icon-img" src="@/assets/images/user/upload.png" alt="upload" />
                  <div class="upload-text">{{ t("user.personal.clickUpload") }}</div>
                  <div class="upload-format">{{ t("user.personal.uploadFormat") }}</div>
                </template>
                <template v-else>
                  <img :src="idFrontUrl" class="preview-image" />
                </template>
              </div>
              <div class="field-error" v-if="kycFieldErrors.id_document_front">{{ kycFieldErrors.id_document_front }}</div>
            </div>

            <!-- 个人编号卡提示 -->
            <div class="mynumber-notice" v-if="kycForm.id_document_type == 'mynumber'">
              <img class="notice-icon" src="@/assets/images/user/notice.png" alt="notice" />
              <span class="notice-text">{{ t("user.personal.myNumberNotice") }}</span>
            </div>

            <div class="field" v-if="kycForm.id_document_type && kycForm.id_document_type != 'mynumber'">
              <label class="field-label required">{{ idBackLabel }}</label>
              <div class="upload-area" @click="triggerKycUpload('id_back')">
                <input type="file" ref="kycIdBackInput" :accept="acceptTypes" @change="onKycFileChange($event, 'id_document_back')" style="display:none" />
                <template v-if="!kycForm.id_document_back && !kycForm.id_document_back_url">
                  <img class="upload-icon-img" src="@/assets/images/user/upload.png" alt="upload" />
                  <div class="upload-text">{{ t("user.personal.clickUpload") }}</div>
                  <div class="upload-format">{{ t("user.personal.uploadFormat") }}</div>
                </template>
                <template v-else>
                  <img :src="idBackUrl" class="preview-image" />
                </template>
              </div>
              <div class="field-error" v-if="kycFieldErrors.id_document_back">{{ kycFieldErrors.id_document_back }}</div>
            </div>
          </div>

          <!-- 第三步：本人照片 -->
          <div v-show="currentStep == 2" class="step-form">
            <div class="step-2-header">
              <span class="step-2-badge">3</span>
              <span class="step-2-title">{{ t("user.personal.step3Title") }}</span>
            </div>

            <!-- 照片要求 -->
            <div class="acceptance-box">
              <div class="acceptance-title">{{ t("user.personal.photoRequirements") }}</div>
              <div class="acceptance-list">
                <div class="acceptance-item">
                  <span class="bullet">•</span>
                  <span>{{ t("user.personal.photoReq1") }}</span>
                </div>
                <div class="acceptance-item">
                  <span class="bullet">•</span>
                  <span>{{ t("user.personal.photoReq2") }}</span>
                </div>
                <div class="acceptance-item">
                  <span class="bullet">•</span>
                  <span>{{ t("user.personal.photoReq3") }}</span>
                </div>
                <div class="acceptance-item">
                  <span class="bullet">•</span>
                  <span>{{ t("user.personal.photoReq4") }}</span>
                </div>
                <div class="acceptance-item">
                  <span class="bullet">•</span>
                  <span>{{ t("user.personal.photoReq5") }}</span>
                </div>
                <div class="acceptance-item">
                  <span class="bullet">•</span>
                  <span>{{ t("user.personal.photoReq6") }}</span>
                </div>
                <div class="acceptance-item">
                  <span class="bullet">•</span>
                  <span>{{ t("user.personal.photoReq7") }}</span>
                </div>
              </div>
            </div>

            <div class="field">
              <label class="field-label required">{{ t("user.materialProvider.selfPhoto") }}</label>
              <div class="upload-area" @click="triggerKycUpload('self_photo')">
                <input type="file" ref="kycSelfPhotoInput" :accept="acceptTypes" @change="onKycFileChange($event, 'applicant_photo')" style="display:none" />
                <template v-if="!kycForm.applicant_photo && !kycForm.applicant_photo_url">
                  <img class="upload-icon-img" src="@/assets/images/user/upload.png" alt="upload" />
                  <div class="upload-text">{{ t("user.personal.clickUpload") }}</div>
                  <div class="upload-format">{{ t("user.personal.uploadFormat") }}</div>
                </template>
                <template v-else>
                  <img :src="applicantPhotoUrl" class="preview-image" />
                </template>
              </div>
              <div class="field-error" v-if="kycFieldErrors.applicant_photo">{{ kycFieldErrors.applicant_photo }}</div>
            </div>

            <!-- 同意事项 -->
            <div class="step-2-header">
              <span class="step-2-badge">4</span>
              <span class="step-2-title">{{ t("user.personal.agreementTitle") }}</span>
            </div>
            <div class="agreement-section">
              <div class="agreement-item">
                <div class="checkbox" @click="kycForm.agreement_truthfulness = !kycForm.agreement_truthfulness">
                  <img v-if="kycForm.agreement_truthfulness" src="@/assets/images/register/check_active.png" alt="" />
                  <img v-else src="@/assets/images/register/check.png" alt="" />
                </div>
                <span @click="kycForm.agreement_truthfulness = !kycForm.agreement_truthfulness">{{ t("user.personal.agree1") }}</span>
              </div>
              <div class="agreement-item">
                <div class="checkbox" @click="kycForm.agreement_additional_docs = !kycForm.agreement_additional_docs">
                  <img v-if="kycForm.agreement_additional_docs" src="@/assets/images/register/check_active.png" alt="" />
                  <img v-else src="@/assets/images/register/check.png" alt="" />
                </div>
                <span @click="kycForm.agreement_additional_docs = !kycForm.agreement_additional_docs">{{ t("user.personal.agree2") }}</span>
              </div>
              <div class="agreement-item">
                <div class="checkbox" @click="kycForm.agreement_terms = !kycForm.agreement_terms">
                  <img v-if="kycForm.agreement_terms" src="@/assets/images/register/check_active.png" alt="" />
                  <img v-else src="@/assets/images/register/check.png" alt="" />
                </div>
                <span><span class="link-text">{{ t("user.personal.agree3") }}</span>{{ t("user.personal.agree3Suffix") }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="button-bar">
          <button type="button" class="btn btn-secondary" v-if="currentStep > 0" @click="prevStep">{{ t("user.personal.prevStep") }}</button>
          <div class="btn-spacer" v-if="currentStep > 0"></div>
          <button
            type="button"
            class="btn btn-primary"
            :class="{ 'btn-wide': currentStep == 2, 'btn-error': showStepError }"
            @click="nextStep"
            :disabled="isSubmitting"
          >
            {{ currentStep == 2 ? t("user.personal.submit") : t("user.personal.nextStep") }}
          </button>
        </div>

      </div>
    </div>

    <!-- エラーモーダル -->
    <div class="error-modal-overlay" v-if="showKycErrorModal" @click.self="showKycErrorModal = false">
      <div class="error-modal">
        <div class="error-modal-header">
          <div class="error-modal-title">{{ t("user.materialProvider.errorListTitle") }}</div>
          <button type="button" class="error-modal-close" @click="showKycErrorModal = false">×</button>
        </div>
        <ul class="error-modal-list">
          <li v-for="(err, i) in kycErrors" :key="i">{{ err }}</li>
        </ul>
        <button type="button" class="error-modal-ok" @click="showKycErrorModal = false">
          {{ t("user.materialProvider.errorModalOk") }}
        </button>
      </div>
    </div>

    <!-- 戻る確認モーダル -->
    <div v-if="showBackConfirmModal" class="exit-confirm-modal" @click="cancelGoBack">
      <div class="modal-content" @click.stop>
        <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="cancelGoBack" />
        <h3 class="modal-title">{{ t("user.materialProvider.backConfirmTitle") }}</h3>
        <p class="modal-message">{{ t("user.materialProvider.backConfirmText") }}</p>
        <div class="modal-actions">
          <button class="modal-cancel-btn" @click="cancelGoBack">{{ t("user.materialProvider.backConfirmCancel") }}</button>
          <button class="modal-exit-btn" @click="confirmGoBack">{{ t("user.materialProvider.backConfirmOk") }}</button>
        </div>
      </div>
    </div>

    <UploadMask :visible="isLoading" :text="t('loading')" />
  </div>
</template>

<script setup lang="ts" name="UserKycVerify">
import Header from "@/components/Header.vue";
import UploadMask from "@/components/UploadMask.vue";
import arrowIcon from "@/assets/images/publish/arrow_icon.png";
import { ref, computed, onMounted, onUnmounted, watch, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import {toast} from "@/util/toast";
import api from "@/api/index";
import { baseUrl, siteKey } from "@/util/config";
import { getLocalizedCountries } from "@/data/countries";
import zh from "@/lang/zh";
import jp from "@/lang/jp";
import en from "@/lang/en";

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();

// Get prefectures directly from locale files
const getPrefecturesForLocale = (lang: string) => {
  switch(lang) {
    case 'zh': return zh.user.materialProvider.prefectures;
    case 'jp': return jp.user.materialProvider.prefectures;
    case 'en': return en.user.materialProvider.prefectures;
    default: return jp.user.materialProvider.prefectures;
  }
};

declare let grecaptcha: any;

// Get localized countries list based on current locale
const countryList = computed(() => {
  return getLocalizedCountries(locale.value);
});

// Send email verification code
const isSendCode = ref(false);
const hasEverSentCode = ref(false);
const timer = ref<ReturnType<typeof setInterval> | null>(null);
const count = ref(60);
const emailToken = ref("");
const isGrecaptchaReady = ref(false);

const emailCodeTxt = computed(() => {
  return hasEverSentCode.value ? t("register.resend") : t("user.personal.sendCode");
});

// Check if selected country is Japan
const isJapan = computed(() => kycForm.value.country == "JP");

// Get id front label based on document type
const idFrontLabel = computed(() => {
  if (kycForm.value.id_document_type == "passport") {
    return t("user.personal.idPassportPhoto");
  } else if (kycForm.value.id_document_type == "mynumber") {
    return t("user.personal.idMyNumberFront");
  } else {
    return t("user.personal.idLicenseFront");
  }
});

// Get id back label based on document type
const idBackLabel = computed(() => {
  if (kycForm.value.id_document_type == "passport") {
    return t("user.personal.idPassportAddress");
  } else {
    return t("user.personal.idLicenseBack");
  }
});

// Get states/provinces by country code - use fixed Japanese prefecture list
const currentPrefectures = computed(() => {
  return getPrefecturesForLocale(locale.value);
});

// Check if the form has any content
const hasFormContent = computed(() => {
  const f = kycForm.value;
  return !!(
    f.last_name ||
    f.first_name ||
    f.last_name_kana ||
    f.first_name_kana ||
    f.country ||
    f.postal_code ||
    f.prefecture ||
    f.state_province ||
    f.city ||
    f.address_line1 ||
    f.address_line2 ||
    f.contact_email ||
    f.email_code ||
    f.id_document_front ||
    f.id_document_back ||
    f.applicant_photo ||
    f.agreement_truthfulness ||
    f.agreement_additional_docs ||
    f.agreement_terms
  );
});

// Show back confirmation modal
const showBackConfirmModal = ref(false);

const isLoading = ref(false);
const isSubmitting = ref(false);

// 步骤配置
const steps = ref([
  { label: t("user.personal.step1Label"), key: "personalInfo" },
  { label: t("user.personal.step2Label"), key: "idVerification" },
  { label: t("user.personal.step3Label"), key: "selfPhoto" },
]);

const currentStep = ref(0);

watch(() => locale.value, () => {
  steps.value = [
    { label: t("user.personal.step1Label"), key: "personalInfo" },
    { label: t("user.personal.step2Label"), key: "idVerification" },
    { label: t("user.personal.step3Label"), key: "selfPhoto" },
  ];
});

function goToStep(index: number) {
  if (index <= currentStep.value) {
    currentStep.value = index;
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

function nextStep() {
  showStepError.value = false;
  stepErrorMessage.value = "";

  if (currentStep.value < steps.value.length - 1) {
    const valid = validateCurrentStep();
    if (valid) {
      currentStep.value++;
    } else {
      showStepError.value = true;
      stepErrorMessage.value = t("user.personal.errorFillAllFields");
    }
  } else {
    const valid = validateCurrentStep();
    if (valid) {
      handleKycSubmit();
    } else {
      showStepError.value = true;
      stepErrorMessage.value = t("user.personal.errorFillAllFields");
    }
  }
}

function goBack() {
  if (hasFormContent.value) {
    showBackConfirmModal.value = true;
  } else {
    window.history.back();
  }
}

function confirmGoBack() {
  showBackConfirmModal.value = false;
  window.history.back();
}

function cancelGoBack() {
  showBackConfirmModal.value = false;
}



const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const acceptTypes = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KATAKANA_RE = /^[\u30A0-\u30FF\u3000ー]+$/;
const POSTAL_RE = /^\d{3}-?\d{4}$/;
// 邮编验证：只允许字母、数字、符号，不允许汉字
const POSTAL_ALLOWED_RE = /^[a-zA-Z0-9\s!@#$%^&*()_+=\-[\]{}|;:'",.<>?\/\\`~]*$/;
const POSTAL_CHINESE_RE = /[\u4E00-\u9FA5]/;
// 邮箱验证码验证：只允许字母和数字，不允许汉字
const EMAIL_CODE_ALLOWED_RE = /^[a-zA-Z0-9]*$/;

const kycForm = ref({
  last_name: "",
  first_name: "",
  last_name_kana: "",
  first_name_kana: "",
  country: "JP",
  postal_code: "",
  prefecture: "",
  address_line1: "",
  address_line2: "",
  state_province: "",
  city: "",
  contact_email: "",
  email_code: "",
  id_document_type: "license",
  id_document_front: null as File | null,
  id_document_front_url: "",
  id_document_back: null as File | null,
  id_document_back_url: "",
  applicant_photo: null as File | null,
  applicant_photo_url: "",
  agreement_truthfulness: false,
  agreement_additional_docs: false,
  agreement_terms: false,
});

// 上传状态管理
const uploadStatus = ref<Record<string, { uploading: boolean; error: string }>>({
  id_front: { uploading: false, error: "" },
  id_back: { uploading: false, error: "" },
  self_photo: { uploading: false, error: "" },
});

const kycErrors = ref<string[]>([]);
const showKycErrorModal = ref(false);
const kycFieldErrors = ref<Record<string, string>>({});
const showStepError = ref(false);
const stepErrorMessage = ref("");

const kycIdFrontInput = ref<HTMLInputElement | null>(null);
const kycIdBackInput = ref<HTMLInputElement | null>(null);
const kycSelfPhotoInput = ref<HTMLInputElement | null>(null);

// Custom dropdown state
const showCountryDropdown = ref(false);
const showPrefectureDropdown = ref(false);
const countrySearchText = ref("");
const countryDropdownRef = ref<HTMLElement | null>(null);
const isCountryInputFocused = ref(false);
let previousCountry = "";

// Filtered countries based on search text
const filteredCountries = computed(() => {
  if (!countrySearchText.value) {
    return countryList.value;
  }
  const search = countrySearchText.value.toLowerCase();
  return countryList.value.filter(country =>
    country.name.toLowerCase().includes(search) ||
    country.code.toLowerCase().includes(search)
  );
});

// Selected country name for display
const selectedCountryName = computed(() => {
  return countryList.value.find(c => c.code == kycForm.value.country)?.name || "";
});

function toggleCountryDropdown() {
  showCountryDropdown.value = !showCountryDropdown.value;
  showPrefectureDropdown.value = false;
  if (showCountryDropdown.value) {
    setTimeout(scrollToSelectedCountry, 50);
  }
}

function handleCountryInputFocus() {
  isCountryInputFocused.value = true;
  showCountryDropdown.value = true;
  showPrefectureDropdown.value = false;
  if (kycForm.value.country) {
    previousCountry = kycForm.value.country;
  }
  setTimeout(scrollToSelectedCountry, 50);
}

function handleCountryInputBlur() {
  isCountryInputFocused.value = false;
  setTimeout(() => {
    if (!isCountryInputFocused.value) {
      showCountryDropdown.value = false;
      if (!kycForm.value.country && previousCountry) {
        kycForm.value.country = previousCountry;
      }
      countrySearchText.value = "";
    }
  }, 200);
}

function handleCountrySearch(e: Event) {
  const target = e.target as HTMLInputElement;
  const newValue = target.value;
  const oldValue = countrySearchText.value;

  countrySearchText.value = newValue;

  if (newValue.length < oldValue.length) {
    kycForm.value.country = "";
  }

  if (newValue.length > oldValue.length) {
    showCountryDropdown.value = true;
  }
}

function clearCountrySearch() {
  countrySearchText.value = "";
}

function scrollToSelectedCountry() {
  if (!countryDropdownRef.value || !kycForm.value.country) return;

  const selectedOption = countryDropdownRef.value.querySelector('.custom-select-option.selected') as HTMLElement;
  if (selectedOption) {
    const dropdown = countryDropdownRef.value;
    const optionTop = selectedOption.offsetTop;

    dropdown.scrollTop = optionTop;
  }
}

function togglePrefectureDropdown() {
  if (!kycForm.value.country) {
    toast(t("user.materialProvider.errorSelectCountryFirst"));
    return;
  }
  showPrefectureDropdown.value = !showPrefectureDropdown.value;
  showCountryDropdown.value = false;
}

function selectCountry(value: string) {
  kycForm.value.country = value;
  kycForm.value.postal_code = "";
  kycForm.value.prefecture = "";
  kycForm.value.state_province = "";
  kycForm.value.city = "";
  kycForm.value.address_line1 = "";
  kycForm.value.address_line2 = "";
  showCountryDropdown.value = false;
  clearCountrySearch();
  kycFieldErrors.value = {};
}

function clearCountrySelection() {
  kycForm.value.country = "";
  kycForm.value.postal_code = "";
  kycForm.value.prefecture = "";
  kycForm.value.state_province = "";
  kycForm.value.city = "";
  kycForm.value.address_line1 = "";
  kycForm.value.address_line2 = "";
  countrySearchText.value = "";
  kycFieldErrors.value = {};
}

function selectPrefecture(value: string) {
  kycForm.value.prefecture = value;
  showPrefectureDropdown.value = false;
}

// Close dropdowns when clicking outside
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.custom-select')) {
    showCountryDropdown.value = false;
    showPrefectureDropdown.value = false;
  }
}

function validateKycField(field: "last_name_kana" | "first_name_kana" | "contact_email" | "postal_code") {
  const v = (kycForm.value as any)[field] as string;
  if (!v) { delete kycFieldErrors.value[field]; return; }
  if (field == "contact_email") {
    if (!EMAIL_RE.test(v)) kycFieldErrors.value[field] = t("user.materialProvider.errorEmailFormat");
    else delete kycFieldErrors.value[field];
  } else if (field == "postal_code") {
    if (!POSTAL_ALLOWED_RE.test(v)) {
      kycFieldErrors.value[field] = t("user.materialProvider.errorPostalFormat");
    } else if (isJapan.value && !POSTAL_RE.test(v)) {
      kycFieldErrors.value[field] = t("user.materialProvider.errorPostalJpFormat");
    } else {
      delete kycFieldErrors.value[field];
    }
  } else {
    if (!KATAKANA_RE.test(v)) {
      const label = field == "last_name_kana"
        ? t("user.materialProvider.fullNameKana") + "（セイ）"
        : t("user.materialProvider.fullNameKana") + "（メイ）";
      kycFieldErrors.value[field] = t("user.materialProvider.errorKatakana", { field: label });
    } else delete kycFieldErrors.value[field];
  }
}

function triggerKycUpload(key: string) {
  const map: Record<string, HTMLInputElement | null> = {
    id_front: kycIdFrontInput.value,
    id_back: kycIdBackInput.value,
    self_photo: kycSelfPhotoInput.value,
  };
  map[key]?.click();
}

function getFileExtension(filename: string): string {
  return (filename.split(".").pop() || "").toLowerCase();
}

function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

// 上传图片到服务器
async function uploadImageToServer(file: File, fieldKey: string): Promise<string> {
  const token = localStorage.getItem("token") || "";
  const formData = new FormData();
  formData.append("file", file);

  const authHeaders = (window as any).AntiCrawler?.generateAuthParams(token) || {};

  try {
    const response = await fetch(baseUrl + "/user/uploadImage", {
      method: "POST",
      headers: {
        token: token,
        'Platform': 'web',
        ...authHeaders,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.code == 0 || data.code == 200) {
      const url = (data?.data && (data.data.url || data.data)) || data?.url;
      if (typeof url == "string") {
        return url;
      }
      throw new Error(t("user.materialProvider.uploadFailed"));
    } else {
        throw new Error(data.msg || data.msg_jp || t("user.materialProvider.uploadFailed"));
      }
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

async function onKycFileChange(e: Event, field: string) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (file.size > MAX_FILE_SIZE) {
    alert(t("user.materialProvider.errorFileSize", { max: "10MB" }));
    input.value = "";
    return;
  }
  const ext = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    alert(t("user.materialProvider.errorFileType", { types: ALLOWED_EXTENSIONS.join(", ").toUpperCase() }));
    input.value = "";
    return;
  }

  const fieldMap: Record<string, string> = {
    id_document_front: "id_front",
    id_document_back: "id_back",
    applicant_photo: "self_photo",
  };
  const uploadKey = fieldMap[field] || field;

  uploadStatus.value[uploadKey].uploading = true;
  uploadStatus.value[uploadKey].error = "";

  try {
    const url = await uploadImageToServer(file, field);

    const urlField = field + "_url";
    (kycForm.value as any)[field] = file;
    (kycForm.value as any)[urlField] = url;
  } catch (error: any) {
    uploadStatus.value[uploadKey].error = error.message || t("user.materialProvider.uploadFailed");
    toast(uploadStatus.value[uploadKey].error);
    input.value = "";
  } finally {
    uploadStatus.value[uploadKey].uploading = false;
  }
}

// 保存上一次合法的邮编值
let lastValidPostalCode = "";

function onKycPostalCodeInput() {
  // 只允许字母、数字、符号
  if (POSTAL_ALLOWED_RE.test(kycForm.value.postal_code)) {
    lastValidPostalCode = kycForm.value.postal_code;
  } else {
    kycForm.value.postal_code = lastValidPostalCode;
    return;
  }

  const clean = kycForm.value.postal_code.replace(/-/g, "");
  if (clean.length == 7) lookupKycAddress();
}

// 保存上一次合法的邮箱验证码值
let lastValidEmailCode = "";

function onEmailCodeInput() {
  // 只允许数字
  if (EMAIL_CODE_ALLOWED_RE.test(kycForm.value.email_code)) {
    lastValidEmailCode = kycForm.value.email_code;
  } else {
    kycForm.value.email_code = lastValidEmailCode;
  }
}

function clearFieldError(field: string) {
  delete kycFieldErrors.value[field];
}

let currentIdType = kycForm.value.id_document_type;

const idDocumentPhotos = ref<Record<string, { front_url: string; back_url: string; front_file: File | null; back_file: File | null }>>({
  license: { front_url: "", back_url: "", front_file: null, back_file: null },
  passport: { front_url: "", back_url: "", front_file: null, back_file: null },
  mynumber: { front_url: "", back_url: "", front_file: null, back_file: null }
});

function onIdDocumentTypeChange() {
  const f = kycForm.value;

  if (currentIdType && currentIdType !== f.id_document_type) {
    idDocumentPhotos.value[currentIdType] = {
      front_url: f.id_document_front_url,
      back_url: f.id_document_back_url,
      front_file: f.id_document_front,
      back_file: f.id_document_back
    };

    const newTypePhotos = idDocumentPhotos.value[f.id_document_type];
    kycForm.value.id_document_front_url = newTypePhotos.front_url;
    kycForm.value.id_document_back_url = newTypePhotos.back_url;
    kycForm.value.id_document_front = newTypePhotos.front_file;
    kycForm.value.id_document_back = newTypePhotos.back_file;
    delete kycFieldErrors.value.id_document_front;
    delete kycFieldErrors.value.id_document_back;
  }

  currentIdType = f.id_document_type;
}

function onKycPostalCodeInputAndClear() {
  onKycPostalCodeInput();
  clearFieldError('postal_code');
}

function onEmailCodeInputAndClear() {
  onEmailCodeInput();
  clearFieldError('email_code');
}

async function lookupKycAddress() {
  const clean = kycForm.value.postal_code.replace(/-/g, "");
  if (clean.length !== 7) return;
  if (locale.value !== "jp" || kycForm.value.country !== "JP") return;
  try {
    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${clean}`);
    const data = await res.json();
    if (data.results && data.results[0]) {
      const r = data.results[0];
      const prefecture = r.address1;
      const matchedPrefecture = currentPrefectures.value.find(p => p === prefecture || p.includes(prefecture) || prefecture.includes(p));
      kycForm.value.prefecture = matchedPrefecture || prefecture;
      kycForm.value.address_line1 = r.address2 + r.address3;
    }
  } catch (e) { console.error(e); }
}

function checkGrecaptcha() {
  if (typeof grecaptcha !== "undefined" && grecaptcha.ready) {
    isGrecaptchaReady.value = true;
  } else {
    setTimeout(checkGrecaptcha, 3000);
  }
}

function timeCount() {
  hasEverSentCode.value = true;
  count.value = 60;
  timer.value = setInterval(() => {
    if (count.value <= 1) {
      clearInterval(timer.value!);
      timer.value = null;
      isSendCode.value = false;
      count.value = 60;
    } else {
      count.value -= 1;
    }
  }, 1000);
}

function sendEmailCode() {
  if (!kycForm.value.contact_email) {
    toast(t("user.personal.errorEmailRequired"));
    return;
  }
  if (!EMAIL_RE.test(kycForm.value.contact_email)) {
    toast(t("user.materialProvider.errorEmailFormat"));
    return;
  }
  if (!isGrecaptchaReady.value) {
    toast(t("grecaptcha.notLoaded"));
    return;
  }
  isSendCode.value = true;
  hasEverSentCode.value = true;

  grecaptcha
    .execute(siteKey, { action: "submit" })
    .then(function (token: any) {
      if (token) {
        emailToken.value = token;

        const formData = new FormData();
        formData.append("email", kycForm.value.contact_email);
        formData.append("g-recaptcha-response", token);
        formData.append("siteKey", siteKey);

        const userToken = localStorage.getItem("token") || "";
        const { ts, sign } = (window as any).AntiCrawler.generateAuthParams(userToken);

        fetch(baseUrl + "user/sendKycEmailCode", {
          method: "post",
          headers: {
            "token": userToken,
            "ts": ts,
            "sign": sign,
            "Platform": "web"
          },
          body: formData,
        })
          .then((response) => response.json())
          .then((res) => {
            if (res.code == 0) {
              toast(t("success"));
              timeCount();
            } else {
              toast(locale.value == "jp" ? res.msg_jp : res.msg);
              isSendCode.value = false;
            }
          })
          .catch((error) => {
            console.error("Fail:", error);
            isSendCode.value = false;
          });
      } else {
        toast(t("fail"));
        isSendCode.value = false;
      }
    })
    .catch(() => {
      toast(t("fail"));
      isSendCode.value = false;
    });
}

function validateCurrentStep(): boolean {
  const f = kycForm.value;
  const mp = (k: string) => t(`user.materialProvider.${k}`);
  const req = (label: string) => t("user.materialProvider.errorRequired", { field: label });

  kycFieldErrors.value = {};

  if (currentStep.value == 0) {
    if (!f.last_name) { kycFieldErrors.value.last_name = req(mp("fullName")); }
    if (!f.first_name) { kycFieldErrors.value.first_name = req(mp("fullName")); }
    if (isJapan.value) {
      if (!f.last_name_kana) { kycFieldErrors.value.last_name_kana = req(mp("fullNameKana")); }
      else if (!KATAKANA_RE.test(f.last_name_kana)) { kycFieldErrors.value.last_name_kana = t("user.materialProvider.errorKatakana", { field: mp("fullNameKana") }); }
      if (!f.first_name_kana) { kycFieldErrors.value.first_name_kana = req(mp("fullNameKana")); }
      else if (!KATAKANA_RE.test(f.first_name_kana)) { kycFieldErrors.value.first_name_kana = t("user.materialProvider.errorKatakana", { field: mp("fullNameKana") }); }
    }
    if (!f.postal_code) { kycFieldErrors.value.postal_code = req(mp("postalCode")); }
    else if (!POSTAL_ALLOWED_RE.test(f.postal_code)) { kycFieldErrors.value.postal_code = t("user.materialProvider.errorPostalFormat"); }
    else if (isJapan.value && !POSTAL_RE.test(f.postal_code)) { kycFieldErrors.value.postal_code = t("user.materialProvider.errorPostalJpFormat"); }
    if (isJapan.value) {
      if (!f.prefecture) { kycFieldErrors.value.prefecture = req(mp("prefecture")); }
      if (!f.address_line1) { kycFieldErrors.value.address_line1 = req(t("user.personal.addressCity")); }
    } else {
      if (!f.state_province) { kycFieldErrors.value.state_province = req(mp("stateProvinceCounty")); }
      if (!f.city) { kycFieldErrors.value.city = req(mp("cityTown")); }
      if (!f.address_line1) { kycFieldErrors.value.address_line1 = req(mp("streetAddress")); }
    }
    if (!f.contact_email) { kycFieldErrors.value.contact_email = req(mp("contactEmail")); }
    else if (!EMAIL_RE.test(f.contact_email)) { kycFieldErrors.value.contact_email = t("user.materialProvider.errorEmailFormat"); }
    if (!f.email_code) { kycFieldErrors.value.email_code = req(t("user.personal.emailCode")); }
    else if (!emailToken.value) { kycFieldErrors.value.email_code = t("user.materialProvider.errorSendCodeFirst"); }
    else if (!EMAIL_CODE_ALLOWED_RE.test(f.email_code)) { kycFieldErrors.value.email_code = t("user.materialProvider.errorEmailFormat"); }

    // 如果有任何错误，返回false
    if (Object.keys(kycFieldErrors.value).length > 0) {
      return false;
    }
  } else if (currentStep.value == 1) {
    if (!f.id_document_type) {
      toast(req(mp("idDocumentType")));
      return false;
    }
    if (!f.id_document_front_url) {
      toast(req(t("user.personal.idFront")));
      return false;
    }
    if (f.id_document_type && f.id_document_type !== "mynumber" && !f.id_document_back_url) {
      toast(req(t("user.personal.idBack")));
      return false;
    }
  } else if (currentStep.value == 2) {
    if (!f.applicant_photo_url) {
      toast(req(mp("selfPhoto")));
      return false;
    }
    if (!f.agreement_truthfulness || !f.agreement_additional_docs || !f.agreement_terms) {
      toast(t("user.personal.errorAgreements"));
      return false;
    }
  }

  return true;
}

// Cleanup object URLs to avoid memory leaks
const objectUrls = ref<string[]>([]);

function trackObjectUrl(url: string) {
  objectUrls.value.push(url);
}

function revokeObjectUrls() {
  objectUrls.value.forEach(url => URL.revokeObjectURL(url));
  objectUrls.value = [];
}

// Update computed properties to track URLs
const idFrontUrl = computed(() => {
  if (kycForm.value.id_document_front_url) {
    return kycForm.value.id_document_front_url;
  }
  if (kycForm.value.id_document_front) {
    const url = URL.createObjectURL(kycForm.value.id_document_front);
    trackObjectUrl(url);
    return url;
  }
  return "";
});
const idBackUrl = computed(() => {
  if (kycForm.value.id_document_back_url) {
    return kycForm.value.id_document_back_url;
  }
  if (kycForm.value.id_document_back) {
    const url = URL.createObjectURL(kycForm.value.id_document_back);
    trackObjectUrl(url);
    return url;
  }
  return "";
});
const applicantPhotoUrl = computed(() => {
  if (kycForm.value.applicant_photo_url) {
    return kycForm.value.applicant_photo_url;
  }
  if (kycForm.value.applicant_photo) {
    const url = URL.createObjectURL(kycForm.value.applicant_photo);
    trackObjectUrl(url);
    return url;
  }
  return "";
});

// Check if current step is valid for button enable/disable
const isCurrentStepValid = computed(() => {
  const f = kycForm.value;

  if (currentStep.value == 0) {
    return (
      !!f.last_name &&
      !!f.first_name &&
      (!isJapan.value || (!!f.last_name_kana && KATAKANA_RE.test(f.last_name_kana))) &&
      (!isJapan.value || (!!f.first_name_kana && KATAKANA_RE.test(f.first_name_kana))) &&
      !!f.country &&
      !!f.postal_code &&
      POSTAL_ALLOWED_RE.test(f.postal_code) &&
      (!isJapan.value || POSTAL_RE.test(f.postal_code)) &&
      (isJapan.value ? !!f.prefecture : (!!f.state_province && !!f.city)) &&
      !!f.address_line1 &&
      !!f.contact_email &&
      EMAIL_RE.test(f.contact_email) &&
      !!f.email_code &&
      EMAIL_CODE_ALLOWED_RE.test(f.email_code)
    );
  } else if (currentStep.value == 1) {
    return (
      !!f.id_document_type &&
      !!f.id_document_front_url &&
      !uploadStatus.value.id_front.uploading &&
      (f.id_document_type == "mynumber" || (!!f.id_document_back_url && !uploadStatus.value.id_back.uploading))
    );
  } else if (currentStep.value == 2) {
    return (
      !!f.applicant_photo_url &&
      !uploadStatus.value.self_photo.uploading &&
      f.agreement_truthfulness &&
      f.agreement_additional_docs &&
      f.agreement_terms
    );
  }
  return false;
});

// Revoke URLs when component unmounts
onUnmounted(revokeObjectUrls);

// Add click outside listener
onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/');
    return false;
  }

  document.addEventListener('click', handleClickOutside);
  checkGrecaptcha();

  // 直接从API获取KYC详情
  try {
    const kycRes = await api.kycDetail() as any;
    if (kycRes.code === 0 || kycRes.code === 200) {
      const kycData = kycRes.data;

      // 检查是否有数据
      if (kycData && Object.keys(kycData).length > 0) {
        // 回填基本信息
        kycForm.value.last_name = kycData.last_name || "";
        kycForm.value.first_name = kycData.first_name || "";
        kycForm.value.last_name_kana = kycData.last_name_kana || "";
        kycForm.value.first_name_kana = kycData.first_name_kana || "";
        kycForm.value.postal_code = kycData.postal_code || "";
        kycForm.value.contact_email = kycData.email || "";

        // 处理国家和地址信息
        const isJapanCountry = kycData.nation === '日本' || kycData.nation === 'Japan';
        if (isJapanCountry) {
          kycForm.value.country = 'JP';
          kycForm.value.prefecture = kycData.prefecture || "";
          kycForm.value.address_line1 = kycData.address_line1 || kycData.city || "";
          kycForm.value.address_line2 = kycData.address_line2 || kycData.building_name || "";
        } else {
          // 查找国家代码匹配
          const matchedCountry = countryList.value.find((c: any) => c.name === kycData.nation);
          kycForm.value.country = matchedCountry?.code || "";
          kycForm.value.state_province = kycData.state_province || kycData.prefecture || "";
          kycForm.value.city = kycData.city || kycData.address_line1 || "";
          kycForm.value.address_line1 = kycData.street || kycData.address_line2 || "";
          kycForm.value.address_line2 = kycData.building_name || "";
        }

        // 回填证件类型
        const idTypeMap: Record<string, string> = {
          '1': 'license',
          '2': 'passport',
          '3': 'mynumber'
        };
        kycForm.value.id_document_type = idTypeMap[kycData.id_type] || kycData.id_type || "";

        // 回填证件图片URL
        kycForm.value.id_document_front_url = kycData.front_image_url || "";
        kycForm.value.id_document_back_url = kycData.back_image_url || "";
        kycForm.value.applicant_photo_url = kycData.face_photo_path || "";

        // 保存已有的证件照片到对应的类型中
        idDocumentPhotos.value[kycForm.value.id_document_type] = {
          front_url: kycForm.value.id_document_front_url,
          back_url: kycForm.value.id_document_back_url,
          front_file: null,
          back_file: null
        };

        // 如果有KYC数据，默认勾选协议
        kycForm.value.agreement_truthfulness = true;
        kycForm.value.agreement_additional_docs = true;
        kycForm.value.agreement_terms = true;
      }
    }
  } catch (e) {
    console.error('Failed to load KYC detail:', e);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
});

// Also revoke old URLs when files change
watch([() => kycForm.value.id_document_front, () => kycForm.value.id_document_back, () => kycForm.value.applicant_photo], () => {
  revokeObjectUrls();
}, { deep: true });

async function handleKycSubmit() {
  isSubmitting.value = true;
  try {
    // 获取国家名称
    const selectedCountry = countryList.value.find((c: any) => c.code == kycForm.value.country);

    // 构建提交数据，使用上传后的图片URL
    const submitData = {
      last_name: kycForm.value.last_name,
      first_name: kycForm.value.first_name,
      last_name_kana: kycForm.value.last_name_kana,
      first_name_kana: kycForm.value.first_name_kana,
      nation: selectedCountry?.name || "",
      prefecture: isJapan.value ? kycForm.value.prefecture : kycForm.value.state_province,
      city: isJapan.value ? kycForm.value.address_line1 : kycForm.value.city,
      street: isJapan.value ? "" : kycForm.value.address_line1,
      address: kycForm.value.address_line1,
      building_name: kycForm.value.address_line2,
      postal_code: kycForm.value.postal_code,
      email: kycForm.value.contact_email,
      id_type: kycForm.value.id_document_type == "license" ? "1" : kycForm.value.id_document_type == "passport" ? "2" : "3",
      front_image_url: kycForm.value.id_document_front_url,
      back_image_url: kycForm.value.id_document_back_url,
      face_photo_path: kycForm.value.applicant_photo_url,
      "g-recaptcha-response": emailToken.value,
      code: kycForm.value.email_code,
    };

    // 调用 KYC 提交接口
    const result = await api.addKyc(submitData) as any;
    if (result.code == 0 || result.code == 200) {
      toast(t("success"));
      router.push("/user-personal");
    } else {
      toast(locale.value == "jp" ? result.msg_jp : result.msg);
    }
  } catch (e) {
    console.error(e);
    toast(t("fail"));
  } finally {
    isSubmitting.value = false;
  }
}

// Open terms of service in new tab
function openTermsOfService() {
  localStorage.setItem("isBack", "1");
  window.open("/terms", "_blank");
}

</script>

<style scoped lang="scss">
.user-kyc {
  width: 100%;
  min-height: 100vh;
  background: #FFFBF4;
}
.container {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  gap: 18px;
  padding: 0 30px;
}
.main {
  padding-top: 100px;
  background: #FFFDF7;
  border: 3px solid #161122;
  border-radius: 6px;
  padding: 40px 48px;
  margin-top: 0;
}

.kyc-back {
  position: fixed;
  left: 50%;
  top: 140px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(-550px);
  cursor: pointer;
  z-index: 10;

  img {
    width: 40px;
    height: 40px;
  }
}

.page-header {
  display: flex;
  align-items: baseline;
  margin-bottom: 20px;
  gap: 10px;

  span {
    font-size: 14px;
    color: #161122;
  }
}

.page-title {
  margin: 0;
  font-weight: 700;
  font-size: 20px;
  color: #161122;
}

.warning-banner {
  padding: 12px 20px;
  border: 2px solid #F4C34B;
  border-radius: 6px;
  font-size: 16px;
  line-height: 32px;
  background: #FFF8E6;
  color: #8a6d16;
}

.step-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin: 40px 0;
  position: relative;
}
.step-rail {
  position: absolute;
  top: 15px;
  left: calc(16.666% + 15px);
  right: calc(16.666% + 15px);
  height: 4px;
  background: #161122;
  border-radius: 2px;
  overflow: hidden;

  .rail-fill {
    height: 100%;
    background: #FF4D8D;
    border-radius: 2px;
    transition: width 0.4s ease;
  }
}
.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;

  &.active {
    .step-num {
      background: #FF4D8D;
      color: #FFFFFF;
      box-shadow: 0 0 0 3px rgba(255, 77, 141, 0.42), 0 0 12px 2px rgba(255, 77, 141, 0.3);
      animation: pulse-dot 1.6s ease-in-out infinite;
    }
    .step-label {
      color: #FF4D8D;
      font-weight: 700;
    }
  }

  &.completed {
    .step-num {
      background: #FF4D8D;
      color: #FFFFFF;
      box-shadow: none;
      animation: none;
    }
    .step-label {
      color: #161122;
      font-weight: 600;
    }
  }
}
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 3px rgba(255, 77, 141, 0.42), 0 0 8px 0 rgba(255, 77, 141, 0.2); }
  50% { box-shadow: 0 0 0 6px rgba(255, 77, 141, 0.32), 0 0 16px 4px rgba(255, 77, 141, 0.35); }
}
.step-line {
  position: absolute;
  top: 15px;
  left: calc(50% + 18px);
  width: 0;
  height: 4px;
  display: none;
}
.step-num {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFDF7;
  border: 2.5px solid #161122;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
  color: #161122;
  margin-bottom: 8px;
  position: relative;
  z-index: 2;
  transition: background 0.3s, color 0.3s, box-shadow 0.3s;

  .check-icon {
    width: 16px;
    height: 16px;
  }
}
.step-label {
  font-size: 14px;
  color: #161122;
  font-weight: 600;
}

.step-content {
  position: relative;
}

.step-form {
  animation: slideInStep 0.35s ease-out;
}
@keyframes slideInStep {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.section-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #FF4D8D;
  border: 2.5px solid #161122;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 700;
  color: #FFFFFF;
}
.section-title {
  font-weight: 700;
  font-size: 18px;
  color: #161122;
}
.section-hint {
  font-size: 14px;
  color: #FF4D8D;
  font-weight: 600;
}

.field-row {
  display: flex;
  gap: 24px;

  &.full-width-row {
    flex-direction: column;
    gap: 0;
  }
}
.two-inputs-container {
  display: flex;
  gap: 24px;
  width: 100%;
}
.field {
  flex: 1;
  margin-bottom: 20px;
}
.half-width-field {
  flex: 0 0 calc(50% - 12px);
  max-width: calc(50% - 12px);
}
.field-label {
  display: block;
  margin-bottom: 10px;
  font-weight: 700;
  font-size: 16px;
  color: #161122;

  &.required::before {
    content: "*";
    color: #FF4D8D;
    margin-right: 4px;
  }
}
.input {
  width: 100%;
  height: 50px;
  padding: 12px 16px;
  border: 2.5px solid #161122;
  border-radius: 12px;
  font-size: 14px;
  color: #161122;
  outline: none;
  background: #FFFDF7;
  transition: box-shadow 0.2s, border-color 0.2s;

  &::placeholder {
    color: #161122;
    opacity: 0.4;
  }

  &:focus {
    box-shadow: 3px 3px 0 rgba(255, 77, 141, 0.42);
  }

  &.select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23161122' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
  }

  &.error {
    border-color: #DC2626;
    box-shadow: 3px 3px 0 rgba(220, 38, 38, 0.42);
  }
}
.code-input-group {
  display: flex;
  padding-right: 16px;
  border-radius: 12px;
  gap: 10px;
  background: #FFFDF7;
  border: 2.5px solid #161122;
  transition: box-shadow 0.2s;

  &:has(.code-input:focus) {
    box-shadow: 3px 3px 0 rgba(255, 77, 141, 0.42);
  }

  .code-input {
    flex: 1;
    height: 50px;
    padding: 12px 16px;
    font-size: 14px;
    color: #161122;
    outline: none;
    background: transparent;

    &::placeholder {
      color: #161122;
      opacity: 0.4;
    }

    &.error {
      color: #DC2626;
    }
  }

  &.error {
    border-color: #DC2626;
    box-shadow: 3px 3px 0 rgba(220, 38, 38, 0.42);
  }
}
.send-code-btn {
  font-size: 14px;
  font-weight: 700;
  background: none;
  color: #FF4D8D;
  cursor: pointer;
  padding: 4px 8px;

  &.disabled {
    color: #161122;
    opacity: 0.4;
    cursor: not-allowed;
  }
}
.email-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #161122;
  opacity: 0.6;
  line-height: 1.6;
}
.field-error {
  display: block;
  margin-top: 6px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #DC2626;
  font-weight: 600;
  line-height: 1.5;
  word-break: break-word;
  min-height: 18px;
}

.step-2-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}
.step-2-badge {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FF4D8D;
  border: 2.5px solid #161122;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 700;
  border-radius: 6px;
}
.step-2-title {
  font-size: 18px;
  font-weight: 700;
  color: #161122;
}
.step-2-desc {
  font-size: 14px;
  color: #161122;
  opacity: 0.5;
}

.acceptance-box {
  margin-bottom: 20px;
  padding: 24px 30px;
  background: #FFFDF7;
  border: 3px solid #161122;
  border-radius: 6px;
  box-shadow: 3px 3px 0 #161122;
}
.acceptance-title {
  font-weight: 700;
  font-size: 16px;
  color: #161122;
  margin-bottom: 10px;
}
.acceptance-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 40px;
}
.acceptance-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: #161122;
  font-weight: 500;
  line-height: 1.6;
  width: calc(50% - 20px);
}
.acceptance-item .bullet {
  color: #FF4D8D;
  font-size: 13px;
  flex-shrink: 0;
}

.requirements-box {
  margin-bottom: 24px;
  padding: 16px;
  background: #FFF8E6;
  border: 2px solid #F4C34B;
  border-radius: 6px;
}
.requirements-title {
  font-weight: 700;
  font-size: 13px;
  color: #8a6d16;
  margin-bottom: 12px;
}
.requirements-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.requirement-item {
  font-size: 12px;
  color: #161122;
  opacity: 0.7;
  line-height: 1.6;
}

.doc-type-cards {
  display: flex;
  gap: 16px;
}
.doc-type-card {
  flex: 1;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2.5px solid #161122;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  background: #FFFDF7;
  transition: box-shadow 0.2s, background 0.2s;

  input {
    display: none;
  }

  &:hover {
    box-shadow: 3px 3px 0 rgba(255, 77, 141, 0.42);
  }

  &.active {
    background: #FFFDF7;
    border-color: #FF4D8D;
    box-shadow: 3px 3px 0 rgba(255, 77, 141, 0.42);
  }
}
.doc-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  margin-bottom: 10px;
}
.doc-type-label {
  font-size: 14px;
  color: #161122;
  font-weight: 600;
}
.selected-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 16px;
  height: 16px;
  background: #FF4D8D;
  border: 2.5px solid #161122;
  border-radius: 50%;
}

.upload-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 210px;
  border: 2.5px dashed #161122;
  border-radius: 12px;
  cursor: pointer;
  background: #FFFDF7;
  transition: border-style 0.2s, box-shadow 0.2s;

  &:hover {
    border-style: solid;
    box-shadow: 3px 3px 0 rgba(255, 77, 141, 0.42);
  }
}
.upload-icon-img {
  width: 44px;
  height: 44px;
  object-fit: contain;
  margin-bottom: 10px;
}
.upload-icon-wrap {
  margin-bottom: 10px;
}
.upload-icon {
  color: #161122;
}
.upload-text {
  font-size: 16px;
  color: #161122;
  margin-bottom: 10px;
  font-weight: 700;
}
.upload-format {
  font-weight: 600;
  font-size: 14px;
  color: #161122;
  opacity: 0.5;
}
.preview-image {
  max-width: 100%;
  width: auto;
  height: 210px;
  object-fit: contain;
  border-radius: 12px;
  border: 2.5px solid #161122;
}
.remove-image-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2.5px solid #161122;
  border-radius: 50%;
  background: #FFFDF7;
  font-size: 16px;
  color: #161122;
  cursor: pointer;
}
.mynumber-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px 0 30px;
  padding: 12px 20px;
  background: #FFF8E6;
  border: 2px solid #F4C34B;
  border-radius: 6px;
}
.notice-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}
.notice-text {
  font-size: 16px;
  color: #8a6d16;
  font-weight: 500;
}

.agreement-section {
  margin: 16px 0 30px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.agreement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #161122;
  font-weight: 500;

  .checkbox {
    width: 22px;
    height: 22px;
    border: 2.5px solid #161122;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #FFFDF7;
    transition: background 0.15s;

    img {
      width: 100%;
      height: 100%;
    }
  }

  .link-text {
    font-weight: 700;
    color: #FF4D8D;
  }
}

.button-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 0 0 24px;
}
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 136px;
  height: 48px;
  padding: 0 10px;
  border: 2.5px solid #161122;
  border-radius: 13px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }

  &:hover:not(:disabled) {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #161122;
  }

  &:active:not(:disabled) {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0 #161122;
  }

  &-secondary {
    background: #FFFDF7;
    color: #161122;
    box-shadow: 3px 3px 0 #161122;

    &:hover:not(:disabled) {
      color: #FF4D8D;
      box-shadow: 4px 4px 0 #161122;
    }
  }

  &-primary {
    background: #FF4D8D;
    color: #FFFFFF;
    box-shadow: 3px 3px 0 #161122;
    border: 2.5px solid #161122;

    &:hover:not(:disabled) {
      box-shadow: 4px 4px 0 #161122;
    }

    &-wide {
      padding-left: 40px;
      padding-right: 40px;
      min-width: 200px;
    }

    &-error {
      border: 2.5px solid #DC2626;
      box-shadow: 3px 3px 0 #DC2626;
      animation: shake 0.3s ease-in-out;
    }
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.btn-spacer {
  flex: 1;
}

.btn-error-message {
  color: #DC2626;
  font-size: 12px;
  font-weight: 600;
  margin-top: 8px;
  text-align: center;
}

.error-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(22, 17, 34, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.error-modal {
  width: 400px;
  padding: 24px;
  background: #FFFDF7;
  border: 3px solid #161122;
  border-radius: 6px;
  box-shadow: 6px 6px 0 #161122;
}
.error-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.error-modal-title {
  font-weight: 700;
  font-size: 16px;
  color: #DC2626;
}
.error-modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2.5px solid #161122;
  border-radius: 6px;
  background: #FFFDF7;
  font-size: 18px;
  font-weight: 700;
  color: #161122;
  cursor: pointer;
}
.error-modal-list {
  margin: 0 0 20px;
  padding-left: 16px;
  font-size: 13px;
  color: #161122;
  line-height: 1.8;
}
.error-modal-ok {
  width: 100%;
  padding: 12px;
  border: 2.5px solid #161122;
  border-radius: 13px;
  background: #FF4D8D;
  font-size: 14px;
  font-weight: 700;
  color: #FFFFFF;
  cursor: pointer;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.1s, box-shadow 0.1s;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #161122;
  }
  &:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0 #161122;
  }
}

.exit-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(22, 17, 34, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .modal-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    background: #FFFDF7;
    border: 3px solid #161122;
    border-radius: 6px;
    box-shadow: 6px 6px 0 #161122;
    padding: 18px 24px 24px;

    .close-btn {
      position: absolute;
      top: 20px;
      right: 12px;
      width: 24px;
      height: 24px;
      cursor: pointer;
    }

    .modal-title {
      font-size: 16px;
      font-weight: 700;
      color: #161122;
      margin-bottom: 36px;
      text-align: center;
    }

    .modal-message {
      font-size: 14px;
      color: #161122;
      opacity: 0.7;
      margin-bottom: 34px;
      text-align: center;
    }

    .modal-actions {
      display: flex;
      justify-content: center;
      gap: 24px;

      .modal-cancel-btn {
        min-width: 136px;
        height: 48px;
        border: 2.5px solid #161122;
        border-radius: 13px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        background: #FFFDF7;
        color: #161122;
        box-shadow: 3px 3px 0 #161122;
        transition: transform 0.1s, box-shadow 0.1s;

        &:hover {
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0 #161122;
          color: #FF4D8D;
        }
        &:active {
          transform: translate(1px, 1px);
          box-shadow: 1px 1px 0 #161122;
        }
      }

      .modal-exit-btn {
        min-width: 136px;
        height: 48px;
        border: 2.5px solid #161122;
        border-radius: 13px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        background: #FF4D8D;
        color: #FFFFFF;
        box-shadow: 3px 3px 0 #161122;
        transition: transform 0.1s, box-shadow 0.1s;

        &:hover {
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0 #161122;
        }
        &:active {
          transform: translate(1px, 1px);
          box-shadow: 1px 1px 0 #161122;
        }
      }
    }
  }
}

.custom-select {
  position: relative;
  width: 100%;
  height: 48px;
  border: 2.5px solid #161122;
  border-radius: 12px;
  background: #FFFDF7;
  cursor: pointer;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 3px 3px 0 rgba(255, 77, 141, 0.42);
  }

  &.active {
    box-shadow: 3px 3px 0 rgba(255, 77, 141, 0.42);
    border-color: #161122;
  }

  &.error {
    border-color: #DC2626;
    box-shadow: 3px 3px 0 rgba(220, 38, 38, 0.42);
  }
}

.custom-select-selected {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 40px 0 16px;
  font-size: 14px;
  color: #161122;
  opacity: 0.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .custom-select.hasValue & {
    color: #161122;
    opacity: 1;
  }
}

.custom-select-input-wrap {
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
}

.custom-select-input {
  width: 100%;
  height: 100%;
  padding: 0 40px 0 16px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #161122;
  outline: none;
  cursor: pointer;

  &::placeholder {
    color: #161122;
    opacity: 0.4;
  }
}

.custom-select-arrow {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  transition: transform 0.2s;
  cursor: pointer;

  .custom-select.active & {
    transform: translateY(-50%) rotate(180deg);
  }
}

.custom-select-options {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  max-height: 240px;
  padding: 8px 12px;
  overflow-y: auto;
  background: #FFFDF7;
  border: 2.5px solid #161122;
  border-radius: 12px;
  box-shadow: 3px 3px 0 #161122;
  z-index: 100;
}

.custom-select-option {
  padding: 6px 0;
  font-size: 14px;
  color: #161122;
  opacity: 0.7;
  cursor: pointer;
  font-weight: 500;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    color: #161122;
    opacity: 1;
    background: rgba(255, 77, 141, 0.08);
  }

  &.selected {
    color: #FF4D8D;
    opacity: 1;
    font-weight: 700;
  }
}

.custom-select-empty {
  padding: 6px 0;
  font-size: 14px;
  color: #161122;
  opacity: 0.4;
  text-align: center;
}
</style>