const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TABELA_ACESSOS = 'acessos_es';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  let body;

  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ erro: 'JSON inválido' });
  }

  const email = String(body.email || '').toLowerCase().trim();
  const nome = String(body.nome || '').trim();
  const deviceId = String(body.deviceId || '').trim();
  const transferirDispositivo = body.transferirDispositivo === true;

  if ((!email && !nome) || !deviceId) {
    return res.status(400).json({
      erro: 'El correo o el nombre y el dispositivo son obligatorios',
    });
  }

  let consulta;

  if (email) {
    consulta = supabase
      .from(TABELA_ACESSOS)
      .select('*')
      .eq('email', email)
      .maybeSingle();
  } else {
    consulta = supabase
      .from(TABELA_ACESSOS)
      .select('*')
      .ilike('nome', nome)
      .maybeSingle();
  }

  const { data, error } = await consulta;

  if (error) {
    console.error('Erro ao consultar acesso:', error);

    return res.status(500).json({
      acesso: false,
      motivo: 'ERRO_INTERNO',
      mensagem: 'No fue posible verificar el acceso. Inténtalo de nuevo.',
    });
  }

  if (!data) {
    return res.status(200).json({
      acesso: false,
      motivo: 'NAO_ENCONTRADO',
      mensagem: email
        ? 'Nenhuma compra ativa encontrada para este e-mail.'
        : 'Nenhuma compra ativa encontrada para este nome.',
    });
  }

  if (data.status === 'PROCESSANDO') {
    return res.status(200).json({
      acesso: false,
      motivo: 'PROCESSANDO',
      mensagem:
        'Seu pagamento ainda não foi compensado. Se você pagou por Multibanco, a confirmação pode levar de 1 a 2 dias úteis. Tente novamente mais tarde.',
    });
  }

  if (data.status !== 'ATIVO') {
    return res.status(200).json({
      acesso: false,
      motivo: 'BLOQUEADO',
      mensagem:
        'Tu acceso fue cancelado o reembolsado. Comunícate con soporte.',
    });
  }

  const deviceAtual = data.device_id;

  if (!deviceAtual) {
    const { error: updateError } = await supabase
      .from(TABELA_ACESSOS)
      .update({
        device_id: deviceId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id);

    if (updateError) {
      console.error('Erro ao registrar o primeiro dispositivo:', updateError);

      return res.status(500).json({
        acesso: false,
        motivo: 'ERRO_INTERNO',
        mensagem: 'Não foi possível registrar este dispositivo. Tente novamente.',
      });
    }

    return res.status(200).json({
      acesso: true,
      nome: data.nome,
      primeiroAcesso: true,
    });
  }

  if (deviceAtual === deviceId) {
    return res.status(200).json({
      acesso: true,
      nome: data.nome,
    });
  }

  if (transferirDispositivo) {
    const { error: transferError } = await supabase
      .from(TABELA_ACESSOS)
      .update({
        device_id: deviceId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id);

    if (transferError) {
      console.error('Erro ao transferir dispositivo:', transferError);

      return res.status(500).json({
        acesso: false,
        motivo: 'ERRO_INTERNO',
        mensagem: 'No fue posible transferir el acceso. Inténtalo de nuevo.',
      });
    }

    return res.status(200).json({
      acesso: true,
      nome: data.nome,
      dispositivo_transferido: true,
    });
  }

  return res.status(200).json({
    acesso: false,
    motivo: 'OUTRO_DISPOSITIVO',
    mensagem: email
      ? 'Este correo ya está vinculado a otro dispositivo. ¿Deseas transferir el acceso a este dispositivo? El acceso anterior será desactivado.'
      : 'Este nombre ya está vinculado a otro dispositivo. ¿Deseas transferir el acceso a este dispositivo? El acceso anterior será desactivado.',
  });
};
