/**
 * doudou UP 授权模块（付费版专用，开源版不包含本文件）
 *
 * 设计要点：
 * 1. 纯 JS 实现 SHA-256 / HMAC，不依赖 Web Crypto，file:// 双击打开也能验签
 * 2. 密钥自带到期日，本地离线校验，无需联网、无服务器
 * 3. 签名覆盖「到期日 + 序列号」，改日期即失效
 * 4. 记录见过的最晚时间，系统时间被调回过去时给出提示
 *
 * 密钥格式：DDU-20261231-0001-7K2M9Q
 */
(function () {
  'use strict';

  var SECRET_HEX =
    (typeof window !== 'undefined' && window.__DDU_SECRET__) || '@@LICENSE_SECRET@@';

  var ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  var LS_LICENSE = 'doudou_license';
  var LS_SEEN = 'doudou_license_seen';
  var DAY_MS = 86400000;

  // ---------- SHA-256 ----------
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function rotr(x, n) {
    return ((x >>> n) | (x << (32 - n))) >>> 0;
  }

  function sha256(bytes) {
    var H = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    var len = bytes.length;
    var total = Math.ceil((len + 9) / 64) * 64;
    var buf = new Uint8Array(total);
    buf.set(bytes);
    buf[len] = 0x80;
    var dv = new DataView(buf.buffer);
    var bits = len * 8;
    dv.setUint32(total - 8, Math.floor(bits / 4294967296));
    dv.setUint32(total - 4, bits >>> 0);

    var W = new Array(64);
    for (var off = 0; off < total; off += 64) {
      var t;
      for (t = 0; t < 16; t++) W[t] = dv.getUint32(off + t * 4);
      for (t = 16; t < 64; t++) {
        var s0 = (rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3)) >>> 0;
        var s1 = (rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10)) >>> 0;
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
        var ch = ((e & f) ^ (~e & g)) >>> 0;
        var t1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
        var S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
        var maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        var t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }

    var out = new Uint8Array(32);
    var odv = new DataView(out.buffer);
    for (var i = 0; i < 8; i++) odv.setUint32(i * 4, H[i]);
    return out;
  }

  function hmacSha256(keyBytes, msgBytes) {
    var B = 64;
    var k = keyBytes.length > B ? sha256(keyBytes) : keyBytes;
    var ipad = new Uint8Array(B);
    var opad = new Uint8Array(B);
    for (var i = 0; i < B; i++) {
      var v = i < k.length ? k[i] : 0;
      ipad[i] = v ^ 0x36;
      opad[i] = v ^ 0x5c;
    }
    var inner = new Uint8Array(B + msgBytes.length);
    inner.set(ipad); inner.set(msgBytes, B);
    var innerHash = sha256(inner);

    var outer = new Uint8Array(B + 32);
    outer.set(opad); outer.set(innerHash, B);
    return sha256(outer);
  }

  function hexToBytes(hex) {
    var clean = String(hex).replace(/[^0-9a-fA-F]/g, '');
    if (clean.length % 2) clean = '0' + clean;
    var out = new Uint8Array(clean.length / 2);
    for (var i = 0; i < out.length; i++) {
      out[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return out;
  }

  function utf8Bytes(str) {
    var s = String(str);
    var out = [];
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) {
        out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      } else if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
        var c2 = s.charCodeAt(++i);
        var cp = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
      } else {
        out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      }
    }
    return new Uint8Array(out);
  }

  function signFor(dueDate, seq) {
    var secret = hexToBytes(SECRET_HEX);
    var payload = utf8Bytes('DDU|' + dueDate + '|' + seq);
    var digest = hmacSha256(secret, payload);
    var out = '';
    for (var i = 0; i < 6; i++) out += ALPHABET[digest[i] % 32];
    return out;
  }

  // ---------- 密钥校验 ----------
  function normalize(raw) {
    return String(raw || '')
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, '');
  }

  function parseKey(raw) {
    var s = normalize(raw);
    // 去掉可能残留的前缀字母 DDU，统一成纯内容再重组
    var m = s.match(/^DDU(\d{8})(\d{4})([2-9A-HJ-NP-Z]{6})$/);
    if (!m) return null;
    return { due: m[1], seq: m[2], sig: m[3] };
  }

  function todayStart() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function verifyKey(raw) {
    if (SECRET_HEX.indexOf('@@') === 0) {
      return { ok: false, reason: '授权模块未正确构建' };
    }
    var p = parseKey(raw);
    if (!p) return { ok: false, reason: '密钥格式不正确，应为 DDU-20261231-0001-7K2M9Q' };

    var y = +p.due.slice(0, 4);
    var mo = +p.due.slice(4, 6);
    var da = +p.due.slice(6, 8);
    var d = new Date(y, mo - 1, da);
    if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) {
      return { ok: false, reason: '密钥中的日期无效' };
    }

    if (signFor(p.due, p.seq) !== p.sig) {
      return { ok: false, reason: '密钥无效，请检查是否抄错' };
    }

    var daysLeft = Math.round((d - todayStart()) / DAY_MS);
    if (daysLeft < 0) {
      return { ok: false, reason: '这张密钥已于 ' + fmtDue(p.due) + ' 到期', due: p.due, seq: p.seq, expired: true };
    }
    return { ok: true, due: p.due, seq: p.seq, daysLeft: daysLeft };
  }

  function fmtDue(due) {
    return due.slice(0, 4) + '-' + due.slice(4, 6) + '-' + due.slice(6, 8);
  }

  function readStore(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }

  function writeStore(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  }

  // 时间倒退检测：记录见过的最晚时间，若当前时间明显早于它，说明系统时间被调过
  function clockCheck() {
    var now = Date.now();
    var seen = parseInt(readStore(LS_SEEN), 10);
    if (!isFinite(seen) || seen <= 0) seen = 0;
    var tampered = seen > 0 && now < seen - DAY_MS;
    if (!tampered && now > seen) writeStore(LS_SEEN, String(now));
    return { tampered: tampered, seen: seen, now: now };
  }

  function currentState() {
    var saved = readStore(LS_LICENSE);
    if (!saved) return { active: false, reason: '未激活' };
    var r = verifyKey(saved);
    if (!r.ok) return { active: false, reason: r.reason, raw: saved, expired: !!r.expired };
    var clock = clockCheck();
    if (clock.tampered) {
      return {
        active: false,
        reason: '检测到系统时间异常，请把电脑时间调回正确值后重试',
        due: r.due,
        daysLeft: r.daysLeft,
        seq: r.seq,
        clockTampered: true
      };
    }
    return { active: true, due: r.due, daysLeft: r.daysLeft, seq: r.seq };
  }

  function activate(raw) {
    var r = verifyKey(raw);
    if (!r.ok) return r;
    writeStore(LS_LICENSE, normalize(raw));
    return r;
  }

  function deactivate() {
    try { localStorage.removeItem(LS_LICENSE); } catch (e) {}
  }

  // ---------- 界面 ----------
  var STYLE_ID = 'dduLicStyle';
  var CSS = [
    '.ddu-lic-btn{position:relative}',
    '.ddu-lic-btn .ddu-dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:6px;vertical-align:middle;background:#B4B2A9}',
    '.ddu-lic-btn.is-active .ddu-dot{background:#35E352}',
    '.ddu-lic-btn.is-expired .ddu-dot{background:#E24B4A}',
    '.ddu-lic-mask{position:fixed;inset:0;background:rgba(26,22,34,.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px}',
    '.ddu-lic-mask[hidden]{display:none}',
    '.ddu-lic-box{width:min(440px,100%);background:#fff;border-radius:12px;padding:24px;box-shadow:0 12px 40px rgba(0,0,0,.18);font-family:inherit}',
    '.ddu-lic-box h3{margin:0 0 6px;font-size:16px;font-weight:600;color:#1a1622}',
    '.ddu-lic-sub{margin:0 0 16px;font-size:12px;color:#6b6675;line-height:1.6}',
    '.ddu-lic-box input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #d9d6e0;border-radius:8px;font-size:14px;letter-spacing:.5px;font-family:ui-monospace,Menlo,Consolas,monospace;outline:none}',
    '.ddu-lic-box input:focus{border-color:#8B279B;box-shadow:0 0 0 3px rgba(139,39,155,.12)}',
    '.ddu-lic-msg{min-height:18px;margin:8px 0 0;font-size:12px;line-height:1.5;color:#6b6675}',
    '.ddu-lic-msg.is-err{color:#C0392B}',
    '.ddu-lic-msg.is-ok{color:#1D9E75}',
    '.ddu-lic-acts{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}',
    '.ddu-lic-acts button{padding:8px 16px;border-radius:8px;border:1px solid #d9d6e0;background:#fff;font-size:13px;cursor:pointer;font-family:inherit}',
    '.ddu-lic-acts button:hover{border-color:#8B279B;color:#8B279B}',
    '.ddu-lic-acts button.primary{background:#8B279B;border-color:#8B279B;color:#fff}',
    '.ddu-lic-acts button.primary:hover{background:#7a2290;color:#fff}',
    '.ddu-lic-status{padding:12px;border-radius:8px;background:#f6f4f9;font-size:13px;line-height:1.7;color:#3a3444;margin-bottom:14px}',
    '.ddu-lic-status b{color:#1a1622}',
    '.ddu-lic-link{font-size:12px;color:#8B279B;cursor:pointer;text-decoration:underline;background:none;border:0;padding:0;font-family:inherit}'
  ].join('');

  var els = {};

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function buildUI() {
    var actions = document.querySelector('.header-actions');
    if (!actions) return;

    var btn = document.createElement('button');
    btn.className = 'btn ddu-lic-btn';
    btn.id = 'dduLicBtn';
    btn.title = '授权状态与激活';
    btn.innerHTML = '<span class="ddu-dot"></span><span id="dduLicLabel">激活</span>';
    actions.appendChild(btn);
    els.btn = btn;
    els.label = btn.querySelector('#dduLicLabel');

    var mask = document.createElement('div');
    mask.className = 'ddu-lic-mask';
    mask.id = 'dduLicMask';
    mask.hidden = true;
    mask.innerHTML = [
      '<div class="ddu-lic-box" role="dialog" aria-modal="true" aria-labelledby="dduLicTitle">',
      '  <h3 id="dduLicTitle">激活 doudou UP</h3>',
      '  <p class="ddu-lic-sub">输入购买后收到的密钥。密钥自带有效期，本地校验，全程无需联网。</p>',
      '  <div class="ddu-lic-status" id="dduLicStatus" hidden></div>',
      '  <input id="dduLicInput" type="text" spellcheck="false" autocomplete="off" placeholder="DDU-20261231-0001-7K2M9Q" />',
      '  <p class="ddu-lic-msg" id="dduLicMsg"></p>',
      '  <div class="ddu-lic-acts">',
      '    <button id="dduLicClose">关闭</button>',
      '    <button id="dduLicOk" class="primary">激活</button>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(mask);

    els.mask = mask;
    els.input = mask.querySelector('#dduLicInput');
    els.msg = mask.querySelector('#dduLicMsg');
    els.status = mask.querySelector('#dduLicStatus');
    els.ok = mask.querySelector('#dduLicOk');

    btn.addEventListener('click', openDialog);
    mask.querySelector('#dduLicClose').addEventListener('click', closeDialog);
    mask.addEventListener('click', function (e) { if (e.target === mask) closeDialog(); });
    els.ok.addEventListener('click', submit);
    els.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mask.hidden) closeDialog();
    });

    refreshButton();
  }

  function setMsg(text, type) {
    if (!els.msg) return;
    els.msg.textContent = text || '';
    els.msg.className = 'ddu-lic-msg' + (type ? ' is-' + type : '');
  }

  function refreshButton() {
    if (!els.btn) return;
    var s = currentState();
    els.btn.classList.remove('is-active', 'is-expired');
    if (s.active) {
      els.btn.classList.add('is-active');
      els.label.textContent = '剩余 ' + s.daysLeft + ' 天';
      els.btn.title = '已激活，有效期至 ' + fmtDue(s.due);
    } else if (s.expired) {
      els.btn.classList.add('is-expired');
      els.label.textContent = '已过期';
      els.btn.title = s.reason;
    } else {
      els.label.textContent = '激活';
      els.btn.title = '未激活，点击输入密钥';
    }
  }

  function openDialog() {
    if (!els.mask) return;
    var s = currentState();
    els.mask.hidden = false;
    setMsg('');

    if (s.active) {
      els.status.hidden = false;
      els.status.innerHTML =
        '当前状态：<b>已激活</b><br>' +
        '有效期至：<b>' + fmtDue(s.due) + '</b>（剩余 ' + s.daysLeft + ' 天）<br>' +
        '密钥序号：' + s.seq;
      els.input.value = '';
      els.input.placeholder = '粘贴新密钥可覆盖当前授权';
      els.ok.textContent = '更换密钥';
    } else if (s.expired) {
      els.status.hidden = false;
      els.status.innerHTML =
        '当前状态：<b>已过期</b><br>' +
        '原密钥有效期至：<b>' + fmtDue(s.due || '') + '</b><br>' +
        '输入新密钥即可继续使用。';
      els.input.value = '';
      els.input.placeholder = 'DDU-20261231-0001-7K2M9Q';
      els.ok.textContent = '激活';
    } else {
      els.status.hidden = true;
      els.input.value = '';
      els.input.placeholder = 'DDU-20261231-0001-7K2M9Q';
      els.ok.textContent = '激活';
    }

    setTimeout(function () { els.input.focus(); }, 30);
  }

  function closeDialog() {
    if (els.mask) els.mask.hidden = true;
  }

  function submit() {
    var raw = els.input.value;
    if (!normalize(raw)) { setMsg('请先输入密钥', 'err'); return; }
    var r = activate(raw);
    if (!r.ok) { setMsg(r.reason, 'err'); return; }
    setMsg('激活成功，有效期至 ' + fmtDue(r.due) + '（剩余 ' + r.daysLeft + ' 天）', 'ok');
    refreshButton();
    setTimeout(closeDialog, 1200);
  }

  function boot() {
    injectStyle();
    buildUI();
  }

  var api = {
    verifyKey: verifyKey,
    signFor: signFor,
    parseKey: parseKey,
    normalize: normalize,
    sha256: sha256,
    hmacSha256: hmacSha256,
    state: currentState,
    isPro: function () { return currentState().active; },
    activate: activate,
    deactivate: deactivate,
    openDialog: openDialog,
    refresh: refreshButton
  };

  if (typeof window !== 'undefined') {
    window.DDU_LICENSE = api;
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
      } else {
        boot();
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
