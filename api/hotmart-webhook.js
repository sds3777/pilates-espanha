const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const TABELA_ACESSOS = 'acessos_es';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) throw new Error('Configuração do Supabase ausente.');
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function safeEqual(received, expected) {
  const a = Buffer.from(String(received || ''), 'utf8');
  const b = Buffer.from(String(expected || ''), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function maskEmail(email) {
  const [user, domain] = String(email).split('@');
  if (!domain) return 'invalid';
  return `${user.slice(0, 2)}***@${domain}`;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const expectedToken = process.env.HOTMART_WEBHOOK_TOKEN;
  if (!expectedToken) {
    console.error('HOTMART_WEBHOOK_TOKEN não configurado; webhook bloqueado por segurança.');
    return res.status(503).send('Service Unavailable');
  }

  const receivedToken = req.headers.hottok || req.headers['x-hotmart-hottok'];
  if (!safeEqual(receivedToken, expectedToken)) {
    console.warn('Webhook rejeitado por autenticação inválida.');
    return res.status(401).send('Unauthorized');
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  const evento = String(body.event || body.data?.event || '').trim();
  const comprador = body.data?.buyer || body.buyer || {};
  const compra = body.data?.purchase || body.purchase || {};

  const email = String(comprador.email || '').toLowerCase().trim().slice(0, 254);
  const nome = String(comprador.name || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 100);
  const hotmartId = String(compra.transaction || '').trim().slice(0, 150);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).send('Invalid buyer');
  }

  const EVENTOS_ATIVAR = new Set([
    'PURCHASE_APPROVED',
    'PURCHASE_COMPLETE',
    'SUBSCRIPTION_ACTIVATION',
  ]);
  const EVENTOS_PROCESSAR = new Set([
    'PURCHASE_WAITING_PAYMENT',
    'PURCHASE_BILLET_PRINTED',
  ]);
  const EVENTOS_BLOQUEAR = new Set([
    'PURCHASE_REFUNDED',
    'PURCHASE_CHARGEBACK',
    'PURCHASE_CANCELLED',
    'PURCHASE_EXPIRED',
    'SUBSCRIPTION_CANCELLATION',
    'SUBSCRIPTION_INACTIVATED',
  ]);

  if (!EVENTOS_ATIVAR.has(evento) && !EVENTOS_PROCESSAR.has(evento) && !EVENTOS_BLOQUEAR.has(evento)) {
    return res.status(200).send('Evento ignorado');
  }

  let dataCompra = new Date().toISOString();
  if (compra.approved_date) {
    const parsed = new Date(compra.approved_date);
    if (!Number.isNaN(parsed.getTime())) dataCompra = parsed.toISOString();
  }

  let supabase;
  try {
    supabase = getSupabase();
  } catch {
    console.error('Falha de configuração no webhook.');
    return res.status(503).send('Service Unavailable');
  }

  let error;
  if (EVENTOS_PROCESSAR.has(evento)) {
    ({ error } = await supabase.from(TABELA_ACESSOS).upsert({
      email,
      nome,
      hotmart_id: hotmartId,
      data_compra: dataCompra,
      status: 'PROCESSANDO',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' }));
  } else if (EVENTOS_ATIVAR.has(evento)) {
    ({ error } = await supabase.from(TABELA_ACESSOS).upsert({
      email,
      nome,
      hotmart_id: hotmartId,
      data_compra: dataCompra,
      status: 'ATIVO',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' }));
  } else {
    ({ error } = await supabase.from(TABELA_ACESSOS).update({
      status: 'BLOQUEADO',
      updated_at: new Date().toISOString(),
    }).eq('email', email));
  }

  if (error) {
    console.error('Falha ao processar webhook.', { event: evento, code: error.code });
    return res.status(500).send('Internal Error');
  }

  console.log('Webhook processado.', { event: evento, buyer: maskEmail(email) });
  return res.status(200).send('OK');
};
