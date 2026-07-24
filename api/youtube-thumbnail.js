const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PilatesEnCasa/1.0)',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const id = String(req.query?.id || '').trim();
  if (!VIDEO_ID_RE.test(id)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'Vídeo inválido.' });
  }

  const candidates = [
    `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
  ];

  for (const url of candidates) {
    try {
      const upstream = await fetchWithTimeout(url);
      const contentType = String(upstream.headers.get('content-type') || '');
      if (!upstream.ok || !contentType.startsWith('image/')) continue;

      const body = Buffer.from(await upstream.arrayBuffer());
      if (body.length < 1000) continue;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', String(body.length));
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800');
      res.setHeader('CDN-Cache-Control', 'public, s-maxage=2592000, stale-while-revalidate=604800');

      if (req.method === 'HEAD') return res.status(200).end();
      return res.status(200).send(body);
    } catch (error) {
      // Tenta a próxima fonte sem expor detalhes internos ao cliente.
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.redirect(302, `/logo-pilates-en-casa.png?thumb=${encodeURIComponent(id)}`);
};
