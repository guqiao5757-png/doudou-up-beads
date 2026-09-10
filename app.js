/* ============================================================
 * doudou up - 主逻辑
 * ------------------------------------------------------------
 * 目录
 *  1) 常量配置（调色板 / 尺寸预设 / 限制）
 *  2) 全局状态
 *  3) 通用工具函数
 *  4) 画布与标尺渲染
 *  5) 绘图交互（画笔 / 橡皮 / 取色器 / 填充）
 *  6) 调色板 UI
 *  7) 尺寸调整与图案变换
 *  8) 参考底图与图片转拼豆（RGB 欧式距离 + 白色抑制）
 *  9) 用量统计与清单
 * 10) 存档与导出（JSON / JPG / CSV）与数值限制
 * 11) 初始化
 * ============================================================ */
'use strict';

/* ---------- 1) 常量配置 ---------- */

/** 拼豆调色板：id 为色号，hex 为实际豆色（共 221 色，MARD221 标准版） */
const PALETTE = [
  { id: 'A1', name: '黄橙', hex: '#FAF4C8' },
  { id: 'A2', name: '黄橙', hex: '#FFFFD5' },
  { id: 'A3', name: '黄橙', hex: '#FEFF8B' },
  { id: 'A4', name: '黄橙', hex: '#FBED56' },
  { id: 'A5', name: '黄橙', hex: '#F4D738' },
  { id: 'A6', name: '黄橙', hex: '#FEAC4C' },
  { id: 'A7', name: '黄橙', hex: '#FE8B4C' },
  { id: 'A8', name: '黄橙', hex: '#FFDA45' },
  { id: 'A9', name: '黄橙', hex: '#FF995B' },
  { id: 'A10', name: '黄橙', hex: '#F77C31' },
  { id: 'A11', name: '黄橙', hex: '#FFDD99' },
  { id: 'A12', name: '黄橙', hex: '#FE9F72' },
  { id: 'A13', name: '黄橙', hex: '#FFC365' },
  { id: 'A14', name: '黄橙', hex: '#FD543D' },
  { id: 'A15', name: '黄橙', hex: '#FFF365' },
  { id: 'A16', name: '黄橙', hex: '#FFFF9F' },
  { id: 'A17', name: '黄橙', hex: '#FFE36E' },
  { id: 'A18', name: '黄橙', hex: '#FEBE7D' },
  { id: 'A19', name: '黄橙', hex: '#FD7C72' },
  { id: 'A20', name: '黄橙', hex: '#FFD568' },
  { id: 'A21', name: '黄橙', hex: '#FFE395' },
  { id: 'A22', name: '黄橙', hex: '#F4F57D' },
  { id: 'A23', name: '黄橙', hex: '#E6C9B7' },
  { id: 'A24', name: '黄橙', hex: '#F7F8A2' },
  { id: 'A25', name: '黄橙', hex: '#FFD67D' },
  { id: 'A26', name: '黄橙', hex: '#FFC830' },
  { id: 'B1', name: '绿', hex: '#E6EE31' },
  { id: 'B2', name: '绿', hex: '#63F347' },
  { id: 'B3', name: '绿', hex: '#9EF780' },
  { id: 'B4', name: '绿', hex: '#5DE035' },
  { id: 'B5', name: '绿', hex: '#35E352' },
  { id: 'B6', name: '绿', hex: '#65E2A6' },
  { id: 'B7', name: '绿', hex: '#3DAF80' },
  { id: 'B8', name: '绿', hex: '#1C9C4F' },
  { id: 'B9', name: '绿', hex: '#27523A' },
  { id: 'B10', name: '绿', hex: '#95D3C2' },
  { id: 'B11', name: '绿', hex: '#5D722A' },
  { id: 'B12', name: '绿', hex: '#166F41' },
  { id: 'B13', name: '绿', hex: '#CAEB7B' },
  { id: 'B14', name: '绿', hex: '#ADE946' },
  { id: 'B15', name: '绿', hex: '#2E5132' },
  { id: 'B16', name: '绿', hex: '#C5ED9C' },
  { id: 'B17', name: '绿', hex: '#9BB13A' },
  { id: 'B18', name: '绿', hex: '#E6EE49' },
  { id: 'B19', name: '绿', hex: '#24B88C' },
  { id: 'B20', name: '绿', hex: '#C2F0CC' },
  { id: 'B21', name: '绿', hex: '#156A6B' },
  { id: 'B22', name: '绿', hex: '#0B3C43' },
  { id: 'B23', name: '绿', hex: '#303A21' },
  { id: 'B24', name: '绿', hex: '#EEFCA5' },
  { id: 'B25', name: '绿', hex: '#4E846D' },
  { id: 'B26', name: '绿', hex: '#8D7A35' },
  { id: 'B27', name: '绿', hex: '#CCE1AF' },
  { id: 'B28', name: '绿', hex: '#9EE5B9' },
  { id: 'B29', name: '绿', hex: '#C5E254' },
  { id: 'B30', name: '绿', hex: '#E2FCB1' },
  { id: 'B31', name: '绿', hex: '#B0E792' },
  { id: 'B32', name: '绿', hex: '#9CAB5A' },
  { id: 'C1', name: '蓝青', hex: '#E8FFE7' },
  { id: 'C2', name: '蓝青', hex: '#A9F9FC' },
  { id: 'C3', name: '蓝青', hex: '#A0E2FB' },
  { id: 'C4', name: '蓝青', hex: '#41CCFF' },
  { id: 'C5', name: '蓝青', hex: '#01ACEB' },
  { id: 'C6', name: '蓝青', hex: '#50AAF0' },
  { id: 'C7', name: '蓝青', hex: '#3677D2' },
  { id: 'C8', name: '蓝青', hex: '#0F54C0' },
  { id: 'C9', name: '蓝青', hex: '#324BCA' },
  { id: 'C10', name: '蓝青', hex: '#3EBCE2' },
  { id: 'C11', name: '蓝青', hex: '#28DDDE' },
  { id: 'C12', name: '蓝青', hex: '#1C334D' },
  { id: 'C13', name: '蓝青', hex: '#CDE8FF' },
  { id: 'C14', name: '蓝青', hex: '#D5FDFF' },
  { id: 'C15', name: '蓝青', hex: '#22C4C6' },
  { id: 'C16', name: '蓝青', hex: '#1557A8' },
  { id: 'C17', name: '蓝青', hex: '#04D1F6' },
  { id: 'C18', name: '蓝青', hex: '#1D3344' },
  { id: 'C19', name: '蓝青', hex: '#1887A2' },
  { id: 'C20', name: '蓝青', hex: '#176DAF' },
  { id: 'C21', name: '蓝青', hex: '#BEDDFF' },
  { id: 'C22', name: '蓝青', hex: '#67B4BE' },
  { id: 'C23', name: '蓝青', hex: '#C8E2FF' },
  { id: 'C24', name: '蓝青', hex: '#7CC4FF' },
  { id: 'C25', name: '蓝青', hex: '#A9E5E5' },
  { id: 'C26', name: '蓝青', hex: '#3CAED8' },
  { id: 'C27', name: '蓝青', hex: '#D3DFFA' },
  { id: 'C28', name: '蓝青', hex: '#BBCFED' },
  { id: 'C29', name: '蓝青', hex: '#34488E' },
  { id: 'D1', name: '蓝紫', hex: '#AEB4F2' },
  { id: 'D2', name: '蓝紫', hex: '#858EDD' },
  { id: 'D3', name: '蓝紫', hex: '#2F54AF' },
  { id: 'D4', name: '蓝紫', hex: '#182A84' },
  { id: 'D5', name: '蓝紫', hex: '#B843C5' },
  { id: 'D6', name: '蓝紫', hex: '#AC7BDE' },
  { id: 'D7', name: '蓝紫', hex: '#8854B3' },
  { id: 'D8', name: '蓝紫', hex: '#E2D3FF' },
  { id: 'D9', name: '蓝紫', hex: '#D5B9F8' },
  { id: 'D10', name: '蓝紫', hex: '#361851' },
  { id: 'D11', name: '蓝紫', hex: '#B9BAE1' },
  { id: 'D12', name: '蓝紫', hex: '#DE9AD4' },
  { id: 'D13', name: '蓝紫', hex: '#B90095' },
  { id: 'D14', name: '蓝紫', hex: '#8B279B' },
  { id: 'D15', name: '蓝紫', hex: '#2F1F90' },
  { id: 'D16', name: '蓝紫', hex: '#E3E1EE' },
  { id: 'D17', name: '蓝紫', hex: '#C4D4F6' },
  { id: 'D18', name: '蓝紫', hex: '#A45EC7' },
  { id: 'D19', name: '蓝紫', hex: '#D8C3D7' },
  { id: 'D20', name: '蓝紫', hex: '#9C32B2' },
  { id: 'D21', name: '蓝紫', hex: '#9A009B' },
  { id: 'D22', name: '蓝紫', hex: '#333A95' },
  { id: 'D23', name: '蓝紫', hex: '#EBDAFC' },
  { id: 'D24', name: '蓝紫', hex: '#7786E5' },
  { id: 'D25', name: '蓝紫', hex: '#494FC7' },
  { id: 'D26', name: '蓝紫', hex: '#DFC2F8' },
  { id: 'E1', name: '粉玫', hex: '#FDD3CC' },
  { id: 'E2', name: '粉玫', hex: '#FEC0DF' },
  { id: 'E3', name: '粉玫', hex: '#FFB7E7' },
  { id: 'E4', name: '粉玫', hex: '#E8649E' },
  { id: 'E5', name: '粉玫', hex: '#F551A2' },
  { id: 'E6', name: '粉玫', hex: '#F13D74' },
  { id: 'E7', name: '粉玫', hex: '#C63478' },
  { id: 'E8', name: '粉玫', hex: '#FFDBE9' },
  { id: 'E9', name: '粉玫', hex: '#E970CC' },
  { id: 'E10', name: '粉玫', hex: '#D33793' },
  { id: 'E11', name: '粉玫', hex: '#FCDDD2' },
  { id: 'E12', name: '粉玫', hex: '#F78FC3' },
  { id: 'E13', name: '粉玫', hex: '#B5006D' },
  { id: 'E14', name: '粉玫', hex: '#FFD1BA' },
  { id: 'E15', name: '粉玫', hex: '#F8C7C9' },
  { id: 'E16', name: '粉玫', hex: '#FFF3EB' },
  { id: 'E17', name: '粉玫', hex: '#FFE2EA' },
  { id: 'E18', name: '粉玫', hex: '#FFC7DB' },
  { id: 'E19', name: '粉玫', hex: '#FEBAD5' },
  { id: 'E20', name: '粉玫', hex: '#D8C7D1' },
  { id: 'E21', name: '粉玫', hex: '#BD9DA1' },
  { id: 'E22', name: '粉玫', hex: '#B785A1' },
  { id: 'E23', name: '粉玫', hex: '#937A8D' },
  { id: 'E24', name: '粉玫', hex: '#E1BCE8' },
  { id: 'F1', name: '红', hex: '#FD957B' },
  { id: 'F2', name: '红', hex: '#FC3D46' },
  { id: 'F3', name: '红', hex: '#F74941' },
  { id: 'F4', name: '红', hex: '#FC283C' },
  { id: 'F5', name: '红', hex: '#E7002F' },
  { id: 'F6', name: '红', hex: '#943630' },
  { id: 'F7', name: '红', hex: '#971937' },
  { id: 'F8', name: '红', hex: '#BC0028' },
  { id: 'F9', name: '红', hex: '#E2677A' },
  { id: 'F10', name: '红', hex: '#8A4526' },
  { id: 'F11', name: '红', hex: '#5A2121' },
  { id: 'F12', name: '红', hex: '#FD4E6A' },
  { id: 'F13', name: '红', hex: '#F35744' },
  { id: 'F14', name: '红', hex: '#FFA9AD' },
  { id: 'F15', name: '红', hex: '#D30022' },
  { id: 'F16', name: '红', hex: '#FEC2A6' },
  { id: 'F17', name: '红', hex: '#E69C79' },
  { id: 'F18', name: '红', hex: '#D37C46' },
  { id: 'F19', name: '红', hex: '#C1444A' },
  { id: 'F20', name: '红', hex: '#CD9391' },
  { id: 'F21', name: '红', hex: '#F7B4C6' },
  { id: 'F22', name: '红', hex: '#FDC0D0' },
  { id: 'F23', name: '红', hex: '#F67E66' },
  { id: 'F24', name: '红', hex: '#E698AA' },
  { id: 'F25', name: '红', hex: '#E54B4F' },
  { id: 'G1', name: '棕肤', hex: '#FFE2CE' },
  { id: 'G2', name: '棕肤', hex: '#FFC4AA' },
  { id: 'G3', name: '棕肤', hex: '#F4C3A5' },
  { id: 'G4', name: '棕肤', hex: '#E1B383' },
  { id: 'G5', name: '棕肤', hex: '#EDB045' },
  { id: 'G6', name: '棕肤', hex: '#E99C17' },
  { id: 'G7', name: '棕肤', hex: '#9D5B3E' },
  { id: 'G8', name: '棕肤', hex: '#753832' },
  { id: 'G9', name: '棕肤', hex: '#E6B483' },
  { id: 'G10', name: '棕肤', hex: '#D98C39' },
  { id: 'G11', name: '棕肤', hex: '#E0C593' },
  { id: 'G12', name: '棕肤', hex: '#FFC890' },
  { id: 'G13', name: '棕肤', hex: '#B7714A' },
  { id: 'G14', name: '棕肤', hex: '#8D614C' },
  { id: 'G15', name: '棕肤', hex: '#FCF9E0' },
  { id: 'G16', name: '棕肤', hex: '#F2D9BA' },
  { id: 'G17', name: '棕肤', hex: '#78524B' },
  { id: 'G18', name: '棕肤', hex: '#FFE4CC' },
  { id: 'G19', name: '棕肤', hex: '#E07935' },
  { id: 'G20', name: '棕肤', hex: '#A94023' },
  { id: 'G21', name: '棕肤', hex: '#B88558' },
  { id: 'H1', name: '黑白', hex: '#FDFBFF' },
  { id: 'H2', name: '黑白', hex: '#FEFFFF' },
  { id: 'H3', name: '黑白', hex: '#B6B1BA' },
  { id: 'H4', name: '黑白', hex: '#89858C' },
  { id: 'H5', name: '黑白', hex: '#48464E' },
  { id: 'H6', name: '黑白', hex: '#2F2B2F' },
  { id: 'H7', name: '黑白', hex: '#000000' },
  { id: 'H8', name: '黑白', hex: '#E7D6DB' },
  { id: 'H9', name: '黑白', hex: '#EDEDED' },
  { id: 'H10', name: '黑白', hex: '#EEE9EA' },
  { id: 'H11', name: '黑白', hex: '#CECDD5' },
  { id: 'H12', name: '黑白', hex: '#FFF5ED' },
  { id: 'H13', name: '黑白', hex: '#F5ECD2' },
  { id: 'H14', name: '黑白', hex: '#CFD7D3' },
  { id: 'H15', name: '黑白', hex: '#98A6A8' },
  { id: 'H16', name: '黑白', hex: '#1D1414' },
  { id: 'H17', name: '黑白', hex: '#F1EDED' },
  { id: 'H18', name: '黑白', hex: '#FFFDF0' },
  { id: 'H19', name: '黑白', hex: '#F6EFE2' },
  { id: 'H20', name: '黑白', hex: '#949FA3' },
  { id: 'H21', name: '黑白', hex: '#FFFBE1' },
  { id: 'H22', name: '黑白', hex: '#CACAD4' },
  { id: 'H23', name: '黑白', hex: '#9A9D94' },
  { id: 'M1', name: '大地', hex: '#BCC6B8' },
  { id: 'M2', name: '大地', hex: '#8AA386' },
  { id: 'M3', name: '大地', hex: '#697D80' },
  { id: 'M4', name: '大地', hex: '#E3D2BC' },
  { id: 'M5', name: '大地', hex: '#D0CCAA' },
  { id: 'M6', name: '大地', hex: '#B0A782' },
  { id: 'M7', name: '大地', hex: '#B4A497' },
  { id: 'M8', name: '大地', hex: '#B38281' },
  { id: 'M9', name: '大地', hex: '#A58767' },
  { id: 'M10', name: '大地', hex: '#C5B2BC' },
  { id: 'M11', name: '大地', hex: '#9F7594' },
  { id: 'M12', name: '大地', hex: '#644749' },
  { id: 'M13', name: '大地', hex: '#D19066' },
  { id: 'M14', name: '大地', hex: '#C77362' },
  { id: 'M15', name: '大地', hex: '#757D78' }
];

const SIZE_PRESETS = [24, 32, 40, 48, 60];   // 快捷尺寸预设
const DEFAULT_SIZE = 60;                     // 默认 60×60
const MIN_SIZE = 4, MAX_SIZE = 200;          // 尺寸数值限制
const MIN_CELL = 4, MAX_CELL = 60;           // 格子像素限制（手动缩放范围）
const MIN_AUTO_CELL = 13;                    // 自动适应时的格子下限：低于此值色号会挤到看不清，宁可让画布滚动
const CODE_MIN_CELL = 11;                    // 小于该格子尺寸就不再绘制色号（字号已低于可读下限）
const BASE_CELL = 16;                        // 缩放百分比基准：16px/格 = 100%
const RULER_SIZE = 22;                       // 标尺厚度（与 CSS --ruler 保持一致）
const MAX_UNDO = 40;                         // 撤销栈深度
const EMPTY = -1;                            // 空格子标记

/* ---------- 点赞计数后端配置 ---------- */
const LIKE_API_BASE = '';                    // 后端地址，例如 'https://your-host.com'。留空=离线降级（本地种子值，非真实统计）
const LIKE_SEED = 128;                       // 离线降级时的本地起始人数（仅展示用）

/** 预计算：色号 -> 索引、RGB 缓存、是否"白色系" */
const IDX_BY_ID = new Map(PALETTE.map((p, i) => [p.id, i]));
const RGB_CACHE = PALETTE.map(p => hexToRgb(p.hex));
const IS_WHITISH = PALETTE.map(p => {
  const [r, g, b] = hexToRgb(p.hex);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return lum >= 232 && spread <= 20;         // 高亮度 + 低彩度 => 判为白系
});

/* ---------- 2) 全局状态 ---------- */
const state = {
  W: DEFAULT_SIZE,
  H: DEFAULT_SIZE,
  pixels: new Int16Array(DEFAULT_SIZE * DEFAULT_SIZE).fill(EMPTY), // 每格存调色板索引，EMPTY 表示无豆子
  cell: 14,               // 当前格子像素
  autoCell: true,         // 自动适应窗口
  tool: 'brush',
  colorIndex: 0,          // 当前绘制颜色
  brush: 1,               // 笔刷大小（像素格直径，1=单格）。橡皮/画笔共用
  brushShape: 'square',   // 笔刷形状：'square' 方形 / 'circle' 圆形
  select: null,           // 矩形选区 {c0,r0,c1,r1}（已规范化，含端点）；null 表示无选区
  showGrid: true,
  showCode: true,
  showRuler: true,
  showChecker: true,
  refImage: null,         // 参考底图 Image 对象
  refOpacity: 0.45,
  refFit: 'contain',
  showRef: false,         // 是否在画布上叠加参考图（置顶描图，默认关；原图预览始终在右侧面板显示）
  hover: null,            // {c, r} 当前悬停格
  undo: [],
  redo: []
};

/* ---------- 3) 通用工具函数 ---------- */
const $ = id => document.getElementById(id);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const clampInt = (v, min, max) => clamp(Math.round(Number(v) || min), min, max);

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** 依据底色亮度决定叠加文字的黑白，保证色号可读 */
function contrastText(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#1B1D21' : '#FFFFFF';
}

function luminance(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }

/** 圆角矩形路径（不依赖 ctx.roundRect，兼容性更好） */
function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 按设备像素比初始化画布，返回已缩放好的 2d 上下文 */
function prepareCanvas(cv, cssW, cssH) {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(cssW * dpr));
  const h = Math.max(1, Math.round(cssH * dpr));
  if (cv.width !== w) cv.width = w;
  if (cv.height !== h) cv.height = h;
  cv.style.width = cssW + 'px';
  cv.style.height = cssH + 'px';
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function toast(msg, type = '', ms = 2200) {
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = msg;
  $('toastWrap').appendChild(el);
  setTimeout(() => el.remove(), ms);
}

/* DOM 引用 */
const boardEl = $('board');
const rulerTopEl = $('rulerTop');
const rulerLeftEl = $('rulerLeft');
const wrapEl = $('canvasWrap');
const stageScroll = $('stageScroll');

/* ---------- 4) 画布与标尺渲染 ---------- */

/** 计算格子大小：自动模式按可视区域等比收缩，但不低于可读下限 */
function computeCellSize() {
  if (!state.autoCell) return clamp(state.cell, MIN_CELL, MAX_CELL);
  const box = stageScroll.getBoundingClientRect();
  const availW = Math.max(80, box.width - RULER_SIZE - 24);
  const availH = Math.max(80, box.height - RULER_SIZE - 24);
  const fit = Math.floor(Math.min(availW / state.W, availH / state.H));
  // 关键：自动模式下也不缩到小于 MIN_AUTO_CELL，否则色号会被挤没；超出部分由画布滚动查看
  return clamp(Math.max(fit, MIN_AUTO_CELL), MIN_CELL, MAX_CELL);
}

/** 重新计算格子尺寸并同步三块画布的物理尺寸 */
function layout() {
  const cell = computeCellSize();
  state.cell = cell;
  syncCellUI();
  const bw = state.W * cell, bh = state.H * cell;
  prepareCanvas(boardEl, bw, bh);
  if (state.showRuler) {
    prepareCanvas(rulerTopEl, bw, RULER_SIZE);
    prepareCanvas(rulerLeftEl, RULER_SIZE, bh);
  }
  renderAll();
}

/** 同步"格子大小"滑块、缩放百分比与提示文案，让界面显示的值和画面一致 */
function syncCellUI() {
  const slider = $('optCell');
  if (slider) {
    slider.value = clampInt(state.cell, MIN_CELL, MAX_CELL);
    const v = $('optCellVal'); if (v) v.textContent = state.cell + 'px';
  }
  $('btnZoomReset').textContent = Math.round(state.cell / BASE_CELL * 100) + '%';

  const hint = $('codeHint');
  if (!hint) return;
  if (!state.showCode) {
    hint.textContent = '色号显示已关闭（勾选上方开关可打开）';
    hint.className = 'hint';
  } else if (state.cell < CODE_MIN_CELL) {
    hint.textContent = '格子 ' + state.cell + 'px 太小，色号已隐藏；≥ ' + CODE_MIN_CELL + 'px 才会显示';
    hint.className = 'hint warn';
  } else if (state.cell < 16) {
    hint.textContent = '格子 ' + state.cell + 'px，色号偏小；把格子调到 16px 以上更清晰';
    hint.className = 'hint';
  } else {
    hint.textContent = '色号正常显示（当前 ' + state.cell + 'px/格）';
    hint.className = 'hint ok';
  }
}

/** 参考图在"格坐标"中的绘制矩形（单位=格） */
function refRect() {
  const img = state.refImage;
  const { W, H } = state;
  if (!img) return null;
  if (state.refFit === 'stretch') return { dx: 0, dy: 0, dw: W, dh: H };
  const ir = img.naturalWidth / img.naturalHeight;
  const br = W / H;
  if (ir > br) { const dh = W / ir; return { dx: 0, dy: (H - dh) / 2, dw: W, dh }; }
  const dw = H * ir;
  return { dx: (W - dw) / 2, dy: 0, dw, dh: H };
}

/**
 * 核心绘制：把图纸画到任意 ctx 上（导出图片 JPG 也复用它）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cell 格子像素
 * @param {object} o 显示开关 { checker, ref, grid, code, hover }
 */
function drawBoard(ctx, cell, o) {
  const { W, H } = state;
  const px = state.pixels;
  const w = W * cell, h = H * cell;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);

  // 5 格棋盘底：便于数格子
  if (o.checker && cell >= 6) {
    ctx.fillStyle = '#F1F3F6';
    for (let r = 0; r < H; r += 5) {
      for (let c = 0; c < W; c += 5) {
        if ((((r / 5) | 0) + ((c / 5) | 0)) % 2 === 0) continue;
        ctx.fillRect(c * cell, r * cell, Math.min(5, W - c) * cell, Math.min(5, H - r) * cell);
      }
    }
  }

  const drawRef = () => {
    const rect = refRect();
    if (!rect) return;
    ctx.save();
    ctx.globalAlpha = state.refOpacity;
    ctx.drawImage(state.refImage, rect.dx * cell, rect.dy * cell, rect.dw * cell, rect.dh * cell);
    ctx.restore();
  };

  // 色块
  const radius = Math.min(3, cell * 0.18);
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const idx = px[r * W + c];
      if (idx < 0) continue;
      const hex = PALETTE[idx].hex;
      const x = c * cell, y = r * cell;
      ctx.fillStyle = hex;
      if (cell >= 8) {
        roundRectPath(ctx, x + 0.5, y + 0.5, cell - 1, cell - 1, radius);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, cell, cell);
      }
    }
  }

  // 色块内的色号数字（格子够大才画，字号随格子线性放大且保证三字符放得下）
  if (o.code && cell >= CODE_MIN_CELL) {
    const fs = Math.min(15, Math.max(8, Math.floor(cell * 0.62)));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 ' + fs + 'px ui-monospace, Consolas, Menlo, monospace';
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const idx = px[r * W + c];
        if (idx < 0) continue;
        const p = PALETTE[idx];
        ctx.fillStyle = contrastText(p.hex);
        ctx.fillText(p.id, c * cell + cell / 2, r * cell + cell / 2 + 0.5);
      }
    }
  }

  // 参考图叠加（仅"置顶描图"模式，始终画在拼豆之上，不会被遮盖）
  if (o.ref && state.refImage) drawRef();

  // 格线：细线（每格）+ 每 10 格加粗（10×10 区块边界）+ 外框
  if (o.grid) {
    // 细线：每格一条，区块边界处留给粗线
    if (cell >= 4) {
      ctx.beginPath();
      for (let c = 1; c < W; c++) {
        if (c % 10 === 0) continue;
        ctx.moveTo(c * cell + 0.5, 0); ctx.lineTo(c * cell + 0.5, h);
      }
      for (let r = 1; r < H; r++) {
        if (r % 10 === 0) continue;
        ctx.moveTo(0, r * cell + 0.5); ctx.lineTo(w, r * cell + 0.5);
      }
      ctx.strokeStyle = 'rgba(31,35,40,0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // 每 10 格加粗线（10×10 区块边界）："白底描边 + 深核心"套边，深色图上也始终可见
    if (W > 10 || H > 10) {
      ctx.beginPath();
      for (let c = 10; c < W; c += 10) { ctx.moveTo(c * cell + 0.5, 0); ctx.lineTo(c * cell + 0.5, h); }
      for (let r = 10; r < H; r += 10) { ctx.moveTo(0, r * cell + 0.5); ctx.lineTo(w, r * cell + 0.5); }
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';  // 浅色外圈：深色底上可见
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(31,35,40,0.85)';     // 深色内核：浅色底上可见
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  // 画布外框：画在 canvas 内部，不占布局空间，保证与标尺严格对齐
  // 同样用"白底 + 深核心"套边，深色图也清晰
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 3;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  ctx.strokeStyle = 'rgba(31,35,40,0.85)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  // 悬停高亮
  if (o.hover) {
    ctx.strokeStyle = '#2F6FED';
    ctx.lineWidth = 2;
    ctx.strokeRect(o.hover.c * cell + 1, o.hover.r * cell + 1, cell - 2, cell - 2);
  }

  // 矩形选区高亮（半透明填充 + 虚线边框）
  if (state.select) {
    const s = state.select;
    const x = s.c0 * cell, y = s.r0 * cell;
    const w = (s.c1 - s.c0 + 1) * cell, h = (s.r1 - s.r0 + 1) * cell;
    ctx.fillStyle = 'rgba(47,111,237,0.18)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#2F6FED';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.setLineDash([]);
  }
}

function renderBoard() {
  drawBoard(boardEl.getContext('2d'), state.cell, {
    checker: state.showChecker,
    ref: state.showRef,
    grid: state.showGrid,
    code: state.showCode,
    hover: state.hover
  });
}

/** 让标尺刻度不重叠的"好看"步长（need = 单个标签所需的最小像素宽度） */
function niceStep(cell) {
  const need = cell >= 26 ? 16 : cell >= 16 ? 22 : 30;
  for (const s of [1, 2, 5, 10, 20, 25, 50, 100]) if (s * cell >= need) return s;
  return 100;
}

/** 顶部标尺：列号 */
function renderRulerTop() {
  const { W, cell } = state;
  const ctx = rulerTopEl.getContext('2d');
  const w = W * cell;
  ctx.clearRect(0, 0, w, RULER_SIZE);
  ctx.fillStyle = '#F7F8FA';
  ctx.fillRect(0, 0, w, RULER_SIZE);

  // 悬停列高亮
  if (state.hover) {
    ctx.fillStyle = 'rgba(47,111,237,0.16)';
    ctx.fillRect(state.hover.c * cell, 0, cell, RULER_SIZE);
  }

  const step = niceStep(cell);
  ctx.font = '10px ui-monospace, Consolas, Menlo, monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  // 刻度线
  ctx.beginPath();
  for (let c = 0; c <= W; c++) {
    const x = Math.round(c * cell) + 0.5;
    const major = c % 10 === 0, mid = c % 5 === 0;
    ctx.moveTo(x, RULER_SIZE - (major ? 9 : mid ? 6 : 4));
    ctx.lineTo(x, RULER_SIZE);
  }
  ctx.strokeStyle = 'rgba(31,35,40,0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 数字（1 起算），居中于该组格子
  ctx.fillStyle = '#6B7280';
  for (let c = 0; c < W; c += step) {
    const span = Math.min(step, W - c) * cell;
    const x = Math.min(c * cell + span / 2, w - 6);
    ctx.fillText(String(c + 1), x, RULER_SIZE / 2 - 2);
  }
  ctx.strokeStyle = '#E3E7ED';
  ctx.beginPath();
  ctx.moveTo(0, RULER_SIZE - 0.5); ctx.lineTo(w, RULER_SIZE - 0.5);
  ctx.stroke();
}

/** 左侧标尺：行号 */
function renderRulerLeft() {
  const { H, cell } = state;
  const ctx = rulerLeftEl.getContext('2d');
  const h = H * cell;
  ctx.clearRect(0, 0, RULER_SIZE, h);
  ctx.fillStyle = '#F7F8FA';
  ctx.fillRect(0, 0, RULER_SIZE, h);

  if (state.hover) {
    ctx.fillStyle = 'rgba(47,111,237,0.16)';
    ctx.fillRect(0, state.hover.r * cell, RULER_SIZE, cell);
  }

  const step = niceStep(cell);
  ctx.font = '10px ui-monospace, Consolas, Menlo, monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  ctx.beginPath();
  for (let r = 0; r <= H; r++) {
    const y = Math.round(r * cell) + 0.5;
    const major = r % 10 === 0, mid = r % 5 === 0;
    ctx.moveTo(RULER_SIZE - (major ? 9 : mid ? 6 : 4), y);
    ctx.lineTo(RULER_SIZE, y);
  }
  ctx.strokeStyle = 'rgba(31,35,40,0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#6B7280';
  for (let r = 0; r < H; r += step) {
    const span = Math.min(step, H - r) * cell;
    const y = Math.min(r * cell + span / 2, h - 5);
    ctx.fillText(String(r + 1), RULER_SIZE / 2 - 2, y);
  }
  ctx.strokeStyle = '#E3E7ED';
  ctx.beginPath();
  ctx.moveTo(RULER_SIZE - 0.5, 0); ctx.lineTo(RULER_SIZE - 0.5, h);
  ctx.stroke();
}

function renderAll() {
  wrapEl.classList.toggle('no-ruler', !state.showRuler);
  renderBoard();
  if (state.showRuler) { renderRulerTop(); renderRulerLeft(); }
}

/* ---------- 5) 绘图交互 ---------- */

let drawing = false;     // 是否正在绘制
let lastCell = null;     // 上一格，用于补全快速拖动的间隙
let paintingValue = 0;   // 本次绘制写入的值（颜色索引或 EMPTY）
let selecting = false;   // 是否正在拖拽框选
let selStart = null;     // 框选起点 {c, r}
let panning = false;     // 是否正在拖动平移画布
let panFrom = null;      // 平移起点 { x, y, px, py }
let spaceDown = false;   // 空格是否按下（空格 + 左键 = 拖动）
let panX = 0, panY = 0;  // 平移偏移（transform），与居中 margin:auto 叠加，任意缩放下都有效

function eventCell(e) {
  const rect = boardEl.getBoundingClientRect();
  const c = Math.floor((e.clientX - rect.left) / state.cell);
  const r = Math.floor((e.clientY - rect.top) / state.cell);
  if (c < 0 || r < 0 || c >= state.W || r >= state.H) return null;
  return { c, r };
}

function setPixel(c, r, val) {
  const i = r * state.W + c;
  if (state.pixels[i] === val) return false;
  state.pixels[i] = val;
  return true;
}

/** 笔刷盖章：以 (c,r) 为中心盖 state.brush 见方的色块，受选区蒙版限制；圆形笔刷按半径裁剪 */
function stamp(c, r, val) {
  const b = state.brush;
  const off = Math.floor((b - 1) / 2);
  const circle = state.brushShape === 'circle';
  const rad2 = ((b - 1) / 2) * ((b - 1) / 2) + 0.3; // 圆形判定半径平方（容差让 b=1 仍为单格）
  let changed = false;
  for (let dr = 0; dr < b; dr++) {
    for (let dc = 0; dc < b; dc++) {
      if (circle) {
        const dx = dc - off, dy = dr - off;
        if (dx * dx + dy * dy > rad2) continue;
      }
      const cc = c - off + dc, rr = r - off + dr;
      if (cc < 0 || rr < 0 || cc >= state.W || rr >= state.H) continue;
      if (state.select && !inSelect(cc, rr)) continue;
      changed = setPixel(cc, rr, val) || changed;
    }
  }
  return changed;
}

/** 判断某格是否在当前选区内（无选区时返回 true，表示不限） */
function inSelect(c, r) {
  const s = state.select;
  if (!s) return true;
  return c >= s.c0 && c <= s.c1 && r >= s.r0 && r <= s.r1;
}

/** Bresenham 连线，沿路径逐格盖章，避免快速拖动漏格 */
function lineTo(from, to, val) {
  let x0 = from.c, y0 = from.r;
  const x1 = to.c, y1 = to.r;
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let changed = false;
  for (;;) {
    changed = stamp(x0, y0, val) || changed;
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
  return changed;
}

/** 四邻域洪水填充 */
function floodFill(c, r, val) {
  const { W, H } = state;
  const target = state.pixels[r * W + c];
  if (target === val) return false;
  const stack = [[c, r]];
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const i = y * W + x;
    if (state.pixels[i] !== target) continue;
    state.pixels[i] = val;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return true;
}

/** 判断是否命中"平移"手势：中键 / 空格+左键 / Alt+左键 */
function wantPan(e) {
  return e.button === 1 || (e.button === 0 && (spaceDown || e.altKey));
}

function beginStroke(e) {
  // 平移优先：中键或空格/Alt + 左键
  if (wantPan(e)) { startPan(e); return; }

  const cell = eventCell(e);
  if (!cell) return;
  const rightBtn = e.button === 2;

  // 框选模式：开始拖拽矩形选区（单击不拖动 = 取消已有选区）
  if (state.tool === 'select' && !rightBtn) {
    selecting = true;
    selStart = cell;
    state.select = { c0: cell.c, r0: cell.r, c1: cell.c, r1: cell.r };
    boardEl.setPointerCapture(e.pointerId);
    renderAll();
    return;
  }

  // 选区存在时右键 = 清空选区内容（保留选框，可继续填）
  if (rightBtn && state.select) {
    pushUndo();
    fillSelection(EMPTY);
    afterEdit();
    toast('已清空选区');
    return;
  }

  const tool = rightBtn ? 'eraser' : state.tool;

  if (tool === 'picker') {
    const idx = state.pixels[cell.r * state.W + cell.c];
    if (idx >= 0) { selectColor(idx); toast('已取色 ' + PALETTE[idx].id + ' ' + PALETTE[idx].name); }
    else toast('该格为空，没有可取的豆色', 'warn');
    setTool('brush');
    return;
  }

  pushUndo();
  if (tool === 'fill') {
    floodFill(cell.c, cell.r, state.colorIndex);
    afterEdit();
    return;
  }
  drawing = true;
  paintingValue = (tool === 'eraser') ? EMPTY : state.colorIndex;
  lastCell = cell;
  stamp(cell.c, cell.r, paintingValue);
  boardEl.setPointerCapture(e.pointerId);
  afterEdit();
}

/** 判断两次悬停格是否相同 */
function sameCell(a, b) {
  if (!a || !b) return !a && !b;
  return a.c === b.c && a.r === b.r;
}

function moveStroke(e) {
  if (panning) return;          // 平移中不处理绘制与悬停
  const cell = eventCell(e);
  let needRender = false;

  // 悬停格变化 => 重绘高亮与标尺
  if (!sameCell(state.hover, cell)) { state.hover = cell; needRender = true; }

  // 正在框选 => 实时更新选区预览
  if (selecting && cell) {
    state.select.c1 = cell.c;
    state.select.r1 = cell.r;
    needRender = true;
  }
  // 正在绘制 => 补线并写入像素
  else if (drawing && cell) {
    if (lastCell) lineTo(lastCell, cell, paintingValue);
    else stamp(cell.c, cell.r, paintingValue);
    lastCell = cell;
    needRender = true;
    updateStats();      // 实时统计
  }

  // 合并成一次重绘，避免拖动时重复渲染
  if (needRender) renderAll();
}

function endStroke() {
  if (selecting) {
    selecting = false;
    const s = state.select;
    if (s) {
      // 规范化（拖动方向任意），单击未拖动则视为取消选区
      const c0 = Math.min(s.c0, s.c1), c1 = Math.max(s.c0, s.c1);
      const r0 = Math.min(s.r0, s.r1), r1 = Math.max(s.r0, s.r1);
      if (c0 === c1 && r0 === r1) state.select = null;
      else state.select = { c0, r0, c1, r1 };
    }
    renderAll();
    return;
  }
  drawing = false; lastCell = null; endPan();
}

/** 把当前选区整体写入某个值（填色或清空），调用前需自行 pushUndo */
function fillSelection(val) {
  const s = state.select; if (!s) return;
  const { W } = state;
  for (let r = s.r0; r <= s.r1; r++)
    for (let c = s.c0; c <= s.c1; c++)
      state.pixels[r * W + c] = val;
}

/** 取消选区 */
function clearSelect() { state.select = null; renderAll(); }

/** 编辑后统一刷新（渲染 + 统计） */
function afterEdit() { renderBoard(); updateStats(); }

boardEl.addEventListener('pointerdown', e => { e.preventDefault(); beginStroke(e); });
boardEl.addEventListener('pointermove', moveStroke);
window.addEventListener('pointerup', endStroke);
boardEl.addEventListener('pointerleave', () => { if (state.hover) { state.hover = null; renderAll(); } });
boardEl.addEventListener('contextmenu', e => e.preventDefault());
boardEl.addEventListener('auxclick', e => e.preventDefault());   // 屏蔽中键自动滚动

/* ---------- 5.1 画布缩放与平移 ---------- */

/**
 * 设置格子大小。传 anchor 时以该屏幕坐标为锚点缩放，
 * 保证缩放前后"光标下的那一格"停在原处。
 */
function setCell(cell, anchor) {
  const next = clamp(Math.round(cell), MIN_CELL, MAX_CELL);
  if (!anchor) {
    state.cell = next;
    layout();
    return;
  }
  // 1) 记下锚点当前对应的格子坐标（含小数）
  const before = boardEl.getBoundingClientRect();
  const gx = (anchor.x - before.left) / state.cell;
  const gy = (anchor.y - before.top) / state.cell;

  // 2) 应用新格子尺寸并重排
  state.cell = next;
  layout();

  // 3) 把同一格坐标重新挪回光标处（用 transform 平移，不依赖滚动条，缩放下都生效）
  const after = boardEl.getBoundingClientRect();
  const dx = (after.left + gx * state.cell) - anchor.x;
  const dy = (after.top + gy * state.cell) - anchor.y;
  panX -= dx; panY -= dy;
  applyPan();
}

/** 按倍率缩放（切换到手动模式，不再自动适应窗口） */
function zoomBy(factor, anchor) {
  state.autoCell = false;
  const ac = $('optAutoCell'); if (ac) ac.checked = false;
  const oc = $('optCell'); if (oc) oc.disabled = false;
  let next = Math.round(state.cell * factor);
  // 至少变动 1px：否则最小格子处 4×1.12=4.48 取整仍是 4，滚轮缩到最小后就再也放不大
  if (factor !== 1 && next === state.cell) next = state.cell + (factor > 1 ? 1 : -1);
  setCell(next, anchor);
  syncToggles();
}

/** 恢复自动适应窗口 */
function fitToWindow() {
  state.autoCell = true;
  const ac = $('optAutoCell'); if (ac) ac.checked = true;
  const oc = $('optCell'); if (oc) oc.disabled = true;
  panX = 0; panY = 0; applyPan();          // 复位平移，重新居中
  stageScroll.scrollLeft = 0; stageScroll.scrollTop = 0;
  layout();
  syncToggles();
}

// 滚轮缩放：以光标为锚点。
// 挂在画布视口（stageScroll）而非 board 上：画布缩得很小时，鼠标在周边空白滚轮也能缩放。
stageScroll.addEventListener('wheel', e => {
  e.preventDefault();
  zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, { x: e.clientX, y: e.clientY });
}, { passive: false });

// 应用平移偏移（叠加在 margin:auto 居中之上，任意缩放下都生效）
function applyPan() {
  wrapEl.style.transform = 'translate(' + panX + 'px,' + panY + 'px)';
}

// 拖动平移
function startPan(e) {
  panning = true;
  panFrom = { x: e.clientX, y: e.clientY, px: panX, py: panY };
  boardEl.setPointerCapture(e.pointerId);
  boardEl.classList.remove('is-grab');
  boardEl.classList.add('is-grabbing');
  e.preventDefault();
}
function endPan() {
  if (!panning) return;
  panning = false;
  panFrom = null;
  boardEl.classList.remove('is-grabbing');
  if (spaceDown) boardEl.classList.add('is-grab');
}
window.addEventListener('pointermove', e => {
  if (!panning || !panFrom) return;
  panX = panFrom.px + (e.clientX - panFrom.x);   // 抓手语义：画布跟随光标
  panY = panFrom.py + (e.clientY - panFrom.y);
  applyPan();
});

/* ---------- 撤销 / 重做 ---------- */
function pushUndo() {
  state.undo.push(state.pixels.slice());
  if (state.undo.length > MAX_UNDO) state.undo.shift();
  state.redo.length = 0;
  updateHistoryButtons();
}
function updateHistoryButtons() {
  $('btnUndo').disabled = state.undo.length === 0;
  $('btnRedo').disabled = state.redo.length === 0;
}
function undo() {
  if (!state.undo.length) return;
  state.redo.push(state.pixels.slice());
  state.pixels = state.undo.pop();
  updateHistoryButtons(); afterEdit();
}
function redo() {
  if (!state.redo.length) return;
  state.undo.push(state.pixels.slice());
  state.pixels = state.redo.pop();
  updateHistoryButtons(); afterEdit();
}
$('btnUndo').addEventListener('click', undo);
$('btnRedo').addEventListener('click', redo);

/* ---------- 工具切换 ---------- */
function setTool(tool) {
  state.tool = tool;
  document.querySelectorAll('#toolGrid .tool').forEach(b => b.classList.toggle('is-active', b.dataset.tool === tool));
}
document.querySelectorAll('#toolGrid .tool').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
// 笔刷大小：1/2/3/5/7 像素格，画笔与橡皮共用
document.querySelectorAll('#brushSize .bs').forEach(b => b.addEventListener('click', () => {
  state.brush = +b.dataset.size;
  document.querySelectorAll('#brushSize .bs').forEach(x => x.classList.toggle('is-active', x === b));
}));
// 笔刷形状：方形 / 圆形
document.querySelectorAll('#brushSize .bs-shape').forEach(b => b.addEventListener('click', () => {
  state.brushShape = b.dataset.shape;
  document.querySelectorAll('#brushSize .bs-shape').forEach(x => x.classList.toggle('is-active', x === b));
}));

// 选区操作：显式按钮，降低「批量填色」的发现成本
$('btnFillSel').addEventListener('click', () => {
  if (!state.select) { toast('先用「框选」工具拖出一片区域', 'warn'); return; }
  pushUndo();
  fillSelection(state.colorIndex);
  afterEdit();
  const s = state.select;
  toast('已填充选区 ' + (s.c1 - s.c0 + 1) + '×' + (s.r1 - s.r0 + 1) + ' 格');
});
$('btnClearSel').addEventListener('click', () => {
  if (!state.select) return;
  pushUndo();
  fillSelection(EMPTY);
  afterEdit();
  toast('已清空选区内容');
});
$('btnCancelSel').addEventListener('click', () => { clearSelect(); toast('已取消选区'); });

/* ---------- 6) 调色板 UI ---------- */
function buildPalette() {
  const box = $('palette');
  box.innerHTML = '';
  PALETTE.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'sw';
    b.style.background = p.hex;
    b.dataset.idx = i;
    b.title = p.id + ' ' + p.name + ' ' + p.hex;
    b.addEventListener('click', () => selectColor(i));
    box.appendChild(b);
  });
  $('paletteCount').textContent = PALETTE.length;
}

function selectColor(i) {
  const fromPicker = state.tool === 'picker';
  state.colorIndex = clamp(i, 0, PALETTE.length - 1);
  const p = PALETTE[state.colorIndex];
  $('ccSwatch').style.background = p.hex;
  $('ccCode').textContent = p.id;
  $('ccName').textContent = p.name;
  $('ccHex').value = p.hex.toUpperCase();
  $('ccNative').value = p.hex.toLowerCase();
  document.querySelectorAll('#palette .sw').forEach(el => el.classList.toggle('is-active', +el.dataset.idx === state.colorIndex));
  if (state.tool === 'eraser' || state.tool === 'picker') setTool('brush');
  // 同步使用颜色条的高亮
  document.querySelectorAll('.used-chip').forEach(el => el.classList.toggle('is-active', +el.dataset.idx === state.colorIndex));
  // 若已有选区，则整片填充（批量填色）；取色器取色时不触发
  if (state.select && !fromPicker) {
    pushUndo();
    fillSelection(state.colorIndex);
    afterEdit();
    const s = state.select;
    toast('已填充选区 ' + (s.c1 - s.c0 + 1) + '×' + (s.r1 - s.r0 + 1) + ' 格');
  }
}

/** 搜索：按色号 / 名称 / HEX 过滤 */
function filterPalette(kw) {
  const q = kw.trim().toLowerCase();
  let shown = 0;
  document.querySelectorAll('#palette .sw').forEach(el => {
    const p = PALETTE[+el.dataset.idx];
    const hit = !q || p.id.toLowerCase().includes(q) || p.name.includes(q) || p.hex.toLowerCase().includes(q);
    el.style.display = hit ? '' : 'none';
    if (hit) shown++;
  });
  $('paletteEmpty').hidden = shown > 0;
}
$('colorSearch').addEventListener('input', e => filterPalette(e.target.value));

/** 自定义颜色：吸附到最接近的豆色 */
function pickNearest(hex) {
  const [r, g, b] = hexToRgb(hex);
  selectColor(matchColor(r, g, b, 1));
}
$('ccNative').addEventListener('input', e => pickNearest(e.target.value));
$('ccHex').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const v = e.target.value.trim();
  if (/^#?[0-9a-fA-F]{6}$/.test(v)) pickNearest(v.startsWith('#') ? v : '#' + v);
  else toast('请输入 6 位 HEX，如 #FF8C1A', 'warn');
});

/* ---------- 7) 尺寸调整与图案变换 ---------- */

/** 调整画布尺寸，保留重叠区域内容 */
function resizeBoard(W, H) {
  W = clampInt(W, MIN_SIZE, MAX_SIZE);
  H = clampInt(H, MIN_SIZE, MAX_SIZE);
  if (W === state.W && H === state.H) return;
  const old = state.pixels, oW = state.W, oH = state.H;
  const next = new Int16Array(W * H).fill(EMPTY);
  const cw = Math.min(W, oW), ch = Math.min(H, oH);
  for (let r = 0; r < ch; r++)
    for (let c = 0; c < cw; c++)
      next[r * W + c] = old[r * oW + c];
  pushUndo();
  state.pixels = next; state.W = W; state.H = H;
  $('inW').value = W; $('inH').value = H;
  syncPresetActive();
  $('sizeBadge').textContent = W + ' × ' + H;
  state.hover = null;
  layout();
  updateStats();
}

function syncPresetActive() {
  document.querySelectorAll('#presetRow .chip').forEach(b => {
    const s = +b.dataset.size;
    b.classList.toggle('is-active', s === state.W && s === state.H);
  });
}

document.querySelectorAll('#presetRow .chip').forEach(b => {
  b.addEventListener('click', () => {
    const s = clampInt(b.dataset.size, MIN_SIZE, MAX_SIZE);
    resizeBoard(s, s);
  });
});
/** 按当前宽/高输入框创建自定义尺寸图纸 */
function applyCustomSize() {
  resizeBoard($('inW').value, $('inH').value);
}
$('btnApplySize').addEventListener('click', applyCustomSize);
// 在宽/高输入框内按回车也能创建图纸
['inW', 'inH'].forEach(id => $(id).addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); applyCustomSize(); }
}));

/** 图案变换：镜像与 90° 旋转（旋转会互换宽高） */
function transform(kind) {
  const { W, H } = state;
  const src = state.pixels;
  let nW = W, nH = H, out;

  if (kind === 'mirrorH') {
    out = new Int16Array(W * H);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) out[r * W + c] = src[r * W + (W - 1 - c)];
  } else if (kind === 'mirrorV') {
    out = new Int16Array(W * H);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) out[r * W + c] = src[(H - 1 - r) * W + c];
  } else if (kind === 'rotCW') {
    nW = H; nH = W; out = new Int16Array(nW * nH);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) out[c * nW + (H - 1 - r)] = src[r * W + c];
  } else { // rotCCW
    nW = H; nH = W; out = new Int16Array(nW * nH);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) out[(W - 1 - c) * nW + r] = src[r * W + c];
  }

  pushUndo();
  state.pixels = out;
  state.W = nW; state.H = nH;
  $('inW').value = nW; $('inH').value = nH;
  $('sizeBadge').textContent = nW + ' × ' + nH;
  syncPresetActive();
  state.hover = null;
  layout();
  updateStats();
  toast('已' + ({ mirrorH: '水平镜像', mirrorV: '垂直镜像', rotCW: '顺时针旋转 90°', rotCCW: '逆时针旋转 90°' })[kind]);
}
document.querySelectorAll('[data-tf]').forEach(b => b.addEventListener('click', () => transform(b.dataset.tf)));

/* ---------- 8) 参考底图与图片转拼豆 ---------- */

let refUrl = null;   // 参考图 object URL，便于移除时 revoke

function loadImageFile(file) {
  if (!file || !/^image\//.test(file.type)) { toast('请选择图片文件', 'err'); return; }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    state.refImage = img;
    refUrl = url;
    $('btnRemoveImg').disabled = false;
    // 右侧面板显示原图（画布范围外，不被拼豆遮盖）
    const box = $('refPreviewBox'); if (box) box.hidden = false;
    const pv = $('refPreview'); if (pv) pv.src = url;
    $('refInfo').textContent = '参考图：' + file.name + '（' + img.naturalWidth + '×' + img.naturalHeight + '）';
    $('refInfo').className = 'hint ok';
    renderAll();
    toast('参考图已载入');
  };
  img.onerror = () => { toast('图片读取失败', 'err'); URL.revokeObjectURL(url); };
  img.src = url;
}

/** 移除参考图（同步清掉原图预览与画布叠加），清空画布时也会调用 */
function removeRef() {
  state.refImage = null;
  if (refUrl) { try { URL.revokeObjectURL(refUrl); } catch (e) {} refUrl = null; }
  const box = $('refPreviewBox'); if (box) box.hidden = true;
  const pv = $('refPreview'); if (pv) pv.src = '';
  const rm = $('btnRemoveImg'); if (rm) rm.disabled = true;
  const info = $('refInfo');
  if (info) { info.textContent = '未载入参考图，可上传图片、把图片拖到画布上，或按 Ctrl+V 粘贴。'; info.className = 'hint'; }
  renderAll();
}

$('btnUploadImg').addEventListener('click', () => {
  try { $('fileImg').click(); }
  catch (e) { toast('当前环境禁止文件选择，请把图片直接拖到画布上，或按 Ctrl+V 粘贴', 'warn'); }
});
$('fileImg').addEventListener('change', e => { if (e.target.files[0]) loadImageFile(e.target.files[0]); e.target.value = ''; });
// 粘贴图片作为参考图（Ctrl+V），兼容文件选择被禁用的预览环境
window.addEventListener('paste', e => {
  const dt = e.clipboardData || window.clipboardData;
  if (!dt || !dt.items) return;
  for (const it of dt.items) {
    if (it.kind === 'file' && /^image\//.test(it.type)) {
      const f = it.getAsFile();
      if (f) loadImageFile(f);
      break;
    }
  }
});
$('btnRemoveImg').addEventListener('click', removeRef);

// 拖拽上传
['dragover', 'drop'].forEach(ev => stageScroll.addEventListener(ev, e => {
  e.preventDefault();
  if (ev === 'drop' && e.dataTransfer.files[0]) loadImageFile(e.dataTransfer.files[0]);
}));

$('inOpacity').addEventListener('input', e => {
  state.refOpacity = clampInt(e.target.value, 0, 100) / 100;
  $('opacityVal').textContent = Math.round(state.refOpacity * 100) + '%';
  renderBoard();
});
$('selFit').addEventListener('change', e => { state.refFit = e.target.value; renderBoard(); });
$('optShowRef').addEventListener('change', e => { state.showRef = e.target.checked; renderBoard(); });

/** RGB 欧式距离匹配最接近的豆色；penalty 为白色系的距离惩罚倍数 */
function matchColor(r, g, b, penalty) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < PALETTE.length; i++) {
    const c = RGB_CACHE[i];
    let d = Math.sqrt((r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2);
    if (penalty > 1 && IS_WHITISH[i]) d *= penalty;   // 关键：抑制白色被过度匹配
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

/** 采样参考图在某一格中心（或区域平均）处的颜色，越界返回 null */
function sampleCell(data, iw, ih, rect, c, r, avg) {
  const toXY = (u, v) => [
    Math.floor((u - rect.dx) / rect.dw * iw),
    Math.floor((v - rect.dy) / rect.dh * ih)
  ];
  const at = (ix, iy) => {
    if (ix < 0 || iy < 0 || ix >= iw || iy >= ih) return null;
    const o = (iy * iw + ix) * 4;
    return [data[o], data[o + 1], data[o + 2], data[o + 3]];
  };

  if (!avg) return at(...toXY(c + 0.5, r + 0.5));

  // 区域平均：每格采样 n×n 个点，按 alpha 加权
  const spanX = iw / rect.dw, spanY = ih / rect.dh;
  const n = clamp(Math.round(Math.min(spanX, spanY, 4)), 1, 4);
  let sr = 0, sg = 0, sb = 0, sa = 0, cnt = 0;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const p = at(...toXY(c + (i + 0.5) / n, r + (j + 0.5) / n));
      if (!p) continue;
      if (p[3] < 16) { cnt++; continue; }        // 透明像素按背景计入，避免拉偏色
      sr += p[0] * p[3]; sg += p[1] * p[3]; sb += p[2] * p[3]; sa += p[3]; cnt++;
    }
  }
  if (!cnt || !sa) return sa === 0 && cnt ? [0, 0, 0, 0] : null;
  return [sr / sa, sg / sa, sb / sa, sa / cnt];
}

/** 把参考图一次性解码成像素数组（转换迭代时复用，避免重复解码） */
function readRefPixels() {
  const img = state.refImage;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const off = document.createElement('canvas');
  off.width = iw; off.height = ih;
  const octx = off.getContext('2d', { willReadFrequently: true });
  octx.drawImage(img, 0, 0);
  return { data: octx.getImageData(0, 0, iw, ih).data, iw, ih };
}

/** 用给定惩罚系数跑一遍转换，返回 {pixels, filled, white}（不修改 state） */
function runMatch(img, penalty, cutEnabled, cutTh, avg) {
  const { data, iw, ih } = img;
  const rect = refRect();
  const { W, H } = state;
  const out = new Int16Array(W * H).fill(EMPTY);
  let filled = 0, white = 0;

  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const p = sampleCell(data, iw, ih, rect, c, r, avg);
      if (!p) continue;                                   // 画布留白区域 => 不放豆
      const [R, G, B, A] = p;
      if (A < 16) continue;                               // 透明 => 不放豆
      if (cutEnabled && luminance(R, G, B) >= cutTh) continue; // 扣白底
      const idx = matchColor(R, G, B, penalty);
      out[r * W + c] = idx;
      filled++;
      if (IS_WHITISH[idx]) white++;
    }
  }
  return { pixels: out, filled, white };
}

/** 图片转拼豆主流程：含"自动抑制白色"的迭代加码 */
function convertImage() {
  if (!state.refImage) { toast('请先上传参考底图', 'warn'); return; }

  const avg = $('selSample').value === 'average';
  const cutEnabled = $('optCutWhite').checked;
  const cutTh = clampInt($('inCutTh').value, 200, 255);
  const suppress = $('optSuppress').checked;
  const autoSuppress = $('optAutoSuppress').checked;
  const limit = clampInt($('inWhiteLimit').value, 10, 60) / 100;

  const imgData = readRefPixels();
  let penalty = suppress ? clampInt($('inPenalty').value, 10, 40) / 10 : 1;
  let res = runMatch(imgData, penalty, cutEnabled, cutTh, avg);
  let tries = 0;
  // 白色仍过多时自动加大惩罚系数，最多迭代 5 次
  while (autoSuppress && res.filled > 0 && res.white / res.filled > limit && tries < 5) {
    penalty = Math.min(6, penalty * 1.4);
    res = runMatch(imgData, penalty, cutEnabled, cutTh, avg);
    tries++;
  }

  pushUndo();
  state.pixels = res.pixels;
  afterEdit();

  const ratio = res.filled ? (res.white / res.filled * 100) : 0;
  const info = $('convertInfo');
  info.className = 'hint' + (ratio > 45 ? ' warn' : ' ok');
  info.textContent = '已转换：填充 ' + res.filled + ' 格，白色占比 ' + ratio.toFixed(1) +
    '%，实际抑制系数 ' + penalty.toFixed(1) + (tries ? '（自动加码 ' + tries + ' 次）' : '');
  toast('转换完成，共 ' + res.filled + ' 颗豆子');
}

$('btnConvert').addEventListener('click', convertImage);

/* ---------- 9) 用量统计与清单 ---------- */
function computeStats() {
  const counts = new Map();
  let total = 0, white = 0;
  const px = state.pixels;
  for (let i = 0; i < px.length; i++) {
    const idx = px[i];
    if (idx < 0) continue;
    counts.set(idx, (counts.get(idx) || 0) + 1);
    total++;
    if (IS_WHITISH[idx]) white++;
  }
  const list = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return { list, total, white, kinds: list.length };
}

function updateStats() {
  const { list, total, white, kinds } = computeStats();

  $('statTotal').textContent = total.toLocaleString('zh-CN');
  $('statWhite').textContent = (total ? (white / total * 100).toFixed(1) : '0.0') + '%';
  $('usedSummary').textContent = kinds + ' 种 / ' + total + ' 颗';

  // 用量清单
  const box = $('statList');
  box.innerHTML = '';
  if (!list.length) {
    box.innerHTML = '<span class="used-empty">暂无数据</span>';
  } else {
    const max = list[0][1];
    list.forEach(([idx, n]) => {
      const p = PALETTE[idx];
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.title = p.id + ' ' + p.name + '：' + n + ' 颗';
      row.innerHTML =
        '<i style="background:' + p.hex + '"></i>' +
        '<span class="sr-code">' + p.id + '</span>' +
        '<span class="sr-name">' + p.name + '</span>' +
        '<span class="sr-bar"><i style="width:' + (n / max * 100).toFixed(1) + '%;background:' + p.hex + '"></i></span>' +
        '<span class="sr-cnt">' + n + '</span>' +
        '<span class="sr-pct">' + (n / total * 100).toFixed(1) + '%</span>';
      row.addEventListener('click', () => selectColor(idx));
      box.appendChild(row);
    });
  }

  // 画布下方的已用颜色色号条
  const bar = $('usedBar');
  bar.innerHTML = '';
  if (!list.length) {
    bar.innerHTML = '<span class="used-empty">暂无已使用颜色，用画笔在画布上点一下试试</span>';
  } else {
    list.forEach(([idx, n]) => {
      const p = PALETTE[idx];
      const chip = document.createElement('button');
      chip.className = 'used-chip' + (idx === state.colorIndex ? ' is-active' : '');
      chip.dataset.idx = idx;
      chip.title = p.id + ' ' + p.name + ' × ' + n;
      chip.innerHTML = '<i style="background:' + p.hex + '"></i><b>' + p.id + '</b><span>' + n + '</span>';
      chip.addEventListener('click', () => selectColor(idx));
      bar.appendChild(chip);
    });
  }
}

/* ---------- 10) 存档与导出（JSON / JPG / CSV）与数值限制 ---------- */

function saveJson() {
  const payload = {
    app: 'bead-pattern-studio',
    version: 1,
    savedAt: new Date().toISOString(),
    width: state.W,
    height: state.H,
    paletteSize: PALETTE.length,
    // 存色号字符串，便于人工查看与跨版本兼容；null 代表空格
    pixels: Array.from(state.pixels, i => (i < 0 ? null : PALETTE[i].id))
  };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  downloadBlob(blob, 'doudou up_' + state.W + 'x' + state.H + '_' + dateStamp() + '.json', '工程已保存');
}

// 兼容旧版零填充色号（A01…H06 → A1…H6），新 MARD221 标准使用无前导零格式（A1…M15）
function normColorId(v) {
  const s = String(v == null ? '' : v).toUpperCase().trim();
  const m = /^([A-Z])0(\d)$/.exec(s);
  return m ? m[1] + m[2] : s;
}

function loadJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const d = JSON.parse(reader.result);
      const W = clampInt(d.width, MIN_SIZE, MAX_SIZE);
      const H = clampInt(d.height, MIN_SIZE, MAX_SIZE);
      const src = Array.isArray(d.pixels) ? d.pixels : null;
      if (!src || src.length !== W * H) throw new Error('像素数据与尺寸不匹配');

      const next = new Int16Array(W * H).fill(EMPTY);
      let unknown = 0;
      for (let i = 0; i < next.length; i++) {
        const v = src[i];
        if (v === null || v === undefined || v === '') continue;
        const idx = IDX_BY_ID.get(normColorId(v));
        if (idx === undefined) { unknown++; continue; }
        next[i] = idx;
      }
      pushUndo();
      state.pixels = next; state.W = W; state.H = H;
      $('inW').value = W; $('inH').value = H;
      $('sizeBadge').textContent = W + ' × ' + H;
      syncPresetActive();
      state.hover = null;
      panX = 0; panY = 0; applyPan();        // 载入后重新居中
      stageScroll.scrollLeft = 0; stageScroll.scrollTop = 0;
      layout();
      updateStats();
      toast('工程已读取' + (unknown ? '（' + unknown + ' 个未知色号已忽略）' : ''), unknown ? 'warn' : '');
    } catch (err) {
      toast('读取失败：' + err.message, 'err');
    }
  };
  reader.readAsText(file);
}

function dateStamp() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
}

const FONT_CN = '"PingFang SC","Microsoft YaHei","Helvetica Neue",Arial,sans-serif';

/** 在图案下方绘制「已使用颜色」图例：色块 + 色号 + 数量 */
function drawLegend(ctx, list, stats, o) {
  const { y, w, pad, sw, itemW, itemH, titleH, cols } = o;
  ctx.save();
  ctx.textBaseline = 'middle';

  // 分隔线
  ctx.strokeStyle = 'rgba(27,29,33,.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, y + 0.5);
  ctx.lineTo(w - pad, y + 0.5);
  ctx.stroke();

  // 标题
  ctx.fillStyle = '#1B1D21';
  ctx.font = '700 16px ' + FONT_CN;
  ctx.fillText('已使用颜色  ' + stats.kinds + ' 种 / 共 ' + stats.total + ' 颗', pad, y + pad + titleH / 2);

  list.forEach(([idx, n], i) => {
    const p = PALETTE[idx];
    const c = i % cols, r = (i / cols) | 0;
    const ix = pad + c * itemW;
    const iy = y + pad + titleH + r * itemH;

    // 色块（描边保证浅色豆也看得见边界）
    const sy = iy + (itemH - sw) / 2;
    ctx.fillStyle = p.hex;
    ctx.fillRect(ix, sy, sw, sw);
    ctx.strokeStyle = 'rgba(27,29,33,.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(ix + 0.5, sy + 0.5, sw - 1, sw - 1);

    // 色号
    ctx.fillStyle = '#1B1D21';
    ctx.font = '600 13px ' + FONT_CN;
    ctx.fillText(p.id, ix + sw + 8, iy + itemH / 2);

    // 数量
    ctx.fillStyle = '#6B7280';
    ctx.font = '400 12px ' + FONT_CN;
    ctx.fillText('× ' + n, ix + sw + 50, iy + itemH / 2);
  });

  ctx.restore();
}

/* ---------- 统一下载 ---------- */
// 关键点：在预览面板 / iframe 里运行时，a.click() 触发的下载常被浏览器静默拦截，
// 页面却照样弹「已导出」，用户找不到文件。这里统一检测环境并回显文件名。
function inIframe() {
  try { return window.self !== window.top; } catch (e) { return true; }
}

function downloadBlob(blob, filename, okMsg) {
  const canDownload = 'download' in document.createElement('a');
  if (!canDownload || inIframe()) {
    // iframe 内无法可靠落盘：改为在新标签页打开，用户自行右键「另存为」
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      toast('已在新窗口打开，请右键「另存为」：' + filename, 'warn', 6000);
    } else {
      toast('下载被拦截，请双击本地 HTML 用浏览器打开后再导出', 'warn', 6000);
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(okMsg + ' → ' + filename, '', 4000);
}

function exportJpg() {
  // 导出一张干净的图纸：不画参考图，格子固定放大以便打印
  const stats = computeStats();
  const list = stats.list;
  const cell = clamp(Math.floor(4000 / Math.max(state.W, state.H)), 8, 24);
  const pw = state.W * cell, ph = state.H * cell;

  // ---- 图例排版：图案太窄时把画布加宽，保证图例可读 ----
  const pad = 24, sw = 22, itemW = 118, itemH = 34;
  const titleH = list.length ? 40 : 0;
  const totalW = Math.max(pw, 560);                       // 图例最小宽度
  const cols = Math.max(1, Math.floor((totalW - pad * 2) / itemW));
  const rows = list.length ? Math.ceil(list.length / cols) : 0;
  const legendH = list.length ? pad + titleH + rows * itemH + pad : 0;

  const off = document.createElement('canvas');
  const ctx = prepareCanvas(off, totalW, ph + legendH);
  // JPEG 无透明通道，整张先铺白底（含图例区域），否则未绘制处会变黑
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, totalW, ph + legendH);

  // 图案水平居中绘制（drawBoard 以 0,0 为原点，用 translate 平移）
  ctx.save();
  ctx.translate(Math.round((totalW - pw) / 2), 0);
  drawBoard(ctx, cell, { checker: false, ref: false, grid: true, code: cell >= 13, hover: null });
  ctx.restore();

  if (list.length) {
    drawLegend(ctx, list, stats, {
      y: ph, w: totalW, pad, sw, itemW, itemH, titleH, cols
    });
  }

  // 质量 0.92 兼顾体积与清晰度
  off.toBlob(blob => {
    downloadBlob(blob, 'doudou up_' + state.W + 'x' + state.H + '_' + dateStamp() + '.jpg', 'JPG 已导出（含色号图例）');
  }, 'image/jpeg', 0.92);
}

function exportCsv() {
  const { list, total } = computeStats();
  if (!list.length) { toast('画布还是空的', 'warn'); return; }
  const rows = [['色号', '名称', 'HEX', '数量', '占比']];
  list.forEach(([idx, n]) => {
    const p = PALETTE[idx];
    rows.push([p.id, p.name, p.hex, n, (n / total * 100).toFixed(2) + '%']);
  });
  rows.push(['合计', '', '', total, '100%']);
  const csv = '\ufeff' + rows.map(r => r.join(',')).join('\r\n');
  downloadBlob(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    '豆子用量_' + state.W + 'x' + state.H + '_' + dateStamp() + '.csv',
    'CSV 已导出'
  );
}

$('btnSaveJson').addEventListener('click', saveJson);
$('btnLoadJson').addEventListener('click', () => $('fileJson').click());
$('fileJson').addEventListener('change', e => { if (e.target.files[0]) loadJsonFile(e.target.files[0]); e.target.value = ''; });
$('btnExportJpg').addEventListener('click', exportJpg);
$('btnExportCsv').addEventListener('click', exportCsv);

$('btnClear').addEventListener('click', () => {
  if (!state.pixels.some(v => v >= 0)) { toast('画布已经是空的'); return; }
  pushUndo();                                  // 可撤销，无需再弹确认框（预览内 confirm 可能被浏览器禁用导致清空失效）
  state.pixels.fill(EMPTY);
  removeRef();                                 // 连参考底图一起清除
  afterEdit();
  toast('画布已清空');
});

/** 统一绑定数字输入：限制范围、自动纠正非法值 */
function bindNumber(el, min, max, fallback, onChange) {
  const apply = () => {
    const raw = el.value.trim();
    let n = parseInt(raw, 10);
    if (!Number.isFinite(n)) n = fallback;
    n = clamp(n, min, max);
    if (String(n) !== raw) el.value = n;
    onChange && onChange(n);
    return n;
  };
  el.addEventListener('change', apply);
  el.addEventListener('blur', apply);
  el.addEventListener('keydown', e => { if (e.key === 'Enter') { apply(); el.blur(); } });
  return apply;
}
bindNumber($('inW'), MIN_SIZE, MAX_SIZE, DEFAULT_SIZE);
bindNumber($('inH'), MIN_SIZE, MAX_SIZE, DEFAULT_SIZE);

/** 滑块绑定：写入数值限制并同步显示文本 */
function bindRange(el, min, max, fmt, onInput) {
  el.min = min; el.max = max;
  const apply = () => {
    const n = clampInt(el.value, min, max);
    $('' + fmt.target).textContent = fmt.text(n);
    onInput(n);
  };
  el.addEventListener('input', apply);
  apply();
  return apply;
}
bindRange($('inCutTh'), 200, 255, { target: 'cutThVal', text: n => String(n) }, () => {});
bindRange($('inPenalty'), 10, 40, { target: 'penaltyVal', text: n => (n / 10).toFixed(1) }, () => {});
bindRange($('inWhiteLimit'), 10, 60, { target: 'whiteLimitVal', text: n => n + '%' }, () => {});
// 格子大小滑块 / 自动适应窗口：左侧控件已移除，缩放与适应见画布上方工具条

/* ---------- 10.1 图纸工具条：缩放 / 显示开关 ---------- */

/** 画布中心点，作为按钮缩放的锚点 */
function centerAnchor() {
  const b = boardEl.getBoundingClientRect();
  return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
}

$('btnZoomIn').addEventListener('click', () => zoomBy(1.25, centerAnchor()));
$('btnZoomOut').addEventListener('click', () => zoomBy(1 / 1.25, centerAnchor()));
$('btnZoomReset').addEventListener('click', () => zoomBy(BASE_CELL / state.cell, centerAnchor()));
$('btnFit').addEventListener('click', fitToWindow);

/** 显示开关：工具条按钮 <-> 左栏复选框 双向同步，并与 state 保持一致 */
function syncToggles() {
  const map = [
    ['tglCode', 'optCode', 'showCode'],
    ['tglGrid', 'optGrid', 'showGrid'],
    ['tglRuler', 'optRuler', 'showRuler'],
    ['tglChecker', 'optChecker', 'showChecker']
  ];
  map.forEach(([btnId, boxId, key]) => {
    const btn = $(btnId), box = $(boxId);
    if (btn) btn.classList.toggle('is-on', !!state[key]);
    if (box) box.checked = !!state[key];
  });
}

// 工具条按钮：点击即切换
[['tglCode', 'showCode'], ['tglGrid', 'showGrid'], ['tglRuler', 'showRuler'], ['tglChecker', 'showChecker']]
  .forEach(([btnId, key]) => {
    $(btnId).addEventListener('click', () => {
      state[key] = !state[key];
      syncToggles();
      // 标尺开关会改变布局网格，需要整屏重排；其余只需重绘画布
      key === 'showRuler' ? layout() : renderBoard();
      syncCellUI();
    });
  });

/* ---------- 11) 初始化 ---------- */
/* ---------- 11) 点赞功能（真实全局计数需后端；未配置则降级本地种子） ---------- */
let likePoller = null;

function likeApiUrl() { return (LIKE_API_BASE || '').replace(/\/+$/, '') + '/api/like'; }

async function likeGet() {
  const r = await fetch(likeApiUrl(), { cache: 'no-store' });
  if (!r.ok) throw new Error('get fail');
  const d = await r.json();
  return typeof d.count === 'number' ? d.count : 0;
}
async function likePost() {
  const r = await fetch(likeApiUrl(), { method: 'POST', cache: 'no-store' });
  if (!r.ok) throw new Error('post fail');
  const d = await r.json();
  return typeof d.count === 'number' ? d.count : 0;
}
function likeRender(count, liked) {
  const c = $('likeCount'); if (c) c.textContent = (count == null) ? '—' : String(count);
  const b = $('btnLike');
  if (b) {
    b.classList.toggle('is-liked', !!liked);
    b.title = '给作者点赞';                       // hover 提示固定为「给作者点赞」
    b.setAttribute('aria-label', liked ? '已给作者点赞' : '给作者点赞');
  }
}
function showLikeCelebration() {
  const pop = $('likePop');
  if (!pop) { toast('感谢点赞'); return; }
  pop.hidden = false;
  const rocket = pop.querySelector('.rocket');
  const finish = () => {
    if (pop.hidden) return;
    pop.hidden = true;
    if (rocket) rocket.removeEventListener('animationend', onRocket);
  };
  const onRocket = (e) => { if (e.animationName === 'rocket-fly') finish(); };
  // 兜底：动画异常时 2.2s 后强制关闭（火箭起飞约 1.75s）
  setTimeout(finish, 2200);
  if (rocket) rocket.addEventListener('animationend', onRocket);
}
function initLike() {
  const btn = $('btnLike');
  let everLiked = false;
  try { everLiked = localStorage.getItem('doudou_like_liked') === '1'; } catch (e) {}

  if (!LIKE_API_BASE) {                          // 离线降级：本地累加 + 持久化（可重复点赞）
    let n = LIKE_SEED;
    try { const s = localStorage.getItem('doudou_like_count'); if (s != null) n = parseInt(s, 10) || LIKE_SEED; } catch (e) {}
    likeRender(n, everLiked);
    if (btn) btn.addEventListener('click', () => {
      n += 1;
      likeRender(n, true);
      everLiked = true;
      try { localStorage.setItem('doudou_like_liked', '1'); localStorage.setItem('doudou_like_count', String(n)); } catch (e) {}
      showLikeCelebration();
    });
    return;
  }

  // 真实模式：拉取全局计数 + 轮询实现近实时更新；可重复点赞，每次都放特效
  likeGet().then(c => likeRender(c, everLiked)).catch(() => likeRender(null, everLiked));
  likePoller = setInterval(() => {
    likeGet().then(c => likeRender(c, everLiked)).catch(() => {});
  }, 8000);
  if (btn) btn.addEventListener('click', () => {
    showLikeCelebration();                        // 每次点击都放特效
    everLiked = true;
    try { localStorage.setItem('doudou_like_liked', '1'); } catch (e) {}
    likePost()
      .then(c => likeRender(c, true))
      .catch(() => { toast('点赞失败，稍后再试', 'err'); });
  });
}

function init() {
  buildPalette();
  selectColor(0);
  const oc0 = $('optCell'); if (oc0) oc0.disabled = true;
  $('sizeBadge').textContent = state.W + ' × ' + state.H;
  syncToggles();
  layout();
  updateStats();
  updateHistoryButtons();
  initLike();

  // 视口变化时重新适配格子大小（带节流与短路，避免抖动）
  let raf = 0;
  new ResizeObserver(() => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!state.autoCell) return;
      const next = computeCellSize();
      if (next !== state.cell) layout();
    });
  }).observe(stageScroll);

  // 键盘快捷键
  window.addEventListener('keydown', e => {
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;

    // 空格：按住时切换成抓手（配合左键拖动平移）
    if (e.code === 'Space') {
      if (!spaceDown) { spaceDown = true; if (!panning) boardEl.classList.add('is-grab'); }
      e.preventDefault();
      return;
    }

    // Esc：有选区则取消选区
    if (e.key === 'Escape') { if (state.select) { clearSelect(); toast('已取消选区'); } return; }

    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (k === 'b') setTool('brush');
    else if (k === 'e') setTool('eraser');
    else if (k === 'i') setTool('picker');
    else if (k === 'g') setTool('fill');
    else if (k === 'm') setTool('select');      // M = 框选
    else if (k === '0') fitToWindow();          // 0 = 适应窗口
  });

  // 松开空格恢复十字光标
  window.addEventListener('keyup', e => {
    if (e.code !== 'Space') return;
    spaceDown = false;
    boardEl.classList.remove('is-grab');
  });
  // 窗口失焦时复位，避免空格状态"卡住"
  window.addEventListener('blur', () => { spaceDown = false; boardEl.classList.remove('is-grab'); });

  window.addEventListener('beforeunload', e => {
    if (state.pixels.some(v => v >= 0)) { e.preventDefault(); e.returnValue = ''; }
  });
}

init();
