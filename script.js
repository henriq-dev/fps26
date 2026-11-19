(() => {
'use strict';

/* =====================================================================
   1. CONFIGURAÇÕES E DADOS DAS ARMAS
   ===================================================================== */
const ARENA = 28;          // meia-largura da arena (arena = 56 x 56)
let baseFov = 75;          // campo de visão (ajustável no menu)
const EYE = 1.7;           // altura dos olhos
let SENS = 0.0022;       // sensibilidade do mouse
const MAX_ALIVE = 12;      // limite de inimigos simultâneos (desempenho)

// Dados vindos dos módulos (carregados antes pelo index.html): weapons.js, enemies.js, upgrades.js, maps.js, pathfinding.js, audio.js
const { WEAPONS, TYPES } = Arena;
const career = Arena.createCareerStore();
let currentMode = 'survival', currentDifficulty = 'normal';
const urlParams = new URLSearchParams(window.location.search);
const perfMode = urlParams.get('perf') === '1';
// Interruptores de diagnóstico (funcionam em qualquer link): ?semluzes=1 &simples=1 &escala=0.5 &semneblina=1 &sempoeira=1
const FLAG = { noLights: urlParams.get('semluzes') === '1', simple: urlParams.get('simples') === '1', noFog: urlParams.get('semneblina') === '1', noDust: urlParams.get('sempoeira') === '1', scale: (v => v > 0 ? Math.min(2, Math.max(0.3, v)) : 0)(parseFloat(urlParams.get('escala'))) };
let appliedQuality = null;   // declarado cedo: loadMap(0) já consulta o modo gráfico
const simpleGfx = () => FLAG.simple || appliedQuality === 'low';   // modo leve: materiais Lambert, sem decoração PBR, sem luzes extras
const perfTelemetry = perfMode ? Arena.createPerfTelemetry(3600) : null;
const perfSample = {};
const perfCounters = { blockedCalls: 0, lineCalls: 0, pathCalls: 0, pathMs: 0 };
const perfWindow = { blockedCalls: 0, lineCalls: 0, pathCalls: 0, pathMs: 0, durationMs: 0 };
let perfScenarioActive = false, perfLastUi = 0, perfWasRunning = false;
if (perfMode) {
  const lineClear = Arena.lineClear, findPath = Arena.findPath;
  Arena.lineClear = function (grid, ax, az, bx, bz) {
    perfCounters.lineCalls++;
    return lineClear(grid, ax, az, bx, bz);
  };
  Arena.findPath = function (grid, sx, sz, tx, tz) {
    const start = performance.now(); perfCounters.pathCalls++;
    try { return findPath(grid, sx, sz, tx, tz); }
    finally { perfCounters.pathMs += performance.now() - start; }
  };
}

/* =====================================================================
   2. REFERÊNCIAS DO DOM
   ===================================================================== */
const $ = id => document.getElementById(id);
const el = {
  hp: $('hpFill'), hpTxt: $('hpTxt'), score: $('score'), wave: $('wave'), kills: $('kills'), remaining: $('remaining'), best: $('best'),
  wname: $('wname'), wrole: $('wrole'), ammo: $('ammo'), reserve: $('reserve'), slots: $('slots'),
  vignette: $('vignette'), hit: $('hitmarker'), banner: $('banner'), damageDirection: $('damageDirection'), scope: $('scope'), cross: $('crosshair'), terminalPrompt: $('terminalPrompt'),
  overlay: $('overlay'), title: $('ovTitle'), text: $('ovText'), btn: $('ovBtn'),
  objectivePanel: $('objectivePanel'), objectiveWave: $('objectiveWave'), objectiveName: $('objectiveName'), objectiveHint: $('objectiveHint'), objectiveFill: $('objectiveFill'), objectiveStatus: $('objectiveStatus'),
  reloadWrap: $('reloadWrap'), reloadBar: $('reloadBar'), reloadLabel: $('reloadLabel'),
  combo: $('combo'), comboN: $('comboN'), comboBar: $('comboBar'), feed: $('feed'), grenades: $('grenades'), credits: $('credits'), creditsHud: $('creditsHud')
};
let perfPanel = null, perfReadout = null, perfHint = null, perfToggle = null;
if (perfMode) {
  perfPanel = document.createElement('section'); perfPanel.id = 'perfPanel';
  perfPanel.setAttribute('aria-label', 'Telemetria local do jogo');
  perfPanel.innerHTML = '<header><span>DIAGNÓSTICO P19</span><span>F8 · F9 · F10</span></header><pre id="perfReadout">Aguardando o início do cenário…</pre><div id="perfHint">Clique em JOGAR para executar o cenário fixo.</div><footer><button type="button" data-perf-action="restart">Reiniciar (F9)</button><button type="button" data-perf-action="export">Exportar CSV (F10)</button><button type="button" data-perf-action="hide">Ocultar (F8)</button></footer>';
  document.body.appendChild(perfPanel);
  perfReadout = perfPanel.querySelector('#perfReadout'); perfHint = perfPanel.querySelector('#perfHint');
  perfToggle = document.createElement('button'); perfToggle.id = 'perfToggle'; perfToggle.type = 'button'; perfToggle.textContent = 'PERF';
  perfToggle.setAttribute('aria-label', 'Mostrar telemetria'); document.body.appendChild(perfToggle);
  perfToggle.addEventListener('click', () => { perfPanel.hidden = false; });
  perfPanel.addEventListener('click', event => {
    const action = event.target.closest('[data-perf-action]')?.dataset.perfAction;
    if (action === 'restart') restartPerfScenario();
    if (action === 'export') downloadPerfCsv();
    if (action === 'hide') perfPanel.hidden = true;
  });
}

/* =====================================================================
   3. CENA, CÂMERA E RENDERER (visual low-poly / retro)
   ===================================================================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10131c);
scene.fog = new THREE.Fog(0x10131c, 12, 62);

const camera = new THREE.PerspectiveCamera(baseFov, innerWidth / innerHeight, 0.05, 120);
camera.rotation.order = 'YXZ';   // yaw (Y) primeiro, depois pitch
scene.add(camera);               // a câmera na cena permite anexar a arma nela
const terminalRay = new THREE.Raycaster();
const terminalRayDir = new THREE.Vector3();

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
let prCap = Math.min(devicePixelRatio, 1.25), curPR = prCap;   // prCap = teto escolhido; curPR = valor atual (cai sozinho se o celular engasgar)
renderer.setPixelRatio(curPR);                                  // resolução reduzida = leve + retro
renderer.setSize(innerWidth, innerHeight);
$('game').appendChild(renderer.domElement);
const gpuInfo = (() => {   // qual GPU o navegador realmente usa? (software = SwiftShader/llvmpipe = sem aceleração)
  try {
    const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    return { name: String(name), software: /swiftshader|llvmpipe|software|basic render|softpipe/i.test(name) };
  } catch (e) { return { name: 'indisponível', software: false }; }
})();
const pbrMaterials = Arena.createIndustrialMaterialLibrary(THREE, renderer);
if (FLAG.noFog) scene.fog = null;

// Luzes simples e baratas
scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x20242c, 0.95));
const sun = new THREE.DirectionalLight(0xffffff, 0.55);
sun.position.set(10, 20, 6);
scene.add(sun);
const muzzleLight = new THREE.PointLight(0xffc766, 0, 12); // clarão do tiro
muzzleLight.position.set(0.3, -0.2, -1);
camera.add(muzzleLight);
// Luzes exclusivas da arma/mão: preenchimento quente e contorno frio dão volume ao viewmodel
const vmKey = new THREE.PointLight(0xfff1dc, 0.55, 2.2); vmKey.position.set(0.55, 0.35, 0.1); camera.add(vmKey);
const vmRim = new THREE.PointLight(0x7fc8ff, 0.25, 2.0); vmRim.position.set(-0.45, 0.1, -0.9); camera.add(vmRim);
function setViewModelLights(index) {
  const industrial = index === 1;
  vmKey.intensity = industrial ? 1.75 : 0.55;
  vmRim.intensity = industrial ? 0.78 : 0.25;
}

/* =====================================================================
   4. ARENA (piso, paredes e obstáculos) — o mapa muda a cada 5 ondas (veja maps.js)
   ===================================================================== */
const solids = [];   // meshes que bloqueiam tiros (raycast)
const boxes = [];    // caixas de colisão AABB (movimento)
let mapMeshes = [], curMap = -1, navGrid = null, activeMapLook = 'classic';     // navGrid = grade do A* (recriada a cada mapa)
let incTerminalViews = Object.create(null);                                     // terminais visuais, sem colisão extra
const blockGeo = new THREE.BoxGeometry(1, 1, 1);     // UM cubo unitário compartilhado: cada bloco só muda a escala
const blockMats = new Map();
function blockMat(color) {
  const simple = simpleGfx();
  const key = `${simple ? 'simple' : 'surface'}:${color}`;
  if (blockMats.has(key)) return blockMats.get(key);
  if (simple) { const lite = new THREE.MeshLambertMaterial({ color }); blockMats.set(key, lite); return lite; }   // leve: 1 cor, sem textura
  const surface = surfaceForColor(color);
  const kind = surface === 'wood' ? 'wood' : surface === 'metal' ? 'paintedMetal' : 'concrete';
  const pbrColor = new THREE.Color(color).multiplyScalar(1.16).getHex();
  const material = pbrMaterials.material(kind, pbrColor, { detailMaps: false });
  blockMats.set(key, material);
  return material;
}
function surfaceForColor(color) {
  if ([0x6b4a2b,0x8a7355].includes(color)) return 'wood';
  if ([0x2a3142,0x56606f,0x3b4558,0x3f7a6d,0x56a090,0x2f5a50,0x24413b,0x68736c].includes(color)) return 'metal';
  return 'stone';
}

const floorMats = new Map();
function floorMaterial(color) {
  const key = `${simpleGfx() ? 'simple' : 'pbr'}:${color}`;
  if (!floorMats.has(key)) floorMats.set(key, simpleGfx() ? new THREE.MeshLambertMaterial({ color }) : pbrMaterials.material('floor', color, { detailMaps: false }));
  return floorMats.get(key);
}
const floor = new THREE.Mesh(new THREE.PlaneGeometry(ARENA * 2, ARENA * 2), floorMaterial(0x959994));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const glowMats = new Map();
const glowMat = c => glowMats.get(c) || (glowMats.set(c, new THREE.MeshBasicMaterial({ color: c })), glowMats.get(c));
const ceilingMesh = new THREE.Mesh(new THREE.PlaneGeometry(ARENA * 2, ARENA * 2), new THREE.MeshLambertMaterial({ color: 0x3a444c }));
ceilingMesh.rotation.x = Math.PI / 2; ceilingMesh.visible = false; scene.add(ceilingMesh);   // virada para baixo
function addBlock(x, z, w, h, d, color, collide = true) {
  const m = new THREE.Mesh(blockGeo, blockMat(color));
  m.scale.set(w, h, d); m.position.set(x, h / 2, z); m.userData.surface = surfaceForColor(color);
  scene.add(m); solids.push(m); mapMeshes.push(m);
  if (collide) boxes.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, h });
}
// Luzes coloridas nos 4 cantos (dão profundidade sem custo alto) + faixa luminosa nas paredes (cor muda por mapa)
const stripMat = new THREE.MeshBasicMaterial({ color: 0xff5a4d });
const cornerLights = [[-ARENA + 3, -ARENA + 3, 0xff6a3d], [ARENA - 3, ARENA - 3, 0x3d9bff], [-ARENA + 3, ARENA - 3, 0xffc857], [ARENA - 3, -ARENA + 3, 0x3ddc84]].map(([x, z, c]) => {
  const l = new THREE.PointLight(c, 1.1, 22); l.userData.baseIntensity = 1.1; l.position.set(x, 3, z); scene.add(l); return l;
});
// Céu em gradiente (canvas 1×256 esticado): topo escuro, meio na cor do mapa, horizonte mais claro e arroxeado
const skyTextureCache = new Map();
function skyTexture(hex) {
  if (skyTextureCache.has(hex)) return skyTextureCache.get(hex);
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256;
  const g = cv.getContext('2d'); if (!g || typeof g.createLinearGradient !== 'function') return null;   // sem canvas 2D: cor lisa
  const c = new THREE.Color(hex), top = c.clone().multiplyScalar(0.35), bot = c.clone().multiplyScalar(1.9).lerp(new THREE.Color(0x2a1f2e), 0.35);
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#' + top.getHexString()); gr.addColorStop(0.55, '#' + c.getHexString()); gr.addColorStop(1, '#' + bot.getHexString());
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const texture = new THREE.CanvasTexture(cv);
  skyTextureCache.set(hex, texture);
  return texture;
}
function setSky(hex) {
  scene.background = skyTexture(hex) || new THREE.Color(hex); if (scene.fog) scene.fog.color.setHex(hex);
}
let cachedIndustrialDressing = null;
function addIndustrialSetDressing() {
  if (cachedIndustrialDressing) {
    scene.add(cachedIndustrialDressing); mapMeshes.push(cachedIndustrialDressing); return;
  }
  const group = new THREE.Group();
  const stripeMat = pbrMaterials.material('paintedMetal', 0xc6a04f, { roughness: 0.76, metalness: 0.16, detailMaps: false });
  const panelMat = pbrMaterials.material('paintedMetal', 0x596267, { repeat: 2, detailMaps: false });
  const railMat = pbrMaterials.material('steel', 0x59646a, { repeat: 2, detailMaps: false });
  const stripeGeo = new THREE.BoxGeometry(1.15, 0.014, 0.10);
  const stripes = new THREE.InstancedMesh(stripeGeo, stripeMat, 24);
  const dummy = new THREE.Object3D();
  let stripeIndex = 0;
  for (let x = -18; x <= 18; x += 3.6) for (const z of [-24.5, 24.5]) {
    dummy.position.set(x, 0.012, z); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
    stripes.setMatrixAt(stripeIndex++, dummy.matrix);
  }
  stripes.count = stripeIndex; stripes.instanceMatrix.needsUpdate = true; group.add(stripes);

  const longRail = new THREE.BoxGeometry(ARENA * 2, 0.07, 0.07);
  for (const z of [-27.82, 27.82]) {
    const rail = new THREE.Mesh(longRail, railMat); rail.position.set(0, 2.72, z); group.add(rail);
  }
  const sideRail = new THREE.BoxGeometry(0.07, 0.07, ARENA * 2);
  for (const x of [-27.82, 27.82]) {
    const rail = new THREE.Mesh(sideRail, railMat); rail.position.set(x, 2.72, 0); group.add(rail);
  }

  const panelGeo = new THREE.BoxGeometry(2.6, 0.50, 0.045);
  const panels = new THREE.InstancedMesh(panelGeo, panelMat, 12);
  let panelIndex = 0;
  for (const z of [-27.93, 27.93]) for (const x of [-17, 0, 17]) {
    dummy.position.set(x, 2.20, z); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
    panels.setMatrixAt(panelIndex++, dummy.matrix);
  }
  for (const x of [-27.93, 27.93]) for (const z of [-17, 0, 17]) {
    dummy.position.set(x, 2.20, z); dummy.rotation.set(0, Math.PI / 2, 0); dummy.updateMatrix();
    panels.setMatrixAt(panelIndex++, dummy.matrix);
  }
  panels.count = panelIndex; panels.instanceMatrix.needsUpdate = true; group.add(panels);
  group.userData.decorativeOnly = true;
  cachedIndustrialDressing = group;
  scene.add(group); mapMeshes.push(group);
}
// Monta uma arena: troca cores, apaga a anterior e recria a grade do A*
function loadMap(index) {
  const inc = index <= -2;                                  // -2/-3/-4 = prédios da Incursão
  const M = inc ? Arena.INCURSION_LEVELS[-2 - index] : Arena.MAPS[index % Arena.MAPS.length]; curMap = inc ? index : index % Arena.MAPS.length;
  mapMeshes.forEach(m => scene.remove(m)); mapMeshes = []; solids.length = 0; boxes.length = 0;   // length = 0 mantém a MESMA lista (outras funções a usam)
  activeMapLook = M.look || 'classic';
  setSky(M.sky);
  const floorTint = M.floorTint || new THREE.Color(M.floorA).lerp(new THREE.Color(M.floorB), 0.5).getHex();   // floorTint por mapa = piso legível
  floor.material = floorMaterial(floorTint);
  // Paredes externas (a colisão delas é feita pelo limite ARENA em blocked())
  const W = ARENA * 2 + 2;
  addBlock(0, -ARENA - 0.5, W, 6, 1, M.wall, false); addBlock(0, ARENA + 0.5, W, 6, 1, M.wall, false);
  addBlock(-ARENA - 0.5, 0, 1, 6, W, M.wall, false); addBlock(ARENA + 0.5, 0, 1, 6, W, M.wall, false);
  M.blocks.forEach(b => addBlock(...b));               // obstáculos / coberturas
  (M.glows || []).forEach(([x, y, z, w, h, d, c]) => {  // detalhes luminosos (telas, LEDs): sem colisão, material compartilhado por cor
    const g = new THREE.Mesh(blockGeo, glowMat(c)); g.scale.set(w, h, d); g.position.set(x, y, z); scene.add(g); mapMeshes.push(g);
  });
  incTerminalViews = Object.create(null);
  if (inc && Arena.createIncursionTerminal) Object.entries(M.terminals || {}).forEach(([id, terminal]) => {
    const view = Arena.createIncursionTerminal({ ...terminal, id }); scene.add(view); mapMeshes.push(view); incTerminalViews[id] = view;
  });
  ceilingMesh.visible = !!M.ceiling; if (M.ceiling) ceilingMesh.position.y = M.ceiling;   // teto só nos mapas internos
  stripMat.color.setHex(M.strip);                      // faixas luminosas (só visual: não entram em solids, não bloqueiam tiro)
  [[0, -ARENA, W, .08, .05], [0, ARENA, W, .08, .05], [-ARENA, 0, .05, .08, W], [ARENA, 0, .05, .08, W]].forEach(([x, z, w, h, d]) => {
    const m = new THREE.Mesh(blockGeo, stripMat); m.scale.set(w, h, d); m.position.set(x * 0.998, 2.2, z * 0.998);
    scene.add(m); mapMeshes.push(m);
  });
  if (activeMapLook === 'industrial' && !simpleGfx()) addIndustrialSetDressing();
  navGrid = Arena.createGrid(ARENA, 1, boxes, 0.62);   // células de 1 m; 0,62 m = raio do corpo + folga
  if (warmReady) warmScene();                          // compila/aquece a arena durante o banner de transição
  return M;
}
let warmReady = false;
loadMap(0);
// Poeira flutuando no ar (260 pontos num único objeto: barato para a GPU)
const dustPos = new Float32Array(260 * 3);
for (let i = 0; i < 260; i++) { dustPos[i * 3] = (Math.random() - .5) * ARENA * 2; dustPos[i * 3 + 1] = Math.random() * 6; dustPos[i * 3 + 2] = (Math.random() - .5) * ARENA * 2; }
const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffd9a8, size: 0.05, transparent: true, opacity: 0.5 }));
scene.add(dust); dust.visible = !FLAG.noDust;

// Colisão círculo (raio r) contra limites e caixas
function blocked(x, z, r) {
  if (perfMode) perfCounters.blockedCalls++;
  if (Math.abs(x) > ARENA - r || Math.abs(z) > ARENA - r) return true;
  for (const b of boxes) {
    if (x + r > b.minX && x - r < b.maxX && z + r > b.minZ && z - r < b.maxZ) return true;
  }
  return false;
}
const objectiveBaseGeo = new THREE.CylinderGeometry(0.9, 1.1, 0.22, 8);
const objectiveCoreGeo = new THREE.OctahedronGeometry(0.43, 0);
const objectiveRingGeo = new THREE.TorusGeometry(0.86, 0.045, 6, 28);
const objectiveMat = new THREE.MeshLambertMaterial({ color: 0x163b50, emissive: 0x0a5a70, emissiveIntensity: 0.8 });
const objectiveCoreMat = new THREE.MeshBasicMaterial({ color: 0x4de7ff });
const objectiveRingMat = new THREE.MeshBasicMaterial({ color: 0x9e7bff });
const objectiveDoneMat = new THREE.MeshBasicMaterial({ color: 0x31515b });
function clearObjectiveMarkers() {
  for (const m of objectiveMarkers) scene.remove(m);
  objectiveMarkers = []; objective = null; interactQueued = false; updateObjectiveHud();
}
function objectiveSpots(count) {
  const candidates = [[-15,-15],[15,-15],[-15,15],[15,15],[-15,0],[15,0],[0,-15],[0,15],[-20,8],[20,-8]]
    .filter(([x,z]) => !blocked(x,z,1) && Math.hypot(x-px,z-pz) > 7);
  const picked = [];
  while (picked.length < count && candidates.length) {
    let bestIndex = 0, bestScore = -Infinity;
    candidates.forEach(([x,z], i) => { const spread = picked.length ? Math.min(...picked.map(p => Math.hypot(x-p.x,z-p.z))) : 100; const score = spread + Math.hypot(x-px,z-pz)*0.08; if (score > bestScore) { bestScore = score; bestIndex = i; } });
    const [x,z] = candidates.splice(bestIndex,1)[0]; picked.push({x,z});
  }
  return picked;
}
function setupObjective() {
  clearObjectiveMarkers();
  const spec = Arena.objectiveForWave(currentMode, wave); if (!spec) return;
  objective = { ...spec, progress: 0, activeIndex: 0, complete: false, inRange: false, nodes: [] };
  for (const point of objectiveSpots(spec.nodes)) {
    const marker = new THREE.Group(); marker.position.set(point.x, 0, point.z);
    const base = new THREE.Mesh(objectiveBaseGeo, objectiveMat); base.position.y = 0.14;
    const core = new THREE.Mesh(objectiveCoreGeo, objectiveCoreMat); core.position.y = 1.1;
    const ring = new THREE.Mesh(objectiveRingGeo, objectiveRingMat); ring.position.y = 0.64; ring.rotation.x = Math.PI / 2;
    marker.add(base, core, ring); marker.userData = { core, ring }; scene.add(marker); objectiveMarkers.push(marker);
    objective.nodes.push({ x: point.x, z: point.z, marker, activated: false });
  }
  banner(`OPERAÇÃO // ${objective.name}\n${objective.hint}`, 4); updateObjectiveHud();
}
function completeObjective() {
  if (!objective || objective.complete) return;
  objective.complete = true; toSpawn = 0; bossPending = false; introQueue = []; waveDelay = 1.2; interactQueued = false; interactHeld = false;
  // Cumprir a missão encerra a onda mesmo com adversários vivos: os hostis restantes recuam sem dar recompensas.
  for (const e of enemies) if (!e.dead) { e.dead = true; recycleRig(e); }
  enemies = [];
  for (const p of projectiles) projPool.put(p.m); projectiles = [];
  for (const g of grenades) grenadePool.put(g.m); grenades = [];
  const earned = career.event('objective'); notifyAchievements(earned);
  banner('OBJETIVO CONCLUÍDO\nEXTRAÇÃO AUTORIZADA', 3.2); sfx.objective(); addFeed('OPERAÇÃO CONCLUÍDA', false);
  updateObjectiveHud(); updateHUD();
}
function interactObjective() { interactQueued = true; }
function updateObjective(dt) {
  if (!objective) return;
  if (objective.id !== 'relay') interactQueued = false;
  objectiveMarkers.forEach((m, i) => { m.userData.ring.rotation.z += dt * (i === objective.activeIndex ? 1.5 : 0.45); m.userData.core.rotation.y += dt * 1.8; });
  if (objective.complete) { updateObjectiveHud(); return; }
  const node = objective.nodes[objective.activeIndex];
  if (!node) { completeObjective(); return; }
  const dist = Math.hypot(node.x - px, node.z - pz);
  const contested = enemies.some(e => !e.dead && Math.hypot(e.g.position.x-node.x,e.g.position.z-node.z) < 3.6);
  if (objective.id === 'hold') {
    if (dist < 3.8 && !contested) objective.progress = Math.min(objective.seconds, objective.progress + dt);
    else objective.progress = Math.max(0, objective.progress - dt * (contested ? 0.7 : 0.35));
    if (objective.progress >= objective.seconds) completeObjective();
  } else if (objective.id === 'hack') {
    objective.inRange = dist < 2.8;
    if (objective.inRange && (keys.KeyE || interactHeld)) objective.progress = Math.min(objective.seconds, objective.progress + dt * (contested ? 0.55 : 1));
    else objective.progress = Math.max(0, objective.progress - dt * 0.25);
    if (objective.progress >= objective.seconds) completeObjective();
  } else {
    if (interactQueued && dist < 2.8) {
      node.activated = true; objective.activeIndex++; node.marker.userData.core.material = objectiveDoneMat;
      blastFx(node.x, 1, node.z, 1.4, 0x4de7ff, 0.35); sfx.objective();
      if (objective.activeIndex >= objective.nodes.length) completeObjective();
      else banner(`RELÉ ${objective.activeIndex}/${objective.nodes.length} ATIVADO`, 1.4);
    }
    interactQueued = false;
  }
  updateObjectiveHud();
}


/* =====================================================================
   4c. INCURSÃO — prédio em salas, terminais, escolhas e fuga (regras em incursion.js)
   A invasão é FICTÍCIA: são escolhas de jogo e uma tela cenográfica, sem comando real.
   ===================================================================== */
let incLevel = 0;
function incData() { return Arena.INCURSION_LEVELS[incLevel]; }
function incStage() { return Arena.INCURSION_STAGES[inc.stage]; }
function incTarget() { const st = incStage(), M = incData(); return st.exit ? M.exit : M.terminals[st.terminal]; }
function incHint(st) { return (incData().hints && incData().hints[Arena.INCURSION_STAGES.indexOf(st)]) || st.hint; }
function terminalHasLineOfSight(t, dist) {
  const dx = t.x - px, dz = t.z - pz, desired = Math.atan2(-dx, -dz);
  const angle = Math.abs(Math.atan2(Math.sin(desired - yaw), Math.cos(desired - yaw)));
  if (angle > 0.95) return false;
  terminalRayDir.set(dx, 1.48 - py, dz); const length = terminalRayDir.length(); terminalRayDir.normalize();
  terminalRay.set(new THREE.Vector3(px, py, pz), terminalRayDir);
  const hit = terminalRay.intersectObjects(solids, false)[0];
  return !hit || hit.distance > Math.min(dist + 0.2, length - 0.18);
}
function cancelTerminalInteraction(reason = 'OPERAÇÃO INTERROMPIDA') {
  if (!inc || (!terminalInteraction.active && !terminalInteraction.id && !inc.hold)) return;
  const hadProgress = inc.hold > 0;
  terminalInteraction.active = false; terminalInteraction.canUse = false; terminalInteraction.lockout = true; terminalInteraction.focus = 0;
  terminalInteraction.id = null; inc.hold = 0; interactHeld = false;
  if (el.terminalPrompt) el.terminalPrompt.classList.add('hidden');
  if (hadProgress && reason) { banner(reason, 1.25); addFeed(reason, false); }
}
function refreshTerminalInteraction() {
  if (!el.terminalPrompt) return;
  if (!inc || inc.done || inc.choiceOpen || incStage().exit) {
    el.terminalPrompt.classList.add('hidden'); terminalInteraction.active = false; terminalInteraction.canUse = false; terminalInteraction.focus = 0; terminalInteraction.id = null; return;
  }
  if (!keys.KeyE && !interactHeld) terminalInteraction.lockout = false;
  const t = incTarget(), dist = Math.hypot(t.x - px, t.z - pz), near = dist < 3.1;
  const canUse = near && terminalHasLineOfSight(t, dist);
  terminalInteraction.canUse = canUse;
  const held = (keys.KeyE || interactHeld) && canUse && !terminalInteraction.lockout;
  if (terminalInteraction.active && !canUse) cancelTerminalInteraction('LINHA DE VISÃO PERDIDA');
  terminalInteraction.active = held;
  terminalInteraction.id = held ? incStage().terminal : null;
  terminalInteraction.focus += ((held ? 1 : 0) - terminalInteraction.focus) * Math.min(1, .16);
  el.terminalPrompt.classList.toggle('hidden', !near);
  const title = el.terminalPrompt.querySelector('b'), hint = el.terminalPrompt.querySelector('small');
  if (near && !canUse) { title.textContent = terminalInteraction.lockout ? 'SOLTE E PARA TENTAR NOVAMENTE' : 'OLHE PARA O TERMINAL'; hint.textContent = 'MANTENHA A MIRA NO CONSOLE'; }
  else if (held) { title.textContent = `E · OPERANDO ${t.name}`; hint.textContent = `INVASÃO ${Math.floor((inc.hold / incStage().hold) * 100)}% · NÃO SE AFASTE`; }
  else { title.textContent = `E · OPERAR ${t.name}`; hint.textContent = 'SEGURE PARA INVADIR'; }
}
function updateIncursionTerminalViews() {
  if (!inc || !Arena.updateIncursionTerminal) return;
  Object.entries(incTerminalViews).forEach(([id, view]) => {
    const stageIndex = Arena.INCURSION_STAGES.findIndex(st => st.terminal === id);
    let state = stageIndex >= 0 && stageIndex < inc.stage ? 'committed' : 'standby';
    if (!inc.done && stageIndex === inc.stage && incStage().terminal === id) state = inc.hold > 0 ? 'intrusion' : inc.inRange ? 'detected' : 'standby';
    if (inc.alarmT > 0 && state === 'standby') state = 'locked';
    Arena.updateIncursionTerminal(view, state, inc.time);
  });
}
function startIncursion() {
  incLevel = Math.min(Arena.INCURSION_LEVELS.length - 1, Math.max(0, parseInt($('incLevelSelect').value, 10) || 0));
  loadMap(-2 - incLevel); clearPickups(); clearSurfaceImpacts(); px = 0; pz = 0; vx = vz = 0;
  terminalInteraction.id = null; terminalInteraction.active = false; terminalInteraction.canUse = false; terminalInteraction.lockout = false; terminalInteraction.focus = 0;
  inc = { stage: 0, hold: 0, inRange: false, security: null, targets: [], fx: Arena.incursionEffects(null, []), spawned: 0, spawnT: 2, alarmT: 0, overrun: false,
          marker: null, choiceOpen: false, done: false, droneT: 0, droneCd: 0, time: 0 };
  toSpawn = 0; bossPending = false; introQueue = []; waveDelay = 1e9;
  enterIncStage(0);
}
function enterIncStage(i) {
  const prevWave = wave; inc.stage = i; inc.hold = 0; inc.spawned = 0; inc.spawnT = 2.2; wave = 2 + 2 * i;
  if (i > 0) { health = Math.min(maxHealth, health + 30); ammoState.forEach((s, k) => { s.reserve += Math.ceil(WEAPONS[k].reserve * 0.3); }); addFeed('SETOR LIMPO · +30 VIDA · MUNIÇÃO', false); }
  WEAPONS.forEach((w, k) => { const u = w.unlock || 1; if (u > prevWave && u <= wave) addFeed(`NOVA ARMA: ${w.name.toUpperCase()} [${k + 1}]`, false); });
  const st = incStage(), t = incTarget();
  if (inc.marker) scene.remove(inc.marker);
  const marker = new THREE.Group(); marker.position.set(t.x, 0, t.z);
  const base = new THREE.Mesh(objectiveBaseGeo, objectiveMat); base.position.y = 0.14;
  const core = new THREE.Mesh(objectiveCoreGeo, st.exit ? new THREE.MeshBasicMaterial({ color: 0x3ddc84 }) : objectiveCoreMat); core.position.y = 1.1;
  const ring = new THREE.Mesh(objectiveRingGeo, objectiveRingMat); ring.position.y = 0.64; ring.rotation.x = Math.PI / 2;
  marker.add(base, core, ring); marker.userData = { core, ring }; scene.add(marker); inc.marker = marker;
  banner(`${incData().name.toUpperCase()} // ${st.title}\n${incHint(st)}`, 4.4); updateObjectiveHud(); updateHUD();
}
function updateIncursionHud() {
  const active = inc && !inc.done;
  el.objectivePanel.classList.toggle('hidden', !inc);
  if (!inc) return;
  const st = incStage();
  el.objectiveWave.textContent = `INCURSÃO · SETOR ${inc.stage + 1}/${Arena.INCURSION_STAGES.length}`;
  el.objectiveName.textContent = `${incData().name.toUpperCase()} · ${st.title}`; el.objectiveHint.textContent = incHint(st);
  let ratio = 0, status = 'MISSÃO CUMPRIDA';
  if (active && st.exit) { const t = incTarget(); status = `SAÍDA A ${Math.round(Math.hypot(t.x - px, t.z - pz))} m`; ratio = 1; }
  else if (active) { ratio = inc.hold / st.hold; status = inc.inRange ? `INVASÃO ${Math.floor(ratio * 100)}% · SEGURE E` : 'APROXIME-SE DO CONSOLE E SEGURE E'; }
  if (inc.alarmT > 0) status += ` · ALARME ${Math.ceil(inc.alarmT)}s`; else if (inc.overrun && active) status += ' · RESPOSTA TOTAL';
  status += inc.droneT > 0 ? ` · DRONE ${Math.ceil(inc.droneT)}s` : inc.droneCd > 0 ? ` · DRONE ${Math.ceil(inc.droneCd)}s` : ' · DRONE [F]';
  el.objectiveFill.style.width = `${clamp(ratio, 0, 1) * 100}%`; el.objectiveStatus.textContent = status;
}
function useDrone() {
  if (!inc || inc.done) return;
  if (inc.droneT > 0 || inc.droneCd > 0) { addFeed('DRONE EM RECARGA', false); return; }
  inc.droneT = inc.fx.droneTime; inc.droneCd = inc.fx.droneTime + inc.fx.droneCooldown;
  banner('DRONE EM VOO\nINIMIGOS MARCADOS NO RADAR', 1.6); sfx.objective();
}
function updateIncursion(dt) {
  inc.time += dt;
  updateIncursionTerminalViews();
  const st = incStage();
  if (inc.marker) { inc.marker.userData.ring.rotation.z += dt * 1.5; inc.marker.userData.core.rotation.y += dt * 1.8; }
  inc.droneT = Math.max(0, inc.droneT - dt); inc.droneCd = Math.max(0, inc.droneCd - dt);
  if (inc.alarmT > 0) {                                                        // alarme: só troca cores (não mexe em luzes = sem recompilar shader)
    inc.alarmT -= dt; const f = (Math.sin(inc.time * 7) + 1) / 2;
    stripMat.color.setRGB(0.6 + 0.4 * f, 0.1, 0.08); if (scene.fog) scene.fog.color.setRGB(0.12 + 0.1 * f, 0.02, 0.02);
    if (inc.alarmT <= 0) { inc.overrun = true; banner('RESPOSTA TOTAL\nREFORÇOS ACELERADOS', 2.6); }
  }
  if (inc.done) return;
  const budget = Arena.incursionBudget(st, inc.fx);                            // reforços contínuos até o limite do setor
  inc.spawnT -= dt;
  if (inc.spawnT <= 0 && (budget < 0 || inc.spawned < budget) && enemies.filter(e => !e.dead).length < Math.min(MAX_ALIVE, st.spawn.max + inc.fx.risk)) {
    spawnEnemy(pickType()); inc.spawned++; inc.spawnT = Arena.incursionInterval(st, inc.fx, inc.overrun); updateHUD();
  }
  if (inc.choiceOpen) return;
  const t = incTarget(), dist = Math.hypot(t.x - px, t.z - pz);
  if (st.exit) { if (dist < 2.6) finishIncursion(); }
  else {
    inc.inRange = terminalInteraction.canUse;
    const contested = enemies.some(e => !e.dead && Math.hypot(e.g.position.x - t.x, e.g.position.z - t.z) < 4);   // inimigo perto atrasa a invasão
    if (inc.inRange && (keys.KeyE || interactHeld)) inc.hold = Math.min(st.hold, inc.hold + dt * (contested ? 0.55 : 1));
    else inc.hold = Math.max(0, inc.hold - dt * 0.25);
    if (inc.hold >= st.hold) { if (st.choose) openIncChoice(st); else { banner('ACESSO CONCEDIDO\nPRÓXIMO SETOR', 2); sfx.objective(); enterIncStage(inc.stage + 1); } }
  }
  updateIncursionHud();
}
function finishIncursion() {
  inc.done = true; incVictory = true;
  const bonus = 2000 + Math.max(0, Math.round(600 - inc.time)) * 2;
  score += bonus; addFeed(`FUGA CONCLUÍDA  +${bonus}`, false);
  gameOver();
}

/* ---- Terminal de invasão (tela cenográfica): escolha, rede em 3D falsa e registro fictício ---- */
const incTermEl = $('incTerm'), incOptionsEl = $('incOptions'), incLogEl = $('incLog'), incConfirmEl = $('incConfirm'), incNetEl = $('incNet');
let incSel = new Set(), incPhase = 'choose', incNetRaf = 0, incLogTimers = [];
function openIncChoice(st) {
  inc.choiceOpen = true; locked = false; mouseHeld = false; scoped = false; interactHeld = false; keys.KeyE = false;
  if (document.pointerLockElement) document.exitPointerLock();
  const multi = st.choose === 'target', list = multi ? Arena.INCURSION_TARGETS : Arena.INCURSION_SECURITY;
  incPhase = 'choose'; incSel.clear(); incLogEl.textContent = ''; incOptionsEl.innerHTML = '';
  $('incTitle').textContent = multi ? 'DATACENTER // OBJETIVO FINAL' : 'REDE DE SEGURANÇA // ESCOLHA UM SISTEMA';
  $('incInfo').textContent = (multi ? 'Escolha um ou mais objetivos (teclas 1–4). Combinar rende bônus, mas aumenta o risco na fuga.' : 'Escolha um sistema (teclas 1–3).') + ' Tela cenográfica: nada aqui é real.';
  $('incNodeId').textContent = String(7 + inc.stage).padStart(2, '0');
  $('incStatus').innerHTML = `<span></span>${multi ? 'DATACENTER · ROOT ACCESS' : 'SECURITY · PERIMETER LINK'}`;
  list.forEach((o, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'perk'; b.dataset.id = o.id;
    b.innerHTML = `<b>${i + 1} · ${o.name}</b>${o.desc}${multi ? `<small>risco ${'▮'.repeat(o.risk)}${'▯'.repeat(3 - o.risk)}</small>` : ''}`;
    b.addEventListener('click', () => toggleIncOption(o.id, multi)); incOptionsEl.appendChild(b);
  });
  incConfirmEl.textContent = 'CONFIRMAR'; incConfirmEl.disabled = true; incTermEl.classList.remove('hidden'); startIncNet();
}
function toggleIncOption(id, multi) {
  if (incPhase !== 'choose') return;
  if (multi) { incSel.has(id) ? incSel.delete(id) : incSel.add(id); } else { incSel.clear(); incSel.add(id); }
  [...incOptionsEl.children].forEach(b => b.classList.toggle('on', incSel.has(b.dataset.id))); incConfirmEl.disabled = incSel.size === 0;
}
function runIncSequence() {                                                    // texto cenográfico "digitando": conexão, bloqueio, avanço, resultado
  incPhase = 'run'; incConfirmEl.disabled = true;
  $('incStatus').innerHTML = '<span></span>EXECUTING · SIMULATION LOCK';
  const names = { cameras: 'sensores-cam: desligando', reforcos: 'fila-reforço: pausando', drone: 'canal-drone: ampliando', derrubar: 'nó-central: derrubando', virus: 'nós: corrompendo (fictício)', dados: 'pacote-dados: copiando', destruir: 'núcleo: sobrecarga simulada' };
  const lines = ['[SIM] conectando à rede fictícia …  OK', '[SIM] contornando firewall-ficção …  OK', ...[...incSel].map(id => `[SIM] ${names[id]} …  OK`), '[SIM] resultado: SUCESSO  — pressione CONTINUAR'];
  incLogEl.textContent = ''; incLogTimers.forEach(clearTimeout); incLogTimers = [];
  lines.forEach((l, i) => incLogTimers.push(setTimeout(() => {
    incLogEl.textContent += l + '\n';
    if (i === lines.length - 1) { incPhase = 'done'; incConfirmEl.textContent = 'CONTINUAR'; incConfirmEl.disabled = false; incConfirmEl.focus(); }
  }, 420 * (i + 1))));
}
function applyIncChoice() {
  const st = incStage(), sel = [...incSel];
  if (st.choose === 'security') { inc.security = sel[0]; inc.fx = Arena.incursionEffects(inc.security, inc.targets); }
  else {
    inc.targets = sel; inc.fx = Arena.incursionEffects(inc.security, sel);
    score += inc.fx.score; credits += inc.fx.credits; inc.alarmT = inc.fx.alarmSeconds;
    if (inc.fx.speedMul < 1) enemies.forEach(e => { if (!e.dead) e.speed *= inc.fx.speedMul; });
    if (sel.includes('destruir')) { [[20, 1.6, 18], [14, 1.6, 24], [24, 1.6, 12]].forEach(([x, y, z]) => blastFx(x, y, z, 3.2, 0xff6a3d, 0.7)); shake = Math.max(shake, 0.7); }
    if (inc.fx.score) addFeed(`OBJETIVO FINAL  +${inc.fx.score}${inc.fx.credits ? ' · +' + inc.fx.credits + '¢' : ''}`, false);
  }
  closeIncTerm(); inc.choiceOpen = false; inc.hold = 0; sfx.objective(); enterIncStage(inc.stage + 1);
  if (useTouch) locked = true;
  else { canvas.requestPointerLock(); setTimeout(() => { if (!locked && alive && !(inc && inc.choiceOpen)) showOverlay('pause'); }, 400); }
}
incConfirmEl.addEventListener('click', () => { if (incPhase === 'choose' && incSel.size) runIncSequence(); else if (incPhase === 'done') applyIncChoice(); });
function incTermKey(e) {
  const k = parseInt(e.key, 10), multi = incStage().choose === 'target', list = multi ? Arena.INCURSION_TARGETS : Arena.INCURSION_SECURITY;
  if (k >= 1 && k <= list.length) toggleIncOption(list[k - 1].id, multi);
  else if (e.code === 'Enter') incConfirmEl.click();
}
function closeIncTerm() { incTermEl.classList.add('hidden'); cancelAnimationFrame(incNetRaf); incLogTimers.forEach(clearTimeout); incLogTimers = []; incPhase = 'choose'; }
// Rede "em 3D": pontos giram e são projetados em 2D no canvas (perspectiva simples). Não usa WebGL.
const incNodes = (() => { const n = [{ x: 0, y: 0, z: 0, k: 'core' }, { x: -1.6, y: 0.2, z: 0, k: 'gate' }];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) n.push({ x: 0.5 + c * 0.45, y: -0.7 + r * 0.7, z: -0.9 + (c % 2) * 1.8, k: 'rack' });
  return n; })();
function startIncNet() {
  const g = incNetEl.getContext && incNetEl.getContext('2d'); if (!g) return;
  const W = incNetEl.width, Hh = incNetEl.height;
  const frame = now => {
    const t = now / 1000, a = t * 0.5, ca = Math.cos(a), sa = Math.sin(a);
    g.clearRect(0, 0, W, Hh); g.fillStyle = 'rgba(4,10,16,.92)'; g.fillRect(0, 0, W, Hh);
    g.strokeStyle = 'rgba(77,231,255,.10)'; g.lineWidth = 1;
    for (let x = 0; x <= W; x += 36) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke(); }
    for (let y = 0; y <= Hh; y += 28) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.fillStyle = 'rgba(151,204,218,.55)'; g.font = '9px ui-monospace, monospace'; g.fillText('NEXUS / ROUTE GRAPH', 14, 19); g.fillText(`FRAME ${String(Math.floor(t * 24) % 9999).padStart(4, '0')}`, W - 86, 19);
    const dead = incSel.has('derrubar'), vir = incSel.has('virus'), boom = incSel.has('destruir'), steal = incSel.has('dados');
    const P = incNodes.map(n => { const x = n.x * ca - n.z * sa, z = n.x * sa + n.z * ca, s = 260 / (260 + z * 90); return { x: W / 2 + x * 90 * s, y: Hh / 2 + n.y * 70 * s, s, k: n.k }; });
    g.lineWidth = 1;
    for (let i = 1; i < P.length; i++) {
      g.strokeStyle = dead ? 'rgba(80,90,100,.4)' : boom ? 'rgba(255,106,61,.5)' : 'rgba(77,231,255,.35)';
      g.beginPath(); g.moveTo(P[0].x, P[0].y); g.lineTo(P[i].x, P[i].y); g.stroke();
      if (!dead && !boom) { const f = (t * (.16 + (i % 3) * .07) + i * .11) % 1; g.fillStyle = steal && i === 1 ? '#3ddc84' : '#ffc857'; g.fillRect(P[0].x + (P[i].x - P[0].x) * f - 1.5, P[0].y + (P[i].y - P[0].y) * f - 1.5, 3, 3); }
    }
    P.forEach((p, i) => {
      const flick = vir && Math.sin(t * 9 + i * 2.1) > 0.2;
      g.fillStyle = dead ? '#46505a' : boom ? (Math.sin(t * 8 + i) > 0 ? '#ff6a3d' : '#ffb04d') : flick ? '#9e7bff' : p.k === 'core' ? '#ffc857' : '#4de7ff';
      g.beginPath(); g.arc(p.x, p.y, (p.k === 'core' ? 6 + Math.sin(t * 5) * 1.2 : 3.4) * p.s, 0, 7); g.fill();
      if (p.k === 'core' && !dead) { g.strokeStyle = boom ? '#ff6a3d' : '#4de7ff'; g.globalAlpha = .4; g.beginPath(); g.arc(p.x, p.y, 14 * p.s, 0, 7); g.stroke(); g.globalAlpha = 1; }
    });
    if (steal) { const f = (t * 0.8) % 1; g.fillStyle = '#3ddc84'; g.fillRect(P[0].x + (P[1].x - P[0].x) * f - 3, P[0].y + (P[1].y - P[0].y) * f - 3, 6, 6); }   // "pacote de dados" indo ao portão
    incNetRaf = requestAnimationFrame(frame);
  };
  cancelAnimationFrame(incNetRaf); incNetRaf = requestAnimationFrame(frame);
}

/* =====================================================================
   5. ÁUDIO — todo o código está em audio.js; aqui só ligamos ao jogo
   ===================================================================== */
const audio = Arena.createAudio(() => +($('volumeRange')?.value ?? 0.7));
const sfx = audio.sfx;

/* =====================================================================
   6. ARMAS EM PRIMEIRA PESSOA — silhuetas low-poly e componentes por papel
   ===================================================================== */
const gunGeoCache = new Map(), gunMatCache = new Map();
const GUN_FINISHES = {
  'satin-steel': { specular: 0x8a99a8, shininess: 48 }, 'phosphate-polymer': { specular: 0x353c44, shininess: 24 },
  'brushed-alloy': { specular: 0x9aa9b8, shininess: 58 }, 'wood-and-steel': { specular: 0x66503a, shininess: 28 },
  'precision-matte': { specular: 0x566273, shininess: 34 }, 'aged-steel-wood': { specular: 0x786347, shininess: 38 },
  'ceramic-energy': { specular: 0x8bcfd6, shininess: 52 }, 'field-oxidized': { specular: 0x67745b, shininess: 31 }
};
let activeGunFinish = 'satin-steel';
let activeGunPbr = false;
function gunSurface(color) {
  if ([0x202630,0x20252a,0x111720,0x303941,0x343b42,0x22282d,0x262f32].includes(color)) return 'polymer';
  if ([0x46515e,0x75818e,0x707b83,0x4a5358,0x59646a,0x687378,0x87939e].includes(color)) return 'steel';
  return 'paintedMetal';
}
function gunMaterial(color, emissive) {
  const finish = GUN_FINISHES[activeGunFinish] || GUN_FINISHES['satin-steel'];
  const key = `${activeGunPbr ? 'pbr' : 'classic'}:${activeGunFinish}:${color}:${emissive}`;
  let mat = gunMatCache.get(key);
  if (!mat) {
    mat = activeGunPbr
      ? pbrMaterials.material(gunSurface(color), color, { emissive, emissiveIntensity: emissive ? 0.32 : 0 })
      : new THREE.MeshPhongMaterial({ color, emissive, specular: finish.specular, shininess: finish.shininess, emissiveIntensity: emissive ? 0.32 : 0 });
    gunMatCache.set(key, mat);
  }
  return mat;
}
function gunBox(g, w, h, d, x, y, z, color, rz = 0, emissive = 0) {
  const key = `b:${w}:${h}:${d}`;
  let geo = gunGeoCache.get(key); if (!geo) { geo = new THREE.BoxGeometry(w, h, d); gunGeoCache.set(key, geo); }
  const mat = gunMaterial(color, emissive);
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.z = rz; g.add(m); return m;
}
function gunSoftBox(g, w, h, d, x, y, z, color, rz = 0, emissive = 0) {
  const key = `soft:${w}:${h}:${d}`;
  let geo = gunGeoCache.get(key);
  if (!geo) {
    const radius = Math.min(w, h) * 0.14;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 + radius, -h / 2);
    shape.lineTo(w / 2 - radius, -h / 2); shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + radius);
    shape.lineTo(w / 2, h / 2 - radius); shape.quadraticCurveTo(w / 2, h / 2, w / 2 - radius, h / 2);
    shape.lineTo(-w / 2 + radius, h / 2); shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - radius);
    shape.lineTo(-w / 2, -h / 2 + radius); shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + radius, -h / 2);
    const bevel = Math.min(radius * 0.42, d * 0.10);
    geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 3 });
    geo.translate(0, 0, -d / 2); gunGeoCache.set(key, geo);
  }
  const m = new THREE.Mesh(geo, gunMaterial(color, emissive));
  m.position.set(x, y, z); m.rotation.z = rz; g.add(m); return m;
}
function gunInstancedBoxes(g, w, h, d, color, transforms, emissive = 0) {
  if (!transforms.length) return null;
  const key = `b:${w}:${h}:${d}`;
  let geo = gunGeoCache.get(key); if (!geo) { geo = new THREE.BoxGeometry(w, h, d); gunGeoCache.set(key, geo); }
  const mesh = new THREE.InstancedMesh(geo, gunMaterial(color, emissive), transforms.length);
  const dummy = new THREE.Object3D();
  transforms.forEach(([x, y, z, rz = 0], i) => {
    dummy.position.set(x, y, z); dummy.rotation.set(0, 0, rz); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; g.add(mesh); return mesh;
}
function gunCylinder(g, radius, length, x, y, z, color, segments = 8, emissive = 0) {
  const key = `c:${radius}:${length}:${segments}`;
  let geo = gunGeoCache.get(key); if (!geo) { geo = new THREE.CylinderGeometry(radius, radius, length, segments, 1); geo.rotateX(Math.PI / 2); gunGeoCache.set(key, geo); }
  const mat = gunMaterial(color, emissive);
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m;
}
function gunRing(g, radius, tube, x, y, z, color, emissive = 0) {
  const key = `r:${radius}:${tube}`;
  let geo = gunGeoCache.get(key); if (!geo) { geo = new THREE.TorusGeometry(radius, tube, 5, 10); gunGeoCache.set(key, geo); }
  const mat = gunMaterial(color, emissive);
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m;
}
function gunScrew(g,x,y,z,color=0x75818e){
  gunCylinder(g,.008,.006,x,y,z,color,6);
  gunBox(g,.011,.002,.004,x,y,z+.004,0x202630);
}
const FLASH_PROFILES = {
  compact: { rays: 6, length: 0.86, width: 0.7 }, rifle: { rays: 8, length: 1.25, width: 0.72 },
  bloom: { rays: 10, length: 1.3, width: 1.12 }, scatter: { rays: 8, length: 1.62, width: 1.25 },
  needle: { rays: 4, length: 1.85, width: 0.42 }, heavy: { rays: 10, length: 1.45, width: 1.3 },
  arc: { rays: 6, length: 2.0, width: 0.48 }, pulse: { rays: 8, length: 1.05, width: 1.05 }
};
const flashGlowTex = (() => {   // brilho radial suave do clarão (canvas, sem arquivos)
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,220,160,.7)'); gr.addColorStop(1, 'rgba(255,140,40,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();
function flashStar(rays) {
  const shape = new THREE.Shape();
  for (let i = 0; i < rays * 2; i++) {
    const a = i / (rays * 2) * Math.PI * 2, r = i % 2 ? 0.3 : 1;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (!i) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath(); return new THREE.ShapeGeometry(shape);
}
function gunFlash(g, muzzleZ, size, kind) {
  const profile = FLASH_PROFILES[kind] || FLASH_PROFILES.rifle, f = new THREE.Group();
  const outerMat = new THREE.MeshBasicMaterial({ color: 0xffae56, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xfff5d4, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const rayMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const outer = new THREE.Mesh(flashStar(profile.rays), outerMat);
  outer.scale.set(size * profile.length, size * profile.width, 1); outer.position.z = -0.012;
  const core = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.19, size * 0.9), coreMat);
  const streakA = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.055, size * 1.42), rayMat);
  const streakB = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.055, size * 1.18), rayMat); streakB.rotation.z = Math.PI / 2;
  streakA.position.z = 0.012; streakB.position.z = 0.012;
  const glowMat = new THREE.SpriteMaterial({ map: flashGlowTex, color: 0xffae56, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const glow = new THREE.Sprite(glowMat); glow.scale.setScalar(size * 2.6);
  const sideMat = outerMat.clone(); sideMat.opacity = 0.55;
  const side = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.5, size * profile.length * 1.1), sideMat); side.rotation.x = Math.PI / 2; side.position.z = -size * 0.45;
  f.add(glow, outer, core, streakA, streakB, side); f.position.set(0, 0.02, muzzleZ); f.visible = false;
  f.userData = { outerMat, coreMat, rayMat, glowMat, sideMat, glow, outer, base: size }; g.add(f); g.userData.flash = f;
}
function tintFlash(f, color) { f.userData.glowMat.color.setHex(color); f.userData.sideMat.color.setHex(color); f.userData.outerMat.color.setHex(color); f.userData.coreMat.color.setHex(color).lerp(new THREE.Color(0xffffff), 0.62); f.userData.rayMat.color.setHex(0xffffff); }
function buildGun(index, muzzleZ, flashSize) {
  const g = new THREE.Group();
  activeGunFinish = WEAPONS[index].visual?.finish || 'satin-steel';
  activeGunPbr = index === 1;
  const dark = activeGunPbr ? 0x303a3d : 0x202630, steel = activeGunPbr ? 0x6b7a80 : 0x46515e;
  const edge = activeGunPbr ? 0xa0aaac : 0x75818e, grip = activeGunPbr ? 0x35403f : 0x20252a;
  const accent = [0xffd27a, 0x8be36d, 0xff9d4d, 0xffc857, 0xc7d9ff, 0xff8f5f, 0x59e8ff, 0x35d6c8][index];
  const glow = [0x6e481c, 0x304d24, 0x6d371b, 0x684d1b, 0x384767, 0x6d3024, 0x14505d, 0x14534d][index];
  const box = (...a) => gunBox(g, ...a), cyl = (...a) => gunCylinder(g, ...a), ring = (...a) => gunRing(g, ...a);
  const reloadParts = {};
  const makeReloadPart = mesh => ({ mesh, pos: mesh.position.clone(), rot: mesh.rotation.clone(), scale: mesh.scale.clone(), visible: mesh.visible, emissive: mesh.material?.emissiveIntensity || 0 });
  const movable = (key, mesh) => (reloadParts[key] = makeReloadPart(mesh), reloadParts[key]);
  const heatMaterials = [];
  const trackHeat = mesh => {
    const material = mesh.material.clone(); mesh.material = material;
    material.emissive.setHex(0x9e240e); material.emissiveIntensity = 0;
    heatMaterials.push({ material, baseColor: material.color.clone() }); return mesh;
  };

  if (index === 0) { // Pistola: ferrolho quadrado, cano exposto e guarda-mato
    box(.105,.105,.34, 0,.015,-.095,steel); box(.084,.052,.28, 0,.071,-.11,dark);
    box(.035,.018,.23, 0,.102,-.12,edge); box(.08,.135,.13, 0,-.12,.015,dark,.10);
    box(.064,.025,.13, 0,-.151,.015,0x353b42,.10); box(.07,.06,.08, 0,-.092,-.055,steel);
    movable('magazine', box(.055,.075,.058,0,-.19,.055,0x343b44));
    cyl(.022,.19,0,.015,-.305,dark,10); ring(.023,.006,0,.015,-.402,edge);
    box(.014,.035,.045, 0,.105,-.24,accent,0,glow); box(.014,.024,.035, 0,.097,.018,accent);
    for (let i=0;i<4;i++) box(.012,.008,.018, .049,.08,-.19+i*.045,edge);
    ring(.047,.006,0,-.105,.015,edge); box(.012,.065,.05, -.045,-.08,.04,accent,.10,glow);
    movable('bolt', box(.022,.022,.12,.062,.067,-.13,edge));
    box(.052,.014,.024,0,.123,.035,edge);box(.018,.025,.024,0,.113,-.29,accent,0,glow); // alça traseira e massa frontal
    for(let i=0;i<6;i++){box(.003,.034,.008,-.052,.072,-.02-i*.021,edge);box(.003,.034,.008,.052,.072,-.02-i*.021,edge);}
    for(let i=0;i<4;i++){box(.002,.003,.043,-.036,-.164+i*.018,.055,0x66717b);box(.002,.003,.043,.036,-.164+i*.018,.055,0x66717b);}
  } else if (index === 1) { // Fuzil industrial: receptor usinado, polímero, trilhos e óptica compacta
    const polymer = 0x394340, coated = 0x4b595b, alloy = 0x778588;
    // Coronha telescópica, placa de recuo e encaixe reforçado.
    gunSoftBox(g,.086,.082,.235,0,.006,.235,0x505b4b,.025);
    gunSoftBox(g,.098,.095,.052,0,.006,.105,alloy); gunSoftBox(g,.090,.103,.028,0,.006,.367,coated);
    gunSoftBox(g,.098,.105,.022,0,.006,.392,0x626b6b); gunSoftBox(g,.096,.027,.14,0,.058,.235,0x5d6657,.025);
    gunInstancedBoxes(g,.088,.008,.012,0x69716b,Array.from({length:4},(_,i)=>[0,-.031,.185+i*.026]));

    // Receptor em camadas com janela de ejeção, guarda-mato e controles laterais.
    gunSoftBox(g,.106,.098,.37,0,.004,-.24,steel);
    gunSoftBox(g,.094,.050,.30,0,.068,-.26,coated); box(.108,.014,.25,0,-.052,-.20,alloy);
    box(.018,.027,.11,.055,.035,-.15,0x111720); box(.008,.032,.072,.064,.035,-.15,edge);
    box(.025,.028,.055,-.059,.032,-.21,coated); box(.016,.018,.052,-.069,.032,-.21,alloy);
    box(.074,.135,.17,0,-.102,.025,polymer,.16);
    box(.062,.095,.014,-.037,-.12,.034,coated,.16); box(.062,.095,.014,.037,-.12,.034,coated,.16);
    ring(.048,.005,0,-.074,-.042,alloy); box(.012,.048,.026,0,-.078,-.042,edge,.10);

    // Carregador completo em um grupo: as nervuras acompanham a animação de recarga.
    const magazine = new THREE.Group(); magazine.position.set(0,-.132,-.094); g.add(magazine);
    gunSoftBox(magazine,.074,.148,.172,0,0,0,polymer,.055);
    gunBox(magazine,.080,.016,.180,0,-.066,.004,alloy,.055);
    const magRibs=[];
    for(let i=0;i<5;i++) for(const side of [-1,1]) magRibs.push([side*.039,-.035+i*.016,0]);
    gunInstancedBoxes(magazine,.004,.008,.126,alloy,magRibs);
    gunBox(magazine,.050,.018,.040,0,.064,-.004,0x3d4547);
    movable('magazine',magazine);

    // Guarda-mão flutuante, cobertura superior e trilhos laterais com ranhuras de ventilação.
    gunSoftBox(g,.092,.086,.355,0,.008,-.565,coated);
    box(.100,.018,.325,0,.055,-.56,alloy);
    const sideRails=[], vents=[], railRidges=[];
    for(const side of [-1,1]) {
      sideRails.push([side*.050,.006,-.565]);
      for(let i=0;i<6;i++) {
        const z=-.425-i*.046;
        vents.push([side*.058,.009,z]); railRidges.push([side*.058,.033,z]);
      }
    }
    gunInstancedBoxes(g,.014,.036,.32,0x424b4e,sideRails);
    gunInstancedBoxes(g,.003,.016,.024,0x11171a,vents);
    gunInstancedBoxes(g,.010,.008,.034,alloy,railRidges);
    box(.042,.016,.20,0,.075,-.56,steel);
    gunInstancedBoxes(g,.052,.009,.018,alloy,Array.from({length:8},(_,i)=>[0,.087,-.405-i*.039]));

    // Cano, bloco de gás, freio de boca e massa frontal suavizados por segmentos extras.
    cyl(.018,.34,0,.014,-.87,steel,16); cyl(.027,.070,0,.014,-.735,alloy,16);
    ring(.021,.004,0,.014,-.715,edge); cyl(.031,.082,0,.014,-1.055,alloy,16);
    ring(.031,.006,0,.014,-1.098,edge);
    gunInstancedBoxes(g,.006,.012,.012,0x161b1d,[-1,1].flatMap(side=>Array.from({length:3},(_,i)=>[side*.028,.014,-1.045+i*.022])));

    // Mira red-dot de perfil baixo, alças mecânicas e detalhe luminoso contido.
    box(.048,.020,.29,0,.111,-.31,steel);
    gunInstancedBoxes(g,.052,.008,.017,coated,Array.from({length:8},(_,i)=>[0,.124,-.205-i*.034]));
    gunSoftBox(g,.048,.034,.105,0,.145,-.31,polymer);
    cyl(.023,.072,0,.178,-.31,coated,16); ring(.025,.005,0,.178,-.350,edge); ring(.025,.005,0,.178,-.270,edge);
    cyl(.015,.004,0,.178,-.350,0x547c79,14,0x102321);
    box(.034,.038,.018,0,.151,-.405,alloy); box(.012,.032,.014,0,.177,-.735,accent,0,glow);
    box(.042,.030,.025,0,.145,-.19,coated);
    // Ferrolho animado segue sendo uma peça independente, como no modelo anterior.
    movable('bolt', box(.018,.022,.13,.066,.043,-.28,edge));
  } else if (index === 2) { // Metralhadora: caixa volumosa, cano reforçado e caixa de munição
    box(.14,.16,.45, 0,.015,-.17,0x8a522b); box(.105,.11,.30,0,.092,-.20,steel);
    box(.11,.08,.48,0,.02,-.58,dark);
    trackHeat(cyl(.034,.38,0,.02,-.91,steel,10)); // material isolado: não vaza para outras armas
    cyl(.052,.10,0,.02,-1.14,dark,10);
    trackHeat(ring(.05,.008,0,.02,-1.19,accent)); trackHeat(ring(.036,.004,0,.02,-.78,edge));
    box(.12,.20,.17,0,-.15,-.12,grip); movable('magazine',box(.13,.18,.23,0,-.16,.17,0x343a32,.12));
    box(.075,.025,.14,0,.128,-.22,edge); box(.07,.04,.07,0,.16,-.24,accent,0,glow);
    for(let i=0;i<6;i++) box(.018,.11,.025,-.061+i*.024,.03,-.42,0xd39342);
    for(let i=0;i<4;i++) box(.15,.014,.025,0,.074,-.40-i*.07,edge);
    box(.05,.025,.14,0,-.012,.30,0x525b4c); box(.018,.025,.07,-.075,.035,-.14,accent,0,glow);
    movable('cover', box(.10,.022,.19,0,.153,-.25,steel));
    for(let i=0;i<6;i++){box(.003,.009,.034,-.073,.035,-.34+i*.046,0x9aa4ad);box(.003,.009,.034,.073,.035,-.34+i*.046,0x9aa4ad);}
    for(let i=0;i<3;i++)box(.11,.006,.014,0,.087,-.32-i*.045,0x303841); // ranhuras da tampa de alimentação
  } else if (index === 3) { // Espingarda: dois tubos, bomba de madeira e cartuchos visíveis
    box(.13,.13,.36,0,.015,-.16,steel); box(.08,.065,.27,0,.082,-.18,dark);
    for (const x of [-.035,.035]) { cyl(.022,.63,x,.012,-.64,dark,10); cyl(.034,.09,x,.012,-.99,edge,10); ring(.034,.006,x,.012,-1.04,0xd39a3c); }
    box(.13,.10,.22,0,-.015,-.43,0x765033); movable('pump', box(.15,.06,.18,0,-.02,-.39,0x9a7040));
    for(let i=0;i<4;i++) box(.012,.012,.14,-.065+i*.043,.018,-.39,0xc39a5c);
    box(.075,.13,.17,0,-.12,-.03,grip,.08); box(.08,.10,.25,0,-.015,.22,0x765033);
    for(let i=0;i<5;i++) cyl(.012,.09,-.064+i*.032,.11,.14-i*.035,0xc98c35,7);
    movable('shell',cyl(.012,.075,-.13,-.13,.14,0xc98c35,7)); reloadParts.shell.mesh.visible = false; reloadParts.shell.visible = false;
    ring(.044,.006,0,-.108,.02,edge); box(.05,.025,.18,0,.112,-.19,accent,0,glow);
    for(const x of [-.035,.035]){ring(.025,.004,x,.012,-.69,edge);ring(.025,.004,x,.012,-.88,edge);}
    box(.014,.022,.02,0,.091,-.97,accent,0,glow); // ponto de mira na boca
    for(let i=0;i<6;i++)box(.008,.042,.012,-.072+i*.027,.013,-.39,0x4e3827); // nervuras de aderência da bomba
  } else if (index === 4) { // Sniper: cano longo, luneta elevada e bipé
    box(.105,.12,.54,0,.005,-.18,0x303947); box(.085,.085,.31,0,-.025,.27,0x3c4654);
    box(.08,.13,.21,0,-.10,-.06,dark,.06); cyl(.018,.72,0,.025,-.83,dark,10); cyl(.028,.12,0,.025,-1.24,edge,10); ring(.028,.006,0,.025,-1.30,accent);
    cyl(.037,.43,0,.15,-.30,dark,10); cyl(.052,.07,0,.15,-.51,steel,10); cyl(.05,.07,0,.15,-.09,steel,10);
    box(.04,.018,.45,0,.202,-.30,edge); box(.045,.055,.045,0,.23,-.28,accent,0,glow);
    box(.09,.025,.20,0,.11,.20,0x252b33); box(.04,.07,.19,0,-.08,-.48,0x353d49);
    box(.014,.16,.23,-.06,-.20,-.52,edge,.25); box(.014,.16,.23,.06,-.20,-.52,edge,-.25);
    movable('bolt', cyl(.022,.09,.07,.055,-.31,edge,8));
    movable('round',cyl(.011,.075,.07,.055,-.31,0xd4b36d,7)); reloadParts.round.mesh.visible = false; reloadParts.round.visible = false;
    ring(.045,.005,0,.15,-.515,0x8fa3b5);ring(.045,.005,0,.15,-.085,0x8fa3b5); // aros de fixação e de lente
    cyl(.024,.042,.067,.15,-.30,edge,8);ring(.023,.004,.067,.15,-.30,accent); // torre lateral de ajuste
    cyl(.022,.034,0,.212,-.30,steel,8);box(.058,.009,.015,0,.235,-.30,accent,0,glow); // torre de elevação
    box(.045,.016,.055,-.06,-.285,-.52,0x788494);box(.045,.016,.055,.06,-.285,-.52,0x788494); // sapatas do bipé
  } else if (index === 5) { // Magnum: armação robusta, tambor de seis câmaras e cabo de madeira
    box(.14,.14,.32,0,.03,-.08,0x5c626b); box(.10,.085,.31,0,.10,-.12,edge);
    cyl(.038,.48,0,.04,-.49,dark,10); cyl(.055,.09,0,.04,-.76,steel,10); ring(.054,.009,0,.04,-.81,accent);
    const yoke=new THREE.Group();yoke.position.set(-.07,-.055,.02);g.add(yoke); // pivô lateral: abre o conjunto para fora da armação
    const cylinder=new THREE.Group();cylinder.position.x=.07;yoke.add(cylinder); // eixo Z: indexa as seis câmaras sem separar os cartuchos
    gunCylinder(cylinder,.073,.13,0,0,0,0x41464c,10);
    reloadParts.rounds=[];
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3,round=gunCylinder(cylinder,.012,.012,Math.cos(a)*.047,Math.sin(a)*.047,.071,0xd6a25c,7);
      reloadParts.rounds.push(makeReloadPart(round));
    }
    movable('yoke',yoke);movable('cylinder',cylinder);
    movable('latch',box(.016,.035,.045,.087,-.025,-.012,steel));
    movable('hammer',box(.025,.035,.055,.055,.12,.03,0x5c626b));
    box(.085,.17,.13,0,-.13,.13,0x70482d,.16); box(.065,.09,.035,0,-.20,.12,0xa16a37,.16);
    box(.025,.04,.09,0,.12,-.27,accent,0,glow); box(.018,.018,.12,0,.11,.01,edge);
    ring(.052,.006,0,-.08,.04,edge);
    gunRing(cylinder,.058,.004,0,0,.068,edge);gunCylinder(cylinder,.014,.018,0,0,.076,accent,8); // aro e eixo visíveis com o tambor
    for(let i=0;i<5;i++)box(.003,.008,.072,-.036+i*.018,-.145,.197,0x4d3829); // quadriculado discreto no cabo
    gunScrew(g,-.071,-.035,-.015);gunScrew(g,.071,-.035,-.015);
  } else if (index === 6) { // Railgun: chassi longo, trilhos laterais e bobinas de energia
    box(.14,.16,.65,0,.005,-.20,0x282e3a); box(.095,.09,.34,0,-.025,.30,0x3d4654);
    box(.025,.035,.70,-.078,.07,-.39,accent,0,0x14505d); box(.025,.035,.70,.078,.07,-.39,accent,0,0x14505d);
    cyl(.027,.62,0,.015,-.76,dark,10);
    const coil=(...a)=>{const m=ring(...a);m.material=m.material.clone();return m;};
    reloadParts.coils = [
      makeReloadPart(coil(.075,.018,0,.015,-.36,accent,0x14505d)),
      makeReloadPart(coil(.075,.018,0,.015,-.62,accent,0x14505d)),
      makeReloadPart(coil(.075,.018,0,.015,-.88,accent,0x14505d))
    ];
    box(.06,.025,.62,0,.12,-.42,edge); box(.08,.07,.09,0,.15,-.18,accent,0,0x14505d);
    box(.025,.10,.22,-.04,-.11,.18,dark,.12); box(.025,.10,.22,.04,-.11,.18,dark,-.12);
    box(.10,.025,.16,0,-.18,.28,0x343b46); ring(.03,.008,0,.015,-1.02,accent,0x14505d);
    for(const z of [-.36,-.62,-.88]){box(.018,.024,.046,-.083,.015,z,edge);box(.018,.024,.046,.083,.015,z,edge);}
    for(let i=0;i<4;i++)box(.018,.012,.026,0,.157,.02-i*.039,i===0?accent:0x64717f,0,i===0?.08:0); // janela de carga superficial
  } else { // Lança-granadas: tubo pesado, boca ampla e tambor indexado
    box(.16,.17,.48,0,.01,-.16,0x3c4b37); box(.12,.10,.29,0,.10,-.17,dark);
    cyl(.083,.48,0,.025,-.62,0x536247,10); cyl(.105,.12,0,.025,-.91,dark,10); ring(.10,.012,0,.025,-.98,accent);
    const drum = new THREE.Group(); drum.position.set(0,-.11,.14); g.add(drum);
    gunCylinder(drum,.092,.16,0,0,0,0x303b2e,10); // tambor sob o tubo, com cartuchos montados no eixo
    for(let i=0;i<6;i++){ const a=i*Math.PI/3; gunCylinder(drum,.016,.018,Math.cos(a)*.064,Math.sin(a)*.064,.088,0xd4a34e,7); }
    gunRing(drum,.078,.004,0,0,.093,edge); // aro e janelas acompanham o tambor indexado
    for(let i=0;i<6;i++){const a=i*Math.PI/3;gunBox(drum,.008,.018,.004,Math.cos(a)*.084,Math.sin(a)*.084,.085,accent);}
    movable('drum', drum);
    box(.12,.14,.18,0,-.17,-.12,grip,.08); box(.07,.10,.21,0,-.03,.25,0x536247);
    box(.035,.035,.25,0,.15,-.28,edge); box(.06,.05,.06,0,.18,-.20,accent,0,0x14534d);
    for(let i=0;i<4;i++) box(.018,.018,.21,-.07+i*.047,.065,-.23,edge);
  }
  // Parafusos de leitura grande o bastante para a câmera; geometria e materiais são compartilhados.
  for (const [x,y,z] of [[-.045,.07,-.04],[.045,.07,-.04],[-.045,-.015,-.27],[.045,-.015,-.27]]) gunScrew(g,x,y,z,edge);
  // Janela de ejeção e ressalto metálico: detalhe lateral que acompanha a família da arma.
  if (index < 6) { box(.046,.026,.092,.093,.055,-.16,0x111720); box(.012,.018,.064,.119,.056,-.16,accent,0,glow); }
  const wearColor=index===3||index===5?0xa77f54:index===6?0x51c9d5:0x87939e;
  for(let i=0;i<3;i++)box(.003,.003,.034,.055,.025+(i%2)*.008,-.23+i*.052,wearColor);
  gunFlash(g,muzzleZ,flashSize,WEAPONS[index].visual?.flash); g.userData.reloadParts = reloadParts; g.userData.heatMaterials = heatMaterials; g.visible = false; activeGunFinish = 'satin-steel'; activeGunPbr = false; return g;
}
const HAND_POSES = {
  compact: { left: [-.12,-.12,-.18], right: [.02,-.08,.10] }, carbine: { left: [-.18,-.12,-.38], right: [.02,-.08,.13] },
  'support-heavy': { left: [-.17,-.11,-.40], right: [.02,-.09,.15] }, 'pump-action': { left: [-.20,-.12,-.34], right: [.02,-.08,.12] },
  precision: { left: [-.15,-.13,-.48], right: [.02,-.09,.13] }, 'sidearm-heavy': { left: [-.11,-.13,-.17], right: [.02,-.08,.11] },
  'energy-rifle': { left: [-.17,-.12,-.47], right: [.02,-.08,.14] }, launcher: { left: [-.17,-.12,-.39], right: [.02,-.09,.14] }
};
const handGeoCache = new Map(), handMatCache = new Map(), glovePalmGeo = new THREE.SphereGeometry(1,7,5);
let activeHandPbr = false;
function handSurface(color) {
  if (color === 0xb07a5a) return 'skin';
  if ([0x30393f,0x15181c,0x0d1014].includes(color)) return 'rubber';
  if ([0x2a3440,0x42515f,0x687a8a,0x222b35,0x55636f].includes(color)) return 'fabric';
  return 'polymer';
}
function handMat(color){
  const key=`${activeHandPbr?'pbr':'classic'}:${color}`;let mat=handMatCache.get(key);
  if(!mat){mat=activeHandPbr?pbrMaterials.material(handSurface(color),color):new THREE.MeshPhongMaterial({color,specular:0x1c2228,shininess:14});handMatCache.set(key,mat);}
  return mat;
}
const gloveCapGeo=new THREE.SphereGeometry(1,8,6), gloveSegGeo=new THREE.CylinderGeometry(1,1,1,8);
function gloveCap(g,r,x,y,z,color,sx=1,sy=1,sz=1){const m=new THREE.Mesh(gloveCapGeo,handMat(color));m.scale.set(r*sx,r*sy,r*sz);m.position.set(x,y,z);g.add(m);return m;}
function gloveSeg(g,r,len,x,y,z,color){const m=new THREE.Mesh(gloveSegGeo,handMat(color));m.scale.set(r,len,r);m.position.set(x,y,z);g.add(m);return m;}
function gloveBox(g,w,h,d,x,y,z,color,rz=0) {
  const key=`${w}:${h}:${d}`; let geo=handGeoCache.get(key);
  if(!geo){geo=new THREE.BoxGeometry(w,h,d);handGeoCache.set(key,geo);}
  let mat=handMat(color);
  const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.z=rz;g.add(m);return m;
}
function buildHandPair(index) {
  const pair=new THREE.Group(), pose=HAND_POSES[WEAPONS[index].visual?.hands]||HAND_POSES.carbine;
  activeHandPbr=index===1;
  const dark=index===1?0x3b4644:0x2a3440, mid=index===1?0x65716a:0x42515f;
  const seam=index===1?0x89958a:0x687a8a, skin=0xb07a5a, accent=index===1?0x71805f:WEAPONS[index].color;
  const makeHand=(position,side)=>{
    const h=new THREE.Group();h.position.set(...position);h.rotation.z=side==='right'?-.08:.08;
    const fingers=[];
    gloveBox(h,.14,.15,.30,0,-.115,.11,dark,side==='right'?.08:-.08); // antebraço tático
    gloveBox(h,.146,.03,.30,0,-.04,.11,0x222b35,side==='right'?.08:-.08); // dobra do tecido
    gloveBox(h,.03,.04,.2,side==='right'?.072:-.072,-.1,.14,0x55636f); // bolso/velcro lateral
    gloveBox(h,.152,.16,.03,0,-.11,-.035,0x1a2028);                 // punho elástico da manga
    gloveBox(h,.128,.07,.03,0,-.06,-.045,skin);                     // pele entre luva e manga
    gloveBox(h,.15,.085,.075,0,-.035,.015,mid);                    // punho com reforço
    if(index===1) for(let i=0;i<3;i++) gloveBox(h,.105,.002,.005,0,-.038,-.018+i*.021,0x55635a); // pesponto e dobras do tecido técnico
    if(side==='left'){gloveBox(h,.135,.03,.04,0,-.075,-.028,0x15181c);gloveBox(h,.05,.012,.05,0,-.06,-.03,0x0d1014);gloveBox(h,.04,.002,.04,0,-.053,-.03,0x3fd0ff);} // relógio tático
    gloveBox(h,.07,.012,.05,0,.068,-.01,accent);                   // placa de reforço no dorso
    gloveBox(h,.13,.012,.035,0,-.005,-.015,accent);                // costura de leitura da cor da arma
    const palm=new THREE.Mesh(glovePalmGeo,handMat(index===1?0x30393f:mid));palm.scale.set(.083,.055,.09);palm.position.set(0,.038,-.035);h.add(palm);
    gloveBox(h,.12,.04,.085,0,.073,-.055,mid);                     // protetor dos nós dos dedos
    for(let i=0;i<4;i++){
      const finger=new THREE.Group();finger.position.set(-.047+i*.031,.047,-.087);finger.rotation.z=.04*(i-1.5);
      const proximal=new THREE.Group(),distal=new THREE.Group();
      gloveSeg(proximal,.0125,.04,0,-.019,-.014,seam);gloveCap(proximal,.0135,0,-.002,-.014,seam);gloveCap(proximal,.013,0,-.038,-.014,seam);
      distal.position.set(0,-.038,-.014);gloveSeg(distal,.0112,.03,0,-.015,-.006,mid);gloveCap(distal,.0118,0,-.031,-.006,mid,1,1.1,1);
      gloveBox(distal,.016,.012,.006,0,-.024,-.017,0x30393f);
      proximal.add(distal);finger.add(proximal);h.add(finger);fingers.push({root:finger,proximal,distal});
    }
    const thumb=new THREE.Group();thumb.position.set(side==='right'?.067:-.067,.024,-.018);
    const thumbProximal=new THREE.Group(),thumbDistal=new THREE.Group();
    gloveBox(thumbProximal,.050,.031,.038,side==='right'?.012:-.012,0,-.005,seam,side==='right'?.20:-.20);
    thumbDistal.position.set(side==='right'?.039:-.039,0,-.004);
    gloveBox(thumbDistal,.032,.025,.034,side==='right'?.010:-.010,0,-.004,mid,side==='right'?.12:-.12);
    thumbProximal.add(thumbDistal);thumb.add(thumbProximal);thumb.userData={proximal:thumbProximal,distal:thumbDistal};
    h.add(thumb);h.userData={fingers,thumb,side};
    return h;
  };
  const left=makeHand(pose.left,'left'),right=makeHand(pose.right,'right');pair.add(left,right);
  pair.userData={left,right,leftPos:left.position.clone(),rightPos:right.position.clone(),leftRot:left.rotation.clone(),rightRot:right.rotation.clone()};
  activeHandPbr=false;
  return pair;
}
const guns = [buildGun(0,-.405,.22),buildGun(1,-1.08,.26),buildGun(2,-1.19,.28),buildGun(3,-1.04,.4),buildGun(4,-1.30,.3),buildGun(5,-.81,.3),buildGun(6,-1.02,.34),buildGun(7,-.98,.4)];
const holder = new THREE.Group();            // grupo que recebe balanço, recuo e animações
const HOLD_BASE = new THREE.Vector3(0.26, -0.24, -0.5);
guns.forEach(g => holder.add(g));
const handPairs=guns.map((_,i)=>buildHandPair(i));handPairs.forEach((h,i)=>{h.visible=i===0;holder.add(h);});
camera.add(holder);

/* =====================================================================
   7. ESTADO DO JOGO
   ===================================================================== */
let time = 0;                       // relógio do jogo (só avança em jogo ativo)
let locked = false, alive = false, started = false;
let px = 0, pz = 0, py = EYE, vx = 0, vz = 0, vy = 0, yaw = 0, pitch = 0;
let health = 100, maxHealth = 100, score = 0, kills = 0, wave = 0, toSpawn = 0, spawnT = 0, waveDelay = 3;
let best = 0;
function refreshRecord() {
  const records = career.get().records || {};
  best = +(records[Arena.recordKey(currentMode, currentDifficulty)] || 0);
  if (currentMode === 'survival' && currentDifficulty === 'normal') { try { best = Math.max(best, +localStorage.getItem('arenaFpsBest') || 0); } catch (_) {} }
}
function notifyAchievements(ids = []) {
  for (const id of ids) {
    const item = Arena.CAREER_ACHIEVEMENTS.find(a => a.id === id);
    if (item) { addFeed(`CONQUISTA: ${item.title}`, false); sfx.achievement(); }
  }
  if (ids.length) refreshCareerUI();
}
function applySkin() { document.body.dataset.skin = career.get().selectedSkin || 'neon'; }
let curW = 0, nextShot = 0, reloading = false, reloadEnd = 0, reloadDur = 1, reloadStarted = 0, reloadStrokeT = 1, ambientSparkT = 4;
let scoped = false, mouseHeld = false, shellNext = 0;   // shellNext = quando entra o próximo cartucho
let flashDur = 0.055, swayX = 0, swayY = 0, lastYaw = 0, lastPitch = 0, landDip = 0, lastVy = 0, strafeTilt = 0;
let machineGunHeat = 0;
const machineGunHeatTint = new THREE.Color(0xff4a21);
function updateMachineGunHeat(dt) {
  machineGunHeat = Math.max(0,machineGunHeat-dt*.42);
  const heat = THREE.MathUtils.clamp((machineGunHeat-.12)/.88,0,1);
  for (const part of (guns[2].userData.heatMaterials || [])) {
    part.material.color.copy(part.baseColor).lerp(machineGunHeatTint,heat*.48);
    part.material.emissiveIntensity = heat*1.45;
  }
}
let kick = 0, viewKick = 0, viewPitch = 0, viewRoll = 0, shotPulseT = 0, swapAnim = 0, swapFromW = -1, bobT = 0, flashT = 0, flashingGun = null, hitT = 0, hitHead = false, hitKind = 'body', vig = 0, bannerT = 0;
let bossPending = false, dashQueued = false, dashTime = 0, dashCooldown = 0, damageDirT = 0, adsT = 0;
let introQueue = [];                 // tipos especiais que devem ser os primeiros a nascer na onda de estreia
const keys = {};
let gamepadMove = { x: 0, y: 0 }, gamepadLook = { x: 0, y: 0 }, gamepadFireHeld = false, gamepadAdsHeld = false, gamepadJumpQueued = false, gamepadConnected = false, gamepadPrev = [];
let perks = {}, stats = Arena.perkStats(perks), perkOpen = false, perkChoices = [];   // upgrades escolhidos e seus multiplicadores
let crossGap = 16, pathBudget = 0;                                                    // abertura da mira (px) e buscas A* restantes no quadro
// --- Vindos da versão "Neon Rebellion": combo, créditos/loja, granadas de mão, tremor, regeneração ---
let combo = 1, comboT = 0, maxCombo = 1, shake = 0, lastHurt = 0, beatT = 0, aliveTime = 0, handGrenades = 3, credits = 0;
let shop = { dmg: 0, hp: 0, dash: 0 };                  // quantas vezes cada item da loja foi comprado
// Recalcula os multiplicadores: perks (upgrades.js) + compras da loja. Chamar sempre que algum dos dois mudar.
function refreshStats() {
  stats = Arena.perkStats(perks);
  stats.dmg *= 1 + 0.1 * shop.dmg;
  stats.dash *= Math.max(0.55, 1 - 0.2 * shop.dash);
  maxHealth = stats.maxHp + 20 * shop.hp;
}
const magOf = w => Math.ceil(w.mag * stats.mag);       // tamanho do pente com o upgrade de munição
const ammoState = WEAPONS.map(w => ({ ammo: w.mag, reserve: w.reserve }));
let enemies = [], pickups = [], fx = [], projectiles = [], grenades = [];
let objective = null, objectiveMarkers = [], interactQueued = false, interactHeld = false;
let inc = null, incVictory = false;   // estado do modo Incursão (null nos outros modos)
const terminalInteraction = { id: null, active: false, canUse: false, lockout: false, focus: 0 };
let enemySerial = 0, squadRefreshT = 0;
const cur = () => WEAPONS[curW];
const isUnlocked = i => (WEAPONS[i].unlock || 1) <= Math.max(wave, 1);   // arma liberada pela onda atual?
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function updateObjectiveHud() {
  if (!el.objectivePanel) return;
  if (inc) { updateIncursionHud(); return; }
  const active = objective && !objective.complete;
  el.objectivePanel.classList.toggle('hidden', !objective);
  if (!objective) return;
  el.objectiveWave.textContent = String(objective.wave).padStart(2, '0');
  el.objectiveName.textContent = objective.name; el.objectiveHint.textContent = objective.hint;
  let ratio = 0, status = 'OBJETIVO CONCLUÍDO';
  if (active && objective.id === 'relay') { ratio = objective.activeIndex / objective.nodes.length; status = `RELÉS ${objective.activeIndex}/${objective.nodes.length} · APROXIME-SE E PRESSIONE E`; }
  else if (active && objective.id === 'hold') { ratio = objective.progress / objective.seconds; status = `CONTROLE ${Math.floor(objective.progress)}s / ${objective.seconds}s`; }
  else if (active) { ratio = objective.progress / objective.seconds; status = objective.inRange ? `INVASÃO ${Math.floor(objective.progress / objective.seconds * 100)}% · SEGURE E` : 'APROXIME-SE DO TERMINAL E SEGURE E'; }
  el.objectiveFill.style.width = `${clamp(ratio, 0, 1) * 100}%`; el.objectiveStatus.textContent = status;
}

/* =====================================================================
   8. HUD
   ===================================================================== */
// Cria os slots das armas uma única vez
WEAPONS.forEach((w, i) => {
  const d = document.createElement('div'); d.className = 'slot';
  d.innerHTML = `<b>${i + 1}</b>${w.name.slice(0, 9)}`;
  el.slots.appendChild(d);
});
function updateHUD() {
  const w = cur(), s = ammoState[curW];
  const hpRatio = health / maxHealth;
  el.hp.style.width = (hpRatio * 100) + '%';
  el.hp.style.background = hpRatio > 0.5 ? 'var(--ok)' : hpRatio > 0.25 ? 'var(--warn)' : 'var(--accent)';
  el.hpTxt.textContent = Math.ceil(health);
  el.score.textContent = String(score).padStart(6, '0');
  el.wave.textContent = wave; el.kills.textContent = kills; el.remaining.textContent = enemies.filter(e => !e.dead).length + toSpawn + (bossPending ? 1 : 0); el.best.textContent = best; el.grenades.textContent = handGrenades; el.credits.textContent = credits; el.creditsHud.textContent = credits;
  updateObjectiveHud();
  const weaponColor = '#' + ((w.color || 0x4de7ff) >>> 0).toString(16).padStart(6, '0');
  document.body.style.setProperty('--weapon-color', weaponColor);
  el.wname.textContent = w.name; el.wrole.textContent = w.role || ''; el.wrole.style.color = weaponColor; el.ammo.textContent = s.ammo; el.reserve.textContent = s.reserve;
  [...el.slots.children].forEach((d, i) => {
    const open = isUnlocked(i);
    d.classList.toggle('active', i === curW); d.classList.toggle('locked', !open);
    const label = open ? (WEAPONS[i].short || WEAPONS[i].name.slice(0, 9)) : 'bloq. O' + WEAPONS[i].unlock;
    if (d.dataset.label !== label) { d.dataset.label = label; d.innerHTML = `<b>${i + 1}</b>${label}`; }   // só mexe no DOM se mudou
  });
}
// Feed de abates (canto superior esquerdo): cada item some sozinho depois de ~3 s
function addFeed(text, hot) {
  const d = document.createElement('div'); d.className = 'feedItem' + (hot ? ' hot' : ''); d.textContent = text;
  el.feed.prepend(d);
  while (el.feed.children.length > 5) el.feed.lastChild.remove();             // no máximo 5 linhas
  setTimeout(() => d.classList.add('out'), 2600); setTimeout(() => d.remove(), 3200);
}
function banner(text, t = 2.4) {                  // linhas extras (\n) viram subtítulo
  const [first, ...rest] = String(text).split('\n');
  el.banner.innerHTML = first + rest.map(l => `<br><small>${l}</small>`).join('');
  bannerT = t;
}

/* =====================================================================
   9. EFEITOS VISUAIS (tracers, fragmentos, explosões) — com POOL de objetos
   Criar e descartar malhas/geometrias a cada tiro gera lixo para o coletor de lixo e causa engasgos.
   O pool cria cada objeto UMA vez, deixa na cena invisível e só liga/desliga: get() pega, put() devolve.
   ===================================================================== */
const matCache = {};
const dGeo = new THREE.BoxGeometry(0.09, 0.09, 0.09);
function basicMat(c) { return matCache[c] || (matCache[c] = new THREE.MeshBasicMaterial({ color: c })); }
function makePool(create) {
  const free = [];
  return { free,
    get() { const o = free.pop() || create(); o.visible = true; return o; },
    put(o) { o.visible = false; free.push(o); } };
}
const addHidden = o => { o.visible = false; scene.add(o); return o; };

const tracerPool = makePool(() => {                  // núcleo claro + halo colorido, geometria e buffer reaproveitados
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const outer = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending }));
  const core = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.94 }));
  outer.frustumCulled = core.frustumCulled = false;
  const group = new THREE.Group(); group.add(outer, core); group.userData = { geo, outer, core };
  return addHidden(group);
});
const chunkPool = makePool(() => { const m = new THREE.Mesh(dGeo, basicMat(0xffffff)); m.userData.v = new THREE.Vector3(); return addHidden(m); });
const blastGeo = new THREE.SphereGeometry(1, 12, 10), blastRingGeo = new THREE.TorusGeometry(1, 0.035, 5, 24);
const blastPool = makePool(() => {
  const group = new THREE.Group();
  const core = new THREE.Mesh(blastGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
  const ring = new THREE.Mesh(blastRingGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  const flame = new THREE.Mesh(blastGeo, new THREE.MeshBasicMaterial({ color: 0xff812c, transparent: true, opacity: 0.58, depthWrite: false, blending: THREE.AdditiveBlending })); flame.visible = false;
  ring.rotation.x = Math.PI / 2; group.add(core, flame, ring); group.userData = { core, ring, flame }; return addHidden(group);
});
// Mantida na contagem de luzes desde o início: alternar visible altera variantes de shader no Three.js r128.
const explosionLight = new THREE.PointLight(0xff973f, 0, 8, 2); explosionLight.visible = true; scene.add(explosionLight);
let explosionLightT = 0, explosionLightPower = 0;
function pulseExplosionLight(x,y,z,R) {
  if (appliedQuality === 'low') return;
  explosionLight.position.set(x,y,z); explosionLightPower = Math.min(3.6,1.5+R*.32); explosionLightT = .22;
}
const fxPools = { line: tracerPool, chunk: chunkPool, blast: blastPool };
const muzzleSmokeGeo = new THREE.SphereGeometry(1,6,5), muzzleSmokeDir = new THREE.Vector3(), muzzleSmokeTint = new THREE.Color(), muzzleSmokeSource = new THREE.Color();
const muzzleSmokePool = makePool(() => {
  const m=new THREE.Mesh(muzzleSmokeGeo,new THREE.MeshBasicMaterial({color:0x77818b,transparent:true,opacity:.18,depthWrite:false}));
  m.userData.v=new THREE.Vector3();return addHidden(m);
});
fxPools.smoke=muzzleSmokePool;
function spawnMuzzleSmoke(origin,color,count=1) {
  if(fx.length>145)return;
  muzzleSmokeDir.set(0,0,-1).applyQuaternion(camera.quaternion);
  for(let i=0;i<count&&fx.length<155;i++){
    const m=muzzleSmokePool.get(),v=m.userData.v,life=.26+Math.random()*.16;
    muzzleSmokeSource.setHex(color);muzzleSmokeTint.setHex(0x77818b).lerp(muzzleSmokeSource,.12);
    m.material.color.copy(muzzleSmokeTint);m.material.opacity=.18;m.position.copy(origin).addScaledVector(muzzleSmokeDir,.05+Math.random()*.04);
    v.copy(muzzleSmokeDir).multiplyScalar(.12+Math.random()*.18);v.x+=(Math.random()-.5)*.12;v.y+=(Math.random()-.15)*.12;v.z+=(Math.random()-.5)*.08;
    const size=.025+Math.random()*.018;m.scale.setScalar(size);
    fx.push({kind:'smoke',obj:m,life,maxLife:life,v,size,baseOpacity:.18});
  }
}
function spawnBlastSmoke(x,y,z,count) {
  if (fx.length > 145) return;
  const n = appliedQuality === 'low' ? Math.min(count,2) : count;
  for (let i=0;i<n && fx.length<155;i++) {
    const m=muzzleSmokePool.get(),v=m.userData.v,life=.62+Math.random()*.28,size=.065+Math.random()*.045;
    m.material.color.setHex(0x655d55);m.material.opacity=.28;
    m.position.set(x+(Math.random()-.5)*.22,y+(Math.random()-.5)*.16,z+(Math.random()-.5)*.22);
    v.set((Math.random()-.5)*1.25,.75+Math.random()*1.25,(Math.random()-.5)*1.25);
    m.scale.setScalar(size);fx.push({kind:'smoke',obj:m,life,maxLife:life,v,size,baseOpacity:.28});
  }
}

function tracer(a, b, color = 0xffe9a8) {
  const l = tracerPool.get(), p = l.userData.geo.attributes.position;
  p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b.x, b.y, b.z); p.needsUpdate = true;
  l.userData.outer.material.color.setHex(color); l.userData.core.material.color.setHex(0xffffff);
  fx.push({ kind: 'line', obj: l, life: 0.075 });
}
function debris(p, color, n) {
  if (fx.length > 150) return;
  for (let i = 0; i < n && fx.length < 155; i++) {
    const m = chunkPool.get(); m.material = basicMat(color); m.position.copy(p);
    m.userData.v.set((Math.random() - .5) * 5, Math.random() * 4, (Math.random() - .5) * 5);
    const sx = 0.35 + Math.random() * 0.8, sy = 0.35 + Math.random() * 0.8, sz = 0.55 + Math.random() * 1.4;
    m.scale.set(sx, sy, sz); m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    const life = 0.5 + Math.random() * 0.3;
    fx.push({ kind: 'chunk', obj: m, life, maxLife: life, v: m.userData.v, baseScale: [sx, sy, sz], spin: 2 + Math.random() * 8 });
  }
}
function sparkBurst(p, color, n = 4, normal = null) {
  for (let i = 0; i < n && fx.length < 170; i++) {
    const m = chunkPool.get(); m.material = basicMat(color); m.position.copy(p);
    const vx = (Math.random() - .5) * 7, vy = (Math.random() - .2) * 6, vz = (Math.random() - .5) * 7;
    m.userData.v.set(vx, vy, vz); if (normal) m.userData.v.addScaledVector(normal, 2.2);
    m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    const sx = 0.22 + Math.random() * 0.2, sy = 0.22 + Math.random() * 0.2, sz = 1.1 + Math.random() * 1.6, life = 0.16 + Math.random() * 0.1;
    m.scale.set(sx, sy, sz);
    fx.push({ kind: 'chunk', obj: m, life, maxLife: life, v: m.userData.v, baseScale: [sx, sy, sz], spin: 8 + Math.random() * 14, spark: true });
  }
}
// Pulso e anel no chão dão leitura de escala sem criar malhas por explosão.
function blastFx(x, y, z, R, color, dur, layered = false) {
  const maxActive = appliedQuality === 'low' ? 4 : 8;
  let kept = 0;
  for (let i=fx.length-1;i>=0;i--) if (fx[i].kind === 'blast') {
    if (kept >= maxActive-1) { blastPool.put(fx[i].obj); fx.splice(i,1); }
    else kept++;
  }
  const m = blastPool.get(), { core, ring, flame } = m.userData;
  core.material.color.setHex(color); ring.material.color.setHex(color); core.material.opacity = 0.7; ring.material.opacity = 0.85;
  flame.visible = layered && appliedQuality !== 'low'; flame.material.color.setHex(color); flame.material.opacity = flame.visible ? 0.58 : 0;
  m.position.set(x, y, z); core.scale.setScalar(0.2); ring.scale.setScalar(0.2);
  flame.scale.set(.18,.15,.18); fx.push({ kind: 'blast', obj: m, life: dur, dur, R, layered });
}
function updateFx(dt) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i]; f.life -= dt;
    if (f.kind === 'chunk') {
      f.v.y -= (f.spark ? 7 : 14) * dt; f.obj.position.addScaledVector(f.v, dt);
      f.obj.rotation.x += f.spin * dt; f.obj.rotation.z += f.spin * 0.7 * dt;
      const fade = Math.max(0, f.life / f.maxLife); f.obj.scale.set(f.baseScale[0] * fade, f.baseScale[1] * fade, f.baseScale[2] * fade);
    }
    if (f.kind === 'smoke') {
      const k=1-Math.max(f.life,0)/f.maxLife;f.v.y+=.12*dt;f.v.multiplyScalar(Math.max(0,1-dt*1.8));
      f.obj.position.addScaledVector(f.v,dt);f.obj.scale.setScalar(f.size*(1+k*4));f.obj.material.opacity=(f.baseOpacity??.18)*(1-k);
    }
    if (f.kind === 'blast') {
      const k = 1 - Math.max(f.life, 0) / f.dur, { core, ring, flame } = f.obj.userData;
      core.scale.setScalar(0.2 + k * f.R); ring.scale.setScalar(0.2 + k * f.R * 1.15);
      core.material.opacity = 0.7 * (1 - k); ring.material.opacity = 0.85 * (1 - k); ring.rotation.z += dt * 1.8;
      if (f.layered) { flame.visible=appliedQuality!=='low'; flame.scale.set(.18+k*f.R*.88,.15+k*f.R*.62,.18+k*f.R*.88); flame.material.opacity=.58*(1-k)*(flame.visible?1:0); flame.rotation.y+=dt*2.4; }
    }
    if (f.life <= 0) { fxPools[f.kind].put(f.obj); fx.splice(i, 1); }       // devolve ao pool em vez de descartar
  }
  if (appliedQuality === 'low') { explosionLightT = 0; explosionLight.intensity = 0; }
  else if (explosionLightT > 0) { explosionLightT = Math.max(0,explosionLightT-dt); explosionLight.intensity = explosionLightPower * (explosionLightT/.22) ** 2; }
  else { explosionLight.intensity = 0; }
}
function clearFx() { fx.forEach(f => fxPools[f.kind].put(f.obj)); fx.length = 0; explosionLightT = explosionLightPower = 0; explosionLight.intensity = 0; }

// Marcas de impacto rasas, com limite temporal e geometrias reutilizadas.
const markCircleGeo = new THREE.CircleGeometry(0.5, 9), markRingGeo = new THREE.RingGeometry(0.20, 0.48, 9);
const bulletMarkPool = makePool(() => {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(markCircleGeo, new THREE.MeshBasicMaterial({ color: 0x090c12, transparent: true, opacity: 0.88, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }));
  const inner = new THREE.Mesh(markRingGeo, new THREE.MeshBasicMaterial({ color: 0x2a211b, transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3 }));
  inner.position.z = 0.002; group.add(outer, inner); group.userData = { outer, inner };
  return addHidden(group);
});
const surfaceMarks = [], MAX_SURFACE_MARKS = 60;
function addBulletMark(point, normal, surface) {
  if (surfaceMarks.length >= MAX_SURFACE_MARKS) bulletMarkPool.put(surfaceMarks.shift().obj);
  const obj = bulletMarkPool.get(), size = 0.075 + Math.random() * 0.055;
  const { outer, inner } = obj.userData;
  outer.material.opacity = 0.88; inner.material.opacity = 0.72;
  inner.material.color.setHex(surface === 'metal' ? 0x202a30 : surface === 'wood' ? 0x342216 : 0x29251f);
  obj.position.copy(point).addScaledVector(normal, 0.012); obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  obj.rotateZ(Math.random() * Math.PI * 2); obj.scale.setScalar(size);
  surfaceMarks.push({ obj, life: 13 + Math.random() * 4, maxLife: 17 });
}
function spawnDust(point, normal, color, count = 3) {
  for (let i = 0; i < count && dustPuffs.length < 22; i++) {
    const m = dustPool.get(), v = m.userData.v;
    m.material.color.setHex(color); m.material.opacity = 0.25 + Math.random() * 0.12;
    m.position.copy(point).addScaledVector(normal, 0.025 + Math.random() * 0.035);
    v.copy(normal).multiplyScalar(0.3 + Math.random() * 0.6).add(new THREE.Vector3((Math.random()-.5)*0.8,(Math.random()-.5)*0.8,(Math.random()-.5)*0.8));
    const size = 0.035 + Math.random() * 0.035, life = 0.32 + Math.random() * 0.22;
    m.scale.setScalar(size); dustPuffs.push({ obj:m, v, life, maxLife:life, size });
  }
}
const dustPuffGeo = new THREE.SphereGeometry(1, 6, 5);
const dustPool = makePool(() => { const m = new THREE.Mesh(dustPuffGeo, new THREE.MeshBasicMaterial({ color: 0x9b9386, transparent: true, opacity: 0.3, depthWrite: false })); m.userData.v = new THREE.Vector3(); return addHidden(m); });
const dustPuffs = [];
function surfaceImpact(hit, weaponColor) {
  const normal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
  const point = hit.point.clone().addScaledVector(normal, 0.014), surface = hit.object.userData.surface || 'stone';
  addBulletMark(point, normal, surface);
  if (surface === 'metal') { sparkBurst(point, 0xc5e6ff, 7, normal); debris(point, 0x8795a3, 1); }
  else if (surface === 'wood') { sparkBurst(point, 0xd99a55, 2, normal); debris(point, 0xb47c42, 4); spawnDust(point, normal, 0xa4774b, 2); }
  else { debris(point, 0xa3a5a6, 3); spawnDust(point, normal, 0xaaa59c, 4); }
  if (weaponColor === 0x59e8ff) sparkBurst(point, weaponColor, 2, normal);
}
function updateSurfaceImpacts(dt) {
  for (let i = surfaceMarks.length - 1; i >= 0; i--) {
    const mark = surfaceMarks[i]; mark.life -= dt;
    const fade = Math.min(1, mark.life / 2.2), { outer, inner } = mark.obj.userData;
    outer.material.opacity = 0.88 * fade; inner.material.opacity = 0.72 * fade;
    if (mark.life <= 0) { bulletMarkPool.put(mark.obj); surfaceMarks.splice(i, 1); }
  }
  for (let i = dustPuffs.length - 1; i >= 0; i--) {
    const puff = dustPuffs[i]; puff.life -= dt; puff.obj.position.addScaledVector(puff.v, dt); puff.v.multiplyScalar(Math.max(0, 1 - dt * 2.5));
    const k = 1 - puff.life / puff.maxLife; puff.obj.scale.setScalar(puff.size * (1 + k * 3)); puff.obj.material.opacity = 0.32 * Math.max(0, puff.life / puff.maxLife);
    if (puff.life <= 0) { dustPool.put(puff.obj); dustPuffs.splice(i, 1); }
  }
}
function clearSurfaceImpacts() {
  surfaceMarks.forEach(m => bulletMarkPool.put(m.obj)); surfaceMarks.length = 0;
  dustPuffs.forEach(p => dustPool.put(p.obj)); dustPuffs.length = 0;
}
function updateArenaAtmosphere(dt) {
  cornerLights.forEach((light, i) => { light.intensity = light.userData.baseIntensity * (0.91 + 0.1 * Math.sin(time * 1.1 + i * 1.7)); });
  ambientSparkT -= dt;
  if (ambientSparkT <= 0 && appliedQuality !== 'low') {
    const side = Math.floor(Math.random() * 4), d = ARENA - 0.03;
    const p = new THREE.Vector3(side === 0 ? -d : side === 1 ? d : (Math.random()-.5)*ARENA,
      0.7 + Math.random() * 2.1, side === 2 ? -d : side === 3 ? d : (Math.random()-.5)*ARENA);
    const n = new THREE.Vector3(side === 0 ? 1 : side === 1 ? -1 : 0, 0, side === 2 ? 1 : side === 3 ? -1 : 0);
    sparkBurst(p, (curMap <= -2 ? Arena.INCURSION_LEVELS[-2 - curMap] : Arena.MAPS[curMap]).strip, 2, n); ambientSparkT = 5.5 + Math.random() * 5.5;
  }
}

// Estojos com física simples, limite fixo e geometria/material compartilhados.
const casingGeo = new THREE.CylinderGeometry(0.02, 0.02, 1, 6); casingGeo.rotateX(Math.PI / 2);
const casingMats = new Map();
function casingMaterial(color) {
  if (!casingMats.has(color)) casingMats.set(color, new THREE.MeshLambertMaterial({ color, emissive: 0x34200a }));
  return casingMats.get(color);
}
const casingPool = makePool(() => addHidden(new THREE.Mesh(casingGeo, casingMaterial(0xc99a45))));
const casings = [];
function ejectCasing(w) {
  const spec = w.visual?.casing;
  if (!spec || casings.length >= 24) return;
  camera.updateMatrixWorld(true);
  const m = casingPool.get(), port = new THREE.Vector3(...spec.port);
  m.position.copy(guns[curW].localToWorld(port)); m.material = casingMaterial(spec.color);
  m.scale.set(spec.radius / 0.02, spec.radius / 0.02, spec.length); m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion), up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  const velocity = right.multiplyScalar(1.8 + Math.random() * 1.6).addScaledVector(up, 0.8 + Math.random() * 1.4);
  velocity.x += (Math.random() - .5) * 0.8; velocity.z += (Math.random() - .5) * 0.8;
  casings.push({ m, velocity, life: 1.1 + Math.random() * 0.35, spin: (Math.random() - .5) * 18, soundPlayed: false });
}
function updateCasings(dt) {
  for (let i = casings.length - 1; i >= 0; i--) {
    const c = casings[i], p = c.m.position; c.life -= dt; c.velocity.y -= 11 * dt; p.addScaledVector(c.velocity, dt);
    if (p.y < 0.035) {
      const impactSpeed = Math.max(0,-c.velocity.y); p.y = 0.035;
      if (impactSpeed > 0.2) {
        c.velocity.y = impactSpeed * 0.24;
        if (!c.soundPlayed && impactSpeed > 1.2) { sfx.casing(p.x,p.z,Math.min(1,impactSpeed/7)); c.soundPlayed = true; }
      } else c.velocity.y = 0;
      c.velocity.x *= 0.72; c.velocity.z *= 0.72;
    }
    c.m.rotation.x += c.spin * dt; c.m.rotation.z += c.spin * 0.6 * dt;
    if (c.life < 0.18) c.m.scale.multiplyScalar(Math.max(0.01, c.life / 0.18));
    if (c.life <= 0) { casingPool.put(c.m); casings.splice(i, 1); }
  }
}
function clearCasings() { casings.forEach(c => casingPool.put(c.m)); casings.length = 0; }

/* =====================================================================
   10. INIMIGOS — modelos reaproveitados (pool), caminhos A*, projéteis e chefe com fases
   ===================================================================== */
const eGeo = {
  body: new THREE.BoxGeometry(0.8, 1.0, 0.45), head: new THREE.BoxGeometry(0.42, 0.42, 0.42),
  limb: new THREE.BoxGeometry(0.22, 0.7, 0.22), eye: new THREE.BoxGeometry(0.3, 0.06, 0.05),
  hpBg: new THREE.BoxGeometry(1.05, 0.09, 0.025), hpBar: new THREE.BoxGeometry(1.0, 0.05, 0.03).translate(0.5, 0, 0),
  armor: new THREE.BoxGeometry(0.36, 0.23, 0.5), badge: new THREE.OctahedronGeometry(0.12, 0)
};
const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3030 });
const limbMat = new THREE.MeshLambertMaterial({ color: 0x2b2f3a });
const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x24151a });
// Peças dos especiais (compartilhadas entre todos os inimigos do mesmo tipo)
const bombGeo = new THREE.BoxGeometry(0.5, 0.5, 0.3), bombMat = new THREE.MeshBasicMaterial({ color: 0xffd24a });
const shieldGeo = new THREE.BoxGeometry(1.15, 1.05, 0.12), shieldMat = new THREE.MeshLambertMaterial({ color: 0x9fb4d6, emissive: 0x223355 });
const orbGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22), orbMat = new THREE.MeshBasicMaterial({ color: 0x66ffaa });

// "Rig" = o modelo 3D de um inimigo (grupo + peças). Montado uma vez por tipo e reutilizado depois da morte.
const rigPool = {};
const antennaGeo = new THREE.CylinderGeometry(0.025, 0.04, 0.38, 5);   // compartilhada entre todos os rigs
const rigBasicMats = {};
const rigBasic = color => rigBasicMats[color] || (rigBasicMats[color] = new THREE.MeshBasicMaterial({ color }));
function buildRig(key) {
  const T = TYPES[key], g = new THREE.Group();
  const mBody = new THREE.MeshLambertMaterial({ color: T.color });
  const mHead = new THREE.MeshLambertMaterial({ color: 0xd9b38c });
  const body = new THREE.Mesh(eGeo.body, mBody); body.position.y = 1.1;
  const head = new THREE.Mesh(eGeo.head, mHead); head.position.y = 1.82;
  const eye = new THREE.Mesh(eGeo.eye, eyeMat); eye.position.set(0, 1.85, 0.22);
  // Pernas e braços com "pivô" no topo para balançar corretamente
  const mkLimb = (x, y, rotX) => {
    const p = new THREE.Group(); p.position.set(x, y, 0); p.rotation.x = rotX;
    const m = new THREE.Mesh(eGeo.limb, limbMat); m.position.y = -0.35; p.add(m); return p;
  };
  const legL = mkLimb(-0.2, 0.7, 0), legR = mkLimb(0.2, 0.7, 0);
  const armL = mkLimb(-0.52, 1.55, -1.4), armR = mkLimb(0.52, 1.55, -1.4); // braços à frente (zumbi)
  const hpBg = new THREE.Mesh(eGeo.hpBg, hpBgMat);
  const hpBar = new THREE.Mesh(eGeo.hpBar, new THREE.MeshBasicMaterial({ color: 0x3ddc84 }));
  hpBg.position.set(0, 2.35, 0); hpBar.position.set(-0.5, 2.35, 0.02);   // z positivo = na frente do fundo (o inimigo olha para +Z)
  const armorMat = new THREE.MeshLambertMaterial({ color: T.color, emissive: T.color, emissiveIntensity: 0.08 });
  const armorL = new THREE.Mesh(eGeo.armor, armorMat), armorR = new THREE.Mesh(eGeo.armor, armorMat);
  armorL.position.set(-0.45, 1.53, 0.03); armorR.position.set(0.45, 1.53, 0.03);
  const badge = new THREE.Mesh(eGeo.badge, rigBasic(T.boss ? 0xff4f7b : T.healer ? 0x3ddc84 : 0x4de7ff)); badge.position.set(0, 1.15, 0.245);
  const antenna = new THREE.Mesh(antennaGeo, armorMat); antenna.position.set(0.27, 2.13, -0.08);
  const beacon = new THREE.Mesh(eGeo.badge, rigBasic(T.color)); beacon.scale.setScalar(0.48); beacon.position.set(0.27, 2.35, -0.08);
  g.add(body, head, eye, legL, legR, armL, armR, hpBg, hpBar, armorL, armorR, badge, antenna, beacon);
  // Visual dos especiais: bomba no peito (kamikaze), escudo na frente (escudeiro), orbe flutuante (curandeiro)
  let shield = null, orb = null;
  if (T.explodes) { const bomb = new THREE.Mesh(bombGeo, bombMat); bomb.position.set(0, 1.15, 0.3); g.add(bomb); }
  const shieldMatInstance = T.shield ? shieldMat.clone() : null;
  if (T.shield) { shield = new THREE.Mesh(shieldGeo, shieldMatInstance); shield.position.set(0, 1.1, 0.55); g.add(shield); }
  if (T.healer) { orb = new THREE.Mesh(orbGeo, orbMat); orb.position.set(0, 2.75, 0); g.add(orb); }
  g.scale.setScalar(T.scale);
  return { g, body, head, mBody, mHead, hpBg, hpBar, legL, legR, shield, shieldMat: shieldMatInstance, orb };
}
function recycleRig(e) {                              // devolve o modelo ao pool (sem descartar geometria nem material)
  if (e.recycled) return; e.recycled = true;
  scene.remove(e.g);
  (rigPool[e.key] || (rigPool[e.key] = [])).push({ g: e.g, body: e.body, head: e.head, mBody: e.mBody, mHead: e.mHead, hpBg: e.hpBg, hpBar: e.hpBar, legL: e.legL, legR: e.legR, shield: e.shield, shieldMat: e.shieldMat, orb: e.orb });
}

function spawnEnemy(key) {
  const T = TYPES[key];
  const rig = (rigPool[key] && rigPool[key].pop()) || buildRig(key);
  rig.mBody.emissive.setHex(0); rig.mHead.emissive.setHex(0);            // limpa estado do uso anterior
  if (rig.shieldMat) rig.shieldMat.emissive.setHex(0x223355);
  rig.hpBar.scale.x = 1; rig.hpBar.material.color.setHex(0x3ddc84);
  rig.legL.rotation.x = 0; rig.legR.rotation.x = 0; rig.body.position.set(0, 1.1, 0); rig.head.position.set(0, 1.82, 0);
  rig.g.scale.setScalar(T.scale); rig.g.rotation.set(0, 0, 0);

  // Ponto de spawn nas bordas, longe do jogador
  let x = 0, z = 0;
  if (inc) [x, z] = Arena.pickIncursionSpawn(px, pz, (a, b) => blocked(a, b, .6), Math.random, incData().spawns);   // Incursão: nasce dentro das salas/corredores
  else for (let i = 0; i < 12; i++) {
    const side = Math.random() < .5 ? 1 : -1;
    if (Math.random() < .5) { x = side * (ARENA - 2); z = (Math.random() * 2 - 1) * (ARENA - 2); }
    else { z = side * (ARENA - 2); x = (Math.random() * 2 - 1) * (ARENA - 2); }
    if (Math.hypot(x - px, z - pz) > 14 && !blocked(x, z, .6)) break;
  }
  rig.g.position.set(x, 0, z);
  scene.add(rig.g); rig.g.updateMatrixWorld(true);

  const hp0 = Arena.enemyHp(T, wave);
  const e = {
    ...rig, key, T,
    id: ++enemySerial, hp: hp0 * Arena.difficultyConfig(currentDifficulty).hp, maxHp: hp0 * Arena.difficultyConfig(currentDifficulty).hp, speed: Arena.enemySpeed(T, wave) * Arena.difficultyConfig(currentDifficulty).speed * (inc ? inc.fx.speedMul : 1),
    attackDamage: T.dmg * Arena.difficultyConfig(currentDifficulty).damage,
    nextAtk: time + Math.random() * 0.35, nextHeal: 1, detonated: false, flash: 0, shieldHit: 0, hitReact: 0, hitHeadReact: false, hitSide: 1, deathT: 0, deathDur: 0, recycled: false, flankT: 1.5 + Math.random() * 1.5, phase: Math.random() * 6, side: Math.random() < .5 ? 1 : -1, dead: false,
    path: null, pathI: 0, pathT: Math.random() * 0.4, pathGX: 0, pathGZ: 0, squad: null, coverPoint: null, coverUntil: 0, nextCoverSearch: time + 1 + Math.random() * 1.4,           // estado do A*
    boss: T.boss ? { phase: 1, nextBurst: time + 2, burstLeft: 0, nextShot: 0, nextRing: time + 6, nextCharge: time + 4, charge: null, t: 0, dx: 0, dz: 0, hit: false, ringRot: 0 } : null
  };
  rig.body.userData = { enemy: e, head: false };
  rig.head.userData = { enemy: e, head: true };
  if (rig.shield) rig.shield.userData = { enemy: e, head: false, shield: true };   // o tiro identifica o escudo por este campo
  enemies.push(e);
  updateHUD();
}
function startPerfScenario() {
  if (!perfMode) return;
  perfScenarioActive = true;
  currentMode = 'survival'; currentDifficulty = 'normal'; wave = 1;
  if (curMap !== 0) loadMap(0);
  toSpawn = 0; spawnT = 1e9; bossPending = false; introQueue = []; waveDelay = 1e9;
  const specs = [
    ['grunt', -24, -22], ['grunt', -16, -23], ['grunt', -8, -23],
    ['runner', 0, -23], ['runner', 8, -23], ['runner', 16, -23],
    ['ranged', 24, -18], ['ranged', 24, -8], ['brute', 24, 8],
    ['brute', 20, 23], ['shield', 8, 23], ['healer', -4, 23]
  ];
  specs.forEach(([key, x, z], index) => {
    spawnEnemy(key);
    const enemy = enemies[enemies.length - 1];
    enemy.g.position.set(x, 0, z); enemy.g.updateMatrixWorld(true);
    enemy.phase = index * 0.53; enemy.side = index % 2 ? 1 : -1;
    enemy.path = null; enemy.pathI = 0; enemy.pathGX = px; enemy.pathGZ = pz;
    enemy.pathT = time + index * 0.06; enemy.nextAtk = time + 1 + (index % 4) * 0.12;
    enemy.nextHeal = time + 1.2; enemy.nextCoverSearch = time + 1.1 + (index % 4) * 0.08;
  });
  selectWeapon(1); updateHUD();
  perfTelemetry.reset();
  perfCounters.blockedCalls = perfCounters.lineCalls = perfCounters.pathCalls = perfCounters.pathMs = 0;
  perfWindow.blockedCalls = perfWindow.lineCalls = perfWindow.pathCalls = perfWindow.pathMs = perfWindow.durationMs = 0;
  perfWasRunning = false; perfLastUi = performance.now();
  if (perfHint) perfHint.textContent = 'Cenário fixo ativo: 12 inimigos, Hangar, invulnerável e sem persistência.';
}
function restartPerfScenario() {
  if (!perfMode || !started) {
    if (perfHint) perfHint.textContent = 'Clique em JOGAR para iniciar o cenário fixo.';
    return;
  }
  $('modeSelect').value = 'survival'; $('difficultySelect').value = 'normal';
  resetGame(); startPerfScenario();
  if (!locked) showOverlay('pause');
}
function refreshPerfPanel() {
  const duration = Math.max(0.5, perfWindow.durationMs / 1000);
  const blockedCalls = perfWindow.blockedCalls, lineCalls = perfWindow.lineCalls;
  const pathCalls = perfWindow.pathCalls, pathMs = perfWindow.pathMs;
  perfWindow.blockedCalls = perfWindow.lineCalls = perfWindow.pathCalls = perfWindow.pathMs = perfWindow.durationMs = 0;
  const paused = perfScenarioActive && (!locked || !alive || document.visibilityState !== 'visible' || (useTouch && innerHeight > innerWidth));
  if (perfHint) perfHint.textContent = !perfScenarioActive
    ? 'Clique em JOGAR para iniciar o cenário fixo de 12 inimigos.'
    : paused
      ? 'Medição pausada · retome a partida para continuar; quadros pausados não entram no CSV.'
      : 'Cenário fixo ativo · 12 inimigos · dano/abates ignorados · sem persistência local. Render-submit não é tempo de GPU.';
  if (!perfPanel || perfPanel.hidden) return;
  const data = perfTelemetry.summary(), sample = data.latest;
  if (!sample) { perfReadout.textContent = 'Aguardando amostras…'; return; }
  const quality = ['baixa', 'média', 'alta'][Math.round(sample.quality)] || 'média';
  const fps = sample.frameMs > 0 ? (1000 / data.frame.p50).toFixed(1) : '—';
  perfReadout.textContent = [
    `Quadros ${data.samples}/${data.capacity} · ~${fps} FPS mediana`,
    `RAF ms p50 ${data.frame.p50.toFixed(1)} · p95 ${data.frame.p95.toFixed(1)} · p99 ${data.frame.p99.toFixed(1)} · máx ${data.frame.max.toFixed(1)}`,
    `CPU ms update média/p95 ${data.update.avg.toFixed(2)}/${data.update.p95.toFixed(2)} · render-submit ${data.render.avg.toFixed(2)}/${data.render.p95.toFixed(2)}`,
    `WebGL ${Math.round(sample.drawCalls)} chamadas · ${Math.round(sample.triangles)} triângulos`,
    `Recursos ${Math.round(sample.geometries)} geometrias · ${Math.round(sample.textures)} texturas`,
    `Ativos ${Math.round(sample.enemies)} inimigos · ${Math.round(sample.projectiles)} projéteis · ${Math.round(sample.effects)} FX · ${Math.round(sample.marks)} marcas · ${Math.round(sample.dust)} poeira`,
    `IA/${duration.toFixed(1)}s blocked ${blockedCalls} · lineClear ${lineCalls} · A* ${pathCalls} (${pathMs.toFixed(2)} ms)`,
    `GPU ${gpuInfo.name}${gpuInfo.software ? '  ⚠ SOFTWARE (sem aceleração)' : ''}`,
    `Flags ${Object.entries(FLAG).filter(([, v]) => v).map(([k, v]) => k + '=' + v).join(' ') || 'nenhuma'}`,
    `Qualidade ${quality} · PR ${sample.pixelRatio.toFixed(2)} · canvas ${renderer.domElement.width}×${renderer.domElement.height}`
  ].join('\n');
}
function downloadPerfCsv() {
  if (!perfTelemetry) return;
  const blob = new Blob([`# gpu=${gpuInfo.name}\n# software=${gpuInfo.software}\n# dpr=${devicePixelRatio}\n# canvas=${renderer.domElement.width}x${renderer.domElement.height}\n# flags=${JSON.stringify(FLAG)}\n# ua=${navigator.userAgent}\n`+perfTelemetry.toCSV()], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `arena-fps-p19-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
  document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function pickType() { return Arena.pickType(wave); }

// ----- Caminho: reta se estiver livre; senão A* (no máximo pathBudget buscas por quadro) -----
function steerTarget(e, tx = px, tz = pz) {
  const pos = e.g.position;
  if (Arena.lineClear(navGrid, pos.x, pos.z, tx, tz)) { e.path = null; return [tx, tz]; }   // caminho livre: vai direto
  const moved = Math.hypot(tx - e.pathGX, tz - e.pathGZ) > 3;                               // alvo mudou muito: caminho velho
  if ((!e.path || time >= e.pathT || moved) && pathBudget > 0) {
    pathBudget--;
    e.path = Arena.findPath(navGrid, pos.x, pos.z, tx, tz); e.pathI = 0; e.pathGX = tx; e.pathGZ = tz;
    e.pathT = time + 0.5 + (perfScenarioActive ? (e.id % 3) * 0.1 : Math.random() * 0.3);
  }
  if (e.path && e.pathI < e.path.length) {
    let wp = e.path[e.pathI];
    while (e.pathI < e.path.length - 1 && Math.hypot(wp[0] - pos.x, wp[1] - pos.z) < 0.7) wp = e.path[++e.pathI];   // chegou: próximo waypoint
    return wp;
  }
  return [tx, tz];                                    // sem caminho: tenta direto (e o desvio lateral assume se travar)
}

// ----- Projéteis inimigos (pool: uma esfera unitária compartilhada, só muda escala e cor) -----
const projGeo = new THREE.SphereGeometry(1, 8, 8), projHaloGeo = new THREE.SphereGeometry(1, 8, 8), projRingGeo = new THREE.TorusGeometry(0.82, 0.08, 4, 10);
const projPool = makePool(() => {
  const group = new THREE.Group();
  const core = new THREE.Mesh(projGeo, new THREE.MeshBasicMaterial({ color: 0xffa13d }));
  const halo = new THREE.Mesh(projHaloGeo, new THREE.MeshBasicMaterial({ color: 0xffa13d, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
  const ring = new THREE.Mesh(projRingGeo, new THREE.MeshBasicMaterial({ color: 0xffa13d, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
  group.add(halo, ring, core); group.userData = { core, halo, ring }; return addHidden(group);
});
function shootProjectile(ox, oy, oz, dx, dy, dz, speed, dmg, color, size) {     // (dx,dy,dz) já normalizado
  const m = projPool.get(), { core, halo, ring } = m.userData; m.position.set(ox, oy, oz);
  core.scale.setScalar(size); halo.scale.setScalar(size * 2.4); ring.scale.setScalar(size * 1.2);
  core.material.color.setHex(color); halo.material.color.setHex(color); ring.material.color.setHex(color);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(dx, dy, dz));
  projectiles.push({ m, v: new THREE.Vector3(dx * speed, dy * speed, dz * speed), life: 4, dmg, from: { x: ox, z: oz } });
}
function fireEnemyProjectile(e) {                     // mira no jogador
  const o = e.g.position, oy = e.T.boss ? 1.5 : 1.2;
  let dx = px - o.x, dy = py - oy, dz = pz - o.z; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
  if (e.T.boss) shootProjectile(o.x, oy, o.z, dx, dy, dz, 9, 16 * Arena.difficultyConfig(currentDifficulty).damage, 0xff3b82, 0.22);
  else shootProjectile(o.x, oy, o.z, dx, dy, dz, 7, e.attackDamage, 0xffa13d, 0.12);
  sfx.enemyShot(o.x, o.z, e.T.boss);
}
function removeProjectile(i) { projPool.put(projectiles[i].m); projectiles.splice(i, 1); }
function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]; p.life -= dt; p.m.position.addScaledVector(p.v, dt); p.m.userData.ring.rotation.z += dt * 8;
    const hitPlayer = Math.hypot(p.m.position.x - px, p.m.position.z - pz) < 0.65 && Math.abs(p.m.position.y - py) < 1.2;
    if (hitPlayer) { hurtPlayer(p.dmg, p.from.x, p.from.z); removeProjectile(i); continue; }
    if (p.life <= 0 || blocked(p.m.position.x, p.m.position.z, 0.08)) removeProjectile(i);
  }
}

// ----- Chefe: 3 fases (rajada → anel + reforços → investida) -----
function bossRing(e) {                                // 14 projéteis em círculo, mais lentos: abra espaço entre eles
  const o = e.g.position, B = e.boss, n = 14;
  for (let k = 0; k < n; k++) { const a = B.ringRot + k * (Math.PI * 2 / n); shootProjectile(o.x, 1.3, o.z, Math.sin(a), 0, Math.cos(a), 6, 12, 0xffb3d1, 0.18); }
  B.ringRot += 0.22; sfx.boom(o.x, o.z);
}
function bossPhaseStart(e, ph) {
  e.flash = 0.4; sfx.boss();
  if (ph === 2) {
    banner('FASE 2\nO CHEFE CONVOCA REFORÇOS', 3);
    for (let k = 0; k < 3; k++) {
      spawnEnemy(k === 2 ? 'exploder' : 'runner'); const m = enemies[enemies.length - 1], a = k * 2.1;
      const nx = e.g.position.x + Math.sin(a) * 2.6, nz = e.g.position.z + Math.cos(a) * 2.6;
      if (!blocked(nx, nz, 0.6)) m.g.position.set(nx, 0, nz);
    }
    e.boss.nextRing = time + 1.5;
  } else { banner('FASE FINAL\nCUIDADO COM A INVESTIDA', 3); e.boss.nextCharge = time + 2; }
}
// Devolve true quando o chefe está "ocupado" (telegrafando ou investindo) e o movimento normal deve parar
function updateBoss(e, dt, dx, dz, dist) {
  const B = e.boss, pos = e.g.position, ph = Arena.bossPhase(e.hp / e.maxHp);
  if (ph > B.phase) { B.phase = ph; bossPhaseStart(e, ph); }
  if (B.charge === 'tele') {                          // aviso: para e pisca (0,9 s) antes de investir
    B.t -= dt;
    if (B.t <= 0) { B.charge = 'go'; B.t = 0.9; B.dx = dx / (dist || 1); B.dz = dz / (dist || 1); B.hit = false; }
    return true;
  }
  if (B.charge === 'go') {                            // investida em linha reta a 15 m/s
    B.t -= dt; let ok = false; const s = 15 * dt;
    if (!blocked(pos.x + B.dx * s, pos.z, 0.9)) { pos.x += B.dx * s; ok = true; }
    if (!blocked(pos.x, pos.z + B.dz * s, 0.9)) { pos.z += B.dz * s; ok = true; }
    e.phase += dt * 30; e.legL.rotation.x = Math.sin(e.phase) * 0.7; e.legR.rotation.x = -Math.sin(e.phase) * 0.7;
    if (!B.hit && Math.hypot(px - pos.x, pz - pos.z) < 1.8) { B.hit = true; hurtPlayer(30 * Arena.difficultyConfig(currentDifficulty).damage, pos.x, pos.z); }
    if (B.t <= 0 || !ok) { B.charge = null; B.nextCharge = time + 5.5; }
    return true;
  }
  if (time >= B.nextBurst && dist < 22) { B.burstLeft = ph === 1 ? 3 : ph === 2 ? 4 : 5; B.nextShot = time; B.nextBurst = time + (ph === 1 ? 2.8 : ph === 2 ? 2.5 : 1.9); }
  if (B.burstLeft > 0 && time >= B.nextShot) { B.burstLeft--; B.nextShot = time + 0.16; fireEnemyProjectile(e); }
  if (ph >= 2 && time >= B.nextRing) { B.nextRing = time + 4.5; bossRing(e); }
  if (ph >= 3 && time >= B.nextCharge && dist > 4) { B.charge = 'tele'; B.t = 0.9; }
  return false;
}
// Cor de brilho do chefe: pisca branco no aviso da investida; avermelhado na fase final
function bossGlow(e) {
  const B = e.boss;
  if (B.charge === 'tele') return Math.sin(time * 30) > 0 ? 0x999999 : 0x550000;
  return B.phase === 3 ? 0x330000 : 0;
}

function updateEnemyBar(e) {                                       // barra encolhe pela esquerda e muda de cor
  const ratio = Math.max(0.01, e.hp / e.maxHp);
  e.hpBar.scale.x = ratio;
  e.hpBar.material.color.setHex(ratio > 0.5 ? 0x3ddc84 : ratio > 0.25 ? 0xffc857 : 0xff5a4d);
}
// Números de dano: elementos <div> reaproveitados (pool no DOM)
const floatPool = [];
function showDamageNumber(e, amount, head) {
  const projected = e.g.position.clone().add(new THREE.Vector3(0, 2.1, 0)).project(camera);
  let d = floatPool.pop();
  if (!d) { d = document.createElement('div'); document.body.appendChild(d); }
  d.hidden = false; d.className = 'damage-float' + (head ? ' head' : '');
  d.style.animation = 'none'; void d.offsetWidth; d.style.animation = '';          // reinicia a animação CSS ao reaproveitar
  d.textContent = Math.ceil(amount); d.style.left = ((projected.x * 0.5 + 0.5) * innerWidth) + 'px';
  d.style.top = ((-projected.y * 0.5 + 0.5) * innerHeight) + 'px';
  setTimeout(() => { d.hidden = true; floatPool.push(d); }, 650);
}
function damageEnemy(e, dmg, head, showFloat = true, impact = 'body', hitPoint = null) {
  if (e.dead) return;
  const dealt = head ? dmg * stats.head : dmg; if (!perfScenarioActive) e.hp -= dealt;
  updateEnemyBar(e);
  if (showFloat) showDamageNumber(e, dealt, head);
  e.flash = 0.12; e.hitReact = head ? 0.24 : impact === 'shield' ? 0.16 : 0.19; e.hitReactMax = e.hitReact; e.hitHeadReact = head;
  if (hitPoint) { const local = e.g.worldToLocal(hitPoint.clone()); e.hitSide = Math.sign(local.x) || 1; }
  hitT = 0.2; hitHead = head; hitKind = impact; impact === 'shield' ? sfx.shieldHit() : sfx.hit(head);
  if (e.hp <= 0 && !perfScenarioActive) killEnemy(e, head);
}
function killEnemy(e, head, silent = false) {           // silent = morte por suicídio (sem pontos nem drop)
  e.dead = true;
  if (e.T.explodes) detonate(e);                         // kamikaze explode ao morrer
  const p = e.g.position.clone(); p.y = 1.2;
  e.deathDur = e.T.boss ? 0.82 : 0.48; e.deathT = e.deathDur; e.deathRoll = (Math.random() < 0.5 ? -1 : 1) * (e.T.boss ? 0.48 : 0.85);
  const deathColor = e.T.boss ? 0xff4f7b : e.T.shield ? 0x59e8ff : e.T.healer ? 0x44ff99 : e.T.explodes ? 0xffa23a : head ? 0xffd27a : e.T.color;
  debris(p, e.T.color, e.T.boss ? 18 : 7); debris(p, 0xd9b38c, head ? 6 : 3);
  sparkBurst(p, deathColor, e.T.boss ? 12 : 5);
  if (e.T.boss) blastFx(p.x, p.y, p.z, 1.8, 0xff4f7b, 0.62);
  if (!silent) {
    notifyAchievements(career.event('kill', { boss: !!e.T.boss }));
    if (comboT > 0) { combo = Math.min(5, combo + 1); sfx.combo(combo); }       // abates em sequência (janela de 3,2 s) multiplicam os pontos
    comboT = 3.2; maxCombo = Math.max(maxCombo, combo);
    notifyAchievements(career.event('combo', { combo }));
    const pts = (e.T.pts + (head ? 50 : 0)) * combo;
    score += pts; kills++; credits += Math.round(e.T.pts / 10 + (head ? 8 : 0));
    addFeed(`${head ? '☠ ' : ''}${(e.T.label || 'inimigo').toUpperCase()}  +${pts}${combo > 1 ? '  x' + combo : ''}`, head);
    if (e.T.boss) shake = Math.max(shake, 0.6);
    if (stats.vamp > 0) health = Math.min(maxHealth, health + stats.vamp);     // upgrade Sede de Sangue
    sfx.kill();
    if (Math.random() < 0.3) dropPickup(p.x, p.z);
  }
  if (!inc && toSpawn === 0 && enemies.every(x => x.dead)) { banner('ONDA LIMPA'); waveDelay = 3; }
  updateHUD();
}
function updateDeathAnimations(dt) {
  for (const e of enemies) {
    if (!e.dead || e.deathT <= 0) continue;
    e.deathT -= dt; const k = clamp(1 - e.deathT / e.deathDur, 0, 1);
    e.g.scale.setScalar(e.T.scale * (1 - k * 0.84)); e.g.position.y = -0.32 * k;
    e.g.rotation.z = e.deathRoll * k; e.g.rotation.x = 0.18 * k;
  }
  for (const e of enemies) if (e.dead && e.deathT <= 0) recycleRig(e);
}
// Explosão em área: dano decai com a distância (70% nas bordas); machuca inimigos e/ou o jogador
function explode(x, y, z, R, dmgEnemies, dmgPlayer) {
  blastFx(x, y, z, R, 0xffa23a, 0.35, true); spawnBlastSmoke(x,y,z,5); pulseExplosionLight(x,y,z,R);
  debris(new THREE.Vector3(x, y, z), 0xffc857, 10);
  sfx.boom(x, z);
  shake = Math.max(0, 0.45 - Math.hypot(x - px, z - pz) * 0.02);     // tremor de tela: mais forte perto da explosão
  if (dmgEnemies > 0) for (const e of enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.g.position.x - x, e.g.position.z - z);
    if (d < R) damageEnemy(e, dmgEnemies * (1 - 0.7 * d / R), false);      // pode matar kamikazes vizinhos (reação em cadeia)
  }
  if (dmgPlayer > 0) { const d = Math.hypot(px - x, pz - z); if (d < R) hurtPlayer(dmgPlayer * (1 - 0.6 * d / R), x, z); }
}
function detonate(e) {                                   // o kamikaze só explode uma vez
  if (e.detonated) return; e.detonated = true;
  explode(e.g.position.x, 1, e.g.position.z, 3.4, 40, e.attackDamage);
}

/* =====================================================================
   11. ITENS (vida e munição) — cubos reaproveitados (pool) com 2 materiais compartilhados
   ===================================================================== */
const pGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
const pickMats = {
  health: new THREE.MeshLambertMaterial({ color: 0x3ddc84, emissive: 0x14502e }),
  ammo: new THREE.MeshLambertMaterial({ color: 0xffc857, emissive: 0x5a4310 })
};
const pickupPool = makePool(() => addHidden(new THREE.Mesh(pGeo, pickMats.health)));
function dropPickup(x, z) {
  const type = Math.random() < 0.5 ? 'health' : 'ammo';
  const m = pickupPool.get(); m.material = pickMats[type]; m.position.set(x, 0.6, z);
  pickups.push({ m, type, life: 16 });
}
function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i]; p.life -= dt;
    p.m.rotation.y += dt * 2; p.m.position.y = 0.6 + Math.sin(time * 3 + i) * 0.1;
    const near = Math.hypot(p.m.position.x - px, p.m.position.z - pz) < 1.3;
    if (near) {
      if (p.type === 'health') health = Math.min(maxHealth, health + 25);
      else ammoState.forEach((s, k) => s.reserve += Math.ceil(magOf(WEAPONS[k]) * 1.2));
      sfx.pickup(); updateHUD();
    }
    if (near || p.life <= 0) { pickupPool.put(p.m); pickups.splice(i, 1); }
  }
}
function clearPickups() { pickups.forEach(p => pickupPool.put(p.m)); pickups = []; }

/* =====================================================================
   12. SISTEMA DE TIRO
   ===================================================================== */
const ray = new THREE.Raycaster();
const _muzzle = new THREE.Vector3(), _end = new THREE.Vector3(), _dir = new THREE.Vector3();
function triggerMuzzleFlash(index, color, duration) {
  if (flashingGun) flashingGun.visible = false;
  flashingGun = guns[index].userData.flash; tintFlash(flashingGun, color);
  flashingGun.rotation.z = Math.random() * Math.PI * 2; flashingGun.visible = true; flashT = duration; flashDur = duration;
  const u = flashingGun.userData, k = 0.8 + Math.random() * 0.45; u.outer.scale.multiplyScalar(1); flashingGun.scale.setScalar(k);
  muzzleLight.color.setHex(color).lerp(new THREE.Color(0xffffff), 0.35);
}

// Dispersão REAL da arma agora (a mira do HUD usa o mesmo valor): menor ao mirar, maior ao se mover ou no ar
function currentSpread() {
  const moving = Math.min(1, Math.hypot(vx, vz) / 6.5);
  const precision = scoped ? (curW === 4 ? 0 : 0.35) : 1;
  return cur().spread * precision * (1 + moving * 0.8) * (py > EYE + 0.05 ? 1.5 : 1);
}
function tryShoot() {
  if (!locked || !alive || reloading || time < nextShot) return;
  const w = cur(), s = ammoState[curW];
  if (s.ammo <= 0) { sfx.dry(); nextShot = time + 0.25; startReload(); return; }
  s.ammo--; nextShot = time + w.rate * stats.rate;
  if (curW === 2) machineGunHeat = Math.min(1,machineGunHeat+.07); // cosmético: não interfere no combate
  sfx.shot(w); ejectCasing(w);
  const shotVisual = w.visual?.shot;
  if (shotVisual) {
    viewKick = Math.min(.24, viewKick + shotVisual.impulse);
    viewPitch = Math.min(.32, viewPitch + shotVisual.pitch);
    viewRoll = clamp(viewRoll + (Math.random() - .5) * shotVisual.roll, -.12, .12);
    shotPulseT = Math.max(shotPulseT, shotVisual.coilPulse || 0);
  }

  const sp = currentSpread();

  // Alvos: inimigos vivos + cenário (o cenário bloqueia tiros)
  const targets = solids.concat(...enemies.filter(e => !e.dead).map(e => e.shield ? [e.body, e.head, e.shield] : [e.body, e.head]));
  guns[curW].userData.flash.getWorldPosition(_muzzle);
  const hitTotals = new Map();
  const pushed = new Set();

  if (w.launcher) launchGrenade(w);                      // lança-granadas não usa raio: cria um projétil
  else for (let i = 0; i < w.pellets; i++) {
    // Direção local com ruído aleatório, depois rotacionada pela câmera
    _dir.set((Math.random() - .5) * 2 * sp, (Math.random() - .5) * 2 * sp, -1).normalize().applyQuaternion(camera.quaternion);
    ray.set(camera.position, _dir); ray.far = w.range;
    const hits = ray.intersectObjects(targets, false);         // ordenados do mais perto ao mais longe
    const seen = new Set(); let end = null, stopped = false;
    for (const hit of hits) {
      const ud = hit.object.userData;
        if (ud && ud.enemy) {
          if (ud.enemy.dead) continue;
        if (ud.shield && w.pierce) {                            // Railgun atravessa o escudo com sobrecarga visual
          const n = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 0, 1);
          blastFx(hit.point.x, hit.point.y, hit.point.z, 0.65, 0x59e8ff, 0.18); sparkBurst(hit.point, 0x59e8ff, 9, n); sfx.shieldBreak(); continue;
        }
        if (seen.has(ud.enemy)) continue;                      // 1 acerto por inimigo em cada projétil
        seen.add(ud.enemy);
        const fall = 1 - w.falloff * Math.min(hit.distance / w.range, 1);  // dano cai com a distância
        let pelletDamage = w.dmg * fall * stats.dmg;
        if (ud.shield) { pelletDamage *= 0.15; ud.enemy.shieldHit = 0.2; blastFx(hit.point.x, hit.point.y, hit.point.z, 0.45, 0x59e8ff, 0.14); sparkBurst(hit.point, 0x59e8ff, 6); debris(hit.point, 0xaec6ff, 3); }   // escudo absorve 85%
        sparkBurst(hit.point, ud.shield ? 0x59e8ff : ud.head ? 0xffd27a : w.color, ud.head ? 6 : 3);
        damageEnemy(ud.enemy, pelletDamage, ud.head, false, ud.shield ? 'shield' : 'body', hit.point);
        if (w.knockback && !ud.shield && !pushed.has(ud.enemy)) {
          const dx = ud.enemy.g.position.x - px, dz = ud.enemy.g.position.z - pz, d = Math.hypot(dx, dz) || 1;
          const push = w.knockback * (1 - 0.5 * Math.min(hit.distance / w.range, 1));
          const nx = ud.enemy.g.position.x + dx / d * push, nz = ud.enemy.g.position.z + dz / d * push;
          if (!blocked(nx, ud.enemy.g.position.z, 0.5)) ud.enemy.g.position.x = nx;
          if (!blocked(ud.enemy.g.position.x, nz, 0.5)) ud.enemy.g.position.z = nz;
          pushed.add(ud.enemy);
        }
        const prior = hitTotals.get(ud.enemy) || { amount: 0, head: false };
        prior.amount += ud.head ? pelletDamage * stats.head : pelletDamage; prior.head = prior.head || ud.head; hitTotals.set(ud.enemy, prior);
        end = hit.point;
        if (!w.pierce) { stopped = true; break; }              // balas comuns param no primeiro inimigo
      } else { surfaceImpact(hit, w.color); end = hit.point; stopped = true; break; }   // cenário bloqueia tudo
    }
    if (end && stopped) _end.copy(end);
    else _end.copy(camera.position).addScaledVector(_dir, Math.min(w.range, w.pierce ? 120 : 60));
    tracer(_muzzle, _end, w.color);
  }

  hitTotals.forEach((v, e) => showDamageNumber(e, v.amount, v.head));

  // Recuo visual + clarão + recuo da mira
  kick = Math.min(kick + w.recoil, 0.35);
  pitch += w.recoil * 0.03; yaw += (Math.random() - .5) * w.recoil * 0.02;
  triggerMuzzleFlash(curW, w.color || 0xffd27a, 0.055);
  spawnMuzzleSmoke(_muzzle,w.color||0xffd27a,w.visual?.smoke||1);
  muzzleLight.intensity = w.visual?.flash === 'arc' ? 2.8 : 2.2;
  updateHUD();
}
// ----- Lança-granadas: projétil com gravidade que explode ao tocar chão, caixa, parede ou inimigo -----
const grenadeGeo = new THREE.SphereGeometry(0.16, 8, 8);
const grenadePool = makePool(() => addHidden(new THREE.Mesh(grenadeGeo, new THREE.MeshLambertMaterial({ color: 0x3f5a2a, emissive: 0x112200 }))));
function launchGrenade(w) {
  const m = grenadePool.get(); m.material.color.setHex(0x3f5a2a); m.material.emissive.setHex(0x112200);   // o pool é compartilhado com a granada de mão (outra cor)
  m.position.copy(_muzzle);
  _dir.set(0, 0, -1).applyQuaternion(camera.quaternion);                // direção da mira
  const v = _dir.clone().multiplyScalar(24); v.y += 3.2;                 // velocidade + empurrão para cima (forma o arco)
  grenades.push({ m, v, life: 3, dmg: w.dmg * stats.dmg, R: w.radius });
}
function updateGrenades(dt) {
  for (let i = grenades.length - 1; i >= 0; i--) {
    const g = grenades[i], p = g.m.position;
    g.life -= dt; g.v.y -= 16 * dt; p.addScaledVector(g.v, dt);         // gravidade
    let boom = g.life <= 0 || p.y <= 0.15 || Math.abs(p.x) > ARENA || Math.abs(p.z) > ARENA;
    if (!boom) for (const b of boxes) {                                  // só bate na caixa se estiver abaixo da altura dela
      if (p.y < b.h && p.x > b.minX - 0.1 && p.x < b.maxX + 0.1 && p.z > b.minZ - 0.1 && p.z < b.maxZ + 0.1) { boom = true; break; }
    }
    if (!boom) for (const e of enemies) {
      if (e.dead) continue; const q = e.g.position;
      if (p.y < 2.3 * e.T.scale && Math.hypot(q.x - p.x, q.z - p.z) < 0.7 * e.T.scale) { boom = true; break; }
    }
    if (boom) {
      grenadePool.put(g.m); grenades.splice(i, 1);
      explode(p.x, Math.max(p.y, 0.3), p.z, g.R, g.dmg, g.dmg * 0.25);   // 25% do dano machuca o próprio jogador
    }
  }
}
// Granada de mão (tecla G / botão GRANADA): 3 por partida, arco de 18 m/s, 115 de dano em raio 4,2
function throwHandGrenade() {
  if (!locked || !alive || reloading || handGrenades <= 0) return;
  handGrenades--;
  triggerMuzzleFlash(curW, 0x66e6ff, 0.045);
  const m = grenadePool.get(); m.material.color.setHex(0x35d6c8); m.material.emissive.setHex(0x063c3b);
  m.position.copy(camera.position);
  _dir.set(0, 0, -1).applyQuaternion(camera.quaternion);
  const v = _dir.clone().multiplyScalar(18); v.y += 7;
  grenades.push({ m, v, life: 3.2, dmg: 115 * stats.dmg, R: 4.2, hand: true });
  sfx.pickup(); updateHUD();
}
function startReload() {
  const w = cur(), s = ammoState[curW];
  if (reloading || s.ammo === magOf(w) || s.reserve <= 0) return;
  viewKick=0;viewPitch=0;viewRoll=0;
  if(w.visual?.shot?.coilPulse){shotPulseT=0;for(const part of guns[curW].userData.reloadParts.coils){part.mesh.material.emissiveIntensity=part.emissive;part.mesh.scale.copy(part.scale);}}
  reloading = true; scoped = false; reloadStarted = time; reloadStrokeT = w.shell ? 0 : 1;
  if (w.shell) {                                   // espingarda: duração = cartuchos que faltam × tempo de cada um
    const need = Math.min(magOf(w) - s.ammo, s.reserve);
    const st = w.shellTime * stats.reload;
    reloadDur = need * st; shellNext = time + st; sfx.reload(st * 1.2);
  } else { reloadDur = w.reload * stats.reload; sfx.reload(reloadDur); }
  reloadEnd = time + reloadDur;
}
function loadShell() {                             // coloca 1 cartucho no pente (chamado a cada shellTime)
  const w = cur(), s = ammoState[curW];
  const st = w.shellTime * stats.reload;
  s.ammo++; s.reserve--; shellNext += st; reloadStrokeT = 0; sfx.reload(st * 1.2); updateHUD();
}
function finishReload() {
  const w = cur(), s = ammoState[curW];
  const fill = Math.min(magOf(w) - s.ammo, s.reserve);
  s.ammo += fill; s.reserve -= fill; reloading = false; updateHUD();
}
function restoreReloadParts(index){
  const parts=guns[index]?.userData.reloadParts||{};
  Object.values(parts).flatMap(p=>Array.isArray(p)?p:[p]).forEach(p=>{
    if(!p?.mesh)return;
    p.mesh.position.copy(p.pos);p.mesh.rotation.copy(p.rot);p.mesh.scale.copy(p.scale);p.mesh.visible=p.visible;
    if(p.mesh.material&&p.mesh.material.emissiveIntensity!==undefined)p.mesh.material.emissiveIntensity=p.emissive;
  });
}
function restoreHandPose(index){
  const pair=handPairs[index];if(!pair)return;
  const {left,right,leftPos,rightPos,leftRot,rightRot}=pair.userData;
  left.position.copy(leftPos);right.position.copy(rightPos);left.rotation.copy(leftRot);right.rotation.copy(rightRot);
  poseGloveDigits(left);poseGloveDigits(right);
}
function selectWeapon(i) {
  if (i === curW || i < 0 || i >= WEAPONS.length || !isUnlocked(i)) return;
  restoreReloadParts(curW);restoreHandPose(curW);
  if (flashingGun) flashingGun.visible = false; flashingGun = null; flashT = 0; muzzleLight.intensity = 0;
  viewKick=0;viewPitch=0;viewRoll=0;shotPulseT=0;
  swapFromW=curW;curW=i;reloading=false;scoped=false;swapAnim=1;nextShot=time+.25;setViewModelLights(i);
  guns.forEach((g,k)=>g.visible=k===i||k===swapFromW);handPairs.forEach((h,k)=>h.visible=k===i||k===swapFromW);
  updateHUD();
}

function reloadEase(t,a,b) { const k=clamp((t-a)/Math.max(.001,b-a),0,1);return k*k*(3-2*k); }
function poseGloveDigits(hand,curl=0,trigger=0,thumbX=0,thumbZ=0){
  const triggerIndex=hand.userData.side==='right'?3:0;
  (hand.userData.fingers||[]).forEach((finger,i)=>{
    const flex=-.05+curl+(i===triggerIndex?trigger:0);
    finger.root.rotation.z=.04*(i-1.5);finger.proximal.rotation.x=flex;finger.distal.rotation.x=flex*.65;
  });
  if(hand.userData.thumb){
    hand.userData.thumb.rotation.x=thumbX;hand.userData.thumb.rotation.z=(hand.userData.side==='right'?.20:-.20)+thumbZ;
    hand.userData.thumb.userData.proximal.rotation.x=thumbX*.65;hand.userData.thumb.userData.distal.rotation.x=thumbX*.4;
  }
}
function animateReloadHands(t,profile) {
  const pair=handPairs[curW];if(!pair)return;
  const {left,right,leftPos,rightPos,leftRot,rightRot}=pair.userData;
  left.position.copy(leftPos);right.position.copy(rightPos);left.rotation.copy(leftRot);right.rotation.copy(rightRot);
  const firing=mouseHeld||gamepadFireHeld;
  poseGloveDigits(left,reloading ? .18 : 0,0,0,0);
  poseGloveDigits(right,reloading ? .12 : 0,firing ? .24 : 0,0,0);
  if(!reloading)return;
  const reach=reloadEase(t,.04,.27)*(1-reloadEase(t,.68,.94));
  left.position.x+=.045*reach;left.position.y-=.055*reach;left.position.z+=.12*reach;
  left.rotation.x+=.24*reach;left.rotation.z+=(profile==='pump'?.28:.12)*reach;
  if(profile==='cylinder'||profile==='drum'){left.position.x+=.035*reach;left.position.z+=.04*reach;}
  if(profile==='bolt-action'){right.position.x+=.035*reach;right.rotation.z+=.18*reach;}
  if(profile==='coils'){left.position.y+=.025*reach;left.rotation.z-=.16*reach;}
  if(profile==='cylinder'){
    const opening=reloadEase(t,.12,.28)*(1-reloadEase(t,.77,.91));
    poseGloveDigits(left,.08+.20*reloadEase(t,.48,.74),0,-.22*opening,.10*opening);
    poseGloveDigits(right,.08,0,0,0);
  }else{
    poseGloveDigits(left,.25*reach,0,-.10*reach,0);
    poseGloveDigits(right,.10*reach,firing?.18:0,.04*reach,0);
  }
}
function animateBoltCycle(part,t,travel,pullStart,pullEnd,returnStart,returnEnd){
  if(!part)return;
  // +Z recua o ferrolho em direção à câmera; a peça segura aberta, avança e dá um pequeno assentamento.
  const pull=reloadEase(t,pullStart,pullEnd),forward=reloadEase(t,returnStart,returnEnd),open=pull*(1-forward);
  const catchSnap=reloadEase(t,returnEnd,Math.min(.99,returnEnd+.075))*(1-reloadEase(t,returnEnd+.075,Math.min(1,returnEnd+.14)));
  part.mesh.position.z=part.pos.z+travel*open;
  part.mesh.rotation.x=part.rot.x+.24*open-.10*catchSnap;
}
function animateReloadParts(dt) {
  const parts=guns[curW].userData.reloadParts||{},profile=cur().visual?.reload;
  restoreReloadParts(curW);
  if(!reloading){animateReloadHands(0,profile);return;}
  const t=clamp((time-reloadStarted)/Math.max(.01,reloadDur),0,1),pulse=Math.sin(Math.PI*t);
  const magazine=(p)=>{
    if(!p)return;
    const out=reloadEase(t,.12,.30),back=reloadEase(t,.56,.70);
    if(t>.34&&t<.55)p.mesh.visible=false;
    p.mesh.position.y-=.13*(t<.34?out:(t>.55?1-back:0));
    p.mesh.rotation.x+=.12*(t<.34?out:(t>.55?1-back:0));
  };
  if(profile==='slide'||profile==='bolt'){
    magazine(parts.magazine);
    // Após o carregador assentar, o ferrolho é puxado para trás, fica retido e volta à câmara.
    animateBoltCycle(parts.bolt,t,profile==='slide' ? .12 : .16,.70,.77,.86,.94);
  }else if(profile==='feed-cover'){
    const open=reloadEase(t,.12,.27)*(1-reloadEase(t,.50,.68));
    if(parts.cover)parts.cover.mesh.rotation.x-=.48*open;
    magazine(parts.magazine);
  }else if(profile==='pump'){
    const strokeDur=cur().shellTime*stats.reload,stroke=clamp(reloadStrokeT/Math.max(.01,strokeDur),0,1),pump=Math.sin(Math.PI*stroke);
    if(parts.pump)parts.pump.mesh.position.z+=.20*pump;
    if(parts.shell){
      parts.shell.mesh.visible=stroke<.98&&ammoState[curW].reserve>0;
      const k=reloadEase(stroke,0,1);parts.shell.mesh.position.x+=.10*k;parts.shell.mesh.position.y+=.06*k;parts.shell.mesh.position.z-=.05*k;
    }
    if(reloadStrokeT<strokeDur)reloadStrokeT=Math.min(strokeDur,reloadStrokeT+dt);
  }else if(profile==='bolt-action'){
    animateBoltCycle(parts.bolt,t,.19,.12,.28,.55,.71);
    const bolt=parts.bolt;
    if(parts.round){const eject=reloadEase(t,.22,.32)*(1-reloadEase(t,.42,.53));parts.round.mesh.visible=eject>.02;parts.round.mesh.position.x+=.10*eject;parts.round.mesh.position.y+=.035*eject;parts.round.mesh.position.z+=.08*eject;}
    magazine(parts.magazine);
  }else if(profile==='cylinder'){
    // Magnum em quatro atos: destrava, abre o yoke no pivô lateral, indexa o cilindro no eixo Z,
    // expulsa os seis estojos e assenta cartuchos novos um a um antes de fechar e travar.
    const open=reloadEase(t,.13,.27)*(1-reloadEase(t,.82,.95));
    const latch=reloadEase(t,.04,.12)*(1-reloadEase(t,.88,.98));
    if(parts.yoke)parts.yoke.mesh.rotation.y=parts.yoke.rot.y-.72*open;
    if(parts.latch)parts.latch.mesh.position.x=parts.latch.pos.x+.018*latch;
    if(parts.cylinder){const index=reloadEase(t,.28,.62);parts.cylinder.mesh.rotation.z=parts.cylinder.rot.z+Math.PI*2*index;}
    if(parts.hammer){const cock=reloadEase(t,.82,.91)*(1-reloadEase(t,.91,.98));parts.hammer.mesh.rotation.x=parts.hammer.rot.x-.32*cock;}
    (parts.rounds||[]).forEach((p,i)=>{
      const insertAt=.49+i*.045,insert=reloadEase(t,insertAt,insertAt+.075),eject=reloadEase(t,.31,.42);
      if(t<.42)p.mesh.position.z=p.pos.z+.12*eject;
      else if(t<insertAt)p.mesh.visible=false;
      else p.mesh.position.z=p.pos.z+.12*(1-insert);
    });
  }else if(profile==='coils'){
    (parts.coils||[]).forEach((p,i)=>{
      const charge=reloadEase(t,.10+i*.17,.43+i*.17);
      p.mesh.scale.multiplyScalar(1+.045*pulse);p.mesh.rotation.z+=pulse*(i%2?-.18:.18);
      if(p.mesh.material.emissiveIntensity!==undefined)p.mesh.material.emissiveIntensity=(p.emissive||.32)+charge*.8;
    });
  }else if(profile==='drum'){
    if(parts.drum)parts.drum.mesh.rotation.z+=Math.PI*2*reloadEase(t,.14,.88);
  }
  animateReloadHands(t,profile);
}

/* =====================================================================
   13. DANO NO JOGADOR / GAME OVER
   ===================================================================== */
function hurtPlayer(d, sourceX = px, sourceZ = pz) {
  if (!alive) return;
  if (perfScenarioActive) return;
  if (terminalInteraction.active) cancelTerminalInteraction('DANO RECEBIDO · OPERAÇÃO CANCELADA');
  health = Math.max(0, health - d); vig = 0.9;
  shake = Math.max(shake, Math.min(0.5, d / 40)); lastHurt = time; combo = 1; comboT = 0;        // levar dano: treme a tela, para a regeneração e quebra o combo
  const incoming = Math.PI - (Math.atan2(sourceX - px, sourceZ - pz) - yaw);   // 0 = fonte à frente, sentido horário
  el.damageDirection.style.transform = `translate(-50%, -50%) rotate(${incoming}rad) translateY(-120px)`; damageDirT = 0.8;
  sfx.hurt(); updateHUD();
  if (health <= 0) gameOver();
}
function gameOver() {
  if (!alive) return;
  if (terminalInteraction.active) cancelTerminalInteraction('OPERADOR INCAPACITADO');
  alive = false; mouseHeld = false; scoped = false; locked = false; if (incVictory) sfx.objective(); else sfx.over();
  const result = career.finishRun({ score, wave, kills, mode: currentMode, difficulty: currentDifficulty });
  best = Math.max(result.best, currentMode === 'survival' && currentDifficulty === 'normal' ? best : 0);
  if (currentMode === 'survival' && currentDifficulty === 'normal' && score > best) { best = score; try { localStorage.setItem('arenaFpsBest', best); } catch (_) {} }
  notifyAchievements(result.earned); refreshCareerUI();
  closeIncTerm(); document.exitPointerLock();
  showOverlay('over');
}
function resetGame() {
  perfScenarioActive = false;
  enemies.forEach(recycleRig);                                               // devolve inclusive inimigos em dissolução
  clearPickups(); clearFx(); clearCasings(); clearSurfaceImpacts();
  projectiles.forEach(p => projPool.put(p.m)); grenades.forEach(g => grenadePool.put(g.m));
  grenades = []; introQueue = []; projectiles = []; enemies = [];
  if (inc && inc.marker) scene.remove(inc.marker); inc = null; incVictory = false; closeIncTerm(); 
  clearObjectiveMarkers(); interactQueued = interactHeld = false;
  currentMode = $('modeSelect').value || 'survival'; currentDifficulty = $('difficultySelect').value || 'normal'; refreshRecord(); if (!perfMode) career.beginDay(); enemySerial = 0;
  perks = {}; shop = { dmg: 0, hp: 0, dash: 0 }; shopBought.buyAmmo = 0; credits = 0; combo = 1; comboT = 0; maxCombo = 1; shake = 0; lastHurt = 0; beatT = 0; aliveTime = 0; handGrenades = 3; machineGunHeat = 0; el.feed.innerHTML = '';
  refreshStats(); perkOpen = false; $('perks').classList.add('hidden');
  ammoState.forEach((s, i) => { s.ammo = WEAPONS[i].mag; s.reserve = WEAPONS[i].reserve; });
  px = 0; pz = 0; py = EYE; vx = vz = vy = 0; yaw = 0; pitch = 0; dashQueued = false; dashTime = 0; dashCooldown = 0; adsT = 0;
  health = maxHealth; score = 0; kills = 0; wave = 0; reloading = false; scoped = false; kick = 0;
  curW = -1; selectWeapon(0);
  alive = true;
  if (currentMode === 'incursion') startIncursion(); else startWave();
}
function startWave() {
  wave++; const profile = Arena.waveProfile(wave); bossPending = wave % 5 === 0; toSpawn = Math.max(3, Math.ceil(Arena.waveCount(wave) * Arena.difficultyConfig(currentDifficulty).count)); spawnT = bossPending ? 2.2 : 1; waveDelay = 3;
  if (!perfMode) notifyAchievements(career.event('wave', { wave }));
  // Avisos da onda: arena nova, armas liberadas e inimigos que estreiam agora
  const news = [];
  const mi = Arena.mapForWave(wave);
  if (mi !== curMap) {                                  // a cada 5 ondas: arena nova (jogador volta ao centro)
    const M = loadMap(mi); clearPickups(); clearSurfaceImpacts(); px = 0; pz = 0; vx = vz = 0;
    news.push(`NOVA ARENA: ${(M.theme || M.name).toUpperCase()}`);
  }
  WEAPONS.forEach((w, i) => { if (wave > 1 && (w.unlock || 1) === wave) news.push(`NOVA ARMA: ${w.name.toUpperCase()} [${i + 1}]`); });
  setupObjective();
  introQueue = Object.keys(TYPES).filter(k => TYPES[k].intro === wave);   // o primeiro a nascer é o tipo novo
  introQueue.forEach(k => news.push(`NOVO INIMIGO: ${TYPES[k].label.toUpperCase()}`));
  banner(['ONDA ' + wave + ' · ' + profile.name, profile.hint, ...news].join('\n'), news.length ? 4 : 2.8); updateHUD();
}

/* =====================================================================
   14. ATUALIZAÇÃO A CADA QUADRO
   ===================================================================== */
// Mira assistida (toque): enquanto atira, puxa a mira de leve para o inimigo mais próximo do centro (cone ~5°)
function assistAim(dt) {
  let best = null, bd = 0.09;
  for (const e of enemies) {
    if (e.dead) continue;
    const dx = e.g.position.x - px, dz = e.g.position.z - pz, dist = Math.hypot(dx, dz);
    if (dist < 1) continue;
    const dyaw = Math.atan2(Math.sin(Math.atan2(-dx, -dz) - yaw), Math.cos(Math.atan2(-dx, -dz) - yaw));   // diferença de ângulo já normalizada
    const dp = Math.atan2(1.15 * e.T.scale - py, dist) - pitch;
    const d = Math.hypot(dyaw, dp);
    if (d < bd) { bd = d; best = { dyaw, dp }; }
  }
  if (best) { const k = Math.min(1, dt * 5); yaw += best.dyaw * k; pitch += best.dp * k; }
}
function update(dt) {
  pollGamepad(dt);
  refreshTerminalInteraction();
  /* --- Movimento do jogador (WASD) --- */
  let f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);        // let: o joystick soma depois
  let r = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  // frente = (-sin yaw, -cos yaw) ; direita = (cos yaw, -sin yaw)
  if (useTouch) { f -= joy.y; r += joy.x; }          // joystick virtual soma ao teclado (analógico: -1..1)
  if (gamepadConnected && !useTouch) { f -= gamepadMove.y; r += gamepadMove.x; }
  const inMag = Math.min(1, Math.hypot(f, r));         // 0..1 = quanto o jogador empurrou
  let mx = -Math.sin(yaw) * f + Math.cos(yaw) * r;
  let mz = -Math.cos(yaw) * f - Math.sin(yaw) * r;
  const len = Math.hypot(mx, mz); if (len > 0) { mx /= len; mz /= len; }
  dashCooldown = Math.max(0, dashCooldown - dt);
  if (dashQueued && dashCooldown <= 0) { dashTime = 0.18; dashCooldown = 2.5 * stats.dash; dashQueued = false; sfx.pickup(); }
  dashTime = Math.max(0, dashTime - dt);
  if (dashTime > 0 && len === 0) { mx = -Math.sin(yaw); mz = -Math.cos(yaw); }
  const sprint = keys.ShiftLeft || (useTouch && inMag > 0.96);   // joystick até o limite = correr
  const operationSlow = terminalInteraction.active ? 0.18 : 1;
  const spd = dashTime > 0 ? 22 * operationSlow : (sprint ? 10 : 6.5) * (scoped ? 0.45 : 1) * (len > 0 ? inMag : 1) * stats.speed * operationSlow;
  const k = Math.min(1, dt * 12);                 // suavização da aceleração
  vx += (mx * spd - vx) * k; vz += (mz * spd - vz) * k;
  // Eixos separados = "deslizar" nas paredes em vez de travar
  if (!blocked(px + vx * dt, pz, 0.4)) px += vx * dt;
  if (!blocked(px, pz + vz * dt, 0.4)) pz += vz * dt;
  // Pulo simples
  if ((keys.Space || gamepadJumpQueued) && py <= EYE + 0.001) vy = 7.5;
  gamepadJumpQueued = false;
  vy -= 22 * dt; py += vy * dt; if (py < EYE) { py = EYE; vy = 0; }

  if (useTouch && assistOn && mouseHeld) assistAim(dt);            // mira assistida leve só no toque
  if (gamepadConnected && !useTouch) setAds(gamepadAdsHeld);
  /* --- Câmera (ordem YXZ: yaw e pitch independentes) --- */
  if (terminalInteraction.active && inc) {
    const t = incTarget(), dx = t.x - px, dz = t.z - pz, dist = Math.max(.1, Math.hypot(dx, dz));
    const targetYaw = Math.atan2(-dx, -dz), targetPitch = Math.atan2(1.48 - py, dist);
    yaw += Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw)) * Math.min(1, dt * 7);
    pitch += (targetPitch - pitch) * Math.min(1, dt * 7);
  }
  pitch = clamp(pitch, -1.5, 1.5);
  const sh = shake * shake;                                       // tremor de tela (explosões, dano): curva quadrática
  camera.rotation.set(pitch + (Math.random() - 0.5) * sh * 0.12, yaw + (Math.random() - 0.5) * sh * 0.12, (Math.random() - 0.5) * sh * 0.06);
  const focusPush = terminalInteraction.focus * .12;
  camera.position.set(px - Math.sin(yaw) * focusPush, py + terminalInteraction.focus * .035, pz - Math.cos(yaw) * focusPush); shake = Math.max(0, shake - dt * 1.6);
  audio.setListener(px, pz, yaw);
  camera.updateMatrixWorld(true);

  /* --- Zoom da sniper --- */
  const wantFov = scoped ? baseFov / cur().zoom : baseFov - terminalInteraction.focus * 6;
  if (Math.abs(camera.fov - wantFov) > 0.1) {
    camera.fov += (wantFov - camera.fov) * Math.min(1, dt * 14); camera.updateProjectionMatrix();
  }
  if (useTouch) bAdsEl.classList.toggle('act', scoped);   // botão MIRAR acompanha o estado real (recarga/troca de arma desligam o zoom)
  const scopeOn = scoped && curW === 4;
  el.scope.style.opacity = scopeOn ? 1 : 0;
  el.cross.style.opacity = scopeOn ? 0 : 1;
  holder.visible = !scopeOn;

  /* --- Armas: tiro automático, recarga, animações --- */
  if ((mouseHeld || gamepadFireHeld) && cur().auto) tryShoot();
  if (reloading) {
    if (cur().shell && time >= shellNext && ammoState[curW].ammo < magOf(cur()) && ammoState[curW].reserve > 0) loadShell();
    el.reloadWrap.style.opacity = 1;
    el.reloadBar.style.width = (100 - ((reloadEnd - time) / reloadDur) * 100) + '%';
    if (time >= reloadEnd) { finishReload(); el.reloadWrap.style.opacity = 0; }
  } else el.reloadWrap.style.opacity = 0;
  const reloadProgress = reloading ? clamp((time - reloadStarted) / reloadDur, 0, 1) : 0;
  el.reloadLabel.textContent = reloading ? `RECARREGANDO · ${Math.round(reloadProgress * 100)}%` : '';
  el.reloadLabel.style.opacity = reloading ? 1 : 0;
  animateReloadParts(dt);
  const shotProfile=cur().visual?.shot, visualDecay=Math.exp(-(shotProfile?.recovery||12)*dt);
  viewKick*=visualDecay;viewPitch*=visualDecay;viewRoll*=visualDecay;
  shotPulseT=Math.max(0,shotPulseT-dt*5.5);
  if(curW===6&&shotPulseT>0){
    const coils=guns[curW].userData.reloadParts.coils, pulse=[.48,.72,1];
    coils.forEach((part,i)=>{const glow=shotPulseT*pulse[i];part.mesh.material.emissiveIntensity=part.emissive+glow;part.mesh.scale.copy(part.scale).multiplyScalar(1+glow*.055);});
  }

  const moveRatio = Math.min(1, Math.hypot(vx, vz) / 6.5);
  // Mira dinâmica: a abertura em pixels = dispersão real (em tangente) × pixels por unidade de tangente da câmera
  const pxPerTan = innerHeight / 2 / Math.tan(camera.fov * Math.PI / 360);
  const gapTarget = Math.max(5, currentSpread() * pxPerTan + 3);
  crossGap += (gapTarget - crossGap) * Math.min(1, dt * 16);
  el.cross.style.setProperty('--gap', crossGap.toFixed(1) + 'px');
  bobT += dt * (6 + moveRatio * 6);
  kick -= kick * Math.min(1, dt * 14);
  swapAnim = Math.max(0, swapAnim - dt * 4);
  const swapProgress=1-swapAnim;
  guns.forEach((g,k)=>{
    const h=handPairs[k],current=k===curW,old=k===swapFromW&&swapAnim>0;
    g.position.set(0,0,0);g.rotation.set(0,0,0);h.position.set(0,0,0);h.rotation.set(0,0,0);
    g.visible=h.visible=current||old;
    if(current){g.position.y=-.18*swapAnim;g.rotation.x=-.13*swapAnim;h.position.y=-.18*swapAnim;}
    else if(old){g.position.y=-.18*swapProgress;g.rotation.x=.24*swapProgress;h.position.y=-.18*swapProgress;}
  });
  if(swapAnim<=0)swapFromW=-1;
  let rp = 0; if (reloading) rp = Math.sin((1 - (reloadEnd - time) / reloadDur) * Math.PI);
  adsT += ((scoped && !scopeOn ? 1 : 0) - adsT) * Math.min(1, dt * 14);   // 0 = tiro do quadril, 1 = mirando
  const idle=1-moveRatio;
  updateMachineGunHeat(dt);
  // Inércia da arma: atrasa em relação ao olhar, inclina ao andar de lado e afunda ao aterrissar
  let dYaw = yaw - lastYaw, dPitch = pitch - lastPitch; lastYaw = yaw; lastPitch = pitch;
  if (Math.abs(dYaw) > 1) dYaw = 0;
  const swayK = 1 - adsT * 0.75;
  swayX += (THREE.MathUtils.clamp(dYaw * 1.6, -.06, .06) * swayK - swayX) * Math.min(1, dt * 10);
  swayY += (THREE.MathUtils.clamp(dPitch * 1.6, -.05, .05) * swayK - swayY) * Math.min(1, dt * 10);
  const sideVel = vx * Math.cos(yaw) - vz * Math.sin(yaw);
  strafeTilt += (THREE.MathUtils.clamp(-sideVel * 0.012, -.06, .06) * (1 - adsT) - strafeTilt) * Math.min(1, dt * 8);
  if (lastVy < -3 && Math.abs(vy) < 0.5 && py <= EYE + 0.02) landDip = Math.min(0.06, -lastVy * 0.006);
  lastVy = vy; landDip *= Math.exp(-9 * dt);
  holder.position.set(
    HOLD_BASE.x * (1 - adsT * 0.92) + Math.sin(bobT) * 0.008 * moveRatio * (1 - adsT),   // vai para o centro ao mirar
    HOLD_BASE.y + adsT * 0.07 + Math.abs(Math.cos(bobT)) * 0.01 * moveRatio * (1 - adsT) + Math.sin(bobT*.45)*.004*idle - rp * 0.2,
    HOLD_BASE.z + kick * 0.6 + viewKick
  );
  holder.position.x += swayX * 0.35; holder.position.y += swayY * 0.3 - landDip;
  holder.rotation.x = kick * 1.2 - rp * 0.6 + Math.sin(bobT*.5)*.003*idle + viewPitch + swayY * 0.8 - landDip * 1.5;
  holder.rotation.y = swayX * 0.9;
  holder.rotation.z = Math.sin(bobT*.35)*.003*idle + viewRoll + strafeTilt + swayX * 0.6;

  if (flashT > 0 && flashingGun) {   // clarão encolhe e esmaece; luz pisca em vez de apagar seca
    const f = Math.max(0, flashT / flashDur), u = flashingGun.userData;
    u.glowMat.opacity = 0.85 * f; u.outerMat.opacity = 0.92 * f; u.sideMat.opacity = 0.55 * f;
    muzzleLight.intensity *= 0.82 + Math.random() * 0.1;
  }
  if (flashT > 0) { flashT -= dt; if (flashT <= 0) { if (flashingGun) flashingGun.visible = false; flashingGun = null; muzzleLight.intensity = 0; } }

  /* --- Radar (redesenha ~20x por segundo, não a cada quadro) --- */
  radarT += dt; if (radarT > 0.05) { radarT = 0; drawRadar(); }

  /* --- Ondas e spawn --- */
  if (inc) updateIncursion(dt);                                   // Incursão: reforços contínuos e terminais no lugar das ondas
  else {
  if (bossPending && toSpawn === 0) { bossPending = false; spawnEnemy('boss'); }     // segurança: onda sem ninguém para nascer
  if (toSpawn > 0) {
    spawnT -= dt;
    if (bossPending && spawnT <= 0) { bossPending = false; spawnEnemy('boss'); spawnT = 0.8; }   // o chefe tem prioridade no instante do spawn
    else if (spawnT <= 0 && enemies.filter(e => !e.dead).length < MAX_ALIVE) {
      spawnEnemy(introQueue.length ? introQueue.shift() : pickType()); toSpawn--; spawnT = Math.max(0.5, 1.6 - wave * 0.1); updateHUD();
    }
  } else if (enemies.every(e => e.dead)) {
    waveDelay -= dt;
    if (waveDelay <= 0) { health = Math.min(maxHealth, health + 20); score += wave * 50; addFeed(`BÔNUS DE ONDA  +${wave * 50}`, false); openPerks(); }   // próxima onda só depois de escolher o upgrade
  }

  }

  if (!inc) updateObjective(dt);
  /* --- IA dos inimigos: A*, cobertura, flanqueamento de esquadrão e foco coordenado --- */
  pathBudget = 3;                                         // no máximo 3 buscas A* por quadro (reparte o custo)
  squadRefreshT -= dt;
  if (squadRefreshT <= 0) {
    squadRefreshT = 0.9;
    const plans = new Map(Arena.squadAssignments(enemies.filter(e => !e.dead)).map(p => [p.id, p]));
    for (const e of enemies) { const plan = plans.get(e.id); if (plan) { e.squad = plan; if (e.T.ranged && !e.T.boss) e.nextAtk = Math.max(e.nextAtk, time + plan.fireDelay); } }
  }
  for (const e of enemies) {
    if (e.dead) continue;
    const pos = e.g.position;
    const dx = px - pos.x, dz = pz - pos.z, dist = Math.hypot(dx, dz);
    e.g.rotation.y = Math.atan2(dx, dz);        // modelo olha para +Z
    e.g.rotation.z += (Math.sin(e.phase) * 0.025 - e.g.rotation.z) * Math.min(1, dt * 5);
    if (e.hitReact > 0) {
      e.hitReact = Math.max(0, e.hitReact - dt);
      const react = clamp(e.hitReact / (e.hitReactMax || 0.2), 0, 1);
      e.body.position.set(e.hitSide * 0.08 * react, 1.1 - (e.hitHeadReact ? 0.08 : 0.035) * react, 0);
      e.head.position.y = 1.82 - (e.hitHeadReact ? 0.22 : 0.035) * react;
    } else { e.body.position.set(0, 1.1, 0); e.head.position.y = 1.82; }
    let tx = px, tz = pz;
    if (objective && !objective.complete && ['guard','anchor'].includes(e.T.behavior)) {
      const target = objective.nodes[objective.activeIndex] || objective.nodes[0]; if (target) { tx = target.x; tz = target.z; }
    }
    if (e.T.flanker && dist > 3) {
      const plan = e.squad || { side: e.side, slot: 0 };
      const flank = Arena.flankPoint(px, pz, pos.x, pos.z, plan.side, 4.2 + Math.min(plan.slot, 2) * 0.8);
      tx = flank[0]; tz = flank[1];
    }
    // Unidades feridas procuram uma face cega de cobertura e usam-na antes de voltar à pressão.
    const canCover = e.T.cover && !e.T.boss && !e.T.explodes && e.hp / e.maxHp < 0.72;
    if (canCover && time >= e.nextCoverSearch && Arena.lineClear(navGrid, pos.x, pos.z, px, pz)) {
      e.nextCoverSearch = time + 2.4 + Math.random() * 1.1;
      const points = Arena.coverCandidates(boxes, pos, { x: px, z: pz }, blocked, (ax,az,bx,bz) => Arena.lineClear(navGrid,ax,az,bx,bz));
      const cover = Arena.chooseCoverPoint(points);
      if (cover) { e.coverPoint = cover; e.coverUntil = time + 2.4; }
    }
    const usingCover = e.coverPoint && time < e.coverUntil;
    if (usingCover) { tx = e.coverPoint.x; tz = e.coverPoint.z; }
    // Movimento: +1 aproxima, -1 afasta, 0 fica parado
    let move = 0;
    if (e.T.ranged) { const hold = e.T.boss ? 11 : 9; if (dist > hold) move = 1; else if (dist < 6) move = -1; }   // atiradores recuam se você chegar perto
    else if (e.T.healer) { if (dist > 13) move = 1; else if (dist < 9) move = -1; }                                // curandeiro mantém distância
    else if (dist > 1.4) move = 1;
    if (usingCover) move = 1;
    const busy = e.T.boss ? updateBoss(e, dt, dx, dz, dist) : false;       // o chefe pode assumir o movimento (investida)
    if (move && !busy && !(usingCover && Math.hypot(tx-pos.x,tz-pos.z) < 0.9)) {
      let sx, sz;
      if (move > 0) {                                     // aproximar: segue o waypoint do A* (ou vai direto se a linha estiver livre)
        const [wx, wz] = steerTarget(e, tx, tz), wd = Math.hypot(wx - pos.x, wz - pos.z) || 1;
        sx = (wx - pos.x) / wd * e.speed * dt; sz = (wz - pos.z) / wd * e.speed * dt;
      } else { sx = -dx / dist * e.speed * dt; sz = -dz / dist * e.speed * dt; }
      let moved = false;
      if (!blocked(pos.x + sx, pos.z, 0.5)) { pos.x += sx; moved = true; }
      if (!blocked(pos.x, pos.z + sz, 0.5)) { pos.z += sz; moved = true; }
      if (!moved) {                              // ainda preso (quina): contorna pelo lado
        const px2 = pos.x - dz / dist * e.speed * dt * e.side, pz2 = pos.z + dx / dist * e.speed * dt * e.side;
        if (!blocked(px2, pz2, 0.5)) { pos.x = px2; pos.z = pz2; } else e.side *= -1;
      }
      e.phase += dt * e.speed * 3;               // animação das pernas
      e.legL.rotation.x = Math.sin(e.phase) * 0.7; e.legR.rotation.x = -Math.sin(e.phase) * 0.7;
    } else if (e.T.strafe && !busy && dist > 6 && dist < 13) {
      const s = e.side * e.speed * 0.72 * dt, sx = -dz / (dist || 1) * s, sz = dx / (dist || 1) * s;
      if (!blocked(pos.x + sx, pos.z, 0.5)) pos.x += sx;
      if (!blocked(pos.x, pos.z + sz, 0.5)) pos.z += sz;
      e.phase += dt * e.speed * 3; e.legL.rotation.x = Math.sin(e.phase) * 0.7; e.legR.rotation.x = -Math.sin(e.phase) * 0.7;
    }
    // Ação de cada tipo (o chefe age dentro de updateBoss)
    if (e.T.boss) { /* ataques em updateBoss */ }
    else if (e.T.ranged) {                       // atira andando, alcance 16
      if (dist < 16 && time >= e.nextAtk) { e.nextAtk = time + 1.55 + (e.squad?.fireDelay || 0); fireEnemyProjectile(e); }
    } else if (e.T.healer) {                     // pulso de cura: +12% da vida máxima dos aliados feridos num raio de 7
      if (time >= e.nextHeal) {
        e.nextHeal = time + 1.4;
        blastFx(pos.x, 1.2, pos.z, 1.3, 0x44ff99, 0.4);
        for (const o of enemies) {
          if (o.dead || o === e || o.hp >= o.maxHp) continue;
          if (Math.hypot(o.g.position.x - pos.x, o.g.position.z - pos.z) > 7) continue;
          o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.12); updateEnemyBar(o);
          blastFx(o.g.position.x, 1.2 * o.T.scale, o.g.position.z, 0.9, 0x44ff99, 0.35);
        }
      }
    } else if (dist <= (e.T.explodes ? 1.9 : 1.5) && time >= e.nextAtk) {
      if (e.T.explodes) { detonate(e); killEnemy(e, false, true); continue; }   // kamikaze: explode encostado em você
      e.nextAtk = time + 1.55; hurtPlayer(e.attackDamage, pos.x, pos.z);
    }
    // Piscar vermelho ao levar dano; o kamikaze pisca laranja sozinho (aviso visual); o chefe tem brilho próprio
    if (e.flash > 0) e.flash -= dt;
    const base = e.T.explodes && Math.sin(time * 14) > 0 ? 0x662200 : e.boss ? bossGlow(e) : 0x000000;
    const v = e.flash > 0 ? 0xaa1111 : base;
    e.mBody.emissive.setHex(v); e.mHead.emissive.setHex(v);
    if (e.shieldMat) { e.shieldHit = Math.max(0, e.shieldHit - dt); e.shieldMat.emissive.setHex(e.shieldHit > 0 ? 0x66ddff : 0x223355); e.shield.rotation.z = Math.sin(time * 70) * e.shieldHit * 0.8; }
    if (e.orb) e.orb.rotation.y += dt * 3;
  }
  // Separação simples entre inimigos (evita ficarem empilhados)
  for (let i = 0; i < enemies.length; i++) for (let j = i + 1; j < enemies.length; j++) {
    if (enemies[i].dead || enemies[j].dead) continue;
    const a = enemies[i].g.position, b = enemies[j].g.position;
    const ddx = b.x - a.x, ddz = b.z - a.z, d = Math.hypot(ddx, ddz);
    if (d < 0.9 && d > 0.001) { const push = (0.9 - d) / 2 / d; a.x -= ddx * push; a.z -= ddz * push; b.x += ddx * push; b.z += ddz * push; }
  }
  updateDeathAnimations(dt);
  enemies = enemies.filter(e => !e.dead || e.deathT > 0);
  // Barra de vida do chefe (topo da tela) com o nome da fase
  const boss = enemies.find(e => e.T.boss && !e.dead);
  bossBarEl.classList.toggle('hidden', !boss);
  if (boss) { bossFillEl.style.width = (Math.max(0, boss.hp) / boss.maxHp * 100) + '%'; bossNameEl.textContent = 'O SENHOR DA ARENA · FASE ' + boss.boss.phase; }

  updatePickups(dt);
  updateProjectiles(dt);
  updateGrenades(dt);
  updateFx(dt); updateCasings(dt); updateSurfaceImpacts(dt);

  /* --- Regeneração, combo, batimento e poeira --- */
  aliveTime += dt;
  if (time - lastHurt > 4.5 && health < maxHealth && health > 0) {        // 4,5 s sem dano: recupera 7 de vida por segundo
    health = Math.min(maxHealth, health + dt * 7);
    if (((time * 4) | 0) !== (((time - dt) * 4) | 0)) updateHUD();
  }
  if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 1; }
  el.combo.classList.toggle('on', combo > 1);
  el.comboN.textContent = 'x' + combo; el.comboBar.style.width = Math.max(0, comboT / 3.2 * 100) + '%';
  if (health / maxHealth < 0.3) { beatT -= dt; if (beatT <= 0) { sfx.beat(); beatT = 0.6 + health / 60; } }
  dust.rotation.y += dt * 0.01; dust.position.y = Math.sin(time * 0.3) * 0.2; updateArenaAtmosphere(dt);

  /* --- Efeitos de interface --- */
  vig = Math.max(0, vig - dt * 1.8); damageDirT = Math.max(0, damageDirT - dt); el.damageDirection.style.opacity = damageDirT > 0 ? Math.min(1, damageDirT * 3) : 0;
  const low = health / maxHealth < 0.3 ? 0.25 + Math.sin(time * 6) * 0.12 : 0;   // pulsa com vida baixa
  el.vignette.style.opacity = Math.max(vig, low);
  hitT = Math.max(0, hitT - dt); el.hit.style.opacity = hitT > 0 ? 1 : 0;
  el.hit.classList.toggle('head', hitHead); el.hit.classList.toggle('shield', hitKind === 'shield');
  if (bannerT > 0) { bannerT -= dt; el.banner.style.opacity = Math.min(1, bannerT); }
  else el.banner.style.opacity = 0;
}


/* =====================================================================
   14b. RADAR (minimapa em canvas 2D)
   ===================================================================== */
const radarEl = $('radar'), rctx = radarEl.getContext('2d');
const RADAR_RANGE = 24;                              // metros visíveis do centro até a borda
let radarOn = true, radarT = 0;
const RADAR_COLOR = e => e.T.boss ? '#ff3b82' : e.T.explodes ? '#ff8a1f' : e.T.shield ? '#59a7ff' : e.T.healer ? '#3ddc84' : e.T.ranged ? '#c77dff' : '#ff5a4d';
function drawRadar() {
  if (!radarOn || !rctx || typeof rctx.arc !== 'function') return;
  const S = radarEl.width, c = S / 2, edge = c - 6, droneOn = !!(inc && inc.droneT > 0), k = edge / (droneOn ? ARENA * 1.25 : RADAR_RANGE);   // k = pixels por metro
  rctx.clearRect(0, 0, S, S);
  rctx.save(); rctx.beginPath(); rctx.arc(c, c, c - 1, 0, Math.PI * 2); rctx.clip();
  // Mundo → radar: gira tudo pelo yaw para que "frente" fique sempre para CIMA
  // frente = (-sin, -cos) ; direita = (cos, -sin)
  const cs = Math.cos(yaw), sn = Math.sin(yaw);
  const toR = (x, z) => { const dx = x - px, dz = z - pz; return [c + (dx * cs - dz * sn) * k, c - (-dx * sn - dz * cs) * k]; };
  const poly = (pts, fill, stroke) => {
    rctx.beginPath(); pts.forEach(([x, z], i) => { const [rx, ry] = toR(x, z); i ? rctx.lineTo(rx, ry) : rctx.moveTo(rx, ry); }); rctx.closePath();
    if (fill) { rctx.fillStyle = fill; rctx.fill(); } if (stroke) { rctx.strokeStyle = stroke; rctx.lineWidth = 1.5; rctx.stroke(); }
  };
  poly([[-ARENA, -ARENA], [ARENA, -ARENA], [ARENA, ARENA], [-ARENA, ARENA]], null, 'rgba(255,255,255,.35)');     // paredes
  for (const b of boxes) poly([[b.minX, b.minZ], [b.maxX, b.minZ], [b.maxX, b.maxZ], [b.minX, b.maxZ]], 'rgba(255,255,255,.16)');   // obstáculos
  rctx.strokeStyle = 'rgba(255,255,255,.12)'; rctx.lineWidth = 1; rctx.beginPath(); rctx.arc(c, c, edge / 2, 0, Math.PI * 2); rctx.stroke();   // anel de 12 m
  rctx.fillStyle = 'rgba(255,255,255,.08)'; rctx.beginPath(); rctx.moveTo(c, c);                                                               // cone de visão
  rctx.lineTo(c - Math.sin(0.65) * edge, c - Math.cos(0.65) * edge); rctx.lineTo(c + Math.sin(0.65) * edge, c - Math.cos(0.65) * edge); rctx.closePath(); rctx.fill();
  for (const p of pickups) { const [x, y] = toR(p.m.position.x, p.m.position.z); rctx.fillStyle = p.type === 'health' ? '#3ddc84' : '#ffc857'; rctx.fillRect(x - 2, y - 2, 4, 4); }
  for (const e of enemies) {
    if (e.dead) continue;
    let [x, y] = toR(e.g.position.x, e.g.position.z); let far = false;
    const dx = x - c, dy = y - c, d = Math.hypot(dx, dy);
    if (d > edge) { x = c + dx / d * edge; y = c + dy / d * edge; far = true; }   // fora do alcance: ponto "colado" na borda
    rctx.globalAlpha = far ? 0.5 : 1; rctx.fillStyle = RADAR_COLOR(e);
    rctx.beginPath(); rctx.arc(x, y, e.T.boss ? 5 : 3, 0, Math.PI * 2); rctx.fill();
    if (droneOn) { rctx.strokeStyle = '#fff'; rctx.lineWidth = 1; rctx.beginPath(); rctx.arc(x, y, 6, 0, Math.PI * 2); rctx.stroke(); }   // marcado pelo drone
  }
  rctx.globalAlpha = 1; rctx.fillStyle = '#fff';                                  // jogador (triângulo apontando para cima)
  rctx.beginPath(); rctx.moveTo(c, c - 6); rctx.lineTo(c - 4.5, c + 4.5); rctx.lineTo(c + 4.5, c + 4.5); rctx.closePath(); rctx.fill();
  rctx.restore();
}


/* =====================================================================
   14c. UPGRADES ENTRE ONDAS — escolha 1 entre 3 (dados em upgrades.js)
   ===================================================================== */
const perksEl = $('perks'), perkCardsEl = $('perkCards'), bossBarEl = $('bossBar'), bossFillEl = $('bossFill'), bossNameEl = $('bossName');
function openPerks() {
  perkChoices = Arena.rollPerks(perks, 3); perkOpen = true; locked = false;    // locked = false pausa o jogo
  mouseHeld = false; scoped = false;
  $('perkInfo').textContent = `Onda ${wave} concluída · compre melhorias e escolha 1 upgrade para a próxima incursão (cartões: 1–3)`;
  perkCardsEl.innerHTML = '';
  perkChoices.forEach((p, i) => {
    const lvl = perks[p.id] || 0;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'perk';
    b.innerHTML = `<b>${i + 1} · ${p.name}</b>${p.desc}<small>${p.consumable ? 'uso imediato' : `nível ${lvl} → ${lvl + 1} de ${p.max}`}</small>`;
    b.addEventListener('click', () => pickPerk(i));
    perkCardsEl.appendChild(b);
  });
  perksEl.classList.remove('hidden'); refreshShop();
  if (!useTouch) document.exitPointerLock();                                  // solta o mouse para clicar nos cartões
  else releaseAllTouch();
}
function applyPerk(id) {
  const before = stats;
  if (id === 'heal') health = maxHealth;
  else if (id === 'ammo') ammoState.forEach((s, i) => { s.ammo = magOf(WEAPONS[i]); s.reserve = Math.ceil(WEAPONS[i].reserve * stats.mag); });
  else {
    perks[id] = (perks[id] || 0) + 1; refreshStats();
    if (id === 'mag') ammoState.forEach((s, i) => { const w = WEAPONS[i]; s.ammo += Math.ceil(w.mag * stats.mag) - Math.ceil(w.mag * before.mag); s.reserve += Math.ceil(w.reserve * 0.25); });
    if (id === 'hp') health = Math.min(maxHealth, health + 25);
  }
  updateHUD();
}
function pickPerk(i) {
  if (!perkOpen || !perkChoices[i]) return;
  const p = perkChoices[i];
  applyPerk(p.id); perkOpen = false; perksEl.classList.add('hidden');
  startWave(); banner(`UPGRADE: ${p.name.toUpperCase()}\nONDA ${wave}`, 2.6);
  if (useTouch) locked = true;
  else {                                                                      // desktop: o clique/tecla já é um gesto do usuário
    canvas.requestPointerLock();
    setTimeout(() => { if (!locked && alive && !perkOpen) showOverlay('pause'); }, 400);   // se o navegador recusar, cai no menu de pausa
  }
}
/* ---- Loja: gaste créditos (ganhos por abate) antes de escolher o upgrade; o preço sobe 20% a cada compra do mesmo item ---- */
const SHOP = {
  buyDamage: { base: 180, key: 'dmg',  label: 'DANO APRIMORADO',        apply() { refreshStats(); } },
  buyAmmo:   { base: 120, key: null,   label: 'MUNIÇÃO REABASTECIDA',   apply() { ammoState.forEach((a, i) => { a.reserve += Math.ceil(magOf(WEAPONS[i]) * 0.4); }); } },
  buyHealth: { base: 160, key: 'hp',   label: 'VIDA MÁXIMA REFORÇADA',  apply() { refreshStats(); health = Math.min(maxHealth, health + 20); } },
  buyDash:   { base: 140, key: 'dash', label: 'DASH TURBINADO',         apply() { refreshStats(); }, max: 3 }
};
const shopBought = { buyAmmo: 0 };
const shopLevel = id => SHOP[id].key ? shop[SHOP[id].key] : shopBought[id];
const shopCost = id => Math.round(SHOP[id].base * (1 + 0.2 * shopLevel(id)));
function refreshShop() {
  Object.keys(SHOP).forEach(id => {
    const b = $(id), maxed = SHOP[id].max && shopLevel(id) >= SHOP[id].max;
    b.querySelector('b').textContent = maxed ? 'MÁX.' : shopCost(id) + '¢';
    b.disabled = maxed || credits < shopCost(id);
  });
  el.credits.textContent = credits;
}
function buyShop(id) {
  if (!perkOpen) return;
  const it = SHOP[id], cost = shopCost(id);
  if (it.max && shopLevel(id) >= it.max) return;
  if (credits < cost) { addFeed('CRÉDITOS INSUFICIENTES', true); return; }
  credits -= cost;
  if (it.key) shop[it.key]++; else shopBought[id]++;
  it.apply(); addFeed(it.label, false); updateHUD(); refreshShop();
}
Object.keys(SHOP).forEach(id => $(id).addEventListener('click', () => buyShop(id)));
const perkSummary = () => Arena.PERKS.filter(p => perks[p.id]).map(p => `${p.name} ×${perks[p.id]}`).join(' · ');

/* =====================================================================
   15. ENTRADAS (mouse, teclado, Pointer Lock)
   ===================================================================== */
// Pointer Lock nativo: faz o papel do PointerLockControls (que não vem no build base do CDN)
const canvas = renderer.domElement;
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  if (!locked) perfWasRunning = false;
  if (locked) el.overlay.classList.add('hidden');
  else { mouseHeld = false; scoped = false; if (alive && !perkOpen && !(inc && inc.choiceOpen)) showOverlay('pause'); }
});
if (perfMode) document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') perfWasRunning = false;
});
document.addEventListener('pointerlockerror', () => {
  el.text.textContent = 'O navegador bloqueou o controle do mouse.\nAbra o arquivo diretamente em uma aba própria (não em um preview incorporado) e tente de novo.';
});

document.addEventListener('mousemove', e => {
  if (!locked) return;
  const s = SENS * (camera.fov / baseFov);     // sensibilidade menor com zoom
  yaw -= e.movementX * s; pitch -= e.movementY * s;
});
// Ações compartilhadas: mouse e botões de toque chamam as mesmas funções
function pressFire() {
  if (!locked || !alive) return;
  if (reloading) { if (ammoState[curW].ammo > 0) { reloading = false; el.reloadWrap.style.opacity = 0; } else return; }   // só cancela se ainda há bala
  mouseHeld = true; tryShoot();
}
function releaseFire() { mouseHeld = false; }
function setAds(on) { scoped = on && locked && alive && cur().zoom > 1 && !reloading; }
function cycleWeapon(dir) {
  let n = curW;
  for (let k = 0; k < WEAPONS.length; k++) { n = (n + dir + WEAPONS.length) % WEAPONS.length; if (isUnlocked(n)) break; }   // pula armas bloqueadas
  selectWeapon(n);
}
function padAxis(v, dead = 0.14) {
  const a = Math.abs(v || 0); if (a <= dead) return 0;
  return Math.sign(v) * Math.min(1, (a - dead) / (1 - dead));
}
function pollGamepad(dt) {
  const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
  const p = [...pads].find(Boolean);
  if (!p) { gamepadConnected = false; gamepadMove.x = gamepadMove.y = gamepadLook.x = gamepadLook.y = 0; gamepadFireHeld = gamepadAdsHeld = false; interactHeld = false; gamepadPrev = []; return; }
  gamepadConnected = true;
  const pressed = i => !!p.buttons?.[i]?.pressed;
  const just = i => pressed(i) && !gamepadPrev[i];
  gamepadMove.x = padAxis(p.axes?.[0]); gamepadMove.y = padAxis(p.axes?.[1]);
  gamepadLook.x = padAxis(p.axes?.[2]); gamepadLook.y = padAxis(p.axes?.[3]);
  gamepadFireHeld = pressed(7); gamepadAdsHeld = pressed(6); gamepadJumpQueued = just(0);
  if (locked && alive && !perkOpen) {
    yaw -= gamepadLook.x * dt * 3.2; pitch -= gamepadLook.y * dt * 2.6;
    if (just(1)) dashQueued = true;
    if (just(2)) startReload();
    if (just(3)) throwHandGrenade();
    if (just(4)) cycleWeapon(-1);
    if (just(5)) cycleWeapon(1);
    interactHeld = pressed(10);
    if (just(10)) interactObjective();
    if (just(7)) { if (reloading && ammoState[curW].ammo > 0) { reloading = false; el.reloadWrap.style.opacity = 0; } tryShoot(); }
    if (just(9)) { locked = false; gamepadFireHeld = false; showOverlay('pause'); if (document.pointerLockElement) document.exitPointerLock(); }
  }
  gamepadPrev = p.buttons.map(b => !!b.pressed);
}
document.addEventListener('mousedown', e => {
  if (useTouch || !locked || !alive) return;
  if (e.button === 0) pressFire();
  if (e.button === 2) setAds(true);
});
document.addEventListener('mouseup', e => {
  if (e.button === 0) mouseHeld = false;
  if (e.button === 2) scoped = false;
});
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('wheel', e => {
  if (!locked) return;
  cycleWeapon(e.deltaY > 0 ? 1 : -1);
}, { passive: true });
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (perfMode && e.code === 'F8') { e.preventDefault(); if (!e.repeat) perfPanel.hidden = !perfPanel.hidden; return; }
  if (perfMode && e.code === 'F9') { e.preventDefault(); if (!e.repeat) restartPerfScenario(); return; }
  if (perfMode && e.code === 'F10') { e.preventDefault(); if (!e.repeat) downloadPerfCsv(); return; }
  if (inc && inc.choiceOpen) { incTermKey(e); return; }                          // terminal de invasão (fictício) aberto
  if (perkOpen) {                                                                // tela de upgrades: 1–3 escolhem o cartão, 4–7 compram na loja
    const k = parseInt(e.key, 10); if (k >= 1 && k <= 3) pickPerk(k - 1); else if (k >= 4 && k <= 7) buyShop(['buyDamage', 'buyAmmo', 'buyHealth', 'buyDash'][k - 4]); return;
  }   // tela de upgrades: teclas 1–3
  if (!locked || !alive) return;
  if (e.code === 'KeyR') startReload();
  if (e.code === 'KeyQ') dashQueued = true;
  if (e.code === 'KeyG') throwHandGrenade();
  if (e.code === 'KeyF') useDrone();
  if (e.code === 'KeyE' && objective && objective.id === 'relay') interactObjective();
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= WEAPONS.length) {
    if (isUnlocked(n - 1)) selectWeapon(n - 1);
    else banner('ARMA BLOQUEADA\nLIBERA NA ONDA ' + WEAPONS[n - 1].unlock, 1.4);
  }
  if (e.code === 'Space') e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.code] = false; if (e.code === 'KeyE') terminalInteraction.lockout = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouseHeld = false; });
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});


/* =====================================================================
   15b. CONTROLES DE TOQUE (celular) — Pointer Events com multitoque
   ===================================================================== */
const ctrlSelect = $('ctrlSelect');
let useTouch = false;
const isCoarse = () => typeof matchMedia === 'function' && (matchMedia('(pointer: coarse)').matches || matchMedia('(hover: none)').matches);
const joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };      // joystick: x,y entre -1 e 1 (y negativo = frente)
const look = { id: null, x: 0, y: 0 };                    // dedo que gira a câmera
const JOY_R = 56, JOY_DEAD = 0.12;                        // raio do joystick (px) e zona morta
let TOUCH_LOOK = 1.9, assistOn = true;                    // ganho do olhar e mira assistida (ajustáveis no menu)
const joyBase = $('joyBase'), joyKnob = $('joyKnob'), bAdsEl = $('bAds');
const holds = new Map();                                  // pointerId -> { btn, up } dos botões pressionados

function joyReset() {
  joy.id = null; joy.x = 0; joy.y = 0; joyKnob.style.transform = '';
  joyBase.style.left = ''; joyBase.style.top = ''; joyBase.style.bottom = ''; joyBase.classList.add('idle');
}
function releaseAllTouch() {                              // soltou tudo (pausa, game over, aba escondida)
  joyReset(); look.id = null; mouseHeld = false; scoped = false; keys.Space = false; interactHeld = false;
  holds.forEach(h => h.btn.classList.remove('on')); holds.clear();
}
function applyControlMode() {
  const m = ctrlSelect.value;
  useTouch = m === 'touch' || (m === 'auto' && isCoarse());
  document.body.classList.toggle('touch', useTouch);
  if (!useTouch) releaseAllTouch();
  showOverlay(el.btn.dataset.mode || 'menu', true);       // atualiza o texto de ajuda
}
ctrlSelect.addEventListener('change', applyControlMode);

// Joystick flutuante: a base aparece onde o dedo tocou (zona esquerda)
$('joyZone').addEventListener('pointerdown', e => {
  if (!useTouch || !locked || joy.id !== null) return;
  joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY;
  joyBase.classList.remove('idle');
  joyBase.style.left = (e.clientX - 62) + 'px'; joyBase.style.top = (e.clientY - 62) + 'px'; joyBase.style.bottom = 'auto';
});
// Olhar: arrastar na zona direita
$('lookZone').addEventListener('pointerdown', e => {
  if (!useTouch || !locked || look.id !== null) return;
  look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY;
});
// Botões: "segurar" (fogo, pulo) ou "tocar" (recarregar, dash, mirar, pausa)
function bindButton(id, down, up) {
  const b = $(id);
  b.addEventListener('pointerdown', e => {
    if (!useTouch) return;
    e.preventDefault(); b.classList.add('on'); holds.set(e.pointerId, { btn: b, up });
    down();
  });
}
bindButton('bFire', pressFire, releaseFire);
bindButton('bAds', () => setAds(!scoped));   // mirar = liga/desliga
bindButton('bReload', () => { if (locked && alive) startReload(); });
bindButton('bJump', () => { if (locked && alive) keys.Space = true; }, () => { keys.Space = false; });
bindButton('bDash', () => { if (locked && alive) dashQueued = true; });
bindButton('bGrenade', throwHandGrenade);
bindButton('bInteract', () => { interactObjective(); interactHeld = true; }, () => { interactHeld = false; terminalInteraction.lockout = false; });
bindButton('bPause', () => pauseTouch());
// Trocar de arma: tocar num slot, ou tocar no painel da arma (próxima liberada)
el.slots.addEventListener('pointerdown', e => {
  if (!useTouch || !locked || !alive) return;
  const d = e.target.closest('.slot'); if (!d) return;
  const i = [...el.slots.children].indexOf(d);
  if (isUnlocked(i)) selectWeapon(i); else banner('ARMA BLOQUEADA\nLIBERA NA ONDA ' + WEAPONS[i].unlock, 1.4);
});
$('weapon').addEventListener('pointerdown', () => { if (useTouch && locked && alive) cycleWeapon(1); });

// Movimento e soltura dos dedos: ouvidos na janela para o dedo poder "sair" da zona sem perder o controle
addEventListener('pointermove', e => {
  if (!useTouch || !locked || !alive) return;
  if (e.pointerId === joy.id) {
    const dx = e.clientX - joy.ox, dy = e.clientY - joy.oy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, JOY_R / d);
    joyKnob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    const mag = Math.min(1, d / JOY_R);
    if (mag < JOY_DEAD) { joy.x = 0; joy.y = 0; } else { joy.x = dx / d * mag; joy.y = dy / d * mag; }
  } else if (e.pointerId === look.id) {
    const s = SENS * TOUCH_LOOK * (camera.fov / baseFov);        // sensibilidade menor com zoom
    yaw -= (e.clientX - look.x) * s; pitch -= (e.clientY - look.y) * s;
    look.x = e.clientX; look.y = e.clientY;
  }
});
function endPointer(e) {
  if (e.pointerId === joy.id) joyReset();
  if (e.pointerId === look.id) look.id = null;
  const h = holds.get(e.pointerId);
  if (h) { holds.delete(e.pointerId); h.btn.classList.remove('on'); if (h.up) h.up(); }
}
addEventListener('pointerup', endPointer);
addEventListener('pointercancel', endPointer);
// Bloqueia rolagem/zoom do navegador durante o jogo (exceto dentro do menu)
document.addEventListener('touchmove', e => { if (useTouch && !e.target.closest('#overlay')) e.preventDefault(); }, { passive: false });
function pauseTouch() {
  if (!useTouch || !alive || !locked) return;
  locked = false; releaseAllTouch(); showOverlay('pause');
}
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseTouch(); });

/* =====================================================================
   16. MENUS (overlay)
   ===================================================================== */
/* ---- Preferências salvas no aparelho (localStorage, com try/catch: pode estar bloqueado) ---- */
const PREF_KEY = 'arenaFpsPrefs';
const prefEls = { sens: $('sensRange'), volume: $('volumeRange'), fov: $('fovRange'), quality: $('qualitySelect'), ctrl: ctrlSelect, radar: $('radarSelect'), assist: $('assistSelect'), touchSens: $('touchSens'), btnScale: $('btnScale'), mode: $('modeSelect'), difficulty: $('difficultySelect') };
function applyPrefs() {                              // aplica o valor atual dos controles do menu ao jogo
  SENS = +prefEls.sens.value; audio.setVolume(+prefEls.volume.value);
  baseFov = +prefEls.fov.value; if (!scoped) { camera.fov = baseFov; camera.updateProjectionMatrix(); }
  if (appliedQuality !== prefEls.quality.value) {      // qualidade = resolução (só refaz quando muda)
    appliedQuality = prefEls.quality.value; const q = appliedQuality;
    prCap = curPR = FLAG.scale || (q === 'low' ? .75 : q === 'high' ? Math.min(devicePixelRatio, 2) : Math.min(devicePixelRatio, 1.25));
    renderer.setPixelRatio(curPR); renderer.setSize(innerWidth, innerHeight);
    const lite = q === 'low' || FLAG.noLights;           // modo leve: sem luzes de canto nem de explosão (menos cálculo por pixel)
    cornerLights.forEach(l => { l.userData.baseIntensity = lite ? 0 : 1.1; l.intensity = l.userData.baseIntensity; l.visible = !lite; });
    explosionLight.visible = !lite;
    if (FLAG.noLights) [muzzleLight, vmKey, vmRim].forEach(l => { l.visible = false; });
    if (curMap !== -1) loadMap(curMap);                  // refaz materiais da arena e reaquece (acontece no menu, nunca no combate)
  }
  TOUCH_LOOK = +prefEls.touchSens.value; assistOn = prefEls.assist.value === 'on';
  radarOn = prefEls.radar.value === 'on'; radarEl.classList.toggle('off', !radarOn);
  $('cluster').style.setProperty('--ts', prefEls.btnScale.value);
}
function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(Object.fromEntries(Object.entries(prefEls).map(([k, e]) => [k, e.value])))); } catch (e) {} }
function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
    for (const k in prefEls) { const e = prefEls[k]; if (k in p && (e.tagName !== 'SELECT' || [...e.options].some(o => o.value === p[k]))) e.value = p[k]; }
  } catch (e) {}
}
Object.values(prefEls).forEach(e => { const f = () => { applyPrefs(); savePrefs(); syncRunSelection(); }; e.addEventListener('input', f); e.addEventListener('change', f); });
const HELP_TOUCH = `<b>Joystick</b> mover  ·  <b>Arraste</b> mirar  ·  <b>FOGO</b> atirar · <b>USAR</b> interagir
<b>MIRAR</b> zoom  ·  <b>RECAR.</b> recarregar  ·  <b>PULO</b>, <b>DASH</b> e <b>GRANADA</b>
Toque nos números para trocar arma · acerte a cabeça para dano dobrado`;
const HELP = `<b>W A S D</b> mover · <b>Mouse</b> mirar · <b>Clique</b> atirar · <b>R</b> recarregar · <b>E</b> interagir
<b>1–8</b> ou roda do mouse trocar · <b>Shift</b> correr · <b>Espaço</b> pular · <b>Q</b> dash · <b>G</b> granada
<b>Gamepad</b> analógicos mover/mirar · RT fogo · LT mirar · LB/RB trocar · X recarregar · Y granada · B dash · A pular · L3 interagir`;
const helpText = () => useTouch ? HELP_TOUCH : HELP;
function refreshCareerUI() {
  const root = $('careerContent'); if (!root) return;
  const p = career.get(), challenges = career.challenges(), achievements = career.achievements(), skins = career.skins();
  const selected = p.selectedSkin || 'neon';
  root.innerHTML = `<div class="career-stats">PARTIDAS <b>${p.totals.runs}</b><br>ABATES <b>${p.totals.kills}</b><br>ONDAS ALCANÇADAS <b>${p.totals.bestWave}</b><br>OBJETIVOS <b>${p.totals.objectives}</b><br>CHEFES <b>${p.totals.bosses}</b><br>MAIOR COMBO <b>x${p.totals.bestCombo}</b></div>
    <div class="career-section"><h3>DESAFIOS DO DIA · ${p.daily.day || 'hoje'}</h3><div class="career-list">${challenges.map(c => `<div class="career-row ${c.complete?'done':''}"><span>${c.title}</span><small>${c.progress}/${c.goal}${c.complete?' ✓':''}</small></div>`).join('')}</div></div>
    <div class="career-section"><h3>CONQUISTAS</h3><div class="career-list">${achievements.map(a => `<div class="career-row ${a.complete?'done':'locked'}"><span>${a.complete?'✓':'·'} ${a.title}</span><small>${a.complete?'CONCLUÍDA':a.detail}</small></div>`).join('')}</div></div>
    <div class="career-section"><h3>VISUAL // COSMÉTICOS</h3><div class="career-list">${skins.map(s => `<div class="career-row ${s.unlocked?'done':'locked'}"><span>${s.unlocked?'✓':'—'} ${s.label}</span><small>${s.unlocked?'DESBLOQUEADO':'BLOQUEADO'}</small></div>`).join('')}</div><label class="skin-select-row">Equipar<select id="skinPicker">${skins.filter(s=>s.unlocked).map(s=>`<option value="${s.id}" ${s.id===selected?'selected':''}>${s.label}</option>`).join('')}</select></label></div>`;
  $('skinPicker')?.addEventListener('change', e => { career.selectSkin(e.target.value); applySkin(); });
}
function syncRunSelection() {
  if (!alive) { currentMode = $('modeSelect').value || 'survival'; currentDifficulty = $('difficultySelect').value || 'normal'; refreshRecord(); updateHUD(); }
}
function showOverlay(mode, keepHidden = false) {
  if (!keepHidden) el.overlay.classList.remove('hidden');
  if (mode === 'menu') {
    el.title.innerHTML = 'ARENA <span>FPS</span>'; el.text.innerHTML = helpText(); el.btn.textContent = 'JOGAR';
    if (perfMode) { el.text.innerHTML += '<br><b>DIAGNÓSTICO P19:</b> este link inicia o teste fixo de 12 inimigos. F8 mostra/oculta métricas; F9 reinicia; F10 exporta CSV.'; el.btn.textContent = 'INICIAR CENÁRIO FIXO'; }
  } else if (mode === 'pause') {
    el.title.innerHTML = 'PAUSADO'; el.text.innerHTML = helpText() + (perkSummary() ? `\n<b>Upgrades:</b> ${perkSummary()}` : ''); el.btn.textContent = 'CONTINUAR';
  } else {
    el.title.innerHTML = incVictory ? 'MISSÃO <span>CUMPRIDA</span>' : 'GAME <span>OVER</span>';
    el.text.innerHTML = `Pontuação: <b>${score}</b>  ·  Abates: <b>${kills}</b>  ·  Onda: <b>${wave}</b>\nModo: <b>${currentMode === 'operations' ? 'Operações' : currentMode === 'incursion' ? 'Incursão' : 'Sobrevivência'}</b> · Dificuldade: <b>${Arena.difficultyConfig(currentDifficulty).label}</b>\nMaior combo: <b>x${maxCombo}</b>  ·  Tempo: <b>${Math.floor(aliveTime / 60)}:${String(Math.floor(aliveTime % 60)).padStart(2, '0')}</b>\nRecorde deste modo/dificuldade: <b>${best}</b>${score >= best && score > 0 ? '  <b style="color:var(--warn)">NOVO!</b>' : ''}`;
    el.btn.textContent = 'JOGAR NOVAMENTE';
  }
  el.btn.dataset.mode = mode;
  refreshCareerUI();
}
el.btn.addEventListener('click', () => {
  audio.init();                                   // áudio só pode iniciar após um clique
  if (!started || el.btn.dataset.mode === 'over') {
    started = true;
    if (perfMode) { $('modeSelect').value = 'survival'; $('difficultySelect').value = 'normal'; }
    resetGame(); if (perfMode) startPerfScenario();
  }
  if (useTouch) {                                 // celular: não existe Pointer Lock; liberamos o jogo direto
    releaseAllTouch(); locked = true; el.overlay.classList.add('hidden');
    try { const root = document.documentElement; (root.requestFullscreen || root.webkitRequestFullscreen || (() => {})).call(root); } catch (e) {}
    try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
  } else canvas.requestPointerLock();
});

/* =====================================================================
   17. LOOP PRINCIPAL
   ===================================================================== */
let last = performance.now(), perfAcc = 0, perfN = 0, calmWindows = 0;
function setRes() { renderer.setPixelRatio(curPR); renderer.setSize(innerWidth, innerHeight); }
function loop(now) {
  requestAnimationFrame(loop);
  const frameMs = Math.max(0, now - last);
  const dt = Math.min(frameMs / 1000, 0.05);   // limita saltos (aba em segundo plano)
  last = now;
  const portrait = useTouch && innerHeight > innerWidth;   // celular em pé: o jogo espera (mostra "gire o celular")
  let updateMs = 0;
  if (locked && alive && !portrait && (!perfMode || document.visibilityState === 'visible')) {
    const updateStart = perfMode ? performance.now() : 0;
    time += dt; update(dt);
    if (perfMode) updateMs = performance.now() - updateStart;
    if (!perfMode && !FLAG.scale) {                 // resolução adaptativa (celular e PC): cai rápido, sobe devagar
      perfAcc += dt; perfN++;
      if (perfN >= 60) {
        const avg = perfAcc / perfN;
        if (avg > 0.026 && curPR > 0.55) { curPR = Math.max(0.55, curPR * 0.85); calmWindows = 0; setRes(); }
        else if (avg < 0.0185 && curPR < prCap) { if (++calmWindows >= 3) { curPR = Math.min(prCap, curPR * 1.1); calmWindows = 0; setRes(); } }
        else calmWindows = 0;
        perfAcc = 0; perfN = 0;
      }
    }
  }
  else if (!started) {                              // câmera girando no menu
    yaw += dt * 0.15; camera.position.set(0, 2.5, 0); camera.rotation.set(-0.08, yaw, 0);
  }
  const renderStart = perfMode ? performance.now() : 0;
  renderer.render(scene, camera);
  if (perfMode) {
    const perfRunning = perfScenarioActive && locked && alive && !portrait && document.visibilityState === 'visible';
    if (!perfRunning) {
      perfWasRunning = false;
      perfCounters.blockedCalls = perfCounters.lineCalls = perfCounters.pathCalls = perfCounters.pathMs = 0;
    } else if (!perfWasRunning) {
      // O primeiro frame após iniciar/retomar cruza uma transição e não entra na distribuição.
      perfWasRunning = true; perfLastUi = now;
      perfCounters.blockedCalls = perfCounters.lineCalls = perfCounters.pathCalls = perfCounters.pathMs = 0;
    } else {
      const renderMs = performance.now() - renderStart;
      let aliveEnemies = 0; for (const enemy of enemies) if (!enemy.dead) aliveEnemies++;
      const workBlocked = perfCounters.blockedCalls, workLine = perfCounters.lineCalls;
      const workPath = perfCounters.pathCalls, workPathMs = perfCounters.pathMs;
      perfSample.frameMs = frameMs; perfSample.updateMs = updateMs; perfSample.renderMs = renderMs;
      perfSample.drawCalls = renderer.info.render.calls; perfSample.triangles = renderer.info.render.triangles;
      perfSample.geometries = renderer.info.memory.geometries; perfSample.textures = renderer.info.memory.textures;
      perfSample.enemies = aliveEnemies; perfSample.projectiles = projectiles.length; perfSample.effects = fx.length;
      perfSample.marks = surfaceMarks.length; perfSample.dust = dustPuffs.length;
      perfSample.blockedCalls = workBlocked; perfSample.lineCalls = workLine;
      perfSample.pathCalls = workPath; perfSample.pathMs = workPathMs; perfSample.pixelRatio = curPR;
      perfSample.quality = appliedQuality === 'low' ? 0 : appliedQuality === 'high' ? 2 : 1;
      perfTelemetry.record(perfSample);
      perfWindow.blockedCalls += workBlocked; perfWindow.lineCalls += workLine;
      perfWindow.pathCalls += workPath; perfWindow.pathMs += workPathMs; perfWindow.durationMs += frameMs;
      perfCounters.blockedCalls = perfCounters.lineCalls = perfCounters.pathCalls = perfCounters.pathMs = 0;
    }
    if (now - perfLastUi >= 500) { refreshPerfPanel(); perfLastUi = now; }
  }
}

/* Pré-aquece shaders, geometrias e texturas antes do combate e no banner após trocar arena. */
function warmScene() {
  const previous = [];
  try {
    scene.traverse(o => {
      if (o.isMesh || o.isPoints || o.isLine || o.isSprite) {
        previous.push([o, o.visible, o.frustumCulled]);
        o.visible = true; o.frustumCulled = false;
      }
    });
    renderer.compile(scene, camera);
    renderer.render(scene, camera);
  } catch (err) {
    console.warn('aquecimento ignorado:', err);
  } finally {
    previous.forEach(([o, visible, frustumCulled]) => { o.visible = visible; o.frustumCulled = frustumCulled; });
  }
}
function prewarmAll() {
  Object.keys(TYPES).forEach(key => {
    if (!(rigPool[key] && rigPool[key].length)) {
      const rig = buildRig(key); scene.add(rig.g); rig.g.userData.warm = rig;
      (rigPool[key] = rigPool[key] || []).push(rig);
    }
  });
  warmScene();
  Object.keys(rigPool).forEach(key => rigPool[key].forEach(rig => {
    if (rig.g.userData.warm) { scene.remove(rig.g); rig.g.userData.warm = null; }
  }));
  warmReady = true;
}
guns[0].visible = true;
updateHUD();
prewarmAll();
showOverlay('menu');
loadPrefs(); applyPrefs();                          // restaura ajustes salvos (modo, dificuldade, controles e qualidade)
applySkin(); if (!perfMode) career.beginDay(); refreshCareerUI(); syncRunSelection();
applyControlMode();                                 // detecta celular (pointer: coarse) e ajusta HUD e ajuda
requestAnimationFrame(loop);

})();
