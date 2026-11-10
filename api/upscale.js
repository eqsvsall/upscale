/**
 * Vercel Serverless Function
 * Proxy ke https://api.jaky.dev/v1/wink/upscale-1080p
 *
 * Env: JAKY_API_KEY
 */

function findUrl(data, depth = 0) {
  if (depth > 8 || data == null) return null;
  if (typeof data === 'string') {
    if (/^https?:\/\//i.test(data)) return data;
    return null;
  }
  if (Array.isArray(data)) {
    for (const v of data) {
      const u = findUrl(v, depth + 1);
      if (u) return u;
    }
    return null;
  }
  if (typeof data === 'object') {
    const prefer = ['url', 'result', 'image', 'output', 'media', 'link', 'file', 'src', 'download'];
    for (const k of prefer) {
      if (typeof data[k] === 'string' && /^https?:\/\//i.test(data[k])) return data[k];
      if (data[k] && typeof data[k] === 'object') {
        const u = findUrl(data[k], depth + 1);
        if (u) return u;
      }
    }
    for (const k of Object.keys(data)) {
      if (prefer.includes(k)) continue;
      const u = findUrl(data[k], depth + 1);
      if (u) return u;
    }
  }
  return null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const key = process.env.JAKY_API_KEY;
  if (!key) {
    return res.status(500).json({
      status: false,
      msg: 'JAKY_API_KEY belum di-set di Vercel Environment Variables.',
    });
  }

  let imageUrl = '';
  if (req.method === 'GET') {
    imageUrl = String(req.query?.url || '').trim();
  } else if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    imageUrl = String(body.url || req.query?.url || '').trim();
  }

  if (!imageUrl) {
    return res.status(400).json({
      status: false,
      msg: 'Parameter url wajib diisi (URL gambar/video publik).',
    });
  }

  try {
    const qs = new URLSearchParams({
      url: imageUrl,
      wait: 'true',
      apikey: key,
    });

    const upstream = await fetch(
      `https://api.jaky.dev/v1/wink/upscale-1080p?${qs.toString()}`,
      {
        method: 'GET',
        headers: {
          'x-jaky-key': key,
          Accept: 'application/json',
        },
      }
    );

    const data = await upstream.json().catch(() => ({}));
    const code = upstream.ok ? 200 : upstream.status || 502;

    // Normalize: always expose top-level url if we can find one
    const found = findUrl(data);
    const payload =
      found && typeof data === 'object' && data !== null
        ? { ...data, url: data.url || found, status: data.status !== false }
        : data;

    return res.status(code).json(payload);
  } catch (err) {
    console.error('upscale proxy error:', err);
    return res.status(502).json({
      status: false,
      msg: err.message || 'Gagal menghubungi API upscale.',
    });
  }
};
