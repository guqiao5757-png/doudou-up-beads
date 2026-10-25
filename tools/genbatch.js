#!/usr/bin/env node
'use strict';

/**
 * doudou UP 批量密钥生成器（仅作者本机使用，切勿分发给买家）
 *
 * 用法：
 *   node tools/genbatch.js                      默认 日/月/年 各 50 张
 *   node tools/genbatch.js --count 100          每种卡各 100 张
 *   node tools/genbatch.js --day 20 --month 60 --year 40
 *   node tools/genbatch.js --out 双十一批次     自定义文件名（不含扩展名）
 *
 * 产出：
 *   tools/<名称>.xlsx   三个工作表（日卡 / 月卡 / 年卡），可直接打印发货
 *   tools/<名称>.csv    合并版，方便导入其他系统
 *   同时追加到 tools/keys.csv 主流水账
 *
 * 密钥只记录「有效天数」，不写死到期日：买家哪天激活，就从哪天开始倒推。
 * 因此本批次可以长期囤货，不会因为生成得早就缩水。
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const TOOLS_DIR = __dirname;
const SECRET_FILE = path.join(TOOLS_DIR, '.secret');
const LEDGER_FILE = path.join(TOOLS_DIR, 'keys.csv');

// 去掉容易看错的 0 O 1 I，方便用户手抄
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const PLANS = [
  { code: 'day', name: '日卡', days: 1, sheet: '日卡（1天）' },
  { code: 'month', name: '月卡', days: 30, sheet: '月卡（30天）' },
  { code: 'year', name: '年卡', days: 365, sheet: '年卡（365天）' },
];

/* ---------- 密钥签名（必须与 license.js 完全一致） ---------- */

function loadSecret() {
  if (process.env.DDU_SECRET) return process.env.DDU_SECRET.trim();
  if (!fs.existsSync(SECRET_FILE)) {
    const s = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SECRET_FILE, s, { mode: 0o600 });
    console.log('  [初始化] 已生成签发根密钥：tools/.secret，请立刻备份。');
    return s;
  }
  const s = fs.readFileSync(SECRET_FILE, 'utf8').trim();
  if (!s) throw new Error('tools/.secret 是空文件，请删除后重新运行');
  return s;
}

function sign(days, seq, secret) {
  // 序列号补零成 4 位，与密钥中显示的一致
  const seqStr = String(seq).padStart(4, '0');
  const payload = 'DDU|' + days + 'D|' + seqStr;
  // 按 hex 解码成 32 字节，与前端 hexToBytes 保持一致
  const keyBuf = Buffer.from(secret, 'hex');
  const digest = crypto.createHmac('sha256', keyBuf).update(payload).digest();
  let out = '';
  for (let i = 0; i < 6; i++) out += ALPHABET[digest[i] % 32];
  return out;
}

function makeKey(days, seq, secret) {
  return 'DDU-' + days + 'D-' + String(seq).padStart(4, '0') + '-' + sign(days, seq, secret);
}

/* ---------- 日期工具 ---------- */

const pad2 = n => String(n).padStart(2, '0');
const fmtDate = d => d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
const fmtDue = s => s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
const fmtTime = d => fmtDate(d).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3') +
  ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());

function addDays(base, n) {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + n);
  return d;
}

/* ---------- 序列号 ---------- */

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

/* ---------- CSV ---------- */

function csvCell(s) {
  s = String(s == null ? '' : s);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/* ---------- 极简 XLSX 写入（store 模式，零依赖） ---------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function zipStore(files) {
  // files: [{ name, data: Buffer }]
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf8');
    const crc = crc32(f.data);

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);           // version needed
    lh.writeUInt16LE(0x0800, 6);       // bit 11: UTF-8 文件名
    lh.writeUInt16LE(0, 8);            // 0 = 不压缩
    lh.writeUInt16LE(0, 10);           // time
    lh.writeUInt16LE(0x21, 12);        // date（1980-01-01）
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(f.data.length, 18);
    lh.writeUInt32LE(f.data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    locals.push(lh, nameBuf, f.data);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(0, 10);
    ch.writeUInt16LE(0, 12);
    ch.writeUInt16LE(0x21, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(f.data.length, 20);
    ch.writeUInt32LE(f.data.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt16LE(0, 30);           // extra
    ch.writeUInt16LE(0, 32);           // comment
    ch.writeUInt16LE(0, 34);           // disk
    ch.writeUInt16LE(0, 36);           // internal attrs
    ch.writeUInt32LE(0, 38);           // external attrs
    ch.writeUInt32LE(offset, 42);
    centrals.push(ch, nameBuf);

    offset += lh.length + nameBuf.length + f.data.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([Buffer.concat(locals), centralBuf, eocd]);
}

function xmlEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function colName(i) {
  // 0 -> A, 1 -> B ... 25 -> Z, 26 -> AA
  let s = '';
  let n = i;
  do { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } while (n >= 0);
  return s;
}

function sheetXml(headers, rows, widths) {
  const cols = widths.map((w, i) =>
    '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'
  ).join('');

  const rowXml = (cells, r, style) => {
    const cs = cells.map((v, i) => {
      const ref = colName(i) + r;
      const st = style ? ' s="1"' : '';
      if (v === '' || v == null) return '<c r="' + ref + '"' + st + '/>';
      // 数字按数值写，避免 Excel 出现「以文本形式存储的数字」绿三角
      if (typeof v === 'number') return '<c r="' + ref + '"' + st + '><v>' + v + '</v></c>';
      return '<c r="' + ref + '" t="inlineStr"' + st + '><is><t>' + xmlEscape(v) + '</t></is></c>';
    }).join('');
    return '<row r="' + r + '">' + cs + '</row>';
  };

  let body = rowXml(headers, 1, true);
  rows.forEach((row, i) => { body += rowXml(row, i + 2, false); });

  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    '<cols>' + cols + '</cols>' +
    '<sheetData>' + body + '</sheetData>' +
    '</worksheet>';
}

const STYLES_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="2">' +
  '<font><sz val="11"/><name val="微软雅黑"/></font>' +
  '<font><b/><sz val="11"/><name val="微软雅黑"/></font>' +
  '</fonts>' +
  '<fills count="3">' +
  '<fill><patternFill patternType="none"/></fill>' +
  '<fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFEDE4F5"/><bgColor indexed="64"/></patternFill></fill>' +
  '</fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="2">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
  '</cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  '</styleSheet>';

function buildXlsx(sheets) {
  // sheets: [{ name, headers, rows, widths }]
  const files = [];

  const ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    sheets.map((_, i) =>
      '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
    ).join('') +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '</Types>';
  files.push({ name: '[Content_Types].xml', data: Buffer.from(ct, 'utf8') });

  const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';
  files.push({ name: '_rels/.rels', data: Buffer.from(rels, 'utf8') });

  const wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
    sheets.map((s, i) =>
      '<sheet name="' + xmlEscape(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'
    ).join('') +
    '</sheets></workbook>';
  files.push({ name: 'xl/workbook.xml', data: Buffer.from(wb, 'utf8') });

  const wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    sheets.map((_, i) =>
      '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'
    ).join('') +
    '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>';
  files.push({ name: 'xl/_rels/workbook.xml.rels', data: Buffer.from(wbRels, 'utf8') });

  files.push({ name: 'xl/styles.xml', data: Buffer.from(STYLES_XML, 'utf8') });

  sheets.forEach((s, i) => {
    files.push({
      name: 'xl/worksheets/sheet' + (i + 1) + '.xml',
      data: Buffer.from(sheetXml(s.headers, s.rows, s.widths), 'utf8'),
    });
  });

  return zipStore(files);
}

/* ---------- 参数 ---------- */

function parseArgs(argv) {
  const opt = { counts: {}, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error('参数 ' + a + ' 缺少取值');
      return v;
    };
    if (a === '--count' || a === '-n') {
      const n = parseInt(next(), 10);
      PLANS.forEach(p => { opt.counts[p.code] = n; });
    } else if (a === '--day') opt.counts.day = parseInt(next(), 10);
    else if (a === '--month') opt.counts.month = parseInt(next(), 10);
    else if (a === '--year') opt.counts.year = parseInt(next(), 10);
    else if (a === '--out' || a === '-o') opt.out = next();
    else if (a === '--help' || a === '-h') { opt.help = true; }
    else throw new Error('未知参数：' + a);
  }
  return opt;
}

/* ---------- 主流程 ---------- */

function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (opt.help) {
    console.log('\n  node tools/genbatch.js [--count N] [--day N] [--month N] [--year N] [--out 名称]\n');
    return;
  }

  const secret = loadSecret();
  const now = new Date();
  const stamp = fmtDate(now);

  let seq = readMaxSeq(LEDGER_FILE) + 1;
  const allRows = [];
  const sheets = [];

  for (const plan of PLANS) {
    const count = opt.counts[plan.code] != null ? opt.counts[plan.code] : 50;
    if (!Number.isFinite(count) || count < 1) throw new Error(plan.name + ' 数量不合法');

    const rows = [];
    for (let i = 0; i < count; i++) {
      if (seq > 9999) throw new Error('序列号超过 9999，请改用新的号段');
      const key = makeKey(plan.days, seq, secret);
      // 到期日由买家激活时才确定，这里留空
      rows.push([seq, key, plan.days, fmtTime(now), '', '', '', '']);
      allRows.push({ seq, key, days: plan.days, at: fmtTime(now), plan: plan.name });
      seq++;
    }

    sheets.push({
      name: plan.sheet,
      headers: ['序号', '密钥', '有效天数', '生成时间', '买家/订单号', '售出日期', '买家激活日', '备注'],
      rows,
      widths: [7, 26, 10, 20, 18, 12, 12, 20],
    });
  }

  const base = opt.out || ('密钥批次_' + stamp);
  const xlsxPath = path.join(TOOLS_DIR, base + '.xlsx');
  const csvPath = path.join(TOOLS_DIR, base + '.csv');

  fs.writeFileSync(xlsxPath, buildXlsx(sheets));

  // 合并 CSV
  const header = '序号,卡类型,密钥,有效天数,生成时间,买家/订单号,售出日期,买家激活日,备注\r\n';
  const body = allRows.map(r =>
    [r.seq, r.plan, r.key, r.days, r.at, '', '', '', ''].map(csvCell).join(',')
  ).join('\r\n') + '\r\n';
  fs.writeFileSync(csvPath, '\ufeff' + header + body);

  // 追加主流水账
  const ledgerNew = !fs.existsSync(LEDGER_FILE);
  const ledgerHeader = '序号,密钥,有效天数,生成时间,备注\r\n';
  const ledgerBody = allRows.map(r =>
    [r.seq, r.key, r.days, r.at, r.plan + '批次'].map(csvCell).join(',')
  ).join('\r\n') + '\r\n';
  fs.appendFileSync(LEDGER_FILE, (ledgerNew ? '\ufeff' + ledgerHeader : '') + ledgerBody);

  console.log('');
  for (const plan of PLANS) {
    const n = opt.counts[plan.code] != null ? opt.counts[plan.code] : 50;
    console.log('  ' + plan.name.padEnd(4, ' ') + ' ' + String(n).padStart(3, ' ') +
      ' 张   ' + String(plan.days).padStart(3, ' ') + ' 天（自激活日起算）');
  }
  console.log('  ' + '-'.repeat(46));
  console.log('  序号范围 ' + allRows[0].seq + ' – ' + allRows[allRows.length - 1].seq + '，共 ' + allRows.length + ' 张');
  console.log('  Excel：' + xlsxPath);
  console.log('  CSV  ：' + csvPath);
  console.log('  流水：' + LEDGER_FILE + '（已追加）');
  console.log('');
}

main();
