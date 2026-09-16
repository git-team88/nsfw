// ---------------------------------------------------------------------------
// 文件 md5 的计算线程。
//
// md5 本身是串行的：每一块的结果要喂给下一块，拆到多个线程里算不出同一个值，
// 所以这里只有一个 worker —— 目的不是算得更快，是把这段 CPU 活儿从主线程挪走。
// 主线程上算的话，每 append 一片就卡住渲染十几到几十毫秒，几百 MB 的文件
// 累计几秒，表现就是进度条一顿一顿、点什么都没反应。
//
// File 通过结构化克隆传进来，底层数据不复制，只是换个线程去读。
// ---------------------------------------------------------------------------
import SparkMD5 from "spark-md5";

// self 在 DOM 的类型下是 Window，直接用 any 拿，省得为一个文件去掺 webworker 的 lib
const ctx: any = self;

ctx.onmessage = async (e: MessageEvent) => {
  const { file, chunkSize } = (e.data || {}) as { file: File; chunkSize: number };

  if (!file || !chunkSize) {
    ctx.postMessage({ type: "error", message: "md5 worker: bad payload" });
    return;
  }

  try {
    const spark = new SparkMD5.ArrayBuffer();
    let offset = 0;
    let lastPercent = -1;

    while (offset < file.size) {
      const chunk = file.slice(offset, Math.min(offset + chunkSize, file.size));
      spark.append(await chunk.arrayBuffer());
      offset += chunk.size;

      // 百分比没变就不发 —— 大文件切片多，每片都发一条纯属浪费
      const percent = Math.floor((offset / file.size) * 100);
      if (percent !== lastPercent) {
        lastPercent = percent;
        ctx.postMessage({ type: "progress", percent });
      }
    }

    ctx.postMessage({ type: "done", md5: spark.end() });
  } catch (err: any) {
    ctx.postMessage({ type: "error", message: err?.message || "md5 failed" });
  }
};
