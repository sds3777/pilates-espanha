const DRIVE_ID_RE = /^[A-Za-z0-9_-]{10,100}$/;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

async function fetchWithTimeout(url, timeoutMs = 9000, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PilatesEnCasa/1.0)',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,pt-BR;q=0.7,en;q=0.5',
        ...headers,
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function isAllowedGoogleImageUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    return url.hostname === 'drive.google.com'
      || url.hostname === 'lh3.googleusercontent.com'
      || url.hostname.endsWith('.googleusercontent.com');
  } catch {
    return false;
  }
}

async function readImage(url) {
  const upstream = await fetchWithTimeout(url, 9000, {
    Referer: 'https://drive.google.com/',
  });
  const contentType = String(upstream.headers.get('content-type') || '').toLowerCase();
  if (!upstream.ok || !contentType.startsWith('image/')) return null;

  const arrayBuffer = await upstream.arrayBuffer();
  if (arrayBuffer.byteLength < 1000 || arrayBuffer.byteLength > MAX_IMAGE_BYTES) return null;
  return { body: Buffer.from(arrayBuffer), contentType };
}

async function discoverThumbnailFromViewer(id) {
  try {
    const page = await fetchWithTimeout(
      `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`,
      9000,
      { Accept: 'text/html,application/xhtml+xml' },
    );
    if (!page.ok) return null;

    const html = await page.text();
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+itemprop=["']thumbnailUrl["'][^>]+content=["']([^"']+)["']/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      const candidate = decodeHtml(match && match[1]);
      if (candidate && isAllowedGoogleImageUrl(candidate)) return candidate;
    }
  } catch {
    // A descoberta é apenas uma fonte adicional; as demais continuam abaixo.
  }
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const id = String(req.query?.id || '').trim();
  if (!DRIVE_ID_RE.test(id)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'Arquivo inválido.' });
  }

  const candidates = [
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200`,
    `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w1200`,
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w800`,
  ];

  const discovered = await discoverThumbnailFromViewer(id);
  if (discovered) candidates.unshift(discovered);

  for (const url of [...new Set(candidates)]) {
    try {
      const image = await readImage(url);
      if (!image) continue;

      res.setHeader('Content-Type', image.contentType);
      res.setHeader('Content-Length', String(image.body.length));
      res.setHeader(
        'Cache-Control',
        'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800',
      );
      res.setHeader(
        'CDN-Cache-Control',
        'public, s-maxage=2592000, stale-while-revalidate=604800',
      );

      if (req.method === 'HEAD') return res.status(200).end();
      return res.status(200).send(image.body);
    } catch {
      // Tenta a próxima fonte sem expor detalhes internos ao cliente.
    }
  }

  // O front-end troca automaticamente por uma capa local identificada.
  res.setHeader('Cache-Control', 'no-store');
  return res.status(404).json({ error: 'Miniatura indisponível.' });
};
