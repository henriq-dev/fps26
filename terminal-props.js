/* =====================================================================
   terminal-props.js — máquinas físicas da incursão (visual, sem colisão).
   Tudo é cenográfico/local: não executa comandos nem acessa rede real.
   ===================================================================== */
(() => {
  'use strict';
  window.Arena = window.Arena || {};
  const geoCache = new Map(), matCache = new Map();
  const palette = { standby: 0x4de7ff, detected: 0xffc857, intrusion: 0xffb04d, committed: 0x3ddc84, locked: 0xff3b5f };
  const dark = 0x151c25, frame = 0x35424c, steel = 0x697983, rubber = 0x20272e;

  function box(w, h, d) { const k = `b:${w}:${h}:${d}`; if (!geoCache.has(k)) geoCache.set(k, new THREE.BoxGeometry(w, h, d)); return geoCache.get(k); }
  function cyl(r, h, n = 8) { const k = `c:${r}:${h}:${n}`; if (!geoCache.has(k)) { const g = new THREE.CylinderGeometry(r, r, h, n); g.rotateX(Math.PI / 2); geoCache.set(k, g); } return geoCache.get(k); }
  function mat(color, basic = false, opacity = 1) {
    const k = `${color}:${basic}:${opacity}`; if (matCache.has(k)) return matCache.get(k);
    const m = basic ? new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity }) : new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: .035 });
    matCache.set(k, m); return m;
  }
  function add(g, geometry, material, x, y, z, sx = 1, sy = 1, sz = 1, rz = 0) {
    const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.z = rz; g.add(m); return m;
  }
  // Materiais PRÓPRIOS de cada terminal para tela e LED: o estado (cor) de um console não pode vazar para os outros.
  function ownMat(g, color, kind) {
    const own = g.userData.own || (g.userData.own = new Map()), key = `${kind}:${color}`;
    if (!own.has(key)) { const m = new THREE.MeshBasicMaterial({ color }); m.userData = { kind, base: color }; own.set(key, m); }
    return own.get(key);
  }
  function led(g, x, y, z, color, sx = .035, sy = .035, sz = .018) {
    return add(g, box(1, 1, 1), ownMat(g, color, 'led'), x, y, z, sx, sy, sz);
  }
  function screw(g, x, y, z) { return add(g, cyl(.018, .014, 6), mat(0xb4c5c8, false), x, y, z, 1, 1, 1); }
  function screen(g, x, y, z, w, h, color) {
    add(g, box(w + .12, h + .12, .075), mat(frame), x, y, z - .02);
    return add(g, box(w, h, .012), ownMat(g, color, 'screen'), x, y, z + .025);
  }
  function keyboard(g, x, y, z, wide = .68) {
    add(g, box(wide, .055, .27), mat(rubber), x, y, z);
    for (let row = 0; row < 3; row++) for (let col = 0; col < 7; col++) add(g, box(.055, .018, .045), mat(row === 0 && col === 0 ? 0xffc857 : steel), x - wide / 2 + .09 + col * .09, y + .038, z - .075 + row * .07);
    add(g, box(.18, .018, .045), mat(steel), x, y + .038, z + .095);
  }
  function cable(g, points, color) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, .018, 5, false), mat(color, true)); g.add(m); return m;
  }
  function rack(g, x, y, z, w = .78, h = 2.25, d = .42, color = dark) {
    add(g, box(w, h, d), mat(color), x, y + h / 2, z);
    add(g, box(w * .82, h * .82, .018), mat(0x25323a), x, y + h * .54, z + d / 2 + .012);
    for (let i = 0; i < 5; i++) { add(g, box(w * .72, .022, .025), mat(steel), x, y + .28 + i * .34, z + d / 2 + .03); led(g, x - w * .28, y + .29 + i * .34, z + d / 2 + .045, i === 4 ? 0xffc857 : 0x3ddc84, .025, .025, .012); }
    for (const sx of [-1, 1]) for (const sy of [0, h]) screw(g, x + sx * (w * .38), y + sy + (sy ? -.08 : .08), z + d / 2 + .045);
    return g;
  }
  function buildKvm(g) {
    add(g, box(1.75, .12, .82), mat(frame), 0, 1.03, 0);
    add(g, box(1.40,.045,.035),mat(steel),0,.965,.414); for(let i=0;i<9;i++)add(g,box(.025,.018,.012),mat(dark),-.52+i*.13,.962,.438);
    for(const x of [-.70,.70])add(g,box(.045,.12,.07),mat(rubber),x,.94,.34);
    for (const x of [-.72, .72]) for (const z of [-.28, .28]) add(g, box(.08, 1.0, .08), mat(dark), x, .5, z);
    rack(g, 0, 1.08, -.32, .76, 1.65, .34, 0x202b34);
    add(g, box(.82, .06, .06), mat(steel), 0, 1.84, -.10);
    screen(g, 0, 1.62, .10, .82, .46, palette.standby);
    add(g, box(.07, .48, .05), mat(steel), -.48, 1.45, .08, 1, 1, 1, -.1);
    keyboard(g, -.05, 1.12, .27, .70);
    add(g, new THREE.SphereGeometry(.10, 8, 6), mat(steel), .52, 1.17, .25); add(g, new THREE.SphereGeometry(.045, 7, 5), mat(palette.standby, true), .52, 1.24, .25);
    add(g, box(.18, .08, .12), mat(0x1e2a31), -.57, 1.18, -.02); for (let i = 0; i < 3; i++) led(g, -.63 + i * .055, 1.19, .05, i === 1 ? 0xffc857 : 0x3ddc84);
    cable(g, [[-.34, 1.08, -.22], [-.55, .78, -.30], [-.60, .35, -.30]], 0x35d6c8);
    cable(g, [[.25, 1.08, -.23], [.42, .76, -.32], [.48, .30, -.32]], 0xffb04d);
    return g;
  }
  function buildNetwork(g) {
    add(g, box(1.75, .12, .82), mat(frame), 0, 1.03, 0);
    add(g,box(1.42,.045,.035),mat(steel),0,.965,.414); for(let i=0;i<8;i++)led(g,-.48+i*.135,.972,.438,i%2?0x3ddc84:0x4de7ff,.018,.018,.01);
    rack(g, 0, 1.08, -.28, 1.04, 2.35, .44, 0x202932);
    add(g, box(.84, .62, .035), mat(0x25343e), 0, 1.72, -.045);
    for (let row = 0; row < 3; row++) for (let col = 0; col < 8; col++) { add(g, box(.055, .055, .018), mat(steel), -.30 + col * .085, 1.85 - row * .16, .0); led(g, -.30 + col * .085, 1.90 - row * .16, .018, (row + col) % 3 === 0 ? 0xffc857 : 0x3ddc84, .018, .018, .01); }
    screen(g, 0, 1.25, .10, .72, .26, palette.standby);
    for (let i = 0; i < 5; i++) cable(g, [[-.36 + i * .18, 1.50, .04], [-.46 + i * .23, 1.18, .30], [-.55 + i * .26, .86, .30]], [0x35d6c8, 0xffb04d, 0x9e7bff, 0x3ddc84, 0xff5a4d][i]);
    add(g, box(.25, .10, .16), mat(0x1e2a31), .48, 1.15, .23); led(g, .48, 1.18, .32, 0xff5a4d, .035, .035, .015); led(g, .39, 1.18, .32, 0x3ddc84, .035, .035, .015);
    return g;
  }
  function buildDatacenter(g) {
    add(g, box(1.9, .12, .82), mat(frame), 0, 1.03, 0);
    for(const x of [-.82,.82]){add(g,box(.18,.62,.07),mat(rubber),x,1.47,.32);for(let i=0;i<5;i++)add(g,box(.13,.018,.015),mat(steel),x,1.27+i*.10,.365);}
    for (const x of [-.72, .72]) for (const z of [-.28, .28]) add(g, box(.08, 1.0, .08), mat(dark), x, .5, z);
    rack(g, 0, 1.08, -.36, .70, 1.85, .34, 0x1e2832);
    for (const x of [-.55, 0, .55]) screen(g, x, 1.65, .12, .42, .35, x === 0 ? 0xffc857 : palette.standby);
    keyboard(g, 0, 1.12, .30, .84);
    add(g, box(.16, .28, .18), mat(0x263640), -.82, 1.31, .08); add(g, box(.16, .28, .18), mat(0x263640), .82, 1.31, .08);
    for (let i = 0; i < 6; i++) { led(g, -.82 + (i % 2) * .11, 1.30 + Math.floor(i / 2) * .08, .18, i % 2 ? 0xffb04d : 0x3ddc84); led(g, .82 - (i % 2) * .11, 1.30 + Math.floor(i / 2) * .08, .18, i % 2 ? 0x4de7ff : 0xff5a4d); }
    cable(g, [[-.48, 1.05, -.20], [-.65, .78, -.36], [-.65, .35, -.36]], 0x4de7ff); cable(g, [[.48, 1.05, -.20], [.65, .78, -.36], [.65, .35, -.36]], 0xffb04d);
    return g;
  }
  // Funde todas as peças que usam o mesmo material numa só malha (cada console cai de ~60 para ~20 chamadas de desenho).
  function mergeByMaterial(g) {
    const groups = new Map(); g.updateMatrixWorld(true);
    g.children.slice().forEach(c => { if (c.isMesh) { if (!groups.has(c.material)) groups.set(c.material, []); groups.get(c.material).push(c); } });
    const v = new THREE.Vector3(), nm = new THREE.Matrix3();
    groups.forEach((list, material) => {
      let vc = 0, ic = 0; list.forEach(m => { vc += m.geometry.attributes.position.count; ic += m.geometry.index.count; });
      const pos = new Float32Array(vc * 3), nor = new Float32Array(vc * 3), uvs = new Float32Array(vc * 2), idx = new Uint16Array(ic); let vo = 0, io = 0;
      list.forEach(m => {
        m.updateMatrix(); nm.getNormalMatrix(m.matrix);
        const p = m.geometry.attributes.position, n = m.geometry.attributes.normal, uv = m.geometry.attributes.uv, ix = m.geometry.index.array;
        for (let i = 0; i < p.count; i++) {
          uvs[(vo + i) * 2] = uv.getX(i); uvs[(vo + i) * 2 + 1] = uv.getY(i);
          v.fromBufferAttribute(p, i).applyMatrix4(m.matrix); pos[(vo + i) * 3] = v.x; pos[(vo + i) * 3 + 1] = v.y; pos[(vo + i) * 3 + 2] = v.z;
          v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); nor[(vo + i) * 3] = v.x; nor[(vo + i) * 3 + 1] = v.y; nor[(vo + i) * 3 + 2] = v.z;
        }
        for (let j = 0; j < ix.length; j++) idx[io + j] = ix[j] + vo;
        vo += p.count; io += ix.length; g.remove(m);
      });
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
      g.add(new THREE.Mesh(geo, material));
    });
  }
  Arena.createIncursionTerminal = function createIncursionTerminal(spec) {
    const g = new THREE.Group(); g.position.set(spec.x, 0, spec.z); g.rotation.y = spec.rotation || 0; g.userData.terminalId = spec.id || spec.name; g.userData.kind = spec.kind || 'kvm';
    if (spec.kind === 'network') buildNetwork(g); else if (spec.kind === 'datacenter') buildDatacenter(g); else buildKvm(g);
    const own = [...(g.userData.own || new Map()).values()];
    g.userData.screenMats = own.filter(m => m.userData.kind === 'screen'); g.userData.ledMats = own.filter(m => m.userData.kind === 'led');
    // P25: a tela física mostra o NEXUS. Textura 256x128 em tons de branco; a cor do estado (material.color) tinge o desenho.
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
    const tex = new THREE.CanvasTexture(cv); tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter;
    g.userData.tex = tex; g.userData.tctx = cv.getContext('2d'); g.userData.nextPaint = 0;
    g.userData.screenMats.forEach(m => { m.map = tex; m.needsUpdate = true; });
    mergeByMaterial(g); Arena.paintIncursionScreen(g, 'standby', 0, true); g.userData.state = 'standby'; g.userData.phase = Math.random() * 5; g.userData.label = spec.name;
    return g;
  };
  // Desenha o mini NEXUS (grade + grafo de nós + texto). Limitado a ~6 quadros/s por terminal; force = true ignora o limite.
  const NODES = [[.18, .30], [.40, .68], [.62, .26], [.82, .62], [.30, .86], [.74, .88]];
  const SCREEN_TEXT = { standby: 'NEXUS // STANDBY', detected: 'ENLACE DETECTADO', intrusion: 'INTRUSÃO SIM…', committed: 'CONCLUÍDO', locked: 'ACESSO NEGADO' };

  // Tela de "computador": janela de terminal com barra de título, mascote original (BYTE) e balão de fala, ou as últimas linhas do shell.
  // mono = true → só tons de cinza (a cor vem do material do console); mono = false → cores do visual Kali/Arch (laptop do jogador).
  const PHRASES = ['Todo sistema tem uma porta.', 'Silêncio é a melhor senha.', 'Cuidado com a câmera.', 'Sem sinal. Chegue perto.'];
  const BYTE = ['   _|_ ', '  [o_o]', ' /|[=]|\\', '  |___|', '  d   b'];
  Arena.drawShellScreen = function drawShellScreen(c, W, H, o) {
    const mono = !!o.mono, skin = o.skin || 'kali', t = o.time || 0;
    const pal = mono ? { bg: '#000', bar: '#3a3a3a', fg: '#fff', dim: '#9a9a9a', ok: '#fff', warn: '#ddd', err: '#ddd', pr: '#fff' }
      : skin === 'arch' ? { bg: '#07090c', bar: '#12202b', fg: '#cfd6dd', dim: '#6b7682', ok: '#4be08a', warn: '#ffc857', err: '#ff6b6b', pr: '#1793d1' }
      : { bg: '#0b1220', bar: '#16233b', fg: '#d7e0ee', dim: '#7b8aa3', ok: '#4be08a', warn: '#ffc857', err: '#ff6b6b', pr: '#5b8def' };
    const bar = Math.round(H * 0.11), fs = Math.max(7, Math.round(H * 0.075)), lh = fs * 1.15;
    c.fillStyle = pal.bg; c.fillRect(0, 0, W, H); c.fillStyle = pal.bar; c.fillRect(0, 0, W, bar);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => { c.fillStyle = mono ? '#bbb' : col; c.beginPath(); c.arc(bar * 0.6 + i * bar * 0.7, bar / 2, bar * 0.2, 0, Math.PI * 2); c.fill(); });
    c.font = `bold ${Math.round(bar * 0.55)}px monospace`; c.textAlign = 'center'; c.fillStyle = pal.fg; c.fillText('operador@deck: ~', W / 2 + bar, bar * 0.7);
    c.font = `bold ${fs}px monospace`; c.textAlign = 'left';
    const prompt = !mono && skin === 'kali' ? ['┌──(operador㉿deck)-[~]', '└─$ '] : ['[operador@deck ~]$ '];
    const bodyTop = bar + fs + 3, maxRows = Math.floor((H - bodyTop - lh * prompt.length) / lh);
    let y = bodyTop;
    if (o.lines && o.lines.length) {
      o.lines.slice(-maxRows).forEach(l => { c.fillStyle = pal[l.k] || pal.fg; c.fillText(String(l.t).slice(0, Math.floor(W / (fs * 0.6))), 5, y); y += lh; });
    } else {
      const ph = PHRASES[Math.floor(t / 6 + (o.seed || 0)) % PHRASES.length], w = ph.length + 2;
      const art = [' ' + '_'.repeat(w), '< ' + ph + ' >', ' ' + '-'.repeat(w), '      \\', ...BYTE.map(l => '       ' + l)];
      c.fillStyle = pal.fg; art.slice(0, maxRows).forEach(l => { c.fillText(l, 5, y); y += lh; });
    }
    y = H - lh * (prompt.length - 1) - 4; c.fillStyle = pal.pr;
    prompt.forEach((l, i) => { c.fillText(l, 5, y + i * lh); });
    if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = pal.fg; c.fillRect(5 + c.measureText(prompt[prompt.length - 1]).width, y + (prompt.length - 1) * lh - fs * 0.85, fs * 0.55, fs); }
  };
  Arena.paintIncursionScreen = function paintIncursionScreen(g, state, time, force) {
    const u = g.userData; if (!u.tctx || (!force && time < u.nextPaint)) return;
    u.nextPaint = time + 0.16; const c = u.tctx, W = 256, H = 128;
    if (state === 'standby') {
      Arena.drawShellScreen(c, W, H, { mono: true, time, seed: u.phase || 0 });
      c.fillStyle='rgba(0,0,0,.72)';c.fillRect(0,H-15,W,15);c.fillStyle='#fff';c.font='bold 8px monospace';c.textAlign='left';
      c.fillText(`SYS: STANDBY  //  ${String(u.kind).toUpperCase()}  ·  NEXUS LOCAL`,6,H-5);
      c.fillStyle='rgba(255,255,255,.65)';for(let i=0;i<5;i++)c.fillRect(W-44+i*7,H-10,3,4+(i%2)*3);
      u.tex.needsUpdate = true; return;
    }
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1; c.beginPath();
    for (let x = 0; x <= W; x += 32) { c.moveTo(x, 22); c.lineTo(x, H); } for (let y = 24; y <= H; y += 24) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke();
    c.fillStyle='rgba(255,255,255,.10)';c.fillRect(0,0,W,22);c.font='bold 9px monospace';c.textAlign='left';c.fillStyle='#fff';
    const terminalName=({kvm:'ACCESS KVM',network:'LINK ROUTER',datacenter:'CORE NODE'})[u.kind]||'FIELD NODE';
    c.fillText(`NEXUS // ${terminalName}`,7,14);c.textAlign='right';c.font='bold 8px monospace';c.fillText((SCREEN_TEXT[state]||'STANDBY').slice(0,18),W-7,14);
    const pos = NODES.map(([x, y], i) => [x * W + Math.sin(time * 1.3 + i * 1.7 + u.phase) * 6, 28 + y * (H-55) + Math.cos(time * 1.1 + i) * 3]);
    c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = 1.5; c.beginPath();
    pos.forEach((p, i) => { const q = pos[(i + 1) % pos.length], h = pos[2]; c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.moveTo(p[0], p[1]); c.lineTo(h[0], h[1]); }); c.stroke();
    c.fillStyle = '#fff'; pos.forEach((p, i) => { c.beginPath(); c.arc(p[0], p[1], i === 2 ? 6 : 4, 0, Math.PI * 2); c.fill(); });
    pos.forEach((p, i) => { const h = pos[2], f = (time * (state === 'intrusion' ? 1.6 : 0.7) + i * 0.19) % 1;      // pacotes de dados percorrendo as ligações (mais rápidos na invasão)
      c.beginPath(); c.arc(p[0] + (h[0] - p[0]) * f, p[1] + (h[1] - p[1]) * f, 2.8, 0, Math.PI * 2); c.fill(); });
    c.textAlign='left';c.font='7px monospace';c.fillText('NODES 06  ·  LINK ENCRYPTED',7,H-18);
    c.fillStyle='rgba(255,255,255,.2)';c.fillRect(7,H-11,W-14,4);
    const f=state==='committed'?1:state==='intrusion'?(time*.5)%1:state==='locked'?.16:.42;
    c.fillStyle='#fff';c.fillRect(7,H-11,(W-14)*f,4);
    c.textAlign='right';c.font='7px monospace';c.fillText(state==='locked'?'AUTH: DENIED':state==='committed'?'LINK: STABLE':state==='intrusion'?'TRACE: LIVE':'LINK: DETECTED',W-7,H-18);
    u.tex.needsUpdate = true;
  };
  Arena.updateIncursionTerminal = function updateIncursionTerminal(g, state, time) {
    if (!g || !g.userData) return;
    const next = palette[state] ? state : 'standby', pulse = next === 'intrusion' ? .65 + .35 * ((Math.sin(time * 8 + g.userData.phase) + 1) / 2) : 1;
    if (next === g.userData.state && next !== 'intrusion') return;                 // sem mudança: não mexe nos materiais
    g.userData.state = next; const color = palette[next];
    g.userData.screenMats.forEach(m => m.color.setHex(color).multiplyScalar(pulse));
    g.userData.ledMats.forEach(m => {                                              // LEDs verdes seguem o estado; os demais mantêm a própria cor
      if (m.userData.base === 0x3ddc84) m.color.setHex(next === 'standby' ? 0x3ddc84 : color).multiplyScalar(pulse);
      else m.color.setHex(next === 'locked' ? 0xff3b5f : m.userData.base);
    });
    g.scale.y += (1 + (pulse - 1) * .015 - g.scale.y) * .14;
  };
  Arena.disposeIncursionTerminal = function disposeIncursionTerminal(g) {            // libera as malhas fundidas e os materiais próprios
    if (!g) return;
    g.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    if (g.userData.tex) g.userData.tex.dispose();
    (g.userData.screenMats || []).concat(g.userData.ledMats || []).forEach(m => m.dispose());
  };
})();
