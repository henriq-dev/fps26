/* =====================================================================
   incursion.js — modo INCURSÃO: prédio em salas, estágios, escolhas e efeitos.
   Tudo aqui é regra pura e dados (sem DOM, sem Three.js), para poder ser testado.
   A "invasão" é 100% fictícia: são escolhas de jogo, não comandos reais.
   ===================================================================== */
(() => {
'use strict';
window.Arena = window.Arena || {};

// P27: torretas de segurança. Ficam 1,6 m à frente das 2 primeiras câmeras (posição já validada fora das paredes).
// Regra pura: dentro do alcance e com linha livre, "carrega" 0,6 s (aviso) e então atira a cada 1,6 s. Câmeras desligadas = torretas desligadas.
Arena.TURRET = { range: 14, charge: 0.6, every: 1.6, damage: 4 };
Arena.turretsFor = (cameras) => (cameras || []).slice(0, 2).map(c => ({ x: c.x + Math.sin(c.dir) * 1.6, z: c.z + Math.cos(c.dir) * 1.6 }));
Arena.turretStep = (t, dt, { active, dist, los }) => {
  t.cd = Math.max(0, (t.cd || 0) - dt);
  if (!active || !los || dist > Arena.TURRET.range) { t.charge = 0; return false; }
  t.charge = (t.charge || 0) + dt;
  if (t.charge >= Arena.TURRET.charge && t.cd <= 0) { t.cd = Arena.TURRET.every; return true; }
  return false;
};

const H = 3.8;                                   // altura das paredes internas (o teto fica nesta altura)
const WALL = 0x7b8895, DESK = 0x3b4558, RACK = 0x2a3142, BUNK = 0x68736c, TANK = 0x4b5560, BED = 0x8a9aa6;

// Ajudantes: parede com portas. Bloco = [x, z, largura, altura, profundidade, cor]
// wallX: parede ao longo de X em z fixo, de x0 a x1, com portas (centros) de largura 4.  wallZ: o mesmo ao longo de Z.
function segments(a, b, doors) {
  const cuts = [...doors].sort((p, q) => p - q), out = []; let from = a;
  for (const c of cuts) { if (c - 2 > from) out.push([from, c - 2]); from = c + 2; }
  if (b > from) out.push([from, b]); return out;
}
const wallX = (list, z, x0, x1, doors = [], color = WALL) => { doors.forEach(c => (list.doors = list.doors || []).push({ x: c, z, axis: 'x' })); segments(x0, x1, doors).forEach(([p, q]) => list.push([(p + q) / 2, z, q - p, H, 1, color])); };
const wallZ = (list, x, z0, z1, doors = [], color = WALL) => { doors.forEach(c => (list.doors = list.doors || []).push({ x, z: c, axis: 'z' })); segments(z0, z1, doors).forEach(([p, q]) => list.push([x, (p + q) / 2, 1, H, q - p, color])); };
const screens = (terms, glows) => Object.values(terms).forEach(t => glows.push([t.x, 1.55, t.z, 1.3, 0.7, 0.06, 0x4de7ff]));
const withDesks = (terms, blocks) => Object.values(terms).forEach(t => blocks.push([t.x, t.z, 1.8, 1, 0.9, DESK]));
const roof = (glows, lines) => lines.forEach(l => glows.push([...l, 0xffb04d]));

/* ---------- Prédio 1: COMPLEXO — corredores em cruz e 4 salas ---------- */
function buildComplex() {
  const blocks = [], glows = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    blocks.push([sx * 3.5, sz * 7, 1, H, 6, WALL], [sx * 3.5, sz * 20.5, 1, H, 13, WALL]);      // parede junto ao corredor vertical (porta de 10 a 14)
    blocks.push([sx * 7, sz * 3.5, 6, H, 1, WALL], [sx * 20.5, sz * 3.5, 13, H, 1, WALL]);      // parede junto ao corredor horizontal
  }
  blocks.push([-14, -20, 5, 1.1, 1.2, DESK], [-20, -13, 1.2, 1.1, 5, DESK], [-10, -10, 2, 1.2, 2, DESK], [-24.5, -17, 1.4, 2.2, 3, RACK]);   // segurança
  blocks.push([14, -22, 1.4, 2.4, 6, RACK], [19, -17, 1.4, 2.4, 6, RACK], [10, -9, 2, 1.2, 2, DESK], [25, -13, 1.4, 2.2, 3, RACK]);            // rede
  blocks.push([9, 20, 1.2, 3, 12, RACK], [13.5, 20, 1.2, 3, 12, RACK], [18, 20, 1.2, 3, 12, RACK], [24, 24, 3, 1.1, 1.2, DESK]);              // datacenter
  blocks.push([-14, 20, 5, 0.9, 2, BUNK], [-20, 14, 2, 0.9, 5, BUNK], [-10, 10, 2, 1.2, 2, DESK], [-23, 24, 4, 0.9, 2, BUNK]);                // alojamento
  blocks.doors = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) blocks.doors.push({ x: sx * 3.5, z: sz * 12, axis: 'z' }, { x: sx * 12, z: sz * 3.5, axis: 'x' });
  const terminals = { t1: { x: -23, z: -23, name: 'CONSOLE KVM', kind: 'kvm', rotation: 0 }, t2: { x: 23, z: -22, name: 'PORTA DE GERENCIAMENTO DE REDE', kind: 'network', rotation: Math.PI }, t3: { x: 23, z: 10, name: 'CONSOLE CENTRAL DO DATACENTER', kind: 'datacenter', rotation: -Math.PI / 2 } };
  withDesks(terminals, blocks);
  [[9, 0x4de7ff], [13.5, 0x9e7bff], [18, 0x4de7ff]].forEach(([x, c]) => glows.push([x + 0.63, 1.7, 20, 0.03, 0.14, 11, c], [x - 0.63, 1.2, 20, 0.03, 0.14, 11, c]));
  roof(glows, [[0, 3.6, -14, 0.3, 0.06, 18], [0, 3.6, 14, 0.3, 0.06, 18], [-14, 3.6, 0, 18, 0.06, 0.3], [14, 3.6, 0, 18, 0.06, 0.3]]);
  return { id: 'complexo', name: 'Complexo', theme: 'COMPLEXO // INCURSÃO', ceiling: H, floorTint: 0x8c9092, strip: 0x4de7ff, sky: 0x1b2630, floorA: '#3b4144', floorB: '#2c3235', wall: 0x5d6b75,
    blocks, glows, terminals, exit: { x: -25, z: 0 }, doors: blocks.doors,
    cameras: [{ x: 0, z: -26.6, dir: 0 }, { x: 26.6, z: 0, dir: -Math.PI / 2 }, { x: 0, z: 26.6, dir: Math.PI }], turrets: Arena.turretsFor([{ x: 0, z: -26.6, dir: 0 }, { x: 26.6, z: 0, dir: -Math.PI / 2 }, { x: 0, z: 26.6, dir: Math.PI }]),
    spawns: [[-8, -8], [-22, -8], [-8, -22], [8, -8], [22, -8], [8, -24], [8, 8], [22, 24], [24, 16], [-8, 8], [-22, 8], [-22, 24], [0, -25], [0, 25], [25, 0]],
    hints: ['Atravesse o prédio até a SALA DE SEGURANÇA (noroeste) e invada o console KVM.', 'Vá à SALA DE REDE (nordeste) e escolha qual sistema de segurança reduzir.', 'Entre no DATACENTER (sudeste) e use o console central. Escolha o objetivo final.', 'Volte pelo corredor oeste até a SAÍDA DE SERVIÇO antes que a resposta chegue.'] };
}

/* ---------- Prédio 2: REFINARIA — núcleo central, anel de corredor e 4 salas externas (inspirada no bloco E) ---------- */
function buildRefinery() {
  const blocks = [], glows = [];
  wallX(blocks, -8, -8, 8, [0]); wallX(blocks, 8, -8, 8, [0]); wallZ(blocks, -8, -8, 8, [0]); wallZ(blocks, 8, -8, 8, [0]);   // núcleo com 4 portas
  [[-5.8, -5.8], [5.8, -5.8], [-5.8, 5.8], [5.8, 5.8]].forEach(([x, z]) => blocks.push([x, z, 2, 3, 2, TANK]));                              // tanques/pilares do núcleo
  wallX(blocks, -14.75, -27, 27, [0]); wallX(blocks, 14.75, -27, 27, [0]);                                                    // salas norte e sul
  wallZ(blocks, -14.75, -14.25, 14.25, [0]); wallZ(blocks, 14.75, -14.25, 14.25, [0]);                                        // salas oeste e leste
  blocks.push([-20, -22, 4, 1.1, 1.4, DESK], [20, -20, 2, 1.2, 2, DESK], [-22, 20, 1.6, 2.4, 8, RACK], [-14, 22, 1.6, 2.4, 6, RACK], [4, 21, 6, 1.4, 2, TANK], [-6, 22, 2.4, 2.4, 2.4, TANK],   // cobertura nas salas norte/sul
    [21, -6, 2, 1.2, 5, DESK], [22, 8, 3, 1, 2, BUNK], [-21, -7, 3, 1.1, 2, DESK], [-23, 8, 2, 1.2, 4, DESK]);                // salas leste/oeste
  const terminals = { t1: { x: -24, z: 0, name: 'CONSOLE DO ESCRITÓRIO', kind: 'kvm', rotation: Math.PI / 2 }, t2: { x: 0, z: -24.5, name: 'CONSOLE DA SALA DE CONTROLE', kind: 'network', rotation: 0 }, t3: { x: 0, z: 24.5, name: 'CONSOLE DO REATOR', kind: 'datacenter', rotation: Math.PI } };
  withDesks(terminals, blocks);
  glows.push([0, 0.1, 0, 5, 0.04, 5, 0xffb04d]);                                                                              // marca luminosa no chão do núcleo
  roof(glows, [[-11.5, 3.6, 0, 0.3, 0.06, 18], [11.5, 3.6, 0, 0.3, 0.06, 18], [0, 3.6, -11.5, 18, 0.06, 0.3], [0, 3.6, 11.5, 18, 0.06, 0.3]]);
  return { id: 'refinaria', name: 'Refinaria', theme: 'REFINARIA // NÚCLEO ÂMBAR', ceiling: H, floorTint: 0x9a9283, strip: 0xffb04d, sky: 0x2a2218, floorA: '#4a4338', floorB: '#352f27', wall: 0x6b6252,
    blocks, glows, terminals, exit: { x: 25, z: 0 }, doors: blocks.doors,
    cameras: [{ x: -13.2, z: -13.2, dir: Math.PI * 0.25 }, { x: 13.2, z: 13.2, dir: -Math.PI * 0.75 }, { x: 13.2, z: -13.2, dir: -Math.PI * 0.25 }], turrets: Arena.turretsFor([{ x: -13.2, z: -13.2, dir: Math.PI * 0.25 }, { x: 13.2, z: 13.2, dir: -Math.PI * 0.75 }, { x: 13.2, z: -13.2, dir: -Math.PI * 0.25 }]),
    spawns: [[0, -11], [0, 11], [-11, 0], [11, 0], [-11, -11], [11, 11], [-22, -8], [-22, 8], [22, -8], [22, 8], [-15, -22], [15, -22], [-15, 22], [15, 22], [0, 24], [0, -24]],
    hints: ['Saia do NÚCLEO pela porta oeste e invada o console do ESCRITÓRIO.', 'Siga o anel até a SALA DE CONTROLE (norte) e escolha qual sistema reduzir.', 'Vá à sala do REATOR (sul) e use o console. Escolha o objetivo final.', 'Cruze o anel até a SAÍDA DE SERVIÇO no leste antes que a resposta chegue.'] };
}

/* ---------- Prédio 3: LABORATÓRIO — salão longo com 3 salas ao norte e 3 ao sul (inspirado no bloco C) ---------- */
function buildLab() {
  const blocks = [], glows = [], doors = [-18, 0, 18];
  wallX(blocks, -5, -27, 27, doors); wallX(blocks, 5, -27, 27, doors);                                                        // paredes do salão (3 portas cada)
  for (const x of [-9, 9]) { wallZ(blocks, x, -27, -5.5); wallZ(blocks, x, 5.5, 27); }                                        // divisórias entre salas
  [[-18, -21, 5, 1.1, 1.4], [-14, -14, 2, 1.1, 5], [0, -22, 6, 0.9, 2], [-2, -14, 2, 1.2, 2], [18, -20, 5, 1, 1.4], [22, -12, 2, 1.1, 4],
   [-18, 21, 2, 0.9, 5], [-23, 14, 2, 1.1, 3], [0, 21, 5, 1.1, 1.4], [-3, 13, 2, 1.2, 2], [18, 13, 2, 0.9, 5], [23, 21, 3, 1.1, 2]].forEach(([x, z, w, h, d]) => blocks.push([x, z, w, h, d, DESK]));
  [[-22, 16, 2, 0.9, 5], [-24, -20, 1.4, 2.2, 4], [24, -22, 1.4, 2.2, 4]].forEach(([x, z, w, h, d]) => blocks.push([x, z, w, h, d, BED]));
  blocks.push([6, 0, 2, 1.1, 2, DESK], [-6, 0, 2, 1.1, 2, DESK]);                                                              // balcões no salão (centro continua livre)
  const terminals = { t1: { x: -22, z: -24, name: 'CONSOLE DO LABORATÓRIO', kind: 'kvm', rotation: 0 }, t2: { x: 22, z: 24, name: 'CONSOLE DA CIRURGIA', kind: 'network', rotation: Math.PI }, t3: { x: -22, z: 24, name: 'CONSOLE DO ARQUIVO CENTRAL', kind: 'datacenter', rotation: -Math.PI / 2 } };
  withDesks(terminals, blocks);
  roof(glows, [[-14, 3.6, 0, 18, 0.06, 0.3], [14, 3.6, 0, 18, 0.06, 0.3], [-18, 3.6, -5.2, 0.5, 0.06, 0.3], [0, 3.6, -5.2, 0.5, 0.06, 0.3], [18, 3.6, 5.2, 0.5, 0.06, 0.3]]);
  [[-18, -26], [0, -26], [18, -26], [-18, 26], [0, 26], [18, 26]].forEach(([x, z]) => glows.push([x, 3.0, z, 2.4, 0.08, 0.08, 0x9ef2ff]));   // luminárias de teto
  return { id: 'laboratorio', name: 'Laboratório', theme: 'LABORATÓRIO // SETOR MÉDICO', ceiling: H, floorTint: 0x9aa7a8, strip: 0x3ddc84, sky: 0x1c2a2a, floorA: '#3d4a4a', floorB: '#2e3a3a', wall: 0x607373,
    blocks, glows, terminals, exit: { x: 26, z: 0 }, doors: blocks.doors,
    cameras: [{ x: -26.6, z: 0, dir: Math.PI / 2 }, { x: 26.6, z: 0, dir: -Math.PI / 2 }, { x: -10, z: -3.9, dir: Math.PI * 0.3 }], turrets: Arena.turretsFor([{ x: -26.6, z: 0, dir: Math.PI / 2 }, { x: 26.6, z: 0, dir: -Math.PI / 2 }, { x: -10, z: -3.9, dir: Math.PI * 0.3 }]),
    spawns: [[-20, 0], [20, 0], [-8, 0], [8, 0], [-18, -15], [0, -14], [18, -15], [-18, 15], [0, 14], [18, 15], [-24, -10], [24, 10], [-24, 22], [24, -22]],
    hints: ['Entre na sala do LABORATÓRIO (noroeste) e invada o console.', 'Cruze o salão até a sala da CIRURGIA (sudeste) e escolha qual sistema reduzir.', 'Volte ao ARQUIVO CENTRAL (sudoeste) e use o console. Escolha o objetivo final.', 'Corra pelo salão até a SAÍDA DE SERVIÇO no leste antes que a resposta chegue.'] };
}


/* ---------- Prédio 4: CAMPUS — cinco blocos (A–E) em fila, ligados por portas; você começa no bloco C ---------- */
function buildCampus() {
  const blocks = [], glows = [];
  wallX(blocks, -16, -28, 28); wallX(blocks, 16, -28, 28);                                      // paredes externas (norte e sul)
  for (const x of [-16.8, -5.6, 5.6, 16.8]) wallZ(blocks, x, -16, 16, [-8, 8]);                 // divisórias entre blocos, 2 portas cada
  [[-23, -6, 5, 0.9, 2, BUNK], [-23, 6, 5, 0.9, 2, BUNK]].forEach(b => blocks.push(b));        // A: alojamento
  [[-11.2, -6, 4, 1.1, 1.2, DESK], [-14, 11, 1.4, 2.2, 3, RACK]].forEach(b => blocks.push(b)); // B: escritório
  [[0, -9, 2, 1.2, 2, DESK], [0, 9, 2, 1.2, 2, DESK]].forEach(b => blocks.push(b));            // C: hall (centro livre)
  [[11.2, -4, 1.2, 3, 7, RACK], [8.8, 4, 1.2, 3, 7, RACK]].forEach(b => blocks.push(b));       // D: sala de racks
  [[20, -4, 1.2, 3, 10, RACK], [24.5, 4, 1.2, 3, 10, RACK]].forEach(b => blocks.push(b));      // E: datacenter
  const terminals = { t1: { x: 11.2, z: -14.5, name: 'CONSOLE DO BLOCO D', kind: 'kvm', rotation: 0 }, t2: { x: -22.4, z: 14.5, name: 'CONSOLE DO BLOCO A', kind: 'network', rotation: Math.PI }, t3: { x: 22.4, z: -14.5, name: 'CONSOLE CENTRAL DO BLOCO E', kind: 'datacenter', rotation: 0 } };
  withDesks(terminals, blocks);
  roof(glows, [[-22.4, 3.6, 0, 0.3, 0.06, 20], [-11.2, 3.6, 0, 0.3, 0.06, 20], [0, 3.6, 0, 0.3, 0.06, 20], [11.2, 3.6, 0, 0.3, 0.06, 20], [22.4, 3.6, 0, 0.3, 0.06, 20]]);
  const cameras = [{ x: -11.2, z: -14.6, dir: 0 }, { x: 11.2, z: 14.6, dir: Math.PI }, { x: 0, z: -14.6, dir: 0 }];
  return { id: 'campus', name: 'Campus', theme: 'CAMPUS // BLOCOS A–E', ceiling: H, floorTint: 0x8f94a3, strip: 0x9e7bff, sky: 0x1d1b30, floorA: '#3a3b4a', floorB: '#2c2d3a', wall: 0x5f6678,
    blocks, glows, terminals, exit: { x: -11.2, z: 0 }, doors: blocks.doors, cameras, turrets: Arena.turretsFor(cameras),
    spawns: [[-22, 0], [-22, -11], [-11, -11], [-11, 10], [0, -12], [0, 12], [11, 10], [11, -11], [22, 11], [22, -12], [-26, 12], [26, 0]],
    hints: ['Parta do BLOCO C (hall) para o BLOCO D (leste) e invada o console.', 'Cruze o campus até o BLOCO A (extremo oeste) e escolha qual sistema reduzir.', 'Atravesse tudo até o BLOCO E (extremo leste) e use o console central. Escolha o objetivo final.', 'Volte ao BLOCO B (oeste, perto do hall): a SAÍDA DE SERVIÇO fica no centro dele.'] };
}

Arena.INCURSION_LEVELS = [buildComplex(), buildRefinery(), buildLab(), buildCampus()];
Arena.INCURSION = Arena.INCURSION_LEVELS[0];          // compatibilidade

// Estágios da missão. spawn = { max: vivos ao mesmo tempo, every: segundos entre reforços, total: -1 = sem fim }
Arena.INCURSION_STAGES = [
  { id: 'infiltrar', title: 'INFILTRAR', hint: 'Atravesse o prédio até a SALA DE SEGURANÇA (noroeste) e invada o console KVM.', terminal: 't1', hold: 4, spawn: { max: 5, every: 2.6, total: 10 } },
  { id: 'seguranca', title: 'REDE DE SEGURANÇA', hint: 'Vá à SALA DE REDE (nordeste) e escolha qual sistema de segurança reduzir.', terminal: 't2', hold: 4, choose: 'security', spawn: { max: 6, every: 2.2, total: 14 } },
  { id: 'datacenter', title: 'DATACENTER', hint: 'Entre no DATACENTER (sudeste) e use o console central. Escolha o objetivo final.', terminal: 't3', hold: 6, choose: 'target', spawn: { max: 8, every: 1.9, total: 18 } },
  { id: 'fuga', title: 'FUGA', hint: 'Volte pelo corredor oeste até a SAÍDA DE SERVIÇO antes que a resposta chegue.', exit: true, spawn: { max: 9, every: 1.6, total: -1 } }
];

// Escolha do estágio 2 (uma só)
Arena.INCURSION_SECURITY = [
  { id: 'cameras', name: 'DESATIVAR CÂMERAS', desc: 'Desliga as câmeras (sem alertas) e reduz os inimigos em 20%.' },
  { id: 'reforcos', name: 'CORTAR REFORÇOS', desc: 'Reforços demoram mais para chegar (+50% no intervalo).' },
  { id: 'drone', name: 'LIBERAR O DRONE', desc: 'Drone de reconhecimento (tecla F) dura mais e recarrega mais rápido.' }
];
// Objetivos do estágio 3 (um ou vários). risco = quanto aumenta a pressão na fuga.
Arena.INCURSION_TARGETS = [
  { id: 'derrubar', name: 'DERRUBAR O SISTEMA', desc: 'Apaga câmeras e controles: −30% de reforços e sem alertas. Silencioso.', risk: 0 },
  { id: 'virus', name: 'INSERIR VÍRUS FICTÍCIO', desc: 'Corrompe os sistemas: inimigos 20% mais lentos. Chama atenção.', risk: 1 },
  { id: 'dados', name: 'ROUBAR DADOS', desc: '+1000 pontos e +400 créditos. Dispara o alarme (75 s).', risk: 2 },
  { id: 'destruir', name: 'DESTRUIR O DATACENTER', desc: '+1500 pontos. Sobrecarga e alarme geral (60 s), mais reforços.', risk: 3 }
];

// Câmeras de segurança: varrem para os lados e "veem" o jogador dentro de um cone (a linha livre é checada no jogo)
Arena.cameraAngle = (cam, t, i) => cam.dir + Math.sin(t * 0.7 + i * 1.7) * 0.6;
Arena.cameraSees = (cam, ang, px, pz, range = 15, halfFov = 0.5) => {
  const dx = px - cam.x, dz = pz - cam.z, d = Math.hypot(dx, dz);
  if (d < 0.01 || d > range) return false;
  return (dx * Math.sin(ang) + dz * Math.cos(ang)) / d > Math.cos(halfFov);
};
Arena.camerasOff = (security, targets) => security === 'cameras' || (Array.isArray(targets) && targets.includes('derrubar'));
// A barra de invasão só sobe com o console visível, E segurado e SEM bloqueio (depois de dano, só volta a subir ao soltar e apertar E de novo)
Arena.holdAllowed = ({ inRange, held, lockout }) => !!inRange && !!held && !lockout;

// Soma os efeitos das escolhas (função pura: mesmas escolhas = mesmo resultado)
Arena.incursionEffects = (security, targets) => {
  const fx = { spawnMul: 1, intervalMul: 1, speedMul: 1, droneTime: 10, droneCooldown: 24, alarmSeconds: 0, credits: 0, score: 0, risk: 0 };
  if (security === 'cameras') fx.spawnMul *= 0.8;
  else if (security === 'reforcos') fx.intervalMul *= 1.5;
  else if (security === 'drone') { fx.droneTime = 16; fx.droneCooldown = 14; }
  const list = Array.isArray(targets) ? [...new Set(targets)] : [];
  for (const id of list) {
    if (id === 'derrubar') fx.spawnMul *= 0.7;
    else if (id === 'virus') { fx.speedMul *= 0.8; fx.risk += 1; }
    else if (id === 'dados') { fx.credits += 400; fx.score += 1000; fx.alarmSeconds = Math.max(fx.alarmSeconds, 75); fx.risk += 2; }
    else if (id === 'destruir') { fx.score += 1500; fx.alarmSeconds = Math.max(fx.alarmSeconds, 60); fx.spawnMul *= 1.4; fx.risk += 3; }
  }
  if (list.length > 1) fx.score += 500 * (list.length - 1);         // combinar objetivos rende bônus (e mais risco)
  return fx;
};

// Quantos inimigos o estágio ainda pode soltar (-1 = sem limite), já com o efeito aplicado
Arena.incursionBudget = (stage, fx) => stage.spawn.total < 0 ? -1 : Math.max(2, Math.round(stage.spawn.total * fx.spawnMul));
Arena.incursionInterval = (stage, fx, overrun) => stage.spawn.every * fx.intervalMul * (overrun ? 0.5 : 1);

// Escolhe um ponto de nascimento longe do jogador. blockedFn(x, z) diz se o ponto está dentro de parede.
Arena.pickIncursionSpawn = (px, pz, blockedFn, rnd = Math.random, spawns = Arena.INCURSION.spawns) => {
  const SPAWNS = spawns;
  const ok = SPAWNS.filter(([x, z]) => Math.hypot(x - px, z - pz) > 13 && !blockedFn(x, z));
  const pool = ok.length ? ok : SPAWNS.filter(([x, z]) => !blockedFn(x, z));
  return pool.length ? pool[Math.floor(rnd() * pool.length)] : [0, -25];
};

// Converte coordenadas normalizadas da câmera (NDC, -1..1) em pixels. Retorna null se estiver atrás da câmera.
// edge = true quando está fora da tela (o marcador então é preso à borda, como no radar).
Arena.droneScreenPos = (ndcX, ndcY, ndcZ, w, h, margin = 28) => {
  if (ndcZ > 1) return null;
  const x = (ndcX * 0.5 + 0.5) * w, y = (-ndcY * 0.5 + 0.5) * h;
  const cx = Math.min(w - margin, Math.max(margin, x)), cy = Math.min(h - margin, Math.max(margin, y));
  return { x: cx, y: cy, edge: cx !== x || cy !== y };
};

// P26: porta fechada barra projétil e linha de tiro dos inimigos (só na Incursão). Porta: { x, z, axis, open } ; fechada = open < 0.5
// Largura 4 m ao longo do eixo da parede, espessura 0.6 m. Aberta, a passagem é livre (o jogador e a IA andam normalmente).
Arena.doorBlocks = (d, x, z) => d.open < 0.5 && (d.axis === 'x' ? Math.abs(x - d.x) <= 2 && Math.abs(z - d.z) <= 0.3 : Math.abs(z - d.z) <= 2 && Math.abs(x - d.x) <= 0.3);
Arena.pointBlockedByDoors = (doors, x, z) => { for (const d of doors) if (Arena.doorBlocks(d, x, z)) return true; return false; };
Arena.segmentBlockedByDoors = (doors, ax, az, bx, bz) => {          // amostra o segmento a cada ~0.25 m (passo menor que a espessura da porta)
  if (!doors.length) return false;
  const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.25));
  for (let k = 0; k <= n; k++) if (Arena.pointBlockedByDoors(doors, ax + (bx - ax) * k / n, az + (bz - az) * k / n)) return true;
  return false;
};

})();
