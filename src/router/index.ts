import { createRouter, createWebHistory } from "vue-router";
import Home from "@/views/Home.vue";

import PublishVideo from "@/views/publish/Video.vue";
// import PublishImage from "@/views/publish/Image.vue";
// import PublishArticle from "@/views/publish/Article.vue";
import PublishSuccess from "@/views/publish/Success.vue";

import Detail from "@/views/Detail.vue";
import Search from "@/views/Search.vue";
import MyProjects from "@/views/MyProjects.vue";
import CharacterLibrary from "@/views/CharacterLibrary.vue";

import UserHome from "@/views/user/UserHome.vue";
import SubscriptionPayment from "@/views/user/SubscriptionPayment.vue";
import SubscriptionSuccess from "@/views/user/SubscriptionSuccess.vue";
import SubscriptionFailed from "@/views/user/SubscriptionFailed.vue";
import AIToolPaymentSuccess from "@/views/user/AIToolPaymentSuccess.vue";
import AIToolPaymentFailed from "@/views/user/AIToolPaymentFailed.vue";
import UserPersonalInfo from "@/views/user/Personal.vue";
import UserPersonalEdit from "@/views/user/PersonalEdit.vue";
import UserInteractive from "@/views/user/Interactive.vue";
import InviteRevenue from "@/views/user/InviteRevenue.vue";
import UserRevenue from "@/views/user/Revenue.vue";
import UserMessages from "@/views/user/Messages.vue";
import UserAccount from "@/views/user/Account.vue";
import UserProfileSettings from "@/views/user/Profile.vue";
import UserProfileEdit from "@/views/user/ProfileEdit.vue";
import UserSubscription from "@/views/user/Subscription.vue";
import UserSubscriptionEdit from "@/views/user/SubscriptionEdit.vue";
import PaymentHistory from "@/views/user/PaymentHistory.vue";
import CommunityConvention from "@/views/user/CommunityConvention.vue";
import AccountSuccess from "@/views/user/AccountSuccess.vue";
import AccountFailed from "@/views/user/AccountFailed.vue";

import UserPrivacy from "@/views/user/Privacy.vue";

import Login from "@/views/login/Login.vue";
import Register from "@/views/login/Register.vue";
import RegisterSuccess from "@/views/login/RegisterSuccess.vue";
import Terms from "@/views/login/Terms.vue";
import Privacy from "@/views/login/Privacy.vue";
import ResetPassword from "@/views/login/ResetPassword.vue";
import ResetSend from "@/views/login/ResetSend.vue";
import PaymentTerms from "@/views/PaymentTerms.vue";
import AIRecharge from "@/views/AIRecharge.vue";
import AIRechargeDetails from "@/views/AIRechargeDetails.vue";
import ComputingPowerRules from "@/views/ComputingPowerRules.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
  },
  {
    path: "/register-success",
    name: "RegisterSuccess",
    component: RegisterSuccess,
  },
  {
    path: "/reset-send",
    name: "ResetSend",
    component: ResetSend,
  },
  {
    path: "/privacy",
    name: "Privacy",
    component: Privacy,
  },
  {
    path: "/terms",
    name: "Terms",
    component: Terms,
  },
  {
    path: "/payment-terms",
    name: "PaymentTerms",
    component: PaymentTerms,
  },
  {
    path: "/ai-recharge",
    name: "AIRecharge",
    component: AIRecharge,
  },
  {
    path: "/ai-points-details",
    name: "AIRechargeDetails",
    component: AIRechargeDetails,
  },
  {
    path: "/computing-rules",
    name: "ComputingPowerRules",
    component: ComputingPowerRules,
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: ResetPassword,
  },
  {
    path: "/publish/video",
    name: "PublishVideo",
    component: PublishVideo,
  },
  // {
  //   path: "/publish/image",
  //   name: "PublishImage",
  //   component: PublishImage,
  // },
  // {
  //   path: "/publish/article",
  //   name: "PublishArticle",
  //   component: PublishArticle,
  // },
  {
    path: "/publish/success",
    name: "PublishSuccess",
    component: PublishSuccess,
  },
  {
    path: "/detail",
    name: "Detail",
    component: Detail,
  },
  {
    path: "/search",
    name: "Search",
    component: Search,
  },
  {
    path: "/my-projects",
    name: "MyProjects",
    component: MyProjects,
  },
  {
    path: "/character-library",
    name: "CharacterLibrary",
    component: CharacterLibrary,
  },
  {
    path: "/user-home",
    name: "UserHome",
    component: UserHome,
  },
  {
    path: "/subscription-payment",
    name: "SubscriptionPayment",
    component: SubscriptionPayment,
  },
  {
    path: "/subscription-success",
    name: "SubscriptionSuccess",
    component: SubscriptionSuccess,
  },
  {
    path: "/subscription-fail",
    name: "SubscriptionFailed",
    component: SubscriptionFailed,
  },
  {
    path: "/aitool-payment-success",
    name: "AIToolPaymentSuccess",
    component: AIToolPaymentSuccess,
  },
  {
    path: "/aitool-payment-fail",
    name: "AIToolPaymentFailed",
    component: AIToolPaymentFailed,
  },
  {
    path: "/user-personal",
    name: "UserPersonalInfo",
    component: UserPersonalInfo,
  },
  {
    path: "/user-personal-edit",
    name: "UserPersonalEdit",
    component: UserPersonalEdit,
  },
  {
    path: "/user-interactive",
    name: "UserInteractive",
    component: UserInteractive,
  },
  {
    path: "/user-invite",
    name: "InviteRevenue",
    component: InviteRevenue,
  },
  {
    path: "/user-revenue",
    name: "UserRevenue",
    component: UserRevenue,
  },
  {
    path: "/community-convention",
    name: "CommunityConvention",
    component: CommunityConvention,
  },
  {
    path: "/user-subscription",
    name: "UserSubscription",
    component: UserSubscription,
  },
  {
    path: "/user-subscription-edit",
    name: "UserSubscriptionEdit",
    component: UserSubscriptionEdit,
  },
  {
    path: "/account-success",
    name: "AccountSuccess",
    component: AccountSuccess,
  },
  {
    path: "/account-fail",
    name: "AccountFailed",
    component: AccountFailed,
  },
  {
    path: "/user-privacy",
    name: "UserPrivacy",
    component: UserPrivacy,
  },
  {
    path: "/user-message",
    name: "UserMessages",
    component: UserMessages,
  },
  {
    path: "/user-account",
    name: "UserAccount",
    component: UserAccount,
  },
  {
    path: "/user-profile",
    name: "UserProfileSettings",
    component: UserProfileSettings,
  },
  {
    path: "/user-profile-edit",
    name: "UserProfileEdit",
    component: UserProfileEdit,
  },
  {
    path: "/user-payment-history",
    name: "PaymentHistory",
    component: PaymentHistory,
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
