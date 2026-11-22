// P49: camada de app (PWA) — botão de download/instalação, aviso de atualização e status offline.
// Independente do jogo: só toca nos elementos #installBtn, #installHint, #appStatus e #updateBar.
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const installBtn = $('installBtn'), hint = $('installHint'), status = $('appStatus'), bar = $('updateBar'), updateBtn = $('updateBtn'), laterBtn = $('updateLater');
  const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  const setStatus = t => { if (status) status.textContent = t; };
  let deferred = null, hintOpen = false;

  // P54: quando o Chrome não oferece o aviso nativo, descobre e mostra o motivo em vez de só dar instruções genéricas.
  const diagnoseInstall = async () => {
    const lines = [];
    if (standalone()) return 'Você já está usando o app instalado. Para jogar de novo, abra-o pelo atalho.';
    const secure = window.isSecureContext;
    if (!secure) lines.push('• A página não está em HTTPS: o navegador só instala apps em conexão segura.');
    let swOk = false;
    if (!('serviceWorker' in navigator)) lines.push('• Modo offline: este navegador não oferece suporte a Service Worker; não foi possível preparar o cache offline.');
    else {
      try {
        const r = await navigator.serviceWorker.getRegistration();
        swOk = !!(r && r.active);
        if (!r) lines.push('• Modo offline: o Service Worker ainda não foi registrado nesta página. Recarregue com internet para preparar o cache.');
        else if (!swOk) lines.push('• Modo offline: o Service Worker existe, mas ainda não está ativo. Aguarde o preparo do cache.');
      } catch (_) { lines.push('• Modo offline: não foi possível verificar o Service Worker nesta página.'); }
    }
    let manifestOk = false;
    try {
      const link = document.querySelector('link[rel~="manifest"]');
      if (!link || !link.href) throw new Error('a página não aponta para o manifest do app.');
      const response = await fetch(link.href, { cache: 'no-cache' });
      if (!response.ok) throw new Error('o arquivo manifest.json não foi encontrado (HTTP ' + response.status + ').');
      const m = await response.json();
      if (!(m.name || m.short_name) || !m.start_url) throw new Error('faltam nome/short_name ou start_url.');
      const displays = [m.display, ...(Array.isArray(m.display_override) ? m.display_override : [])];
      if (!displays.some(x => ['standalone', 'fullscreen', 'minimal-ui'].includes(x))) throw new Error('o manifest não define um modo de exibição de app.');
      const icons = Array.isArray(m.icons) ? m.icons : [];
      const hasSize = size => icons.some(icon => icon.type === 'image/png' && String(icon.sizes || '').split(/\s+/).includes(size + 'x' + size));
      if (!hasSize(192) || !hasSize(512)) throw new Error('faltam ícones PNG nos tamanhos 192×192 e 512×512.');
      manifestOk = true;
    } catch (e) { lines.push('• Manifest do app: ' + (e.message || 'não foi possível validar o arquivo.')); }
    let installed = false;
    try { if (navigator.getInstalledRelatedApps) installed = (await navigator.getInstalledRelatedApps()).length > 0; } catch (_) {}
    if (installed) return '✔ O navegador confirmou que o app já está instalado. Abra-o pelo ícone na tela inicial, área de trabalho ou menu de aplicativos; não é preciso instalar novamente.';
    if (secure && manifestOk) {
      lines.push('✓ HTTPS e manifest com nome, start_url, modo de app e ícones PNG 192/512: verificações de instalação visíveis à página concluídas.');
      lines.push('• O Chrome não informa à página o motivo interno pelo qual não enviou “beforeinstallprompt”. Portanto, não dá para confirmar que já está instalado nem que está apenas aguardando.');
    } else lines.push('• Corrija os problemas de HTTPS/manifest apontados acima e recarregue. Mesmo assim, o Chrome pode aplicar outros critérios que não informa à página.');
    const how = ios ? 'iPhone/iPad (Safari): Compartilhar → “Adicionar à Tela de Início”.' : /android/i.test(navigator.userAgent) ? 'Android (Chrome): menu ⋮ → “Instalar app” ou “Adicionar à tela inicial”.' : /edg\//i.test(navigator.userAgent) ? 'Microsoft Edge: menu ⋯ → Aplicativos → Instalar este site como aplicativo (se disponível).' : 'Chrome no computador: menu ⋮ → “Transmitir, salvar e compartilhar” → “Instalar página como app”, se essa opção estiver disponível.';
    return lines.join('\n') + '\n' + how + '\nAlternativa sem instalar: use o botão BAIXAR O JOGO.';
  };

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
      if (hint) {
        hintOpen = true; hint.classList.remove('hidden'); hint.textContent = 'Verificando a instalação…';
        diagnoseInstall().then(t => { hint.textContent = t; });
      }
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
