#!/usr/bin/env node
'use strict';
/**
 * 用 Chrome DevTools Protocol 给 doudou UP 付费版截图
 * 不依赖 playwright / puppeteer，只用 Node 内置 http + WebSocket
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const ROOT = path.resolve(process.argv[2]);
const OUT = process.argv[3];
const PORT = 8777;
const CDP_PORT = 9333;

fs.mkdirSync(OUT, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

function startServer() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const file = path.join(ROOT, p);
      if (!file.startsWith(ROOT) || !fs.existsSync(file)) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(PORT, '127.0.0.1', () => resolve(srv));
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitFor(fn, timeout = 20000, label = '') {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try { const v = await fn(); if (v) return v; } catch (e) {}
    await sleep(200);
  }
  throw new Error('超时：' + label);
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Map(); }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && c.pending.has(msg.id)) {
        const { res, rej } = c.pending.get(msg.id);
        c.pending.delete(msg.id);
        msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
      } else if (msg.method) {
        (c.handlers.get(msg.method) || []).forEach(f => f(msg.params));
      }
    };
    return c;
  }
  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result && r.result.value;
  }
}

(async () => {
  const srv = await startServer();
  console.log('静态服务已启动 http://127.0.0.1:' + PORT);

  const profile = path.join(os.tmpdir(), 'ddu-shot-profile-' + Date.now());
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--force-device-scale-factor=2',
    '--window-size=1500,1050',
    '--remote-debugging-port=' + CDP_PORT,
    '--user-data-dir=' + profile,
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    await waitFor(async () => (await get('http://127.0.0.1:' + CDP_PORT + '/json/version')).includes('Browser'), 20000, 'Chrome 启动');
    const list = JSON.parse(await get('http://127.0.0.1:' + CDP_PORT + '/json/list'));
    const page = list.find(t => t.type === 'page');
    const cdp = await CDP.connect(page.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1500, height: 1050, deviceScaleFactor: 1.5, mobile: false,
    });

    const APP = 'http://127.0.0.1:' + PORT + '/' + encodeURIComponent('doudou up pro.html');

    async function goto(url) {
      const loaded = new Promise(res => cdp.on('Page.loadEventFired', res));
      await cdp.send('Page.navigate', { url });
      await Promise.race([loaded, sleep(8000)]);
      await sleep(1500);
    }

    async function shot(name, opts = {}) {
      const params = { format: 'png', captureBeyondViewport: !!opts.full };
      if (opts.clip) params.clip = opts.clip;
      const r = await cdp.send('Page.captureScreenshot', params);
      fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.data, 'base64'));
      console.log('  截图 ' + name + '.png');
    }

    // 按元素包围盒裁剪截图（用于门禁页这种四周大片留白的画面）
    async function shotEl(name, selector, pad = 40, scale = 2) {
      const rect = await cdp.eval(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { x: b.x, y: b.y, w: b.width, h: b.height };
      })()`);
      if (!rect) { console.log('  跳过 ' + name + '：找不到 ' + selector); return; }
      const clip = {
        x: Math.max(0, rect.x - pad),
        y: Math.max(0, rect.y - pad),
        width: rect.w + pad * 2,
        height: rect.h + pad * 2,
        scale,
      };
      const r = await cdp.send('Page.captureScreenshot', { format: 'png', clip });
      fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.data, 'base64'));
      console.log('  截图 ' + name + '.png（裁剪 ' + Math.round(clip.width) + '×' + Math.round(clip.height) + '）');
    }

    // 1) 激活门禁页（全新 profile，没有授权）
    await goto(APP);
    const gateVisible = await cdp.eval("(() => { const g = document.querySelector('.ddu-gate'); return !!g && !g.hidden; })()");
    console.log('门禁是否显示：' + gateVisible);
    await shotEl('01-gate', '.ddu-gate-box', 44, 2);

    // 2) 注入授权后进入主界面
    // 密钥从 keys.csv 里取一张年卡，绝不硬编码在源码里（会随仓库泄露）
    const ledger = path.join(ROOT, 'tools', 'keys.csv');
    let demoKey = '';
    if (fs.existsSync(ledger)) {
      const lines = fs.readFileSync(ledger, 'utf8').replace(/^\ufeff/, '').split(/\r?\n/).filter(Boolean).slice(1);
      const hit = lines.map(l => l.split(',')).find(c => /^DDU-365D-/.test(c[1] || ''));
      if (hit) demoKey = hit[1];
    }
    if (!demoKey) throw new Error('keys.csv 里没有年卡密钥，请先运行 tools/genbatch.js');
    const seq = demoKey.split('-')[2];
    console.log('演示用密钥：' + demoKey);

    await cdp.eval(`
      localStorage.setItem('doudou_license', '${demoKey}');
      localStorage.setItem('doudou_license_acts', JSON.stringify({ '${seq}': (() => {
        const d = new Date(); const p = n => String(n).padStart(2,'0');
        return '' + d.getFullYear() + p(d.getMonth()+1) + p(d.getDate());
      })() }));
      'ok'
    `);
    await goto(APP);
    const unlocked = await cdp.eval("(() => { const g = document.querySelector('.ddu-gate'); return !g || g.hidden; })()");
    console.log('是否已解锁：' + unlocked);
    await shot('02-main');

    // 3) 生成一张测试图 → 上传 → 转为拼豆，展示成品效果
    const dataUrl = await cdp.eval(`(() => {
      const S = 320, c = document.createElement('canvas');
      c.width = c.height = S;
      const g = c.getContext('2d');
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S);
      g.fillStyle = '#E8556D';
      g.beginPath();
      g.moveTo(S * 0.5, S * 0.88);
      g.bezierCurveTo(S * 0.02, S * 0.55, S * 0.12, S * 0.08, S * 0.5, S * 0.32);
      g.bezierCurveTo(S * 0.88, S * 0.08, S * 0.98, S * 0.55, S * 0.5, S * 0.88);
      g.closePath(); g.fill();
      return c.toDataURL('image/png');
    })()`);
    const tmpImg = path.join(os.tmpdir(), 'ddu-heart.png');
    fs.writeFileSync(tmpImg, Buffer.from(dataUrl.split(',')[1], 'base64'));

    await cdp.send('DOM.enable');
    const doc = await cdp.send('DOM.getDocument');
    const q = await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#fileImg' });
    await cdp.send('DOM.setFileInputFiles', { nodeId: q.nodeId, files: [tmpImg] });
    await sleep(1500);
    const converted = await cdp.eval(`(() => {
      const b = document.getElementById('btnConvert');
      if (!b) return 'no-button';
      b.click();
      return 'clicked';
    })()`);
    await sleep(2500);
    console.log('图片转拼豆：' + converted);
    await shot('03-result');

    // 4) 图纸库（付费功能）
    await cdp.eval("document.getElementById('dduLibBtn').click()");
    await sleep(700);
    await cdp.eval("document.getElementById('dduLibSave').click()");
    await sleep(1500);
    const libCount = await cdp.eval("document.getElementById('dduLibCount').textContent");
    console.log('图纸库：' + libCount);
    await shot('04-library');
    await cdp.eval("document.getElementById('dduLibClose').click()");
    await sleep(400);

    fs.writeFileSync(path.join(OUT, '_meta.json'), JSON.stringify({ gateVisible, unlocked, converted, libCount }, null, 2));
  } catch (e) {
    console.error('失败：' + e.message);
    process.exitCode = 1;
  } finally {
    try { chrome.kill(); } catch (e) {}
    srv.close();
  }
})();
