(function () {
  var QUIZ_KEY = 'pilates_quiz_done';
  var AUTH_KEY = 'pilates_auth';
  var LANG_KEY = 'pilates_lang';

  // ─── Modo demonstração (/teste) ──────────────────
  // Na rota /teste o React já abre sozinho no modo DEMO nativo (aulas
  // liberadas/bloqueadas e oferta tratadas dentro do próprio bundle).
  // Aqui apenas pulamos totalmente a tela de login e a checagem no
  // Supabase, liberando a nav bar (Clases/Bonos) direto — sem tocar em
  // mais nada do fluxo normal, que continua abaixo intacto para as
  // demais rotas.
  var MODO_TESTE = window.location.pathname.replace(/\/+$/, '') === '/teste';


  // window.__pq_auth_ok só vira true depois que o backend confirma o acesso
  // (login manual OU revalidação automática) nesta sessão de página.
  window.__pq_auth_ok = false;

  // ─── Bloquear login antigo do app (nome+senha) ───────────────────────────
  // Definido logo no início: origSetItem precisa existir antes de qualquer
  // função que possa gravar AUTH_KEY (revalidação, login, logout).
  var origSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
    if (key === AUTH_KEY && !window.__pq_auth_ok) return;
    origSetItem(key, value);
    if (key === LANG_KEY) {
      try { window.dispatchEvent(new CustomEvent('pilates:lang', { detail: value })); } catch (e) {}
    }
  };

  // ─── Idioma: mesma fonte de verdade usada pelo app React ────────────────
  var IDIOMAS_VALIDOS = ['es-ES', 'es-AR', 'es-MX', 'es-CO', 'es-PE', 'es-CL'];

  function getLangAtual() {
    var lang = 'es-CO';
    try {
      var salvo = localStorage.getItem(LANG_KEY);
      if (IDIOMAS_VALIDOS.indexOf(salvo) !== -1) return salvo;
      // Migração de versões antigas que gravavam apenas "es".
      if (salvo === 'es') {
        localStorage.setItem(LANG_KEY, lang);
        return lang;
      }
    } catch (e) {}
    return lang;
  }

  function aplicarDialeto(texto, lang) {
    if (typeof texto !== 'string') return texto;
    var t = texto;
    if (lang === 'es-ES') {
      return t.replace(/\bcelular\b/gi, function(m){ return m[0] === m[0].toUpperCase() ? 'Móvil' : 'móvil'; })
        .replace(/\bcomputadora\b/gi, function(m){ return m[0] === m[0].toUpperCase() ? 'Ordenador' : 'ordenador'; })
        .replace(/\bjugos\b/gi, function(m){ return m[0] === m[0].toUpperCase() ? 'Zumos' : 'zumos'; })
        .replace(/Bonos Exclusivos/g, 'Extras exclusivos')
        .replace(/Materiales extra/g, 'Material adicional')
        .replace(/^Bonos$/, 'Extras');
    }
    if (lang === 'es-AR') {
      return t.replace(/\bIngresa\b/g, 'Ingresá').replace(/\bingresa\b/g, 'ingresá')
        .replace(/\bIngresar\b/g, 'Ingresar')
        .replace(/\bEscribe\b/g, 'Escribí').replace(/\bescribe\b/g, 'escribí')
        .replace(/\bSelecciona\b/g, 'Seleccioná').replace(/\bselecciona\b/g, 'seleccioná')
        .replace(/\bElige\b/g, 'Elegí').replace(/\belige\b/g, 'elegí')
        .replace(/\bToca\b/g, 'Tocá').replace(/\btoca\b/g, 'tocá')
        .replace(/\bAgrega\b/g, 'Agregá').replace(/\bagrega\b/g, 'agregá')
        .replace(/\bIntenta\b/g, 'Intentá').replace(/\bintenta\b/g, 'intentá')
        .replace(/\bContinúa\b/g, 'Seguí').replace(/\bcontinúa\b/g, 'seguí')
        .replace(/\bEmpieza\b/g, 'Empezá').replace(/\bempieza\b/g, 'empezá')
        .replace(/\bComienza\b/g, 'Empezá').replace(/\bcomienza\b/g, 'empezá')
        .replace(/\bpuedes\b/g, 'podés').replace(/\bquieres\b/g, 'querés')
        .replace(/Bonos Exclusivos/g, 'Beneficios exclusivos')
        .replace(/^Bonos$/, 'Beneficios')
        .replace(/\bzumos\b/gi, function(m){ return m[0] === m[0].toUpperCase() ? 'Jugos' : 'jugos'; });
    }
    t = t.replace(/\bzumos\b/gi, function(m){ return m[0] === m[0].toUpperCase() ? 'Jugos' : 'jugos'; })
      .replace(/\bmóvil\b/gi, function(m){ return m[0] === m[0].toUpperCase() ? 'Celular' : 'celular'; });
    if (lang === 'es-MX') return t.replace(/Bienvenida de nuevo/g, '¡Qué gusto verte de nuevo!').replace(/\bIngresar\b/g, 'Entrar').replace(/Bonos Exclusivos/g, 'Material extra exclusivo').replace(/Materiales extra/g, 'Contenido adicional').replace(/^Bonos$/, 'Extras');
    if (lang === 'es-CO') return t.replace(/Bienvenida de nuevo/g, '¡Bienvenida otra vez!').replace(/\bIngresar\b/g, 'Entrar').replace(/Bonos Exclusivos/g, 'Beneficios exclusivos').replace(/Materiales extra/g, 'Material adicional').replace(/^Bonos$/, 'Beneficios');
    if (lang === 'es-PE') return t.replace(/Bienvenida de nuevo/g, '¡Bienvenida nuevamente!').replace(/\bIngresar\b/g, 'Entrar').replace(/Bonos Exclusivos/g, 'Recursos exclusivos').replace(/Materiales extra/g, 'Recursos adicionales').replace(/^Bonos$/, 'Recursos').replace(/^Clases$/, 'Clases disponibles');
    if (lang === 'es-CL') return t.replace(/Bienvenida de nuevo/g, '¡Bienvenida de vuelta!').replace(/\bIngresar\b/g, 'Entrar').replace(/\bToca\b/g, 'Presiona').replace(/\btoca\b/g, 'presiona').replace(/Ahora no/g, 'Por ahora no').replace(/Bonos Exclusivos/g, 'Extras exclusivos').replace(/Materiales extra/g, 'Contenido adicional').replace(/^Bonos$/, 'Extras');
    return t;
  }

  function textoIdioma(texto) {
    return aplicarDialeto(texto, getLangAtual());
  }

  function escapeHtml(valor) {
    return String(valor == null ? '' : valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ─── Traduções da tela de Bonos ──────────────────────────────────────────
  var BONUS_I18N_BASE = {
    titulo: '🎁 Bonos Exclusivos',
    chamada: 'Estos bonos te ayudarán a acelerar tus resultados 🚀',
    subtitulo: 'Materiales extra incluidos en tu acceso',
    tabLabel: 'Bonos',
    clasesLabel: 'Clases'
  };

  var BONUS_TITULOS_I18N = {
    detox: 'Jugos detox saludables.pdf',
    vitaminas: 'Vitaminas poderosas.pdf',
    mounjaro: 'Té casero Mounjaro Natural.pdf',
    alimentaria: 'Guía alimentaria.pdf',
    diabeticos: 'Guía alimentaria para diabéticos.pdf',
    ansiedad: 'Guía adiós a la ansiedad.pdf',
    postres: 'Dulces y postres sin azúcar.pdf',
    airfryer: '55 recetas sin gluten para Airfryer.pdf'
  };

  function getBonusI18n() {
    var lang = getLangAtual();
    var copia = {};
    Object.keys(BONUS_I18N_BASE).forEach(function (k) {
      copia[k] = aplicarDialeto(BONUS_I18N_BASE[k], lang);
    });
    return copia;
  }

  function traduzirTituloPdf(pdf) {
    var chave = typeof pdf === 'object' ? pdf.key : pdf;
    var base = BONUS_TITULOS_I18N[chave] || (typeof pdf === 'object' ? pdf.titulo : String(pdf || ''));
    return aplicarDialeto(base, getLangAtual());
  }

  var LOGIN_I18N_BASE = {
    subtitle: 'con Daniela',
    exclusive: 'Acceso exclusivo para alumnas 💛',
    emailHelp: 'Escribe el correo usado en tu compra',
    nameHelp: 'Escribe el nombre usado en tu compra',
    emailLabel: 'E-mail',
    nameLabel: 'Nombre',
    useName: 'Ingresar con nombre',
    useEmail: 'Ingresar con e-mail',
    emailPlaceholder: 'tuemail@email.com',
    namePlaceholder: 'Tu nombre completo',
    enter: 'Ingresar',
    checking: 'Verificando…',
    invalidEmail: 'Escribe un correo electrónico válido.',
    invalidName: 'Escribe un nombre válido de al menos 2 caracteres.',
    connectionError: 'No fue posible conectarse. Inténtalo de nuevo.',
    unavailableTitle: 'Acceso no disponible',
    unavailableDefault: 'No fue posible liberar tu acceso.',
    retry: 'Intentar de nuevo',
    whatsapp: 'Hablar con soporte por WhatsApp 📲',
    cancel: 'Cancelar',
    transfer: 'Transferir acceso'
  };

  function getLoginI18n() {
    var lang = getLangAtual();
    var copia = {};
    Object.keys(LOGIN_I18N_BASE).forEach(function (k) {
      copia[k] = aplicarDialeto(LOGIN_I18N_BASE[k], lang);
    });
    return copia;
  }

  function mensagemAcessoPorMotivo(motivo, fallback) {
    var mensagens = {
      NAO_ENCONTRADO: 'No encontramos una compra activa con los datos informados. Verifica la información o habla con soporte.',
      PROCESSANDO: 'Tu pago todavía está siendo procesado. Si pagaste por un método con compensación diferida, espera la confirmación e inténtalo más tarde.',
      BLOQUEADO: 'Tu acceso fue cancelado, reembolsado o desactivado. Habla con soporte para revisar tu situación.',
      OUTRO_DISPOSITIVO: 'Este acceso ya está vinculado a otro dispositivo. ¿Deseas transferirlo a este dispositivo? El acceso anterior será desactivado.',
      ERRO_INTERNO: 'No fue posible verificar el acceso en este momento. Inténtalo de nuevo.',
      DADOS_INVALIDOS: 'Los datos informados no son válidos. Revísalos e inténtalo de nuevo.',
      MUITAS_TENTATIVAS: 'Se realizaron demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
      ORIGEM_NAO_PERMITIDA: 'Esta dirección no está autorizada para verificar el acceso.',
      REDE: 'No fue posible conectarse para verificar el acceso. Comprueba tu conexión e inténtalo de nuevo.'
    };
    return textoIdioma(mensagens[motivo] || fallback || LOGIN_I18N_BASE.unavailableDefault);
  }

  // ─── Modal de transferência de dispositivo ────────────────────────────────
  function mostrarConfirmacao(mensagem, onSim, onNao) {
    var t = getLoginI18n();
    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML =
      '<div style="background:#2a1a40;border:1px solid rgba(212,175,55,0.4);border-radius:20px;padding:32px 28px;max-width:380px;width:100%;text-align:center;">'
      + '<p id="pq-confirm-message" style="color:#fff;font-size:15px;line-height:1.6;margin:0 0 24px;"></p>'
      + '<div style="display:flex;gap:12px;">'
      + '<button id="pq-nao" type="button" style="flex:1;padding:12px;background:transparent;border:2px solid #3a2560;color:#9b7ec8;border-radius:12px;font-size:15px;cursor:pointer;">' + escapeHtml(t.cancel) + '</button>'
      + '<button id="pq-sim" type="button" style="flex:1;padding:12px;background:#d4af37;border:none;color:#0d1a1f;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">' + escapeHtml(t.transfer) + '</button>'
      + '</div></div>';
    document.body.appendChild(modal);
    document.getElementById('pq-confirm-message').textContent = mensagem;
    document.getElementById('pq-sim').addEventListener('click', function() { modal.remove(); onSim(); });
    document.getElementById('pq-nao').addEventListener('click', function() { modal.remove(); onNao(); });
  }

  // Se já tem auth salvo no localStorage, ele NUNCA é usado sozinho para
  // liberar acesso — serve apenas de "atalho" (evita pedir e-mail de novo)
  // e para a nav bar poder ser recriada de forma otimista enquanto a
  // revalidação abaixo está em andamento. A decisão real de liberar ou
  // bloquear o app é sempre tomada consultando o backend em
  // revalidarAcessoNoBackend(), chamada a cada carregamento/retorno ao app.
  var auth = null;
  try { auth = JSON.parse(localStorage.getItem(AUTH_KEY)); } catch(e) {}

  function limparAuthLocal() {
    window.__pq_auth_ok = false;
    try { origSetItem(AUTH_KEY, JSON.stringify({ loggedIn: false })); } catch(e) {}
  }

  // ─── Revalidação obrigatória do acesso no backend ─────────────────────────
  // Chamada sempre que o app é aberto, atualizado, ou volta a ficar visível
  // (troca de aba/app e retorno). Nunca confia apenas no que está salvo no
  // navegador: sempre confirma no Supabase, através de /api/verificar-acesso,
  // se o e-mail salvo continua com status ATIVO antes de liberar o app.
  var revalidando = false;
  function revalidarAcessoNoBackend() {
    var emailSalvo = (auth && auth.email) ? auth.email : '';

    if (!emailSalvo) {
      // Nunca logou neste navegador/dispositivo: exige login.
      limparAuthLocal();
      mostrarLogin();
      return;
    }

    if (revalidando) return;
    revalidando = true;

    var controlador = typeof AbortController === 'function' ? new AbortController() : null;
    var timeoutRevalidacao = setTimeout(function () {
      if (controlador) controlador.abort();
    }, 15000);

    fetch('/api/verificar-acesso', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: emailSalvo, deviceId: getDeviceId(), transferirDispositivo: false }),
      signal: controlador ? controlador.signal : undefined
    })
      .then(function (r) {
        if (!r.ok) throw new Error('Falha na revalidação');
        return r.json();
      })
      .then(function (res) {
        clearTimeout(timeoutRevalidacao);
        revalidando = false;
        if (res.acesso) {
          // E-mail confirmado ATIVO no backend agora sim: libera de fato.
          window.__pq_auth_ok = true;
          try {
            origSetItem(AUTH_KEY, JSON.stringify({ loggedIn: true, nome: res.nome || (auth && auth.nome) || '', email: emailSalvo }));
          } catch (e) {}
          auth = { loggedIn: true, nome: res.nome || (auth && auth.nome) || '', email: emailSalvo };
          var loginAberto = document.getElementById('pq-email-login');
          if (loginAberto) loginAberto.remove();
          var rootLiberado = document.getElementById('root');
          if (rootLiberado) rootLiberado.style.display = '';
          try { window.dispatchEvent(new CustomEvent('pilates:auth', { detail: { nome: auth.nome, email: auth.email } })); } catch (e) {}
          injetarNavBar();
          if (typeof window.__pqTriggerInstallAfterLogin === 'function') {
            window.__pqTriggerInstallAfterLogin();
          }
        } else {
          // Inválido, inexistente, bloqueado, cancelado, reembolsado, ou
          // vinculado a outro dispositivo (motivo OUTRO_DISPOSITIVO): nunca
          // libera automaticamente. Remove a sessão salva e mostra a tela
          // de bloqueio/login existente, com a mensagem vinda do backend.
          limparAuthLocal();
          var nav = document.getElementById('pq-bottom-nav');
          if (nav) nav.remove();
          ocultarTelaBonus();
          var root = document.getElementById('root');
          if (root) root.style.display = 'none';
          mostrarLogin({ motivo: res.motivo, mensagem: res.mensagem });
        }
      })
      .catch(function () {
        clearTimeout(timeoutRevalidacao);
        revalidando = false;
        // Falha de conexão: por segurança, não libera acesso silenciosamente
        // com base apenas no localStorage. Mantém/mostra a tela de login,
        // cujo próprio botão "Ingresar" já trata erro de rede.
        if (!document.getElementById('pq-email-login')) {
          limparAuthLocal();
          var navErr = document.getElementById('pq-bottom-nav');
          if (navErr) navErr.remove();
          ocultarTelaBonus();
          var rootErr = document.getElementById('root');
          if (rootErr) rootErr.style.display = 'none';
          mostrarLogin();
        }
      });
  }

  // ─── deviceId ─────────────────────────────────────────────────────────────
  function getDeviceId() {
    var key = 'pilates_device_id';
    function gerarId() {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return 'dev_' + window.crypto.randomUUID().replace(/-/g, '');
      }
      return 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    try {
      var id = localStorage.getItem(key);
      if (id && /^dev_[a-zA-Z0-9-]{8,100}$/.test(id)) return id;
      id = gerarId();
      localStorage.setItem(key, id);
      return id;
    } catch(e) {
      if (!window.__pqFallbackDeviceId) window.__pqFallbackDeviceId = gerarId();
      return window.__pqFallbackDeviceId;
    }
  }

  function getEmailFromUrl() {
    try {
      var valor = new URLSearchParams(window.location.search).get('email') || '';
      return valor.trim().slice(0, 254);
    } catch(e) { return ''; }
  }

  function normalizarNome(valor) {
    return String(valor || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().replace(/\s+/g, ' ').slice(0, 100);
  }

  function emailValido(email) {
    return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  // ─── Tela de login por e-mail/nome ───────────────────────────────────────
  function mostrarLogin(bloqueio) {
    var existente = document.getElementById('pq-email-login');
    if (existente) existente.remove();

    var t = getLoginI18n();
    var emailUrl = getEmailFromUrl();
    var overlay = document.createElement('div');
    overlay.id = 'pq-email-login';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(13,7,24,0.97);display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;padding:20px;overflow-y:auto;';

    overlay.innerHTML =
      '<div style="width:100%;max-width:420px;background:linear-gradient(160deg,rgba(42,26,64,0.98),rgba(26,16,37,0.99));border:1px solid rgba(212,175,55,0.35);border-radius:24px;overflow:hidden;box-shadow:0 0 60px rgba(212,175,55,0.15),0 32px 64px rgba(0,0,0,0.6);">'
      + '<div style="height:3px;background:linear-gradient(90deg,transparent,#d4af37,transparent);"></div>'
      + '<div style="padding:30px 28px 34px;display:flex;flex-direction:column;align-items:center;gap:20px;">'
      + '<img src="/logo-pilates-en-casa.png" alt="Pilates en Casa" style="width:88px;height:88px;border-radius:50%;border:2px solid rgba(212,175,55,0.5);object-fit:cover;" onerror="this.style.display=\'none\'">'
      + '<div style="text-align:center;">'
      + '<h1 style="color:#d4af37;font-size:22px;font-weight:700;letter-spacing:2px;margin:0 0 6px;font-family:Cinzel,serif;">PILATES EN CASA</h1>'
      + '<p style="color:#c9a8f0;font-size:13px;letter-spacing:4px;margin:0;font-family:Cinzel,serif;">' + escapeHtml(t.subtitle) + '</p>'
      + '</div>'
      + '<div style="text-align:center;">'
      + '<p style="color:#fff;font-size:17px;font-weight:600;margin:0 0 6px;">' + escapeHtml(t.exclusive) + '</p>'
      + '<p id="pq-login-sub" style="color:#9b7ec8;font-size:13px;margin:0;">' + escapeHtml(t.emailHelp) + '</p>'
      + '</div>'
      + '<div style="width:100%;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'
      + '<label id="pq-login-label" for="pq-email-input" style="color:#d4af37;font-size:14px;font-weight:600;margin:0;">' + escapeHtml(t.emailLabel) + '</label>'
      + '<button id="pq-login-toggle" type="button" style="background:none;border:none;color:#9b7ec8;font-size:12.5px;font-weight:600;text-decoration:underline;cursor:pointer;padding:0;">' + escapeHtml(t.useName) + '</button>'
      + '</div>'
      + '<input id="pq-email-input" type="email" inputmode="email" maxlength="254" placeholder="' + escapeHtml(t.emailPlaceholder) + '" value="' + escapeHtml(emailUrl) + '" autocomplete="email" style="width:100%;box-sizing:border-box;background:#1a1025;border:2px solid #3a2560;border-radius:12px;padding:14px 16px;color:#fff;font-size:16px;outline:none;">'
      + '<p id="pq-email-erro" role="alert" aria-live="polite" style="color:#f87171;font-size:13px;margin:6px 0 0;min-height:18px;display:none;"></p>'
      + '</div>'
      + '<button id="pq-email-btn" type="button" style="width:100%;padding:16px;background:#d4af37;color:#0d1a1f;border:none;border-radius:14px;font-size:18px;font-weight:700;cursor:pointer;font-family:Cinzel,serif;letter-spacing:1px;">' + escapeHtml(t.enter) + '</button>'
      + '</div>'
      + '<div style="height:3px;background:linear-gradient(90deg,transparent,#d4af37,transparent);"></div>'
      + '</div>';

    document.body.appendChild(overlay);

    var input = document.getElementById('pq-email-input');
    var btn = document.getElementById('pq-email-btn');
    var erroEl = document.getElementById('pq-email-erro');
    var toggleBtn = document.getElementById('pq-login-toggle');
    var subEl = document.getElementById('pq-login-sub');
    var labelEl = document.getElementById('pq-login-label');
    var modoNome = false;
    var requisicaoAtual = null;

    function mostrarErro(msg) { erroEl.textContent = msg; erroEl.style.display = 'block'; }
    function esconderErro() { erroEl.textContent = ''; erroEl.style.display = 'none'; }
    function setCarregando(ativo) {
      btn.disabled = ativo;
      btn.textContent = ativo ? t.checking : t.enter;
      btn.style.opacity = ativo ? '0.7' : '1';
      btn.style.cursor = ativo ? 'wait' : 'pointer';
    }

    toggleBtn.addEventListener('click', function() {
      modoNome = !modoNome;
      esconderErro();
      if (modoNome) {
        labelEl.textContent = t.nameLabel;
        subEl.textContent = t.nameHelp;
        toggleBtn.textContent = t.useEmail;
        input.type = 'text';
        input.inputMode = 'text';
        input.maxLength = 100;
        input.placeholder = t.namePlaceholder;
        input.value = '';
        input.autocomplete = 'name';
      } else {
        labelEl.textContent = t.emailLabel;
        subEl.textContent = t.emailHelp;
        toggleBtn.textContent = t.useName;
        input.type = 'email';
        input.inputMode = 'email';
        input.maxLength = 254;
        input.placeholder = t.emailPlaceholder;
        input.value = '';
        input.autocomplete = 'email';
      }
      input.focus();
    });

    function mostrarBloqueado(motivo, mensagemFallback) {
      var mensagem = mensagemAcessoPorMotivo(motivo, mensagemFallback);
      overlay.innerHTML =
        '<div style="width:100%;max-width:420px;background:linear-gradient(160deg,rgba(42,26,64,0.98),rgba(26,16,37,0.99));border:1px solid rgba(212,175,55,0.35);border-radius:24px;overflow:hidden;box-shadow:0 0 60px rgba(212,175,55,0.15),0 32px 64px rgba(0,0,0,0.6);">'
        + '<div style="height:3px;background:linear-gradient(90deg,transparent,#d4af37,transparent);"></div>'
        + '<div style="padding:36px 32px 40px;display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center;">'
        + '<div style="width:56px;height:56px;border-radius:50%;background:rgba(255,138,138,0.12);border:1px solid rgba(255,138,138,0.35);display:flex;align-items:center;justify-content:center;font-size:26px;">🔒</div>'
        + '<h2 style="color:#d4af37;font-family:Cinzel,serif;font-size:20px;font-weight:700;letter-spacing:1px;margin:0;">' + escapeHtml(t.unavailableTitle) + '</h2>'
        + '<p id="pq-blocked-message" style="color:#c9a8f0;font-size:15px;line-height:1.5;margin:0;"></p>'
        + '<button id="pq-blocked-retry" type="button" style="width:100%;padding:14px 18px;border-radius:999px;background:transparent;border:1px solid rgba(212,175,55,0.45);color:#d4af37;font-weight:700;font-family:Cinzel,serif;letter-spacing:1px;font-size:14.5px;cursor:pointer;">' + escapeHtml(t.retry) + '</button>'
        + '<a href="https://wa.me/5519982532156" target="_blank" rel="noopener noreferrer" style="color:#25D366;font-size:14px;font-weight:600;text-decoration:none;">' + escapeHtml(t.whatsapp) + '</a>'
        + '</div>'
        + '<div style="height:3px;background:linear-gradient(90deg,transparent,#d4af37,transparent);"></div>'
        + '</div>';
      document.getElementById('pq-blocked-message').textContent = mensagem;
      document.getElementById('pq-blocked-retry').addEventListener('click', function () {
        overlay.remove();
        mostrarLogin();
      });
    }

    if (bloqueio) {
      if (typeof bloqueio === 'object') mostrarBloqueado(bloqueio.motivo, bloqueio.mensagem);
      else mostrarBloqueado('', bloqueio);
      return;
    }

    function tentarIngresar(transferir) {
      var valor = input.value;
      var email = modoNome ? '' : String(valor || '').trim().toLowerCase().slice(0, 254);
      var nome = modoNome ? normalizarNome(valor) : '';

      if (modoNome) {
        if (nome.length < 2) { mostrarErro(t.invalidName); return; }
      } else if (!emailValido(email)) {
        mostrarErro(t.invalidEmail);
        return;
      }

      if (requisicaoAtual) requisicaoAtual.abort();
      requisicaoAtual = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timeoutId = setTimeout(function () { if (requisicaoAtual) requisicaoAtual.abort(); }, 15000);
      setCarregando(true);
      esconderErro();

      fetch('/api/verificar-acesso', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email, nome: nome, deviceId: getDeviceId(), transferirDispositivo: !!transferir }),
        signal: requisicaoAtual ? requisicaoAtual.signal : undefined
      })
      .then(function(r) {
        if (!r.ok && r.status >= 500) throw new Error('server');
        return r.json();
      })
      .then(function(res) {
        clearTimeout(timeoutId);
        if (res.acesso) {
          window.__pq_auth_ok = true;
          var emailConfirmado = res.email || email || '';
          try {
            origSetItem(AUTH_KEY, JSON.stringify({ loggedIn: true, nome: res.nome || nome || '', email: emailConfirmado }));
          } catch(e) {}
          auth = { loggedIn: true, nome: res.nome || nome || '', email: emailConfirmado };
          overlay.remove();
          var rootLiberado = document.getElementById('root');
          if (rootLiberado) rootLiberado.style.display = '';
          try { window.dispatchEvent(new CustomEvent('pilates:auth', { detail: { nome: auth.nome, email: auth.email } })); } catch (e) {}
          injetarNavBar();
          if (typeof window.__pqTriggerInstallAfterLogin === 'function') window.__pqTriggerInstallAfterLogin();
        } else if (res.motivo === 'OUTRO_DISPOSITIVO') {
          setCarregando(false);
          mostrarConfirmacao(mensagemAcessoPorMotivo('OUTRO_DISPOSITIVO', res.mensagem), function() { tentarIngresar(true); }, function() {});
        } else {
          mostrarBloqueado(res.motivo, res.mensagem);
        }
      })
      .catch(function() {
        clearTimeout(timeoutId);
        mostrarErro(t.connectionError);
        setCarregando(false);
      });
    }

    btn.addEventListener('click', function() { tentarIngresar(false); });
    input.addEventListener('keydown', function(e) { if (e.key === 'Enter') tentarIngresar(false); });
  }

  // ─── Revalidar acesso ao abrir o app ───────────────────────────────────
  // Nunca decide com base apenas no localStorage: a cada carregamento da
  // página, é feita uma checagem real no backend (revalidarAcessoNoBackend).
  // Enquanto isso, se já havia sessão salva, a barra inferior é mantida/
  // recriada de forma otimista (evita "piscar" a tela de login à toa numa
  // rede rápida); caso o backend não confirme o acesso, tudo é desfeito e
  // a tela de bloqueio/login é exibida — ver revalidarAcessoNoBackend().
  function iniciarRevalidacao() {
    if (MODO_TESTE) {
      // Modo demonstração: nunca mostra login nem consulta o backend.
      // Libera a nav bar (Clases/Bonos) direto; o React já cuida sozinho
      // do bloqueio de aulas/bônus e da oferta no modo DEMO nativo.
      window.__pq_auth_ok = true;
      injetarNavBar();
      return;
    }
    revalidarAcessoNoBackend();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarRevalidacao);
  } else {
    iniciarRevalidacao();
  }

  // Revalida novamente sempre que o usuário volta ao app: troca de aba,
  // troca de app no celular e retorna, ou reabre o PWA instalado.
  document.addEventListener('visibilitychange', function () {
    if (!MODO_TESTE && !document.hidden) revalidarAcessoNoBackend();
  });

  // Cobre o caso de navegação por cache do navegador (bfcache), em que o
  // evento 'load'/'DOMContentLoaded' não dispara de novo, mas a página
  // volta a ficar visível para o usuário (ex.: botão "voltar").
  window.addEventListener('pageshow', function (e) {
    if (!MODO_TESTE && e.persisted) revalidarAcessoNoBackend();
  });

  // ─── Sistema de abas: Clases / Bonos ─────────────────────────────────────
  var BONUS_PDFS = [
    { key: 'detox', titulo: 'Jugos detox saludables.pdf', id: '1p7fOIGVTfImSOuuZ6RQ9RTYNX2mtG35V' },
    { key: 'vitaminas', titulo: 'Vitaminas poderosas.pdf', id: '1NqdZUgen8c9sAeeqBGpuWVpyfdHm7oyR' },
    { key: 'mounjaro', titulo: 'Té casero Mounjaro Natural.pdf', id: '1ouMQO8Zbo57qjLCuQec10I749pTAc_wT' },
    { key: 'alimentaria', titulo: 'Guía alimentaria.pdf', id: '1HE1Ku2DvutwffGTCQ0SQid3l2rWExQu8' },
    { key: 'diabeticos', titulo: 'Guía alimentaria para diabéticos.pdf', id: '1wH72qqDPZWeJFXoAhq0m1RW7Xu2ElIo7' },
    { key: 'ansiedad', titulo: 'Guía adiós a la ansiedad.pdf', id: '1sY-3bLKVfozlSdv_1th1qeoMc8tRfoCo' },
    { key: 'postres', titulo: 'Dulces y postres sin azúcar.pdf', id: '1fODdS57zqgk3fsuG8UbWc14I84o9Okvh' },
    { key: 'airfryer', titulo: '55 recetas sin gluten para Airfryer.pdf', id: '1McVSUU0grhMBP8NKSYXcO1C2U2HavOXa' }
  ];

  function getViewUrl(id) {
    return 'https://drive.google.com/file/d/' + id + '/preview';
  }
  function getThumbUrl(id) {
    // A capa é buscada pelo próprio domínio do app. Isso evita bloqueios de
    // hotlink do Google Drive em celulares e permite cache pela CDN.
    return '/api/pdf-thumbnail?id=' + encodeURIComponent(id);
  }

  window.__pqPdfThumbFallback = function(img, id) {
    if (!img) return;
    var etapa = Number(img.getAttribute('data-pq-fallback') || '0');
    var key = String(img.getAttribute('data-pq-pdf-key') || '').replace(/[^a-z0-9_-]/gi, '');

    if (etapa === 0) {
      img.setAttribute('data-pq-fallback', '1');
      img.src = 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w1200';
      return;
    }
    if (etapa === 1) {
      img.setAttribute('data-pq-fallback', '2');
      img.src = 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w1200';
      return;
    }

    // Última garantia: nunca deixa o card vazio ou com logotipo genérico.
    img.setAttribute('data-pq-fallback', '3');
    img.onerror = null;
    img.src = '/pdf-covers/' + (key || 'detox') + '.svg';
    img.style.objectFit = 'cover';
    img.style.padding = '0';
    img.style.boxSizing = 'border-box';
    img.style.background = '#1a1035';
  };

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

    // Sem estado ativo fixo no HTML: o estado real (Clases ou Bonos) é sempre
    // aplicado logo depois via atualizarAbas(), para nunca ficar dessincronizado
    // com a tela que está de fato visível.
    nav.innerHTML =
      '<button id="pq-tab-aulas" onclick="window.__pqMudarAba(\'aulas\')" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:10px 0 8px;background:none;border:none;cursor:pointer;color:#9b7ec8;border-top:2px solid transparent;">'
      + '<span style="font-size:20px">🧘‍♀️</span>'
      + '<span id="pq-tab-aulas-label" style="font-size:11px;font-weight:700;letter-spacing:0.5px;">' + getBonusI18n().clasesLabel + '</span>'
      + '</button>'
      + '<button id="pq-tab-bonus" onclick="window.__pqMudarAba(\'bonus\')" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:10px 0 8px;background:none;border:none;cursor:pointer;color:#9b7ec8;border-top:2px solid transparent;">'
      + '<span style="font-size:20px">🎁</span>'
      + '<span id="pq-tab-bonus-label" style="font-size:11px;font-weight:700;letter-spacing:0.5px;">' + getBonusI18n().tabLabel + '</span>'
      + '</button>';

    document.body.appendChild(nav);

    // Ajustar padding inferior do app para não sobrepor a nav
    var root = document.getElementById('root');
    if (root) root.style.paddingBottom = '64px';

    // Aplica o estado real da aba (evita a barra "nascer" sempre em Clases
    // mesmo quando o usuário estava em Bonos no momento da recriação).
    atualizarAbas();

    // Se a barra precisou ser recriada enquanto a tela de bônus estava aberta
    // e essa tela também sumiu junto, restaura ela também.
    if (abaAtiva === 'bonus' && !document.getElementById('pq-bonus-screen')) {
      mostrarTelaBonus();
    }
  }

  function atualizarAbas() {
    var btnClases = document.getElementById('pq-tab-aulas');
    var btnBonus = document.getElementById('pq-tab-bonus');
    if (!btnClases || !btnBonus) return;
    if (abaAtiva === 'aulas') {
      btnClases.style.color = '#d4af37';
      btnClases.style.borderTop = '2px solid #d4af37';
      btnBonus.style.color = '#9b7ec8';
      btnBonus.style.borderTop = '2px solid transparent';
    } else {
      btnBonus.style.color = '#d4af37';
      btnBonus.style.borderTop = '2px solid #d4af37';
      btnClases.style.color = '#9b7ec8';
      btnClases.style.borderTop = '2px solid transparent';
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

    var cardsHtml = BONUS_PDFS.map(function(pdf, idx) {
      var thumb = getThumbUrl(pdf.id);
      var viewUrl = getViewUrl(pdf.id);
      var tituloTraduzido = traduzirTituloPdf(pdf);
      // No modo demonstração, apenas os 2 primeiros bônus ficam liberados;
      // os demais mostram a capa desfocada com cadeado e, ao serem tocados,
      // levam à mesma oferta nativa do app (bloco #comprovante-block),
      // sem abrir o PDF.
      var bloqueado = MODO_TESTE && idx >= 2;
      var onClickAttr = bloqueado
        ? 'onclick="window.__pqMudarAba&&window.__pqMudarAba(\'aulas\');var el=document.getElementById(\'comprovante-block\');if(el){setTimeout(function(){el.scrollIntoView({behavior:\'smooth\'});},80);}"'
        : ('onclick="window.__pqAbrirPdf(\'' + pdf.id + '\',\'' + tituloTraduzido.replace(/'/g, "\\'") + '\')"');
      return '<div ' + onClickAttr + ' style="cursor:pointer;background:#1a1035;border-radius:12px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);transition:transform 0.15s;active:scale-95;position:relative;" onmousedown="this.style.transform=\'scale(0.97)\'" onmouseup="this.style.transform=\'scale(1)\'" ontouchstart="this.style.transform=\'scale(0.97)\'" ontouchend="this.style.transform=\'scale(1)\'">'
        + '<div style="width:100%;aspect-ratio:3/4;overflow:hidden;background:#2a1a40;position:relative;' + (bloqueado ? 'filter:blur(4px);' : '') + '">'
        + '<img src="' + thumb + '" alt="' + tituloTraduzido + '" data-pq-pdf-id="' + pdf.id + '" data-pq-pdf-key="' + pdf.key + '" data-pq-fallback="0" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;" onerror="window.__pqPdfThumbFallback(this,\'' + pdf.id + '\')">'
        + '<div style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;background:linear-gradient(135deg,#2a1a40,#1a1035);flex-direction:column;gap:8px;">'
        + '<span style="font-size:40px">📄</span>'
        + '</div>'
        + '</div>'
        + (bloqueado
          ? '<div style="position:absolute;top:0;left:0;right:0;aspect-ratio:3/4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;pointer-events:none;">'
            + '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'
            + '</div>'
          : '')
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

  function atualizarInterfaceAuxiliarPorIdioma() {
    var t = getBonusI18n();
    var aulasLabel = document.getElementById('pq-tab-aulas-label');
    var bonusLabel = document.getElementById('pq-tab-bonus-label');
    if (aulasLabel) aulasLabel.textContent = t.clasesLabel;
    if (bonusLabel) bonusLabel.textContent = t.tabLabel;
    if (abaAtiva === 'bonus' && document.getElementById('pq-bonus-screen')) mostrarTelaBonus();
    document.querySelectorAll('#pq-cert-lock p').forEach(function (el) { el.textContent = textoIdioma('Bloqueado'); });
  }

  window.addEventListener('pilates:lang', atualizarInterfaceAuxiliarPorIdioma);
  window.addEventListener('storage', function (e) {
    if (e.key === LANG_KEY) atualizarInterfaceAuxiliarPorIdioma();
  });

  // Injetar nav bar após login
  function iniciarNavBar() {
    // NÃO injeta a nav bar aqui com base no localStorage: quem decide se o
    // acesso é válido é sempre revalidarAcessoNoBackend() (chamada acima,
    // no carregamento da página). Esta função apenas arma, uma única vez,
    // os observadores que MANTÊM a nav bar visível depois que o acesso já
    // foi confirmado pelo backend e injetarNavBar() foi chamada por ele.
    // Observador permanente: garante que a nav bar volte a aparecer caso seja
    // removida por engano (ex: re-renderizações) e injeta assim que o login
    // (overlay de e-mail) for concluído.
    // subtree:true para pegar remoções em qualquer nível, não só filhos diretos do body.
    function garantirNavBar() {
      // window.__pq_auth_ok só fica true depois que o backend confirmou o
      // acesso (login manual OU revalidação automática) nesta mesma sessão
      // de página — nunca é lido do localStorage diretamente aqui.
      var logado = window.__pq_auth_ok === true;
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
        + '<p style="color:#d4af37;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0;text-shadow:0 1px 4px rgba(0,0,0,0.6);">' + escapeHtml(textoIdioma('Bloqueado')) + '</p>';
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
