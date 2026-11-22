/* =====================================================================
   weapons.js — dados das armas (só dados, nenhuma lógica de jogo).
   Para balancear: mexa em dmg (dano), rate (segundos entre tiros), mag/reserve (munição),
   reload (segundos), spread (dispersão) e falloff (perda de dano com a distância).
   ===================================================================== */
(() => {
'use strict';
window.Arena = window.Arena || {};

// Cada arma tem propriedades próprias: cadência, pente, recarga, dispersão...
// `visual` controla apenas apresentação; não altera atributos ou regras de combate.
Arena.WEAPONS = [
  { name: 'Pistola', short: 'Pistola', role: 'PRECISÃO', color: 0xffd27a, auto: false, dmg: 28,  pellets: 1, rate: 0.28,  mag: 12, reserve: 72,  reload: 1.1, zoom: 1.3,
    spread: 0.004, range: 80,  falloff: 0.10, recoil: 0.06,
    snd: { dur: .12, cut: 2600, thump: 220, vol: .35 },
    visual: { flash: 'compact', reload: 'slide', finish: 'satin-steel', hands: 'compact', smoke: 1, shot: { impulse: .018, pitch: .035, roll: .008, recovery: 18 }, casing: { radius: .018, length: .055, color: 0xc99a45, port: [.105, .065, -.15] } } },
  { name: 'Fuzil', short: 'Fuzil', role: 'VERSÁTIL', color: 0x8be36d, auto: true,  dmg: 24,  pellets: 1, rate: 0.10,  mag: 30, reserve: 150, reload: 1.7, zoom: 1.5,
    spread: 0.012, range: 100, falloff: 0.15, recoil: 0.05,
    snd: { dur: .14, cut: 2000, thump: 170, vol: .38 },
    visual: { flash: 'rifle', reload: 'bolt', finish: 'phosphate-polymer', hands: 'carbine', smoke: 1, shot: { impulse: .024, pitch: .028, roll: .006, recovery: 16 }, casing: { radius: .018, length: .061, color: 0xc99a45, port: [.105, .055, -.29] } } },
  { name: 'Metralhadora', short: 'Metralh.', role: 'SUPRESSÃO', color: 0xff9d4d, knockback: 0.15, auto: true, dmg: 13, pellets: 1, rate: 0.055, mag: 50, reserve: 200, reload: 1.5, zoom: 1.25,
    spread: 0.040, range: 60,  falloff: 0.50, recoil: 0.03,
    snd: { dur: .08, cut: 3400, thump: 260, vol: .28 },
    visual: { flash: 'bloom', reload: 'feed-cover', finish: 'brushed-alloy', hands: 'support-heavy', smoke: 2, shot: { impulse: .014, pitch: .018, roll: .004, recovery: 22 }, casing: { radius: .022, length: .069, color: 0xd29a42, port: [.115, .075, -.22] } } },
  { name: 'Espingarda', short: 'Escopeta', role: 'IMPACTO', color: 0xffc857, knockback: 2.2, auto: false, dmg: 14, pellets: 9, rate: 0.85,  mag: 6,  reserve: 36, reload: 2.3, zoom: 1.2,
    shell: true, shellTime: 0.42,            // recarga cartucho a cartucho (1 a cada 0,42 s) e pode ser interrompida atirando
    spread: 0.075, range: 35,  falloff: 0.85, recoil: 0.18,
    snd: { dur: .35, cut: 1400, thump: 90,  vol: .6 },
    visual: { flash: 'scatter', reload: 'pump', finish: 'wood-and-steel', hands: 'pump-action', smoke: 3, shot: { impulse: .065, pitch: .11, roll: .026, recovery: 10 }, casing: { radius: .03, length: .066, color: 0xc98b32, port: [.11, .065, -.18] } } },
  { name: 'Sniper', short: 'Sniper', role: 'EXECUÇÃO', color: 0xc7d9ff, auto: false, dmg: 140, pellets: 1, rate: 1.30,  mag: 5,  reserve: 25, reload: 2.4,
    spread: 0.050, range: 200, falloff: 0.00, recoil: 0.22, zoom: 4,
    snd: { dur: .5,  cut: 1100, thump: 70,  vol: .7 },
    visual: { flash: 'needle', reload: 'bolt-action', finish: 'precision-matte', hands: 'precision', smoke: 2, shot: { impulse: .055, pitch: .13, roll: .012, recovery: 8 }, casing: { radius: .02, length: .078, color: 0xd4b36d, port: [.095, .055, -.12] } } },
  // ---- Armas desbloqueadas conforme as ondas avançam (campo `unlock`) ----
  { name: 'Magnum', short: 'Magnum', role: 'ALTO DANO', color: 0xff8f5f, unlock: 2, auto: false, dmg: 75, pellets: 1, rate: 0.60, mag: 6, reserve: 36, reload: 1.9, zoom: 1.4,
    spread: 0.005, range: 90, falloff: 0.10, recoil: 0.20,
    snd: { dur: .2, cut: 1800, thump: 120, vol: .55 },
    visual: { flash: 'heavy', reload: 'cylinder', finish: 'aged-steel-wood', hands: 'sidearm-heavy', smoke: 2, shot: { impulse: .068, pitch: .12, roll: .032, recovery: 9 }, casing: { radius: .023, length: .068, color: 0xd0a453, port: [.115, .07, -.13] } } },
  { name: 'Railgun', short: 'Railgun', role: 'PERFURAÇÃO', color: 0x59e8ff, unlock: 4, auto: false, dmg: 90, pellets: 1, rate: 1.10, mag: 4, reserve: 20, reload: 2.2, zoom: 2,
    spread: 0.002, range: 200, falloff: 0, recoil: 0.12, pierce: true,   // pierce = atravessa inimigos (e escudos)
    snd: { dur: .35, cut: 3000, thump: 300, vol: .5, zap: 2200 },
    visual: { flash: 'arc', reload: 'coils', finish: 'ceramic-energy', hands: 'energy-rifle', smoke: 3, shot: { impulse: .05, pitch: .095, roll: .01, recovery: 7, coilPulse: .8 }, casing: null } },
  { name: 'Lança-granadas', short: 'Granada', role: 'ÁREA', color: 0x35d6c8, unlock: 6, auto: false, dmg: 130, pellets: 1, rate: 1.00, mag: 4, reserve: 16, reload: 2.6,
    spread: 0, range: 60, falloff: 0, recoil: 0.25, launcher: true, radius: 4.5,           // launcher = projétil com arco e explosão em área
    snd: { dur: .3, cut: 700, thump: 70, vol: .7 },
    visual: { flash: 'pulse', reload: 'drum', finish: 'field-oxidized', hands: 'launcher', smoke: 1, shot: { impulse: .075, pitch: .14, roll: .022, recovery: 8 }, casing: null } },
  { name: 'SMG Vespa', short: 'Vespa', role: 'RAJADA', color: 0xe68cff, unlock: 8, auto: true, dmg: 8.5, pellets: 1, rate: .075, mag: 36, reserve: 216, reload: 1.45, zoom: 1.2,
    spread: .028, range: 72, falloff: .40, recoil: .028,
    snd: { dur: .07, cut: 3600, thump: 190, vol: .26 },
    visual: { flash: 'burst', reload: 'bolt', finish: 'anodized-violet', hands: 'compact-smg', smoke: 1, shot: { impulse: .012, pitch: .016, roll: .004, recovery: 22 }, casing: { radius: .016, length: .052, color: 0xd3ad68, port: [.106, .055, -.20] } } },
  { name: 'Carabina Íon', short: 'Íon', role: 'SOBRECARGA', color: 0x74a4ff, unlock: 10, auto: false, dmg: 52, pellets: 1, rate: .58, mag: 8, reserve: 48, reload: 2.0, zoom: 1.8,
    spread: .006, range: 145, falloff: .05, recoil: .13,
    snd: { dur: .22, cut: 2800, thump: 150, vol: .42, zap: 1750 },
    visual: { flash: 'ion', reload: 'coils', finish: 'ion-ceramic', hands: 'energy-carbine', smoke: 1, particles: 'ion', shot: { impulse: .042, pitch: .075, roll: .01, recovery: 10, coilPulse: .62 }, casing: null } }
];

})();
