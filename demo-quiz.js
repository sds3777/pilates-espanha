(function () {
  'use strict';

  var IS_DEMO = window.location.pathname.replace(/\/+$/, '') === '/teste';
  if (!IS_DEMO) return;

  var STORAGE_KEY = 'pilates_demo_quiz_v1';
  var stored = null;
  try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (error) {}
  if (stored && stored.completed === true) return;

  document.documentElement.classList.add('pq-demo-quiz-pending');

  var state = {
    step: 0,
    profile: { name: '', age: '', weight: '' },
    conditions: [],
    dailyDifficulty: '',
    metabolism: '',
    bodyFat: '',
    ageChange: ''
  };

  var stepCount = 6;

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function option(value, text, emoji, group, multiple) {
    return '<button type="button" class="pq-demo-option" data-value="' + escapeHtml(value) +
      '" data-group="' + escapeHtml(group) + '" data-multiple="' + (multiple ? 'true' : 'false') +
      '" aria-pressed="false"><span class="pq-demo-option-emoji" aria-hidden="true">' +
      (emoji || '•') + '</span><span class="pq-demo-option-text">' + escapeHtml(text) +
      '</span><span class="pq-demo-option-check" aria-hidden="true">✓</span></button>';
  }

  function template() {
    return '<div id="pq-demo-quiz" role="dialog" aria-modal="true" aria-labelledby="pq-demo-current-title">' +
      '<div class="pq-demo-quiz-shell"><div class="pq-demo-quiz-card">' +
        '<header class="pq-demo-quiz-brand"><img src="/logo-pilates-en-casa.webp" alt="Pilates en Casa">' +
          '<div><strong>PILATES EN CASA</strong><span>con Daniela</span></div></header>' +
        '<div class="pq-demo-quiz-progress-wrap">' +
          '<div class="pq-demo-quiz-progress-copy"><span id="pq-demo-step-label">Paso 1 de 6</span>' +
            '<strong id="pq-demo-step-percent">17%</strong></div>' +
          '<div class="pq-demo-quiz-progress" role="progressbar" aria-label="Progreso del cuestionario" aria-valuemin="0" aria-valuemax="100" aria-valuenow="17"><span></span></div>' +
        '</div>' +
        '<main class="pq-demo-quiz-body">' +
          '<section class="pq-demo-step is-active" data-step="0">' +
            '<h1 id="pq-demo-current-title">Antes de comenzar, cuéntanos un poco sobre ti</h1>' +
            '<p>Son preguntas rápidas para preparar tu experiencia de demostración.</p>' +
            '<div class="pq-demo-profile-grid">' +
              '<div class="pq-demo-field"><label for="pq-demo-name">Nombre</label><input id="pq-demo-name" type="text" maxlength="60" autocomplete="name" placeholder="Escribe tu nombre"></div>' +
              '<div class="pq-demo-field"><label for="pq-demo-age">Edad</label><input id="pq-demo-age" type="number" inputmode="numeric" min="18" max="110" step="1" placeholder="Ej.: 55"></div>' +
              '<div class="pq-demo-field"><label for="pq-demo-weight">Peso (kg)</label><input id="pq-demo-weight" type="number" inputmode="decimal" min="20" max="300" step="0.1" placeholder="Ej.: 68"></div>' +
            '</div>' +
          '</section>' +
          '<section class="pq-demo-step" data-step="1">' +
            '<h1>¿Sientes algún dolor o tienes alguna condición de salud?</h1>' +
            '<p>Puedes elegir más de una opción.</p><div class="pq-demo-options">' +
              option('spine', 'Dolor en la columna, lumbar o cervical', '🧍‍♀️', 'conditions', true) +
              option('joints', 'Dolor en la rodilla, cadera u hombro', '🦵', 'conditions', true) +
              option('hernia', 'Hernia de disco', '🩻', 'conditions', true) +
              option('arthritis', 'Artritis, artrosis u osteoporosis', '🦴', 'conditions', true) +
              option('fibromyalgia', 'Fibromialgia', '🌸', 'conditions', true) +
              option('other', 'Otra condición', '➕', 'conditions', true) +
              option('none', 'No tengo dolores ni condiciones', '😀', 'conditions', true) +
            '</div>' +
          '</section>' +
          '<section class="pq-demo-step" data-step="2">' +
            '<h1>¿Tienes dificultad para realizar tareas del día a día?</h1>' +
            '<p>Elige la opción que más se ajuste a tu rutina actual.</p><div class="pq-demo-options">' +
              option('many', 'Tengo dificultad en varias tareas', '🙄', 'dailyDifficulty', false) +
              option('some', 'Tengo dificultad en algunas tareas', '😐', 'dailyDifficulty', false) +
              option('none', 'No tengo dificultad en ninguna tarea', '😀', 'dailyDifficulty', false) +
            '</div>' +
          '</section>' +
          '<section class="pq-demo-step" data-step="3">' +
            '<h1>¿Cómo percibes tu metabolismo actualmente?</h1>' +
            '<p>No hay respuesta correcta: elige lo que sientes en tu día a día.</p><div class="pq-demo-options">' +
              option('slow', 'Lento — difícil bajar y fácil subir de peso', '🐢', 'metabolism', false) +
              option('fast', 'Acelerado — fácil bajar y difícil subir de peso', '🔥', 'metabolism', false) +
              option('unsure', 'No sabría decir', '🤔', 'metabolism', false) +
            '</div>' +
          '</section>' +
          '<section class="pq-demo-step" data-step="4">' +
            '<h1>¿En qué zona acumulas grasa con más facilidad?</h1>' +
            '<p>Elige la alternativa que mejor te describe.</p><div class="pq-demo-options">' +
              option('belly', 'En la barriga — es el lugar principal', '😫', 'bodyFat', false) +
              option('other', 'Acumulo más en otras zonas', '😐', 'bodyFat', false) +
              option('none', 'No percibo acumulación de grasa con facilidad', '😀', 'bodyFat', false) +
            '</div>' +
          '</section>' +
          '<section class="pq-demo-step" data-step="5">' +
            '<h1 id="pq-demo-age-question">Después de los 40 años, ¿notaste más dolores o mayor facilidad para subir de peso?</h1>' +
            '<p>Considera los cambios que notaste en tu cuerpo y en tu rutina.</p><div class="pq-demo-options">' +
              option('yes', 'Sí, bastante', '😫', 'ageChange', false) +
              option('some', 'Un poco', '😐', 'ageChange', false) +
              option('no', 'No noté diferencia', '😀', 'ageChange', false) +
            '</div>' +
          '</section>' +
          '<p class="pq-demo-quiz-error" id="pq-demo-error" role="alert" aria-live="polite"></p>' +
          '<div class="pq-demo-actions is-first"><button type="button" class="pq-demo-back">Volver</button>' +
            '<button type="button" class="pq-demo-next">Continuar</button></div>' +
        '</main>' +
        '<section class="pq-demo-analyzing" aria-live="polite">' +
          '<div class="pq-demo-analysis-content"><div class="pq-demo-analysis-icon" aria-hidden="true">' +
            '<svg viewBox="0 0 48 48"><path d="M24 40c-8-5-13-12-13-20 0-6 4-10 9-10 3 0 5 2 6 4 1-2 3-4 6-4 5 0 9 4 9 10 0 8-7 15-17 20Z"></path><path d="M8 25h8l3-6 5 12 4-8 3 4h9"></path></svg>' +
          '</div><h2>Analizando tus respuestas</h2><div class="pq-demo-analysis-percent">0%</div>' +
          '<div class="pq-demo-analysis-track" role="progressbar" aria-label="Preparando tus clases" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>' +
          '<p class="pq-demo-analysis-message">Analizando tus respuestas...</p></div>' +
        '</section>' +
      '</div></div></div>';
  }

  function mount() {
    if (document.getElementById('pq-demo-quiz')) return;
    document.body.insertAdjacentHTML('beforeend', template());

    var overlay = document.getElementById('pq-demo-quiz');
    var card = overlay.querySelector('.pq-demo-quiz-card');
    var back = overlay.querySelector('.pq-demo-back');
    var next = overlay.querySelector('.pq-demo-next');
    var error = overlay.querySelector('#pq-demo-error');

    overlay.addEventListener('click', function (event) {
      var choice = event.target.closest('.pq-demo-option');
      if (!choice || !overlay.contains(choice)) return;
      error.textContent = '';
      var group = choice.getAttribute('data-group');
      var value = choice.getAttribute('data-value');
      var multiple = choice.getAttribute('data-multiple') === 'true';

      if (multiple) {
        if (value === 'none') {
          state.conditions = ['none'];
        } else {
          state.conditions = state.conditions.filter(function (item) { return item !== 'none'; });
          if (state.conditions.indexOf(value) >= 0) {
            state.conditions = state.conditions.filter(function (item) { return item !== value; });
          } else {
            state.conditions.push(value);
          }
        }
        overlay.querySelectorAll('[data-group="conditions"]').forEach(function (button) {
          setSelected(button, state.conditions.indexOf(button.getAttribute('data-value')) >= 0);
        });
      } else {
        state[group] = value;
        overlay.querySelectorAll('[data-group="' + group + '"]').forEach(function (button) {
          setSelected(button, button === choice);
        });
      }
    });

    back.addEventListener('click', function () {
      if (state.step <= 0) return;
      state.step -= 1;
      showStep(overlay);
    });

    next.addEventListener('click', function () {
      if (!validateStep(overlay, error)) return;
      if (state.step === stepCount - 1) {
        startAnalysis(overlay, card);
        return;
      }
      state.step += 1;
      showStep(overlay);
    });

    showStep(overlay);

    window.setTimeout(function () {
      var nameInput = overlay.querySelector('#pq-demo-name');
      if (nameInput) nameInput.focus();
    }, 180);
  }

  function setSelected(button, selected) {
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', selected ? 'true' : 'false');
  }

  function validateStep(overlay, error) {
    error.textContent = '';
    if (state.step === 0) {
      var name = overlay.querySelector('#pq-demo-name').value.trim().replace(/\s+/g, ' ');
      var age = Number(overlay.querySelector('#pq-demo-age').value);
      var weight = Number(overlay.querySelector('#pq-demo-weight').value.replace(',', '.'));
      if (name.length < 2) { error.textContent = 'Escribe tu nombre para continuar.'; return false; }
      if (!Number.isFinite(age) || age < 18 || age > 110) { error.textContent = 'Escribe una edad válida.'; return false; }
      if (!Number.isFinite(weight) || weight < 20 || weight > 300) { error.textContent = 'Escribe un peso válido.'; return false; }
      state.profile = { name: name, age: Math.round(age), weight: Math.round(weight * 10) / 10 };
      overlay.querySelector('#pq-demo-age-question').textContent = age < 40
        ? 'En los últimos años, ¿notaste más dolores o mayor facilidad para subir de peso?'
        : 'Después de los 40 años, ¿notaste más dolores o mayor facilidad para subir de peso?';
      return true;
    }
    if (state.step === 1 && state.conditions.length === 0) {
      error.textContent = 'Elige al menos una opción.';
      return false;
    }
    var keys = { 2: 'dailyDifficulty', 3: 'metabolism', 4: 'bodyFat', 5: 'ageChange' };
    if (keys[state.step] && !state[keys[state.step]]) {
      error.textContent = 'Elige una opción para continuar.';
      return false;
    }
    return true;
  }

  function showStep(overlay) {
    overlay.querySelectorAll('.pq-demo-step').forEach(function (section) {
      section.classList.toggle('is-active', Number(section.getAttribute('data-step')) === state.step);
    });
    var percent = Math.round((state.step + 1) / stepCount * 100);
    overlay.querySelector('#pq-demo-step-label').textContent = 'Paso ' + (state.step + 1) + ' de ' + stepCount;
    overlay.querySelector('#pq-demo-step-percent').textContent = percent + '%';
    var progress = overlay.querySelector('.pq-demo-quiz-progress');
    progress.setAttribute('aria-valuenow', String(percent));
    progress.querySelector('span').style.width = percent + '%';
    overlay.querySelector('#pq-demo-error').textContent = '';
    var actions = overlay.querySelector('.pq-demo-actions');
    actions.classList.toggle('is-first', state.step === 0);
    overlay.querySelector('.pq-demo-back').style.display = state.step === 0 ? 'none' : '';
    overlay.querySelector('.pq-demo-next').textContent = state.step === stepCount - 1 ? 'Preparar mis clases' : 'Continuar';
    var heading = overlay.querySelector('.pq-demo-step.is-active h1');
    if (heading) heading.id = 'pq-demo-current-title';
    overlay.querySelectorAll('.pq-demo-step:not(.is-active) h1').forEach(function (title) {
      if (title.id === 'pq-demo-current-title') title.removeAttribute('id');
    });
    overlay.scrollTop = 0;
  }

  function startAnalysis(overlay, card) {
    card.classList.add('is-analyzing');
    var percent = overlay.querySelector('.pq-demo-analysis-percent');
    var track = overlay.querySelector('.pq-demo-analysis-track');
    var bar = track.querySelector('span');
    var message = overlay.querySelector('.pq-demo-analysis-message');
    var messages = [
      'Analizando tus respuestas...',
      'Identificando tus principales desafíos...',
      'Preparando tus clases...'
    ];
    var startedAt = performance.now();

    function frame(now) {
      var elapsed = Math.min(6000, now - startedAt);
      var value = Math.min(100, Math.round(elapsed / 6000 * 100));
      var messageIndex = Math.min(2, Math.floor(elapsed / 2000));
      percent.textContent = value + '%';
      bar.style.width = value + '%';
      track.setAttribute('aria-valuenow', String(value));
      message.textContent = messages[messageIndex];
      if (elapsed < 6000) {
        window.requestAnimationFrame(frame);
      } else {
        finish(overlay);
      }
    }
    window.requestAnimationFrame(frame);
  }

  function finish(overlay) {
    var payload = {
      completed: true,
      completedAt: new Date().toISOString(),
      profile: state.profile,
      answers: {
        conditions: state.conditions.slice(),
        dailyDifficulty: state.dailyDifficulty,
        metabolism: state.metabolism,
        bodyFat: state.bodyFat,
        ageChange: state.ageChange
      }
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (error) {}
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 220ms ease';
    window.setTimeout(function () {
      overlay.remove();
      document.documentElement.classList.remove('pq-demo-quiz-pending');
      document.body.style.overflow = '';
      window.scrollTo(0, 0);
      window.dispatchEvent(new CustomEvent('pilates:demo-ready', { detail: payload }));
    }, 230);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
