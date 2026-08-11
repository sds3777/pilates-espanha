(function () {
  'use strict';

  var deferredPrompt = null;
  var installBtn = document.getElementById('pq-install-btn');
  var installHelp = document.getElementById('pq-ios-install-modal');
  var installHelpClose = document.getElementById('pq-ios-modal-close');
  var installPopup = document.getElementById('pq-install-popup');
  var installAccept = document.getElementById('pq-install-popup-aceitar');
  var installDecline = document.getElementById('pq-install-popup-recusar');
  var languagePopup = document.getElementById('pq-language-popup');
  var languageConfirm = document.getElementById('pq-language-confirm');

  if (!installBtn || !installHelp || !installHelpClose || !installPopup ||
      !installAccept || !installDecline || !languagePopup || !languageConfirm) return;

  var MODO_TESTE = window.location.pathname.replace(/\/+$/, '') === '/teste';
  var LANGUAGE_DONE_KEY = 'pq_language_selected';
  var SESSION_DISMISS_KEY = 'pq_install_popup_dismissed';
  var installed = false;
  var pendingAutoPopup = false;
  var autoPopupTimer = null;
  var selectedLanguage = null;

  var INSTALL_I18N = {
    'es-ES': { button: '⬇ Instalar aplicación', title: 'Instalar Pilates en Casa', text: 'Añade la aplicación a la pantalla de inicio para acceder a tus clases con un toque.', accept: 'Instalar aplicación', decline: 'Ahora no', langTitle: 'Selecciona tu idioma', langText: 'Elige la variante de español que quieres usar. La elección quedará guardada.', confirm: 'Aceptar', understood: 'Entendido' },
    'es-AR': { button: '⬇ Instalá la aplicación', title: 'Instalá Pilates en Casa', text: 'Agregá la aplicación a tu pantalla de inicio para entrar a tus clases con un toque.', accept: 'Instalar ahora', decline: 'Ahora no', langTitle: 'Elegí tu idioma', langText: 'Elegí la variante de español que querés usar. Tu elección va a quedar guardada.', confirm: 'Aceptar', understood: 'Entendido' },
    'es-MX': { button: '⬇ Instalar app', title: 'Instalar Pilates en Casa', text: 'Agrega la app a tu pantalla de inicio para entrar a tus clases con un toque.', accept: 'Instalar app', decline: 'En otro momento', langTitle: 'Selecciona tu idioma', langText: 'Elige la variante de español que deseas usar. La elección quedará guardada.', confirm: 'Aceptar', understood: 'Entendido' },
    'es-CO': { button: '⬇ Instalar la aplicación', title: 'Instalar Pilates en Casa', text: 'Agrega la aplicación a la pantalla de inicio para entrar a tus clases fácilmente.', accept: 'Instalar la aplicación', decline: 'Ahora no', langTitle: 'Selecciona tu idioma', langText: 'Elige la variante de español que deseas usar. Tu elección quedará guardada.', confirm: 'Aceptar', understood: 'Entendido' },
    'es-PE': { button: '⬇ Instalar aplicación', title: 'Instalar Pilates en Casa', text: 'Agrega la aplicación a tu pantalla de inicio para acceder rápidamente a tus clases.', accept: 'Instalar aplicación', decline: 'Más tarde', langTitle: 'Selecciona tu idioma', langText: 'Elige la variante de español que deseas usar. La selección quedará guardada.', confirm: 'Aceptar', understood: 'Entendido' },
    'es-CL': { button: '⬇ Instalar la app', title: 'Instala Pilates en Casa', text: 'Agrega la app a tu pantalla de inicio para entrar a tus clases de forma rápida.', accept: 'Instalar la app', decline: 'Por ahora no', langTitle: 'Elige tu idioma', langText: 'Elige la variante de español que quieres usar. La selección quedará guardada.', confirm: 'Aceptar', understood: 'Entendido' }
  };

  function getCurrentLang() {
    try {
      var lang = localStorage.getItem('pilates_lang');
      if (INSTALL_I18N[lang]) return lang;
    } catch (error) {}
    return 'es-CO';
  }

  function currentTexts() {
    return INSTALL_I18N[getCurrentLang()] || INSTALL_I18N['es-CO'];
  }

  function aplicarIdiomaInstalacao() {
    var text = currentTexts();
    installBtn.textContent = text.button;
    var popupTitle = installPopup.querySelector('h2');
    var popupText = installPopup.querySelector('p');
    if (popupTitle) popupTitle.textContent = text.title;
    if (popupText) popupText.textContent = text.text;
    installAccept.textContent = text.accept;
    installDecline.textContent = text.decline;
    installHelpClose.textContent = text.understood;
    var languageTitle = document.getElementById('pq-language-title');
    var languageText = languagePopup.querySelector('p');
    if (languageTitle) languageTitle.textContent = text.langTitle;
    if (languageText) languageText.textContent = text.langText;
    languageConfirm.textContent = text.confirm;
  }

  function idiomaJaSelecionado() {
    try { return localStorage.getItem(LANGUAGE_DONE_KEY) === '1'; } catch (error) { return false; }
  }

  function mostrarPopupIdioma() {
    if (MODO_TESTE || idiomaJaSelecionado()) return;
    window.setTimeout(function () {
      if (!installPopup.classList.contains('pq-visible') && !installHelp.classList.contains('pq-visible')) {
        languagePopup.classList.add('pq-visible');
      }
    }, 250);
  }

  Array.prototype.forEach.call(document.querySelectorAll('.pq-lang-option'), function (button) {
    button.addEventListener('click', function () {
      selectedLanguage = button.getAttribute('data-lang');
      Array.prototype.forEach.call(document.querySelectorAll('.pq-lang-option'), function (item) {
        item.classList.toggle('pq-selected', item === button);
      });
      languageConfirm.disabled = false;
    });
  });

  languageConfirm.addEventListener('click', function () {
    if (!selectedLanguage || !INSTALL_I18N[selectedLanguage]) return;
    try {
      localStorage.setItem('pilates_lang', selectedLanguage);
      localStorage.setItem(LANGUAGE_DONE_KEY, '1');
    } catch (error) {}
    try { window.dispatchEvent(new CustomEvent('pilates:lang', { detail: selectedLanguage })); } catch (error) {}
    languagePopup.classList.remove('pq-visible');
    aplicarIdiomaInstalacao();
  });

  function isStandalone() {
    var standaloneMedia = false;
    try { standaloneMedia = window.matchMedia('(display-mode: standalone)').matches; } catch (error) {}
    return standaloneMedia || window.navigator.standalone === true;
  }

  function isAppInstalled() {
    return installed || isStandalone();
  }

  function isIOS() {
    var ua = window.navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) ||
      (ua.indexOf('Macintosh') !== -1 && 'ontouchend' in document);
  }

  function isAndroid() {
    return /Android/i.test(window.navigator.userAgent || '');
  }

  function isIOSSafari() {
    if (!isIOS()) return false;
    var ua = window.navigator.userAgent || '';
    return /Version\/\d+(?:\.\d+)*.*Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  }

  function isInAppBrowser() {
    var ua = window.navigator.userAgent || '';
    return /WhatsApp|Instagram|FBAN|FBAV|FB_IAB|Messenger|Line\//i.test(ua) ||
      /;\s*wv\)/i.test(ua) ||
      (/Android/i.test(ua) && /Version\/\d+(?:\.\d+)*\s+Chrome\//i.test(ua));
  }

  function hideInstallBtn() {
    installBtn.classList.remove('pq-visible');
  }

  function showInstallBtn() {
    if (isAppInstalled()) {
      hideInstallBtn();
      return;
    }
    installBtn.classList.add('pq-visible');
  }

  function irParaOfertaDemo() {
    installPopup.classList.remove('pq-visible');
    installHelp.classList.remove('pq-visible');
    if (typeof window.__pqMudarAba === 'function') window.__pqMudarAba('aulas');
    window.setTimeout(function () {
      var oferta = document.getElementById('comprovante-block');
      if (oferta) oferta.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  }

  function setInstallHelpContent(title, subtitle, steps) {
    var titleElement = installHelp.querySelector('h2');
    var subtitleElement = installHelp.querySelector('.pq-ios-sub');
    var stepsElement = installHelp.querySelector('.pq-ios-steps');
    if (titleElement) titleElement.textContent = title;
    if (subtitleElement) subtitleElement.textContent = subtitle;
    if (stepsElement) {
      stepsElement.innerHTML = steps.map(function (step, index) {
        return '<div class="pq-ios-step">' +
          '<span class="pq-ios-step-num">' + (index + 1) + '</span>' +
          '<span class="pq-ios-step-icon">' + step.icon + '</span>' +
          '<span class="pq-ios-step-text">' + step.text + '</span>' +
        '</div>';
      }).join('');
    }
  }

  function showInstallHelp() {
    if (isAppInstalled()) return;
    if (isIOS()) {
      if (isInAppBrowser() || !isIOSSafari()) {
        setInstallHelpContent(
          'Abre en Safari para instalar',
          'El navegador actual no puede instalar la aplicación directamente.',
          [
            { icon: '•••', text: 'Abre el menú y selecciona <b>“Abrir en Safari”</b>. Si no aparece, copia la dirección y pégala en Safari.' },
            { icon: '⬆️', text: 'En Safari, toca el botón <b>Compartir</b> (□↑).' },
            { icon: '➕', text: 'Selecciona <b>“Agregar a pantalla de inicio”</b>.' }
          ]
        );
      } else {
        setInstallHelpContent(
          currentTexts().title,
          'En iPhone y iPad, la instalación se realiza desde el menú de compartir.',
          [
            { icon: '⬆️', text: 'Toca el botón <b>Compartir</b> (□↑) del navegador.' },
            { icon: '➕', text: 'Selecciona <b>“Agregar a pantalla de inicio”</b>.' },
            { icon: '🧭', text: 'Si la opción no aparece, abre esta página en <b>Safari</b> e inténtalo nuevamente.' }
          ]
        );
      }
    } else if (isAndroid() && isInAppBrowser()) {
      setInstallHelpContent(
        'Abre en Chrome para instalar',
        'El navegador interno de WhatsApp o Instagram no permite instalar la aplicación.',
        [
          { icon: '⋮', text: 'Toca el menú <b>⋮</b> de esta página.' },
          { icon: '🌐', text: 'Selecciona <b>“Abrir en Chrome”</b> o <b>“Abrir en el navegador”</b>.' },
          { icon: '⬇️', text: 'En Chrome, toca nuevamente <b>“Instalar app”</b>.' }
        ]
      );
    } else if (isAndroid()) {
      setInstallHelpContent(
        currentTexts().title,
        'El instalador automático todavía no está disponible en este navegador.',
        [
          { icon: '⋮', text: 'Abre el menú <b>⋮</b> de Chrome.' },
          { icon: '⬇️', text: 'Selecciona <b>“Instalar app”</b> o <b>“Agregar a pantalla de inicio”</b>.' }
        ]
      );
    } else {
      setInstallHelpContent(
        currentTexts().title,
        'Este navegador no abrió el instalador automático.',
        [
          { icon: '🌐', text: 'Abre esta página en <b>Chrome, Edge o Safari</b>.' },
          { icon: '⬇️', text: 'Usa la opción <b>“Instalar app”</b> o <b>“Agregar a pantalla de inicio”</b> del menú.' }
        ]
      );
    }
    installHelp.classList.add('pq-visible');
  }

  function hideInstallHelp() {
    installHelp.classList.remove('pq-visible');
    mostrarPopupIdioma();
  }

  installHelpClose.addEventListener('click', hideInstallHelp);
  installHelp.addEventListener('click', function (event) {
    if (event.target === installHelp) hideInstallHelp();
  });

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    if (MODO_TESTE) {
      showInstallBtn();
      return;
    }
    if (isAppInstalled()) return;
    deferredPrompt = event;
    showInstallBtn();
    if (pendingAutoPopup) {
      pendingAutoPopup = false;
      window.clearTimeout(autoPopupTimer);
      mostrarPopupInstalacao();
    }
  });

  window.addEventListener('appinstalled', function () {
    installed = true;
    deferredPrompt = null;
    pendingAutoPopup = false;
    window.clearTimeout(autoPopupTimer);
    hideInstallBtn();
    installHelp.classList.remove('pq-visible');
    esconderPopupInstalacao();
    mostrarPopupIdioma();
  });

  function triggerInstallPrompt(callback) {
    if (MODO_TESTE) {
      irParaOfertaDemo();
      return;
    }
    if (isAppInstalled()) {
      hideInstallBtn();
      if (callback) callback('installed');
      return;
    }
    if (!deferredPrompt) {
      showInstallHelp();
      if (callback) callback('manual');
      return;
    }

    var promptEvent = deferredPrompt;
    deferredPrompt = null;
    try {
      promptEvent.prompt();
      Promise.resolve(promptEvent.userChoice).then(function (choice) {
        var outcome = choice && choice.outcome ? choice.outcome : 'dismissed';
        if (outcome !== 'accepted') showInstallBtn();
        if (callback) callback(outcome);
      }).catch(function () {
        showInstallBtn();
        if (callback) callback('dismissed');
      });
    } catch (error) {
      showInstallHelp();
      if (callback) callback('manual');
    }
  }

  installBtn.addEventListener('click', function () {
    triggerInstallPrompt(function (outcome) {
      if (outcome !== 'accepted' && outcome !== 'installed') showInstallBtn();
      if (outcome !== 'manual') mostrarPopupIdioma();
    });
  });

  function foiRecusadoNestaSessao() {
    try { return sessionStorage.getItem(SESSION_DISMISS_KEY) === '1'; } catch (error) { return false; }
  }

  function marcarRecusadoNestaSessao() {
    try { sessionStorage.setItem(SESSION_DISMISS_KEY, '1'); } catch (error) {}
  }

  function esconderPopupInstalacao() {
    installPopup.classList.remove('pq-visible');
  }

  function mostrarPopupInstalacao() {
    if (MODO_TESTE || isAppInstalled() || foiRecusadoNestaSessao() ||
        installHelp.classList.contains('pq-visible') || languagePopup.classList.contains('pq-visible')) return;
    installPopup.classList.add('pq-visible');
  }

  installAccept.addEventListener('click', function () {
    esconderPopupInstalacao();
    triggerInstallPrompt(function (outcome) {
      if (outcome !== 'accepted' && outcome !== 'installed') showInstallBtn();
      if (outcome !== 'manual') mostrarPopupIdioma();
    });
  });

  installDecline.addEventListener('click', function () {
    esconderPopupInstalacao();
    marcarRecusadoNestaSessao();
    mostrarPopupIdioma();
  });

  installPopup.addEventListener('click', function (event) {
    if (event.target !== installPopup) return;
    esconderPopupInstalacao();
    marcarRecusadoNestaSessao();
    mostrarPopupIdioma();
  });

  window.__pqTriggerInstallAfterLogin = function () {
    aplicarIdiomaInstalacao();
    if (MODO_TESTE) return;
    if (isAppInstalled() || foiRecusadoNestaSessao()) {
      mostrarPopupIdioma();
      return;
    }
    if (isIOS() || isInAppBrowser() || deferredPrompt) {
      mostrarPopupInstalacao();
      return;
    }
    pendingAutoPopup = true;
    window.clearTimeout(autoPopupTimer);
    autoPopupTimer = window.setTimeout(function () {
      if (!pendingAutoPopup) return;
      pendingAutoPopup = false;
      mostrarPopupInstalacao();
    }, 1800);
  };

  window.addEventListener('pilates:lang', aplicarIdiomaInstalacao);
  window.addEventListener('storage', function (event) {
    if (event.key === 'pilates_lang') aplicarIdiomaInstalacao();
  });

  aplicarIdiomaInstalacao();
  if (!isAppInstalled()) showInstallBtn();
})();
