const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TABELA_ACESSOS = 'acessos_es';
const HOTMART_TOKEN = process.env.HOTMART_WEBHOOK_TOKEN;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // Validar token enviado pela Hotmart no header hottok.
  const token = req.headers['hottok'] || req.headers['x-hotmart-hottok'];

  if (HOTMART_TOKEN && token !== HOTMART_TOKEN) {
    console.error('Tentativa de webhook com token inválido.');
    return res.status(401).send('Unauthorized');
  }

  let body;

  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  const evento = body.event || body.data?.event;
  const comprador = body.data?.buyer || body.buyer || {};
  const compra = body.data?.purchase || body.purchase || {};

  const email = String(comprador.email || '').toLowerCase().trim();
  const nome = String(comprador.name || '').trim();
  const hotmartId = String(compra.transaction || compra.order_date || '').trim();

  let dataCompra = new Date().toISOString();

  if (compra.approved_date) {
    const dataAprovacao = new Date(compra.approved_date);

    if (!Number.isNaN(dataAprovacao.getTime())) {
      dataCompra = dataAprovacao.toISOString();
    }
  }

  if (!email) {
    return res.status(400).send('Email não encontrado no payload');
  }

  console.log(`Evento: ${evento || 'NÃO_INFORMADO'} | Email: ${email}`);

  const EVENTOS_ATIVAR = [
    'PURCHASE_APPROVED',
    'PURCHASE_COMPLETE',
    'SUBSCRIPTION_ACTIVATION',
  ];

  const EVENTOS_PROCESSAR = [
    'PURCHASE_WAITING_PAYMENT',
    'PURCHASE_BILLET_PRINTED',
  ];

  const EVENTOS_BLOQUEAR = [
    'PURCHASE_REFUNDED',
    'PURCHASE_CHARGEBACK',
    'PURCHASE_CANCELLED',
    'PURCHASE_EXPIRED',
    'SUBSCRIPTION_CANCELLATION',
    'SUBSCRIPTION_INACTIVATED',
  ];

  if (EVENTOS_PROCESSAR.includes(evento)) {
    const { error } = await supabase
      .from(TABELA_ACESSOS)
      .upsert(
        {
          email,
          nome,
          hotmart_id: hotmartId,
          data_compra: dataCompra,
          status: 'PROCESSANDO',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (error) {
      console.error('Erro ao gravar acesso como PROCESSANDO:', error);
      return res.status(500).send('Erro interno');
    }

    console.log(`Acesso PROCESSANDO para: ${email}`);
    return res.status(200).send('OK');
  }

  if (EVENTOS_ATIVAR.includes(evento)) {
    const { error } = await supabase
      .from(TABELA_ACESSOS)
      .upsert(
        {
          email,
          nome,
          hotmart_id: hotmartId,
          data_compra: dataCompra,
          status: 'ATIVO',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (error) {
      console.error('Erro ao ativar acesso:', error);
      return res.status(500).send('Erro interno');
    }

    console.log(`Acesso ATIVADO para: ${email}`);
    return res.status(200).send('OK');
  }

  if (EVENTOS_BLOQUEAR.includes(evento)) {
    const { error } = await supabase
      .from(TABELA_ACESSOS)
      .update({
        status: 'BLOQUEADO',
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (error) {
      console.error('Erro ao bloquear acesso:', error);
      return res.status(500).send('Erro interno');
    }

    console.log(`Acesso BLOQUEADO para: ${email}`);
    return res.status(200).send('OK');
  }

  // Responde 200 para evitar novas tentativas da Hotmart em eventos irrelevantes.
  return res.status(200).send('Evento ignorado');
};
