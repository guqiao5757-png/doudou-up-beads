#!/usr/bin/env node
'use strict';
/**
 * 生成《doudou UP 使用说明》HTML（截图以 base64 内嵌，单文件可直接发人）
 * 用法：node tools/build_guide.js <项目根目录>
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.argv[2] || '.');
const SHOTS = path.join(ROOT, 'shots');
const OUT = path.join(ROOT, '使用说明.html');

function img(name) {
  const p = path.join(SHOTS, name + '.png');
  if (!fs.existsSync(p)) throw new Error('缺少截图：' + p);
  return 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
}

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>doudou UP 使用说明</title>
<style>
  :root{
    --ink:#221c2b; --ink-2:#4a4458; --muted:#7d7689;
    --line:#e6e0ee; --bg:#ffffff; --soft:#faf8fd;
    --accent:#8B279B; --accent-soft:#f3e9f7; --accent-ink:#6d1f7a;
  }
  *{box-sizing:border-box}
  body{
    margin:0; background:#f2eef6; color:var(--ink);
    font-family:"Microsoft YaHei","PingFang SC","Hiragino Sans GB",system-ui,sans-serif;
    font-size:12.8px; line-height:1.6;
  }
  .page{
    width:210mm; min-height:297mm; margin:16px auto; padding:15mm 14mm;
    background:var(--bg); box-shadow:0 2px 18px rgba(60,20,80,.12);
  }
  header{border-bottom:3px solid var(--accent); padding-bottom:9px; margin-bottom:12px}
  h1{margin:0; font-size:23px; letter-spacing:.5px}
  h1 b{color:var(--accent)}
  h2{
    font-size:15px; margin:10px 0 5px; padding-left:9px;
    border-left:4px solid var(--accent); line-height:1.4;
  }
  h2:first-of-type{margin-top:2px}
  p{margin:5px 0}
  .muted{color:var(--muted)}
  figure{margin:5px 0 2px}
  figure img{width:100%; display:block; border:1px solid var(--line); border-radius:7px}
  figcaption{color:var(--muted); font-size:11px; margin-top:4px; text-align:center}
  .shot-gate{width:44%; margin:6px auto 2px}
  .shot-main{width:96%; margin:0 auto}
  ol,ul{margin:6px 0; padding-left:20px}
  li{margin:3px 0}
  .tip{
    background:var(--accent-soft); border-left:4px solid var(--accent);
    border-radius:0 8px 8px 0; padding:6px 12px; margin:8px 0;
  }
  .tip b{color:var(--accent-ink)}
  .warn{
    background:#fff6e8; border-left:4px solid #e09b2d;
    border-radius:0 8px 8px 0; padding:7px 12px; margin:9px 0;
  }
  .warn b{color:#a86a10}
  table{border-collapse:collapse; width:100%; margin:6px 0; font-size:11.8px}
  th,td{border:1px solid var(--line); padding:4px 9px; text-align:left; vertical-align:top}
  th{background:var(--soft); font-weight:700; width:26%}
  code{
    background:var(--soft); border:1px solid var(--line); border-radius:4px;
    padding:1px 5px; font-family:Consolas,Menlo,monospace; font-size:12px;
  }
  kbd{
    display:inline-block; min-width:17px; text-align:center;
    background:#fff; border:1px solid #cfc6da; border-bottom-width:2px;
    border-radius:4px; padding:0 4px; font-size:11px;
    font-family:Consolas,Menlo,monospace;
  }
  .two{display:flex; gap:12px; margin:6px 0 2px}
  .two>figure{flex:1; margin:0}
  footer{
    margin-top:10px; padding-top:6px; border-top:1px solid var(--line);
    color:var(--muted); font-size:11px; text-align:center;
  }
  @media print{
    body{background:#fff}
    .page{width:auto; min-height:auto; margin:0; padding:13mm 12mm; box-shadow:none}
    h2{break-after:avoid}
    figure{break-inside:avoid}
    img{break-inside:avoid}
    tr{break-inside:avoid}
    header{break-after:avoid}
  }
  @page{size:A4; margin:0}
</style>
</head>
<body>
<div class="page">

<header>
  <h1>doudou UP <b>使用说明</b></h1>
</header>

<h2>一、激活</h2>
<ol>
  <li>把收到的 <code>doudou up pro.html</code> 存到电脑上，<b>双击打开</b>。</li>
  <li>首次打开是激活页，粘贴密钥，点「激活并开始使用」。</li>
</ol>
<figure class="shot-gate">
  <img src="${img('01-gate')}" alt="激活页">
  <figcaption>第一次打开会看到这个页面</figcaption>
</figure>
<div class="tip">
  <b>有效期从「激活当天」开始算，不是购买那天。</b>买完先放着不激活，不会浪费天数。
</div>

<h2>二、认识界面</h2>
<figure class="shot-main">
  <img src="${img('02-main')}" alt="主界面">
  <figcaption>左：绘图工具与色板　中：画布　右：尺寸、底图、图片转拼豆</figcaption>
</figure>
<p><b>左</b>：画笔、橡皮、填充、取色器、框选，下方是 MARD 221 色色板。
<b>中</b>：滚轮缩放，<kbd>空格</kbd>+左键拖动平移，格子上标着豆子色号。
<b>右</b>：改尺寸、传底图、图片转拼豆。</p>

<h2>三、三种画法</h2>
<p><b>1 直接画</b> —— 色板选好颜色，在画布上按住左键涂抹。</p>
<p class="muted" style="margin-left:20px">
  <kbd>B</kbd> 画笔 · <kbd>E</kbd> 橡皮 · <kbd>T</kbd> 填充 · <kbd>G</kbd> 取色 · <kbd>M</kbd> 框选 ·
  <kbd>1</kbd>–<kbd>7</kbd> 笔刷大小 · <kbd>Ctrl</kbd>+<kbd>Z</kbd> 撤销
</p>
<p><b>2 框选批量填色</b> —— 按 <kbd>M</kbd> 拖出矩形，点「填充选区」整片填成当前颜色，
或点「清空内容」整片擦掉。做大面积背景最省事。</p>
<p><b>3 图片自动转</b> —— 右侧「参考底图」上传图片，再点「转为拼豆图案」，自动换算成豆子色号。</p>
<div class="tip">
  <b>转图技巧：</b>轮廓清晰的卡通图、Logo 效果最好，真人照片建议先用像素风/线条图滤镜处理。
  白底图勾<b>「扣除白底」</b>，想颜色更饱满勾<b>「白色抑制」</b>。
  采样方式：照片选<b>区域平均</b>，像素图选<b>中心点</b>（边缘更锐利）。
</div>

<h2>四、备豆子与图纸库</h2>
<div class="two">
  <figure>
    <img src="${img('03-result')}" alt="转换结果">
    <figcaption>每格显示该放什么颜色的豆子</figcaption>
  </figure>
  <figure>
    <img src="${img('04-library')}" alt="图纸库">
    <figcaption>图纸库：存多张图纸随时切换</figcaption>
  </figure>
</div>
<p>画布下方<b>「已使用颜色」</b>会列出用到的色号和每种颗数 —— 照着买豆子，不多不少。
要出图点右上角 <b>导出 JPG</b>，生成带色号图例的成品图，可直接打印。</p>
<p>图纸库可<b>保存当前</b>图纸，勾选多张后<b>批量导出</b>，打包成一个 ZIP，里面每张都是带图例的 JPG。</p>
<div class="warn">
  <b>图纸库存在本地，不是云端。</b>清除浏览器数据或换设备都会看不到。
  重要的图请用右上角 <b>存档</b> 导出 <code>.json</code> 备份，换设备后点 <b>恢复</b> 导入。
</div>

<h2>五、尺寸怎么填</h2>
<p>填的是<b>豆子颗数</b>，不是厘米。1 颗 5mm 豆 ≈ 0.5 cm，1 颗 2.6mm 迷你豆 ≈ 0.26 cm。</p>
<table>
  <tr><th>想要 10 × 10 cm</th><td>5mm 豆填 <b>20 × 20</b>　·　2.6mm 豆填 <b>38 × 38</b></td></tr>
  <tr><th>想要 30 × 30 cm</th><td>5mm 豆填 <b>60 × 60</b>　·　2.6mm 豆填 <b>115 × 115</b></td></tr>
</table>
<p class="muted">输入宽高时下方会自动显示对应厘米数，不用自己算。范围 4–200 颗。</p>

<h2>六、常见问题</h2>
<table>
  <tr><th>换了电脑</th><td>输入<b>同一个密钥</b>即可，不绑设备，也不损失天数。</td></tr>
  <tr><th>提示「密钥无效」</th><td>多半抄漏了字符。支持大小写和空格，整段粘贴最稳妥。</td></tr>
  <tr><th>到期了怎么办</th><td>买一张新密钥，粘贴后继续用，图纸和存档都还在。</td></tr>
  <tr><th>图纸不见了</th><td>图纸存在本地，清数据会丢。请用<b>存档</b>导出 <code>.json</code> 备份。</td></tr>
  <tr><th>能离线用吗</th><td>可以。整个软件就一个 HTML 文件，断网也能画图和导出，图片不会上传。</td></tr>
</table>

<footer>
  doudou UP · 拼豆图纸生成器 · 如有问题请联系卖家
</footer>

</div>
</body>
</html>
`;

fs.writeFileSync(OUT, HTML, 'utf8');
console.log('已生成：' + OUT);
console.log('大小：' + Math.round(fs.statSync(OUT).size / 1024) + ' KB');
