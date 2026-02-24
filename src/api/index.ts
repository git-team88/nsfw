import axios from "../util/request";
import { aiUrl } from "../util/config";
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
  getSubscription: () =>
    axios.request({
      url: "post/getSubscriptionPlan",
      method: "GET",
    }),
  modifySubscription: (data: any) =>
    axios.request({
      url: "post/modifySubscriptionPlan",
      data: data,
      method: "POST",
    }),
  subscribe: (data: any) =>
    axios.request({
      url: "post/subscribe",
      data: data,
      method: "POST",
    }),
  homePostList: (page: number, limit: number, tab: string, type: number) =>
    axios.request({
      url: "index/getRecommendListPublic?page=" + page + "&limit=" + limit + "&tab=" + tab + '&type=' + type,
      method: "GET",
    }),
  homeFollowList: (page: number, limit: number, type: number) =>
    axios.request({
      url: "post/getMyFollowList?page=" + page + "&limit=" + limit + '&type=' + type,
      method: "GET",
    }),
  homeSubscriptionList: (page: number, limit: number, type: number) =>
    axios.request({
      url: "post/getMySubscriptionList?page=" + page + "&limit=" + limit + '&type=' + type,
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
      url: "post/searchPostsPublic",
      data: data,
      method: "POST",
    }),

  getVideoId: (data: any) =>
    axios.request({
      url: "user/getUploadId",
      data: data,
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
    }),
  getVideoUrl: (data: any) =>
    axios.request({
      url: "user/getPartUrl",
      data: data,
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
    }),
  getVideoMerge: (data: any) =>
    axios.request({
      url: "user/completeMultipartUpload",
      data: data,
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
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
  postDetail: (data: any) =>
    axios.request({
      url: "post/getPostDetailPublic",
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

  authorInfo: (author_id: number | string) =>
    axios.request({
      url: "blogger/getBloggerInfoPublic?author_id=" + author_id,
      method: "GET",
    }),
  authorHome: (type: number, page: number, limit: number, author_id: number | string, keywords: string, start: string, end: string) =>
    axios.request({
      url: "blogger/getPostListPublic?type=" + type+ "&page="+ + page + "&limit=" + limit + "&author_id=" + author_id + "&keywords=" + keywords + "&start_day=" + start + "&end_day=" + end,
      method: "GET",
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
  userFollowList: (page: number, limit: number) =>
    axios.request({
      url: "follow/getFollowedList?page=" + page + "&limit=" + limit,
      method: "GET",
    }),
  userPayList: (page: number, limit: number) =>
    axios.request({
      url: "order/getOrderList?page=" + page + "&limit=" + limit,
      method: "GET",
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

  userWorkList: (page: number, limit: number, start: string, end: string) =>
    axios.request({
      url: "stat/getDailyCountList?page="+ + page + "&limit=" + limit + "&start_day=" + start + "&end_day=" + end,
      method: "GET",
    }),
  userSingleWorkList: (page: number, limit: number, start: string, end: string) =>
    axios.request({
      url: "stat/getPostCountList?page="+ + page + "&limit=" + limit + "&start_day=" + start + "&end_day=" + end,
      method: "GET",
    }),
  userFansList: (page: number, limit: number, start: string, end: string) =>
    axios.request({
      url: "stat/getFansCountList?page="+ + page + "&limit=" + limit + "&start_day=" + start + "&end_day=" + end,
      method: "GET",
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
  likeComment: (data: any) =>
    axios.request({
      url: "comment/like",
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

  getProject: (publish_type: number, type: string, page: number, limit: number ) =>
    axios.request({
      url: "app/project/list?is_publish=" + publish_type + '&project_type=' + type + '&page=' + page + '&limit=' + limit,
      method: "GET",
      baseURL: aiUrl,
    }),
  getCharacters: () =>
    axios.request({
      url: "app/config/characters",
      method: "GET",
      baseURL: aiUrl,
    }),
  getStoryStyles: () =>
    axios.request({
      url: "app/config/story-styles",
      method: "GET",
      baseURL: aiUrl,
    }),
};
