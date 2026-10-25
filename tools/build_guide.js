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
    font-size:12.8px; line-height:1.58;
  }
  .page{
    width:210mm; min-height:297mm; margin:16px auto; padding:16mm 15mm;
    background:var(--bg); box-shadow:0 2px 18px rgba(60,20,80,.12);
  }
  header{border-bottom:3px solid var(--accent); padding-bottom:10px; margin-bottom:14px}
  h1{margin:0 0 3px; font-size:24px; letter-spacing:.5px}
  h1 b{color:var(--accent)}
  .sub{margin:0; color:var(--muted); font-size:12px}
  h2{
    font-size:15px; margin:13px 0 6px; padding-left:9px;
    border-left:4px solid var(--accent); line-height:1.4;
  }
  h2:first-of-type{margin-top:2px}
  p{margin:6px 0}
  .muted{color:var(--muted)}
  figure{margin:7px 0 1px}
  figure img{width:86%; display:block; margin:0 auto; border:1px solid var(--line); border-radius:8px}
  figcaption{color:var(--muted); font-size:11px; margin-top:5px; text-align:center}
  .shot-sm{width:54%; margin:8px auto 1px}
  ol,ul{margin:6px 0; padding-left:20px}
  li{margin:3px 0}
  .tip{
    background:var(--accent-soft); border-left:4px solid var(--accent);
    border-radius:0 8px 8px 0; padding:8px 12px; margin:9px 0;
  }
  .tip b{color:var(--accent-ink)}
  .warn{
    background:#fff6e8; border-left:4px solid #e09b2d;
    border-radius:0 8px 8px 0; padding:8px 12px; margin:9px 0;
  }
  .warn b{color:#a86a10}
  table{border-collapse:collapse; width:100%; margin:6px 0; font-size:11.6px}
  th,td{border:1px solid var(--line); padding:4px 9px; text-align:left; vertical-align:top}
  th{background:var(--soft); font-weight:700; width:28%}
  code{
    background:var(--soft); border:1px solid var(--line); border-radius:4px;
    padding:1px 5px; font-family:Consolas,Menlo,monospace; font-size:12px;
  }
  kbd{
    display:inline-block; min-width:18px; text-align:center;
    background:#fff; border:1px solid #cfc6da; border-bottom-width:2px;
    border-radius:4px; padding:0 5px; font-size:11.5px;
    font-family:Consolas,Menlo,monospace;
  }
  .two{display:flex; gap:14px}
  .two>div{flex:1}
  footer{
    margin-top:18px; padding-top:8px; border-top:1px solid var(--line);
    color:var(--muted); font-size:11.5px; text-align:center;
  }
  @media print{
    body{background:#fff}
    .page{width:auto; min-height:auto; margin:0; padding:14mm 13mm; box-shadow:none}
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
  <p class="sub">拼豆图纸生成器 · 付费版 · 纯本地运行，不需要联网，图片不会上传</p>
</header>

<h2>一、打开并激活</h2>
<ol>
  <li>把收到的 <code>doudou up pro.html</code> 存到电脑上（桌面即可），<b>双击用浏览器打开</b>。</li>
  <li>推荐 <b>Chrome</b> 或 <b>Edge</b>。Safari 和隐私窗口可能禁用本地存储，会影响保存功能。</li>
  <li>首次打开是激活页，粘贴你收到的密钥，点「激活并开始使用」。</li>
</ol>
<figure class="shot-sm">
  <img src="${img('01-gate')}" alt="激活页">
  <figcaption>第一次打开会看到这个页面，粘贴密钥即可进入</figcaption>
</figure>
<div class="tip">
  <b>有效期从「激活当天」开始算，不是购买那天。</b>买完先放着不激活，不会浪费天数。
  到期日当天仍可正常使用。
</div>

<h2>二、认识界面</h2>
<figure>
  <img src="${img('02-main')}" alt="主界面">
  <figcaption>主界面：左边画图、中间画布、右边设置</figcaption>
</figure>
<table>
  <tr><th>左侧 · 绘图工具</th><td>画笔、橡皮、填充、取色器、框选；下方是 <b>MARD 221 色</b>标准色板，点一下即可选色</td></tr>
  <tr><th>中间 · 画布</th><td>滚轮缩放；按住<b>空格 + 左键拖动</b>可平移；每格上的小字是豆子色号</td></tr>
  <tr><th>右侧 · 设置</th><td>画布尺寸、参考底图、图片转拼豆</td></tr>
</table>

<h2>三、三种画法</h2>

<p><b>1. 直接画</b> —— 在色板选好颜色，在画布上按住左键涂抹。</p>
<p class="muted" style="margin-left:22px">
  <kbd>B</kbd> 画笔 · <kbd>E</kbd> 橡皮 · <kbd>T</kbd> 填充 · <kbd>G</kbd> 取色 · <kbd>M</kbd> 框选 ·
  <kbd>1</kbd>–<kbd>7</kbd> 笔刷大小 · <kbd>Ctrl</kbd>+<kbd>Z</kbd> 撤销
</p>

<p><b>2. 框选批量填色</b> —— 按 <kbd>M</kbd> 进入框选，在画布上拖出一个矩形，
再点「填充选区」整片填成当前颜色，或点「清空内容」整片擦掉。做大面积背景时最省事。</p>

<p><b>3. 上传图片自动转</b> —— 右侧「参考底图」点<b>上传图片</b>，选一张照片或插画，
然后在下方「图片转拼豆」点<b>转为拼豆图案</b>，软件会自动把图片换算成豆子色号。</p>

<div class="tip">
  <b>转图小技巧：</b>轮廓清晰的卡通图、Logo 效果最好；真人照片建议先用「像素风 / 线条图」滤镜处理一下。
  白底图记得勾上<b>「扣除白底」</b>；想让画面颜色更饱满、少一些死白，就勾<b>「白色抑制」</b>。
  <br>「采样」方式：实拍照片选<b>区域平均</b>，像素图或线条图选<b>中心点</b>（边缘更锐利）。
</div>

<h2>四、看结果、备豆子</h2>
<figure>
  <img src="${img('03-result')}" alt="转换结果">
  <figcaption>转换完成后，画布上直接显示每一格该放什么颜色的豆子</figcaption>
</figure>
<p>画布下方的<b>「已使用颜色」</b>会列出这张图用到哪些色号、每种需要多少颗 —— 照着这个清单买豆子就行，
不会多买也不会不够。</p>
<p>想保存成图片：点右上角 <b>导出 JPG</b>，会生成带色号图例的成品图，可以直接打印或发朋友圈。</p>

<h2>五、图纸库（付费功能）</h2>
<figure>
  <img src="${img('04-library')}" alt="图纸库">
  <figcaption>图纸库：保存多张图纸，随时切换</figcaption>
</figure>
<ul>
  <li><b>保存当前</b>：把现在这张图存进库里，以后随时点「打开」切回来</li>
  <li><b>批量导出</b>：勾选多张后点它，会打包成一个 ZIP 下载，里面每张都是带图例的 JPG</li>
</ul>
<div class="warn">
  <b>图纸库保存在浏览器本地，不是云端。</b>清除浏览器数据、换浏览器、换电脑都会看不到。
  重要的图请用右上角 <b>存档</b> 导出 <code>.json</code> 文件备份，换电脑后点 <b>恢复</b> 导入即可。
</div>

<h2>六、图纸尺寸怎么填</h2>
<p>尺寸填的是<b>豆子颗数</b>，不是厘米。想做多大，先按你的豆子规格换算：</p>
<table>
  <tr><th>想要的成品大小</th><td>5mm 标准豆 → <b>20 × 20 颗 = 10 × 10 cm</b>；<b>60 × 60 颗 = 30 × 30 cm</b></td></tr>
  <tr><th>换算规则</th><td>1 颗 5mm 豆 ≈ 0.5 cm；1 颗 2.6mm 迷你豆 ≈ 0.26 cm</td></tr>
</table>
<p class="muted">输入宽高后，下方会自动显示对应的厘米数，不用自己算。范围 4–200 颗。</p>

<h2>七、常见问题</h2>
<table>
  <tr><th>换了电脑 / 换了浏览器</th><td>输入<b>同一个密钥</b>即可，不绑设备。新环境下有效期会重新计算，不会因为换设备损失天数。</td></tr>
  <tr><th>提示「密钥无效」</th><td>多半是抄漏了字符。密钥支持大小写和空格，直接整段粘贴最稳妥。</td></tr>
  <tr><th>到期了怎么办</th><td>找作者买一张新密钥，粘贴后即可继续用。你的图纸和存档都还在。</td></tr>
  <tr><th>图纸不见了</th><td>图纸存在浏览器本地，清数据/换浏览器会丢。请用<b>存档</b>功能导出 <code>.json</code> 备份。</td></tr>
  <tr><th>提示「浏览器禁止了本地存储」</th><td>换 Chrome 或 Edge 打开；Safari 和隐私窗口可能禁用。</td></tr>
  <tr><th>能离线用吗</th><td>可以。整个软件就是这一个 HTML 文件，断网也能正常画图和导出，图片不会上传到任何地方。</td></tr>
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
