/* =====================================================================
   pathfinding.js — Busca de caminho A* em grade (sem DOM: pode ser testado no Node)
   Ideia: transformar a arena numa grade de células (livre/bloqueada) e achar o menor
   caminho entre duas células. Depois "esticamos" o caminho (string pulling) para ele
   virar poucos waypoints em linha reta, e o inimigo anda sem ziguezague.
   ===================================================================== */
(() => {
'use strict';
window.Arena = window.Arena || {};

// Grade de navegação. `clearance` = raio do corpo: a célula só é livre se um círculo desse raio cabe nela.
Arena.createGrid = (arena, cell, boxes, clearance) => {
  const n = Math.ceil((arena * 2) / cell);
  const blocked = new Uint8Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = -arena + (i + 0.5) * cell, z = -arena + (j + 0.5) * cell;
    let b = Math.abs(x) > arena - clearance || Math.abs(z) > arena - clearance;           // fora das paredes
    for (let k = 0; !b && k < boxes.length; k++) {
      const o = boxes[k];
      b = x + clearance > o.minX && x - clearance < o.maxX && z + clearance > o.minZ && z - clearance < o.maxZ;
    }
    blocked[j * n + i] = b ? 1 : 0;
  }
  // Vetores reaproveitados a cada busca (evita criar arrays grandes toda hora)
  return { n, cell, arena, clearance, blocked,
           g: new Float32Array(n * n), came: new Int32Array(n * n), stamp: new Int32Array(n * n), run: 0 };
};

const cellOf = (grid, v) => Math.min(grid.n - 1, Math.max(0, Math.floor((v + grid.arena) / grid.cell)));
const centerOf = (grid, i) => -grid.arena + (i + 0.5) * grid.cell;
Arena.cellBlockedAt = (grid, x, z) => grid.blocked[cellOf(grid, z) * grid.n + cellOf(grid, x)] === 1;

// Linha reta livre? Amostra pontos ao longo do segmento (passo menor que a célula, então nenhuma célula escapa)
Arena.lineClear = (grid, x0, z0, x1, z1) => {
  const dx = x1 - x0, dz = z1 - z0, dist = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(dist / (grid.cell * 0.35)));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    if (Arena.cellBlockedAt(grid, x0 + dx * t, z0 + dz * t)) return false;
  }
  return true;
};

// Se o ponto cair numa célula bloqueada (jogador colado numa caixa), usa a célula livre mais próxima
function nearestFree(grid, i, j) {
  const { n, blocked } = grid;
  if (!blocked[j * n + i]) return [i, j];
  for (let r = 1; r <= 6; r++) {
    let best = null, bd = 1e9;
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
      const a = i + di, b = j + dj;
      if (a < 0 || b < 0 || a >= n || b >= n || blocked[b * n + a]) continue;
      const d = di * di + dj * dj; if (d < bd) { bd = d; best = [a, b]; }
    }
    if (best) return best;
  }
  return null;
}

const SQRT2 = Math.SQRT2;
const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, SQRT2], [1, -1, SQRT2], [-1, 1, SQRT2], [-1, -1, SQRT2]];

// A* puro: devolve { cells: [[i,j]...], cost } ou null. Vizinhança de 8 direções, sem "cortar quina".
Arena.findPathCells = (grid, sx, sz, gx, gz, maxNodes = 6000) => {
  const { n, blocked, g, came, stamp } = grid;
  const s = nearestFree(grid, cellOf(grid, sx), cellOf(grid, sz));
  const t = nearestFree(grid, cellOf(grid, gx), cellOf(grid, gz));
  if (!s || !t) return null;
  const start = s[1] * n + s[0], goal = t[1] * n + t[0];
  const run = ++grid.run;
  const h = idx => { const a = Math.abs((idx % n) - t[0]), b = Math.abs(((idx / n) | 0) - t[1]); return Math.max(a, b) + (SQRT2 - 1) * Math.min(a, b); };   // distância "octile"
  // Fila de prioridade (heap binário): sempre tira o nó com menor f = g + h.
  // Cada entrada guarda o seu próprio f (vetores paralelos); entradas antigas do mesmo nó são ignoradas ao sair (lazy deletion).
  const ids = [], fs = [];
  const push = (idx, f) => {
    let c = ids.length; ids.push(idx); fs.push(f);
    while (c > 0) { const p = (c - 1) >> 1; if (fs[p] <= f) break; ids[c] = ids[p]; fs[c] = fs[p]; c = p; }
    ids[c] = idx; fs[c] = f;
  };
  const pop = () => {
    const top = ids[0], li = ids.pop(), lf = fs.pop();
    if (ids.length) {
      let c = 0;
      for (;;) {
        let l = 2 * c + 1; if (l >= ids.length) break;
        if (l + 1 < ids.length && fs[l + 1] < fs[l]) l++;
        if (fs[l] >= lf) break;
        ids[c] = ids[l]; fs[c] = fs[l]; c = l;
      }
      ids[c] = li; fs[c] = lf;
    }
    return top;
  };
  stamp[start] = run; g[start] = 0; came[start] = -1; push(start, h(start));
  const closed = new Set(); let expanded = 0;
  while (ids.length && expanded++ < maxNodes) {
    const cur = pop();
    if (cur === goal) {
      const cells = []; for (let c = cur; c !== -1; c = came[c]) cells.push([c % n, (c / n) | 0]);
      return { cells: cells.reverse(), cost: g[cur] };
    }
    if (closed.has(cur)) continue; closed.add(cur);
    const ci = cur % n, cj = (cur / n) | 0;
    for (const [di, dj, cost] of DIRS) {
      const a = ci + di, b = cj + dj;
      if (a < 0 || b < 0 || a >= n || b >= n) continue;
      const ni = b * n + a;
      if (blocked[ni]) continue;
      if (di && dj && (blocked[cj * n + a] || blocked[b * n + ci])) continue;      // diagonal só se as duas laterais estiverem livres
      const ng = g[cur] + cost;
      if (stamp[ni] !== run || ng < g[ni]) { stamp[ni] = run; g[ni] = ng; came[ni] = cur; push(ni, ng + h(ni)); }
    }
  }
  return null;
};

// Caminho final em waypoints do mundo (já esticado). Devolve [[x,z],...] ou null se não existe.
Arena.findPath = (grid, sx, sz, gx, gz, maxNodes) => {
  const res = Arena.findPathCells(grid, sx, sz, gx, gz, maxNodes);
  if (!res) return null;
  const pts = [[sx, sz], ...res.cells.slice(1, -1).map(([i, j]) => [centerOf(grid, i), centerOf(grid, j)])];
  const end = Arena.cellBlockedAt(grid, gx, gz) ? [centerOf(grid, res.cells[res.cells.length - 1][0]), centerOf(grid, res.cells[res.cells.length - 1][1])] : [gx, gz];
  pts.push(end);
  // String pulling: de cada ponto, pula para o mais distante que ainda enxerga em linha reta
  const out = []; let a = 0;
  while (a < pts.length - 1) {
    let b = pts.length - 1;
    while (b > a + 1 && !Arena.lineClear(grid, pts[a][0], pts[a][1], pts[b][0], pts[b][1])) b--;
    out.push(pts[b]); a = b;
  }
  return out;
};
})();
