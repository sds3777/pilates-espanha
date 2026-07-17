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
  const deviceId = (body.deviceId || '').trim();
  const transferirDispositivo = body.transferirDispositivo === true;

  if (!email || !deviceId) {
    return res.status(400).json({ erro: 'Email e deviceId são obrigatórios' });
  }

  // Buscar acesso no Supabase
  const { data, error } = await supabase
    .from('acessos')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    return res.status(200).json({
      acesso: false,
      motivo: 'NAO_ENCONTRADO',
      mensagem: 'Nenhuma compra ativa encontrada para este e-mail.',
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
    await supabase
      .from('acessos')
      .update({ device_id: deviceId, updated_at: new Date().toISOString() })
      .eq('email', email);

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
      .eq('email', email);

    return res.status(200).json({ acesso: true, nome: data.nome, dispositivo_transferido: true });
  }

  // Pedir confirmação de transferência
  return res.status(200).json({
    acesso: false,
    motivo: 'OUTRO_DISPOSITIVO',
    mensagem:
      'Este e-mail já está vinculado a outro dispositivo. Deseja transferir o acesso para este aparelho? O acesso anterior será desativado.',
  });
};
