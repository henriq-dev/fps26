/* =====================================================================
   maps.js — arenas do jogo. O mapa muda a cada 5 ondas (a onda do chefe abre uma arena nova).
   Cada bloco: [x, z, largura, altura, profundidade, cor]. O centro (raio 4) fica sempre livre: é onde o jogador nasce.
   ===================================================================== */
(() => {
'use strict';
window.Arena = window.Arena || {};

Arena.MAPS = [
  { name: 'Arena', theme: 'CONCRETO // SETOR 07', strip: 0xff5a4d, sky: 0x10131c, floorA: '#1b202b', floorB: '#242b3a', wall: 0x2a3142,
    blocks: [[-8,-6,3,2,3,0x6b4a2b],[9,-9,2,2,2,0x6b4a2b],[-14,10,4,1.5,2,0x56606f],[12,8,3,3,3,0x56606f],
             [-4,14,2,2,2,0x6b4a2b],[17,-2,2,2.5,5,0x56606f],[0,-16,6,1.5,1.5,0x56606f],[-19,-14,2,3,2,0x6b4a2b],
             [6.5,4,1.6,4,1.6,0x3b4558],[-10,2,1.6,4,1.6,0x3b4558]] },
  { name: 'Pátio', theme: 'DOCA // CHUVA ÂMBAR', strip: 0xffb04d, sky: 0x1c1710, floorA: '#2b2620', floorB: '#3a3329', wall: 0x4a3f33,
    blocks: [[-11,-9,14,2.5,1.2,0x8a7355],[11,9,14,2.5,1.2,0x8a7355],            // dois muros longos que obrigam a contornar
             [-18,17,2,4,2,0x6f5d44],[18,-17,2,4,2,0x6f5d44],[-18,-17,2,4,2,0x6f5d44],[18,17,2,4,2,0x6f5d44],   // pilares nos cantos
             [0,-20,5,2,3,0x7b6a50],[0,20,5,2,3,0x7b6a50],[-21,0,1.5,1.5,6,0x6f5d44],[21,0,1.5,1.5,6,0x6f5d44]] },
  { name: 'Fábrica', theme: 'PLANTA // NÚCLEO CIANO', strip: 0x4de7ff, sky: 0x0d1a1a, floorA: '#16221f', floorB: '#1e2e2a', wall: 0x24413b,
    blocks: [[-13,-9,1.2,3,26,0x3f7a6d],[13,9,1.2,3,26,0x3f7a6d],               // corredores em "S"
             [0,-21,16,3,1.2,0x3f7a6d],[0,21,16,3,1.2,0x3f7a6d],[-21,13,8,3,1.2,0x3f7a6d],[21,-13,8,3,1.2,0x3f7a6d],
             [-6,-7,2,4,2,0x56a090],[6,7,2,4,2,0x56a090],[-20,-4,3,2,3,0x2f5a50],[20,4,3,2,3,0x2f5a50]] }
];
// Ondas 1–5 = mapa 0, 6–10 = mapa 1, 11–15 = mapa 2, depois volta ao começo
Arena.mapForWave = wave => Math.floor((Math.max(wave, 1) - 1) / 5) % Arena.MAPS.length;
})();
