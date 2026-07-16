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

          <!-- <div class="sensitive-row" v-if="userRegion">
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
          </div> -->

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
    const kycRes = (await api.kycDetail()) as any;
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
    } else {
      toast(locale.value == 'en' ? kycRes.msg : locale.value == 'zh' ? kycRes.msg_cn : locale.value == 'tc' ? kycRes.msg_tc : kycRes.msg_jp);
    }
  } catch (e) {
    console.error(e);
  }
}

onMounted(async () => {
  // getCountry();

  try {
    const res = (await api.userInfo()) as any;
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
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
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
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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
  flex: 1;
  padding-top: 100px;
}

.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 4px;
}
.panel-title {
  font-weight: 800;
  font-size: 20px;
  color: #161122;
  position: relative;
  padding-bottom: 10px;
}
.panel-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 46px;
  height: 4px;
  border-radius: 2px;
  background: #FF4D8D;
}

.content {
  background: #FFFDF7;
  border: 3px solid #161122;
  border-radius: 6px;
  padding: 26px 28px;
  min-height: 380px;
}

.section {
  margin-bottom: 18px;
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
  font-weight: 800;
  font-size: 13px;
  color: #161122;
  letter-spacing: 0.02em;
}
.edit-link {
  display: inline-block;
  border: 2.5px solid #161122;
  border-radius: 13px;
  background: #fff;
  color: #161122;
  font-weight: 800;
  font-size: 14px;
  padding: 11px 18px;
  cursor: pointer;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
  white-space: nowrap;
}
.edit-link:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 #161122;
}

.username-box {
  margin-top: 12px;
  font-weight: 800;
  font-size: 15px;
  color: #161122;
  padding: 13px 15px;
  border: 2.5px solid #161122;
  border-radius: 12px;
  background: #fff;
}
.avatar-img {
  width: 112px;
  height: 112px;
  border-radius: 50%;
  border: 4px solid #161122;
  object-fit: cover;
  margin-top: 12px;
  box-shadow: 4px 4px 0 rgba(22,17,34,.2);
}
.birth-box {
  margin-top: 12px;
  font-weight: 800;
  font-size: 15px;
  color: #161122;
  padding: 13px 15px;
  border: 2.5px solid #161122;
  border-radius: 12px;
  background: #fff;
}

.kyc-section {
  margin-top: 36px;
}
.kyc-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 0;
  border-top: 2px solid rgba(22,17,34,.08);
}
.kyc-row.first {
  border-top: none;
  padding-top: 0;
}
.kyc-label {
  font-weight: 800;
  font-size: 14px;
  color: #161122;
}
.kyc-status {
  display: flex;
  align-items: center;
  gap: 14px;
}
.status-text {
  font-weight: 800;
  font-size: 12px;
  padding: 6px 13px;
  border-radius: 999px;
  border: 2px solid #161122;
  color: #161122;
}
.status-text.status-0 {
  background: #EDEDED;
}
.status-text.status-1 {
  background: #FFF3D6;
  animation: stChipPulse 2.4s ease-in-out infinite;
}
.status-text.status-2 {
  background: #FDECEC;
  border-color: #E5484D;
  color: #E5484D;
}
.status-text.status-3 {
  background: #E7F8EE;
  border-color: #9be0bd;
  color: #1B8f5a;
}
@keyframes stChipPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,194,75,0); }
  50% { box-shadow: 0 0 0 5px rgba(255,194,75,.35); }
}
.rejection-reason {
  .kyc-status {
    flex-direction: row;
    align-items: center;
    gap: 4px;
  }
}
.rejection-label {
  font-weight: 800;
  font-size: 12px;
  color: rgba(22,17,34,.55);
}
.rejection-text {
  font-weight: 600;
  font-size: 12px;
  color: rgba(22,17,34,.55);
}

.kyc-btn {
  border: 2.5px solid #161122;
  border-radius: 13px;
  background: #FF4D8D;
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  padding: 11px 20px;
  cursor: pointer;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
  white-space: nowrap;
}
.kyc-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 #161122;
}

.kyc-info {
  margin: 20px 0;
  background: #FFFDF7;
  border: 3px solid #161122;
  border-radius: 6px;
  padding: 20px;
}
.kyc-info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.kyc-info-tip {
  font-weight: 600;
  font-size: 12px;
  color: rgba(22,17,34,.55);
  margin-bottom: 16px;
}

.kyc-edit-btn {
  border: 2.5px solid #161122;
  border-radius: 13px;
  background: #FF4D8D;
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  padding: 11px 20px;
  cursor: pointer;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
  white-space: nowrap;
}
.kyc-edit-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 #161122;
}

.kyc-info-title {
  font-weight: 800;
  font-size: 18px;
  color: #161122;
  margin-bottom: 16px;
}

.kyc-info-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
}
.kyc-info-item {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 64px;
  border-top: 2px solid rgba(22,17,34,.08);
}
.kyc-info-item:first-child {
  border-top: none;
}
.kyc-info-label {
  width: 230px;
  font-weight: 600;
  font-size: 12px;
  opacity: 0.55;
  color: #161122;
}
.kyc-info-value {
  flex: 1;
  font-weight: 800;
  font-size: 14px;
  color: #161122;
}
.kyc-info-value-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}
.edit-email-btn {
  border: 2px solid #161122;
  border-radius: 10px;
  background: #fff;
  font-weight: 800;
  font-size: 12px;
  padding: 7px 14px;
  cursor: pointer;
  color: #161122;
  transition: background 0.15s;
}
.edit-email-btn:hover {
  background: #FFD23F;
}

.kyc-image {
  width: auto;
  height: 48px;
  object-fit: contain;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid #161122;
}
.kyc-top-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.kyc-top-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.kyc-top-title {
  font-weight: 800;
  font-size: 18px;
  color: #161122;
}
.kyc-top-info {
  font-weight: 600;
  font-size: 12px;
  opacity: 0.55;
  color: #161122;
}

.kyc-base-section, .kyc-docs-section, .kyc-photo-section {
  margin-top: 20px;
  padding: 0 20px;
  border: 2.5px solid #161122;
  border-radius: 14px;
  background: #fff;
  box-shadow: 3px 3px 0 rgba(22,17,34,.12);
}
.kyc-base-title, .kyc-docs-title, .kyc-photo-title {
  display: flex;
  align-items: center;
  height: 64px;
  font-weight: 800;
  font-size: 16px;
  color: #161122;
}

.cover-zoom-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(22,17,34,.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.cover-zoom-content {
  position: relative;
  height: 640px;
  max-width: 1100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-zoom-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 48px;
  height: 48px;
  cursor: pointer;
  z-index: 10;
}
.zoomed-cover-image {
  height: 100%;
  width: auto;
  max-width: 100%;
  border-radius: 12px;
  object-fit: contain;
}

@media (max-width: 900px) {
  .container {
    flex-direction: column;
    padding: 0 30px;
  }
  .main {
    padding-top: 20px;
  }
  .content {
    padding: 20px 16px;
  }
  .kyc-info {
    padding: 16px;
  }
  .kyc-info-label {
    width: 160px;
  }
}
@media (max-width: 420px) {
  .content {
    padding: 16px 12px;
  }
  .kyc-info-item {
    height: auto;
    padding: 12px 0;
    flex-wrap: wrap;
  }
  .kyc-info-label {
    width: 100%;
  }
}
</style>
