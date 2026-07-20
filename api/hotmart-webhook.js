const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Hotmart envia este header para autenticar o webhook
const HOTMART_TOKEN = process.env.HOTMART_WEBHOOK_TOKEN;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // Validar token da Hotmart (header hottok)
  const token = req.headers['hottok'] || req.headers['x-hotmart-hottok'];
  if (HOTMART_TOKEN && token !== HOTMART_TOKEN) {
    console.error('Token inválido:', token);
    return res.status(401).send('Unauthorized');
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  const evento = body.event || body.data?.event;
  const comprador = body.data?.buyer || body.buyer || {};
  const compra = body.data?.purchase || body.purchase || {};

  const email = (comprador.email || '').toLowerCase().trim();
  const nome = comprador.name || '';
  const hotmartId = compra.transaction || compra.order_date || '';
  const dataCompra = compra.approved_date
    ? new Date(compra.approved_date).toISOString()
    : new Date().toISOString();

  if (!email) {
    return res.status(400).send('Email não encontrado no payload');
  }

  console.log(`Evento: ${evento} | Email: ${email}`);

  // Eventos que ATIVAM o acesso
  const EVENTOS_ATIVAR = [
    'PURCHASE_APPROVED',
    'PURCHASE_COMPLETE',
    'SUBSCRIPTION_ACTIVATION',
  ];

  // Eventos que colocam acesso em PROCESSANDO (boleto/Multibanco gerado)
  const EVENTOS_PROCESSAR = [
    'PURCHASE_WAITING_PAYMENT',
    'PURCHASE_BILLET_PRINTED',
  ];

  // Eventos que BLOQUEIAM o acesso
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
      .from('acessos')
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
      console.error('Erro ao gravar PROCESSANDO:', error);
      return res.status(500).send('Erro interno');
    }

    console.log(`Acesso PROCESSANDO para: ${email}`);
    return res.status(200).send('OK');
  }

  if (EVENTOS_ATIVAR.includes(evento)) {
    const { error } = await supabase
      .from('acessos')
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
      .from('acessos')
      .update({ status: 'BLOQUEADO', updated_at: new Date().toISOString() })
      .eq('email', email);

    if (error) {
      console.error('Erro ao bloquear acesso:', error);
      return res.status(500).send('Erro interno');
    }

    console.log(`Acesso BLOQUEADO para: ${email}`);
    return res.status(200).send('OK');
  }

  // Evento não relevante — responde 200 pra Hotmart não retentar
  return res.status(200).send('Evento ignorado');
};
