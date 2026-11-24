/* =====================================================================
   gamepad-map.js — remapeamento de botões do gamepad (P66).
   Lógica pura (sem DOM): o script.js só lê/grava e mostra no menu.
   ===================================================================== */
(() => {
'use strict';
window.Arena = window.Arena || {};

// Ações do jogo e botão padrão (layout "standard" do navegador)
Arena.PAD_ACTIONS = [
  { id: 'fire', label: 'Atirar', def: 7 }, { id: 'ads', label: 'Mirar', def: 6 }, { id: 'jump', label: 'Pular', def: 0 },
  { id: 'dash', label: 'Esquivar', def: 1 }, { id: 'reload', label: 'Recarregar', def: 2 }, { id: 'grenade', label: 'Granada', def: 3 },
  { id: 'prev', label: 'Arma anterior', def: 4 }, { id: 'next', label: 'Próxima arma', def: 5 }, { id: 'interact', label: 'Interagir', def: 10 },
  { id: 'pause', label: 'Pausar', def: 9 }
];
const NAMES = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Select', 'Start', 'L3', 'R3', '↑', '↓', '←', '→', 'Home'];
Arena.padLabel = i => NAMES[i] !== undefined ? `${NAMES[i]} (${i})` : `Botão ${i}`;
Arena.padDefaults = () => Object.fromEntries(Arena.PAD_ACTIONS.map(a => [a.id, a.def]));

// Aceita qualquer coisa vinda do localStorage: o que for inválido volta ao padrão e botões repetidos também
Arena.padSanitize = raw => {
  const map = Arena.padDefaults(), used = new Set();
  if (raw && typeof raw === 'object') for (const a of Arena.PAD_ACTIONS) {
    const v = raw[a.id];
    if (Number.isInteger(v) && v >= 0 && v < 32 && !used.has(v)) { map[a.id] = v; }
    used.add(map[a.id]);
  }
  // garante unicidade final (se sobrou repetido por causa de padrão, devolve tudo ao padrão)
  return new Set(Object.values(map)).size === Arena.PAD_ACTIONS.length ? map : Arena.padDefaults();
};

// Atribui um botão a uma ação. Se outra ação já usava o botão, as duas TROCAM (nunca fica sem controle)
Arena.padAssign = (map, action, button) => {
  const next = { ...map };
  if (!(action in next) || !Number.isInteger(button) || button < 0 || button > 31) return next;
  const other = Object.keys(next).find(k => k !== action && next[k] === button);
  if (other) next[other] = next[action];
  next[action] = button;
  return next;
};
})();
