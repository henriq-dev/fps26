/* =====================================================================
   terminal-props.js — máquinas físicas da incursão (visual, sem colisão).
   Tudo é cenográfico/local: não executa comandos nem acessa rede real.
   ===================================================================== */
(() => {
  'use strict';
  window.Arena = window.Arena || {};
  const geoCache = new Map(), matCache = new Map();
  const palette = { standby: 0x4de7ff, detected: 0xffc857, intrusion: 0xffb04d, committed: 0x3ddc84, locked: 0xff3b5f };
  const dark = 0x151c25, frame = 0x35424c, steel = 0x697983, rubber = 0x20272e;

  function box(w, h, d) { const k = `b:${w}:${h}:${d}`; if (!geoCache.has(k)) geoCache.set(k, new THREE.BoxGeometry(w, h, d)); return geoCache.get(k); }
  function cyl(r, h, n = 8) { const k = `c:${r}:${h}:${n}`; if (!geoCache.has(k)) { const g = new THREE.CylinderGeometry(r, r, h, n); g.rotateX(Math.PI / 2); geoCache.set(k, g); } return geoCache.get(k); }
  function mat(color, basic = false, opacity = 1) {
    const k = `${color}:${basic}:${opacity}`; if (matCache.has(k)) return matCache.get(k);
    const m = basic ? new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity }) : new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: .035 });
    matCache.set(k, m); return m;
  }
  function add(g, geometry, material, x, y, z, sx = 1, sy = 1, sz = 1, rz = 0) {
    const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.z = rz; g.add(m); return m;
  }
  function led(g, x, y, z, color, sx = .035, sy = .035, sz = .018) {
    const m = add(g, box(1, 1, 1), mat(color, true), x, y, z, sx, sy, sz); m.userData.led = true; return m;
  }
  function screw(g, x, y, z) { return add(g, cyl(.018, .014, 6), mat(0xb4c5c8, false), x, y, z, 1, 1, 1); }
  function screen(g, x, y, z, w, h, color) {
    add(g, box(w + .12, h + .12, .075), mat(frame), x, y, z - .02);
    const m = add(g, box(w, h, .012), mat(color, true), x, y, z + .025); m.userData.screen = true; return m;
  }
  function keyboard(g, x, y, z, wide = .68) {
    add(g, box(wide, .055, .27), mat(rubber), x, y, z);
    for (let row = 0; row < 3; row++) for (let col = 0; col < 7; col++) add(g, box(.055, .018, .045), mat(row === 0 && col === 0 ? 0xffc857 : steel), x - wide / 2 + .09 + col * .09, y + .038, z - .075 + row * .07);
    add(g, box(.18, .018, .045), mat(steel), x, y + .038, z + .095);
  }
  function cable(g, points, color) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, .018, 5, false), mat(color, true)); g.add(m); return m;
  }
  function rack(g, x, y, z, w = .78, h = 2.25, d = .42, color = dark) {
    add(g, box(w, h, d), mat(color), x, y + h / 2, z);
    add(g, box(w * .82, h * .82, .018), mat(0x25323a), x, y + h * .54, z + d / 2 + .012);
    for (let i = 0; i < 5; i++) { add(g, box(w * .72, .022, .025), mat(steel), x, y + .28 + i * .34, z + d / 2 + .03); led(g, x - w * .28, y + .29 + i * .34, z + d / 2 + .045, i === 4 ? 0xffc857 : 0x3ddc84, .025, .025, .012); }
    for (const sx of [-1, 1]) for (const sy of [0, h]) screw(g, x + sx * (w * .38), y + sy + (sy ? -.08 : .08), z + d / 2 + .045);
    return g;
  }
  function buildKvm(g) {
    add(g, box(1.75, .12, .82), mat(frame), 0, 1.03, 0);
    for (const x of [-.72, .72]) for (const z of [-.28, .28]) add(g, box(.08, 1.0, .08), mat(dark), x, .5, z);
    rack(g, 0, 1.08, -.32, .76, 1.65, .34, 0x202b34);
    add(g, box(.82, .06, .06), mat(steel), 0, 1.84, -.10);
    screen(g, 0, 1.62, .10, .82, .46, palette.standby);
    add(g, box(.07, .48, .05), mat(steel), -.48, 1.45, .08, 1, 1, 1, -.1);
    keyboard(g, -.05, 1.12, .27, .70);
    add(g, new THREE.SphereGeometry(.10, 8, 6), mat(steel), .52, 1.17, .25); add(g, new THREE.SphereGeometry(.045, 7, 5), mat(palette.standby, true), .52, 1.24, .25);
    add(g, box(.18, .08, .12), mat(0x1e2a31), -.57, 1.18, -.02); for (let i = 0; i < 3; i++) led(g, -.63 + i * .055, 1.19, .05, i === 1 ? 0xffc857 : 0x3ddc84);
    cable(g, [[-.34, 1.08, -.22], [-.55, .78, -.30], [-.60, .35, -.30]], 0x35d6c8);
    cable(g, [[.25, 1.08, -.23], [.42, .76, -.32], [.48, .30, -.32]], 0xffb04d);
    return g;
  }
  function buildNetwork(g) {
    add(g, box(1.75, .12, .82), mat(frame), 0, 1.03, 0);
    rack(g, 0, 1.08, -.28, 1.04, 2.35, .44, 0x202932);
    add(g, box(.84, .62, .035), mat(0x25343e), 0, 1.72, -.045);
    for (let row = 0; row < 3; row++) for (let col = 0; col < 8; col++) { add(g, box(.055, .055, .018), mat(steel), -.30 + col * .085, 1.85 - row * .16, .0); led(g, -.30 + col * .085, 1.90 - row * .16, .018, (row + col) % 3 === 0 ? 0xffc857 : 0x3ddc84, .018, .018, .01); }
    screen(g, 0, 1.25, .10, .72, .26, palette.standby);
    for (let i = 0; i < 5; i++) cable(g, [[-.36 + i * .18, 1.50, .04], [-.46 + i * .23, 1.18, .30], [-.55 + i * .26, .86, .30]], [0x35d6c8, 0xffb04d, 0x9e7bff, 0x3ddc84, 0xff5a4d][i]);
    add(g, box(.25, .10, .16), mat(0x1e2a31), .48, 1.15, .23); led(g, .48, 1.18, .32, 0xff5a4d, .035, .035, .015); led(g, .39, 1.18, .32, 0x3ddc84, .035, .035, .015);
    return g;
  }
  function buildDatacenter(g) {
    add(g, box(1.9, .12, .82), mat(frame), 0, 1.03, 0);
    for (const x of [-.72, .72]) for (const z of [-.28, .28]) add(g, box(.08, 1.0, .08), mat(dark), x, .5, z);
    rack(g, 0, 1.08, -.36, .70, 1.85, .34, 0x1e2832);
    for (const x of [-.55, 0, .55]) screen(g, x, 1.65, .12, .42, .35, x === 0 ? 0xffc857 : palette.standby);
    keyboard(g, 0, 1.12, .30, .84);
    add(g, box(.16, .28, .18), mat(0x263640), -.82, 1.31, .08); add(g, box(.16, .28, .18), mat(0x263640), .82, 1.31, .08);
    for (let i = 0; i < 6; i++) { led(g, -.82 + (i % 2) * .11, 1.30 + Math.floor(i / 2) * .08, .18, i % 2 ? 0xffb04d : 0x3ddc84); led(g, .82 - (i % 2) * .11, 1.30 + Math.floor(i / 2) * .08, .18, i % 2 ? 0x4de7ff : 0xff5a4d); }
    cable(g, [[-.48, 1.05, -.20], [-.65, .78, -.36], [-.65, .35, -.36]], 0x4de7ff); cable(g, [[.48, 1.05, -.20], [.65, .78, -.36], [.65, .35, -.36]], 0xffb04d);
    return g;
  }
  Arena.createIncursionTerminal = function createIncursionTerminal(spec) {
    const g = new THREE.Group(); g.position.set(spec.x, 0, spec.z); g.rotation.y = spec.rotation || 0; g.userData.terminalId = spec.id || spec.name;
    if (spec.kind === 'network') buildNetwork(g); else if (spec.kind === 'datacenter') buildDatacenter(g); else buildKvm(g);
    const screens = [], leds = [];
    g.traverse(node => { if (node.userData.screen) screens.push(node.material); if (node.userData.led) leds.push(node.material); });
    g.userData.screenMats = screens; g.userData.ledMats = leds; g.userData.state = 'standby'; g.userData.phase = Math.random() * 5; g.userData.label = spec.name;
    return g;
  };
  Arena.updateIncursionTerminal = function updateIncursionTerminal(g, state, time) {
    if (!g || !g.userData) return;
    const next = palette[state] ? state : 'standby'; g.userData.state = next;
    const color = palette[next], pulse = next === 'intrusion' ? .65 + .35 * ((Math.sin(time * 8 + g.userData.phase) + 1) / 2) : 1;
    g.userData.screenMats.forEach(m => m.color.setHex(color));
    g.userData.ledMats.forEach((m, i) => m.color.setHex(i % 3 === 0 && next === 'locked' ? 0xff3b5f : (i % 2 === 0 ? color : 0x3ddc84)));
    g.scale.y += (1 + (pulse - 1) * .015 - g.scale.y) * .14;
  };
})();
