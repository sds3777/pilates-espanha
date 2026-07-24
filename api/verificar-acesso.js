const { createClient } = require('@supabase/supabase-js');

const TABELA_ACESSOS = 'acessos_es';
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 30;
const rateBuckets = new Map();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Configuração do Supabase ausente.');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getRequestOrigin(req) {
  return String(req.headers.origin || '').trim();
}

function getSameOrigin(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').trim();
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  return host ? `${proto}://${host}` : '';
}

function isAllowedOrigin(req, origin) {
  if (!origin) return true;

  const configured = String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const sameOrigin = getSameOrigin(req);
  return origin === sameOrigin || configured.includes(origin);
}

function applySecurityHeaders(req, res) {
  const origin = getRequestOrigin(req);
  if (isAllowedOrigin(req, origin) && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(req) {
  const now = Date.now();
  const ip = getClientIp(req);
  const current = rateBuckets.get(ip);

  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    rateBuckets.set(ip, { startedAt: now, count: 1 });
    return false;
  }

  current.count += 1;
  return current.count > RATE_MAX_REQUESTS;
}

function normalizeName(value) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 100);
}

function isValidEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidName(name) {
  return name.length >= 2 && name.length <= 100 && !/[%_\\]/.test(name);
}

function isValidDeviceId(deviceId) {
  return /^dev_[a-zA-Z0-9-]{8,100}$/.test(deviceId);
}

function escapeLikePattern(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

module.exports = async (req, res) => {
  applySecurityHeaders(req, res);

  const origin = getRequestOrigin(req);
  if (!isAllowedOrigin(req, origin)) {
    return res.status(403).json({ acesso: false, motivo: 'ORIGEM_NAO_PERMITIDA' });
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ acesso: false, motivo: 'METODO_NAO_PERMITIDO' });
  }

  if (isRateLimited(req)) {
    return res.status(429).json({
      acesso: false,
      motivo: 'MUITAS_TENTATIVAS',
      mensagem: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ acesso: false, motivo: 'JSON_INVALIDO' });
  }

  const email = String(body.email || '').toLowerCase().trim().slice(0, 254);
  const nome = normalizeName(body.nome);
  const deviceId = String(body.deviceId || '').trim().slice(0, 110);
  const transferirDispositivo = body.transferirDispositivo === true;

  if ((!email && !nome) || (email && nome) || !isValidDeviceId(deviceId)) {
    return res.status(400).json({
      acesso: false,
      motivo: 'DADOS_INVALIDOS',
      mensagem: 'Los datos informados no son válidos.',
    });
  }

  if ((email && !isValidEmail(email)) || (nome && !isValidName(nome))) {
    return res.status(400).json({
      acesso: false,
      motivo: 'DADOS_INVALIDOS',
      mensagem: 'Los datos informados no son válidos.',
    });
  }

  let supabase;
  try {
    supabase = getSupabase();
  } catch (error) {
    console.error('Falha de configuração no serviço de acesso.');
    return res.status(500).json({ acesso: false, motivo: 'ERRO_INTERNO' });
  }

  let consulta;
  if (email) {
    consulta = supabase
      .from(TABELA_ACESSOS)
      .select('id,email,nome,status,device_id')
      .eq('email', email)
      .maybeSingle();
  } else {
    // Escapa curingas de LIKE para impedir que %, _ ou \\ alterem a consulta.
    consulta = supabase
      .from(TABELA_ACESSOS)
      .select('id,email,nome,status,device_id')
      .ilike('nome', escapeLikePattern(nome))
      .maybeSingle();
  }

  const { data, error } = await consulta;

  if (error) {
    console.error('Falha ao consultar acesso.', { code: error.code });
    return res.status(500).json({ acesso: false, motivo: 'ERRO_INTERNO' });
  }

  if (!data) {
    return res.status(200).json({ acesso: false, motivo: 'NAO_ENCONTRADO' });
  }

  if (data.status === 'PROCESSANDO') {
    return res.status(200).json({ acesso: false, motivo: 'PROCESSANDO' });
  }

  if (data.status !== 'ATIVO') {
    return res.status(200).json({ acesso: false, motivo: 'BLOQUEADO' });
  }

  const deviceAtual = String(data.device_id || '');

  if (!deviceAtual) {
    const { error: updateError } = await supabase
      .from(TABELA_ACESSOS)
      .update({ device_id: deviceId, updated_at: new Date().toISOString() })
      .eq('id', data.id);

    if (updateError) {
      console.error('Falha ao registrar dispositivo.', { code: updateError.code });
      return res.status(500).json({ acesso: false, motivo: 'ERRO_INTERNO' });
    }

    return res.status(200).json({ acesso: true, nome: data.nome, email: data.email, primeiroAcesso: true });
  }

  if (deviceAtual === deviceId) {
    return res.status(200).json({ acesso: true, nome: data.nome, email: data.email });
  }

  if (transferirDispositivo) {
    const { error: transferError } = await supabase
      .from(TABELA_ACESSOS)
      .update({ device_id: deviceId, updated_at: new Date().toISOString() })
      .eq('id', data.id);

    if (transferError) {
      console.error('Falha ao transferir dispositivo.', { code: transferError.code });
      return res.status(500).json({ acesso: false, motivo: 'ERRO_INTERNO' });
    }

    return res.status(200).json({
      acesso: true,
      nome: data.nome,
      email: data.email,
      dispositivo_transferido: true,
    });
  }

  return res.status(200).json({ acesso: false, motivo: 'OUTRO_DISPOSITIVO' });
};
