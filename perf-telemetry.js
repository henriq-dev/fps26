/*
 * perf-telemetry.js — métricas locais e opcionais de desempenho.
 * Não envia dados, não cria amostras por alocação no caminho de frame e só é
 * usado pelo jogo quando a URL contém ?perf=1.
 */
(() => {
  'use strict';
  window.Arena = window.Arena || {};

  const FIELDS = [
    'frameMs', 'updateMs', 'renderMs', 'drawCalls', 'triangles', 'geometries', 'textures',
    'enemies', 'projectiles', 'effects', 'marks', 'dust', 'blockedCalls', 'lineCalls',
    'pathCalls', 'pathMs', 'pixelRatio', 'quality'
  ];

  window.Arena.createPerfTelemetry = function createPerfTelemetry(capacity = 600) {
    const size = Math.max(4, Math.floor(Number(capacity) || 600));
    const buffers = Object.fromEntries(FIELDS.map(field => [field, new Float32Array(size)]));
    const scratch = Object.fromEntries(['frameMs', 'updateMs', 'renderMs'].map(field => [field, new Float32Array(size)]));
    let writeIndex = 0;
    let count = 0;

    function record(sample) {
      for (const field of FIELDS) {
        const value = Number(sample[field]);
        buffers[field][writeIndex] = Number.isFinite(value) ? value : 0;
      }
      writeIndex = (writeIndex + 1) % size;
      if (count < size) count++;
    }

    function sortedValues(field) {
      const output = scratch[field];
      output.set(buffers[field].subarray(0, count), 0);
      output.subarray(0, count).sort();
      return output;
    }

    function quantile(sorted, q) {
      if (!count) return 0;
      const index = Math.max(0, Math.min(count - 1, Math.ceil(q * count) - 1));
      return sorted[index];
    }

    function timeStats(field) {
      const sorted = sortedValues(field);
      let total = 0;
      for (let i = 0; i < count; i++) total += buffers[field][i];
      return {
        avg: count ? total / count : 0,
        p50: quantile(sorted, 0.50),
        p95: quantile(sorted, 0.95),
        p99: quantile(sorted, 0.99),
        max: count ? sorted[count - 1] : 0
      };
    }

    function latest() {
      if (!count) return null;
      const index = (writeIndex + size - 1) % size;
      const sample = {};
      for (const field of FIELDS) sample[field] = buffers[field][index];
      return sample;
    }

    function summary() {
      return {
        samples: count,
        capacity: size,
        frame: timeStats('frameMs'),
        update: timeStats('updateMs'),
        render: timeStats('renderMs'),
        latest: latest()
      };
    }

    function toCSV() {
      const lines = [`sample,${FIELDS.join(',')}`];
      const first = count === size ? writeIndex : 0;
      for (let row = 0; row < count; row++) {
        const index = (first + row) % size;
        lines.push(`${row + 1},${FIELDS.map(field => buffers[field][index]).join(',')}`);
      }
      return `${lines.join('\n')}\n`;
    }

    function reset() {
      for (const field of FIELDS) buffers[field].fill(0);
      for (const field of Object.keys(scratch)) scratch[field].fill(0);
      writeIndex = 0;
      count = 0;
    }

    return { record, summary, latest, toCSV, reset, capacity: size };
  };
})();
