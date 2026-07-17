(function () {
  var QUIZ_KEY = 'pilates_quiz_done';
  var AUTH_KEY = 'pilates_auth';
  var LANG_KEY = 'pilates_lang';

  // ─── Idioma: lê o mesmo valor salvo pelo app React em localStorage ────────
  var IDIOMAS_VALIDOS = ['pt-BR', 'pt-PT', 'es', 'en', 'fr'];
  function getLangAtual() {
    try {
      var v = localStorage.getItem(LANG_KEY);
      if (v && IDIOMAS_VALIDOS.indexOf(v) !== -1) return v;
    } catch (e) {}
    return 'pt-BR';
  }

  // ─── Traduções da tela de Bônus ────────────────────────────────────────────
  var BONUS_I18N = {
    'pt-BR': {
      titulo: '🎁 Bônus Exclusivos',
      chamada: 'Esses bônus vão te ajudar a acelerar seus resultados 🚀',
      subtitulo: 'Materiais extras inclusos no seu acesso',
      tabLabel: 'Bônus'
    },
    'pt-PT': {
      titulo: '🎁 Bónus Exclusivos',
      chamada: 'Estes bónus vão ajudar a acelerar os seus resultados 🚀',
      subtitulo: 'Materiais extra incluídos no seu acesso',
      tabLabel: 'Bónus'
    },
    'es': {
      titulo: '🎁 Bonos Exclusivos',
      chamada: 'Estos bonos te ayudarán a acelerar tus resultados 🚀',
      subtitulo: 'Materiales extra incluidos en tu acceso',
      tabLabel: 'Bonos'
    },
    'en': {
      titulo: '🎁 Exclusive Bonuses',
      chamada: 'These bonuses will help you speed up your results 🚀',
      subtitulo: 'Extra materials included in your access',
      tabLabel: 'Bonuses'
    },
    'fr': {
      titulo: '🎁 Bonus Exclusifs',
      chamada: 'Ces bonus vont vous aider à accélérer vos résultats 🚀',
      subtitulo: 'Documents supplémentaires inclus dans votre accès',
      tabLabel: 'Bonus'
    }
  };

  // Traduções apenas dos títulos dos PDFs (os PDFs em si continuam os mesmos)
  var BONUS_TITULOS_I18N = {
    'Guia Xô, Ansiedade': {
      'pt-PT': 'Guia Adeus, Ansiedade',
      'es': 'Guía Chao, Ansiedad',
      'en': 'Bye Anxiety Guide',
      'fr': 'Guide Adieu Anxiété'
    },
    'Doces e Sobremesas Zero': {
      'pt-PT': 'Doces e Sobremesas Zero Açúcar',
      'es': 'Dulces y Postres Sin Azúcar',
      'en': 'Zero Sugar Sweets & Desserts',
      'fr': 'Desserts et Sucreries Zéro Sucre'
    },
    'Chá Caseiro Mounjaro Natural': {
      'pt-PT': 'Chá Caseiro Mounjaro Natural',
      'es': 'Té Casero Mounjaro Natural',
      'en': 'Natural Homemade Mounjaro Tea',
      'fr': 'Thé Maison Mounjaro Naturel'
    },
    'Sucos Detox Saudáveis': {
      'pt-PT': 'Sumos Detox Saudáveis',
      'es': 'Jugos Detox Saludables',
      'en': 'Healthy Detox Juices',
      'fr': 'Jus Détox Sains'
    },
    '55 Receitas Sem Glúten na Airfryer': {
      'pt-PT': '55 Receitas Sem Glúten na Air Fryer',
      'es': '55 Recetas Sin Gluten en Airfryer',
      'en': '55 Gluten-Free Air Fryer Recipes',
      'fr': '55 Recettes Sans Gluten à l’Air Fryer'
    },
    'Guia Alimentar Diabéticos': {
      'pt-PT': 'Guia Alimentar para Diabéticos',
      'es': 'Guía Alimentaria para Diabéticos',
      'en': 'Diabetic Food Guide',
      'fr': 'Guide Alimentaire pour Diabétiques'
    },
    'Vitaminas Poderosas': {
      'pt-PT': 'Vitaminas Poderosas',
      'es': 'Vitaminas Poderosas',
      'en': 'Powerful Vitamin Smoothies',
      'fr': 'Vitamines Puissantes'
    },
    'Guia Alimentar': {
      'pt-PT': 'Guia Alimentar',
      'es': 'Guía Alimentaria',
      'en': 'Food Guide',
      'fr': 'Guide Alimentaire'
    }
  };

  function getBonusI18n() {
    return BONUS_I18N[getLangAtual()] || BONUS_I18N['pt-BR'];
  }

  function traduzirTituloPdf(tituloOriginal) {
    var lang = getLangAtual();
    if (lang === 'pt-BR') return tituloOriginal;
    var mapa = BONUS_TITULOS_I18N[tituloOriginal];
    if (mapa && mapa[lang]) return mapa[lang];
    return tituloOriginal;
  }

  // Duas chaves separadas:
  // INSTALL_POPUP_KEY  = usuário JÁ VIU e respondeu ao popup (não mostrar de novo)
  // INSTALL_DONE_KEY   = usuário instalou ou o app já está instalado (ocultar FAB)
  var INSTALL_POPUP_KEY = 'pilates_install_popup_seen';
  var INSTALL_DONE_KEY  = 'pilates_install_done';

  // ─── PWA: capturar o prompt de instalação o quanto antes ─────────────────
  var deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredInstallPrompt = e;
    atualizarBotaoInstalar();
  });
  window.addEventListener('appinstalled', function () {
    deferredInstallPrompt = null;
    try { localStorage.setItem(INSTALL_DONE_KEY, '1'); } catch (e) {}
    try { localStorage.setItem(INSTALL_POPUP_KEY, '1'); } catch (e) {}
    fecharPopupInstalar();
    atualizarBotaoInstalar();
  });

  function isStandaloneApp() {
    try {
      return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    } catch (e) { return false; }
  }

  function isIOS() {
    try {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    } catch (e) { return false; }
  }

  // ─── Botão flutuante "Instalar App" ──────────────────────────────────────
  function criarBotaoInstalarFlutuante() {
    if (document.getElementById('pq-install-fab')) return;
    var fab = document.createElement('button');
    fab.id = 'pq-install-fab';
    fab.style.cssText = 'display:none;position:fixed;left:50%;transform:translateX(-50%);bottom:calc(80px + env(safe-area-inset-bottom, 0px));z-index:9998;align-items:center;justify-content:center;gap:8px;padding:12px 20px;background:#d4af37;color:#0d1a1f;border:none;border-radius:999px;font-family:Inter,system-ui,sans-serif;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,0.35);';
    fab.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"></path><path d="M7 10l5 5 5-5"></path><path d="M5 21h14"></path></svg>'
      + 'Instalar App';
    fab.addEventListener('click', function () {
      if (deferredInstallPrompt) {
        fab.disabled = true;
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.finally(function () {
          deferredInstallPrompt = null;
          fab.disabled = false;
          atualizarBotaoInstalar();
        });
      } else if (isIOS()) {
        mostrarInstrucaoIOS();
      }
    });
    document.body.appendChild(fab);
  }

  function atualizarBotaoInstalar() {
    var fab = document.getElementById('pq-install-fab');
    if (!fab) return;

    // Se já instalou ou está rodando como PWA, ocultar
    var jaInstalou = false;
    try { jaInstalou = localStorage.getItem(INSTALL_DONE_KEY) === '1'; } catch(e) {}
    if (jaInstalou || isStandaloneApp()) {
      fab.style.display = 'none';
      return;
    }

    var authAtual = null;
    try { authAtual = JSON.parse(localStorage.getItem(AUTH_KEY)); } catch (e) {}
    var logado = !!(authAtual && authAtual.loggedIn);

    if (!logado) {
      fab.style.display = 'none';
      return;
    }
    if (deferredInstallPrompt || isIOS()) {
      fab.style.display = 'flex';
      fab.disabled = false;
    } else {
      fab.style.display = 'none';
    }
  }

  // ─── Pop-up de instalação ─────────────────────────────────────────────────
  function jaViuPopupInstalar() {
    try { return localStorage.getItem(INSTALL_POPUP_KEY) === '1'; } catch (e) { return false; }
  }
  function marcarPopupVisto() {
    try { localStorage.setItem(INSTALL_POPUP_KEY, '1'); } catch (e) {}
  }
  function fecharPopupInstalar() {
    var el = document.getElementById('pq-install-popup');
    if (el) el.remove();
  }

  function mostrarPopupInstalar() {
    // Não mostrar se já está rodando como app instalado
    if (isStandaloneApp()) {
      marcarPopupVisto();
      try { localStorage.setItem(INSTALL_DONE_KEY, '1'); } catch(e) {}
      atualizarBotaoInstalar();
      return;
    }
    // Não mostrar se o usuário já respondeu ao popup antes
    if (jaViuPopupInstalar()) {
      atualizarBotaoInstalar();
      return;
    }
    // Não duplicar
    if (document.getElementById('pq-install-popup')) return;

    var modal = document.createElement('div');
    modal.id = 'pq-install-popup';
    modal.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';
    modal.innerHTML =
      '<div style="background:#2a1a40;border:1px solid rgba(212,175,55,0.4);border-radius:20px;padding:32px 28px;max-width:380px;width:100%;text-align:center;">'
      + '<p style="font-size:32px;margin:0 0 12px;">📲</p>'
      + '<p style="color:#fff;font-size:16px;font-weight:700;margin:0 0 8px;">Instalar o app na tela inicial?</p>'
      + '<p style="color:#c9a8f0;font-size:14px;line-height:1.5;margin:0 0 24px;">Acesse suas aulas de Pilates com um toque, direto da tela do seu celular.</p>'
      + '<div style="display:flex;gap:12px;">'
      + '<button id="pq-install-nao" style="flex:1;padding:12px;background:transparent;border:2px solid #3a2560;color:#9b7ec8;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;">Não, agora</button>'
      + '<button id="pq-install-sim" style="flex:1;padding:12px;background:#d4af37;border:none;color:#0d1a1f;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;">Sim, instalar</button>'
      + '</div></div>';
    document.body.appendChild(modal);

    // "Não, agora" — fecha o popup, mantém FAB para instalar depois
    document.getElementById('pq-install-nao').addEventListener('click', function () {
      marcarPopupVisto();
      fecharPopupInstalar();
      atualizarBotaoInstalar(); // garante que o FAB fica visível
    });

    // "Sim, instalar" — dispara instalação e oculta FAB
    document.getElementById('pq-install-sim').addEventListener('click', function () {
      marcarPopupVisto();
      fecharPopupInstalar();
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(function(choice) {
          if (choice.outcome === 'accepted') {
            try { localStorage.setItem(INSTALL_DONE_KEY, '1'); } catch(e) {}
          }
          deferredInstallPrompt = null;
          atualizarBotaoInstalar();
        }).catch(function() {
          deferredInstallPrompt = null;
          atualizarBotaoInstalar();
        });
      } else if (isIOS()) {
        mostrarInstrucaoIOS();
        try { localStorage.setItem(INSTALL_DONE_KEY, '1'); } catch(e) {}
        atualizarBotaoInstalar();
      }
    });
  }

  // ─── Instrução iOS ────────────────────────────────────────────────────────
  function mostrarInstrucaoIOS() {
    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML =
      '<div style="background:#2a1a40;border:1px solid rgba(212,175,55,0.4);border-radius:20px;padding:32px 28px;max-width:380px;width:100%;text-align:center;">'
      + '<p style="color:#d4af37;font-size:32px;margin:0 0 12px;">⬆️</p>'
      + '<p style="color:#fff;font-size:15px;line-height:1.6;margin:0 0 24px;">Toque em <strong>Compartilhar</strong> <span style="opacity:.8;">(ícone de seta para cima)</span> e depois em <strong>"Adicionar à Tela de Início"</strong>.</p>'
      + '<button id="pq-ios-ok" style="width:100%;padding:12px;background:#d4af37;border:none;color:#0d1a1f;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">Entendi</button>'
      + '</div>';
    document.body.appendChild(modal);
    document.getElementById('pq-ios-ok').addEventListener('click', function() { modal.remove(); });
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

  // ─── Inicialização do FAB ─────────────────────────────────────────────────
  criarBotaoInstalarFlutuante();
  atualizarBotaoInstalar();
  if (isStandaloneApp()) {
    marcarPopupVisto();
    try { localStorage.setItem(INSTALL_DONE_KEY, '1'); } catch(e) {}
  }

  // Se já tem auth salvo, mostrar popup (se ainda não viu).
  // IMPORTANTE: não usar "return" aqui — isso encerrava o script inteiro e
  // impedia que a barra inferior (Aulas/Bônus) fosse recriada ao atualizar
  // a página já estando logado. O restante do script continua normalmente;
  // apenas a tela de login (mostrarLogin) é pulada mais abaixo quando já
  // há sessão ativa.
  var auth = null;
  try { auth = JSON.parse(localStorage.getItem(AUTH_KEY)); } catch(e) {}
  if (auth && auth.loggedIn) {
    setTimeout(mostrarPopupInstalar, 800);
  }

  // ─── deviceId ─────────────────────────────────────────────────────────────
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
            localStorage.setItem(AUTH_KEY, JSON.stringify({ loggedIn: true, nome: '', email: email }));
          } catch(e) {}
          overlay.remove();
          atualizarBotaoInstalar();
          injetarNavBar();
          // Mostrar popup de instalação 800ms após o login
          setTimeout(mostrarPopupInstalar, 800);
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

  // ─── Bloquear login antigo do app (nome+senha) ───────────────────────────
  var origSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
    if (key === AUTH_KEY && !window.__pq_auth_ok) return;
    origSetItem(key, value);
  };

  // ─── Mostrar login ────────────────────────────────────────────────────────
  // Só exibe a tela de login quando ainda não há sessão ativa. Se já estiver
  // logado (ex.: após atualizar a página), pulamos direto para a inicialização
  // da barra inferior (Aulas/Bônus) mais abaixo.
  if (!(auth && auth.loggedIn)) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mostrarLogin);
    } else {
      mostrarLogin();
    }
  }

  // ─── Sistema de abas: Aulas / Bônus ─────────────────────────────────────
  var BONUS_PDFS = [
    {
      titulo: 'Guia Xô, Ansiedade',
      id: '1XbEgKvAZu3LIdloFfPGqKvIQVJwrUlBm'
    },
    {
      titulo: 'Doces e Sobremesas Zero',
      id: '1TEWlwQ6HD7tkiPCLSi-BEcCGJZhtwPse'
    },
    {
      titulo: 'Chá Caseiro Mounjaro Natural',
      id: '1Qv-CELx4d-H-dttVtQN-JBBNxO4V0rAX'
    },
    {
      titulo: 'Sucos Detox Saudáveis',
      id: '1nCkYElZS4GHCRUt0JbHbnXnAD53nmai8'
    },
    {
      titulo: '55 Receitas Sem Glúten na Airfryer',
      id: '1KQ4w2B96yrl6tkzyiNltrJzLrfaWof1b'
    },
    {
      titulo: 'Guia Alimentar Diabéticos',
      id: '1BwhtTPjQJzimZDteYGeWe3-Rhb1GtJax'
    },
    {
      titulo: 'Vitaminas Poderosas',
      id: '1aDBgZiOBgeZUR9vKUUApqMXQpDCwLJeG'
    },
    {
      titulo: 'Guia Alimentar',
      id: '1DeBR6DmxtsBasZUA_FUvEWJksgc7SCV-'
    }
  ];

  function getViewUrl(id) {
    return 'https://drive.google.com/file/d/' + id + '/preview';
  }
  function getThumbUrl(id) {
    return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w400';
  }

  var abaAtiva = 'aulas'; // 'aulas' ou 'bonus'
  var ROOT_EL = null;

  function injetarNavBar() {
    if (document.getElementById('pq-bottom-nav')) {
      // Já existe: apenas garante que o estado visual (aba ativa) está correto.
      atualizarAbas();
      return;
    }

    var nav = document.createElement('div');
    nav.id = 'pq-bottom-nav';
    nav.style.cssText = [
      'position:fixed',
      'bottom:0',
      'left:0',
      'right:0',
      'z-index:9990',
      'background:#13082a',
      'border-top:1px solid rgba(212,175,55,0.2)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'gap:0',
      'padding-bottom:env(safe-area-inset-bottom,0px)',
      'font-family:Inter,system-ui,sans-serif'
    ].join(';');

    // Sem estado ativo fixo no HTML: o estado real (Aulas ou Bônus) é sempre
    // aplicado logo depois via atualizarAbas(), para nunca ficar dessincronizado
    // com a tela que está de fato visível.
    nav.innerHTML =
      '<button id="pq-tab-aulas" onclick="window.__pqMudarAba(\'aulas\')" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:10px 0 8px;background:none;border:none;cursor:pointer;color:#9b7ec8;border-top:2px solid transparent;">'
      + '<span style="font-size:20px">🧘‍♀️</span>'
      + '<span style="font-size:11px;font-weight:700;letter-spacing:0.5px;">Aulas</span>'
      + '</button>'
      + '<button id="pq-tab-bonus" onclick="window.__pqMudarAba(\'bonus\')" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:10px 0 8px;background:none;border:none;cursor:pointer;color:#9b7ec8;border-top:2px solid transparent;">'
      + '<span style="font-size:20px">🎁</span>'
      + '<span style="font-size:11px;font-weight:700;letter-spacing:0.5px;">' + getBonusI18n().tabLabel + '</span>'
      + '</button>';

    document.body.appendChild(nav);

    // Ajustar padding inferior do app para não sobrepor a nav
    var root = document.getElementById('root');
    if (root) root.style.paddingBottom = '64px';

    // Aplica o estado real da aba (evita a barra "nascer" sempre em Aulas
    // mesmo quando o usuário estava em Bônus no momento da recriação).
    atualizarAbas();

    // Se a barra precisou ser recriada enquanto a tela de bônus estava aberta
    // e essa tela também sumiu junto, restaura ela também.
    if (abaAtiva === 'bonus' && !document.getElementById('pq-bonus-screen')) {
      mostrarTelaBonus();
    }
  }

  function atualizarAbas() {
    var btnAulas = document.getElementById('pq-tab-aulas');
    var btnBonus = document.getElementById('pq-tab-bonus');
    if (!btnAulas || !btnBonus) return;
    if (abaAtiva === 'aulas') {
      btnAulas.style.color = '#d4af37';
      btnAulas.style.borderTop = '2px solid #d4af37';
      btnBonus.style.color = '#9b7ec8';
      btnBonus.style.borderTop = '2px solid transparent';
    } else {
      btnBonus.style.color = '#d4af37';
      btnBonus.style.borderTop = '2px solid #d4af37';
      btnAulas.style.color = '#9b7ec8';
      btnAulas.style.borderTop = '2px solid transparent';
    }
  }

  function mostrarTelaBonus() {
    // Esconder o app React
    var root = document.getElementById('root');
    if (root) root.style.display = 'none';

    // Remover tela de bônus anterior se existir
    var anterior = document.getElementById('pq-bonus-screen');
    if (anterior) anterior.remove();

    var tela = document.createElement('div');
    tela.id = 'pq-bonus-screen';
    tela.style.cssText = [
      'position:fixed',
      'inset:0',
      'bottom:64px',
      'z-index:9980',
      'background:#0d0720',
      'overflow-y:auto',
      'font-family:Inter,system-ui,sans-serif',
      '-webkit-overflow-scrolling:touch'
    ].join(';');

    var t = getBonusI18n();

    var cardsHtml = BONUS_PDFS.map(function(pdf) {
      var thumb = getThumbUrl(pdf.id);
      var viewUrl = getViewUrl(pdf.id);
      var tituloTraduzido = traduzirTituloPdf(pdf.titulo);
      return '<div onclick="window.__pqAbrirPdf(\'' + pdf.id + '\',\'' + tituloTraduzido.replace(/'/g, "\\'") + '\')" style="cursor:pointer;background:#1a1035;border-radius:12px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);transition:transform 0.15s;active:scale-95;" onmousedown="this.style.transform=\'scale(0.97)\'" onmouseup="this.style.transform=\'scale(1)\'" ontouchstart="this.style.transform=\'scale(0.97)\'" ontouchend="this.style.transform=\'scale(1)\'">'
        + '<div style="width:100%;aspect-ratio:3/4;overflow:hidden;background:#2a1a40;position:relative;">'
        + '<img src="' + thumb + '" alt="' + tituloTraduzido + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\'">'
        + '<div style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;background:linear-gradient(135deg,#2a1a40,#1a1035);flex-direction:column;gap:8px;">'
        + '<span style="font-size:40px">📄</span>'
        + '</div>'
        + '</div>'
        + '<div style="padding:10px 10px 12px;">'
        + '<p style="color:#fff;font-size:12px;font-weight:600;margin:0;line-height:1.3;text-align:center;">' + tituloTraduzido + '</p>'
        + '</div>'
        + '</div>';
    }).join('');

    tela.innerHTML =
      '<div style="padding:20px 16px 16px;">'
      + '<h2 style="color:#d4af37;font-size:18px;font-weight:700;margin:0 0 4px;letter-spacing:1px;">' + t.titulo + '</h2>'
      + '<p style="color:#d4af37;font-size:13px;font-weight:600;margin:0 0 6px;">' + t.chamada + '</p>'
      + '<p style="color:#9b7ec8;font-size:13px;margin:0 0 20px;">' + t.subtitulo + '</p>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      + cardsHtml
      + '</div>'
      + '</div>';

    document.body.insertBefore(tela, document.getElementById('pq-bottom-nav'));
  }

  function ocultarTelaBonus() {
    var tela = document.getElementById('pq-bonus-screen');
    if (tela) tela.remove();
    var root = document.getElementById('root');
    if (root) root.style.display = '';
  }

  function abrirPdf(id, titulo) {
    var viewUrl = getViewUrl(id);
    var viewer = document.createElement('div');
    viewer.id = 'pq-pdf-viewer';
    viewer.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:99995',
      'background:#0d0720',
      'display:flex',
      'flex-direction:column',
      'font-family:Inter,system-ui,sans-serif'
    ].join(';');

    viewer.innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:#13082a;border-bottom:1px solid rgba(212,175,55,0.2);flex-shrink:0;">'
      + '<button onclick="document.getElementById(\'pq-pdf-viewer\').remove()" style="background:none;border:none;cursor:pointer;color:#d4af37;padding:4px;display:flex;align-items:center;">'
      + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/></svg>'
      + '</button>'
      + '<p style="color:#fff;font-size:14px;font-weight:600;margin:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + titulo + '</p>'
      + '</div>'
      + '<iframe src="' + viewUrl + '" style="flex:1;width:100%;border:none;" allow="autoplay" allowfullscreen></iframe>';

    document.body.appendChild(viewer);
  }

  window.__pqMudarAba = function(aba) {
    abaAtiva = aba;
    atualizarAbas();
    if (aba === 'bonus') {
      mostrarTelaBonus();
    } else {
      ocultarTelaBonus();
    }
  };

  window.__pqAbrirPdf = function(id, titulo) {
    abrirPdf(id, titulo);
  };

  // Injetar nav bar após login
  function iniciarNavBar() {
    var auth = null;
    try { auth = JSON.parse(localStorage.getItem(AUTH_KEY)); } catch(e) {}
    if (auth && auth.loggedIn) {
      injetarNavBar();
    }
    // Observador permanente: garante que a nav bar volte a aparecer caso seja
    // removida por engano (ex: re-renderizações) e injeta assim que o login
    // (overlay de e-mail) for concluído.
    // subtree:true para pegar remoções em qualquer nível, não só filhos diretos do body.
    function garantirNavBar() {
      var a = null;
      try { a = JSON.parse(localStorage.getItem(AUTH_KEY)); } catch(e) {}
      var logado = !!(a && a.loggedIn);
      var login = document.getElementById('pq-email-login');
      if (logado && !login && !document.getElementById('pq-bottom-nav')) {
        injetarNavBar();
      }
    }

    var obs = new MutationObserver(function () {
      clearTimeout(garantirNavBar._t);
      garantirNavBar._t = setTimeout(garantirNavBar, 200);
    });
    obs.observe(document.body, { childList: true, subtree: true });

    // Watchdog: checagem periódica como rede de segurança extra, caso a nav
    // suma por algum re-render que o MutationObserver não capture a tempo.
    setInterval(garantirNavBar, 1500);

    // Reforça também em navegações internas (SPA) e quando a aba volta a ficar visível.
    window.addEventListener('popstate', garantirNavBar);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) garantirNavBar();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarNavBar);
  } else {
    iniciarNavBar();
  }

  // ─── Injetar cadeado grande sobre capa do certificado (estado bloqueado) ──
  // MutationObserver aguarda o React renderizar e injeta o cadeado SVG.
  // IMPORTANTE: nunca sobrescrevemos innerHTML de nós que o React controla —
  // isso quebra a reconciliação do React (o React perde a referência dos
  // elementos que ele mesmo criou) e pode travar/re-renderizar o app inteiro
  // sem aviso. Em vez disso, apenas ocultamos visualmente o conteúdo original
  // (visibility:hidden, sem remover do DOM) e sobrepomos nosso próprio
  // elemento independente por cima.
  (function injetarCadeadoCertificado() {
    var LOCK_SVG =
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
      + '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>'
      + '<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>'
      + '</svg>';

    function aplicarBloqueado(card) {
      var overlay = card.querySelector('[class*="absolute inset-0 flex flex-col items-center justify-center z-10"]');
      if (!overlay) return;
      overlay.style.visibility = 'hidden';
      if (card.querySelector('#pq-cert-lock')) return;
      // O cadeado deve ficar apenas sobre a área da capa (imagem), nunca
      // sobre a área de texto abaixo — por isso usamos o wrapper da imagem
      // (aspect-square) como referência de posicionamento, não o card inteiro.
      var imgWrap = overlay.parentElement && overlay.parentElement.querySelector('[class*="aspect-square"]');
      if (!imgWrap) imgWrap = overlay.parentElement;
      if (imgWrap && getComputedStyle(imgWrap).position === 'static') {
        imgWrap.style.position = 'relative';
      }
      var lock = document.createElement('div');
      lock.id = 'pq-cert-lock';
      lock.style.cssText = 'position:absolute;left:0;right:0;top:0;bottom:0;z-index:11;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:8%;gap:10px;pointer-events:none;';
      lock.innerHTML = LOCK_SVG
        + '<p style="color:#d4af37;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0;text-shadow:0 1px 4px rgba(0,0,0,0.6);">Bloqueado</p>';
      if (imgWrap) {
        imgWrap.appendChild(lock);
      } else {
        card.appendChild(lock);
      }
    }

    function removerBloqueado(lock) {
      var card = lock.closest('[class*="col-span-2"]');
      lock.remove();
      if (!card) return;
      var overlay = card.querySelector('[class*="absolute inset-0 flex flex-col items-center justify-center z-10"]');
      if (overlay) overlay.style.visibility = '';
    }

    function tentarInjetar() {
      // Aplica o cadeado enquanto o certificado estiver bloqueado
      document.querySelectorAll('[class*="col-span-2"][class*="cursor-not-allowed"]').forEach(aplicarBloqueado);
      // Remove o cadeado assim que o certificado for desbloqueado (evita
      // "cadeado fantasma" preso depois que o usuário completa os módulos)
      document.querySelectorAll('#pq-cert-lock').forEach(function (lock) {
        var card = lock.closest('[class*="col-span-2"]');
        if (!card || card.className.indexOf('cursor-not-allowed') === -1) {
          removerBloqueado(lock);
        }
      });
    }

    var debounced;
    var obs = new MutationObserver(function () {
      clearTimeout(debounced);
      debounced = setTimeout(tentarInjetar, 150);
    });
    obs.observe(document.body, { childList: true, subtree: true });
    tentarInjetar();
  })();

})();
