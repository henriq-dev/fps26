/*
 * industrial-materials.js — superfícies PBR procedurais, geradas uma vez e reutilizadas.
 * Sem imagens remotas: os mapas de cor, altura e rugosidade são CanvasTextures compactas.
 */
(() => {
  'use strict';
  window.Arena = window.Arena || {};

  const SURFACES = {
    steel:         { roughness: 0.46, metalness: 0.24, bump: 0.010, repeat: 3, size: 256 },
    paintedMetal:  { roughness: 0.64, metalness: 0.16, bump: 0.008, repeat: 3, size: 256 },
    polymer:       { roughness: 0.82, metalness: 0.03, bump: 0.006, repeat: 3, size: 256 },
    rubber:        { roughness: 0.94, metalness: 0.00, bump: 0.004, repeat: 3, size: 256 },
    fabric:        { roughness: 0.96, metalness: 0.00, bump: 0.010, repeat: 3, size: 256 },
    skin:          { roughness: 0.84, metalness: 0.00, bump: 0.002, repeat: 2, size: 128 },
    wood:          { roughness: 0.88, metalness: 0.01, bump: 0.015, repeat: 3, size: 256 },
    concrete:      { roughness: 0.91, metalness: 0.00, bump: 0.022, repeat: 3, size: 256 },
    floor:         { roughness: 0.86, metalness: 0.08, bump: 0.018, repeat: 10, size: 512 }
  };

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  const NOOP_CANVAS_CONTEXT = {
    set fillStyle(value) {}, set strokeStyle(value) {}, set lineWidth(value) {},
    fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, bezierCurveTo() {}
  };

  function surfaceCanvases(type, size, detailMaps = true) {
    const albedo = document.createElement('canvas');
    const height = detailMaps ? document.createElement('canvas') : null;
    const roughness = detailMaps ? document.createElement('canvas') : null;
    for (const canvas of [albedo, height, roughness]) if (canvas) canvas.width = canvas.height = size;
    const colorCtx = albedo.getContext('2d');
    const heightCtx = height ? height.getContext('2d') : NOOP_CANVAS_CONTEXT;
    const roughCtx = roughness ? roughness.getContext('2d') : NOOP_CANVAS_CONTEXT;
    if (!colorCtx || !heightCtx || !roughCtx) return null;

    const random = seededRandom(type.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), size));
    colorCtx.fillStyle = '#b6b9b7'; colorCtx.fillRect(0, 0, size, size);
    heightCtx.fillStyle = '#808080'; heightCtx.fillRect(0, 0, size, size);
    roughCtx.fillStyle = '#b8b8b8'; roughCtx.fillRect(0, 0, size, size);

    if (type === 'floor') {
      const step = size / 4;
      colorCtx.strokeStyle = 'rgba(30,36,39,.48)'; colorCtx.lineWidth = Math.max(2, size / 128);
      heightCtx.strokeStyle = '#555555'; heightCtx.lineWidth = colorCtx.lineWidth;
      for (let i = 0; i <= 4; i++) {
        const p = i * step;
        colorCtx.beginPath(); colorCtx.moveTo(p, 0); colorCtx.lineTo(p, size); colorCtx.stroke();
        colorCtx.beginPath(); colorCtx.moveTo(0, p); colorCtx.lineTo(size, p); colorCtx.stroke();
        heightCtx.beginPath(); heightCtx.moveTo(p, 0); heightCtx.lineTo(p, size); heightCtx.stroke();
        heightCtx.beginPath(); heightCtx.moveTo(0, p); heightCtx.lineTo(size, p); heightCtx.stroke();
      }
      for (let y = step / 2; y < size; y += step) for (let x = step / 2; x < size; x += step) {
        colorCtx.fillStyle = 'rgba(235,184,76,.20)';
        colorCtx.fillRect(x - 2, y - 2, 4, 4);
        heightCtx.fillStyle = '#b0b0b0'; heightCtx.fillRect(x - 2, y - 2, 4, 4);
      }
    } else if (type === 'steel' || type === 'paintedMetal') {
      for (let i = 0; i < size * 0.42; i++) {
        const x = random() * size, y = random() * size;
        const length = 3 + random() * size * 0.11;
        const alpha = 0.015 + random() * 0.055;
        colorCtx.strokeStyle = random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(16,22,26,${alpha})`;
        colorCtx.lineWidth = 1 + random() * 1.5;
        colorCtx.beginPath(); colorCtx.moveTo(x, y); colorCtx.lineTo(x + length, y + (random() - 0.5) * 2); colorCtx.stroke();
      }
      if (type === 'paintedMetal') {
        colorCtx.strokeStyle = 'rgba(35,41,43,.32)'; colorCtx.lineWidth = Math.max(1, size / 170);
        for (let i = 1; i < 4; i++) { colorCtx.beginPath(); colorCtx.moveTo(size * i / 4, 0); colorCtx.lineTo(size * i / 4, size); colorCtx.stroke(); }
      }
    } else if (type === 'polymer' || type === 'rubber') {
      for (let y = 0; y < size; y += Math.max(5, size / 28)) {
        colorCtx.fillStyle = type === 'rubber' ? 'rgba(16,19,21,.075)' : 'rgba(29,36,39,.055)';
        colorCtx.fillRect(0, y, size, Math.max(1, size / 220));
        heightCtx.fillStyle = '#707070'; heightCtx.fillRect(0, y, size, Math.max(1, size / 220));
      }
      for (let i = 0; i < size * 0.12; i++) {
        const x = random() * size, y = random() * size, r = 0.4 + random() * 1.5;
        colorCtx.fillStyle = `rgba(18,22,24,${0.025 + random() * 0.05})`;
        colorCtx.beginPath(); colorCtx.arc(x, y, r, 0, Math.PI * 2); colorCtx.fill();
      }
    } else if (type === 'fabric') {
      colorCtx.strokeStyle = 'rgba(28,34,38,.10)'; heightCtx.strokeStyle = '#929292';
      for (let p = 0; p < size; p += 4) {
        colorCtx.beginPath(); colorCtx.moveTo(p, 0); colorCtx.lineTo(p, size); colorCtx.stroke();
        colorCtx.beginPath(); colorCtx.moveTo(0, p); colorCtx.lineTo(size, p); colorCtx.stroke();
        heightCtx.beginPath(); heightCtx.moveTo(p, 0); heightCtx.lineTo(p, size); heightCtx.stroke();
        heightCtx.beginPath(); heightCtx.moveTo(0, p); heightCtx.lineTo(size, p); heightCtx.stroke();
      }
    } else if (type === 'wood') {
      for (let i = 0; i < 15; i++) {
        const y = random() * size, offset = random() * 12;
        colorCtx.strokeStyle = `rgba(67,46,27,${0.05 + random() * 0.08})`;
        colorCtx.lineWidth = 1 + random() * 2;
        colorCtx.beginPath(); colorCtx.moveTo(0, y); colorCtx.bezierCurveTo(size * .3, y + offset, size * .7, y - offset, size, y + (random() - .5) * 5); colorCtx.stroke();
        heightCtx.strokeStyle = '#707070'; heightCtx.lineWidth = 1;
        heightCtx.beginPath(); heightCtx.moveTo(0, y); heightCtx.bezierCurveTo(size * .3, y + offset, size * .7, y - offset, size, y); heightCtx.stroke();
      }
    } else if (type === 'skin') {
      for (let i = 0; i < size * 0.12; i++) {
        const x = random() * size, y = random() * size, r = 0.6 + random() * 1.8;
        colorCtx.fillStyle = `rgba(116,75,54,${0.015 + random() * 0.035})`;
        colorCtx.beginPath(); colorCtx.arc(x, y, r, 0, Math.PI * 2); colorCtx.fill();
      }
    } else {
      for (let i = 0; i < size * 0.28; i++) {
        const x = random() * size, y = random() * size, r = 0.5 + random() * 2.2;
        const shade = random() > 0.5 ? 48 : 225;
        colorCtx.fillStyle = `rgba(${shade},${shade},${shade},${0.025 + random() * 0.08})`;
        colorCtx.beginPath(); colorCtx.arc(x, y, r, 0, Math.PI * 2); colorCtx.fill();
        heightCtx.fillStyle = random() > 0.5 ? '#666666' : '#999999';
        heightCtx.fillRect(x, y, r, r);
      }
      colorCtx.strokeStyle = 'rgba(35,40,42,.27)'; colorCtx.lineWidth = Math.max(1, size / 192);
      for (let i = 1; i < 4; i++) { colorCtx.beginPath(); colorCtx.moveTo(size * i / 4, 0); colorCtx.lineTo(size * i / 4, size); colorCtx.stroke(); }
    }

    if (detailMaps) for (let i = 0; i < size * 0.3; i++) {
      const x = random() * size, y = random() * size, gray = 90 + Math.floor(random() * 100);
      roughCtx.fillStyle = `rgb(${gray},${gray},${gray})`; roughCtx.fillRect(x, y, 1 + random() * 2, 1 + random() * 2);
    }
    return { albedo, height, roughness };
  }

  Arena.createIndustrialMaterialLibrary = function (THREE, renderer) {
    const mapCache = new Map();
    const materialCache = new Map();

    function makeTexture(canvas, repeat, colorMap = false) {
      if (!canvas) return null;
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeat, repeat);
      try { texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); } catch (_) {}
      if (colorMap && THREE.sRGBEncoding !== undefined) texture.encoding = THREE.sRGBEncoding;
      return texture;
    }

    function mapsFor(type, size, repeat, detailMaps) {
      const key = `${type}:${size}:${repeat}:${detailMaps ? 'full' : 'albedo'}`;
      if (mapCache.has(key)) return mapCache.get(key);
      const canvases = surfaceCanvases(type, size, detailMaps);
      const maps = canvases ? {
        map: makeTexture(canvases.albedo, repeat, true),
        bumpMap: detailMaps ? makeTexture(canvases.height, repeat) : null,
        roughnessMap: detailMaps ? makeTexture(canvases.roughness, repeat) : null
      } : { map: null, bumpMap: null, roughnessMap: null };
      mapCache.set(key, maps);
      return maps;
    }

    function material(type, color, options = {}) {
      const profile = SURFACES[type] || SURFACES.paintedMetal;
      const values = {
        roughness: options.roughness ?? profile.roughness,
        metalness: options.metalness ?? profile.metalness,
        bumpScale: options.bumpScale ?? profile.bump,
        detailMaps: options.detailMaps !== false,
        repeat: options.repeat ?? profile.repeat,
        size: options.size ?? profile.size,
        emissive: options.emissive ?? 0,
        emissiveIntensity: options.emissiveIntensity ?? 0
      };
      const key = `${type}:${color}:${values.roughness}:${values.metalness}:${values.bumpScale}:${values.detailMaps}:${values.repeat}:${values.size}:${values.emissive}:${values.emissiveIntensity}`;
      if (materialCache.has(key)) return materialCache.get(key);
      const maps = mapsFor(type, values.size, values.repeat, values.detailMaps);
      const mat = new THREE.MeshStandardMaterial({
        color, map: maps.map, bumpMap: maps.bumpMap, roughnessMap: maps.roughnessMap,
        roughness: values.roughness, metalness: values.metalness, bumpScale: values.bumpScale,
        emissive: values.emissive, emissiveIntensity: values.emissiveIntensity
      });
      materialCache.set(key, mat);
      return mat;
    }

    return { material, surfaceCount: () => mapCache.size, materialCount: () => materialCache.size };
  };
})();
