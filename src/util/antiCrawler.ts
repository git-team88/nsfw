import CryptoJS from 'crypto-js';

interface AuthParams {
  ts: string;
  sign: string;
}

function md5(str: string): string {
  return CryptoJS.MD5(str).toString();
}

function detectDevTools(): boolean {
  let detected = false;

  // const check = (): number => {
  //   const s = performance.now();
  //   (() => {}).constructor('debugger')();
  //   return performance.now() - s;
  // };

  // if (check() > 100) detected = true;

  // const log = console.log;
  // console.log = function (...args: any[]) {
  //   detected = true;
  //   log.apply(console, args);
  // };

  return detected;
}

function isRealBrowser(): boolean {
  try {
    if (
      typeof process !== 'undefined' &&
      (process as any).versions?.node
    ) {
      return false;
    }

    if (
      typeof window == 'undefined' ||
      typeof document == 'undefined' ||
      typeof navigator == 'undefined'
    ) {
      return false;
    }

    if ((navigator as any).webdriver) return false;
    if (/HeadlessChrome/.test(navigator.userAgent)) return false;

    return !detectDevTools();
  } catch (e) {
    return false;
  }
}

function getDefaultToken(): string {
  const prefix = String.fromCharCode(97, 100, 100);
  const middle = String.fromCharCode(97, 105, 97, 114);
  const suffix = String.fromCharCode(111, 111, 116);
  const rawString = prefix + middle + suffix;
  return btoa(rawString);
}

function generateAuthParams(token: string): AuthParams {
  const ts = Math.floor(Date.now() / 1000).toString();

  if (!isRealBrowser()) {
    return {
      ts,
      sign: md5(`mock_trap_${ts}`)
    };
  }

  if (token) {
    const _ = (...codes: number[]) => String.fromCharCode(...codes);

    const key = _(0x34, 0x35, 0x34, 0x62, 0x35);
    const a = token.slice(0, 16);
    const b = token.slice(16, 21).split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i) ^ 0x5A)
    ).join('');
    const c = token.slice(21, 40);
    const d = String.fromCharCode(token.charCodeAt(40) ^ 0x38);
    const e = token.slice(41);

    const salt = a +
      b.split('').map((c, i) =>
        String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i) ^ 0x5A)
      ).join('') +
      c +
      String.fromCharCode(d.charCodeAt(0) ^ 0x38) +
      e;

    return {
      ts,
      sign: md5(salt + ts)
    };
  } else {
    const salt = atob(getDefaultToken());

    return {
      ts,
      sign: md5(salt + ts)
    };
  }
}

window.AntiCrawler = {
  generateAuthParams
}
