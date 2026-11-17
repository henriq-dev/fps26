/* =====================================================================
   enemies.js — tipos de inimigos e regras de escala por onda (dados + funções puras).
   ===================================================================== */
(() => {
'use strict';
window.Arena = window.Arena || {};

// Tipos de inimigos. `intro` = onda em que um tipo especial aparece pela primeira vez.
Arena.TYPES = {
  grunt:  { label: 'Soldado', hp: 60,  speed: 2.3, dmg: 9 , scale: 1.00, color: 0x8a3f3f, pts: 100, behavior: 'pressure', cover: true },
  runner: { label: 'Corredor', hp: 35,  speed: 4.0, dmg: 7,  scale: 0.85, color: 0x3f7c8a, pts: 130, flanker: true, behavior: 'flank' },
  brute:  { label: 'Brutamonte', hp: 170, speed: 1.7, dmg: 20, scale: 1.35, color: 0x6a3f8a, pts: 250, behavior: 'anchor', cover: true, priority: 'objective' },
  ranged: { label: 'Atirador', hp: 75, speed: 1.7, dmg: 14, scale: 0.95, color: 0xb56a35, pts: 180, ranged: true, strafe: true, behavior: 'kite', cover: true, priority: 'volley' },
  boss:   { label: 'Senhor da Arena', hp: 900, speed: 1.25, dmg: 35, scale: 2.0, color: 0x9b224e, pts: 1500, boss: true, ranged: true },
  // ---- Especiais: `intro` = onda em que aparecem pela primeira vez ----
  exploder: { hp: 40,  speed: 5.0, dmg: 35, scale: 0.90, color: 0xff8a1f, pts: 160, explodes: true, intro: 4, label: 'Kamikaze', behavior: 'rush' },
  shield:   { hp: 140, speed: 2.1, dmg: 14, scale: 1.10, color: 0x4a6fa5, pts: 220, shield: true,   intro: 6, label: 'Escudeiro', behavior: 'guard', cover: true, priority: 'guard' },
  healer:   { hp: 70,  speed: 2.2, dmg: 0,  scale: 0.95, color: 0x2fbf71, pts: 200, healer: true,   intro: 8, label: 'Curandeiro', behavior: 'support' }
};

// [tipo, onda mínima, peso]: quanto maior o peso, mais comum
Arena.SPAWN_TABLE = [['grunt', 1, 50], ['runner', 2, 20], ['ranged', 3, 14], ['brute', 3, 14],
                     ['exploder', 4, 14], ['shield', 6, 12], ['healer', 8, 6]];
const WAVE_PROFILES = [
  { id: 'swarm', name: 'ENXAME', hint: 'muitos alvos · mantenha o movimento', weights: { grunt: 1.35, runner: 1.2 } },
  { id: 'crossfire', name: 'FOGO CRUZADO', hint: 'atiradores pressionam de longe', weights: { ranged: 2.3, brute: 0.8 } },
  { id: 'hunters', name: 'CAÇADORES', hint: 'corredores tentam flanquear', weights: { runner: 2.2, brute: 0.8 } },
  { id: 'breach', name: 'RUPTURA', hint: 'explosivos e escudos alteram a rota', weights: { exploder: 1.8, shield: 1.6 } },
  { id: 'boss', name: 'SENHOR DA ARENA', hint: 'chefe e reforços especiais', weights: { brute: 1.4, ranged: 1.2 } }
];
Arena.waveProfile = wave => {
  const p = WAVE_PROFILES[(Math.max(1, wave) - 1) % WAVE_PROFILES.length];
  return { ...p, index: (Math.max(1, wave) - 1) % WAVE_PROFILES.length, countBonus: p.id === 'swarm' ? 2 : p.id === 'boss' ? -2 : 0 };
};
Arena.waveCount = wave => Math.max(4, 4 + wave * 3 + Arena.waveProfile(wave).countBonus);
// Sorteio ponderado entre os tipos já liberados na onda atual e o tema da onda.
Arena.pickType = (wave, rnd = Math.random) => {
  const open = Arena.SPAWN_TABLE.filter(t => wave >= t[1]);
  const profile = Arena.waveProfile(wave);
  const weighted = open.map(t => [t[0], t[2] * (profile.weights[t[0]] || 1)]);
  let r = rnd() * weighted.reduce((sum, t) => sum + t[1], 0);
  for (const t of weighted) { if ((r -= t[1]) < 0) return t[0]; }
  return 'grunt';
};
// Escala de dificuldade por onda: vida cresce sempre; velocidade para de crescer na onda 10
Arena.enemyHp = (T, wave) => T.hp * (1 + wave * 0.08) * (Arena.waveProfile(wave).id === 'boss' ? 1.04 : 1);
Arena.enemySpeed = (T, wave) => T.speed * (1 + Math.min(wave, 10) * 0.03) * (Arena.waveProfile(wave).id === 'swarm' ? 1.02 : 1);
// Fase do chefe pela vida restante: 1 (>66%), 2 (>33%), 3 (final)
Arena.bossPhase = ratio => ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
})();
