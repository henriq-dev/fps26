/* =====================================================================
   audio.js — áudio procedural (Web Audio API, sem arquivos de som).
   Uso: const audio = Arena.createAudio(() => volumeAtual); audio.init() (após um clique); audio.sfx.shot(arma)...
   ===================================================================== */
(() => {
'use strict';
window.Arena = window.Arena || {};

// Coordenadas relativas ao jogador: direita = panorama, distância = atenuação.
Arena.audioSpatial = (sx, sz, px, pz, yaw) => {
  const dx = sx - px, dz = sz - pz, dist = Math.hypot(dx, dz) || 1;
  const right = (dx * Math.cos(yaw) - dz * Math.sin(yaw)) / dist;
  return { pan: Math.max(-1, Math.min(1, right)), gain: Math.max(0.2, 1 - dist / 42) };
};

Arena.createAudio = getVolume => {
  let actx = null, noiseBuf = null, masterGain = null;
  let listener = { x: 0, z: 0, yaw: 0 };
  let lastCasingAt = -1;
  function init() {                                   // navegadores só liberam áudio depois de um clique do jogador
    if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
    actx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = actx.createGain(); masterGain.gain.value = getVolume(); masterGain.connect(actx.destination);
    noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;   // ruído branco
  }
  const setVolume = v => { if (masterGain) masterGain.gain.value = v; };
  const setListener = (x, z, yaw) => { listener = { x, z, yaw }; };
  const spatial = (x, z) => Arena.audioSpatial(x, z, listener.x, listener.z, listener.yaw);
  function route(node, pan = 0, gainScale = 1) {
    if (!actx) return node.connect(masterGain);
    const g = actx.createGain(); g.gain.value = gainScale;
    node.connect(g);
    if (typeof actx.createStereoPanner === 'function') {
      const p = actx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p).connect(masterGain);
    } else g.connect(masterGain);
  }
  // Ruído filtrado com envelope decrescente (estampido, explosão de pólvora)
  function playNoise(dur, cut, vol, delay = 0, type = 'lowpass', pan = 0, gainScale = 1) {
    if (!actx) return;
    const t = actx.currentTime + delay;
    const src = actx.createBufferSource(); src.buffer = noiseBuf;
    const f = actx.createBiquadFilter(); f.type = type;
    f.frequency.setValueAtTime(cut, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(80, cut * 0.2), t + dur);
    const g = actx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g); route(g, pan, gainScale);
    src.start(t); src.stop(t + dur + 0.02);
  }
  // Oscilador com queda de frequência (corpo/"soco" do tiro, impactos)
  function playTone(f0, f1, dur, vol, wave = 'sine', delay = 0, pan = 0, gainScale = 1) {
    if (!actx) return;
    const t = actx.currentTime + delay;
    const o = actx.createOscillator(); o.type = wave;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = actx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); route(g, pan, gainScale);
    o.start(t); o.stop(t + dur + 0.02);
  }
  const sfx = {
    shot(w)  { playNoise(w.snd.dur, w.snd.cut, w.snd.vol); playTone(w.snd.thump, w.snd.thump * 0.35, w.snd.dur, w.snd.vol * 0.8, 'triangle');
               if (w.snd.zap) playTone(w.snd.zap, w.snd.zap * 0.1, w.snd.dur, w.snd.vol * 0.5, 'sawtooth'); },   // zap = estalo elétrico da Railgun
    dry()    { playNoise(0.03, 5000, 0.2, 0, 'highpass'); },
    reload(t){ playNoise(0.04, 4500, 0.25, 0, 'highpass'); playNoise(0.05, 3500, 0.3, t * 0.75, 'highpass'); playTone(200, 120, 0.06, 0.15, 'square', t * 0.75); },
    hit(head){ playTone(head ? 1300 : 800, 400, 0.06, 0.15, 'square'); if (head) playTone(1900, 900, 0.08, 0.12, 'triangle', 0.02); },
    shieldHit(){ playTone(1800, 500, 0.08, 0.22, 'square'); playNoise(0.05, 3200, 0.18, 0, 'highpass'); },
    shieldBreak(){ playTone(900, 90, 0.34, 0.35, 'sawtooth'); playNoise(0.22, 1800, 0.32); },
    enemyShot(x, z, boss = false){ const s = spatial(x, z); playNoise(boss ? 0.22 : 0.12, boss ? 900 : 1500, boss ? 0.45 : 0.22, 0, 'lowpass', s.pan, s.gain); playTone(boss ? 120 : 260, boss ? 40 : 90, boss ? 0.28 : 0.12, boss ? 0.35 : 0.16, 'sawtooth', 0, s.pan, s.gain); },
    kill()   { playTone(320, 70, 0.28, 0.25, 'square'); },
    hurt()   { playNoise(0.15, 700, 0.4); playTone(130, 55, 0.22, 0.4, 'sawtooth'); },
    pickup() { playTone(500, 1000, 0.14, 0.2, 'sine'); },
    over()   { playTone(220, 40, 1.0, 0.4, 'sawtooth'); },
    boom(x, z)   { const s = typeof x === 'number' ? spatial(x, z) : { pan: 0, gain: 1 }; playNoise(0.7, 900, 0.8, 0, 'lowpass', s.pan, s.gain); playTone(110, 28, 0.6, 0.6, 'sawtooth', 0, s.pan, s.gain); },
    casing(x,z,impact=1) {
      if (!actx) return;
      const now=actx.currentTime; if(now-lastCasingAt<.045)return; lastCasingAt=now;
      const s=spatial(x,z),strength=Math.max(.25,Math.min(1,impact)),gain=s.gain*.24*strength;
      playNoise(.035,5200,.16*strength,0,'highpass',s.pan,gain);
      playTone(2500,780,.065,.18*strength,'triangle',.004,s.pan,gain);
    },
    beat()   { playTone(70, 40, 0.12, 0.35, 'sine'); playTone(65, 38, 0.12, 0.28, 'sine', 0.16); },   // coração: vida baixa
    combo(n) { playTone(500 + n * 120, 900 + n * 160, 0.1, 0.12, 'triangle'); },                       // sobe de tom a cada nível do combo
    boss()   { playTone(90, 45, 0.5, 0.5, 'sawtooth'); playNoise(0.4, 600, 0.5); },    // rugido do chefe ao mudar de fase
    objective(){ playTone(660, 990, 0.16, 0.22, 'triangle'); playTone(880, 1320, 0.2, 0.18, 'sine', 0.1); },
    achievement(){ playTone(523, 1046, 0.22, 0.2, 'triangle'); playTone(784, 1568, 0.22, 0.16, 'sine', 0.12); }
  };
  return { init, setVolume, setListener, sfx };
};
})();
