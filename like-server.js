/**
 * doudou UP - 点赞计数后端（零依赖 Node 服务）
 * 提供全局点赞计数：GET 读取、POST 自增，持久化到 like-count.json。
 * 前端把 LIKE_API_BASE 指向本服务的公网地址即可获得真实全局 N。
 *
 * 启动： node like-server.js   （可用 PORT=3000 指定端口）
 * 接口： GET  /api/like  -> { count }
 *        POST /api/like  -> { count }   （自增 1 后返回）
 * 已开启 CORS(*)，允许 file:// 或任意前端跨域调用。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const FILE = path.join(__dirname, 'like-count.json');

function readCount() {
  try {
    const j = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return typeof j.count === 'number' ? j.count : 0;
  } catch (e) { return 0; }
}
function writeCount(n) {
  fs.writeFileSync(FILE, JSON.stringify({ count: n, updatedAt: Date.now() }), 'utf8');
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = (req.url || '').split('?')[0];
  if (url === '/api/like') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ count: readCount() }));
      return;
    }
    if (req.method === 'POST') {
      const c = readCount() + 1;
      writeCount(c);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ count: c }));
      return;
    }
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => {
  console.log('doudou UP 点赞计数服务已启动: http://localhost:' + PORT + '/api/like');
});
