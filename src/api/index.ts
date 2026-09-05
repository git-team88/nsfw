import axios from "../util/request";
import { aiUrl } from "../util/config";

const appendContentChannel = (showNsfw: number | undefined, channel?: number) =>
  (showNsfw !== undefined ? '&show_nsfw=' + showNsfw : '') + (channel !== undefined ? '&channel=' + channel : '');

const getProjectNsfwFilter = () => {
  const mode = localStorage.getItem('contentSwitchMode');
  return mode === '0' ? 2 : mode === '2' ? 3 : 1;
};

export default {
  messageList: (data: any) =>
    axios.request({
      url: "message/list",
      method: "GET",
      params: data,
    }),
  checkRegister: (data: any) =>
    axios.request({
      url: "login/checkReg",
      data: data,
      method: "POST",
    }),
  emailLogin: (data: any) =>
    axios.request({
      url: "login/emailLogin",
      data: data,
      method: "POST",
    }),
  emailRegister: (data: any) =>
    axios.request({
      url: "login/emailReg",
      data: data,
      method: "POST",
    }),
  emailVerify: (data: any) =>
    axios.request({
      url: "login/sendEmailVerifyCode",
      data: data,
      method: "POST",
    }),
  resetSendEmail: (data: any) =>
    axios.request({
      url: "login/resetEmailPasswordReq",
      data: data,
      method: "POST",
    }),
  resetPassword: (data: any) =>
    axios.request({
      url: "login/resetEmailPassword",
      data: data,
      method: "POST",
    }),
  googleLogin: (data: any) =>
    axios.request({
      url: "login/googleLogin",
      data: data,
      method: "POST",

    }),
  googleRegister: (data: any) =>
    axios.request({
      url: "login/googleReg",
      data: data,
      method: "POST",
    }),
  checkCode: (data: any) =>
    axios.request({
      url: "login/checkReferralCode",
      data: data,
      method: "POST",
    }),

  bindEmail: (data: any) =>
    axios.request({
      url: "user/bindEmail",
      data: data,
      method: "POST",
    }),
  bindGoogle: (data: any) =>
    axios.request({
      url: "user/bindGoogle",
      data: data,
      method: "POST",
    }),
  unbindEmail: () =>
    axios.request({
      url: "user/unbindEmail",
      method: "POST",
    }),
  unbindGoogle: () =>
    axios.request({
      url: "user/unbindGoogle",
      method: "POST",
    }),
  userInvite: (data: any) =>
    axios.request({
      url: "user/fillInviteCode",
      data: data,
      method: "POST",
    }),
  banner: () =>
    axios.request({
      url: "index/getIndexBannerPublic",
      params: { channel: 1 },
      method: "GET",
    }),

  userInfo: () =>
    axios.request({
      url: "user/getInfo",
      method: "GET",
    }),
  modifyInfo: (data: any) =>
    axios.request({
      url: "user/modifyUserInfo",
      data: data,
      method: "POST",
    }),
  modifyBirth: (data: any) =>
    axios.request({
      url: "login/setBirthday",
      data: data,
      method: "POST",
    }),
  modifyUsername: (data: any) =>
    axios.request({
      url: "user/modifyNickname",
      data: data,
      method: "POST",
    }),
  modifyAvatar: (data: any) =>
    axios.request({
      url: "user/modifyAvatar",
      data: data,
      method: "POST",
    }),
  modifySensitive: (data: any) =>
    axios.request({
      url: "user/modifyShowNsfw",
      data: data,
      method: "POST",
    }),
  getBookGenSwitch: () =>
    axios.request({
      url: "index/getBookGenSwitchPublic",
      method: "GET",
    }),
  getContentSwitchPublic: () =>
    axios.request({
      url: "index/getContentSwitchPublic?channel=1",
      method: "GET",
    }),
  setAdult: (data: any) =>
    axios.request({
      url: "user/setAdult",
      data: data,
      method: "POST",
    }),
  getPrivacy: () =>
    axios.request({
      url: "user/getPrivacy",
      method: "GET",
    }),
  modifyPrivacy: (data: any) =>
    axios.request({
      url: "user/modifyPrivacy",
      data: data,
      method: "POST",
    }),
  getProfile: () =>
    axios.request({
      url: "user/getHomeSetting",
      method: "GET",
    }),
  modifyProfile: (data: any) =>
    axios.request({
      url: "user/modifyHomeSetting",
      data: data,
      method: "POST",
    }),

  subscriptionList: () =>
    axios.request({
      url: "post/getBloggerChargePlanPublic",
      method: "GET",
    }),
  getSubscription: () =>
    axios.request({
      url: "post/getSubscriptionPlan",
      method: "GET",
    }),
  getOthersSubscription: (data: any) =>
    axios.request({
      url: "post/getBloggerSubscriptionPlanPublic",
      data: data,
      method: "POST",
    }),
  modifySubscription: (data: any) =>
    axios.request({
      url: "post/modifySubscriptionPlanNew",
      data: data,
      method: "POST",
    }),
  modifySubscriptionDesc: (data: any) =>
    axios.request({
      url: "post/modifySubscriptionDesc",
      data: data,
      method: "POST",
    }),
  // subscribe: (data: any) =>
  //   axios.request({
  //     url: "post/getPayUrl",
  //     data: data,
  //     method: "POST",
  //   }),
  subscribe: (data: any) =>
    axios.request({
      url: "post/generateSocialSubUrl",
      data: data,
      method: "POST",
    }),
  generateUBloggerSubOrder: (data: any) =>
    axios.request({
      url: "order/generateUBloggerSubOrder",
      data: data,
      method: "POST",
    }),
  generateUAIOrder: (data: any) =>
    axios.request({
      url: "order/generateUAIOrder",
      data: data,
      method: "POST",
    }),
  webThreeCallbackUPaid: (data: any) =>
    axios.request({
      url: "webThreeCallback/uPaid",
      data: data,
      method: "POST",
    }),
  cancelSubscribe: () =>
    axios.request({
      url: "post/getStripeCustomerPortalUrl",
      method: "POST",
    }),
  updateAccount: () =>
    axios.request({
      url: "post/getUpdateStripeUrl",
      method: "POST",
    }),

  benefit: () =>
    axios.request({
      url: "post/generateBenefitUrl",
      method: "POST",
    }),
  balance: () =>
    axios.request({
      url: "post/getBloggerBalance",
      method: "POST",
    }),

  applyWithdraw: (data: any) =>
    axios.request({
      url: "order/applyWithdraw",
      method: "POST",
      data: data,
    }),

  tokenBalance: () =>
    axios.request({
      url: "order/getMyBalance",
      method: "GET",
    }),

  getCoinWithdrawList: (page: number, limit: number) =>
    axios.request({
      url: "order/getCoinWithdrawList?page=" + page + "&limit=" + limit,
      method: "GET",
    }),

  createAccount: (data: any) =>
    axios.request({
      url: "post/generateOnboardingUrl",
      method: "POST",
      data: data,
    }),

  homePostList: (page: number, limit: number, type: number, language?: string, showNsfw?: number, channel?: number) =>
    axios.request({
      url: "index/getRecommendBookPublic?page=" + page + "&limit=" + limit + '&type=' + type + (language ? '&language=' + language : '') + appendContentChannel(showNsfw, channel),
      method: "GET",
    }),
  homeRecommendPostList: (page: number, limit: number, type: number, language?: string, showNsfw?: number, channel?: number) =>
    axios.request({
      url: "index/getRecommendPostPublic?page=" + page + "&limit=" + limit + '&type=' + type + (language ? '&language=' + language : '') + appendContentChannel(showNsfw, channel),
      method: "GET",
    }),
  // 首页人气创作者榜（public）period: day|week|month
  popularUserRank: (page: number, limit: number, period: string = 'week', showNsfw?: number, channel?: number) =>
    axios.request({
      url: "index/getPopularUserRankPublic?page=" + page + "&limit=" + limit + "&period=" + period + appendContentChannel(showNsfw, channel),
      method: "GET",
    }),
  // 新锐创作者榜（public）period: day|week|month
  risingUserRank: (page: number, limit: number, period: string = 'week', showNsfw?: number, channel?: number) =>
    axios.request({
      url: "index/getRisingUserRankPublic?page=" + page + "&limit=" + limit + "&period=" + period + appendContentChannel(showNsfw, channel),
      method: "GET",
    }),
  // 首页作品人气榜（public）
  hotBook: (page: number, limit: number) =>
    axios.request({
      url: "index/getHotBookPublic?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  // 作品人气榜（public）period: day|week|month, type: 0全部|1漫话|2小说|3漫剧
  popularBookRank: (page: number, limit: number, period: string = 'week', type: number = 0, language?: string, showNsfw?: number, channel?: number) =>
    axios.request({
      url: "index/getPopularBookRankPublic?page=" + page + "&limit=" + limit + "&period=" + period + "&type=" + type + (language ? "&language=" + language : "") + appendContentChannel(showNsfw, channel),
      method: "GET",
    }),
  // 上报个人主页浏览（public）
  trackHomeView: (author_id: string | number) =>
    axios.request({
      url: "track/handleHomeViewPublic",
      data: { author_id },
      method: "POST",
    }),
  // 上报合集/作品详情浏览（public）
  trackBookView: (book_id: string | number) =>
    axios.request({
      url: "track/handleBookViewPublic",
      data: { book_id },
      method: "POST",
    }),
  // homePostList: (page: number, limit: number, type: number, language?: string, showNsfw?: number) =>
  //   axios.request({
  //     url: "index/getRecommendStreamPublic?page=" + page + "&limit=" + limit + '&type=' + type + (language ? '&language=' + language : '') + (showNsfw ? '&show_nsfw=' + showNsfw : ''),
  //     method: "GET",
  //   }),
  homeFollowList: (page: number, limit: number, type: number, showNsfw?: number, channel?: number) =>
    axios.request({
      url: "post/getMyFollowListOfBook?page=" + page + "&limit=" + limit + '&type=' + type + appendContentChannel(showNsfw, channel),
      method: "GET",
    }),
  homeFollowPostList: (page: number, limit: number, type: number, showNsfw?: number, channel?: number) =>
    axios.request({
      url: "post/getMyFollowPostList?page=" + page + "&limit=" + limit + '&type=' + type + appendContentChannel(showNsfw, channel),
      method: "GET",
    }),
  homeSubscriptionList: (page: number, limit: number, type: number, showNsfw?: number, channel?: number) =>
    axios.request({
      url: "post/getMySubscriptionListOfBook?page=" + page + "&limit=" + limit + '&type=' + type + appendContentChannel(showNsfw, channel),
      method: "GET",
    }),
  homeSubscriptionPostList: (page: number, limit: number, type: number, showNsfw?: number, channel?: number) =>
    axios.request({
      url: "post/getMySubscriptionPostList?page=" + page + "&limit=" + limit + '&type=' + type + appendContentChannel(showNsfw, channel),
      method: "GET",
    }),
  searchTopic: (data: any) =>
    axios.request({
      url: "post/searchTopics",
      data: data,
      method: "POST",
    }),
  searchUser: (data: any) =>
    axios.request({
      url: "post/searchUsers",
      data: data,
      method: "POST",
    }),
  searchUserList: (keyword: string, page: number, limit: number) =>
    axios.request({
      url: "post/searchUserListPublic?keyword=" + keyword + "&page=" + page + "&limit=" + limit,
      method: "GET",
    }),

  searchPost: (data: any) =>
    axios.request({
      url: "post/searchBookKeywordsPublic",
      data: { ...data },
      method: "POST",
    }),
  searchPostsPublic: (data: any) =>
    axios.request({
      url: "post/searchPostsPublic",
      data: data,
      method: "POST",
    }),

  getVideoId: (data: any) =>
    axios.request({
      url: "user/getCosUploadId",
      data: data,
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
    }),
  getVideoUrl: (data: any) =>
    axios.request({
      url: "user/uploadCosPart",
      data: data,
      method: "POST",
    }),
  getVideoMerge: (data: any) =>
    axios.request({
      url: "user/completeCosMultipartUpload",
      data: data,
      method: "POST",
    }),
  publishImage: (data: any) =>
    axios.request({
      url: "post/addImagePost",
      data: data,
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
    }),
  publishArticle: (data: any) =>
    axios.request({
      url: "post/addArticlePost",
      data: data,
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
    }),
  publishVideo: (data: any) =>
    axios.request({
      url: "post/addVideoPost",
      data: data,
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
    }),
  modifyPostDetail: (id: number | string) =>
    axios.request({
      url: "post/getMyPostDetail?post_id=" + id,
      method: "GET",
    }),
  postDetail: (data: any) =>
    axios.request({
      url: "post/getPostDetailPublic",
      data: data,
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
    }),
  modifyPost: (data: any) =>
    axios.request({
      url: "post/modifyPost",
      data: data,
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
    }),
  deletePost: (data: any) =>
    axios.request({
      url: "post/deletePost",
      data: data,
      method: "POST",
    }),

  authorSelfInfo: () =>
    axios.request({
      url: "blogger/getBloggerinfo",
      method: "GET",
    }),
  authorSelfHome: (type: number, page: number, limit: number, keywords: string, start: string, end: string, sort: string, book_id: string | number) =>
    axios.request({
      url: "my/getList?type=" + type+ "&page="+ + page + "&limit=" + limit  + "&keywords=" + keywords + "&start_day=" + start + "&end_day=" + end + "&sort=" + sort + "&book_id=" + book_id,
      method: "GET",
    }),
  authorSelfCollection: (type: number, page: number, limit: number) =>
    axios.request({
      url: "my/getBookList?type=" + type+ "&page="+ + page + "&limit=" + limit,
      method: "GET",
    }),
  authorSelfPostList: (type: number, page: number, limit: number) =>
    axios.request({
      url: "my/getPostList?type=" + type + "&page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  authorInfo: (author_id: number | string, showNsfw?: number, channel?: number) =>
    axios.request({
      url: "blogger/getBloggerInfoPublic?author_id=" + author_id + appendContentChannel(showNsfw, channel),
      method: "GET",
    }),
  authorHome: (type: number, page: number, limit: number, author_id: number | string, keywords: string, start: string, end: string, sort: string, book_id: string | number, showNsfw?: number, channel?: number) =>
    axios.request({
      url: "blogger/getPostListPublic?type=" + type+ "&page="+ + page + "&limit=" + limit + "&author_id=" + author_id + "&keywords=" + keywords + "&start_day=" + start + "&end_day=" + end + "&sort=" + sort + "&book_id=" + book_id + appendContentChannel(showNsfw, channel),
      method: "GET",
    }),
  authorCollection: (type: number, page: number, limit: number, author_id: number | string, showNsfw?: number, channel?: number) =>
    axios.request({
      url: "blogger/getBookListPublic?type=" + type+ "&page="+ + page + "&limit=" + limit + "&author_id=" + author_id + appendContentChannel(showNsfw, channel),
      method: "GET",
    }),
  authorPostList: (type: number, page: number, limit: number, author_id: number | string, showNsfw?: number, channel?: number) =>
    axios.request({
      url: "blogger/getPostListPublic?type=" + type + "&page=" + page + "&limit=" + limit + "&author_id=" + author_id + appendContentChannel(showNsfw, channel),
      method: "GET",
    }),
  getLikedBookList: (page: number, limit: number) =>
    axios.request({
      url: "book/getLikedBookList?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  likeBook: (data: any) =>
    axios.request({
      url: "book/likeBook",
      method: "POST",
      data,
    }),
  unlikeBook: (data: any) =>
    axios.request({
      url: "book/unlikeBook",
      method: "POST",
      data,
    }),
  bookLikePost: (data: any) =>
    axios.request({
      url: "book/likePost",
      method: "POST",
      data,
    }),
  bookUnlikePost: (data: any) =>
    axios.request({
      url: "book/unlikePost",
      method: "POST",
      data,
    }),
  authorFollowList: (page: number, limit: number, author_id: number | string) =>
    axios.request({
      url: "follow/getUserFollowedListPublic?page=" + page + "&limit=" + limit + "&author_id=" + author_id,
      method: "GET",
    }),
  authorFansList: (page: number, limit: number, author_id: number | string) =>
    axios.request({
      url: "follow/getUserFansListPublic?page=" + page + "&limit=" + limit + "&author_id=" + author_id,
      method: "GET",
    }),
  authorSubList: (page: number, limit: number) =>
    axios.request({
      url: "post/getMySubBloggerList?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  follow: (data: any) =>
    axios.request({
      url: "follow/create",
      data: data,
      method: "POST",
    }),
  unfollow: (data: any) =>
    axios.request({
      url: "follow/unfollow",
      data: data,
      method: "POST",
    }),
  userSubscribeList: (page: number, limit: number) =>
    axios.request({
      url: "post/getSubscribeList?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  userAiSubscribeList: (page: number, limit: number) =>
    axios.request({
      url: "post/getAISubscribeList?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  userFollowList: (page: number, limit: number) =>
    axios.request({
      url: "follow/getFollowedList?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  userAIRechargeList: (page: number, limit: number) =>
    axios.request({
      url: "post/getSubscribeList?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  userPayList: (page: number, limit: number) =>
    axios.request({
      url: "order/getOrderList?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  userAiPayList: (page: number, limit: number) =>
    axios.request({
      url: "user/getAiOrderList?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  userPaymentOrderList: (page: number, limit: number) =>
    axios.request({
      url: "user/getPaymentOrderList?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  AIRecharge: (data: any) =>
    axios.request({
      url: "post/getAIRechargeUrl",
      data: data,
      method: "POST",
    }),

  postPin: (data: any) =>
    axios.request({
      url: "post/pin",
      data: data,
      method: "POST",
    }),
  postUnpin: (data: any) =>
    axios.request({
      url: "post/unpin",
      data: data,
      method: "POST",
    }),

  postCollection: (data: any) =>
    axios.request({
      url: "book/setBookTop",
      data: data,
      method: "POST",
    }),
  postUnCollection: (data: any) =>
    axios.request({
      url: "book/cancelBookTop",
      data: data,
      method: "POST",
    }),
  finishCollection: (data: any) =>
    axios.request({
      url: "book/finishBook",
      data: data,
      method: "POST",
    }),

  userInviteInfo: () =>
    axios.request({
      url: "user/getRewardCount",
      method: "GET",
    }),
  userInviteList: (page: number, limit: number,) =>
    axios.request({
      url: "user/getRewardList?page="+ page + "&limit=" + limit,
      method: "GET",
    }),

  userWorkList: (page: number, limit: number, start: string, end: string) =>
    axios.request({
      url: "stat/getDailyCountList?page="+ page + "&limit=" + limit + "&start_day=" + start + "&end_day=" + end,
      method: "GET",
    }),
  userSingleWorkList: (page: number, limit: number, start: string, end: string) =>
    axios.request({
      url: "stat/getPostCountList?page="+ page + "&limit=" + limit + "&start_day=" + start + "&end_day=" + end,
      method: "GET",
    }),
  userFansList: (page: number, limit: number, start: string, end: string) =>
    axios.request({
      url: "stat/getFansCountList?page="+ page + "&limit=" + limit + "&start_day=" + start + "&end_day=" + end,
      method: "GET",
    }),
  downloadUserWorkList: (startDate: string, endDate: string) =>
    axios.request({
      url: `stat/getDailyCountList?start_date=${startDate}&end_date=${endDate}&download=1`,
      method: "GET",
      responseType: 'text',
    }),
  downloadUuserSingleWorkList: (startDate: string, endDate: string) =>
    axios.request({
      url: `stat/getPostCountList?start_date=${startDate}&end_date=${endDate}&download=1`,
      method: "GET",
      responseType: 'text',
    }),
  downloadUserFansList: (startDate: string, endDate: string) =>
    axios.request({
      url: `stat/getFansCountList?start_date=${startDate}&end_date=${endDate}&download=1`,
      method: "GET",
      responseType: 'text',
    }),

  messageInfo: () =>
    axios.request({
      url: "message/getUnreadCounts",
      method: "GET",
    }),
  messageExpireList: (page: number, limit: number) =>
    axios.request({
      url: "message/getMessageListOfSubscribeExpire?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  messageSubscribeList: (page: number, limit: number) =>
    axios.request({
      url: "message/getMessageListOfSubscribeMe?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  messageLikeList: (page: number, limit: number) =>
    axios.request({
      url: "message/getMessageListOfLike?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  messageCommentList: (page: number, limit: number) =>
    axios.request({
      url: "message/getMessageListOfComment?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  messageFollowList: (page: number, limit: number) =>
    axios.request({
      url: "message/getMessageListOfFollow?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  messageMentionsList: (page: number, limit: number) =>
    axios.request({
      url: "message/getMessageListOfMention?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  commentList: (postid: number | string, page: number, limit: number) =>
    axios.request({
      url: "comment/getListPublic?post_id=" + postid + "&page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  replyList: (commentid: number | string, page: number, limit: number) =>
    axios.request({
      url: "comment/getRepliesPublic?comment_id=" + commentid + "&page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  commentLikeStatus: (commentid: number | string) =>
    axios.request({
      url: "comment/getLikeStatus?comment_id=" + commentid,
      method: "GET",
    }),
  createComment: (data: any) =>
    axios.request({
      url: "comment/createComment",
      data: data,
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
    }),
  commentDetail: (id: number | string) =>
    axios.request({
      url: "comment/getDetailPublic?comment_id=" + id,
      method: "GET",
    }),
  likeComment: (data: any) =>
    axios.request({
      url: "comment/like",
      data: data,
      method: "POST",
    }),
  deleteComment: (data: any) =>
    axios.request({
      url: "comment/delete",
      data: data,
      method: "POST",
    }),

  likePost: (data: any) =>
    axios.request({
      url: "post/like",
      data: data,
      method: "POST",
    }),
  dislikePost: (data: any) =>
    axios.request({
      url: "post/dislike",
      data: data,
      method: "POST",
    }),

  getUserId: (data: any) =>
    axios.request({
      url: "comment/getUserIdByNicknamePublic",
      data: data,
      method: "POST",
    }),
  addKyc: (data: any) =>
    axios.request({
      url: "user/addKyc",
      data: data,
      method: "POST",
    }),
  kycDetail: () =>
    axios.request({
      url: "user/getLastkyc",
      method: "GET",
    }),
  modifyKycEmail: () =>
    axios.request({
      url: "user/modifyKycEmail",
      method: "GET",
    }),

  getCode: () =>
    axios.request({
      url: "login/getCountryCode",
      method: "POST",
    }),

  report: (data: any) =>
    axios.request({
      url: "report/create",
      data: data,
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
    }),

  issueInvoice: (data: any) =>
    axios.request({
      url: "order/issueInvoice",
      data: data,
      method: "POST",
    }),
  downInvoice: (order_id: string) =>
    axios.request({
      url: "order/downloadInvoice?order_id=" + order_id,
      method: "GET",
      responseType: "blob"
    }),

  checkRechargeUser: (data: any) =>
    axios.request({
      url: "post/checkNewUser",
      data: data,
      method: "POST",
    }),
  checkPromoCode: (data: any) =>
    axios.request({
      url: "post/checkPromoCode",
      data: data,
      method: "POST",
    }),

  getCollection: (type: number | string, page: number, limit: number, user_id: number | string ) =>
    axios.request({
      url: "book/getBookListPublic?type=" + type + '&page=' + page + '&limit=' + limit + '&user_id=' + user_id,
      method: "GET"
    }),
  addCollection: (data: any) =>
    axios.request({
      url: "book/addBook",
      data: data,
      method: "POST",
    }),
  searchCollection: (data: any) =>
    axios.request({
      url: "book/searchBooks",
      data: data,
      method: "POST",
    }),
  searchFullCollection: (data: any) =>
    axios.request({
      url: "book/searchBookFullname",
      data: data,
      method: "POST",
    }),
  searchSessionId: (data: any) =>
    axios.request({
      url: "book/searchBookBySessionId",
      data: data,
      method: "POST",
    }),

  modifyCollection: (data: any) =>
    axios.request({
      url: "book/updateBookName",
      data: data,
      method: "POST",
    }),
  deleteCollection: (data: any) =>
    axios.request({
      url: "book/deleteBook",
      data: data,
      method: "POST",
    }),
  batchModifyPostAccessRights: (data: any) =>
    axios.request({
      url: "book/batchModifyPostAccessRights",
      data: data,
      method: "POST",
    }),
  getCollectionDetail: (bookId: string | number) =>
    axios.request({
      url: "book/getBookDetailPublic?book_id=" + bookId,
      method: "GET"
    }),
  getSelfCollectionDetail: (bookId: string | number ) =>
    axios.request({
      url: "book/getBookDetail?book_id=" + bookId,
      method: "GET"
    }),
  recordHistory: (data: any) =>
    axios.request({
      url: "post/writeHistory",
      data: data,
      method: "POST",
    }),
  blockUser: (data: any) =>
    axios.request({
      url: "user/blackUser",
      data: data,
      method: "POST",
    }),
  unblockUser: (data: any) =>
    axios.request({
      url: "user/unblackUser",
      data: data,
      method: "POST",
    }),

  getProject: (publish_type: number, type: string, page: number, limit: number, has_chapter: number, isNsfw?: number) =>
    axios.request({
      url: "app/project/list?is_publish=" + publish_type + '&story_type=' + type + '&page=' + page + '&limit=' + limit + '&has_chapter=' + has_chapter + '&is_nsfw=' + (isNsfw ?? getProjectNsfwFilter()),
      method: "GET",
      baseURL: aiUrl,
    }),
  readSingleProject: (data: any) =>
    axios.request({
      url: `app/project/set_readed`,
      data: data,
      method: "POST",
      baseURL: aiUrl,
    }),
  getCharacters: (type: number, page: number, limit: number) =>
    axios.request({
      url: `app/config/characters?type=${type}&page=${page}&limit=${limit}`,
      method: "GET",
      baseURL: aiUrl,
    }),
  getStoryStyles: () =>
    axios.request({
      url: "app/config/story-styles",
      method: "GET",
      baseURL: aiUrl,
    }),
  computeDetail: (type: number, start: string, end: string, page: number, limit: number) =>
    axios.request({
      url: `user/getPowerLedgerList?type=${type}&date_start=${start}&date_end=${end}&page=${page}&limit=${limit}`,
      method: "GET",
    }),
  computeExpired: (start: string, end: string, page: number, limit: number) =>
    axios.request({
      url: `user/getPowerExpiredList?date_start=${start}&date_end=${end}&page=${page}&limit=${limit}`,
      method: "GET",
    }),

  computeConsume: (start: string, end: string, page: number, limit: number) =>
    axios.request({
      url: `app/credit/usage?date_start=${start}&date_end=${end}&page=${page}&limit=${limit}`,
      method: "GET",
      baseURL: aiUrl,
    }),
  userBalance: () =>
    axios.request({
      url: "app/credit/balance",
      method: "GET",
      baseURL: aiUrl,
    }),
  userSelect: (session_id: string) =>
    axios.request({
      url: `app/config/user-selected?session_id=${session_id}`,
      method: "GET",
      baseURL: aiUrl,
    }),
  estimateTime: (session_id: string) =>
    axios.request({
      url: `ai/novel/time/estimate?session_id=${session_id}`,
      method: "GET",
      baseURL: aiUrl,
    }),
  detailProject: (session_id: string) =>
    axios.request({
      url: `app/project/${session_id}`,
      method: "GET",
      baseURL: aiUrl,
    }),
  extractVideoTail: (data: any) =>
    axios.request({
      url: "ai/simple_video/extract_video_tail",
      method: "POST",
      baseURL: aiUrl,
      data,
    }),
  modifyProject: (data: any) =>
    axios.request({
      url: "app/project/rename",
      data: data,
      method: "POST",
      baseURL: aiUrl,
    }),
  deleteProject: (data: any) =>
    axios.request({
      url: "app/project/delete",
      data: data,
      method: "POST",
      baseURL: aiUrl,
    }),
  novelOutline: (data: any) =>
    axios.request({
      url: "ai/novel/generate_novel_outline",
      data: data,
      method: "POST",
      baseURL: aiUrl,
    }),
  novelNext: (data: any) =>
    axios.request({
      url: "ai/novel/generate_novel_next_chapter",
      data: data,
      method: "POST",
      baseURL: aiUrl,
    }),
  novelAll: (data: any) =>
    axios.request({
      url: "ai/novel/generate_novel_all_chapters",
      data: data,
      method: "POST",
      baseURL: aiUrl,
    }),
  novelEstimate: (data: any) =>
    axios.request({
      url: "ai/novel/points/estimate",
      data: data,
      method: "POST",
      baseURL: aiUrl,
    }),
  taskPolling: (task_id: string) =>
    axios.request({
      url: `app/task_status?task_id=` + task_id,
      method: "GET",
      baseURL: aiUrl,
    }),
  coverTaskPolling: (task_id: string) =>
    axios.request({
      url: `app/task_status?task_id=` + task_id,
      method: "GET",
      baseURL: aiUrl,
    }),
  detailChapter: (session_id: string, chapter: number | string) =>
    axios.request({
      url: `app/chapter/${session_id}/${chapter}`,
      method: "GET",
      baseURL: aiUrl,
    }),
  totalProcess: (verbose: boolean, isNsfw?: number) =>
    axios.request({
      url: `app/progress/display?verbose=` + verbose + (isNsfw !== undefined ? '&is_nsfw=' + isNsfw : ''),
      method: "GET",
      baseURL: aiUrl,
    }),
  readProject: () =>
    axios.request({
      url: "app/progress/set-all-readed",
      method: "POST",
      baseURL: aiUrl,
    }),
  modifyChapterTitle: (data: any) =>
    axios.request({
      url: "app/chapter/rename",
      method: "POST",
      baseURL: aiUrl,
      data,
    }),
  modifyChapterContent: (data: any) =>
    axios.request({
      url: "app/chapter/content/update",
      method: "POST",
      baseURL: aiUrl,
      data,
    }),
  chapterStream: (sessionId: string) =>
    axios.request({
      url: `app/stream_read/${sessionId}`,
      method: "GET",
      baseURL: aiUrl,
    }),
  singleCollection: (book_id: string | number, page: number, limit: number) =>
    axios.request({
      url: `book/getBookChaptersListPublic?book_id=${book_id}&page=${page}&limit=${limit}`,
      method: "GET"
    }),

  singleCollectionIndex: (book_id: string | number) =>
    axios.request({
      url: `book/getBookChapters?book_id=${book_id}`,
      method: "GET"
    }),
  generateCover: (data: any) =>
    axios.request({
      url: "ai/novel/generate_novel_cover_by_prompt",
      method: "POST",
      baseURL: aiUrl,
      data,
    }),
  taskGgenerateCover: (task_id: string) =>
    axios.request({
      url: "app/task_status?task_id=" + task_id,
      method: "GET",
      baseURL: aiUrl,
    }),
  singleTaskList: (page: number, limit: number, type: string, isFilterFailed?: boolean, isNsfw?: number) =>
    axios.request({
      url: `app/progress/simple-task-list?page=${page}&limit=${limit}&story_type=${type}&is_nsfw=${isNsfw ?? getProjectNsfwFilter()}${isFilterFailed ? '&is_filter_failed=true' : ''}`,
      method: "GET",
      baseURL: aiUrl,
    }),
  generateSinglePhoto: (data: any) =>
    axios.request({
      url: "ai/simple_image/generate_simple_image",
      method: "POST",
      baseURL: aiUrl,
      data,
    }),
  generateSingleVideo: (data: any) =>
    axios.request({
      url: "ai/simple_video/generate_simple_video",
      method: "POST",
      baseURL: aiUrl,
      data,
    }),

  uploadAduio: (data: any) =>
    axios.request({
      url: "user/getCosUploadPreSignUrl",
      method: "POST",
      data,
    }),

  photoCreate: (data: any) =>
    axios.request({
      url: "ai/photo/create",
      method: "POST",
      baseURL: aiUrl,
      data,
    }),

  aIRechargePlan: (mode?: string) =>
    axios.request({
      url: "index/getAIRechargePlan" + (mode ? `?mode=${mode}` : ''),
      method: "GET",
    }),
  getAIUPlanListPublic: (mode?: string) =>
    axios.request({
      url: "index/getAIUPlanListPublic" + (mode ? `?mode=${mode}` : ''),
      method: "GET",
    }),
  getFirstMonthDiscountStatus: () =>
    axios.request({
      url: "user/getFirstMonthDiscountStatus",
      method: "GET",
    }),
  getBanner: () =>
    axios.request({
      url: "index/getIndexBannerPublic",
      params: { channel: 1 },
      method: "GET",
    }),
  getProjectInfoPublic: (session_id: string) =>
    axios.request({
      url: "index/getProjectInfoPublic?session_id=" + session_id,
      method: "GET",
    }),
  getRelativeByTopicPublic: (data: any) =>
    axios.request({
      url: "index/getRelativeByTopicPublic",
      data: data,
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
    }),
  getSubtitlesPublic: (data: any) =>
    axios.request({
      url: "post/getSubtitlesPublic",
      data: data,
      method: "POST",
    }),
};
