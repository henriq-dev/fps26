const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {}, Math, Uint8Array, Float32Array, Int32Array, Date };
context.Arena = context.window.Arena = {};
context.window.window = context.window;
vm.createContext(context);
for (const file of ['industrial-materials.js', 'perf-telemetry.js', 'weapons.js', 'enemies.js', 'upgrades.js', 'maps.js', 'incursion.js', 'terminal-props.js', 'pathfinding.js', 'tactics.js', 'progression.js', 'audio.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}
const A = context.Arena;

const perfProbe = A.createPerfTelemetry(4);
perfProbe.record({ frameMs: 16, updateMs: 3, renderMs: 2, drawCalls: 40 });
perfProbe.record({ frameMs: 20, updateMs: 5, renderMs: 4, drawCalls: 42 });
perfProbe.record({ frameMs: 50, updateMs: 8, renderMs: 9, drawCalls: 48 });
perfProbe.record({ frameMs: 100, updateMs: 10, renderMs: 12, drawCalls: 50 });
perfProbe.record({ frameMs: 30, updateMs: 4, renderMs: 5, drawCalls: 44 });
assert.equal(perfProbe.summary().samples, 4);
assert.equal(perfProbe.summary().frame.p50, 30);
assert.equal(perfProbe.summary().frame.p95, 100);
assert.equal(perfProbe.latest().drawCalls, 44);
assert.match(perfProbe.toCSV(), /sample,frameMs,updateMs,renderMs/);
assert.match(perfProbe.toCSV(), /4,30,4,5,44/);
perfProbe.reset();
assert.equal(perfProbe.summary().samples, 0);

assert.equal(A.WEAPONS.length, 8);
assert.equal(A.WEAPONS[6].pierce, true);
assert.equal(new Set(A.WEAPONS.map(w => w.role)).size, 8);
assert.ok(A.WEAPONS.every(w => Number.isInteger(w.color)));
assert.equal(A.WEAPONS[3].knockback, 2.2);
const combatFields = ['name','role','unlock','auto','dmg','pellets','rate','mag','reserve','reload','spread','range','falloff','recoil','zoom','pierce','knockback','launcher','radius','shell','shellTime'];
const combatSnapshot = JSON.parse(JSON.stringify(A.WEAPONS.map(w => Object.fromEntries(combatFields.map(key => [key, w[key] ?? null])))));
assert.deepEqual(combatSnapshot, [
  {name:'Pistola',role:'PRECISÃO',unlock:null,auto:false,dmg:28,pellets:1,rate:.28,mag:12,reserve:72,reload:1.1,spread:.004,range:80,falloff:.1,recoil:.06,zoom:1.3,pierce:null,knockback:null,launcher:null,radius:null,shell:null,shellTime:null},
  {name:'Fuzil',role:'VERSÁTIL',unlock:null,auto:true,dmg:24,pellets:1,rate:.1,mag:30,reserve:150,reload:1.7,spread:.012,range:100,falloff:.15,recoil:.05,zoom:1.5,pierce:null,knockback:null,launcher:null,radius:null,shell:null,shellTime:null},
  {name:'Metralhadora',role:'SUPRESSÃO',unlock:null,auto:true,dmg:13,pellets:1,rate:.055,mag:50,reserve:200,reload:1.5,spread:.04,range:60,falloff:.5,recoil:.03,zoom:1.25,pierce:null,knockback:.15,launcher:null,radius:null,shell:null,shellTime:null},
  {name:'Espingarda',role:'IMPACTO',unlock:null,auto:false,dmg:14,pellets:9,rate:.85,mag:6,reserve:36,reload:2.3,spread:.075,range:35,falloff:.85,recoil:.18,zoom:1.2,pierce:null,knockback:2.2,launcher:null,radius:null,shell:true,shellTime:.42},
  {name:'Sniper',role:'EXECUÇÃO',unlock:null,auto:false,dmg:140,pellets:1,rate:1.3,mag:5,reserve:25,reload:2.4,spread:.05,range:200,falloff:0,recoil:.22,zoom:4,pierce:null,knockback:null,launcher:null,radius:null,shell:null,shellTime:null},
  {name:'Magnum',role:'ALTO DANO',unlock:2,auto:false,dmg:75,pellets:1,rate:.6,mag:6,reserve:36,reload:1.9,spread:.005,range:90,falloff:.1,recoil:.2,zoom:1.4,pierce:null,knockback:null,launcher:null,radius:null,shell:null,shellTime:null},
  {name:'Railgun',role:'PERFURAÇÃO',unlock:4,auto:false,dmg:90,pellets:1,rate:1.1,mag:4,reserve:20,reload:2.2,spread:.002,range:200,falloff:0,recoil:.12,zoom:2,pierce:true,knockback:null,launcher:null,radius:null,shell:null,shellTime:null},
  {name:'Lança-granadas',role:'ÁREA',unlock:6,auto:false,dmg:130,pellets:1,rate:1,mag:4,reserve:16,reload:2.6,spread:0,range:60,falloff:0,recoil:.25,zoom:null,pierce:null,knockback:null,launcher:true,radius:4.5,shell:null,shellTime:null}
]);
const gameSource = fs.readFileSync('script.js', 'utf8');
const materialsSource = fs.readFileSync('industrial-materials.js', 'utf8');
const reloadStart = gameSource.slice(gameSource.indexOf('function startReload()'), gameSource.indexOf('\nfunction loadShell()'));
assert.match(reloadStart, /viewKick\s*=\s*0\s*;\s*viewPitch\s*=\s*0\s*;\s*viewRoll\s*=\s*0\s*;/);
assert.match(reloadStart, /shotPulseT\s*=\s*0/);
assert.match(reloadStart, /part\.mesh\.material\.emissiveIntensity\s*=\s*part\.emissive/);
assert.match(reloadStart, /part\.mesh\.scale\.copy\(part\.scale\)/);
assert.ok(A.WEAPONS.every(w => w.visual && typeof w.visual.flash === 'string'));
assert.equal(new Set(A.WEAPONS.map(w => w.visual.flash)).size, 8);
assert.equal(new Set(A.WEAPONS.map(w => w.visual.finish)).size, 8);
assert.equal(new Set(A.WEAPONS.map(w => w.visual.hands)).size, 8);
assert.ok(A.WEAPONS.every(w => Number.isInteger(w.visual.smoke) && w.visual.smoke >= 1 && w.visual.smoke <= 3));
assert.ok(A.WEAPONS.every(w => {
  const p = w.visual.shot;
  return p && p.impulse > 0 && p.impulse <= 0.1 && p.pitch > 0 && p.pitch <= 0.16 && p.roll >= 0 && p.roll <= 0.04 && p.recovery >= 5 && p.recovery <= 30;
}));
assert.ok(A.WEAPONS[3].visual.shot.impulse > A.WEAPONS[1].visual.shot.impulse);
assert.ok(A.WEAPONS[6].visual.shot.coilPulse > 0);
assert.equal(A.WEAPONS.filter(w => w.visual.shot.coilPulse).length, 1);
assert.deepEqual(JSON.parse(JSON.stringify(A.WEAPONS.map(w => w.visual.reload))), ['slide','bolt','feed-cover','pump','bolt-action','cylinder','coils','drum']);
assert.ok(A.WEAPONS.filter(w => w.visual.casing).length >= 6);
assert.equal(A.WEAPONS[6].visual.casing, null);
assert.equal(A.pickType(1, () => 0), 'grunt');
assert.equal(A.pickType(8, () => 0.999), 'healer');
assert.equal(A.bossPhase(0.8), 1);
assert.equal(A.bossPhase(0.5), 2);
assert.equal(A.bossPhase(0.2), 3);
assert.equal(A.mapForWave(1), 0);
assert.equal(A.mapForWave(6), 1);
assert.equal(A.mapForWave(11), 2);
assert.equal(A.mapForWave(16), 0);
assert.equal(typeof A.createIndustrialMaterialLibrary, 'function');
assert.deepEqual(JSON.parse(JSON.stringify(A.MAPS.map(m => m.theme))), ['HANGAR // SETOR DE CARGA', 'DOCA // CHUVA ÂMBAR', 'PLANTA // NÚCLEO CIANO']);
assert.deepEqual(JSON.parse(JSON.stringify(A.MAPS.map(m => m.look ?? null))), ['industrial', null, null]);
assert.ok(A.MAPS[0].blocks.every(block => block[5] !== 0x6b4a2b));
assert.match(gameSource, /const pbrColor = new THREE\.Color\(color\)\.multiplyScalar\(1\.16\)\.getHex\(\);/);
assert.match(gameSource, /const material = pbrMaterials\.material\(kind, pbrColor, \{ detailMaps: false \}\)/);
assert.match(gameSource, /pbrMaterials\.material\('floor', color, \{ detailMaps: false \}\)/);
assert.match(gameSource, /const stripeMat = pbrMaterials\.material\('paintedMetal',[^\n]*detailMaps: false/);
assert.match(gameSource, /const panelMat = pbrMaterials\.material\('paintedMetal',[^\n]*detailMaps: false/);
assert.match(gameSource, /const railMat = pbrMaterials\.material\('steel',[^\n]*detailMaps: false/);
assert.match(materialsSource, /detailMaps: options\.detailMaps !== false/);
assert.match(materialsSource, /function surfaceCanvases\(type, size, detailMaps = true\)/);
assert.match(materialsSource, /const height = detailMaps \? document\.createElement\('canvas'\) : null/);
assert.match(materialsSource, /const roughness = detailMaps \? document\.createElement\('canvas'\) : null/);
assert.match(materialsSource, /bumpMap: detailMaps \? makeTexture\(canvases\.height, repeat\) : null/);
assert.match(materialsSource, /roughnessMap: detailMaps \? makeTexture\(canvases\.roughness, repeat\) : null/);
assert.match(gameSource, /const skyTextureCache = new Map\(\)/);
assert.match(gameSource, /if \(skyTextureCache\.has\(hex\)\) return skyTextureCache\.get\(hex\)/);
assert.doesNotMatch(gameSource, /scene\.background\.dispose\(\)/);
assert.match(gameSource, /const explosionLight = new THREE\.PointLight\([^\n]*explosionLight\.visible = true/);
const explosionLogic = gameSource.slice(gameSource.indexOf('function pulseExplosionLight'), gameSource.indexOf('// Marcas de impacto'));
assert.doesNotMatch(explosionLogic, /explosionLight\.visible\s*=/);
assert.match(gameSource, /const antennaGeo = new THREE\.CylinderGeometry\(/);
assert.match(gameSource, /const rigBasic = color => rigBasicMats\[color\]/);
assert.match(gameSource, /const badge = new THREE\.Mesh\(eGeo\.badge, rigBasic\(/);
assert.match(gameSource, /const beacon = new THREE\.Mesh\(eGeo\.badge, rigBasic\(/);
assert.match(gameSource, /function warmScene\(\)/);
assert.match(gameSource, /renderer\.compile\(scene, camera\)/);
assert.match(gameSource, /if \(warmReady\) warmScene\(\)/);
assert.match(gameSource, /function prewarmAll\(\)/);
assert.match(gameSource, /prewarmAll\(\);/);
assert.match(gameSource, /floor\.material = floorMaterial\(floorTint\)/);
assert.match(gameSource, /cachedIndustrialDressing = group/);
assert.match(gameSource, /perfScenarioActive && locked && alive && !portrait && document\.visibilityState === 'visible'/);
assert.match(gameSource, /O primeiro frame após iniciar\/retomar cruza uma transição/);
assert.deepEqual(JSON.parse(JSON.stringify(A.MAPS[0].blocks.map(([x,z,w,h,d]) => [x,z,w,h,d]))), [
  [-8,-6,3,2,3],[9,-9,2,2,2],[-14,10,4,1.5,2],[12,8,3,3,3],[-4,14,2,2,2],
  [17,-2,2,2.5,5],[0,-16,6,1.5,1.5],[-19,-14,2,3,2],[6.5,4,1.6,4,1.6],[-10,2,1.6,4,1.6]
]);
assert.deepEqual(JSON.parse(JSON.stringify(A.MAPS[1].blocks.map(([x,z,w,h,d]) => [x,z,w,h,d]))), [
  [-11,-9,14,2.5,1.2],[11,9,14,2.5,1.2],[-18,17,2,4,2],[18,-17,2,4,2],[-18,-17,2,4,2],
  [18,17,2,4,2],[0,-20,5,2,3],[0,20,5,2,3],[-21,0,1.5,1.5,6],[21,0,1.5,1.5,6]
]);
assert.deepEqual(JSON.parse(JSON.stringify(A.MAPS[2].blocks.map(([x,z,w,h,d]) => [x,z,w,h,d]))), [
  [-13,-9,1.2,3,26],[13,9,1.2,3,26],[0,-21,16,3,1.2],[0,21,16,3,1.2],[-21,13,8,3,1.2],
  [21,-13,8,3,1.2],[-6,-7,2,4,2],[6,7,2,4,2],[-20,-4,3,2,3],[20,4,3,2,3]
]);
assert.equal(A.waveProfile(1).id, 'swarm');
assert.equal(A.waveProfile(2).id, 'crossfire');
assert.equal(A.waveProfile(5).id, 'boss');
assert.equal(A.waveCount(1), 9);
assert.equal(A.waveCount(5), 17);
assert.equal(A.pickType(2, () => 0.999), 'runner');
assert.equal(A.TYPES.runner.flanker, true);
assert.equal(A.TYPES.ranged.strafe, true);
const perks = A.rollPerks({}, 3, () => 0);
assert.equal(perks.length, 3);
assert.equal(new Set(perks.map(p => p.id)).size, 3);
assert.ok(A.perkStats({ dmg: 2, hp: 1 }).dmg > 1);
const right = A.audioSpatial(4, 0, 0, 0, 0);
const left = A.audioSpatial(-4, 0, 0, 0, 0);
assert.ok(right.pan > 0.9 && left.pan < -0.9);
assert.ok(right.gain < 1 && right.gain > 0.2);
const audioProbe = A.createAudio(() => 0.5);
assert.equal(typeof audioProbe.sfx.casing, 'function');
assert.doesNotThrow(() => audioProbe.sfx.casing(1, 2, 0.7));

const boxes = [{ minX: -1, maxX: 1, minZ: -1, maxZ: 1 }];
const grid = A.createGrid(4, 1, boxes, 0.4);
assert.equal(A.cellBlockedAt(grid, 0, 0), true);
assert.equal(A.cellBlockedAt(grid, 3, 3), false);
const route = A.findPath(grid, -3, -3, 3, 3);
assert.ok(route && route.length >= 2);
assert.ok(route.every(([x, z]) => !A.cellBlockedAt(grid, x, z)));

// Tactical AI: alternate objectives, difficulty presets, team flanks and staggered fire.
assert.equal(A.objectiveForWave('survival', 2), null);
assert.equal(A.objectiveForWave('operations', 1), null);
assert.equal(A.objectiveForWave('operations', 2).id, 'hack');
assert.equal(A.objectiveForWave('operations', 4).id, 'relay');
assert.equal(A.objectiveForWave('operations', 6).id, 'hold');
assert.equal(A.difficultyConfig('cadet').damage, 0.78);
assert.equal(A.difficultyConfig('normal').hp, 1);
assert.ok(A.difficultyConfig('nightmare').count > 1);
assert.equal(A.recordKey('survival', 'normal'), 'arenaFpsRecord:v2:survival:normal');
const squad = A.squadAssignments([{ id: 4 }, { id: 1 }, { id: 2 }, { id: 3 }]);
assert.deepEqual(JSON.parse(JSON.stringify(squad.map(x => x.id))), [1, 2, 3, 4]);
assert.deepEqual(JSON.parse(JSON.stringify(squad.map(x => x.side))), [-1, 1, -1, 1]);
assert.ok(squad[0].fireDelay < squad[1].fireDelay);
const flankLeft = A.flankPoint(0, 0, 0, 8, -1);
const flankRight = A.flankPoint(0, 0, 0, 8, 1);
assert.notEqual(flankLeft[0], flankRight[0]);
const oneBox = [{ minX: -1, maxX: 1, minZ: -1, maxZ: 1, h: 2 }];
const isBlocked = (x, z, r) => oneBox.some(b => x + r > b.minX && x - r < b.maxX && z + r > b.minZ && z - r < b.maxZ);
const lineClear = (ax, az, bx, bz) => {
  for (let i = 1; i < 40; i++) { const t = i / 40; if (isBlocked(ax + (bx - ax) * t, az + (bz - az) * t, 0)) return false; }
  return true;
};
const coverOptions = A.coverCandidates(oneBox, { x: 0, z: 6 }, { x: 0, z: -6 }, isBlocked, lineClear);
assert.ok(coverOptions.length > 0);
assert.ok(coverOptions.every(p => !lineClear(p.x, p.z, 0, -6)));
assert.ok(A.chooseCoverPoint(coverOptions));

// Offline career: achievements, challenges, cosmetics, persistence and independent records.
const memory = new Map();
const storage = { getItem: key => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) };
const career = A.createCareerStore(storage);
career.beginDay('2026-11-16');
for (let i = 0; i < 20; i++) career.event('kill');
career.event('wave', { wave: 5 });
career.event('objective'); career.event('objective'); career.event('objective');
career.event('kill', { boss: true });
career.event('combo', { combo: 5 });
const runA = career.finishRun({ score: 1200, wave: 5, kills: 21, mode: 'survival', difficulty: 'normal' });
const runB = career.finishRun({ score: 900, wave: 3, kills: 15, mode: 'operations', difficulty: 'nightmare' });
assert.equal(runA.best, 1200);
assert.equal(runB.best, 900);
assert.notEqual(A.recordKey('survival', 'normal'), A.recordKey('operations', 'nightmare'));
const profile = career.get();
assert.equal(profile.totals.kills, 21);
assert.equal(profile.totals.objectives, 3);
assert.ok(profile.achievements.includes('veteran'));
assert.ok(profile.achievements.includes('bossbreaker'));
assert.ok(profile.achievements.includes('operator'));
assert.ok(profile.achievements.includes('chain'));
assert.ok(profile.achievements.includes('daily'));
assert.ok(profile.unlockedSkins.includes('violet') && profile.unlockedSkins.includes('gold') && profile.unlockedSkins.includes('mint') && profile.unlockedSkins.includes('aurora'));
assert.equal(career.selectSkin('gold'), true);
assert.equal(A.createCareerStore(storage).get().selectedSkin, 'gold');
assert.equal(A.createCareerStore(storage).get().records['arenaFpsRecord:v2:operations:nightmare'], 900);

console.log('core tests: OK');

// ---- Incursão (p20) ----
assert.equal(A.INCURSION_STAGES.length, 4);
assert.equal(A.INCURSION.terminals.t3.x, 23);
assert.equal(A.INCURSION_LEVELS.length, 4);
assert.deepEqual(JSON.parse(JSON.stringify(Object.values(A.INCURSION.terminals).map(t => t.kind))), ['kvm', 'network', 'datacenter']);
assert.ok(Object.values(A.INCURSION.terminals).every(t => Number.isFinite(t.rotation)));
assert.match(fs.readFileSync('index.html', 'utf8'), /terminal-props\.js/);
assert.match(fs.readFileSync('sw.js', 'utf8'), /terminal-props\.js/);
assert.match(fs.readFileSync('index.html', 'utf8'), /incLevelSelect/);
assert.match(fs.readFileSync('index.html', 'utf8'), /NEXUS/);
assert.match(fs.readFileSync('index.html', 'utf8'), /nexus-network/);
assert.match(fs.readFileSync('style.css', 'utf8'), /prefers-reduced-motion/);
assert.match(fs.readFileSync('script.js', 'utf8'), /NEXUS \/ ROUTE GRAPH/);
const solidAt = (x, z, r = 0.6) => A.INCURSION.blocks.some(([bx, bz, w, h, d]) => x + r > bx - w / 2 && x - r < bx + w / 2 && z + r > bz - d / 2 && z - r < bz + d / 2);
assert.ok(!solidAt(0, 0, 4), 'centro (raio 4) livre');
for (const t of Object.values(A.INCURSION.terminals)) { const near = A.INCURSION.blocks.filter(([bx, bz, w, h, d]) => Math.abs(bx - t.x) < w / 2 + 0.01 && Math.abs(bz - t.z) < d / 2 + 0.01); assert.equal(near.length, 1, 'terminal tem só a própria mesa'); }
assert.ok(!solidAt(A.INCURSION.exit.x, A.INCURSION.exit.z, 0.6), 'saída livre');
const g = A.createGrid(28, 1, A.INCURSION.blocks.map(([x, z, w, h, d]) => ({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, h })), 0.62);
for (const [name, to] of [['t1', A.INCURSION.terminals.t1], ['t2', A.INCURSION.terminals.t2], ['t3', A.INCURSION.terminals.t3], ['saída', A.INCURSION.exit]]) {
  const path = A.findPath(g, 0, 0, to.x, to.z); assert.ok(path && path.length > 0, 'existe caminho até ' + name);
}
for (const [x, z] of A.INCURSION.terminals.t3 ? [[A.INCURSION.terminals.t3.x, A.INCURSION.terminals.t3.z]] : []) assert.ok(x && z);
const none = A.incursionEffects(null, []); assert.equal(none.spawnMul, 1); assert.equal(none.alarmSeconds, 0);
const all = A.incursionEffects('cameras', ['dados', 'destruir', 'virus', 'derrubar']);
assert.equal(all.alarmSeconds, 75); assert.equal(all.risk, 6); assert.equal(all.score, 1000 + 1500 + 1500);
assert.equal(A.incursionEffects('drone', []).droneTime, 16);
assert.equal(A.incursionEffects(null, ['dados', 'dados']).credits, 400, 'objetivo repetido conta uma vez');
for (const level of A.INCURSION_LEVELS) {
  const blocks = level.blocks.map(([x, z, w, h, d]) => ({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, h }));
  const grid = A.createGrid(28, 1, blocks, 0.62);
  assert.ok(!blocks.some(b => b.minX < 4 && b.maxX > -4 && b.minZ < 4 && b.maxZ > -4), 'centro livre em ' + level.id);
  for (const [name, to] of [['t1', level.terminals.t1], ['t2', level.terminals.t2], ['t3', level.terminals.t3], ['saída', level.exit]]) {
    const path = A.findPath(grid, 0, 0, to.x, to.z); assert.ok(path && path.length > 0, `${level.id}: caminho até ${name}`);
  }
  const freeSpawns = level.spawns.filter(([x, z]) => !blocks.some(b => x > b.minX - .6 && x < b.maxX + .6 && z > b.minZ - .6 && z < b.maxZ + .6));
  assert.ok(freeSpawns.length >= 8, `${level.id}: spawns livres suficientes`);
}
assert.equal(A.incursionBudget(A.INCURSION_STAGES[3], none), -1);
assert.ok(A.incursionBudget(A.INCURSION_STAGES[0], A.incursionEffects('cameras', ['derrubar'])) < 10);
assert.equal(A.incursionInterval(A.INCURSION_STAGES[0], none, true), A.INCURSION_STAGES[0].spawn.every * 0.5);
const sp = A.pickIncursionSpawn(0, 0, (x, z) => solidAt(x, z, 0.6), () => 0.5); assert.ok(Math.hypot(sp[0], sp[1]) > 13);
console.log('incursão: OK');

// ---- p24: portas, câmeras, bloqueio por dano e consoles ----
for (const L of A.INCURSION_LEVELS) {
  assert.ok(L.doors.length >= 4, L.id + ': tem portas');
  assert.equal(L.cameras.length, 3, L.id + ': 3 câmeras');
  const solid = (x, z) => L.blocks.some(([bx, bz, w, h, d]) => Math.abs(x - bx) < w / 2 + 0.3 && Math.abs(z - bz) < d / 2 + 0.3);
  for (const c of L.cameras) assert.ok(Math.abs(c.x) <= 27 && Math.abs(c.z) <= 27 && !solid(c.x, c.z), L.id + ': câmera fora de blocos');
  for (const d of L.doors) assert.ok(!L.blocks.some(([bx, bz, w, h, dd]) => Math.abs(d.x - bx) < w / 2 && Math.abs(d.z - bz) < dd / 2), L.id + ': porta no vão');
}
const cam = { x: 0, z: 0, dir: 0 };
assert.ok(A.cameraSees(cam, 0, 0, 10) && !A.cameraSees(cam, 0, 10, 0) && !A.cameraSees(cam, 0, 0, 20) && !A.cameraSees(cam, 0, 0, -5));
assert.ok(A.camerasOff('cameras', []) && A.camerasOff(null, ['derrubar']) && !A.camerasOff('drone', ['dados']));
assert.ok(A.holdAllowed({ inRange: true, held: true, lockout: false }));
assert.ok(!A.holdAllowed({ inRange: true, held: true, lockout: true }), 'com bloqueio (depois de dano) a barra não sobe');
assert.ok(!A.holdAllowed({ inRange: false, held: true, lockout: false }) && !A.holdAllowed({ inRange: true, held: false, lockout: false }));
{ // consoles: materiais próprios por terminal e poucas malhas (precisa do THREE)
  const vm2 = require('vm'), calls = [], c2d = new Proxy({}, { get: (t, k) => k in t ? t[k] : (...a) => { calls.push(k); }, set: (t, k, v) => { t[k] = v; return true; } }), ctx = { console, document: { createElement: () => ({ width: 0, height: 0, getContext: () => c2d }) } }; ctx.window = ctx; ctx.self = ctx; vm2.createContext(ctx);
  vm2.runInContext(fs.readFileSync('three.min.js', 'utf8'), ctx); vm2.runInContext(fs.readFileSync('terminal-props.js', 'utf8'), ctx);
  const T = ctx.Arena, views = ['kvm', 'network', 'datacenter'].map((kind, i) => T.createIncursionTerminal({ x: i * 5, z: 0, kind, name: kind }));
  views.forEach(v => { let n = 0; v.traverse(o => { if (o.isMesh) n++; }); assert.ok(n <= 24, 'console com poucas malhas (' + n + ')'); });
  T.updateIncursionTerminal(views[0], 'intrusion', 1); T.updateIncursionTerminal(views[1], 'locked', 1); T.updateIncursionTerminal(views[2], 'committed', 1);
  const col = v => v.userData.screenMats[0].color.getHexString();
  assert.notEqual(col(views[0]), col(views[1])); assert.notEqual(col(views[1]), col(views[2])); assert.notEqual(col(views[0]), col(views[2]));
  assert.notStrictEqual(views[0].userData.screenMats[0], views[1].userData.screenMats[0], 'telas não compartilham material');
  assert.equal(col(views[1]), 'ff3b5f', 'bloqueado = vermelho'); assert.equal(col(views[2]), '3ddc84', 'concluído = verde');

  // p25: tela física com textura própria, UV nas malhas fundidas e repintura limitada
  {
  const T2 = ctx.Arena, v = T2.createIncursionTerminal({ x: 0, z: 0, kind: 'kvm', name: 'kvm' }), n0 = calls.length;
  assert.ok(v.userData.tex && v.userData.screenMats.every(m => m.map === v.userData.tex), 'telas usam a textura do terminal');
  v.traverse(o => { if (o.isMesh) assert.ok(o.geometry.attributes.uv, 'malha fundida mantém UV'); });
  T2.paintIncursionScreen(v, 'intrusion', 1, true); const n1 = calls.length; T2.paintIncursionScreen(v, 'intrusion', 1.05); assert.equal(calls.length, n1, 'dentro de 0,16 s não repinta');
  T2.paintIncursionScreen(v, 'intrusion', 1.4); assert.ok(calls.length > n1, 'depois do intervalo repinta'); assert.ok(n1 > n0);
  }
}
console.log('p24: portas, câmeras, bloqueio e consoles OK');

// ---- p25: marcadores 3D do drone ----
{
  const c = A.droneScreenPos(0, 0, 0.5, 1000, 600);
  assert.ok(c && c.x === 500 && c.y === 300 && !c.edge, 'centro da tela');
  const f = A.droneScreenPos(3, 0, 0.5, 1000, 600);
  assert.ok(f && f.edge && f.x === 972, 'fora da tela fica preso à borda');
  assert.equal(A.droneScreenPos(0, 0, 1.2, 1000, 600), null, 'atrás da câmera não aparece');
}
console.log('p25: marcadores do drone OK');

// ---- p26: porta fechada barra tiro ----
{
  const D = [{ x: 0, z: 10, axis: 'x', open: 0 }, { x: 10, z: 0, axis: 'z', open: 1 }];
  assert.ok(A.doorBlocks(D[0], 1, 10.2), 'dentro da porta fechada');
  assert.ok(!A.doorBlocks(D[0], 3, 10), 'fora da largura');
  assert.ok(!A.doorBlocks(D[1], 10, 0), 'porta aberta não bloqueia');
  assert.ok(A.segmentBlockedByDoors(D, 0, 0, 0, 20), 'segmento atravessa a porta fechada');
  assert.ok(!A.segmentBlockedByDoors(D, 5, 0, 5, 20), 'segmento ao lado passa');
  assert.ok(!A.segmentBlockedByDoors([], 0, 0, 0, 20), 'sem portas, livre');
}
console.log('p26: portas barram tiro OK');

// ---- p27: torretas ----
{
  const inBlock = (x, z, list) => list.some(([bx, bz, w, , d]) => Math.abs(x - bx) < w / 2 + 0.4 && Math.abs(z - bz) < d / 2 + 0.4);
  A.INCURSION_LEVELS.forEach((L, n) => {
    assert.equal(L.turrets.length, 2, `nível ${n}: 2 torretas`);
    L.turrets.forEach(t => { assert.ok(!inBlock(t.x, t.z, L.blocks), `nível ${n}: torreta fora das paredes (${t.x.toFixed(1)}, ${t.z.toFixed(1)})`); assert.ok(Math.abs(t.x) < 29 && Math.abs(t.z) < 29, 'dentro do mapa'); });
  });
  const t = { cd: 0, charge: 0 };
  assert.equal(A.turretStep(t, 0.3, { active: true, dist: 8, los: true }), false, 'ainda carregando');
  assert.equal(A.turretStep(t, 0.4, { active: true, dist: 8, los: true }), true, 'dispara após 0,6 s');
  assert.equal(A.turretStep(t, 0.4, { active: true, dist: 8, los: true }), false, 'recarga 1,6 s');
  assert.equal(A.turretStep(t, 0.1, { active: false, dist: 8, los: true }), false, 'desligada não atira');
  assert.equal(t.charge, 0, 'perder o alvo zera a carga');
  assert.equal(A.turretStep({ cd: 0, charge: 5 }, 0.1, { active: true, dist: 20, los: true }), false, 'fora do alcance');
}
console.log('p27: torretas OK');

// ---- p28: Campus (blocos A–E) ----
{
  const C = A.INCURSION_LEVELS[3], inB = (x, z) => C.blocks.some(([bx, bz, w, , d]) => Math.abs(x - bx) < w / 2 + 0.3 && Math.abs(z - bz) < d / 2 + 0.3);
  assert.equal(C.id, 'campus'); assert.equal(C.hints.length, 4);
  assert.ok(!inB(0, 0), 'começa livre no bloco C');
  C.spawns.forEach(([x, z]) => assert.ok(!inB(x, z), `spawn livre (${x}, ${z})`));
  C.cameras.forEach(c => assert.ok(!inB(c.x, c.z), 'câmera fora das paredes'));
  assert.equal(C.doors.length, 8, '4 divisórias × 2 portas');
  assert.ok(Object.values(C.terminals).every(t => Math.abs(t.x) < 28 && Math.abs(t.z) < 16), 'consoles dentro da área');
}
console.log('p28: campus OK');

// ---- p29: torretas destrutíveis ----
{
  const t = { cd: 0, charge: 0, hp: A.TURRET.hp };
  assert.equal(A.turretHit(t, 15), false); assert.equal(t.hp, 25);
  assert.equal(A.turretHit(t, 30), true, 'morre ao zerar o HP'); assert.ok(t.dead);
  assert.equal(A.turretHit(t, 30), false, 'já destruída não "morre" de novo');
  assert.equal(A.turretStep(t, 5, { active: true, dist: 5, los: true }), false, 'destruída não atira');
}
console.log('p29: torretas destrutíveis OK');
