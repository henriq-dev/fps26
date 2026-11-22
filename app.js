// P49: camada de app (PWA) — botão de download/instalação, aviso de atualização e status offline.
// Independente do jogo: só toca nos elementos #installBtn, #installHint, #appStatus e #updateBar.
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const installBtn = $('installBtn'), hint = $('installHint'), status = $('appStatus'), bar = $('updateBar'), updateBtn = $('updateBtn'), laterBtn = $('updateLater');
  const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  const setStatus = t => { if (status) status.textContent = t; };
  let deferred = null;

  // --- Instalar / baixar o app ---
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const refreshInstallUi = () => {
    if (!installBtn) return;
    if (standalone()) { installBtn.classList.add('hidden'); hint && hint.classList.add('hidden'); setStatus('App instalado'); return; }
    if (deferred) { installBtn.classList.remove('hidden'); hint && hint.classList.add('hidden'); }
    else if (ios) { installBtn.classList.add('hidden'); if (hint) { hint.textContent = 'Para baixar no iPhone/iPad: toque em Compartilhar e depois em “Adicionar à Tela de Início”.'; hint.classList.remove('hidden'); } }
    else installBtn.classList.add('hidden');
  };
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; refreshInstallUi(); });
  addEventListener('appinstalled', () => { deferred = null; refreshInstallUi(); });
  if (installBtn) installBtn.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch (_) {}
    deferred = null; refreshInstallUi();
  });
  refreshInstallUi();

  // --- Aviso de atualização ---
  if (!('serviceWorker' in navigator)) { setStatus('Offline indisponível neste navegador'); return; }
  let reloading = false, hadController = !!navigator.serviceWorker.controller;
  const showUpdate = worker => {
    if (!bar) return;
    bar.classList.remove('hidden');
    updateBtn.onclick = () => { updateBtn.disabled = true; updateBtn.textContent = 'Atualizando…'; worker.postMessage('SKIP_WAITING'); };
    laterBtn.onclick = () => bar.classList.add('hidden');
  };
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) { hadController = true; return; }   // primeira instalação: não recarrega
    if (reloading) return; reloading = true; location.reload();
  });
  navigator.serviceWorker.register('./sw.js').then(reg => {
    setStatus(reg.active ? 'Pronto para jogar offline' : 'Baixando para uso offline…');
    const watch = w => w && w.addEventListener('statechange', () => {
      if (w.state === 'installed') { if (navigator.serviceWorker.controller) showUpdate(w); else setStatus('Pronto para jogar offline'); }
    });
    if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
    watch(reg.installing);
    reg.addEventListener('updatefound', () => watch(reg.installing));
    const check = () => reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    setInterval(check, 30 * 60 * 1000);
    const showVersion = e => { if (e.data && e.data.type === 'VERSION') setStatus((standalone() ? 'App instalado · ' : '') + 'versão ' + e.data.version + ' · offline'); };
    navigator.serviceWorker.addEventListener('message', showVersion);
    navigator.serviceWorker.ready.then(r => r.active && r.active.postMessage('GET_VERSION'));
  }).catch(() => setStatus('Offline indisponível'));
})();
