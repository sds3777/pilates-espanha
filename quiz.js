(function () {
  var QUIZ_KEY = 'pilates_quiz_done';
  var AUTH_KEY = 'pilates_auth';
  var LANG_KEY = 'pilates_lang';

  // Se já tem auth salvo, não faz nada
  var auth = null;
  try { auth = JSON.parse(localStorage.getItem(AUTH_KEY)); } catch(e) {}
  if (auth && auth.loggedIn) return;

  // ─── Gerar ou recuperar deviceId ─────────────────────────────────────────
  function getDeviceId() {
    var key = 'pilates_device_id';
    try {
      var id = localStorage.getItem(key);
      if (id) return id;
      id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
      return id;
    } catch(e) { return 'dev_unknown'; }
  }

  // ─── Email da URL (?email=xxx) ────────────────────────────────────────────
  function getEmailFromUrl() {
    try {
      return new URLSearchParams(window.location.search).get('email') || '';
    } catch(e) { return ''; }
  }

  // ─── Tela de login por e-mail ─────────────────────────────────────────────
  function mostrarLogin() {
    var emailUrl = getEmailFromUrl();

    var overlay = document.createElement('div');
    overlay.id = 'pq-email-login';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(13,7,24,0.97);display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;padding:20px;';

    overlay.innerHTML =
      '<div style="width:100%;max-width:420px;background:linear-gradient(160deg,rgba(42,26,64,0.98),rgba(26,16,37,0.99));border:1px solid rgba(212,175,55,0.35);border-radius:24px;overflow:hidden;box-shadow:0 0 60px rgba(212,175,55,0.15),0 32px 64px rgba(0,0,0,0.6);">'
      + '<div style="height:3px;background:linear-gradient(90deg,transparent,#d4af37,transparent);"></div>'
      + '<div style="padding:36px 32px 40px;display:flex;flex-direction:column;align-items:center;gap:24px;">'
      + '<img src="https://i.imgur.com/m6vjf6a.png" style="width:88px;height:88px;border-radius:50%;border:2px solid rgba(212,175,55,0.5);object-fit:cover;" onerror="this.style.display=\'none\'">'
      + '<div style="text-align:center;">'
      + '<h1 style="color:#d4af37;font-size:22px;font-weight:700;letter-spacing:2px;margin:0 0 6px;font-family:Cinzel,serif;">PILATES EM CASA</h1>'
      + '<p style="color:#c9a8f0;font-size:13px;letter-spacing:4px;margin:0;font-family:Cinzel,serif;">com Ana Rita</p>'
      + '</div>'
      + '<div style="text-align:center;">'
      + '<p style="color:#fff;font-size:17px;font-weight:600;margin:0 0 6px;">Acesso exclusivo para alunas 💛</p>'
      + '<p style="color:#9b7ec8;font-size:13px;margin:0;">Digite o e-mail usado na sua compra</p>'
      + '</div>'
      + '<div style="width:100%;">'
      + '<label style="color:#d4af37;font-size:14px;font-weight:600;display:block;margin-bottom:8px;">E-mail</label>'
      + '<input id="pq-email-input" type="email" placeholder="seuemail@email.com" value="' + emailUrl + '" autocomplete="email" style="width:100%;box-sizing:border-box;background:#1a1025;border:2px solid #3a2560;border-radius:12px;padding:14px 16px;color:#fff;font-size:16px;outline:none;">'
      + '<p id="pq-email-erro" style="color:#f87171;font-size:13px;margin:6px 0 0;min-height:18px;display:none;"></p>'
      + '</div>'
      + '<button id="pq-email-btn" style="width:100%;padding:16px;background:#d4af37;color:#0d1a1f;border:none;border-radius:14px;font-size:18px;font-weight:700;cursor:pointer;font-family:Cinzel,serif;letter-spacing:1px;">Entrar</button>'
      + '</div>'
      + '<div style="height:3px;background:linear-gradient(90deg,transparent,#d4af37,transparent);"></div>'
      + '</div>';

    document.body.appendChild(overlay);

    var input = document.getElementById('pq-email-input');
    var btn = document.getElementById('pq-email-btn');
    var erroEl = document.getElementById('pq-email-erro');

    function mostrarErro(msg) { erroEl.textContent = msg; erroEl.style.display = 'block'; }
    function esconderErro() { erroEl.style.display = 'none'; }

    function tentarEntrar(transferir) {
      var email = input.value.trim().toLowerCase();
      if (!email || !email.includes('@')) { mostrarErro('Digite um e-mail válido.'); return; }

      btn.disabled = true;
      btn.textContent = 'Verificando…';
      esconderErro();

      fetch('/api/verificar-acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, deviceId: getDeviceId(), transferirDispositivo: !!transferir })
      })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (res.acesso) {
          window.__pq_auth_ok = true;
          try {
            localStorage.setItem(AUTH_KEY, JSON.stringify({ loggedIn: true, nome: res.nome || email, email: email }));
          } catch(e) {}
          overlay.remove();
          overlay.remove();
        } else if (res.motivo === 'OUTRO_DISPOSITIVO') {
          mostrarConfirmacao(res.mensagem, function() { tentarEntrar(true); }, function() {
            btn.disabled = false; btn.textContent = 'Entrar';
          });
        } else {
          mostrarErro(res.mensagem || 'Nenhuma compra ativa encontrada para este e-mail.');
          btn.disabled = false; btn.textContent = 'Entrar';
        }
      })
      .catch(function() {
        mostrarErro('Erro de conexão. Tente novamente.');
        btn.disabled = false; btn.textContent = 'Entrar';
      });
    }

    btn.addEventListener('click', function() { tentarEntrar(false); });
    input.addEventListener('keydown', function(e) { if (e.key === 'Enter') tentarEntrar(false); });
  }

  // ─── Modal de transferência de dispositivo ────────────────────────────────
  function mostrarConfirmacao(mensagem, onSim, onNao) {
    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML =
      '<div style="background:#2a1a40;border:1px solid rgba(212,175,55,0.4);border-radius:20px;padding:32px 28px;max-width:380px;width:100%;text-align:center;">'
      + '<p style="color:#fff;font-size:15px;line-height:1.6;margin:0 0 24px;">' + mensagem + '</p>'
      + '<div style="display:flex;gap:12px;">'
      + '<button id="pq-nao" style="flex:1;padding:12px;background:transparent;border:2px solid #3a2560;color:#9b7ec8;border-radius:12px;font-size:15px;cursor:pointer;">Cancelar</button>'
      + '<button id="pq-sim" style="flex:1;padding:12px;background:#d4af37;border:none;color:#0d1a1f;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">Transferir acesso</button>'
      + '</div></div>';
    document.body.appendChild(modal);
    document.getElementById('pq-sim').addEventListener('click', function() { modal.remove(); onSim(); });
    document.getElementById('pq-nao').addEventListener('click', function() { modal.remove(); onNao(); });
  }

  // ─── Iniciar ──────────────────────────────────────────────────────────────
  // Bloquear o login antigo do app (nome+senha) de gravar no localStorage
  var origSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
    if (key === AUTH_KEY && !window.__pq_auth_ok) return;
    origSetItem(key, value);
  };

  // Mostrar login assim que o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mostrarLogin);
  } else {
    mostrarLogin();
  }

})();
