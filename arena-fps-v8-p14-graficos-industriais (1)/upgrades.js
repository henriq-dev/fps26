/* =====================================================================
   upgrades.js — upgrades (perks) escolhidos entre as ondas. Só dados + funções puras.
   ===================================================================== */
(() => {
'use strict';
window.Arena = window.Arena || {};

// max = quantas vezes pode ser escolhido; consumable = efeito imediato, não empilha e sempre reaparece
Arena.PERKS = [
  { id: 'dmg',    name: 'Munição Perfurante', desc: '+15% de dano em todas as armas', max: 5 },
  { id: 'rate',   name: 'Gatilho Leve',       desc: '+10% de cadência de tiro', max: 4 },
  { id: 'reload', name: 'Recarga Rápida',     desc: '−20% no tempo de recarga', max: 3 },
  { id: 'mag',    name: 'Munição Estendida',  desc: '+25% de pente e de reserva', max: 3 },
  { id: 'hp',     name: 'Colete Reforçado',   desc: '+25 de vida máxima (e cura 25)', max: 4 },
  { id: 'speed',  name: 'Botas Leves',        desc: '+8% de velocidade', max: 3 },
  { id: 'dash',   name: 'Dash Turbo',         desc: '−25% na recarga do dash', max: 3 },
  { id: 'vamp',   name: 'Sede de Sangue',     desc: '+2 de vida a cada abate', max: 4 },
  { id: 'crit',   name: 'Olho de Águia',      desc: 'Tiro na cabeça: +0,5 no multiplicador (base ×2)', max: 3 },
  { id: 'heal',   name: 'Kit Médico',         desc: 'Recupera toda a vida agora', max: Infinity, consumable: true },
  { id: 'ammo',   name: 'Caixa de Munição',   desc: 'Enche pente e reserva de todas as armas', max: Infinity, consumable: true }
];

// Multiplicadores finais a partir de quantas vezes cada upgrade foi escolhido
Arena.perkStats = c => ({
  dmg: 1 + 0.15 * (c.dmg || 0),          // multiplica o dano
  rate: Math.pow(0.9, c.rate || 0),      // multiplica o INTERVALO entre tiros (menor = mais rápido)
  reload: Math.pow(0.8, c.reload || 0),  // multiplica o tempo de recarga
  mag: 1 + 0.25 * (c.mag || 0),          // multiplica pente e reserva
  maxHp: 100 + 25 * (c.hp || 0),
  speed: 1 + 0.08 * (c.speed || 0),
  dash: Math.pow(0.75, c.dash || 0),     // multiplica a recarga do dash
  vamp: 2 * (c.vamp || 0),               // vida ganha por abate
  head: 2 + 0.5 * (c.crit || 0)          // multiplicador de tiro na cabeça
});

// Sorteia `n` upgrades diferentes entre os que ainda não chegaram ao máximo
Arena.rollPerks = (counts, n = 3, rnd = Math.random) => {
  const pool = Arena.PERKS.filter(p => (counts[p.id] || 0) < p.max);
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return out;
};
})();
