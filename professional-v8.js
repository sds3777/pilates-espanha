(function () {
  'use strict';

  var PROFILE_KEY = 'pilates_profile_v1';
  var PROGRESS_KEY = 'pilatesProgress';
  var ACHIEVEMENTS_KEY = 'pilatesAchievements';
  var STREAK_KEY = 'pilatesStreak';
  var MODULE_GUIDE_KEY = 'pilates_module_guide_seen_v1';
  var IS_DEMO = window.location.pathname.replace(/\/+$/, '') === '/teste';
  var TOTAL_CLASSES = 89;
  var AVATAR_COUNT = 20;
  var scheduled = false;
  var lastFocusedElement = null;
  var pendingModuleCard = null;
  var moduleGuideSeenThisSession = false;

  var UI_TEXTS = {
    'pt-BR': {
      brand: 'PILATES EM CASA', subtitle: 'com Daniela', logoAlt: 'Pilates em Casa',
      onboardingTitle: 'Vamos conhecer você!',
      onboardingIntro: 'Preencha estes dados apenas uma vez para personalizar sua experiência.',
      name: 'Nome', namePlaceholder: 'Digite seu nome', age: 'Idade', agePlaceholder: 'Ex.: 55',
      weight: 'Peso (kg)', weightPlaceholder: 'Ex.: 68', avatarLegend: 'Escolha um avatar',
      optional: '(opcional)', avatarHelp: 'Se não escolher, mostraremos a primeira letra do seu nome.',
      swipe: 'Deslize para ver mais avatares →', continue: 'Continuar',
      privacy: 'Seus dados ficam salvos somente neste navegador.',
      nameError: 'Digite seu nome para continuar.', ageError: 'Digite uma idade válida entre 18 e 110 anos.',
      weightError: 'Digite um peso válido entre 20 e 300 kg.', saveError: 'Não foi possível salvar os dados neste navegador. Tente novamente.',
      avatarTitle: 'Escolha seu avatar', avatarIntro: 'Você pode alterá-lo quando quiser.',
      useInitial: 'Usar a inicial do meu nome', cancel: 'Cancelar', save: 'Salvar', close: 'Fechar',
      changeAvatar: 'Alterar avatar', avatarLabel: 'Avatar',
      firstGreeting: 'Bem-vinda, ', returnGreeting: 'Bem-vinda de volta, ', greetingSub: 'Continue sua jornada no Pilates em Casa.',
      progressTitle: 'Seu progresso', classes: '{current} de {total} aulas concluídas', progressAria: 'Progresso total',
      achievementsTitle: 'Suas conquistas', achievementCount: '{current} de {total}', achieved: 'Conquistado', locked: 'Bloqueado',
      achievementEyebrow: 'CONQUISTA', yourProgress: 'Seu progresso', understood: 'Entendi', viewAchievement: 'Ver como conquistar',
      achievements: {
        first_lesson: ['Primeiros Passos', 'Conclua sua primeira aula.'],
        lesson_5: ['Criando Hábito', 'Conclua 5 aulas.'], lesson_10: ['Em Movimento', 'Conclua 10 aulas.'],
        lesson_25: ['Mais Forte a Cada Dia', 'Conclua 20 aulas.'], progress_25: ['Evoluindo', 'Conclua 25% do programa.'],
        lesson_50: ['Compromisso com Você', 'Conclua 40 aulas.'], progress_50: ['Metade do Caminho', 'Conclua 50% do programa.'],
        lesson_75: ['Exemplo de Constância', 'Conclua 60 aulas.'], progress_75: ['Quase Lá', 'Conclua 75% do programa.'],
        first_module: ['Primeiro Módulo Concluído', 'Conclua as 11 aulas do primeiro módulo.'],
        wall_module: ['Especialista da Parede', 'Conclua as 34 aulas do módulo Transforme Seu Corpo na Parede.'],
        complete_pilates: ['Transformação Completa', 'Conclua as 29 aulas do módulo Transformação Completa com Pilates.'],
        seven_days: ['Uma Semana de Consistência', 'Pratique durante 7 dias consecutivos.'],
        thirty_days: ['Nova Rotina', 'Pratique durante 30 dias consecutivos.'],
        full_program: ['Rainha do Pilates', 'Conclua as 94 aulas do programa.']
      }
    },
    'pt-PT': {
      brand: 'PILATES EM CASA', subtitle: 'com Daniela', logoAlt: 'Pilates em Casa',
      onboardingTitle: 'Vamos conhecê-la!', onboardingIntro: 'Preencha estes dados apenas uma vez para personalizar a sua experiência.',
      name: 'Nome', namePlaceholder: 'Escreva o seu nome', age: 'Idade', agePlaceholder: 'Ex.: 55',
      weight: 'Peso (kg)', weightPlaceholder: 'Ex.: 68', avatarLegend: 'Escolha um avatar', optional: '(opcional)',
      avatarHelp: 'Se não escolher, mostraremos a primeira letra do seu nome.', swipe: 'Deslize para ver mais avatares →',
      continue: 'Continuar', privacy: 'Os seus dados ficam guardados apenas neste navegador.',
      nameError: 'Escreva o seu nome para continuar.', ageError: 'Escreva uma idade válida entre 18 e 110 anos.',
      weightError: 'Escreva um peso válido entre 20 e 300 kg.', saveError: 'Não foi possível guardar os dados neste navegador. Tente novamente.',
      avatarTitle: 'Escolha o seu avatar', avatarIntro: 'Pode alterá-lo quando quiser.', useInitial: 'Usar a inicial do meu nome',
      cancel: 'Cancelar', save: 'Guardar', close: 'Fechar', changeAvatar: 'Alterar avatar', avatarLabel: 'Avatar',
      firstGreeting: 'Bem-vinda, ', returnGreeting: 'Bem-vinda de volta, ', greetingSub: 'Continue a sua jornada no Pilates em Casa.',
      progressTitle: 'O seu progresso', classes: '{current} de {total} aulas concluídas', progressAria: 'Progresso total',
      achievementsTitle: 'As suas conquistas', achievementCount: '{current} de {total}', achieved: 'Conquistado', locked: 'Bloqueado',
      achievementEyebrow: 'CONQUISTA', yourProgress: 'O seu progresso', understood: 'Entendi', viewAchievement: 'Ver como conquistar',
      achievements: {
        first_lesson: ['Primeiros Passos', 'Conclua a sua primeira aula.'], lesson_5: ['A Criar Hábito', 'Conclua 5 aulas.'],
        lesson_10: ['Em Movimento', 'Conclua 10 aulas.'], lesson_25: ['Mais Forte a Cada Dia', 'Conclua 20 aulas.'],
        progress_25: ['A Evoluir', 'Conclua 25% do programa.'], lesson_50: ['Compromisso Consigo Mesma', 'Conclua 40 aulas.'],
        progress_50: ['A Meio do Caminho', 'Conclua 50% do programa.'], lesson_75: ['Exemplo de Constância', 'Conclua 60 aulas.'],
        progress_75: ['Quase Lá', 'Conclua 75% do programa.'], first_module: ['Primeiro Módulo Concluído', 'Conclua as 11 aulas do primeiro módulo.'],
        wall_module: ['Especialista da Parede', 'Conclua as 34 aulas do módulo Transforme o Seu Corpo na Parede.'],
        complete_pilates: ['Transformação Completa', 'Conclua as 29 aulas do módulo Transformação Completa com Pilates.'],
        seven_days: ['Uma Semana de Consistência', 'Pratique durante 7 dias consecutivos.'],
        thirty_days: ['Nova Rotina', 'Pratique durante 30 dias consecutivos.'], full_program: ['Rainha do Pilates', 'Conclua as 94 aulas do programa.']
      }
    },
    es: {
      brand: 'PILATES EN CASA', subtitle: 'con Daniela', logoAlt: 'Pilates en Casa',
      onboardingTitle: '¡Vamos a conocerte!', onboardingIntro: 'Completa estos datos una sola vez para personalizar tu experiencia.',
      name: 'Nombre', namePlaceholder: 'Escribe tu nombre', age: 'Edad', agePlaceholder: 'Ej.: 55',
      weight: 'Peso (kg)', weightPlaceholder: 'Ej.: 68', avatarLegend: 'Elige un avatar', optional: '(opcional)',
      avatarHelp: 'Si no eliges uno, mostraremos la primera letra de tu nombre.', swipe: 'Desliza para ver más avatares →',
      continue: 'Continuar', privacy: 'Tus datos se guardan únicamente en este navegador.',
      nameError: 'Escribe tu nombre para continuar.', ageError: 'Escribe una edad válida entre 18 y 110 años.',
      weightError: 'Escribe un peso válido entre 20 y 300 kg.', saveError: 'No fue posible guardar los datos en este navegador. Inténtalo de nuevo.',
      avatarTitle: 'Elige tu avatar', avatarIntro: 'Puedes cambiarlo cuando quieras.', useInitial: 'Usar la inicial de mi nombre',
      cancel: 'Cancelar', save: 'Guardar', close: 'Cerrar', changeAvatar: 'Cambiar avatar', avatarLabel: 'Avatar',
      firstGreeting: '¡Bienvenida, ', returnGreeting: '¡Bienvenida de nuevo, ', greetingSub: 'Continúa tu camino en Pilates en Casa.',
      progressTitle: 'Tu progreso', classes: '{current} de {total} clases completadas', progressAria: 'Progreso total',
      achievementsTitle: 'Tus logros', achievementCount: '{current} de {total}', achieved: 'Conseguido', locked: 'Bloqueado',
      achievementEyebrow: 'LOGRO', yourProgress: 'Tu progreso', understood: 'Entendido', viewAchievement: 'Ver cómo conseguir este logro',
      achievements: {
        first_lesson: ['Primeros Pasos', 'Completa tu primera clase.'], lesson_5: ['Creando el Hábito', 'Completa 5 clases.'],
        lesson_10: ['En Movimiento', 'Completa 10 clases.'], lesson_25: ['Más Fuerte Cada Día', 'Completa 20 clases.'],
        progress_25: ['Evolucionando', 'Completa el 25% del programa.'], lesson_50: ['Compromiso Contigo', 'Completa 40 clases.'],
        progress_50: ['Mitad del Camino', 'Completa el 50% del programa.'], lesson_75: ['Ejemplo de Constancia', 'Completa 60 clases.'],
        progress_75: ['Casi Lo Logras', 'Completa el 75% del programa.'], first_module: ['Primer Módulo Completado', 'Completa las 9 clases del primer módulo.'],
        wall_module: ['Especialista en Pared', 'Completa las 4 clases del módulo Pilates en la Pared.'],
        complete_pilates: ['Nivel Intermedio y Avanzado', 'Completa las 21 clases del módulo Pilates Intermedio y Avanzado.'],
        seven_days: ['Una Semana de Constancia', 'Practica durante 7 días consecutivos.'],
        thirty_days: ['Nueva Rutina', 'Practica durante 30 días consecutivos.'], full_program: ['Reina del Pilates', 'Completa las 89 clases del programa.']
      }
    },
    en: {
      brand: 'PILATES AT HOME', subtitle: 'with Daniela', logoAlt: 'Pilates at Home',
      onboardingTitle: 'Let’s get to know you!', onboardingIntro: 'Complete these details once to personalize your experience.',
      name: 'Name', namePlaceholder: 'Enter your name', age: 'Age', agePlaceholder: 'E.g. 55',
      weight: 'Weight (kg)', weightPlaceholder: 'E.g. 68', avatarLegend: 'Choose an avatar', optional: '(optional)',
      avatarHelp: 'If you do not choose one, we will show the first letter of your name.', swipe: 'Swipe to see more avatars →',
      continue: 'Continue', privacy: 'Your data is stored only in this browser.',
      nameError: 'Enter your name to continue.', ageError: 'Enter a valid age between 18 and 110.',
      weightError: 'Enter a valid weight between 20 and 300 kg.', saveError: 'We could not save your data in this browser. Please try again.',
      avatarTitle: 'Choose your avatar', avatarIntro: 'You can change it whenever you like.', useInitial: 'Use the initial of my name',
      cancel: 'Cancel', save: 'Save', close: 'Close', changeAvatar: 'Change avatar', avatarLabel: 'Avatar',
      firstGreeting: 'Welcome, ', returnGreeting: 'Welcome back, ', greetingSub: 'Continue your Pilates at Home journey.',
      progressTitle: 'Your progress', classes: '{current} of {total} classes completed', progressAria: 'Total progress',
      achievementsTitle: 'Your achievements', achievementCount: '{current} of {total}', achieved: 'Achieved', locked: 'Locked',
      achievementEyebrow: 'ACHIEVEMENT', yourProgress: 'Your progress', understood: 'Got it', viewAchievement: 'See how to earn this achievement',
      achievements: {
        first_lesson: ['First Steps', 'Complete your first class.'], lesson_5: ['Building a Habit', 'Complete 5 classes.'],
        lesson_10: ['In Motion', 'Complete 10 classes.'], lesson_25: ['Stronger Every Day', 'Complete 20 classes.'],
        progress_25: ['Making Progress', 'Complete 25% of the program.'], lesson_50: ['Commitment to Yourself', 'Complete 40 classes.'],
        progress_50: ['Halfway There', 'Complete 50% of the program.'], lesson_75: ['A Model of Consistency', 'Complete 60 classes.'],
        progress_75: ['Almost There', 'Complete 75% of the program.'], first_module: ['First Module Completed', 'Complete all 11 classes in the first module.'],
        wall_module: ['Wall Workout Expert', 'Complete all 34 classes in the Transform Your Body Against the Wall module.'],
        complete_pilates: ['Complete Transformation', 'Complete all 29 classes in the Complete Transformation with Pilates module.'],
        seven_days: ['A Week of Consistency', 'Practice for 7 consecutive days.'],
        thirty_days: ['New Routine', 'Practice for 30 consecutive days.'], full_program: ['Pilates Queen', 'Complete all 94 classes in the program.']
      }
    },
    fr: {
      brand: 'PILATES À LA MAISON', subtitle: 'avec Daniela', logoAlt: 'Pilates à la Maison',
      onboardingTitle: 'Faisons connaissance !', onboardingIntro: 'Renseignez ces informations une seule fois pour personnaliser votre expérience.',
      name: 'Nom', namePlaceholder: 'Saisissez votre nom', age: 'Âge', agePlaceholder: 'Ex. : 55',
      weight: 'Poids (kg)', weightPlaceholder: 'Ex. : 68', avatarLegend: 'Choisissez un avatar', optional: '(facultatif)',
      avatarHelp: 'Sans avatar, nous afficherons la première lettre de votre nom.', swipe: 'Faites glisser pour voir plus d’avatars →',
      continue: 'Continuer', privacy: 'Vos données sont enregistrées uniquement dans ce navigateur.',
      nameError: 'Saisissez votre nom pour continuer.', ageError: 'Saisissez un âge valide entre 18 et 110 ans.',
      weightError: 'Saisissez un poids valide entre 20 et 300 kg.', saveError: 'Impossible d’enregistrer vos données dans ce navigateur. Réessayez.',
      avatarTitle: 'Choisissez votre avatar', avatarIntro: 'Vous pouvez le modifier à tout moment.', useInitial: 'Utiliser l’initiale de mon nom',
      cancel: 'Annuler', save: 'Enregistrer', close: 'Fermer', changeAvatar: 'Changer d’avatar', avatarLabel: 'Avatar',
      firstGreeting: 'Bienvenue, ', returnGreeting: 'Bon retour, ', greetingSub: 'Poursuivez votre parcours de Pilates à la Maison.',
      progressTitle: 'Votre progression', classes: '{current} cours terminés sur {total}', progressAria: 'Progression totale',
      achievementsTitle: 'Vos réussites', achievementCount: '{current} sur {total}', achieved: 'Obtenu', locked: 'Bloqué',
      achievementEyebrow: 'RÉUSSITE', yourProgress: 'Votre progression', understood: 'Compris', viewAchievement: 'Voir comment obtenir cette réussite',
      achievements: {
        first_lesson: ['Premiers Pas', 'Terminez votre premier cours.'], lesson_5: ['Prise d’Habitude', 'Terminez 5 cours.'],
        lesson_10: ['En Mouvement', 'Terminez 10 cours.'], lesson_25: ['Plus Forte Chaque Jour', 'Terminez 20 cours.'],
        progress_25: ['En Progression', 'Terminez 25% du programme.'], lesson_50: ['Engagement envers Vous-même', 'Terminez 40 cours.'],
        progress_50: ['À Mi-Parcours', 'Terminez 50% du programme.'], lesson_75: ['Exemple de Constance', 'Terminez 60 cours.'],
        progress_75: ['Presque Arrivée', 'Terminez 75% du programme.'], first_module: ['Premier Module Terminé', 'Terminez les 11 cours du premier module.'],
        wall_module: ['Experte du Mur', 'Terminez les 34 cours du module Transformez Votre Corps au Mur.'],
        complete_pilates: ['Transformation Complète', 'Terminez les 29 cours du module Transformation Complète avec le Pilates.'],
        seven_days: ['Une Semaine de Régularité', 'Pratiquez pendant 7 jours consécutifs.'],
        thirty_days: ['Nouvelle Routine', 'Pratiquez pendant 30 jours consécutifs.'], full_program: ['Reine du Pilates', 'Terminez les 94 cours du programme.']
      }
    }
  };

  var INFO_TEXTS = {
    'pt-BR': {
      certificateTitle: 'Certificado de conclusão',
      certificateBody: 'Conclua todas as aulas para liberar e gerar o seu certificado.',
      comingTitle: 'Novas aulas em produção',
      comingBody: 'Estamos preparando novas aulas para você. Em breve elas estarão disponíveis.',
      ok: 'Entendi',
      certificateMeta: '94 aulas • Treinamento completo'
    },
    'pt-PT': {
      certificateTitle: 'Certificado de conclusão',
      certificateBody: 'Conclua todas as aulas para desbloquear e gerar o seu certificado.',
      comingTitle: 'Novas aulas em produção',
      comingBody: 'Estamos a preparar novas aulas para si. Em breve estarão disponíveis.',
      ok: 'Entendi',
      certificateMeta: '94 aulas • Formação completa'
    },
    es: {
      certificateTitle: 'Certificado de finalización',
      certificateBody: 'Completa todas las clases para desbloquear y generar tu certificado.',
      comingTitle: 'Nuevas clases en producción',
      comingBody: 'Estamos preparando nuevas clases para ti. Muy pronto estarán disponibles.',
      ok: 'Entendido',
      certificateMeta: '89 clases • Programa completo'
    },
    en: {
      certificateTitle: 'Certificate of completion',
      certificateBody: 'Complete every class to unlock and generate your certificate.',
      comingTitle: 'New classes in production',
      comingBody: 'We are preparing new classes for you. They will be available soon.',
      ok: 'Got it',
      certificateMeta: '94 classes • Complete program'
    },
    fr: {
      certificateTitle: 'Certificat d’achèvement',
      certificateBody: 'Terminez tous les cours pour débloquer et générer votre certificat.',
      comingTitle: 'Nouveaux cours en préparation',
      comingBody: 'Nous préparons de nouveaux cours pour vous. Ils seront bientôt disponibles.',
      ok: 'Compris',
      certificateMeta: '94 cours • Programme complet'
    }
  };

  var MODULE_GUIDE_TEXTS = {
    'pt-BR': {
      title: 'Como aproveitar suas aulas',
      body: 'Comece pelo Módulo 1 e siga as aulas na sequência. Pratique de 3 a 4 vezes por semana, fazendo de 1 a 3 aulas por dia e respeitando sempre o seu ritmo.',
      button: 'Vamos começar', close: 'Fechar'
    },
    'pt-PT': {
      title: 'Como aproveitar as suas aulas',
      body: 'Comece pelo Módulo 1 e siga as aulas pela ordem. Pratique 3 a 4 vezes por semana, fazendo de 1 a 3 aulas por dia e respeitando sempre o seu ritmo.',
      button: 'Vamos começar', close: 'Fechar'
    },
    es: {
      title: 'Cómo aprovechar tus clases',
      body: 'Comienza por el Módulo 1 y sigue las clases en orden. Practica de 3 a 4 veces por semana, haciendo de 1 a 3 clases al día y respetando siempre tu ritmo.',
      button: 'Vamos a empezar', close: 'Cerrar'
    },
    en: {
      title: 'How to get the most from your classes',
      body: 'Start with Module 1 and follow the classes in order. Practice 3 to 4 times a week, completing 1 to 3 classes a day while always respecting your own pace.',
      button: 'Let’s begin', close: 'Close'
    },
    fr: {
      title: 'Comment profiter pleinement de vos cours',
      body: 'Commencez par le Module 1 et suivez les cours dans l’ordre. Pratiquez 3 à 4 fois par semaine, à raison de 1 à 3 cours par jour, tout en respectant votre rythme.',
      button: 'Commençons', close: 'Fermer'
    }
  };

  var CERTIFICATE_TEXTS = {
    'pt-BR': {
      title: 'Certificado de Conclusão', certify: 'Certificamos que',
      completion: 'concluiu com êxito o programa', program: 'Pilates em Casa',
      meta: '94 aulas • Treinamento completo', date: 'Data de conclusão', instructor: 'Instrutora'
    },
    'pt-PT': {
      title: 'Certificado de Conclusão', certify: 'Certificamos que',
      completion: 'concluiu com êxito o programa', program: 'Pilates em Casa',
      meta: '94 aulas • Formação completa', date: 'Data de conclusão', instructor: 'Instrutora'
    },
    es: {
      title: 'Certificado de Finalización', certify: 'Certificamos que',
      completion: 'completó con éxito el programa', program: 'Pilates en Casa',
      meta: '89 clases • Programa completo', date: 'Fecha de finalización', instructor: 'Instructora'
    },
    en: {
      title: 'Certificate of Completion', certify: 'This certifies that',
      completion: 'successfully completed the program', program: 'Pilates at Home',
      meta: '94 classes • Complete program', date: 'Completion date', instructor: 'Instructor'
    },
    fr: {
      title: 'Certificat d’Achèvement', certify: 'Nous certifions que',
      completion: 'a terminé avec succès le programme', program: 'Pilates à la Maison',
      meta: '94 cours • Programme complet', date: 'Date d’achèvement', instructor: 'Instructrice'
    }
  };

  function getLang() {
    return 'es';
  }

  function i18n() {
    return UI_TEXTS[getLang()] || UI_TEXTS.es;
  }

  function infoI18n() {
    return INFO_TEXTS[getLang()] || INFO_TEXTS.es;
  }

  function certificateI18n() {
    return CERTIFICATE_TEXTS[getLang()] || CERTIFICATE_TEXTS.es;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
    });
  }

  function formatText(template, values) {
    return Object.keys(values || {}).reduce(function (text, key) {
      return text.replace('{' + key + '}', String(values[key]));
    }, template);
  }

  var ACHIEVEMENT_DETAILS = {
    first_lesson: {
      icon: '🌸',
      kind: 'classes',
      target: 1
    },
    lesson_5: {
      icon: '🌱',
      kind: 'classes',
      target: 5
    },
    lesson_10: {
      icon: '🚶‍♀️',
      kind: 'classes',
      target: 10
    },
    lesson_25: {
      icon: '💪',
      kind: 'classes',
      target: 20
    },
    progress_25: {
      icon: '✨',
      kind: 'classes',
      target: 23
    },
    lesson_50: {
      icon: '💜',
      kind: 'classes',
      target: 40
    },
    progress_50: {
      icon: '💜',
      kind: 'classes',
      target: 45
    },
    lesson_75: {
      icon: '⭐',
      kind: 'classes',
      target: 60
    },
    progress_75: {
      icon: '🌟',
      kind: 'classes',
      target: 67
    },
    first_module: {
      icon: '🏅',
      kind: 'module',
      module: 1,
      target: 9
    },
    wall_module: {
      icon: '🧱',
      kind: 'module',
      module: 3,
      target: 4
    },
    complete_pilates: {
      icon: '👑',
      kind: 'module',
      module: 6,
      target: 21
    },
    seven_days: {
      icon: '📅',
      kind: 'streak',
      target: 7
    },
    thirty_days: {
      icon: '🏆',
      kind: 'streak',
      target: 30
    },
    full_program: {
      icon: '👑',
      kind: 'classes',
      target: 89
    }
  };

  var ACHIEVEMENT_ORDER = [
    'first_lesson', 'lesson_5', 'lesson_10', 'lesson_25', 'progress_25',
    'lesson_50', 'progress_50', 'lesson_75', 'progress_75', 'first_module',
    'wall_module', 'complete_pilates', 'seven_days', 'thirty_days', 'full_program'
  ];

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
    var text = i18n();
    var html = '';
    for (var index = 1; index <= AVATAR_COUNT; index += 1) {
      var id = 'avatar-' + String(index).padStart(2, '0');
      html += '<button type="button" class="pq-avatar-option' +
        (selectedAvatar === id ? ' is-selected' : '') +
        '" data-avatar="' + id + '" aria-label="' + text.avatarLabel + ' ' + index +
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
    var text = i18n();
    var selectedAvatar = normalizeAvatar(raw.avatar);
    var overlay = document.createElement('div');
    overlay.id = 'pq-profile-onboarding';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'pq-onboarding-title');
    overlay.innerHTML =
      '<div class="pq-onboarding-card">' +
        '<div class="pq-onboarding-brand">' +
          '<img src="/logo-pilates-en-casa.webp" alt="' + text.logoAlt + '">' +
          '<div><strong>' + text.brand + '</strong><span>' + text.subtitle + '</span></div>' +
        '</div>' +
        '<form id="pq-onboarding-form" novalidate>' +
          '<h1 id="pq-onboarding-title">' + text.onboardingTitle + '</h1>' +
          '<p class="pq-onboarding-intro">' + text.onboardingIntro + '</p>' +
          '<div class="pq-profile-fields">' +
            '<div class="pq-profile-field pq-profile-field-name">' +
              '<label for="pq-profile-name">' + text.name + '</label>' +
              '<input id="pq-profile-name" name="nombre" type="text" maxlength="60" autocomplete="name" placeholder="' + text.namePlaceholder + '" required>' +
            '</div>' +
            '<div class="pq-profile-field">' +
              '<label for="pq-profile-age">' + text.age + '</label>' +
              '<input id="pq-profile-age" name="edad" type="number" inputmode="numeric" min="18" max="110" step="1" placeholder="' + text.agePlaceholder + '" required>' +
            '</div>' +
            '<div class="pq-profile-field">' +
              '<label for="pq-profile-weight">' + text.weight + '</label>' +
              '<input id="pq-profile-weight" name="peso" type="number" inputmode="decimal" min="20" max="300" step="0.1" placeholder="' + text.weightPlaceholder + '" required>' +
            '</div>' +
          '</div>' +
          '<fieldset class="pq-avatar-fieldset">' +
            '<legend>' + text.avatarLegend + ' <span>' + text.optional + '</span></legend>' +
            '<p>' + text.avatarHelp + '</p>' +
            '<div class="pq-avatar-grid" id="pq-onboarding-avatars">' +
              avatarButtons(selectedAvatar) +
            '</div>' +
            '<p class="pq-avatar-swipe-hint">' + text.swipe + '</p>' +
          '</fieldset>' +
          '<p class="pq-onboarding-error" id="pq-onboarding-error" role="alert" aria-live="polite"></p>' +
          '<button class="pq-primary-button" type="submit">' + text.continue + '</button>' +
          '<p class="pq-onboarding-privacy">' + text.privacy + '</p>' +
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
        errorMessage.textContent = text.nameError;
        nameInput.focus();
        return;
      }
      if (!Number.isFinite(age) || age < 18 || age > 110 || Math.round(age) !== age) {
        errorMessage.textContent = text.ageError;
        ageInput.focus();
        return;
      }
      if (!Number.isFinite(weight) || weight < 20 || weight > 300) {
        errorMessage.textContent = text.weightError;
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
        errorMessage.textContent = text.saveError;
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

    var text = i18n();
    modal = document.createElement('div');
    modal.id = 'pq-avatar-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'pq-avatar-modal-title');
    modal.innerHTML =
      '<div class="pq-avatar-card">' +
        '<button type="button" class="pq-modal-close" aria-label="' + text.close + '">×</button>' +
        '<div class="pq-modal-leaf" aria-hidden="true">' +
          '<svg viewBox="0 0 32 32"><path d="M16.2 26.5c-.3-7.8 2.6-13.6 8.5-17.5"></path><path d="M16.7 20.5C11.2 20.1 7.2 17 5 11.2c5.7-1 10.2.7 12.9 5.1"></path><path d="M18.7 15.1c.8-5.3 4-8.4 9.1-9.6.6 5.5-1.8 9.3-7.1 11.2"></path></svg>' +
        '</div>' +
        '<h2 id="pq-avatar-modal-title">' + text.avatarTitle + '</h2>' +
        '<p>' + text.avatarIntro + '</p>' +
        '<button type="button" class="pq-use-initial pq-avatar-option" data-avatar="" aria-pressed="false">' +
          '<span class="pq-initial-preview">A</span>' +
          '<span>' + text.useInitial + '</span>' +
          '<span class="pq-avatar-check" aria-hidden="true">✓</span>' +
        '</button>' +
        '<div class="pq-avatar-grid" id="pq-avatar-modal-grid"></div>' +
        '<p class="pq-avatar-swipe-hint">' + text.swipe + '</p>' +
        '<div class="pq-modal-actions">' +
          '<button type="button" class="pq-secondary-button" data-action="cancel">' + text.cancel + '</button>' +
          '<button type="button" class="pq-primary-button" data-action="save">' + text.save + '</button>' +
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

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function ensureGreeting(home, profile, text) {
    var journey = document.getElementById('pq-journey-card');
    if (!journey) return;
    var greeting = document.getElementById('pq-profile-greeting');
    if (!greeting) {
      greeting = document.createElement('section');
      greeting.id = 'pq-profile-greeting';
      greeting.setAttribute('aria-live', 'polite');
      greeting.innerHTML =
        '<div class="pq-greeting-icon" aria-hidden="true"></div>' +
        '<div class="pq-greeting-copy"><h2></h2><p></p></div>';
      journey.insertAdjacentElement('beforebegin', greeting);
    }
    var signature = getLang() + '|' + profile.nombre + '|' + (window.__pqFirstVisitGreeting ? 'first' : 'return');
    if (greeting.getAttribute('data-pq-copy-signature') === signature) return;
    greeting.setAttribute('data-pq-copy-signature', signature);
    var title = greeting.querySelector('h2');
    var prefix = window.__pqFirstVisitGreeting ? text.firstGreeting : text.returnGreeting;
    title.textContent = prefix;
    var name = document.createElement('span');
    name.textContent = firstName(profile.nombre);
    title.appendChild(name);
    title.appendChild(document.createTextNode('!'));
    greeting.querySelector('p').textContent = text.greetingSub;
  }

  function ensureGlobalProgress(home, text) {
    var journey = document.getElementById('pq-journey-card');
    if (!journey) return;
    var completed = Math.min(completedClassCount(), TOTAL_CLASSES);
    var percent = TOTAL_CLASSES ? Math.round(completed / TOTAL_CLASSES * 100) : 0;
    var progress = document.getElementById('pq-global-progress');
    if (!progress) {
      progress = document.createElement('section');
      progress.id = 'pq-global-progress';
      progress.setAttribute('aria-labelledby', 'pq-global-progress-title');
      journey.insertAdjacentElement('afterend', progress);
    }
    var signature = getLang() + '|' + completed + '|' + TOTAL_CLASSES;
    if (progress.getAttribute('data-pq-copy-signature') === signature) return;
    progress.setAttribute('data-pq-copy-signature', signature);
    var classText = formatText(text.classes, { current: completed, total: TOTAL_CLASSES });
    progress.innerHTML =
      '<div class="pq-progress-head"><div><h2 id="pq-global-progress-title">' + escapeHtml(text.progressTitle) +
      '</h2><p><strong>' + completed + '</strong> ' +
      escapeHtml(classText.replace(String(completed), '').trim()) +
      '</p></div><span class="pq-progress-percent">' + percent + '%</span></div>' +
      '<div class="pq-progress-track" role="progressbar" aria-label="' + escapeHtml(text.progressAria) +
      '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + percent +
      '" aria-valuetext="' + escapeHtml(classText) + '"><span style="width:' + percent + '%"></span></div>';
  }

  function ensureAchievements(home, text) {
    var grid = document.getElementById('pq-modules-grid');
    var certificate = grid && grid.querySelector('[data-pq-certificate-card]');
    if (!grid || !certificate) return;
    var section = document.getElementById('pq-achievements');
    if (!section) {
      section = document.createElement('section');
      section.id = 'pq-achievements';
      section.setAttribute('aria-labelledby', 'pq-achievements-title');
      grid.insertBefore(section, certificate);
    }
    var unlocked = safeJson(ACHIEVEMENTS_KEY, []);
    unlocked = Array.isArray(unlocked) ? unlocked : [];
    var signature = getLang() + '|' + unlocked.slice().sort().join(',');
    if (section.getAttribute('data-pq-copy-signature') === signature) return;
    section.setAttribute('data-pq-copy-signature', signature);
    var unlockedSet = new Set(unlocked);
    var cards = ACHIEVEMENT_ORDER.map(function (id) {
      var detail = ACHIEVEMENT_DETAILS[id];
      var localized = text.achievements[id] || [id, ''];
      var isUnlocked = unlockedSet.has(id);
      var stateIcon = isUnlocked
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 12 2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
      return '<article class="pq-achievement-card' + (isUnlocked ? ' is-unlocked' : ' is-locked') +
        '" data-achievement-id="' + id + '" aria-label="' + escapeHtml(localized[0] + '. ' +
        (isUnlocked ? text.achieved : text.locked)) + '">' +
        (isUnlocked ? '<div class="pq-achievement-state">' + stateIcon + '</div>' : '') +
        '<div class="pq-achievement-icon" aria-hidden="true">' + detail.icon + '</div>' +
        '<h3>' + escapeHtml(localized[0]) + '</h3>' +
        (!isUnlocked ? '<div class="pq-achievement-state">' + stateIcon + '</div>' : '') +
        '<span class="pq-achievement-label">' + escapeHtml(isUnlocked ? text.achieved : text.locked) + '</span>' +
        '</article>';
    }).join('');
    section.innerHTML =
      '<div class="pq-achievements-heading"><h2 id="pq-achievements-title">' + escapeHtml(text.achievementsTitle) +
      '</h2><span class="pq-achievements-count">' + escapeHtml(formatText(text.achievementCount, {
        current: ACHIEVEMENT_ORDER.filter(function (id) { return unlockedSet.has(id); }).length,
        total: ACHIEVEMENT_ORDER.length
      })) + '</span></div><div class="pq-achievements-grid">' + cards + '</div>';
  }

  function ensureHomeEnhancements() {
    var home = document.querySelector('[data-pq-view="home"]');
    var profile = readProfile();
    if (!home || !profile) return;
    var text = i18n();
    ensureGreeting(home, profile, text);
    ensureGlobalProgress(home, text);
    ensureAchievements(home, text);
  }

  function ensureAchievementModal() {
    var modal = document.getElementById('pq-achievement-modal');
    if (modal) return modal;

    var text = i18n();
    modal = document.createElement('div');
    modal.id = 'pq-achievement-modal';
    modal.className = 'pq-v8-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'pq-achievement-detail-title');
    modal.innerHTML =
      '<div class="pq-achievement-detail-card">' +
        '<button type="button" class="pq-modal-close" aria-label="' + text.close + '">×</button>' +
        '<div class="pq-achievement-detail-icon" aria-hidden="true"></div>' +
        '<p class="pq-achievement-eyebrow">' + text.achievementEyebrow + '</p>' +
        '<h2 id="pq-achievement-detail-title"></h2>' +
        '<p class="pq-achievement-requirement"></p>' +
        '<div class="pq-achievement-detail-progress">' +
          '<div class="pq-achievement-detail-progress-copy"><span>' + text.yourProgress + '</span><strong></strong></div>' +
          '<div class="pq-achievement-detail-track" role="progressbar" aria-valuemin="0" aria-valuemax="100"><span></span></div>' +
        '</div>' +
        '<div class="pq-achievement-detail-status"></div>' +
        '<button type="button" class="pq-primary-button" data-action="close">' + text.understood + '</button>' +
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
    var text = i18n();
    var localized = text.achievements[id] || [id, ''];
    var progress = achievementProgress(detail);
    var modal = ensureAchievementModal();
    var track = modal.querySelector('.pq-achievement-detail-track');
    var status = modal.querySelector('.pq-achievement-detail-status');

    modal.querySelector('.pq-achievement-detail-icon').textContent = detail.icon;
    modal.querySelector('#pq-achievement-detail-title').textContent = localized[0];
    modal.querySelector('.pq-achievement-requirement').textContent = localized[1];
    modal.querySelector('.pq-achievement-detail-progress-copy strong').textContent =
      progress.current + ' de ' + progress.target;
    track.setAttribute('aria-valuenow', String(progress.percent));
    track.setAttribute('aria-valuetext', progress.current + ' de ' + progress.target);
    track.querySelector('span').style.width = progress.percent + '%';
    status.textContent = progress.complete ? '✓ ' + text.achieved : text.locked;
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

  function ensureInfoModal() {
    var modal = document.getElementById('pq-info-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'pq-info-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'pq-info-title');
    modal.innerHTML =
      '<div class="pq-info-card">' +
        '<button type="button" class="pq-info-close" aria-label="Fechar">×</button>' +
        '<div class="pq-info-icon" aria-hidden="true"></div>' +
        '<h2 id="pq-info-title"></h2>' +
        '<p class="pq-info-copy"></p>' +
        '<button type="button" id="pq-info-ok"></button>' +
      '</div>';
    document.body.appendChild(modal);
    modal.querySelector('.pq-info-close').addEventListener('click', closeInfoModal);
    modal.querySelector('#pq-info-ok').addEventListener('click', closeInfoModal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeInfoModal();
    });
    return modal;
  }

  function openInfoModal(kind) {
    var text = infoI18n();
    var modal = ensureInfoModal();
    var isCertificate = kind === 'certificate';
    modal.querySelector('.pq-info-icon').textContent = isCertificate ? '🏆' : '🧘‍♀️';
    modal.querySelector('#pq-info-title').textContent = isCertificate ? text.certificateTitle : text.comingTitle;
    modal.querySelector('.pq-info-copy').textContent = isCertificate ? text.certificateBody : text.comingBody;
    modal.querySelector('#pq-info-ok').textContent = text.ok;
    modal.classList.add('pq-visible');
    document.documentElement.classList.add('pq-modal-open');
    document.body.classList.add('pq-modal-open');
    window.setTimeout(function () { modal.querySelector('#pq-info-ok').focus(); }, 20);
  }

  function closeInfoModal() {
    var modal = document.getElementById('pq-info-modal');
    if (!modal) return;
    modal.classList.remove('pq-visible');
    if (!document.querySelector('#pq-avatar-modal.pq-visible, #pq-achievement-modal.pq-visible')) {
      document.documentElement.classList.remove('pq-modal-open');
      document.body.classList.remove('pq-modal-open');
    }
  }

  function hasSeenModuleGuide() {
    if (moduleGuideSeenThisSession) return true;
    try {
      return localStorage.getItem(MODULE_GUIDE_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function rememberModuleGuide() {
    moduleGuideSeenThisSession = true;
    try {
      localStorage.setItem(MODULE_GUIDE_KEY, '1');
    } catch (error) {
      // A confirmação continua válida durante esta sessão quando o armazenamento está indisponível.
    }
  }

  function ensureModuleGuideModal() {
    var modal = document.getElementById('pq-module-guide-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'pq-module-guide-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'pq-module-guide-title');
    modal.innerHTML =
      '<div class="pq-module-guide-card">' +
        '<button type="button" class="pq-module-guide-close" aria-label="Fechar">×</button>' +
        '<div class="pq-module-guide-icon" aria-hidden="true">' +
          '<svg viewBox="0 0 32 32" fill="none"><path d="M7 25c7-1 12-6 14-15"></path><path d="M15 17c-5 0-8-2-10-6 5-1 9 1 11 5"></path><path d="M19 13c1-5 4-8 9-9 0 5-2 9-7 11"></path></svg>' +
        '</div>' +
        '<h2 id="pq-module-guide-title"></h2>' +
        '<p class="pq-module-guide-copy"></p>' +
        '<button type="button" id="pq-module-guide-start"></button>' +
      '</div>';
    document.body.appendChild(modal);
    modal.querySelector('.pq-module-guide-close').addEventListener('click', function () {
      closeModuleGuide(false);
    });
    modal.querySelector('#pq-module-guide-start').addEventListener('click', function () {
      closeModuleGuide(true);
    });
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeModuleGuide(false);
    });
    return modal;
  }

  function openModuleGuide(card) {
    if (IS_DEMO || hasSeenModuleGuide()) return false;
    var text = MODULE_GUIDE_TEXTS[getLang()] || MODULE_GUIDE_TEXTS.es;
    var modal = ensureModuleGuideModal();
    pendingModuleCard = card;
    rememberModuleGuide();
    modal.querySelector('.pq-module-guide-close').setAttribute('aria-label', text.close);
    modal.querySelector('#pq-module-guide-title').textContent = text.title;
    modal.querySelector('.pq-module-guide-copy').textContent = text.body;
    modal.querySelector('#pq-module-guide-start').textContent = text.button;
    modal.classList.add('pq-visible');
    document.documentElement.classList.add('pq-modal-open');
    document.body.classList.add('pq-modal-open');
    window.setTimeout(function () { modal.querySelector('#pq-module-guide-start').focus(); }, 30);
    return true;
  }

  function closeModuleGuide(navigate) {
    var modal = document.getElementById('pq-module-guide-modal');
    var target = pendingModuleCard;
    pendingModuleCard = null;
    if (modal) modal.classList.remove('pq-visible');
    if (!document.querySelector('#pq-avatar-modal.pq-visible, #pq-achievement-modal.pq-visible, #pq-info-modal.pq-visible')) {
      document.documentElement.classList.remove('pq-modal-open');
      document.body.classList.remove('pq-modal-open');
    }
    if (navigate && target && target.isConnected) {
      window.setTimeout(function () { target.click(); }, 20);
    }
  }

  function decorateCertificate() {
    var certificate = document.getElementById('cert-card');
    if (!certificate || certificate.getAttribute('data-pq-model') === 'classic') return;
    var originalName = certificate.querySelector('div[style*="font-size: 30px"]');
    var originalDate = certificate.querySelector('div[style*="font-size: 15px"][style*="font-weight: 600"]');
    var name = originalName ? originalName.textContent.trim() : '';
    var date = originalDate ? originalDate.textContent.trim() : '';
    var text = certificateI18n();
    certificate.setAttribute('data-pq-model', 'classic');
    certificate.setAttribute('aria-label', text.title);
    certificate.innerHTML =
      '<div class="pq-certificate-classic">' +
        '<div class="pq-certificate-watermark" aria-hidden="true">✦</div>' +
        '<img class="pq-certificate-logo" src="/logo-pilates-en-casa.webp" alt="" aria-hidden="true">' +
        '<h1>' + escapeHtml(text.title) + '</h1>' +
        '<div class="pq-certificate-ornament" aria-hidden="true"><span></span><b>◆</b><span></span></div>' +
        '<p class="pq-certificate-certify">' + escapeHtml(text.certify) + '</p>' +
        '<p class="pq-certificate-name">' + escapeHtml(name) + '</p>' +
        '<p class="pq-certificate-completion">' + escapeHtml(text.completion) + '</p>' +
        '<h2>' + escapeHtml(text.program) + '</h2>' +
        '<p class="pq-certificate-meta">' + escapeHtml(text.meta) + '</p>' +
        '<div class="pq-certificate-footer">' +
          '<div><strong>' + escapeHtml(date) + '</strong><span>' + escapeHtml(text.date) + '</span></div>' +
          '<div class="pq-certificate-seal" aria-hidden="true">P</div>' +
          '<div><strong>Daniela</strong><span>' + escapeHtml(text.instructor) + '</span></div>' +
        '</div>' +
      '</div>';
  }

  function decorateInfoCards() {
    var comingSoon = document.getElementById('pq-coming-soon-card');
    if (comingSoon) {
      comingSoon.setAttribute('role', 'button');
      comingSoon.setAttribute('tabindex', '0');
      comingSoon.setAttribute('aria-disabled', 'false');
    }
    var certificate = document.querySelector('[data-pq-certificate-card]');
    if (certificate && !certificate.querySelector('button')) {
      certificate.setAttribute('role', 'button');
      certificate.setAttribute('tabindex', '0');
    }
  }

  function decorateGreeting() {
    var profile = readProfile();
    var greeting = document.getElementById('pq-profile-greeting');
    if (!profile || !greeting) return;
    var text = i18n();
    var icon = greeting.querySelector('.pq-greeting-icon');
    if (!icon) return;

    icon.setAttribute('role', 'button');
    icon.setAttribute('tabindex', '0');
    icon.setAttribute('aria-label', text.changeAvatar);
    icon.setAttribute('title', text.changeAvatar);

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
    var text = i18n();
    document.querySelectorAll('.pq-achievement-card[data-achievement-id]').forEach(function (card) {
      var id = card.getAttribute('data-achievement-id');
      if (!ACHIEVEMENT_DETAILS[id]) return;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('title', text.viewAchievement);
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
    var localized = {
      'pt-BR': ['Intensidade', 'Suave', 'Moderada', 'Desafiadora'],
      'pt-PT': ['Intensidade', 'Suave', 'Moderada', 'Desafiante'],
      es: ['Intensidad', 'Suave', 'Moderada', 'Desafiante'],
      en: ['Intensity', 'Gentle', 'Moderate', 'Challenging'],
      fr: ['Intensité', 'Douce', 'Modérée', 'Soutenue']
    }[getLang()] || ['Intensidade', 'Suave', 'Moderada', 'Desafiadora'];

    document.querySelectorAll('[data-pq-view="module"] span').forEach(function (element) {
      var colorDot = element.firstElementChild;
      if (!colorDot || !/rounded-full/.test(colorDot.getAttribute('class') || '')) return;
      var text = element.getAttribute('data-pq-intensity-raw') || element.textContent || '';
      if (!/(Nível|Nivel|Level|Niveau|Intensidade|Intensidad|Intensity|Intensité)\s*:/i.test(text)) return;
      element.classList.add('pq-intensity');
      element.classList.remove('pq-intensity-soft', 'pq-intensity-moderate', 'pq-intensity-challenging');
      var levelIndex = 3;
      if (/(suave|gentle|douce|tranquil)/i.test(text)) {
        element.classList.add('pq-intensity-soft');
        levelIndex = 1;
      } else if (/(moderad|moderate|modérée)/i.test(text)) {
        element.classList.add('pq-intensity-moderate');
        levelIndex = 2;
      } else {
        element.classList.add('pq-intensity-challenging');
      }
      element.setAttribute('data-pq-intensity-raw', text);
      var label = element.children[1];
      if (label && label.getAttribute('data-pq-intensity-signature') !== getLang() + '-' + levelIndex) {
        label.textContent = localized[0] + ': ' + localized[levelIndex];
        label.setAttribute('data-pq-intensity-signature', getLang() + '-' + levelIndex);
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
    ensureHomeEnhancements();
    decorateGreeting();
    decorateAchievements();
    decorateIntensity();
    decorateBonusCards();
    decorateCertificate();
    decorateInfoCards();
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
        if (key === PROFILE_KEY || key === PROGRESS_KEY || key === 'pilates_lang' ||
            key === ACHIEVEMENTS_KEY || key === STREAK_KEY) {
          window.dispatchEvent(new CustomEvent('pilates:local-data', { detail: { key: key } }));
        }
      };
    } catch (error) {
      // El navegador seguirá funcionando aunque no permita interceptar el almacenamiento.
    }
  }

  function refreshLocalizedUi() {
    var avatarModal = document.getElementById('pq-avatar-modal');
    var achievementModal = document.getElementById('pq-achievement-modal');
    if (avatarModal && !avatarModal.classList.contains('pq-visible')) avatarModal.remove();
    if (achievementModal && !achievementModal.classList.contains('pq-visible')) achievementModal.remove();
    ensureAvatarModal();
    ensureAchievementModal();
    scheduleDecorate();
  }

  function init() {
    interceptLocalStorage();
    ensureAvatarModal();
    ensureAchievementModal();
    ensureInfoModal();
    ensureModuleGuideModal();
    window.addEventListener('pilates:auth', profileGate);
    window.addEventListener('pilates:profile-updated', scheduleDecorate);
    window.addEventListener('pilates:lang', refreshLocalizedUi);
    window.addEventListener('pilates:local-data', function (event) {
      if (event.detail && event.detail.key === 'pilates_lang') refreshLocalizedUi();
      else scheduleDecorate();
    });
    window.addEventListener('storage', function (event) {
      if (event.key === 'pilates_lang') refreshLocalizedUi();
      else if (event.key === PROFILE_KEY || event.key === PROGRESS_KEY ||
          event.key === ACHIEVEMENTS_KEY || event.key === STREAK_KEY) {
        scheduleDecorate();
      }
    });
    document.addEventListener('click', function (event) {
      if (event.target.closest('[role="option"]')) window.setTimeout(refreshLocalizedUi, 30);
    }, true);
    document.addEventListener('click', function (event) {
      var moduleCard = event.target.closest('[data-pq-module-card]');
      if (!moduleCard || IS_DEMO || hasSeenModuleGuide()) return;
      if (openModuleGuide(moduleCard)) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      }
    }, true);
    document.addEventListener('click', function (event) {
      var comingSoon = event.target.closest('#pq-coming-soon-card');
      if (comingSoon) {
        event.preventDefault();
        event.stopPropagation();
        openInfoModal('coming');
        return;
      }
      var certificate = event.target.closest('[data-pq-certificate-card]');
      if (certificate && !certificate.querySelector('button')) {
        event.preventDefault();
        event.stopPropagation();
        openInfoModal('certificate');
      }
    }, true);
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (document.getElementById('pq-avatar-modal').classList.contains('pq-visible')) {
        closeAvatarModal();
      } else if (document.getElementById('pq-achievement-modal').classList.contains('pq-visible')) {
        closeAchievementModal();
      } else if (document.getElementById('pq-info-modal').classList.contains('pq-visible')) {
        closeInfoModal();
      } else if (document.getElementById('pq-module-guide-modal').classList.contains('pq-visible')) {
        closeModuleGuide(false);
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      var target = event.target;
      if (target && target.id === 'pq-coming-soon-card') {
        event.preventDefault();
        openInfoModal('coming');
      } else if (target && target.matches('[data-pq-certificate-card]') && !target.querySelector('button')) {
        event.preventDefault();
        openInfoModal('certificate');
      }
    });
    new MutationObserver(scheduleDecorate).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
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
