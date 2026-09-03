const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/Administrator/WorkBuddy AI/2026-09-01-22-15-41/bead-pattern';

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

const out = path.join(dir, 'doudou up.html');
fs.writeFileSync(out, html);

// 3) 同步到桌面
const desk = 'C:/Users/Administrator/Desktop/doudou up.html';
fs.copyFileSync(out, desk);

// 4) 同步一份到 docs/index.html，供 GitHub Pages 直接托管单文件版（自包含、零外部请求）
const docsDir = path.join(dir, 'docs');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);
fs.writeFileSync(path.join(docsDir, 'index.html'), html);

console.log('built bytes:', Buffer.byteLength(html, 'utf8'));
console.log('has placeholder left:', html.indexOf('@@FONT_B64@@') !== -1);
// 标题允许带中文副标题，只要 <title> 以 doudou UP 开头即视为正常
console.log('title ok:', /<title>doudou UP[^<]*<\/title>/.test(html));
console.log('export prefix:', (html.match(/doudou up_/g) || []).length, 'hits');
