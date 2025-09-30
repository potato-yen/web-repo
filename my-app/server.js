// server.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ---- helpers ----
function sanitizeHeaders(incoming = {}) {
  // 只保留必要的安全標頭，避免把 host/origin/accept-encoding 等轉給上游
  const out = {};
  if (incoming['accept']) out['accept'] = incoming['accept'];
  else out['accept'] = 'application/json';
  if (incoming['content-type']) out['content-type'] = incoming['content-type'];
  // 若你之後需要帶 token，可手動允許 authorization
  if (incoming['authorization']) out['authorization'] = incoming['authorization'];
  return out;
}

function ensureTrailingSlashForKnownV1(targetUrl) {
  // 對兩個常用 v1 路徑自動補 '/'
  const [path, qs] = targetUrl.split('?');
  if (/\/api\/v1\/dashboard$/.test(path) || /\/api\/v1\/component\/\d+\/chart$/.test(path)) {
    const fixed = path.endsWith('/') ? path : path + '/';
    return qs ? `${fixed}?${qs}` : fixed;
  }
  return targetUrl;
}

// ---- 顯式教學路由（方便除錯，不依賴萬用轉發） ----

// 1) /api/v1/dashboard?city=taipei
app.get('/api/v1/dashboard', async (req, res) => {
  try {
    const qs = new URLSearchParams(req.query).toString();
    let target = `https://citydashboard.taipei/api/v1/dashboard${qs ? `?${qs}` : ''}`;
    target = ensureTrailingSlashForKnownV1(target);
    console.log('[PROXY] ->', 'GET', target);

    const r = await fetch(target, { headers: sanitizeHeaders(req.headers) });
    const text = await r.text();
    res.status(r.status).set('Content-Type', r.headers.get('content-type') || 'application/json');
    try { res.send(JSON.parse(text)); } catch { res.send(text); }
  } catch (e) {
    console.error('[ERROR]', e);
    res.status(500).json({ error: String(e) });
  }
});

// 2) /api/v1/component/:id/chart?city=taipei
app.get('/api/v1/component/:id/chart', async (req, res) => {
  try {
    const { id } = req.params;
    const qs = new URLSearchParams(req.query).toString();
    let target = `https://citydashboard.taipei/api/v1/component/${id}/chart${qs ? `?${qs}` : ''}`;
    target = ensureTrailingSlashForKnownV1(target);
    console.log('[PROXY] ->', 'GET', target);

    const r = await fetch(target, { headers: sanitizeHeaders(req.headers) });
    const text = await r.text();
    res.status(r.status).set('Content-Type', r.headers.get('content-type') || 'application/json');
    try { res.send(JSON.parse(text)); } catch { res.send(text); }
  } catch (e) {
    console.error('[ERROR]', e);
    res.status(500).json({ error: String(e) });
  }
});

// ---- 萬用轉發：/api/v1/** -> 官方 /api/v1/** ----
app.use('/api/v1', async (req, res) => {
  try {
    let suffix = req.originalUrl.replace(/^\/api\/v1/, ''); // e.g. /dashboard?city=taipei
    let target = `https://citydashboard.taipei/api/v1${suffix}`;
    target = ensureTrailingSlashForKnownV1(target);
    const headers = sanitizeHeaders(req.headers);

    const init = { method: req.method, headers };
    if (req.method !== 'GET' && req.body && Object.keys(req.body).length) {
      init.headers['content-type'] = init.headers['content-type'] || 'application/json';
      init.body = init.headers['content-type'].includes('application/json')
        ? JSON.stringify(req.body)
        : req.body;
    }

    console.log('[PROXY] ->', req.method, target);
    const r = await fetch(target, init);
    const text = await r.text();
    res.status(r.status).set('Content-Type', r.headers.get('content-type') || 'application/json');
    try { res.send(JSON.parse(text)); } catch { res.send(text); }
  } catch (e) {
    console.error('[ERROR]', e);
    res.status(500).json({ error: String(e) });
  }
});

// ---- 超彈性代理：POST /proxy { url, method, headers, body } ----
app.post('/proxy', async (req, res) => {
  try {
    const { url, method = 'GET', headers = {}, body } = req.body || {};
    if (!url) return res.status(400).json({ error: 'Missing url in body' });

    const init = { method, headers: sanitizeHeaders(headers) };
    if (method !== 'GET' && body !== undefined) {
      if (typeof body === 'object' && !Buffer.isBuffer(body)) {
        init.headers['content-type'] = init.headers['content-type'] || 'application/json';
        init.body = JSON.stringify(body);
      } else {
        init.body = body;
      }
    }

    console.log('[PROXY:RAW] ->', method, url);
    const r = await fetch(url, init);
    const text = await r.text();
    res.status(r.status).set('Content-Type', r.headers.get('content-type') || 'text/plain');
    res.send(text);
  } catch (e) {
    console.error('[ERROR]', e);
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => console.log(`Proxy on http://localhost:${PORT}`));