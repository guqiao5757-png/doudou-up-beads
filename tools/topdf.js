#!/usr/bin/env node
'use strict';
/**
 * 把 使用说明.html 渲染成 PDF，并额外输出一张整页预览图
 * 用法：node tools/topdf.js <项目根目录>
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const ROOT = path.resolve(process.argv[2] || '.');
const PORT = 8778;
const CDP_PORT = 9334;
const SRC = path.join(ROOT, '使用说明.html');
const PDF = path.join(ROOT, '使用说明.pdf');
const PREVIEW = path.join(ROOT, 'shots', 'guide-preview.png');

const MIME = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.css': 'text/css' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function get(url) {
  return new Promise((res, rej) => {
    http.get(url, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d)); }).on('error', rej);
  });
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Map(); }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.id && c.pending.has(m.id)) {
        const { res, rej } = c.pending.get(m.id);
        c.pending.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
      } else if (m.method) (c.handlers.get(m.method) || []).forEach(f => f(m.params));
    };
    return c;
  }
  on(k, f) { if (!this.handlers.has(k)) this.handlers.set(k, []); this.handlers.get(k).push(f); }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => { this.pending.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
}

(async () => {
  if (!fs.existsSync(SRC)) throw new Error('找不到 ' + SRC);

  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/使用说明.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => srv.listen(PORT, '127.0.0.1', r));

  const profile = path.join(os.tmpdir(), 'ddu-pdf-' + Date.now());
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
    '--remote-debugging-port=' + CDP_PORT, '--user-data-dir=' + profile, 'about:blank',
  ], { stdio: 'ignore' });

  try {
    const t0 = Date.now();
    let list;
    while (Date.now() - t0 < 20000) {
      try {
        const l = JSON.parse(await get('http://127.0.0.1:' + CDP_PORT + '/json/list'));
        if (l && l.length) { list = l; break; }
      } catch (e) {}
      await sleep(250);
    }
    const page = list.find(t => t.type === 'page');
    const cdp = await CDP.connect(page.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // A4 宽度 794px @96dpi
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 794, height: 1123, deviceScaleFactor: 2, mobile: false });

    const loaded = new Promise(r => cdp.on('Page.loadEventFired', r));
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E.html' });
    await Promise.race([loaded, sleep(8000)]);
    await sleep(2000);

    // 预览图（整页）
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.mkdirSync(path.dirname(PREVIEW), { recursive: true });
    fs.writeFileSync(PREVIEW, Buffer.from(shot.data, 'base64'));
    console.log('预览图：' + PREVIEW);

    // 按 A4 页宽 794px 量一下真实内容高度（.page 的内边距会再吃掉一部分）
    await cdp.send('Emulation.setEmulatedMedia', { media: 'print' });
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 794, height: 1123, deviceScaleFactor: 1, mobile: false });
    await sleep(600);
    const h = (await cdp.send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true })).result.value;
    console.log('打印内容高度：' + h + 'px ≈ ' + (h / 1123).toFixed(2) + ' 页（A4 1123px/页）');

    // PDF（先清掉设备模拟，否则打印会按模拟视口排版，页数会翻倍）
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await cdp.send('Emulation.setEmulatedMedia', { media: '' });
    await sleep(300);
    const pdf = await cdp.send('Page.printToPDF', {
      printBackground: true,
      preferCSSPageSize: true,
      marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    });
    fs.writeFileSync(PDF, Buffer.from(pdf.data, 'base64'));
    console.log('PDF：' + PDF + '  ' + Math.round(fs.statSync(PDF).size / 1024) + ' KB');
  } finally {
    try { chrome.kill(); } catch (e) {}
    srv.close();
  }
})().catch(e => { console.error('失败：' + e.message); process.exit(1); });
