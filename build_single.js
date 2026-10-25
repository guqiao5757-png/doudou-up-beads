const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/Administrator/WorkBuddy AI/2026-09-01-22-15-41/bead-pattern';

// 构建模式：
//   默认        -> 开源版（不含任何授权代码，输出 doudou up.html，同步桌面与 docs）
//   --pro       -> 付费版（内联 license.js 与签发密钥，输出 doudou up pro.html，不同步 docs）
const isPro = process.argv.includes('--pro');

// 1) 读取像素字体并 base64 内嵌
const fontB64 = fs.readFileSync(path.join(dir, 'ps2p.woff2')).toString('base64');
let css = fs.readFileSync(path.join(dir, 'styles.css'), 'utf8');
if (css.indexOf('@@FONT_B64@@') !== -1) {
  css = css.replace('@@FONT_B64@@', 'data:font/woff2;base64,' + fontB64);
  fs.writeFileSync(path.join(dir, 'styles.css'), css); // dev 版也自包含，离线可用
}

// 2) 构建单文件 HTML
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const appjs = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');

html = html.replace(
  '<link rel="stylesheet" href="styles.css" />',
  '<style>\n' + css + '\n</style>'
);
html = html.replace(
  '<script src="app.js"></script>',
  '<script>\n' + appjs + '\n</script>'
);

// 3) 付费版：注入授权模块与签发密钥
let outName = 'doudou up.html';
if (isPro) {
  const secretFile = path.join(dir, 'tools', '.secret');
  if (!fs.existsSync(secretFile)) {
    console.error('构建失败：缺少 tools/.secret');
    console.error('请先运行 node tools/genkey.js --days 30 初始化签发根密钥');
    process.exit(1);
  }
  const secret = fs.readFileSync(secretFile, 'utf8').trim();
  if (!/^[0-9a-f]{64}$/i.test(secret)) {
    console.error('构建失败：tools/.secret 格式异常，应为 64 位十六进制字符串');
    process.exit(1);
  }

  const licPath = path.join(dir, 'license.js');
  if (!fs.existsSync(licPath)) {
    console.error('构建失败：缺少 license.js');
    process.exit(1);
  }
  let lic = fs.readFileSync(licPath, 'utf8');
  lic = lic.replace('@@LICENSE_SECRET@@', secret);
  if (lic.indexOf('@@LICENSE_SECRET@@') !== -1) {
    console.error('构建失败：license.js 中的密钥占位符未被替换');
    process.exit(1);
  }

  // Pro 功能模块：图纸库 + 批量导出
  const proPath = path.join(dir, 'pro.js');
  if (!fs.existsSync(proPath)) {
    console.error('构建失败：缺少 pro.js');
    process.exit(1);
  }
  const projs = fs.readFileSync(proPath, 'utf8');

  const closeIdx = html.lastIndexOf('</body>');
  if (closeIdx === -1) {
    console.error('构建失败：index.html 中找不到 </body>');
    process.exit(1);
  }
  // 两个模块各用一个 script 标签，避免与 app.js 的作用域互相干扰
  html = html.slice(0, closeIdx) +
    '<script>\n' + lic + '\n</script>\n' +
    '<script>\n' + projs + '\n</script>\n' +
    html.slice(closeIdx);
  outName = 'doudou up pro.html';
}

const out = path.join(dir, outName);
fs.writeFileSync(out, html);

// 4) 仅开源版同步到桌面与 GitHub Pages（付费版不外发）
if (!isPro) {
  const desk = 'C:/Users/Administrator/Desktop/doudou up.html';
  fs.copyFileSync(out, desk);

  const docsDir = path.join(dir, 'docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);
  fs.writeFileSync(path.join(docsDir, 'index.html'), html);
}

// 5) 自检
console.log('mode:', isPro ? 'PRO（付费版）' : 'FREE（开源版）');
console.log('output:', outName);
console.log('built bytes:', Buffer.byteLength(html, 'utf8'));
console.log('has placeholder left:', html.indexOf('@@FONT_B64@@') !== -1 || html.indexOf('@@LICENSE_SECRET@@') !== -1);
console.log('title ok:', /<title>doudou UP[^<]*<\/title>/.test(html));
console.log('export prefix:', (html.match(/doudou up_/g) || []).length, 'hits');
console.log('license module:', html.indexOf('DDU_LICENSE') !== -1 ? 'included' : 'absent');
console.log('pro module:', html.indexOf('DDU_LIBRARY') !== -1 ? 'included' : 'absent');
