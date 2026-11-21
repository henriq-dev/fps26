/* =====================================================================
   deck.js — CYBERDECK do jogador: um "laptop" com shell estilo Kali ou Arch.
   É 100% FICTÍCIO: nenhum comando real é executado e não há rede. Os nomes
   (nmap, apt, pacman...) só dão sabor; a saída é texto pronto do jogo.
   Regra pura (sem DOM): recebe a linha digitada + contexto e devolve linhas e efeitos.
   ===================================================================== */
(() => {
'use strict';
window.Arena = window.Arena || {};

Arena.DECK = { scan: { time: 8, cd: 20 }, jam: { time: 12, cd: 40 } };

Arena.DECK_SKINS = {
  kali: { id: 'kali', label: 'KALI', shell: 'zsh', os: 'Kali GNU/Linux (simulado)', kernel: '6.x-kali-sim', promptTop: '┌──(operador㉿deck)-[~]', prompt: '└─$',
    notFound: c => `zsh: command not found: ${c}` },
  arch: { id: 'arch', label: 'ARCH', shell: 'bash', os: 'Arch Linux (simulado)', kernel: '6.x-arch-sim', promptTop: '', prompt: '[operador@deck ~]$',
    notFound: c => `bash: ${c}: comando não encontrado` }
};

// Ferramentas reais que o jogo NÃO executa (só avisa). Mantém o deck seguro e cenográfico.
const REAL_TOOLS = ['hydra', 'msfconsole', 'sqlmap', 'aircrack-ng', 'john', 'hashcat', 'ssh', 'ping', 'curl', 'wget', 'nc', 'netcat', 'metasploit', 'burpsuite', 'wireshark', 'ettercap'];
const o = (t, k = 'out') => ({ t, k });

// ctx = { skin, scanCd, jamCd, targets: [{ label, dist }] }  →  { lines: [{t,k}], fx: { scan?, jam?, skin?, clear?, exit? } }
Arena.deckRun = (line, ctx = {}) => {
  const skin = Arena.DECK_SKINS[ctx.skin] || Arena.DECK_SKINS.kali;
  const raw = String(line || '').trim(), fx = {};
  if (!raw) return { lines: [], fx };
  let parts = raw.split(/\s+/);
  if (parts[0] === 'sudo' && parts.length > 1) parts = parts.slice(1);
  const cmd = parts[0].toLowerCase(), args = parts.slice(1);
  const L = [];

  if (cmd === 'help' || cmd === 'ajuda' || cmd === '?') {
    L.push(o('Comandos do CYBERDECK (tudo simulado):', 'dim'),
      o('  scan      varre a rede fictícia e marca alvos na tela (alias: nmap)'),
      o('  jam       interfere nas câmeras e torretas por alguns segundos'),
      o('  connect   (perto do console) prepara a invasão: adianta 50% da barra de E'),
      o('  theme     troca o visual: theme kali | theme arch'),
      o('  neofetch  mostra o sistema do deck   ·   uname, whoami, ls, cat notas.txt'),
      o('  status    mostra recargas, câmeras, alarme   ·   date, uptime, ip a, history'),
      o('  Tab completa o comando   ·   ↑/↓ histórico   ·   clear limpa   ·   exit (ou Esc) fecha'));
  } else if (cmd === 'clear' || cmd === 'cls') { fx.clear = true; }
  else if (cmd === 'exit' || cmd === 'quit') { fx.exit = true; }
  else if (cmd === 'whoami') L.push(o('operador'));
  else if (cmd === 'id') L.push(o('uid=1000(operador) gid=1000(operador) (simulado)'));
  else if (cmd === 'status') {
    const st = ctx.status || {};
    L.push(o(`missão  : setor ${st.stage || 1}/4 · ${st.mission || '—'}`), o(`scan    : ${(ctx.scanCd || 0) > 0 ? 'resfriando ' + Math.ceil(ctx.scanCd) + ' s' : 'pronto'}`),
      o(`jam     : ${(ctx.jamCd || 0) > 0 ? 'resfriando ' + Math.ceil(ctx.jamCd) + ' s' : 'pronto'}`), o(`câmeras : ${st.camsOff ? 'FORA DO AR' : 'ativas'}`), o(`alarme  : ${st.alarm > 0 ? Math.ceil(st.alarm) + ' s' : 'desligado'}`),
      o(`vigilância: ${st.threats || 0} câmera(s)/torreta(s) ativa(s)`, st.threats ? 'warn' : 'ok'));
  }
  else if (cmd === 'connect' || cmd === 'conectar') {                 // prepara a invasão do console próximo: já adianta metade da barra (ver script.js)
    const c = (ctx.connect && ctx.connect.state) || 'far', name = (ctx.connect && ctx.connect.name) || 'CONSOLE';
    if (c === 'ready') {
      L.push(o(`[SIM] abrindo sessão com ${name} …`, 'dim'), o('handshake', 'bar'), o('[SIM] handshake fictício .......... ok', 'dim'), o('[SIM] credencial de demonstração aceita (simulada)', 'dim'),
        o('[SIM] sessão pronta: feche o deck (Esc) e SEGURE E para concluir. Progresso adiantado em 50%.', 'ok'));
      fx.connect = true;
    } else if (c === 'primed') L.push(o('sessão deste setor já foi preparada.', 'warn'));
    else if (c === 'exit') L.push(o('nenhum console neste setor: vá até a SAÍDA.', 'warn'));
    else L.push(o('nenhum console ao alcance: aproxime-se do console do setor e tente de novo.', 'warn'));
  }
  else if (cmd === 'date') L.push(o(`T+${String(Math.floor((ctx.time || 0) / 60)).padStart(2, '0')}:${String(Math.floor((ctx.time || 0) % 60)).padStart(2, '0')} (tempo de missão, simulado)`));
  else if (cmd === 'uptime') L.push(o(`up ${Math.floor((ctx.time || 0) / 60)} min, 1 usuário, carga 0.42 (simulado)`));
  else if (cmd === 'ip' || cmd === 'ifconfig') L.push(o('1: lo      127.0.0.1/8 (loopback)'), o('2: deck0   192.0.2.2/24 (fictício, sem saída)', 'dim'), o('[SIM] sem interface de rede real', 'warn'));
  else if (cmd === 'echo') L.push(o(args.join(' ')));
  else if (cmd === 'history') (ctx.history || []).slice(-10).forEach((h, i) => L.push(o(`${String(i + 1).padStart(3)}  ${h}`, 'dim')));
  else if (cmd === 'motd') L.push(...Arena.deckBoot(skin.id).slice(-2).map(t => o(t, 'dim')));
  else if (cmd === 'pwd') L.push(o('/home/operador'));
  else if (cmd === 'uname') L.push(o(args[0] === '-a' ? `Linux deck ${skin.kernel} #1 SMP PREEMPT (simulado) x86_64 GNU/Linux` : 'Linux'));
  else if (cmd === 'ls') L.push(o('notas.txt  scan.log  jammer.sh', 'dim'));
  else if (cmd === 'cat') L.push(args[0] === 'notas.txt' ? o('dica: "scan" marca inimigos, câmeras e torretas; "jam" silencia câmeras e torretas. Ambos têm recarga.', 'ok') : o(`cat: ${args[0] || ''}: arquivo não encontrado`, 'err'));
  else if (cmd === 'neofetch' || cmd === 'fastfetch') L.push(o(`operador@deck`), o('-------------'), o(`OS:      ${skin.os}`), o(`Kernel:  ${skin.kernel}`), o(`Shell:   ${skin.shell}`), o('Máquina: CYBERDECK CX-7 (fictício)'), o('Rede:    NENHUMA (modo offline)'));
  else if (cmd === 'theme' || cmd === 'skin') {
    const id = (args[0] || '').toLowerCase();
    if (Arena.DECK_SKINS[id]) { fx.skin = id; L.push(o(`visual alterado: ${Arena.DECK_SKINS[id].label}`, 'ok')); } else L.push(o('uso: theme kali | theme arch', 'warn'));
  }
  else if (cmd === 'scan' || cmd === 'nmap') {
    if ((ctx.scanCd || 0) > 0) L.push(o(`scan em resfriamento (${Math.ceil(ctx.scanCd)} s)`, 'warn'));
    else {
      const list = (ctx.targets || []).slice().sort((a, b) => a.dist - b.dist).slice(0, 8);
      L.push(o('[SIM] varrendo a rede local fictícia 192.0.2.0/24 …', 'dim'), o('varredura', 'bar'));
      list.forEach((t, i) => L.push(o(`192.0.2.${10 + i}   443/tcp aberta   ${String(t.label).padEnd(12)} ${Math.round(t.dist)} m`)));
      L.push(o(`[SIM] ${list.length} alvo(s) marcado(s) na tela por ${Arena.DECK.scan.time} s`, 'ok'));
      fx.scan = Arena.DECK.scan.time;
    }
  }
  else if (cmd === 'jam' || cmd === 'jammer' || cmd === './jammer.sh') {
    if ((ctx.jamCd || 0) > 0) L.push(o(`jammer em resfriamento (${Math.ceil(ctx.jamCd)} s)`, 'warn'));
    else { L.push(o('[SIM] emitindo interferência …', 'dim'), o('interferência', 'bar'), o(`[SIM] câmeras e torretas fora do ar por ${Arena.DECK.jam.time} s`, 'ok')); fx.jam = Arena.DECK.jam.time; }
  }
  else if (cmd === 'apt' || cmd === 'apt-get' || cmd === 'pacman' || cmd === 'yay') L.push(o('[SIM] sem rede externa: modo offline. Nada foi instalado.', 'warn'));
  else if (REAL_TOOLS.includes(cmd)) L.push(o(`[SIM] "${cmd}" real está desativado neste jogo. Use scan ou jam.`, 'warn'));
  else L.push(o(skin.notFound(cmd), 'err'));
  return { lines: L, fx };
};

// Lista de comandos (para o autocompletar com Tab)
Arena.DECK_COMMANDS = ['help', 'scan', 'nmap', 'jam', 'connect', 'status', 'theme', 'neofetch', 'uname', 'whoami', 'id', 'pwd', 'ls', 'cat', 'date', 'uptime', 'ip', 'echo', 'history', 'motd', 'clear', 'exit'];
// Tab: completa o 1º termo (ou o argumento de "theme"). Devolve { line, options } — options só quando há mais de uma opção.
Arena.deckComplete = (line) => {
  const m = /^(\s*)(\S*)$/.exec(line), t = /^(\s*theme\s+)(\S*)$/i.exec(line);
  const pick = (head, word, list) => {
    const hits = list.filter(c => c.startsWith(word.toLowerCase()));
    if (!hits.length) return { line, options: [] };
    if (hits.length === 1) return { line: head + hits[0] + ' ', options: [] };
    let pre = hits[0]; for (const h of hits) while (!h.startsWith(pre)) pre = pre.slice(0, -1);
    return { line: head + pre, options: hits };
  };
  if (t) return pick(t[1], t[2], Object.keys(Arena.DECK_SKINS));
  if (m && m[2]) return pick(m[1], m[2], Arena.DECK_COMMANDS);
  return { line, options: [] };
};
// Sequência de "boot" por skin (texto fictício)
Arena.deckBoot = (id) => id === 'arch'
  ? ['CYBERDECK CX-7 · firmware 3.1 (fictício)', 'Montando /dev/deck0 ........ [ OK ]', 'Carregando módulos de rádio local ... [ OK ]', 'Iniciando bash 5.x (simulado) ........ [ OK ]', 'Arch Linux (simulado) — digite "help"']
  : ['CYBERDECK CX-7 · firmware 3.1 (fictício)', 'Verificando integridade .......... [ OK ]', 'Carregando ferramentas de varredura (cenográficas) [ OK ]', 'Iniciando zsh 5.x (simulado) ....... [ OK ]', 'Kali GNU/Linux (simulado) — digite "help"'];
})();
