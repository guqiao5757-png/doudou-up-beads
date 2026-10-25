#!/usr/bin/env node
'use strict';

/**
 * doudou UP 密钥生成器（仅作者本机使用，切勿分发给买家）
 *
 * 用法：
 *   node tools/genkey.js --days 30             生成 1 张 30 天卡
 *   node tools/genkey.js --days 30 --count 10  批量生成 10 张
 *   node tools/genkey.js --days 365            生成年卡
 *   node tools/genkey.js --until 2027-06-30    指定到期日
 *   node tools/genkey.js --days 30 --note "闲鱼订单 8823"
 *
 * 密钥格式：DDU-20261231-0001-7K2M9Q
 *   DDU          固定前缀
 *   20261231     到期日（含当天有效）
 *   0001         序列号，用于追溯订单
 *   7K2M9Q       HMAC-SHA256 截断签名（6 位 base32，约 30 bit）
 *
 * 注意：tools/.secret 是签发密钥的根密钥，必须备份且绝不能公开。
 *      一旦泄露，任何人都能自行生成有效密钥；届时需要更换密钥并重新构建付费版。
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const TOOLS_DIR = __dirname;
const SECRET_FILE = path.join(TOOLS_DIR, '.secret');
const CSV_FILE = path.join(TOOLS_DIR, 'keys.csv');

// 去掉容易看错的 0 O 1 I，方便用户手抄
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function loadSecret() {
  if (process.env.DDU_SECRET) return process.env.DDU_SECRET.trim();
  if (!fs.existsSync(SECRET_FILE)) {
    const s = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SECRET_FILE, s, { mode: 0o600 });
    console.log('');
    console.log('  [初始化] 已生成签发根密钥：tools/.secret');
    console.log('  [重要] 请立刻备份这个文件。丢失后，已发出的所有密钥都将无法验证。');
    console.log('');
    return s;
  }
  const s = fs.readFileSync(SECRET_FILE, 'utf8').trim();
  if (!s) throw new Error('tools/.secret 是空文件，请删除后重新运行以生成新密钥');
  return s;
}

function sign(dueDate, seq, secret) {
  // 序列号必须补零成 4 位，与密钥中显示的一致（前端按 "0001" 重算）
  const seqStr = String(seq).padStart(4, '0');
  const payload = 'DDU|' + dueDate + '|' + seqStr;
  // 必须按 hex 解码成 32 字节，与前端 license.js 的 hexToBytes 保持一致
  const keyBuf = Buffer.from(secret, 'hex');
  const digest = crypto.createHmac('sha256', keyBuf).update(payload).digest();
  let out = '';
  for (let i = 0; i < 6; i++) out += ALPHABET[digest[i] % 32];
  return out;
}

function makeKey(dueDate, seq, secret) {
  return 'DDU-' + dueDate + '-' + String(seq).padStart(4, '0') + '-' + sign(dueDate, seq, secret);
}

function pad2(n) { return String(n).padStart(2, '0'); }

function fmtDate(d) {
  return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
}

function fmtTime(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
    ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
}

function addDays(base, n) {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + n);
  return d;
}

function parseArgs(argv) {
  const opt = { days: null, until: null, count: 1, seq: null, note: '', out: null, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error('参数 ' + a + ' 缺少取值');
      return v;
    };
    if (a === '--days' || a === '-d') opt.days = parseInt(next(), 10);
    else if (a === '--until' || a === '-u') opt.until = next();
    else if (a === '--count' || a === '-n') opt.count = parseInt(next(), 10);
    else if (a === '--seq' || a === '-s') opt.seq = parseInt(next(), 10);
    else if (a === '--note' || a === '-m') opt.note = next();
    else if (a === '--out' || a === '-o') opt.out = next();
    else if (a === '--quiet' || a === '-q') opt.quiet = true;
    else if (a === '--help' || a === '-h') { opt.help = true; }
    else throw new Error('未知参数：' + a);
  }
  return opt;
}

function readMaxSeq(file) {
  if (!fs.existsSync(file)) return 0;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
  let max = 0;
  for (const line of lines) {
    const m = line.match(/^(\d+),/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

function csvEscape(s) {
  s = String(s == null ? '' : s);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function usage() {
  console.log([
    '',
    'doudou UP 密钥生成器',
    '',
    '  node tools/genkey.js --days 30              生成 1 张 30 天卡',
    '  node tools/genkey.js --days 365 --count 5   批量生成 5 张年卡',
    '  node tools/genkey.js --until 2027-06-30     指定到期日',
    '',
    '  可选：--seq 1001  指定起始序号   --note "备注"   --out 自定义CSV',
    '        --quiet     只在控制台打印密钥，不写 CSV',
    '',
  ].join('\n'));
}

function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (opt.help) { usage(); return; }

  if (opt.days == null && !opt.until) {
    console.error('错误：请用 --days N 或 --until YYYY-MM-DD 指定有效期');
    usage();
    process.exit(1);
  }
  if (!Number.isFinite(opt.count) || opt.count < 1 || opt.count > 9999) {
    console.error('错误：--count 必须是 1-9999 之间的整数');
    process.exit(1);
  }

  const secret = loadSecret();
  const now = new Date();

  let dueDate;
  if (opt.until) {
    const raw = String(opt.until).replace(/[-/]/g, '');
    if (!/^\d{8}$/.test(raw)) {
      console.error('错误：--until 格式应为 YYYY-MM-DD 或 YYYYMMDD');
      process.exit(1);
    }
    const y = +raw.slice(0, 4), mo = +raw.slice(4, 6), da = +raw.slice(6, 8);
    const d = new Date(y, mo - 1, da);
    if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) {
      console.error('错误：--until 不是合法日期：' + opt.until);
      process.exit(1);
    }
    if (fmtDate(d) < fmtDate(now)) {
      console.error('错误：--until 早于今天，生成的密钥会立即过期');
      process.exit(1);
    }
    dueDate = fmtDate(d);
  } else {
    if (!Number.isFinite(opt.days) || opt.days < 1 || opt.days > 3650) {
      console.error('错误：--days 必须是 1-3650 之间的整数');
      process.exit(1);
    }
    // 含当天，所以 30 天卡 = 今天 + 29
    dueDate = fmtDate(addDays(now, opt.days - 1));
  }

  const outFile = opt.out ? path.resolve(opt.out) : CSV_FILE;
  let seq = opt.seq != null ? opt.seq : readMaxSeq(outFile) + 1;
  if (!Number.isFinite(seq) || seq < 1 || seq > 9999) {
    console.error('错误：序列号超出 1-9999 范围，请用 --seq 指定');
    process.exit(1);
  }

  const rows = [];
  for (let i = 0; i < opt.count; i++) {
    if (seq > 9999) { console.error('警告：序列号超过 9999，停止生成'); break; }
    rows.push({
      seq: seq,
      key: makeKey(dueDate, seq, secret),
      due: dueDate,
      days: Math.round((new Date(+dueDate.slice(0, 4), +dueDate.slice(4, 6) - 1, +dueDate.slice(6, 8)) - now) / 86400000) + 1,
      at: fmtTime(now),
      note: opt.note,
    });
    seq++;
  }

  const pad = (s, n) => String(s) + ' '.repeat(Math.max(0, n - String(s).length));
  console.log('');
  console.log('  到期日 ' + dueDate + '   共 ' + rows.length + ' 张');
  console.log('  ' + '-'.repeat(52));
  for (const r of rows) console.log('  ' + r.key + '   序号 ' + r.seq);
  console.log('  ' + '-'.repeat(52));

  if (!opt.quiet) {
    const isNew = !fs.existsSync(outFile);
    const header = '序号,密钥,到期日,剩余天数,生成时间,备注\r\n';
    const body = rows.map(r => [r.seq, r.key, r.due, r.days, r.at, r.note].map(csvEscape).join(',')).join('\r\n') + '\r\n';
    fs.appendFileSync(outFile, (isNew ? '\ufeff' + header : '') + body);
    console.log('  已记录到：' + outFile);
    console.log('  （用 Excel 打开即可按订单逐条发货）');
  }
  console.log('');
}

main();
