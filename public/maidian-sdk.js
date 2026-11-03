/**
 * Maidian SDK v1.0.0 —— 自家埋点客户端 SDK（类 gtag.js 用法）
 *
 * 在示例 SDK（maidian_demo/maidian-sdk.js）的壳上，换成了生产可用的发送内核：
 *   - 队列存 localStorage：刷新 / 关页 / 发失败都不丢，下次打开接着发
 *   - 近实时小批量：事件触发后等 5 秒合并（期间的一起发），攒够 20 条立即发；低优先级事件只捎带不触发定时器
 *   - 失败按 2s → 4s → … → 60s 退避重试；4xx（除 429）是数据本身被拒，丢弃不重发
 *   - 每条事件带 event_id（uuid），后端按它去重（重发 / beacon 双发不会多算）
 *   - 关页 / 切后台用 sendBeacon（text/plain，跨域不用预检），不行再 fetch keepalive
 *   - 会话：sessionStorage 存 session_id，30 分钟无动作开新会话，自动报 session_start / session_end
 *   - 公共字段每条带：session_id / event_id / platform / device(pc|mobile|tablet) / os / browser / page_url / referrer …
 *   - 全链路 try/catch，上报域名不通、无痕模式禁 storage 都不影响业务页
 *
 * 接口（后端 Maidian API）：POST {server_url}/api/v1/track/batch
 *   { "events": [ { app_id, event, distinct_id, user_id, timestamp, extra_data } ] }
 *
 * 用法（和 GA 一样，先放预队列再异步加载脚本）：
 *   <script>
 *     window.maidianQueue = window.maidianQueue || [];
 *     function maidian(){ window.maidianQueue.push(arguments); }
 *     maidian('config', 'web_xxxxxxxx', { server_url: 'https://track-test.blfans.ai' });
 *   </script>
 *   <script async src="/maidian-sdk.js"></script>
 *
 *   maidian('set', { user_id: 10086 });                 // 登录后设置；退出登录 maidian('set', { user_id: null })
 *   maidian('event', 'page_view', { page_name: 'home' }); // 报事件
 *   maidian('event', 'video_play_progress', {...}, { lowPriority: true }); // 高频事件，只捎带发
 *   maidian('flush');                                   // 立即发
 *   maidian('get_distinct_id') / maidian('get_session_id')
 *
 * config 可选项（都有默认值）：
 *   server_url      上报服务根地址（默认 https://track-test.blfans.ai）
 *   batch_path      批量上报路径（默认 /api/v1/track/batch）
 *   flush_delay     合并窗口 ms（默认 5000）
 *   batch_size      攒够多少条立即发（默认 20）
 *   queue_cap       本地最多攒多少条，超过丢最旧的（默认 500）
 *   session_timeout 会话超时 ms（默认 30 分钟）
 *   distinct_id     外部指定设备 id（比如传 GA client_id，和 GA 报表对得上）；不传自己生成并存 localStorage
 *   platform        端（默认 'web'；App 内嵌 H5 可传 'ios' / 'android'）
 *   app_version     应用版本，放进每条事件的 extra_data
 *   auto_pv         config 后自动报一条 page_view（默认 false，SPA 由路由自己报）
 *   auto_session    自动报 session_start / session_end（默认 true）
 *   send_user_agent extra_data 里带 user_agent（默认 false，后端从请求头取）
 *   enabled         总开关（默认 true；false 时不入队、不存、不发）
 *   debug           控制台打日志（默认 false）
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MaidianSDK = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var SDK_VERSION = '1.0.0';

  var DEFAULT_CONFIG = {
    server_url: 'https://track-test.blfans.ai',
    batch_path: '/api/v1/track/batch',
    flush_delay: 5000,
    batch_size: 20,
    queue_cap: 500,
    retry_base: 2000,
    retry_max: 60000,
    session_timeout: 30 * 60 * 1000,
    distinct_id: '',
    platform: 'web',
    app_version: '',
    auto_pv: false,
    auto_session: true,
    send_user_agent: false,
    enabled: true,
    debug: false,
    storage_prefix: '__maidian_'
  };

  // fetch keepalive 的 body 上限约 64KB，超过就不加 keepalive
  var KEEPALIVE_LIMIT = 60 * 1024;

  var hasWindow = typeof window !== 'undefined';
  var hasDocument = typeof document !== 'undefined';
  var hasNavigator = typeof navigator !== 'undefined';

  // ---------------------------------------------------------------- 工具

  function log(cfg, type, msg, data) {
    if (!cfg || !cfg.debug || typeof console === 'undefined') return;
    var fn = console[type] || console.log;
    try { fn.call(console, '[Maidian] ' + msg, data !== undefined ? data : ''); } catch (e) {}
  }

  function storage(kind) {
    return {
      get: function (key) {
        try { return hasWindow && window[kind] ? window[kind].getItem(key) : null; } catch (e) { return null; }
      },
      set: function (key, val) {
        try { if (hasWindow && window[kind]) window[kind].setItem(key, val); } catch (e) {}
      },
      remove: function (key) {
        try { if (hasWindow && window[kind]) window[kind].removeItem(key); } catch (e) {}
      }
    };
  }
  var local = storage('localStorage');
  var session = storage('sessionStorage');

  function uuid() {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    } catch (e) {}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function now() { return new Date().getTime(); }

  function assign(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (!src) continue;
      for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
    }
    return target;
  }

  function toUserId(v) {
    // 后端 user_id 是数字；安全范围内的数字串转数字，其它原样给（空 / 非法 → null）
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    var s = String(v);
    if (/^\d{1,15}$/.test(s)) return Number(s);
    return s;
  }

  // 设备 / 系统 / 浏览器：前端判好，后端不用解析 UA
  function detectDevice(ua) {
    if (/iPad|Macintosh.*Mobile|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
    if (/Mobile|iPhone|iPod|Android|Windows Phone/i.test(ua)) return 'mobile';
    return 'pc';
  }
  function detectOS(ua) {
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Android/i.test(ua)) return 'Android';
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    return 'other';
  }
  function detectBrowser(ua) {
    if (/Edg\//i.test(ua)) return 'Edge';
    if (/OPR\/|Opera/i.test(ua)) return 'Opera';
    if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return 'Chrome';
    if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
    if (/Firefox\//i.test(ua)) return 'Firefox';
    return 'other';
  }

  // ---------------------------------------------------------------- 客户端

  function Client() {
    this.config = assign({}, DEFAULT_CONFIG);
    this.app_id = '';
    this.distinct_id = '';
    this.user_id = null;
    this.common_props = {};
    this.env = {};              // 一次算好的环境字段（device / os / browser / screen / language）
    this.queue = [];
    this.timer = null;
    this.flushing = false;
    this.failCount = 0;
    this.initialized = false;
    this.pageViews = 0;         // 本会话 page_view 次数
    this.sessionEnded = false;  // 本会话 session_end 已报
    this.keys = {};
  }

  Client.prototype.init = function (appId, options) {
    try {
      if (!appId || typeof appId !== 'string') { log({ debug: true }, 'warn', "config 缺少 app_id"); return; }
      this.app_id = appId;
      if (options && typeof options === 'object') {
        if (typeof options.server_url === 'string') options.server_url = options.server_url.replace(/\/+$/, '');
        this.config = assign({}, this.config, options);
      }
      var p = this.config.storage_prefix;
      this.keys = { distinct: p + 'distinct_id__', queue: p + 'queue__', session: p + 'session_id__', active: p + 'session_active__', pv: p + 'session_pv__' };

      this.distinct_id = this._getOrCreateDistinctId();
      this.env = this._collectEnv();
      this.queue = this._loadQueue();

      if (!this.initialized) this._bindListeners();
      this.initialized = true;
      log(this.config, 'log', '初始化 app_id=' + this.app_id + ' distinct_id=' + this.distinct_id, this.config);

      if (!this.config.enabled) return;
      if (this.config.auto_session) this._sessionId(); // 冷启动即报 session_start
      if (this.config.auto_pv) this.track('page_view', {});
      // 上次没发完的，稍后带上
      if (this.queue.length > 0) this._armTimer(this.config.flush_delay);
    } catch (e) {
      log(this.config, 'error', 'init 异常', e);
    }
  };

  Client.prototype.set = function (props) {
    try {
      if (!props || typeof props !== 'object') return;
      if ('user_id' in props) {
        this.user_id = toUserId(props.user_id);
        props = assign({}, props);
        delete props.user_id;
      }
      this.common_props = assign({}, this.common_props, props);
      log(this.config, 'log', '更新全局属性', this.common_props);
    } catch (e) {
      log(this.config, 'error', 'set 异常', e);
    }
  };

  /**
   * 报一条事件
   * @param {string} eventName
   * @param {object} eventData  事件参数，进 extra_data
   * @param {object} opts       { lowPriority: true } 高频低价值事件：只入队不起定时器，等别的事件发送时捎上 / 攒够 batch_size / 关页时发
   */
  Client.prototype.track = function (eventName, eventData, opts) {
    try {
      if (!this.config.enabled) return;
      if (!eventName || typeof eventName !== 'string') return;
      if (!this.app_id) log(this.config, 'warn', "还没 config，事件会带 app_id=unknown_app：" + eventName);
      var lowPriority = !!(opts && opts.lowPriority);
      var ts = now();
      var sid = this.config.auto_session ? this._sessionId() : '';
      if (eventName === 'page_view') { this.pageViews++; session.set(this.keys.pv, String(this.pageViews)); }

      var extra = assign({}, this._pageEnv(), this.env, {
        sdk_version: SDK_VERSION,
        platform: this.config.platform,
        app_version: this.config.app_version || '',
        session_id: sid,
        event_id: uuid()
      }, this.common_props, (eventData && typeof eventData === 'object') ? eventData : {});

      var payload = {
        app_id: this.app_id || 'unknown_app',
        event: eventName,
        distinct_id: this.distinct_id || null,
        user_id: this.user_id,
        timestamp: ts,
        extra_data: extra
      };
      this._enqueue(payload, lowPriority);
    } catch (e) {
      log(this.config, 'error', 'track 异常', e);
    }
  };

  Client.prototype.trackBatch = function (events) {
    try {
      if (!Array.isArray(events)) return;
      for (var i = 0; i < events.length; i++) {
        var item = events[i];
        if (item && item.event) this.track(item.event, item.extra_data || item.params || {}, item.opts);
      }
    } catch (e) {
      log(this.config, 'error', 'batch 异常', e);
    }
  };

  // ---------------------------------------------------------------- 队列

  Client.prototype._enqueue = function (payload, lowPriority) {
    this.queue.push(payload);
    if (this.queue.length > this.config.queue_cap) this.queue.splice(0, this.queue.length - this.config.queue_cap);
    this._saveQueue();
    log(this.config, 'log', '入队 ' + payload.event + (lowPriority ? '（低优先级）' : '') + '，队列 ' + this.queue.length);
    if (this.failCount > 0) this._armTimer(this._retryDelay());          // 正在退避重试：按重试间隔来，别打爆接口
    else if (this.queue.length >= this.config.batch_size) this.flush(false);
    else if (!lowPriority) this._armTimer(this.config.flush_delay);
  };

  Client.prototype._loadQueue = function () {
    try {
      var raw = local.get(this.keys.queue);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  };
  Client.prototype._saveQueue = function () {
    try {
      if (this.queue.length === 0) local.remove(this.keys.queue);
      else local.set(this.keys.queue, JSON.stringify(this.queue));
    } catch (e) {}
  };

  Client.prototype._armTimer = function (delay) {
    var self = this;
    if (this.timer) return;
    this.timer = setTimeout(function () { self.timer = null; self.flush(false); }, delay);
  };
  Client.prototype._retryDelay = function () {
    return Math.min(this.config.retry_max, this.config.retry_base * Math.pow(2, Math.max(0, this.failCount - 1)));
  };

  /**
   * 把队列里的事件发出去
   * @param {boolean} unloading 关页 / 切后台：用 sendBeacon，一次把剩下的全送出，不等响应
   */
  Client.prototype.flush = function (unloading) {
    try {
      if (!this.config.enabled) return;
      if (this.timer) { clearTimeout(this.timer); this.timer = null; }
      if (this.queue.length === 0) return;
      if (unloading) return this._flushBeacon();
      if (this.flushing) return;
      this.flushing = true;

      var self = this;
      var events = this.queue.slice(0, this.config.batch_size);
      var body = JSON.stringify({ events: events });
      var url = this.config.server_url + this.config.batch_path;
      log(this.config, 'log', '发送 ' + events.length + ' 条');

      var done = function (ok, status) {
        self.flushing = false;
        if (ok) {
          self.queue = self.queue.slice(events.length);
          self._saveQueue();
          self.failCount = 0;
          log(self.config, 'log', '已上报 ' + events.length + ' 条');
        } else if (status >= 400 && status < 500 && status !== 429) {
          // 这批数据后端不认（格式错 / 太大），重发也不会好，丢掉别卡住后面的
          self.queue = self.queue.slice(events.length);
          self._saveQueue();
          log(self.config, 'warn', '上报被拒 HTTP ' + status + '，已丢弃 ' + events.length + ' 条');
        } else {
          self.failCount++;
          log(self.config, 'warn', '上报失败' + (status ? ' HTTP ' + status : '') + '，' + self._retryDelay() / 1000 + 's 后重试');
        }
        // 还有剩：成功了接着发，失败了按退避间隔再试
        if (self.queue.length > 0) self._armTimer(self.failCount > 0 ? self._retryDelay() : 0);
      };

      if (hasWindow && typeof window.fetch === 'function') {
        var opt = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body };
        if (body.length < KEEPALIVE_LIMIT) opt.keepalive = true;
        window.fetch(url, opt)
          .then(function (res) { done(res.ok, res.status); })
          .catch(function () { done(false, 0); });
      } else {
        this._xhr(url, body, done);
      }
    } catch (e) {
      this.flushing = false;
      log(this.config, 'error', 'flush 异常', e);
    }
  };

  Client.prototype._xhr = function (url, body, done) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) done(xhr.status >= 200 && xhr.status < 300, xhr.status);
      };
      xhr.onerror = function () { done(false, 0); };
      xhr.send(body);
    } catch (e) { done(false, 0); }
  };

  /** 关页 / 切后台：sendBeacon 不返回结果，发出去就当成功；发不出去留在本地下次打开再发 */
  Client.prototype._flushBeacon = function () {
    var url = this.config.server_url + this.config.batch_path;
    var sent = 0;
    while (this.queue.length > 0) {
      var events = this.queue.slice(0, this.config.batch_size);
      var body = JSON.stringify({ events: events });
      var ok = false;
      if (hasNavigator && typeof navigator.sendBeacon === 'function') {
        // text/plain 是简单请求，跨域不用预检（application/json 的 Blob 会被浏览器拒掉）；后端要按 JSON 解析 text/plain
        try { ok = navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' })); } catch (e) { ok = false; }
      }
      if (!ok && hasWindow && typeof window.fetch === 'function' && body.length < KEEPALIVE_LIMIT) {
        try { window.fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {}); ok = true; } catch (e) {}
      }
      if (!ok) break;
      this.queue = this.queue.slice(events.length);
      sent += events.length;
    }
    this._saveQueue();
    if (sent) log(this.config, 'log', '离开页面，beacon 送出 ' + sent + ' 条');
  };

  // ---------------------------------------------------------------- 会话

  /** 当前会话 id：30 分钟没动作开新会话；新会话先补上一个的 session_end 再报 session_start */
  Client.prototype._sessionId = function () {
    var t = now();
    var sid = session.get(this.keys.session);
    var last = Number(session.get(this.keys.active)) || 0;
    var fresh = !sid;
    var expired = !!sid && last > 0 && t - last > this.config.session_timeout;
    if (fresh || expired) {
      if (expired) this._sessionEnd(last);
      sid = 's_' + uuid().slice(0, 12);
      session.set(this.keys.session, sid);
      session.set(this.keys.pv, '0');
      this.pageViews = 0;
      this.sessionEnded = false;
      session.set(this.keys.active, String(t));
      this._emitRaw('session_start', { start_reason: fresh ? 'cold_start' : 'timeout_restart', session_id: sid });
    } else {
      session.set(this.keys.active, String(t));
      if (this.pageViews === 0) this.pageViews = Number(session.get(this.keys.pv)) || 0;
    }
    return sid;
  };

  Client.prototype._sessionEnd = function (lastActive) {
    if (this.sessionEnded) return;
    var sid = session.get(this.keys.session);
    if (!sid) return;
    var start = Number(session.get(this.keys.session + 'start')) || 0;
    var end = lastActive || now();
    this.sessionEnded = true;
    this._emitRaw('session_end', {
      session_id: sid,
      duration: start ? Math.max(0, Math.round((end - start) / 1000)) : 0,
      page_views: Number(session.get(this.keys.pv)) || this.pageViews || 0
    });
  };

  /** 不经过 _sessionId（避免递归）的内部事件 */
  Client.prototype._emitRaw = function (eventName, params) {
    if (!this.config.enabled) return;
    if (eventName === 'session_start') session.set(this.keys.session + 'start', String(now()));
    var extra = assign({}, this._pageEnv(), this.env, {
      sdk_version: SDK_VERSION, platform: this.config.platform, app_version: this.config.app_version || '', event_id: uuid()
    }, this.common_props, params);
    this._enqueue({
      app_id: this.app_id || 'unknown_app', event: eventName, distinct_id: this.distinct_id || null,
      user_id: this.user_id, timestamp: now(), extra_data: extra
    }, false);
  };

  // ---------------------------------------------------------------- 环境

  Client.prototype._getOrCreateDistinctId = function () {
    if (this.config.distinct_id) { local.set(this.keys.distinct, this.config.distinct_id); return this.config.distinct_id; }
    var id = local.get(this.keys.distinct);
    if (!id || typeof id !== 'string' || id.length < 10) { id = uuid(); local.set(this.keys.distinct, id); }
    return id;
  };

  Client.prototype._collectEnv = function () {
    var env = {};
    try {
      var ua = hasNavigator ? (navigator.userAgent || '') : '';
      env.device = detectDevice(ua);
      env.os = detectOS(ua);
      env.browser = detectBrowser(ua);
      if (hasNavigator) env.language = navigator.language || '';
      if (hasWindow && window.screen) { env.screen_width = window.screen.width || 0; env.screen_height = window.screen.height || 0; }
      if (this.config.send_user_agent) env.user_agent = ua;
    } catch (e) {}
    return env;
  };

  Client.prototype._pageEnv = function () {
    var env = {};
    try {
      if (hasWindow && window.location) env.page_url = window.location.href;
      if (hasDocument) { env.page_title = document.title || ''; env.referrer = document.referrer || ''; }
    } catch (e) {}
    return env;
  };

  // ---------------------------------------------------------------- 生命周期

  Client.prototype._bindListeners = function () {
    var self = this;
    if (!hasWindow) return;
    var onHide = function () {
      try {
        if (self.config.auto_session) self._sessionEnd();
        self.flush(true);
      } catch (e) {}
    };
    try {
      if (hasDocument) {
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'hidden') onHide();
          else if (self.config.auto_session && self.sessionEnded) {
            // 回到前台：没超时 → 同一会话继续，报 resume；超时 → _sessionId 里会开新会话
            var last = Number(session.get(self.keys.active)) || 0;
            if (last && now() - last <= self.config.session_timeout) {
              self.sessionEnded = false;
              self._emitRaw('session_start', { start_reason: 'resume', session_id: session.get(self.keys.session) });
            } else {
              self._sessionId();
            }
          }
        });
      }
      window.addEventListener('pagehide', onHide, false);
    } catch (e) {}
  };

  // ---------------------------------------------------------------- 门面

  var instance = new Client();

  function maidian() {
    var args = Array.prototype.slice.call(arguments);
    if (args.length === 0) return;
    var cmd = args[0];
    try {
      switch (cmd) {
        case 'config': instance.init(args[1], args[2]); break;
        case 'set': instance.set(args[1]); break;
        case 'event': instance.track(args[1], args[2], args[3]); break;
        case 'batch': instance.trackBatch(args[1]); break;
        case 'flush': instance.flush(false); break;
        case 'get_distinct_id': return instance.distinct_id;
        case 'get_session_id': return instance.config.auto_session ? instance._sessionId() : '';
        case 'get_queue_length': return instance.queue.length;
        default: log(instance.config, 'warn', '未知指令: ' + cmd);
      }
    } catch (e) {
      log(instance.config, 'error', '执行指令出错: ' + cmd, e);
    }
  }
  maidian._client = instance;
  maidian.version = SDK_VERSION;

  // 接管脚本加载前攒在 window.maidianQueue 里的命令（和 gtag 的 dataLayer 一样）
  (function processQueue() {
    if (!hasWindow) return;
    var pending = window.maidianQueue || [];
    window.maidian = maidian;
    if (Array.isArray(pending) && pending.length > 0) {
      for (var i = 0; i < pending.length; i++) {
        var item = pending[i];
        if (item && item.length) maidian.apply(null, item);
      }
      window.maidianQueue = [];
    }
  })();

  return maidian;
});
