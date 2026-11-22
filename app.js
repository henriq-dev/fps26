// P49: camada de app (PWA) — botão de download/instalação, aviso de atualização e status offline.
// Independente do jogo: só toca nos elementos #installBtn, #installHint, #appStatus e #updateBar.
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const installBtn = $('installBtn'), hint = $('installHint'), status = $('appStatus'), bar = $('updateBar'), updateBtn = $('updateBtn'), laterBtn = $('updateLater');
  const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  const setStatus = t => { if (status) status.textContent = t; };
  let deferred = null, hintOpen = false;

  // --- Instalar / baixar o app ---
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const refreshInstallUi = () => {
    if (!installBtn) return;
    if (location.protocol === 'file:') { installBtn.classList.add('hidden'); return; }   // versão baixada: não há o que instalar
    if (standalone()) { installBtn.classList.add('hidden'); hint && hint.classList.add('hidden'); setStatus('App instalado'); return; }
    installBtn.classList.remove('hidden');            // P50: o botão sempre aparece; sem o aviso nativo, mostra o passo a passo do navegador
    if (hint && (deferred || !hintOpen)) hint.classList.add('hidden');
  };
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; refreshInstallUi(); });
  addEventListener('appinstalled', () => { deferred = null; refreshInstallUi(); });
  if (installBtn) installBtn.addEventListener('click', async () => {
    if (!deferred) {
      if (hint) { hintOpen = true; hint.textContent = ios ? 'iPhone/iPad (Safari): toque em Compartilhar e depois em “Adicionar à Tela de Início”.' : /android/i.test(navigator.userAgent) ? 'Android (Chrome): menu ⋮ → “Instalar app” ou “Adicionar à tela inicial”.' : 'Computador (Chrome/Edge): clique no ícone de instalar na barra de endereço, ou menu ⋮ → “Transmitir, salvar e compartilhar” → “Instalar página como app”.'; hint.classList.remove('hidden'); }
      return;
    }
    deferred.prompt();
    try { await deferred.userChoice; } catch (_) {}
    deferred = null; refreshInstallUi();
  });
  refreshInstallUi();


  // --- P51: lobby — seletores segmentados espelham os <select> originais (que continuam sendo a fonte da verdade) ---
  const NOTES = { survival: 'Ondas sem fim: aguente o máximo que puder.', operations: 'Ondas com objetivos extras para cumprir.', incursion: 'Invada um prédio, hackeie terminais e fuja.' };
  const ICONS = { survival: '🌊', operations: '🎯', incursion: '🏢', cadet: '🟢', normal: '🟡', nightmare: '🔴' };
  const incField = $('incField'), modeSel = $('modeSelect'), modeNote = $('modeNote');
  const syncLobby = () => {
    document.querySelectorAll('.seg').forEach(seg => {
      const sel = $(seg.dataset.for); if (!sel) return;
      if (!seg.children.length) [...sel.options].forEach(o => {
        const b = document.createElement('button'); b.type = 'button'; b.dataset.v = o.value;
        b.innerHTML = `<i>${ICONS[o.value] || ''}</i><span>${o.textContent.replace(/ \(.*\)/, '')}</span>`;
        b.addEventListener('click', () => { sel.value = o.value; sel.dispatchEvent(new Event('change', { bubbles: true })); syncLobby(); });
        seg.appendChild(b);
      });
      [...seg.children].forEach(b => { const on = b.dataset.v === sel.value; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    });
    if (incField) incField.classList.toggle('hidden', modeSel.value !== 'incursion');
    if (modeNote) modeNote.textContent = NOTES[modeSel.value] || '';
  };
  ['modeSelect', 'difficultySelect'].forEach(id => $(id) && $(id).addEventListener('change', syncLobby));
  syncLobby(); setTimeout(syncLobby, 300);   // 2ª passada: loadPrefs() do jogo restaura o modo salvo depois deste script


  // --- P52: baixar o jogo como UM arquivo .html (funciona offline, abre com duplo clique, sem instalar nada) ---
  const dlBtn = $('downloadBtn');
  const buildSingleFile = async () => {
    const get = async u => { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error('falha ao ler ' + u); return r.text(); };
    let html = await get('./index.html'); const jobs = [];
    html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, u) => { jobs.push(get(u)); return '@@CSS' + (jobs.length - 1) + '@@'; });
    html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, u) => { jobs.push(get(u)); return '@@JS' + (jobs.length - 1) + '@@'; });
    const parts = await Promise.all(jobs);
    html = html.replace(/@@(CSS|JS)(\d+)@@/g, (m, k, i) => k === 'CSS' ? '<style>' + parts[i] + '</style>' : '<script>' + parts[i].replace(/<\/script/gi, '<\\/script') + '</script>');
    const icon = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(await get('./icon.svg'))));
    return html.replace(/<link rel="(?:manifest|apple-touch-icon)"[^>]*>\s*/g, '').replace(/<link rel="icon"[^>]*>/, '<link rel="icon" href="' + icon + '">');
  };
  if (dlBtn) {
    if (location.protocol === 'file:') dlBtn.classList.add('hidden');        // já é a versão baixada
    dlBtn.addEventListener('click', async () => {
      const label = dlBtn.textContent; dlBtn.disabled = true; dlBtn.textContent = 'Preparando arquivo…';
      try {
        const blob = new Blob([await buildSingleFile()], { type: 'text/html' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'arena-fps.html';
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        setStatus('Arquivo baixado: abra arena-fps.html com duplo clique (funciona offline).');
      } catch (e) { setStatus('Não foi possível baixar: ' + e.message); }
      dlBtn.disabled = false; dlBtn.textContent = label;
    });
  }

  // --- Aviso de atualização ---
  if (!('serviceWorker' in navigator)) { setStatus(location.protocol === 'file:' ? 'Versão baixada · jogando offline' : 'Offline indisponível neste navegador'); return; }
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
  }).catch(() => setStatus(location.protocol === 'file:' ? 'Versão baixada · jogando offline' : 'Offline indisponível'));
})();
