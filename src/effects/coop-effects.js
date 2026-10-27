// Co-op Boss visual effects. They run right after a render (see commitCoop),
// so they can find the freshly drawn elements.
const coopEl = selector => document.querySelector(selector);

function fxCoopPlayerHit(i, amount) {
  const el = coopEl(`[data-coop-lp="${i}"]`);
  if (!el) return;
  restartClass(el, 'coop-shake', 500);
  spawnFloatText(el, `-${amount}`, 'damage');
  spawnParticles(el, { type: 'comeback', mode: 'spark', count: 10 });
}

function fxCoopPlayerHeal(i, amount) {
  const el = coopEl(`[data-coop-lp="${i}"]`);
  if (!el) return;
  spawnFloatText(el, `+${amount}`, 'heal');
  spawnParticles(el, { type: 'heal', mode: 'rise', count: 12 });
}

function fxCoopFallen(i) {
  const el = coopEl(`[data-coop-lp="${i}"]`);
  if (el) spawnParticles(el, { type: 'defeat', mode: 'burst', count: 18 });
  spawnFx('fx-coop-fallen', 1200);
}

function fxCoopBossHit(amount) {
  const el = coopEl('[data-coop-boss]');
  if (!el) return;
  restartClass(el, 'coop-shake', 500);
  spawnFloatText(el, `-${amount}`, 'damage');
  spawnParticles(el, { type: 'quest', mode: 'burst', count: 14 });
}

function fxCoopBurst(selector, type) {
  const el = coopEl(selector);
  if (el) spawnParticles(el, { type, mode: 'burst', count: 20 });
}

function fxCoopSquash(uid) {
  const el = coopEl(`[data-coop-g="${uid}"]`);
  if (!el) return;
  restartClass(el, 'coop-squash', 700);
  spawnParticles(el, { type: 'skill', mode: 'spark', count: 8 });
}

function fxCoopPage() {
  const el = coopEl('[data-coop-book]') || coopEl('[data-coop-field]');
  if (!el) return;
  restartClass(el, 'coop-shake', 500);
  spawnParticles(el, { type: 'quest', mode: 'rise', count: 14 });
}

function fxCoopBond() {
  const el = coopEl('[data-coop-bond]');
  if (!el) return;
  restartClass(el, 'coop-bond-glow', 900);
  spawnParticles(el, { type: 'skill', mode: 'spark', count: 10 });
}

function fxCoopStage(stage) {
  spawnFx(`fx-coop-stage fx-coop-stage--${stage}`, 1600, { html: '<span class="fx-coop-stage-eye">👁️</span>' });
}

function fxCoopVictory() {
  spawnFx('fx-coop-victory', 2600, { html: '<span class="fx-coop-victory-eye">👁️</span>' });
  spawnParticles(document.body, { type: 'quest', mode: 'rain', count: 50 });
}
