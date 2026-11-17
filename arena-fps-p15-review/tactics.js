/* =====================================================================
   tactics.js — regras puras para missões, dificuldade, cobertura e esquadrões.
   ===================================================================== */
(() => {
'use strict';
window.Arena = window.Arena || {};

const DIFFICULTIES = {
  cadet: { id: 'cadet', label: 'RECRUTA', hp: 0.82, speed: 0.9, damage: 0.78, count: 0.88 },
  normal: { id: 'normal', label: 'VETERANO', hp: 1, speed: 1, damage: 1, count: 1 },
  nightmare: { id: 'nightmare', label: 'PESADELO', hp: 1.22, speed: 1.1, damage: 1.28, count: 1.12 }
};
Arena.difficultyConfig = id => ({ ...(DIFFICULTIES[id] || DIFFICULTIES.normal) });
Arena.recordKey = (mode, difficulty) => `arenaFpsRecord:v2:${mode || 'survival'}:${difficulty || 'normal'}`;

const OBJECTIVES = [
  { id: 'hack', name: 'INVADIR O RELÉ', hint: 'Mantenha E perto do terminal até concluir a invasão.', nodes: 1, seconds: 5.5 },
  { id: 'relay', name: 'ATIVAR OS RELÉS', hint: 'Aproxime-se dos três relés e pressione E em cada um.', nodes: 3 },
  { id: 'hold', name: 'CONTROLAR A ZONA', hint: 'Permaneça no sinal ciano; inimigos próximos contestam a área.', nodes: 1, seconds: 16 }
];
Arena.objectiveForWave = (mode, wave) => {
  if (mode !== 'operations' || wave < 2 || wave % 2 !== 0) return null;
  const index = (Math.floor(wave / 2) - 1) % OBJECTIVES.length;
  return { ...OBJECTIVES[index], wave };
};

Arena.squadAssignments = agents => {
  const ordered = [...agents].sort((a, b) => (a.id || 0) - (b.id || 0));
  return ordered.map((agent, index) => ({
    id: agent.id,
    side: index % 2 === 0 ? -1 : 1,
    slot: Math.floor(index / 2),
    fireDelay: (index % 4) * 0.22,
    squad: index % 2 === 0 ? 'alpha' : 'bravo'
  }));
};

// Candidate points are generated just outside obstacle faces. A candidate is useful
// only when the obstacle actually breaks line of sight from the player's position.
Arena.coverCandidates = (boxes, enemy, player, isBlocked, lineClear) => {
  const points = [];
  for (const box of boxes) {
    if ((box.h || 0) < 1.25) continue;
    const cx = (box.minX + box.maxX) / 2, cz = (box.minZ + box.maxZ) / 2;
    const offsets = [
      [box.minX - 1.05, cz], [box.maxX + 1.05, cz],
      [cx, box.minZ - 1.05], [cx, box.maxZ + 1.05],
      [box.minX - 0.8, box.minZ - 0.8], [box.maxX + 0.8, box.minZ - 0.8],
      [box.minX - 0.8, box.maxZ + 0.8], [box.maxX + 0.8, box.maxZ + 0.8]
    ];
    for (const [x, z] of offsets) {
      if (isBlocked(x, z, 0.58)) continue;
      const fromEnemy = Math.hypot(x - enemy.x, z - enemy.z);
      const fromPlayer = Math.hypot(x - player.x, z - player.z);
      if (fromEnemy > 12 || fromPlayer < 3 || lineClear(x, z, player.x, player.z)) continue;
      points.push({ x, z, score: fromEnemy + fromPlayer * 0.04 });
    }
  }
  return points;
};
Arena.chooseCoverPoint = points => points.length ? points.reduce((best, p) => !best || p.score < best.score ? p : best, null) : null;
Arena.flankPoint = (px, pz, ex, ez, side, radius = 4.5) => {
  const angle = Math.atan2(ez - pz, ex - px) + side * 0.82;
  return [px + Math.cos(angle) * radius, pz + Math.sin(angle) * radius];
};
})();
