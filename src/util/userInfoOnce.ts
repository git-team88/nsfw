// user/getInfo 去重：同一页面里几个组件同时挂载各拉一次（详情页的两个 PromptComposer + uid 补拉），
// 合并成一次请求。只合并「同时发起」的，请求回来几秒后缓存就清掉，不影响后面要拿最新数据的地方。
import api from "@/api/index";

let pending: Promise<any> | null = null;
let pendingToken = "";

/** 拉当前登录用户信息（user/getInfo 的 data）；没登录 / 失败返回 null */
export function fetchUserInfoOnce(): Promise<any> {
  const token = localStorage.getItem("token") || "";
  if (!token) return Promise.resolve(null);
  if (pending && pendingToken === token) return pending;
  pendingToken = token;
  const req = (api.userInfo() as Promise<any>)
    .then((r: any) => (r?.code === 0 || r?.code === 200 ? r.data : null))
    .catch(() => null);
  pending = req;
  req.finally(() => {
    // 3 秒后释放：这段时间内再调用的还是同一次请求
    setTimeout(() => { if (pending === req) pending = null; }, 3000);
  });
  return req;
}
