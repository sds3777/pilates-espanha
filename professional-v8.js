(function () {
  'use strict';

  var PROFILE_KEY = 'pilates_profile_v1';
  var PROGRESS_KEY = 'pilatesProgress';
  var ACHIEVEMENTS_KEY = 'pilatesAchievements';
  var STREAK_KEY = 'pilatesStreak';
  var IS_DEMO = window.location.pathname.replace(/\/+$/, '') === '/teste';
  var TOTAL_CLASSES = 89;
  var AVATAR_COUNT = 20;
  var scheduled = false;
  var lastFocusedElement = null;

  var ACHIEVEMENT_DETAILS = {
    first_lesson: {
      title: 'Primeros Pasos',
      icon: '🌸',
      requirement: 'Completa tu primera clase.',
      kind: 'classes',
      target: 1
    },
    lesson_5: {
      title: 'Creando el Hábito',
      icon: '🌱',
      requirement: 'Completa 5 clases.',
      kind: 'classes',
      target: 5
    },
    lesson_10: {
      title: 'En Movimiento',
      icon: '🚶‍♀️',
      requirement: 'Completa 10 clases.',
      kind: 'classes',
      target: 10
    },
    lesson_25: {
      title: 'Más Fuerte Cada Día',
      icon: '💪',
      requirement: 'Completa 20 clases.',
      kind: 'classes',
      target: 20
    },
    progress_25: {
      title: 'Evolucionando',
      icon: '✨',
      requirement: 'Completa el 25 % del programa.',
      kind: 'classes',
      target: 23
    },
    lesson_50: {
      title: 'Compromiso Contigo',
      icon: '💜',
      requirement: 'Completa 40 clases.',
      kind: 'classes',
      target: 40
    },
    progress_50: {
      title: 'Mitad del Camino',
      icon: '💜',
      requirement: 'Completa el 50 % del programa.',
      kind: 'classes',
      target: 45
    },
    lesson_75: {
      title: 'Ejemplo de Constancia',
      icon: '⭐',
      requirement: 'Completa 60 clases.',
      kind: 'classes',
      target: 60
    },
    progress_75: {
      title: 'Casi Lo Logras',
      icon: '🌟',
      requirement: 'Completa el 75 % del programa.',
      kind: 'classes',
      target: 67
    },
    first_module: {
      title: 'Primer Módulo Completado',
      icon: '🏅',
      requirement: 'Completa las 9 clases del primer módulo.',
      kind: 'module',
      module: 1,
      target: 9
    },
    wall_module: {
      title: 'Especialista en Pared',
      icon: '🧱',
      requirement: 'Completa las 4 clases del módulo Pilates en la Pared.',
      kind: 'module',
      module: 3,
      target: 4
    },
    complete_pilates: {
      title: 'Nivel Intermedio y Avanzado',
      icon: '👑',
      requirement: 'Completa las 21 clases del módulo Pilates Intermedio y Avanzado.',
      kind: 'module',
      module: 6,
      target: 21
    },
    seven_days: {
      title: 'Una Semana de Constancia',
      icon: '📅',
      requirement: 'Practica durante 7 días consecutivos.',
      kind: 'streak',
      target: 7
    },
    thirty_days: {
      title: 'Nueva Rutina',
      icon: '🏆',
      requirement: 'Practica durante 30 días consecutivos.',
      kind: 'streak',
      target: 30
    },
    full_program: {
      title: 'Reina del Pilates',
      icon: '👑',
      requirement: 'Completa las 89 clases del programa.',
      kind: 'classes',
      target: 89
    }
  };

  function safeJson(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function normalizeName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function firstName(value) {
    return normalizeName(value).split(' ')[0] || '';
  }

  function normalizeAvatar(value) {
    return /^avatar-(0[1-9]|1[0-9]|20)$/.test(String(value || '')) ? String(value) : null;
  }

  function readRawProfile() {
    var profile = safeJson(PROFILE_KEY, null);
    return profile && typeof profile === 'object' ? profile : null;
  }

  function readProfile() {
    var profile = readRawProfile();
    if (!profile) return null;
    var name = normalizeName(profile.nombre);
    var age = Number(profile.edad);
    var weight = Number(profile.peso);
    if (name.length < 2 || !Number.isFinite(age) || age < 18 || age > 110 ||
        !Number.isFinite(weight) || weight < 20 || weight > 300) {
      return null;
    }
    return {
      nombre: name,
      edad: Math.round(age),
      peso: Math.round(weight * 10) / 10,
      avatar: normalizeAvatar(profile.avatar),
      creadoEn: profile.creadoEn || null,
      actualizadoEn: profile.actualizadoEn || null,
      version: 2
    };
  }

  function avatarPath(avatar) {
    return avatar ? '/avatars/' + avatar + '.webp' : '';
  }

  function avatarButtons(selectedAvatar) {
    var html = '';
    for (var index = 1; index <= AVATAR_COUNT; index += 1) {
      var id = 'avatar-' + String(index).padStart(2, '0');
      html += '<button type="button" class="pq-avatar-option' +
        (selectedAvatar === id ? ' is-selected' : '') +
        '" data-avatar="' + id + '" aria-label="Avatar ' + index +
        '" aria-pressed="' + (selectedAvatar === id ? 'true' : 'false') + '">' +
        '<img src="' + avatarPath(id) + '" alt="" loading="lazy" decoding="async">' +
        '<span class="pq-avatar-check" aria-hidden="true">✓</span>' +
        '</button>';
    }
    return html;
  }

  function setSelectedAvatar(container, avatar) {
    container.querySelectorAll('.pq-avatar-option').forEach(function (button) {
      var selected = button.getAttribute('data-avatar') === avatar;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    var initialButton = container.querySelector('[data-avatar=""]');
    if (initialButton) {
      var usesInitial = !avatar;
      initialButton.classList.toggle('is-selected', usesInitial);
      initialButton.setAttribute('aria-pressed', usesInitial ? 'true' : 'false');
    }
  }

  function bindAvatarPicker(container, onChange) {
    container.addEventListener('click', function (event) {
      var button = event.target.closest('.pq-avatar-option');
      if (!button || !container.contains(button)) return;
      var avatar = normalizeAvatar(button.getAttribute('data-avatar'));
      setSelectedAvatar(container, avatar);
      onChange(avatar);
    });
  }

  function removeOnboarding() {
    var onboarding = document.getElementById('pq-profile-onboarding');
    if (onboarding) onboarding.remove();
    document.documentElement.classList.remove('pq-modal-open');
    document.body.classList.remove('pq-modal-open');
  }

  function showOnboarding() {
    if (IS_DEMO || readProfile() || document.getElementById('pq-profile-onboarding')) return;

    var raw = readRawProfile() || {};
    var selectedAvatar = normalizeAvatar(raw.avatar);
    var overlay = document.createElement('div');
    overlay.id = 'pq-profile-onboarding';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'pq-onboarding-title');
    overlay.innerHTML =
      '<div class="pq-onboarding-card">' +
        '<div class="pq-onboarding-brand">' +
          '<img src="/logo-pilates-en-casa.webp" alt="Pilates en Casa">' +
          '<div><strong>PILATES EN CASA</strong><span>con Daniela</span></div>' +
        '</div>' +
        '<form id="pq-onboarding-form" novalidate>' +
          '<h1 id="pq-onboarding-title">¡Vamos a conocerte!</h1>' +
          '<p class="pq-onboarding-intro">Completa estos datos una sola vez para personalizar tu experiencia.</p>' +
          '<div class="pq-profile-fields">' +
            '<div class="pq-profile-field pq-profile-field-name">' +
              '<label for="pq-profile-name">Nombre</label>' +
              '<input id="pq-profile-name" name="nombre" type="text" maxlength="60" autocomplete="name" placeholder="Escribe tu nombre" required>' +
            '</div>' +
            '<div class="pq-profile-field">' +
              '<label for="pq-profile-age">Edad</label>' +
              '<input id="pq-profile-age" name="edad" type="number" inputmode="numeric" min="18" max="110" step="1" placeholder="Ej.: 55" required>' +
            '</div>' +
            '<div class="pq-profile-field">' +
              '<label for="pq-profile-weight">Peso (kg)</label>' +
              '<input id="pq-profile-weight" name="peso" type="number" inputmode="decimal" min="20" max="300" step="0.1" placeholder="Ej.: 68" required>' +
            '</div>' +
          '</div>' +
          '<fieldset class="pq-avatar-fieldset">' +
            '<legend>Elige un avatar <span>(opcional)</span></legend>' +
            '<p>Si no eliges uno, mostraremos la primera letra de tu nombre.</p>' +
            '<div class="pq-avatar-grid" id="pq-onboarding-avatars">' +
              avatarButtons(selectedAvatar) +
            '</div>' +
            '<p class="pq-avatar-swipe-hint">Desliza para ver más avatares →</p>' +
          '</fieldset>' +
          '<p class="pq-onboarding-error" id="pq-onboarding-error" role="alert" aria-live="polite"></p>' +
          '<button class="pq-primary-button" type="submit">Continuar</button>' +
          '<p class="pq-onboarding-privacy">Tus datos se guardan únicamente en este navegador.</p>' +
        '</form>' +
      '</div>';

    document.body.appendChild(overlay);
    document.documentElement.classList.add('pq-modal-open');
    document.body.classList.add('pq-modal-open');

    var form = overlay.querySelector('#pq-onboarding-form');
    var nameInput = overlay.querySelector('#pq-profile-name');
    var ageInput = overlay.querySelector('#pq-profile-age');
    var weightInput = overlay.querySelector('#pq-profile-weight');
    var errorMessage = overlay.querySelector('#pq-onboarding-error');
    var picker = overlay.querySelector('#pq-onboarding-avatars');

    nameInput.value = normalizeName(raw.nombre);
    ageInput.value = Number.isFinite(Number(raw.edad)) ? String(raw.edad) : '';
    weightInput.value = Number.isFinite(Number(raw.peso)) ? String(raw.peso) : '';
    bindAvatarPicker(picker, function (avatar) {
      selectedAvatar = avatar;
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      errorMessage.textContent = '';

      var name = normalizeName(nameInput.value);
      var age = Number(ageInput.value);
      var weight = Number(String(weightInput.value).replace(',', '.'));

      if (name.length < 2) {
        errorMessage.textContent = 'Escribe tu nombre para continuar.';
        nameInput.focus();
        return;
      }
      if (!Number.isFinite(age) || age < 18 || age > 110 || Math.round(age) !== age) {
        errorMessage.textContent = 'Escribe una edad válida entre 18 y 110 años.';
        ageInput.focus();
        return;
      }
      if (!Number.isFinite(weight) || weight < 20 || weight > 300) {
        errorMessage.textContent = 'Escribe un peso válido entre 20 y 300 kg.';
        weightInput.focus();
        return;
      }

      var now = new Date().toISOString();
      var isFirstProfile = !raw.creadoEn;
      var profile = {
        nombre: name,
        edad: Math.round(age),
        peso: Math.round(weight * 10) / 10,
        avatar: selectedAvatar,
        creadoEn: raw.creadoEn || now,
        actualizadoEn: now,
        version: 2
      };

      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      } catch (error) {
        errorMessage.textContent = 'No fue posible guardar los datos en este navegador. Inténtalo de nuevo.';
        return;
      }

      window.__pqFirstVisitGreeting = isFirstProfile;
      removeOnboarding();
      window.dispatchEvent(new CustomEvent('pilates:profile-updated', { detail: profile }));
      scheduleDecorate();
    });

    window.setTimeout(function () {
      nameInput.focus();
    }, 150);
  }

  function ensureAvatarModal() {
    var modal = document.getElementById('pq-avatar-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'pq-avatar-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'pq-avatar-modal-title');
    modal.innerHTML =
      '<div class="pq-avatar-card">' +
        '<button type="button" class="pq-modal-close" aria-label="Cerrar">×</button>' +
        '<div class="pq-modal-leaf" aria-hidden="true">' +
          '<svg viewBox="0 0 32 32"><path d="M16.2 26.5c-.3-7.8 2.6-13.6 8.5-17.5"></path><path d="M16.7 20.5C11.2 20.1 7.2 17 5 11.2c5.7-1 10.2.7 12.9 5.1"></path><path d="M18.7 15.1c.8-5.3 4-8.4 9.1-9.6.6 5.5-1.8 9.3-7.1 11.2"></path></svg>' +
        '</div>' +
        '<h2 id="pq-avatar-modal-title">Elige tu avatar</h2>' +
        '<p>Puedes cambiarlo cuando quieras.</p>' +
        '<button type="button" class="pq-use-initial pq-avatar-option" data-avatar="" aria-pressed="false">' +
          '<span class="pq-initial-preview">A</span>' +
          '<span>Usar la inicial de mi nombre</span>' +
          '<span class="pq-avatar-check" aria-hidden="true">✓</span>' +
        '</button>' +
        '<div class="pq-avatar-grid" id="pq-avatar-modal-grid"></div>' +
        '<p class="pq-avatar-swipe-hint">Desliza para ver más avatares →</p>' +
        '<div class="pq-modal-actions">' +
          '<button type="button" class="pq-secondary-button" data-action="cancel">Cancelar</button>' +
          '<button type="button" class="pq-primary-button" data-action="save">Guardar</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    modal.querySelector('.pq-modal-close').addEventListener('click', closeAvatarModal);
    modal.querySelector('[data-action="cancel"]').addEventListener('click', closeAvatarModal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeAvatarModal();
    });
    return modal;
  }

  function openAvatarModal() {
    var profile = readProfile();
    if (!profile) return;

    var modal = ensureAvatarModal();
    var selectedAvatar = normalizeAvatar(profile.avatar);
    var grid = modal.querySelector('#pq-avatar-modal-grid');
    var initialButton = modal.querySelector('.pq-use-initial');
    var initialPreview = modal.querySelector('.pq-initial-preview');
    var saveButton = modal.querySelector('[data-action="save"]');

    grid.innerHTML = avatarButtons(selectedAvatar);
    initialPreview.textContent = firstName(profile.nombre).charAt(0).toUpperCase() || 'A';
    initialButton.classList.toggle('is-selected', !selectedAvatar);
    initialButton.setAttribute('aria-pressed', selectedAvatar ? 'false' : 'true');

    var pickerRoot = modal.querySelector('.pq-avatar-card');
    pickerRoot.onclick = function (event) {
      var option = event.target.closest('.pq-avatar-option');
      if (!option || !pickerRoot.contains(option)) return;
      selectedAvatar = normalizeAvatar(option.getAttribute('data-avatar'));
      setSelectedAvatar(pickerRoot, selectedAvatar);
    };

    saveButton.onclick = function () {
      var current = readProfile();
      if (!current) return;
      current.avatar = selectedAvatar;
      current.actualizadoEn = new Date().toISOString();
      current.version = 2;
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(current));
      } catch (error) {
        return;
      }
      closeAvatarModal();
      window.dispatchEvent(new CustomEvent('pilates:profile-updated', { detail: current }));
      scheduleDecorate();
    };

    lastFocusedElement = document.activeElement;
    modal.classList.add('pq-visible');
    document.documentElement.classList.add('pq-modal-open');
    document.body.classList.add('pq-modal-open');
    window.setTimeout(function () {
      modal.querySelector('.pq-modal-close').focus();
    }, 50);
  }

  function closeAvatarModal() {
    var modal = document.getElementById('pq-avatar-modal');
    if (!modal) return;
    modal.classList.remove('pq-visible');
    if (!document.querySelector('.pq-v8-modal.pq-visible')) {
      document.documentElement.classList.remove('pq-modal-open');
      document.body.classList.remove('pq-modal-open');
    }
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  function completedClassCount() {
    var progress = safeJson(PROGRESS_KEY, {});
    if (!progress || typeof progress !== 'object') return 0;
    return Object.keys(progress).filter(function (key) {
      return progress[key] === true;
    }).length;
  }

  function moduleClassCount(moduleNumber, target) {
    var progress = safeJson(PROGRESS_KEY, {});
    var count = 0;
    for (var index = 1; index <= target; index += 1) {
      if (progress['m' + moduleNumber + '-l' + index] === true) count += 1;
    }
    return count;
  }

  function achievementProgress(detail) {
    var current = 0;
    if (detail.kind === 'classes') {
      current = completedClassCount();
    } else if (detail.kind === 'streak') {
      var streak = safeJson(STREAK_KEY, { days: 0 });
      current = Number(streak && streak.days) || 0;
    } else if (detail.kind === 'module') {
      current = moduleClassCount(detail.module, detail.target);
    }
    current = Math.max(0, Math.min(current, detail.target));
    var unlocked = safeJson(ACHIEVEMENTS_KEY, []);
    var isUnlocked = Array.isArray(unlocked) && unlocked.indexOf(detail.id) !== -1;
    return {
      current: current,
      target: detail.target,
      complete: isUnlocked || current >= detail.target,
      percent: detail.target ? Math.round(current / detail.target * 100) : 0
    };
  }

  function ensureAchievementModal() {
    var modal = document.getElementById('pq-achievement-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'pq-achievement-modal';
    modal.className = 'pq-v8-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'pq-achievement-detail-title');
    modal.innerHTML =
      '<div class="pq-achievement-detail-card">' +
        '<button type="button" class="pq-modal-close" aria-label="Cerrar">×</button>' +
        '<div class="pq-achievement-detail-icon" aria-hidden="true"></div>' +
        '<p class="pq-achievement-eyebrow">LOGRO</p>' +
        '<h2 id="pq-achievement-detail-title"></h2>' +
        '<p class="pq-achievement-requirement"></p>' +
        '<div class="pq-achievement-detail-progress">' +
          '<div class="pq-achievement-detail-progress-copy"><span>Tu progreso</span><strong></strong></div>' +
          '<div class="pq-achievement-detail-track" role="progressbar" aria-valuemin="0" aria-valuemax="100"><span></span></div>' +
        '</div>' +
        '<div class="pq-achievement-detail-status"></div>' +
        '<button type="button" class="pq-primary-button" data-action="close">Entendido</button>' +
      '</div>';

    document.body.appendChild(modal);
    modal.querySelector('.pq-modal-close').addEventListener('click', closeAchievementModal);
    modal.querySelector('[data-action="close"]').addEventListener('click', closeAchievementModal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeAchievementModal();
    });
    return modal;
  }

  function openAchievementModal(id) {
    var detail = ACHIEVEMENT_DETAILS[id];
    if (!detail) return;
    detail.id = id;
    var progress = achievementProgress(detail);
    var modal = ensureAchievementModal();
    var track = modal.querySelector('.pq-achievement-detail-track');
    var status = modal.querySelector('.pq-achievement-detail-status');

    modal.querySelector('.pq-achievement-detail-icon').textContent = detail.icon;
    modal.querySelector('#pq-achievement-detail-title').textContent = detail.title;
    modal.querySelector('.pq-achievement-requirement').textContent = detail.requirement;
    modal.querySelector('.pq-achievement-detail-progress-copy strong').textContent =
      progress.current + ' de ' + progress.target;
    track.setAttribute('aria-valuenow', String(progress.percent));
    track.setAttribute('aria-valuetext', progress.current + ' de ' + progress.target);
    track.querySelector('span').style.width = progress.percent + '%';
    status.textContent = progress.complete ? '✓ Conseguido' : 'Bloqueado';
    status.classList.toggle('is-complete', progress.complete);

    lastFocusedElement = document.activeElement;
    modal.classList.add('pq-visible');
    document.documentElement.classList.add('pq-modal-open');
    document.body.classList.add('pq-modal-open');
    window.setTimeout(function () {
      modal.querySelector('.pq-modal-close').focus();
    }, 50);
  }

  function closeAchievementModal() {
    var modal = document.getElementById('pq-achievement-modal');
    if (!modal) return;
    modal.classList.remove('pq-visible');
    if (!document.querySelector('#pq-avatar-modal.pq-visible')) {
      document.documentElement.classList.remove('pq-modal-open');
      document.body.classList.remove('pq-modal-open');
    }
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  function decorateGreeting() {
    var profile = readProfile();
    var greeting = document.getElementById('pq-profile-greeting');
    if (!profile || !greeting) return;
    var icon = greeting.querySelector('.pq-greeting-icon');
    if (!icon) return;

    icon.setAttribute('role', 'button');
    icon.setAttribute('tabindex', '0');
    icon.setAttribute('aria-label', 'Cambiar avatar');
    icon.setAttribute('title', 'Cambiar avatar');

    var signature = profile.avatar || ('initial-' + firstName(profile.nombre).charAt(0).toUpperCase());
    if (icon.getAttribute('data-pq-avatar-signature') !== signature) {
      icon.setAttribute('data-pq-avatar-signature', signature);
      if (profile.avatar) {
        icon.innerHTML = '<img src="' + avatarPath(profile.avatar) + '" alt="Avatar de ' +
          firstName(profile.nombre).replace(/"/g, '') + '">';
      } else {
        icon.innerHTML = '<span class="pq-profile-initial" aria-hidden="true">' +
          (firstName(profile.nombre).charAt(0).toUpperCase() || 'A') + '</span>';
      }
    }

    if (icon.getAttribute('data-pq-avatar-bound') !== '1') {
      icon.setAttribute('data-pq-avatar-bound', '1');
      icon.addEventListener('click', openAvatarModal);
      icon.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openAvatarModal();
        }
      });
    }
  }

  function decorateAchievements() {
    document.querySelectorAll('.pq-achievement-card[data-achievement-id]').forEach(function (card) {
      var id = card.getAttribute('data-achievement-id');
      if (!ACHIEVEMENT_DETAILS[id]) return;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('title', 'Ver cómo conseguir este logro');
      if (card.getAttribute('data-pq-details-bound') === '1') return;
      card.setAttribute('data-pq-details-bound', '1');
      card.addEventListener('click', function () {
        openAchievementModal(id);
      });
      card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openAchievementModal(id);
        }
      });
    });
  }

  function decorateIntensity() {
    document.querySelectorAll('[data-pq-view="module"] span').forEach(function (element) {
      var colorDot = element.firstElementChild;
      if (!colorDot || !/rounded-full/.test(colorDot.getAttribute('class') || '')) return;
      var text = element.textContent || '';
      if (!/Intensidad\s*:/i.test(text)) return;
      element.classList.add('pq-intensity');
      element.classList.remove('pq-intensity-soft', 'pq-intensity-moderate', 'pq-intensity-challenging');
      if (/suave/i.test(text)) {
        element.classList.add('pq-intensity-soft');
      } else if (/moderada/i.test(text)) {
        element.classList.add('pq-intensity-moderate');
      } else {
        element.classList.add('pq-intensity-challenging');
      }
    });
  }

  function decorateBonusCards() {
    document.querySelectorAll('#pq-bonus-screen img[data-pq-pdf-id]').forEach(function (image) {
      var card = image.closest('div[onclick]');
      if (card) card.classList.add('pq-bonus-card');
    });
  }

  function decorate() {
    document.documentElement.setAttribute('data-pq-theme', 'professional-v8');
    decorateGreeting();
    decorateAchievements();
    decorateIntensity();
    decorateBonusCards();
  }

  function scheduleDecorate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      decorate();
    });
  }

  function profileGate() {
    if (readProfile()) {
      scheduleDecorate();
    } else {
      showOnboarding();
    }
  }

  function interceptLocalStorage() {
    try {
      var originalSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = function (key, value) {
        originalSetItem(key, value);
        if (key === PROFILE_KEY || key === PROGRESS_KEY ||
            key === ACHIEVEMENTS_KEY || key === STREAK_KEY) {
          window.dispatchEvent(new CustomEvent('pilates:local-data', { detail: { key: key } }));
        }
      };
    } catch (error) {
      // El navegador seguirá funcionando aunque no permita interceptar el almacenamiento.
    }
  }

  function init() {
    interceptLocalStorage();
    ensureAvatarModal();
    ensureAchievementModal();
    window.addEventListener('pilates:auth', profileGate);
    window.addEventListener('pilates:profile-updated', scheduleDecorate);
    window.addEventListener('pilates:local-data', scheduleDecorate);
    window.addEventListener('storage', function (event) {
      if (event.key === PROFILE_KEY || event.key === PROGRESS_KEY ||
          event.key === ACHIEVEMENTS_KEY || event.key === STREAK_KEY) {
        scheduleDecorate();
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (document.getElementById('pq-avatar-modal').classList.contains('pq-visible')) {
        closeAvatarModal();
      } else if (document.getElementById('pq-achievement-modal').classList.contains('pq-visible')) {
        closeAchievementModal();
      }
    });
    new MutationObserver(scheduleDecorate).observe(document.body, {
      childList: true,
      subtree: true
    });
    scheduleDecorate();

    if (!IS_DEMO) {
      var attempts = 0;
      var authTimer = window.setInterval(function () {
        attempts += 1;
        if (window.__pq_auth_ok === true) {
          window.clearInterval(authTimer);
          profileGate();
        } else if (attempts >= 160) {
          window.clearInterval(authTimer);
        }
      }, 250);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
