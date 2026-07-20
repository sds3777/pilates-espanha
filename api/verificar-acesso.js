const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ erro: 'JSON inválido' });
  }

  const email = (body.email || '').toLowerCase().trim();
  const nome = (body.nome || '').trim();
  const deviceId = (body.deviceId || '').trim();
  const transferirDispositivo = body.transferirDispositivo === true;

  // Mesma validação de sempre — apenas agora aceitando e-mail OU nome como
  // identificador de busca, sem criar nenhum sistema de autenticação novo.
  if ((!email && !nome) || !deviceId) {
    return res.status(400).json({ erro: 'Email ou nome, e deviceId, são obrigatórios' });
  }

  // Buscar acesso no Supabase — pela mesma tabela "acessos" já existente,
  // apenas trocando a coluna consultada (email ou nome) conforme o que foi
  // enviado. Nenhuma tabela nova, nenhum fluxo de autenticação paralelo.
  const query = supabase.from('acessos').select('*');
  const { data, error } = email
    ? await query.eq('email', email).single()
    : await query.ilike('nome', nome).single();

  if (error || !data) {
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
      mensagem: 'Seu pagamento ainda não foi compensado. Se você pagou por Multibanco, a confirmação pode levar de 1 a 2 dias úteis. Tente novamente mais tarde.',
    });
  }

  if (data.status !== 'ATIVO') {
    return res.status(200).json({
      acesso: false,
      motivo: 'BLOQUEADO',
      mensagem: 'Seu acesso foi cancelado ou reembolsado. Entre em contato com o suporte.',
    });
  }

  // Verificar dispositivo
  const deviceAtual = data.device_id;

  if (!deviceAtual) {
    // Primeiro acesso — registrar dispositivo
    // Usa o id do registro já encontrado (funciona igual tenha vindo da
    // busca por e-mail ou por nome, sem duplicar lógica por coluna).
    await supabase
      .from('acessos')
      .update({ device_id: deviceId, updated_at: new Date().toISOString() })
      .eq('id', data.id);

    return res.status(200).json({
      acesso: true,
      nome: data.nome,
      primeiroAcesso: true,
    });
  }

  if (deviceAtual === deviceId) {
    // Mesmo dispositivo — acesso liberado
    return res.status(200).json({ acesso: true, nome: data.nome });
  }

  // Dispositivo diferente
  if (transferirDispositivo) {
    // Usuário confirmou transferência
    await supabase
      .from('acessos')
      .update({ device_id: deviceId, updated_at: new Date().toISOString() })
      .eq('id', data.id);

    return res.status(200).json({ acesso: true, nome: data.nome, dispositivo_transferido: true });
  }

  // Pedir confirmação de transferência
  return res.status(200).json({
    acesso: false,
    motivo: 'OUTRO_DISPOSITIVO',
    mensagem: email
      ? 'Este e-mail já está vinculado a outro dispositivo. Deseja transferir o acesso para este aparelho? O acesso anterior será desativado.'
      : 'Este nome já está vinculado a outro dispositivo. Deseja transferir o acesso para este aparelho? O acesso anterior será desativado.',
  });
};
