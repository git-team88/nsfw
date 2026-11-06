// public/maidian-sdk.js 的类型声明（SDK 通过 <script async> 引入，挂在 window.maidian 上）
// 用法见 public/maidian-sdk.js 头部注释

export {};

declare global {
  interface MaidianConfigOptions {
    /** 上报服务根地址，默认 https://track.blfans.ai */
    server_url?: string;
    /** 批量上报路径，默认 /api/v1/track/batch */
    batch_path?: string;
    /** 合并窗口 ms，默认 5000 */
    flush_delay?: number;
    /** 攒够多少条立即发，默认 20 */
    batch_size?: number;
    /** 本地最多攒多少条，默认 500 */
    queue_cap?: number;
    /** 失败首次重试间隔 ms，默认 2000 */
    retry_base?: number;
    /** 重试间隔上限 ms，默认 60000 */
    retry_max?: number;
    /** 会话超时 ms，默认 30 分钟 */
    session_timeout?: number;
    /** 外部指定设备 id（如 GA client_id）；不传自己生成存 localStorage */
    distinct_id?: string;
    /** 端：web / ios / android，默认 web */
    platform?: string;
    /** 应用版本，进每条事件的 extra_data.app_version */
    app_version?: string;
    /** config 后自动报 page_view，默认 false */
    auto_pv?: boolean;
    /** 自动报 session_start / session_end，默认 true */
    auto_session?: boolean;
    /** extra_data 带 user_agent，默认 false */
    send_user_agent?: boolean;
    /** 总开关，默认 true */
    enabled?: boolean;
    /** 控制台日志，默认 false */
    debug?: boolean;
  }

  interface MaidianEventOptions {
    /** 高频低价值事件：只入队不起定时器，等别的事件发送时捎上 / 攒够 batch_size / 关页时发 */
    lowPriority?: boolean;
  }

  interface MaidianBatchItem {
    event: string;
    extra_data?: Record<string, unknown>;
    params?: Record<string, unknown>;
    opts?: MaidianEventOptions;
  }

  /** 后端 POST /api/v1/track/batch 里 events[] 的一条 */
  interface MaidianEventPayload {
    app_id: string;
    event: string;
    distinct_id: string | null;
    user_id: number | string | null;
    timestamp: number;
    extra_data: Record<string, unknown>;
  }

  interface MaidianFn {
    (cmd: "config", appId: string, options?: MaidianConfigOptions): void;
    /** user_id 设 null 表示退出登录；其它属性会合进每条事件的 extra_data */
    (cmd: "set", props: { user_id?: string | number | null; [k: string]: unknown }): void;
    (cmd: "event", eventName: string, params?: Record<string, unknown>, opts?: MaidianEventOptions): void;
    (cmd: "batch", events: MaidianBatchItem[]): void;
    (cmd: "flush"): void;
    (cmd: "get_distinct_id"): string;
    (cmd: "get_session_id"): string;
    (cmd: "get_queue_length"): number;
    version: string;
  }

  interface Window {
    /** SDK 加载后是真正的实现；加载前是把参数 push 进 maidianQueue 的桩函数 */
    maidian: MaidianFn;
    maidianQueue?: IArguments[];
  }
}
