/* =====================================================================
   progression.js — carreira offline, recordes, desafios e cosméticos.
   Nenhuma informação é enviada para fora do dispositivo.
   ===================================================================== */
(() => {
'use strict';
window.Arena = window.Arena || {};

const STORAGE_KEY = 'arenaFpsCareer:v1';
const CHALLENGES = [
  { id: 'kills', title: 'ELIMINAÇÃO EM SÉRIE', detail: 'Consiga 20 abates', goal: 20, event: 'kill', mode: 'sum' },
  { id: 'waves', title: 'AVANÇO TÁTICO', detail: 'Alcance a onda 5', goal: 5, event: 'wave', mode: 'max' },
  { id: 'objectives', title: 'OPERADOR DE CAMPO', detail: 'Conclua 2 objetivos', goal: 2, event: 'objective', mode: 'sum' }
];
const ACHIEVEMENTS = [
  { id: 'veteran', title: 'VETERANO', detail: 'Alcance a onda 5', test: p => p.totals.bestWave >= 5, skin: 'violet' },
  { id: 'headhunter', title: 'CAÇADOR', detail: 'Consiga 50 abates', test: p => p.totals.kills >= 50 },
  { id: 'bossbreaker', title: 'QUEBRA-CHEFES', detail: 'Derrote um chefe', test: p => p.totals.bosses >= 1, skin: 'gold' },
  { id: 'operator', title: 'ESPECIALISTA', detail: 'Conclua 3 objetivos', test: p => p.totals.objectives >= 3, skin: 'mint' },
  { id: 'chain', title: 'REAÇÃO EM CADEIA', detail: 'Alcance combo x5', test: p => p.totals.bestCombo >= 5 },
  { id: 'daily', title: 'TURNO COMPLETO', detail: 'Conclua os três desafios do dia', test: p => p.daily.completed.length >= CHALLENGES.length, skin: 'aurora' }
];
const SKINS = {
  neon: { label: 'Neon original', achievement: null },
  violet: { label: 'Pulso violeta', achievement: 'veteran' },
  gold: { label: 'Circuito dourado', achievement: 'bossbreaker' },
  mint: { label: 'Fóton menta', achievement: 'operator' },
  aurora: { label: 'Aurora', achievement: 'daily' }
};
const empty = () => ({
  version: 1,
  totals: { runs: 0, kills: 0, objectives: 0, bosses: 0, waves: 0, bestWave: 0, bestCombo: 1, score: 0 },
  records: {}, achievements: [], unlockedSkins: ['neon'], selectedSkin: 'neon',
  daily: { day: '', progress: {}, completed: [] }
});
const safeNumber = n => Number.isFinite(+n) ? +n : 0;

Arena.createCareerStore = storageArg => {
  let storage = storageArg;
  if (!storage) { try { storage = window.localStorage; } catch (_) { storage = null; } }
  let profile = empty();
  try {
    const raw = storage && storage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      profile = { ...empty(), ...parsed,
        totals: { ...empty().totals, ...(parsed.totals || {}) },
        records: parsed.records && typeof parsed.records === 'object' ? parsed.records : {},
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
        unlockedSkins: Array.isArray(parsed.unlockedSkins) ? parsed.unlockedSkins : ['neon'],
        daily: { ...empty().daily, ...(parsed.daily || {}) }
      };
    }
  } catch (_) { profile = empty(); }
  const persist = () => { try { if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch (_) {} };
  const clone = () => JSON.parse(JSON.stringify(profile));
  const unlock = id => {
    if (!profile.achievements.includes(id)) profile.achievements.push(id);
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (achievement?.skin && !profile.unlockedSkins.includes(achievement.skin)) profile.unlockedSkins.push(achievement.skin);
  };
  const evaluate = () => {
    const earned = [];
    for (const a of ACHIEVEMENTS) {
      if (a.id !== 'daily' && a.test(profile) && !profile.achievements.includes(a.id)) { unlock(a.id); earned.push(a.id); }
    }
    if (profile.daily.completed.length >= CHALLENGES.length && !profile.achievements.includes('daily')) { unlock('daily'); earned.push('daily'); }
    return earned;
  };
  const challengeRows = () => CHALLENGES.map(c => ({ ...c, progress: Math.min(c.goal, safeNumber(profile.daily.progress[c.id])), complete: profile.daily.completed.includes(c.id) }));
  const updateChallenges = (event, amount) => {
    for (const c of CHALLENGES) {
      if (c.event !== event) continue;
      const old = safeNumber(profile.daily.progress[c.id]);
      profile.daily.progress[c.id] = c.mode === 'max' ? Math.max(old, amount) : old + amount;
      if (profile.daily.progress[c.id] >= c.goal && !profile.daily.completed.includes(c.id)) profile.daily.completed.push(c.id);
    }
  };
  return {
    get: clone,
    challenges: challengeRows,
    achievements: () => ACHIEVEMENTS.map(a => ({ ...a, complete: profile.achievements.includes(a.id) })),
    skins: () => Object.entries(SKINS).map(([id, s]) => ({ id, label: s.label, unlocked: profile.unlockedSkins.includes(id) })),
    beginDay(day = new Date().toISOString().slice(0, 10)) {
      if (profile.daily.day !== day) profile.daily = { day, progress: {}, completed: [] };
      persist(); return challengeRows();
    },
    event(type, value = {}) {
      let amount = 1;
      if (type === 'kill') { profile.totals.kills++; updateChallenges('kill', 1); if (value.boss) profile.totals.bosses++; }
      else if (type === 'wave') { amount = safeNumber(value.wave); profile.totals.waves++; profile.totals.bestWave = Math.max(profile.totals.bestWave, amount); updateChallenges('wave', amount); }
      else if (type === 'objective') { profile.totals.objectives++; updateChallenges('objective', 1); }
      else if (type === 'combo') profile.totals.bestCombo = Math.max(profile.totals.bestCombo, safeNumber(value.combo));
      const earned = evaluate(); persist(); return earned;
    },
    finishRun(run) {
      profile.totals.runs++;
      profile.totals.score += safeNumber(run.score);
      const key = Arena.recordKey(run.mode, run.difficulty);
      const previous = safeNumber(profile.records[key]);
      if (safeNumber(run.score) > previous) profile.records[key] = safeNumber(run.score);
      profile.totals.bestWave = Math.max(profile.totals.bestWave, safeNumber(run.wave));
      const earned = evaluate(); persist(); return { best: safeNumber(profile.records[key]), newRecord: safeNumber(run.score) > previous, earned };
    },
    selectSkin(id) {
      if (!SKINS[id] || !profile.unlockedSkins.includes(id)) return false;
      profile.selectedSkin = id; persist(); return true;
    }
  };
};
Arena.CAREER_CHALLENGES = CHALLENGES.map(c => ({ ...c }));
Arena.CAREER_ACHIEVEMENTS = ACHIEVEMENTS.map(({ id, title, detail, skin }) => ({ id, title, detail, skin: skin || null }));
})();
