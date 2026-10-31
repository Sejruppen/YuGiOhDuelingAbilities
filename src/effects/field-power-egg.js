// Duelist's Road easter egg: hold the 🗺️ in the header for START_EGG_PRESS_MS.
// "Field Power Bonus!", the Duelist Kingdom rule from the anime. The map
// strip unfolds and a 📍 hops across Forest, Mountain, Sea, Meadow and
// Wasteland. At each stop the terrain fills the screen and a matching
// monster gets +30% ATK. Last stop: Skull Servant, 300 → 390. Still pathetic.
// Timeline: the FIELD POWER BONUS section of effects.css.
const FIELD_POWER_EGG_MS = 11500;
const FP_FIRST_STOP_MS = 1600;
const FP_STOP_MS = 1500;

const FP_STOPS = [
  { field: 'forest', name: 'Forest', icon: '🌲', monster: '🪲', card: 'Basic Insect', type: 'Insect', atk: 500, mote: '🍃' },
  { field: 'mountain', name: 'Mountain', icon: '⛰️', monster: '🦅', card: 'Harpie Lady', type: 'Winged Beast', atk: 1300, mote: '☁️' },
  { field: 'sea', name: 'Sea', icon: '🌊', monster: '🦈', card: 'Great White', type: 'Fish', atk: 1600, mote: '🫧' },
  { field: 'meadow', name: 'Meadow', icon: '🌾', monster: '🧝', card: 'Celtic Guardian', type: 'Warrior', atk: 1400, mote: '🌼' },
  { field: 'wasteland', name: 'Wasteland', icon: '🏜️', monster: '💀', card: 'Skull Servant', type: 'Zombie', atk: 300, mote: '🌵' }
];

function playFieldPowerEgg() {
  markEggFound('field-power');
  playSound({ name: 'egg-field-power' });
  const last = FP_STOPS.length - 1;
  const at = i => FP_FIRST_STOP_MS + i * FP_STOP_MS;
  const fields = FP_STOPS.map((s, i) =>
    `<div class="fp-field fp-field--${s.field}" style="--at: ${at(i)}ms; --len: ${i === last ? 9600 - at(i) : FP_STOP_MS + 200}ms;"></div>`).join('');
  const slots = FP_STOPS.map((s, i) =>
    `<span class="fp-slot" style="--at: ${at(i)}ms;"><span class="ce-emoji">${s.icon}</span></span>`).join('');
  const motes = FP_STOPS.map((s, i) => ceRange(fxCount(8), () =>
    `<span class="fp-mote ce-emoji" style="left: ${ceRand(4, 92).toFixed(0)}%; top: ${ceRand(30, 92).toFixed(0)}%; --at: ${(at(i) + ceRand(0, 600)).toFixed(0)}ms; --dx: ${ceRand(-40, 40).toFixed(0)}px; --r: ${ceRand(-200, 200).toFixed(0)}deg;">${s.mote}</span>`)).join('');
  const stops = FP_STOPS.map((s, i) => `
    <div class="ce-at fp-stop fp-stop--${s.field}" style="--at: ${at(i)}ms; --len: ${i === last ? 2000 : FP_STOP_MS}ms;">
      <span class="fp-label"><span class="ce-emoji">${s.icon}</span> ${s.name} powers up ${s.type}s</span>
      <div class="fp-card">
        <span class="fp-card-name">${s.card}</span>
        <span class="fp-card-art"><span class="ce-emoji">${s.monster}</span></span>
        <span class="fp-card-type">[${s.type}]</span>
        <span class="fp-card-atk">ATK/<span class="fp-num"><s class="fp-old">${s.atk}</s><b class="fp-new">${Math.round(s.atk * 1.3)}</b></span></span>
      </div>
      <span class="fp-boost">+30% FIELD POWER!</span>
      ${i === last ? '<span class="fp-meh">…still pathetic.</span>' : ''}
    </div>`).join('');
  spawnStartEgg('field-power', FIELD_POWER_EGG_MS, `
    <div class="fp-bg"></div>
    ${fields}
    ${motes}
    <div class="ce-at fp-title">FIELD POWER<br>BONUS!</div>
    <div class="ce-at fp-map">${slots}<span class="fp-pin ce-emoji">📍</span></div>
    ${stops}
    <div class="cegg-toast">Field Power Bonus!<small>In Duelist Kingdom the terrain picks favourites: +30% ATK if your monster feels at home.</small></div>`);
}
