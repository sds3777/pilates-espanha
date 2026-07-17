(function () {
  // ─── Modo Demonstração (/teste) ────────────────────────────────────────
  // Ativado somente quando a rota é /teste. Roda totalmente à parte do
  // React e do quiz.js: não faz login, não chama /api/verificar-acesso,
  // não toca no Supabase. Mostra uma vitrine própria com 1 aula liberada
  // no Módulo 1, 1 aula liberada no Módulo 2, demais módulos bloqueados,
  // e 2 primeiros bônus liberados, resto bloqueado. Clique em qualquer
  // item bloqueado abre o modal de oferta com CTA para o WhatsApp.
  if (window.location.pathname.replace(/\/+$/, '') !== '/teste') return;

  var WHATSAPP_NUMERO = '5519982532156';
  var WHATSAPP_MSG = 'Eu quero';

  var MODULOS = [
    { numero: 1, capa: '/capa1.png', aulasLiberadas: 1, totalAulas: 12 },
    { numero: 2, capa: '/capa2.png', aulasLiberadas: 1, totalAulas: 12 },
    { numero: 3, capa: '/capa3.png', aulasLiberadas: 0, totalAulas: 12 },
    { numero: 4, capa: '/capa4.png', aulasLiberadas: 0, totalAulas: 12 },
    { numero: 5, capa: '/capa5.png', aulasLiberadas: 0, totalAulas: 12 }
  ];

  var BONUS_DEMO = [
    { titulo: 'Guia Xô, Ansiedade', capa: null, liberado: true },
    { titulo: 'Doces e Sobremesas Zero', capa: null, liberado: true },
    { titulo: 'Chá Caseiro Mounjaro Natural', capa: null, liberado: false },
    { titulo: 'Sucos Detox Saudáveis', capa: null, liberado: false },
    { titulo: '55 Receitas Sem Glúten na Airfryer', capa: null, liberado: false },
    { titulo: 'Guia Alimentar Diabéticos', capa: null, liberado: false }
  ];

  // Evita que qualquer script de auth normal (quiz.js) tente rodar login
  // por cima do modo demo — quiz.js só é carregado nesta página se ainda
  // estiver referenciado no HTML; para segurança extra, sinalizamos aqui.
  window.__pqModoDemo = true;

  function montarLayout() {
    document.body.innerHTML = '';
    document.body.style.cssText = 'margin:0;background:#0d0720;min-height:100vh;font-family:Inter,system-ui,sans-serif;';

    var wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:480px;margin:0 auto;padding:20px 16px 90px;';

    wrap.appendChild(criarHeader());
    wrap.appendChild(criarSecaoModulos());
    wrap.appendChild(criarSecaoBonus());

    document.body.appendChild(wrap);
    document.body.appendChild(criarNavDemo());
  }

  function criarHeader() {
    var header = document.createElement('div');
    header.style.cssText = 'text-align:center;padding:16px 0 24px;';
    header.innerHTML =
      '<h1 style="color:#d4af37;font-family:Cinzel,serif;font-size:20px;font-weight:700;letter-spacing:1.5px;margin:0 0 4px;">PILATES EM CASA</h1>'
      + '<p style="color:#9b7ec8;font-size:13px;margin:0;">Modo demonstração</p>';
    return header;
  }

  function criarCadeadoOverlay() {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(13,7,24,0.55);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);';
    overlay.innerHTML =
      '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
      + '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>'
      + '<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>'
      + '</svg>'
      + '<span style="color:#d4af37;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Bloqueado</span>';
    return overlay;
  }

  function criarSecaoModulos() {
    var sec = document.createElement('div');
    sec.style.cssText = 'margin-bottom:32px;';
    sec.innerHTML = '<h2 style="color:#fff;font-size:16px;font-weight:700;margin:0 0 12px;">Minhas Aulas</h2>';

    MODULOS.forEach(function (mod) {
      var card = document.createElement('div');
      card.style.cssText = 'position:relative;background:rgba(42,26,64,0.45);border:1px solid rgba(212,175,55,0.2);border-radius:16px;overflow:hidden;margin-bottom:14px;';

      var capaWrap = document.createElement('div');
      capaWrap.style.cssText = 'position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:#2a1a40;';
      capaWrap.innerHTML =
        '<span style="position:absolute;top:8px;left:8px;z-index:1;background:#d4af37;color:#1a0a20;font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;">MÓDULO ' + mod.numero + '</span>'
        + '<img src="' + mod.capa + '" alt="Módulo ' + mod.numero + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'">';

      card.appendChild(capaWrap);

      var infoWrap = document.createElement('div');
      infoWrap.style.cssText = 'padding:12px 14px 14px;';

      if (mod.aulasLiberadas > 0) {
        infoWrap.innerHTML = '<p style="color:#fff;font-size:13px;font-weight:600;margin:0 0 2px;">' + mod.aulasLiberadas + ' de ' + mod.totalAulas + ' aulas liberadas na demonstração</p>'
          + '<p style="color:#9b7ec8;font-size:12px;margin:0;">Toque para assistir a aula liberada</p>';
        card.style.cursor = 'pointer';
        card.addEventListener('click', function () { abrirModalOferta(); });
      } else {
        infoWrap.innerHTML = '<p style="color:#9b7ec8;font-size:13px;font-weight:600;margin:0;">' + mod.totalAulas + ' aulas — desbloqueie o acesso completo</p>';
        capaWrap.style.filter = 'blur(3px)';
        capaWrap.appendChild(criarCadeadoOverlay());
        card.style.cursor = 'pointer';
        card.addEventListener('click', function () { abrirModalOferta(); });
      }

      card.appendChild(infoWrap);
      sec.appendChild(card);
    });

    return sec;
  }

  function criarSecaoBonus() {
    var sec = document.createElement('div');
    sec.innerHTML = '<h2 style="color:#fff;font-size:16px;font-weight:700;margin:0 0 12px;">🎁 Bônus Exclusivos</h2>';

    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px;';

    BONUS_DEMO.forEach(function (bonus) {
      var card = document.createElement('div');
      card.style.cssText = 'position:relative;cursor:pointer;background:#1a1035;border-radius:12px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);';

      var capaWrap = document.createElement('div');
      capaWrap.style.cssText = 'position:relative;width:100%;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#2a1a40,#1a1035);';
      capaWrap.innerHTML = '<span style="font-size:36px;">📄</span>';

      if (!bonus.liberado) {
        capaWrap.style.filter = 'blur(3px)';
        capaWrap.appendChild(criarCadeadoOverlay());
      }

      card.appendChild(capaWrap);

      var textoWrap = document.createElement('div');
      textoWrap.style.cssText = 'padding:10px 10px 12px;';
      textoWrap.innerHTML = '<p style="color:#fff;font-size:12px;font-weight:600;margin:0;line-height:1.3;text-align:center;">' + bonus.titulo + '</p>';
      card.appendChild(textoWrap);

      card.addEventListener('click', function () { abrirModalOferta(); });

      grid.appendChild(card);
    });

    sec.appendChild(grid);
    return sec;
  }

  function criarNavDemo() {
    var nav = document.createElement('div');
    nav.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9990;background:#13082a;border-top:1px solid rgba(212,175,55,0.2);padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));text-align:center;';
    nav.innerHTML = '<button id="pq-demo-cta" style="width:100%;max-width:420px;padding:14px 18px;border-radius:999px;background:#d4af37;border:none;color:#1a0a20;font-weight:700;font-family:Cinzel,serif;letter-spacing:0.5px;font-size:14.5px;cursor:pointer;">Desbloquear acesso completo</button>';
    nav.querySelector('#pq-demo-cta').addEventListener('click', abrirModalOferta);
    return nav;
  }

  // ─── Modal de oferta ──────────────────────────────────────────────────
  function abrirModalOferta() {
    if (document.getElementById('pq-demo-oferta')) return;

    var overlay = document.createElement('div');
    overlay.id = 'pq-demo-oferta';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(13,7,24,0.85);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif;';

    var beneficios = [
      'Acesso vitalício',
      'Pagamento único',
      'Mais de 90 aulas de Pilates',
      'Aulas ao vivo',
      'Suporte direto comigo',
      '5 guias alimentares exclusivos',
      '3 bônus exclusivos'
    ];

    var beneficiosHtml = beneficios.map(function (b) {
      return '<li style="display:flex;align-items:flex-start;gap:8px;color:#f0e6ff;font-size:14px;line-height:1.4;margin-bottom:8px;">'
        + '<span style="color:#d4af37;flex-shrink:0;">✅</span><span>' + b + '</span></li>';
    }).join('');

    overlay.innerHTML =
      '<div style="width:100%;max-width:420px;background:linear-gradient(160deg,rgba(42,26,64,0.98),rgba(26,16,37,0.99));border:1px solid rgba(212,175,55,0.35);border-radius:24px;overflow:hidden;box-shadow:0 0 60px rgba(212,175,55,0.15),0 32px 64px rgba(0,0,0,0.6);position:relative;">'
      + '<button id="pq-demo-fechar" style="position:absolute;top:14px;right:14px;z-index:1;background:none;border:none;color:#9b7ec8;font-size:22px;line-height:1;cursor:pointer;padding:4px;">×</button>'
      + '<div style="height:3px;background:linear-gradient(90deg,transparent,#d4af37,transparent);"></div>'
      + '<div style="padding:32px 28px 28px;text-align:center;">'
      + '<h2 style="color:#d4af37;font-family:Cinzel,serif;font-size:19px;font-weight:700;letter-spacing:0.5px;margin:0 0 18px;line-height:1.35;">Tenha acesso completo ao Pilates em Casa</h2>'
      + '<div style="margin-bottom:20px;">'
      + '<p style="color:#9b7ec8;font-size:14px;text-decoration:line-through;margin:0 0 2px;">De: 47 €</p>'
      + '<p style="color:#fff;font-size:30px;font-weight:700;margin:0;">Por: <span style="color:#d4af37;">14,90 €</span></p>'
      + '</div>'
      + '<ul style="list-style:none;padding:0;margin:0 0 24px;text-align:left;">' + beneficiosHtml + '</ul>'
      + '<button id="pq-demo-quero" style="width:100%;padding:16px;background:#d4af37;color:#1a0a20;border:none;border-radius:14px;font-size:17px;font-weight:700;cursor:pointer;font-family:Cinzel,serif;letter-spacing:0.5px;">Eu quero</button>'
      + '</div>'
      + '<div style="height:3px;background:linear-gradient(90deg,transparent,#d4af37,transparent);"></div>'
      + '</div>';

    document.body.appendChild(overlay);

    document.getElementById('pq-demo-fechar').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    document.getElementById('pq-demo-quero').addEventListener('click', function () {
      var url = 'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(WHATSAPP_MSG);
      window.open(url, '_blank', 'noopener');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montarLayout);
  } else {
    montarLayout();
  }
})();
