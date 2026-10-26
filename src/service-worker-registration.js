// Registers the service worker and shows an "update available" banner when a
// new version has been downloaded. The new version only takes over when the
// player taps "Update", so the app never reloads in the middle of a duel.
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;
const UPDATE_FALLBACK_RELOAD_MS = 3000;

let updateAccepted = false;
let updateWorker = null;

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
      watchForUpdates(reg);
    } catch {}
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!updateAccepted) return;
    updateAccepted = false;
    window.location.reload();
  });
}

function watchForUpdates(reg) {
  // An update downloaded in an earlier visit is still waiting.
  if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);

  reg.addEventListener('updatefound', () => {
    const worker = reg.installing;
    worker?.addEventListener('statechange', () => {
      // No controller = first install, nothing to update from.
      if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner(worker);
    });
  });

  const check = () => reg.update().catch(() => {});
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
  setInterval(check, UPDATE_CHECK_INTERVAL_MS);
}

function showUpdateBanner(worker) {
  updateWorker = worker;
  if (document.getElementById('update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.setAttribute('role', 'status');
  banner.className = 'update-banner fixed left-3 right-3 mx-auto max-w-md rounded-2xl border border-amber-500/50 bg-slate-900/95 backdrop-blur shadow-2xl shadow-black/40 p-3 flex items-center gap-3';
  banner.innerHTML = `
    <span class="update-banner-icon text-2xl" aria-hidden="true">✨</span>
    <div class="flex-1 min-w-0">
      <p class="font-bold text-white text-sm leading-tight">New version available</p>
      <p class="text-xs text-slate-400 mt-0.5">Your duel is saved, so it's safe to update.</p>
    </div>
    <button type="button" data-update-later class="text-xs font-semibold text-slate-400 hover:text-white px-2 py-2">Later</button>
    <button type="button" data-update-now class="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition">Update</button>
  `;
  banner.querySelector('[data-update-later]').addEventListener('click', hideUpdateBanner);
  banner.querySelector('[data-update-now]').addEventListener('click', event => applyUpdate(event.currentTarget));
  document.body.appendChild(banner);
}

function hideUpdateBanner() {
  const banner = document.getElementById('update-banner');
  if (!banner) return;
  banner.classList.add('update-banner--out');
  setTimeout(() => banner.remove(), 300);
}

function applyUpdate(button) {
  if (!updateWorker) return;
  updateAccepted = true;
  button.disabled = true;
  button.textContent = 'Updating…';
  updateWorker.postMessage({ type: 'SKIP_WAITING' });
  // Safety net in case "controllerchange" never fires.
  setTimeout(() => window.location.reload(), UPDATE_FALLBACK_RELOAD_MS);
}
