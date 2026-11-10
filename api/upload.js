/**
 * POST /api/upload
 * Body JSON: { filename, mime, data }  (data = base64 tanpa prefix data:...)
 * Upload ke uguu.se → return { status: true, url }
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, msg: 'Gunakan POST' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const filename = body.filename || 'image.jpg';
    const mime = body.mime || 'image/jpeg';
    const data = body.data;

    if (!data || typeof data !== 'string') {
      return res.status(400).json({ status: false, msg: 'Field data (base64) wajib diisi' });
    }

    // strip data-url prefix if present
    const b64 = data.replace(/^data:[^;]+;base64,/, '');
    const buf = Buffer.from(b64, 'base64');

    if (buf.length < 100) {
      return res.status(400).json({ status: false, msg: 'File terlalu kecil / base64 invalid' });
    }
    if (buf.length > 8 * 1024 * 1024) {
      return res.status(400).json({ status: false, msg: 'Max 8 MB' });
    }

    const url = await uploadToUguu(buf, filename, mime);
    return res.status(200).json({ status: true, url });
  } catch (err) {
    console.error('upload error:', err);
    return res.status(502).json({
      status: false,
      msg: err.message || 'Gagal upload sementara',
    });
  }
};

async function uploadToUguu(buf, filename, mime) {
  const fd = new FormData();
  const blob = new Blob([buf], { type: mime || 'image/jpeg' });
  fd.append('files[]', blob, filename || 'image.jpg');

  const r = await fetch('https://uguu.se/upload.php', {
    method: 'POST',
    body: fd,
  });

  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Upload host response invalid: ' + text.slice(0, 150));
  }

  if (!r.ok || !json.success || !json.files?.[0]?.url) {
    throw new Error(
      'Upload gagal: ' + (json?.description || json?.message || JSON.stringify(json).slice(0, 180))
    );
  }

  return json.files[0].url;
}
