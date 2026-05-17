<template>
  <div class="user-personal">
    <Header :cur="-1"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel">
          <div class="panel-top">
            <div class="panel-title">{{ t("user.personal.title") }}</div>
          </div>
          <!-- <div class="panel-id">ID:{{ userInfo.info?.id || "--" }}</div> -->
          <div class="content">
            <div class="section">
              <div class="label-row">
                <div class="label">{{ t("user.personal.username") }}</div>
                <button class="edit-link" @click="goEdit">{{ t("user.profile.edit") }}</button>
              </div>
              <div class="username-box">{{ userInfo.info?.nickname || "--" }}</div>
            </div>
            <div class="section">
              <div class="label">{{ t("user.personal.avatar") }}</div>
              <img class="avatar-img" :src="userInfo.info?.avatar || defaultAvatar" alt="" @error="($event.target as HTMLImageElement).src = defaultAvatar" />
            </div>

            <div class="section">
              <div class="label">{{ t("birthday.label") }}</div>
              <div class="birth-box">
                {{ hasBirthday ? `${formatDatePart(dateValue.month)}-${formatDatePart(dateValue.day)}-${dateValue.year}` : "" }}
              </div>
            </div>
          </div>

          <div class="sensitive-row" v-if="userRegion">
            <div class="switch-box">
              <div class="label">
                {{ t("user.personal.sensitive") }}
              </div>

              <div
                class="switch"
                :class="{ on: showSensitive, disabled: !isAdult }"
                @click="onToggleSensitive"
              ></div>
            </div>

            <div class="tip">{{ t("user.personal.sensitiveTip") }}</div>
          </div>

          <div class="kyc-section">
            <div class="kyc-row" v-if="kycStatus !== null">
              <div class="kyc-label">{{ t("user.personal.kyc") }}</div>
              <div>
                <div class="kyc-status">
                  <span class="status-text" :class="`status-${kycStatus}`">{{ kycStatusText }}</span>
                  <button class="kyc-btn" @click="goKyc" v-if="kycStatus == '0'">{{ t("user.personal.kycBtn") }}</button>
                </div>

                <div class="kyc-row rejection-reason" v-if="kycStatus == '2' && sampleKycData.rejection_reason">
                  <div class="kyc-status">
                    <span class="rejection-label">{{ t("user.personal.rejectionReason") }}</span>
                    <span class="rejection-text">{{ sampleKycData.rejection_reason }}123</span>
                  </div>
                </div>
              </div>

            </div>
            <!-- KYC Info Display -->
            <div class="kyc-info" v-if="kycStatus !== null && kycStatus != '0'">
              <div class="kyc-top-box">
                <div class="kyc-top-left">
                  <span class="kyc-top-title">{{ t("user.personal.kycInfoTitle") }}</span>
                  <span class="kyc-top-info">{{ t("user.personal.kycInfoTip") }}</span>
                </div>

                <button class="kyc-edit-btn" v-if="kycStatus == '2'" @click="goKyc">{{ t("user.personal.edit") }}</button>
              </div>

              <div class="kyc-base-section">
                <div class="kyc-base-title">{{ t("user.materialProvider.personalInfoSection") }}</div>
                <div class="kyc-info-grid">
                  <div class="kyc-info-item">
                    <div class="kyc-info-label">{{ t("user.materialProvider.lastName") }}</div>
                    <div class="kyc-info-value">{{ sampleKycData.last_name || "--" }}</div>
                  </div>
                  <div class="kyc-info-item">
                    <div class="kyc-info-label">{{ t("user.materialProvider.firstName") }}</div>
                    <div class="kyc-info-value">{{ sampleKycData.first_name || "--" }}</div>
                  </div>

                   <div class="kyc-info-item">
                    <div class="kyc-info-label">{{ t("user.personal.country") }}</div>
                    <div class="kyc-info-value">{{ sampleKycData.country || "--" }}</div>
                  </div>

                  <div class="kyc-info-item" v-if="isJapan && sampleKycData.last_name_kana">
                    <div class="kyc-info-label">{{ t("user.materialProvider.fullNameKana") }} {{ t("user.materialProvider.lastNameKanaPlaceholder") }}</div>
                    <div class="kyc-info-value">{{ sampleKycData.last_name_kana }}</div>
                  </div>
                  <div class="kyc-info-item" v-if="isJapan && sampleKycData.first_name_kana">
                    <div class="kyc-info-label">{{ t("user.materialProvider.fullNameKana") }} {{ t("user.materialProvider.firstNameKanaPlaceholder") }}</div>
                    <div class="kyc-info-value">{{ sampleKycData.first_name_kana }}</div>
                  </div>

                  <div class="kyc-info-item">
                    <div class="kyc-info-label">{{ t("user.materialProvider.postalCode") }}</div>
                    <div class="kyc-info-value">{{ sampleKycData.postal_code || "--" }}</div>
                  </div>

                  <div class="kyc-info-item">
                    <div class="kyc-info-label">
                      {{ isJapan ? t("user.materialProvider.prefecture") : t("user.materialProvider.stateProvinceCounty") }}
                    </div>
                    <div class="kyc-info-value">{{ sampleKycData.prefecture || sampleKycData.state_province || "--" }}</div>
                  </div>

                  <div class="kyc-info-item">
                    <div class="kyc-info-label">
                      {{ isJapan ? t("user.materialProvider.addressLine1") : t("user.materialProvider.cityTown") }}
                    </div>
                    <div class="kyc-info-value">{{ sampleKycData.address_line1 || sampleKycData.city || "--" }}</div>
                  </div>

                  <div class="kyc-info-item" v-if="!isJapan && sampleKycData.address_line2">
                    <div class="kyc-info-label">{{ t("user.materialProvider.streetAddress") }}</div>
                    <div class="kyc-info-value">{{ sampleKycData.address_line2 || "--" }}</div>
                  </div>

                  <div class="kyc-info-item" v-if="isJapan && sampleKycData.address_line2">
                    <div class="kyc-info-label">{{ t("user.personal.addressBuilding") }}</div>
                    <div class="kyc-info-value">{{ sampleKycData.address_line2 || "--" }}</div>
                  </div>

                  <div class="kyc-info-item">
                    <div class="kyc-info-label">{{ t("user.materialProvider.contactEmail") }}</div>
                    <div class="kyc-info-value-row">
                      <div class="kyc-info-value">{{ sampleKycData.email || "--" }}</div>
                      <button class="edit-email-btn" @click="showEmailModal = true">{{ t("user.personal.editEmail") }}</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 身份证明文件 section -->
              <div class="kyc-docs-section">
                <div class="kyc-docs-title">{{ t("user.personal.idDocumentSection") }}</div>
                <div class="kyc-info-grid">
                  <div class="kyc-info-item">
                    <div class="kyc-info-label">{{ t("user.materialProvider.idDocumentType") }}</div>
                    <div class="kyc-info-value">{{ sampleKycData.id_document_type || "--" }}</div>
                  </div>
                  <div class="kyc-info-item">
                    <div class="kyc-info-label">{{ t("user.personal.idDocumentFront") }}</div>
                    <img
                      class="kyc-image"
                      :src="sampleKycData.id_document_front"
                      alt=""
                      @click="openImageViewer(sampleKycData.id_document_front)"
                    />
                  </div>
                  <div class="kyc-info-item" v-if="sampleKycData.id_document_back && sampleKycData.id_document_type !== t('user.materialProvider.idTypeMynumber')">
                    <div class="kyc-info-label">{{ t("user.personal.idDocumentBack") }}</div>
                    <img
                      class="kyc-image"
                      :src="sampleKycData.id_document_back"
                      alt=""
                      @click="openImageViewer(sampleKycData.id_document_back)"
                    />
                  </div>
                </div>
              </div>

              <!-- 本人照片 section -->
              <div class="kyc-photo-section">
                <div class="kyc-photo-title">{{ t("user.personal.applicantPhotoSection") }}</div>
                <div class="kyc-info-grid">
                  <div class="kyc-info-item">
                    <div class="kyc-info-label">{{ t("user.personal.applicantPhoto") }}</div>
                    <img
                      class="kyc-image"
                      :src="sampleKycData.applicant_photo"
                      alt=""
                      @click="openImageViewer(sampleKycData.applicant_photo)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Email Edit Modal Component -->
    <EmailEditModal
      :visible="showEmailModal"
      :current-email="userInfo.info?.email || ''"
      :kyc-id="sampleKycData.id"
      @close="showEmailModal = false"
      @update:email="updateEmail"
    />

    <!-- Cover Zoom Modal -->
    <div v-if="showCoverZoomModal" class="cover-zoom-modal" @click="closeCoverZoomModal">
      <div class="cover-zoom-content" @click.stop>
        <img class="close-zoom-btn" src="@/assets/images/novel/close.png" alt="Close" @click="closeCoverZoomModal" />
        <img :src="zoomedCoverImage" alt="" class="zoomed-cover-image" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="UserPersonalInfo">
import { ref, onMounted, computed } from "vue";
import router from "@/router";
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import EmailEditModal from "@/components/EmailEditModal.vue";
import api from "@/api/index";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
import defaultAvatar from "@/assets/images/base/avatar.png";
const { t, locale } = useI18n();

const sidebarKey = ref("personal");
interface InfoData {
  id?: string;
  nickname?: string;
  avatar?: string;
  age_range?: string;
  birthday?: string;
  show_nsfw?: string;
  is_kyc?: string | number;
  kyc_data?: any;
  email?: string;
}
interface UserData {
  user_id?: number;
  info?: InfoData;
}

const userInfo = ref<UserData>({});
const showSensitive = ref(false);
const userRegion = ref(false);
const isLoading = ref(true);

const isAdult = ref(false);
const dateValue = ref<{ year: number | ""; month: number | ""; day: number | "" }>({
  year: "",
  month: "",
  day: "",
});

// Check if birthday exists
const hasBirthday = computed(() => {
  return dateValue.value.year && dateValue.value.month && dateValue.value.day;
});

// Sample KYC data
const sampleKycData = ref({
  id: "",
  last_name: "",
  first_name: "",
  last_name_kana: "",
  first_name_kana: "",
  country: "",
  postal_code: "",
  prefecture: "",
  state_province: "",
  address_line1: "",
  city: "",
  address_line2: "",
  email: "",
  id_document_type: "",
  id_document_front: "",
  id_document_back: "",
  applicant_photo: "",
  rejection_reason: "",
});

// KYC status: null-未加载, 0-未认证, 1-审核中, 2-审核失败, 3-审核通过
const kycStatus = ref<string | null>(null);
const kycStatusText = computed(() => {
  if (kycStatus.value === null) {
    return '';
  }
  switch (String(kycStatus.value)) {
    case '1':
      return t("user.personal.kycStatus.reviewing");
    case '2':
      return t("user.personal.kycStatus.rejected");
    case '3':
      return t("user.personal.kycStatus.verified");
    default:
      return t("user.personal.kycUnverified");
  }
});

// Check if country is Japan
const isJapan = computed(() => {
  return sampleKycData.value.country === '日本' || sampleKycData.value.country === 'Japan';
});

// Email edit modal
const showEmailModal = ref(false);

// Image zoom modal
const showCoverZoomModal = ref(false);
const zoomedCoverImage = ref('');

// Get KYC detail
async function getKycDetail() {
  try {
    const kycRes = (await api.kycDetail()) as unknown as { code: number; data: any };
    if (kycRes.code === 0 || kycRes.code === 200) {
      const kycData = kycRes.data;

      // Check if data is empty
      const isDataEmpty = !kycData || Object.keys(kycData).length === 0;

      if (isDataEmpty) {
        // Data is empty: unverified
        kycStatus.value = '0';
      } else {
        // Data has content: determine status based on status field
        // 0=待审核 1=审核通过 2=未通过
        const status = kycData.status;
        if (status == '1') {
          // status is 1: verified
          kycStatus.value = '3';
        } else if (status == '0') {
          // status is 0: reviewing
          kycStatus.value = '1';
        } else if (status == '2') {
          // status is 2: rejected
          kycStatus.value = '2';
        }

        // Set KYC data
        // 1=驾驶证 2=护照 3=个人编号卡
        let idDocType = "";
        if (kycData.id_type == "1") {
          idDocType = t("user.materialProvider.idTypeLicense");
        } else if (kycData.id_type == "2") {
          idDocType = t("user.materialProvider.idTypePassport");
        } else if (kycData.id_type == "3") {
          idDocType = t("user.materialProvider.idTypeMynumber");
        }
        sampleKycData.value = {
          id: kycData.id || "",
          last_name: kycData.last_name || "",
          first_name: kycData.first_name || "",
          last_name_kana: kycData.last_name_kana || "",
          first_name_kana: kycData.first_name_kana || "",
          country: kycData.nation || "",
          postal_code: kycData.postal_code || "",
          prefecture: kycData.prefecture || kycData.state_province || "",
          state_province: kycData.state_province || "",
          address_line1: kycData.city || kycData.address_line1 || "",
          city: kycData.city || "",
          address_line2: kycData.building_name || "",
          email: kycData.email || "",
          id_document_type: idDocType,
          id_document_front: kycData.front_image_url || "",
          id_document_back: kycData.back_image_url || "",
          applicant_photo: kycData.face_photo_path || "",
          rejection_reason: kycData.rejection_reason || "",
        };
      }
    }
  } catch (e) {
    console.error(e);
  }
}

onMounted(async () => {
  getCountry();

  try {
    const res = (await api.userInfo()) as unknown as { code: number; data: UserData, timestamp: number };
    if (res.code == 0 || res.code == 200) {
      const data = res.data || {};
      userInfo.value = data;

      // Set sensitive content toggle based on show_nsfw value
      if (data.info?.show_nsfw) {
        showSensitive.value = data.info?.show_nsfw == '1';
      }

      if (data.info?.birthday) {
        const parts = data.info.birthday.split("-");
        dateValue.value = {
          year: parts[0] ? Number(parts[0]) : "",
          month: parts[1] ? Number(parts[1]) : "",
          day: parts[2] ? Number(parts[2]) : "",
        };

        const { year, month, day } = dateValue.value;
        if (year && month && day) {
          const birth = new Date(Number(year), Number(month) - 1, Number(day));

          const now = res.timestamp ? new Date(res.timestamp * 1000) : new Date();
          let age = now.getFullYear() - birth.getFullYear();
          const m = now.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
            age--;
          }
          isAdult.value = age >= 18;
        }
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }

  // Get KYC detail
  await getKycDetail();
});

function getCountry() {
  api.getCode().then((res: any) => {
    if (res.code == 0) {
      if (res.data.countryCode != 'CN') {
        userRegion.value = true;
      } else {
        userRegion.value = false;
      }
    } else {
      console.log()
    }
  }).catch(err => {
    console.log(err);
  })
}

function goEdit() {
  router.push("/user-personal-edit");
}

function goKyc() {
  router.push('/user-kyc');
}

// Format date part to add leading zero
function formatDatePart(value: number | ""): string {
  if (value === "" || value === undefined || value === null) return "";
  return String(value).padStart(2, '0');
}

function onToggleSensitive() {
  if (!isAdult.value) return;

  showSensitive.value = !showSensitive.value;

  api.modifySensitive({
    show_nsfw: showSensitive.value ? 1 : 0,
  })
    .then((res: any) => {
      if (res.code !== 200 && res.code !== 0) {
        showSensitive.value = !showSensitive.value;
        toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
      } else {
        toast(t('success'));

        if (userInfo.value && userInfo.value.info) {
          userInfo.value.info.show_nsfw = showSensitive.value ? '1' : '0';
        }
      }
    })
    .catch((error: any) => {
      showSensitive.value = !showSensitive.value;
      toast(String(error));
    });
}

// Update email
function updateEmail(email: string) {
  if (userInfo.value.info) {
    userInfo.value.info.email = email;
  }
}

function getIdDocumentBackLabel() {
  const type = sampleKycData.value.id_document_type;
  if (type === t("user.materialProvider.idTypeLicense")) {
    return t("user.materialProvider.licenseBack");
  } else if (type === t("user.materialProvider.idTypePassport")) {
    return t("user.materialProvider.passportBack");
  }
  return t("user.personal.idDocumentBack");
}

// Open image zoom
function openImageViewer(imageUrl: string) {
  zoomedCoverImage.value = imageUrl;
  showCoverZoomModal.value = true;
}

// Close image zoom
function closeCoverZoomModal() {
  showCoverZoomModal.value = false;
  zoomedCoverImage.value = '';
}
</script>

<style scoped lang="scss">
.user-personal {
  width: 100%;
  min-height: 100vh;
  background: #FFFFFF;
}
.container {
  max-width: 144rem;
  margin: 0 auto;
  display: flex;
  gap: 6rem;
  padding-right: 6rem;
}
.main {
  flex: 1;
  padding-top: 14rem;
}

.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 2.4rem;
}
.panel-title {
  font-weight: 500;
  font-size: 2rem;
  color: #99A1AF;
}
.panel-id {
  margin: 0 0 1.2rem 1.2rem;
  font-size: 1.6rem;
  color: #fb64b6;
}

.section {
  margin-bottom: 1.8rem;
}

.sensitive-row {
  margin: 2.4rem 0 0;

  .switch-box {
    display: flex;
    align-items: center;
    gap: 2.4rem;
    margin-bottom: 1.2rem;

    .label {
      color: #99A1AF;
    }
  }

  .switch {
    width: 4.4rem;
    height: 2.4rem;
    background: url("@/assets/images/user/close.png") no-repeat;
    background-size: 100% 100%;
    cursor: pointer;

    &.on {
      background: url("@/assets/images/user/open.png") no-repeat;
      background-size: 100% 100%;
    }

    &.disabled {
      cursor: not-allowed;
      background: url("@/assets/images/user/disable.png") no-repeat;
      background-size: 100% 100%;
    }
  }

  .tip {
    font-size: 1.2rem;
    color: #99a1af;
    line-height: 1.6rem;
  }
}

.section:last-child {
  margin-bottom: 0;
}
.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.label {
  font-size: 1.4rem;
  color: #99A1AF;
}
.edit-link {
  background: none;
  border: none;
  color: #fb64b6;
  cursor: pointer;
  font-size: 1.4rem;
  padding: 0;
}
.text-val {
  font-size: 1.4rem;
  color: #364153;
  margin-top: 1.6rem;
  padding-left: 1rem;
  font-weight: 500;
}
.username-box {
  margin-top: 1.2rem;
  font-weight: 500;
  color: #364153;
  font-size: 1.4rem;
}
.avatar-img {
  width: 11.2rem;
  height: 11.2rem;
  border-radius: 0.8rem;
  object-fit: cover;
  margin-top: 1.2rem;
}
.birth-box {
  margin-top: 1.2rem;
  font-weight: 500;
  font-size: 1.4rem;
  color: #364153;
}

.kyc-section {
  margin-top: 3.6rem;
}

.kyc-row {
  display: flex;
  align-items: center;
  gap: 1.6rem;
}

.kyc-label {
  font-weight: 500;
  font-size: 2rem;
  color: #101828;
}

.kyc-status {
  display: flex;
  align-items: center;
  gap: 1.6rem;
}

.status-text {
  font-size: 1.4rem;
  color: #99A1AF;

  &.status-0 {
    color: #99A1AF;
  }
  &.status-1 {
    color: #FBBC05;
  }
  &.status-2 {
    color: #FA2D47;
  }
  &.status-3 {
    color: #05DF4B;
  }
}

.rejection-reason {
  .kyc-status {
    flex-direction: row;
    align-items: center;
    gap: 0.4rem;
  }
}

.rejection-label {
  font-size: 1.4rem;
  color: #99A1AF;
}

.rejection-text {
  font-size: 1.4rem;
  color: #99A1AF;
}

.kyc-btn {
  padding: 1rem 1.6rem;
  border: none;
  border-radius: 0.6rem;
  background: #FB64B6;
  font-size: 1.3rem;
  color: #FFFFFF;
  cursor: pointer;

  &:hover {
    position: relative;

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
      z-index: 5;
    }
  }
}

/* KYC Info Display */
.kyc-info {
  margin: 2rem 0;
  background: #F9FAFB;
  border-radius: 1.2rem;
  padding: 2rem;
}

.kyc-info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}

.kyc-info-tip {
  font-size: 1.2rem;
  color: #99A1AF;
  margin-bottom: 1.6rem;
}

.kyc-edit-btn {
  min-width: 13.6rem;
  height: 4.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  border: none;
  border-radius: 0.6rem;
  background: #FB64B6;
  font-size: 1.4rem;
  color: #FFFFFF;
  cursor: pointer;

  &:hover {
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.kyc-info-title {
  font-size: 1.8rem;
  font-weight: 500;
  color: #364153;
  margin-bottom: 1.6rem;
}

.kyc-info-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);

}

.kyc-info-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  height: 6.4rem;
  border-top: 1px solid #F5F5F5;
}

.kyc-info-label {
  width: 23rem;
  font-size: 1.4rem;
  color: #6A7282;
}

.kyc-info-value {
  flex: 1;
  font-size: 1.4rem;
  color: #364153;
}

.kyc-info-value-row {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  flex: 1;
}

.edit-email-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 10rem;
  height: 4rem;
  padding: 0 1rem;
  border: none;
  border-radius: 0.8rem;
  background: #F5F5F5;
  font-size: 1.2rem;
  color: #6A7282;
  cursor: pointer;
}

/* KYC Document Image */
.kyc-image {
  width: auto;
  height: 4.8rem;
  object-fit: contain;
  border-radius: 0.2rem;
  cursor: pointer;
}

.kyc-top-box{
  display: flex;
  justify-content: space-between;
  align-items: center;

  .kyc-top-left{
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .kyc-top-title{
      font-size: 1.8rem;
      font-weight: 500;
      color: #364153;
    }

    .kyc-top-info{
      font-size: 1.4rem;
      color: #99A1AF;
    }
  }
}

/* KYC Docs Section */
.kyc-base-section, .kyc-docs-section, .kyc-photo-section {
  margin-top: 2rem;
  padding: 0 2rem;
  border-radius: 1.2rem;
  background: #FFFFFF;
}

.kyc-base-title, .kyc-docs-title, .kyc-photo-title {
  display: flex;
  align-items: center;
  height: 6.4rem;
  font-size: 1.6rem;
  font-weight: 500;
  color: #364153;
}

.cover-zoom-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .cover-zoom-content {
    position: relative;
    height: 64rem;
    max-width: 110rem;
    display: flex;
    align-items: center;
    justify-content: center;

    .close-zoom-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 4.8rem;
      height: 4.8rem;
      cursor: pointer;
      z-index: 10;
    }

    .zoomed-cover-image {
      height: 100%;
      width: auto;
      max-width: 100%;
      border-radius: 1.2rem;
      object-fit: contain;
    }
  }
}
</style>
