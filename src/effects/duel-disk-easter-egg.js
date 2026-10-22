// Start-screen easter egg. Hold "Start Duel Setup" for DISK_PRESS_MS (the
// button spins up like a duel disk booting) and a secret Duel Disk mini-game
// opens on its own screen (src/game/duel-disk-game.js). The click that
// follows the hold is swallowed so character setup doesn't open.
const DISK_PRESS_MS = 2000;

const diskEgg = { timer: null, swallowClick: false };

function startDiskPress(el) {
  diskEgg.swallowClick = false;
  clearTimeout(diskEgg.timer);
  el.classList.add('disk-charging');
  diskEgg.timer = setTimeout(() => {
    el.classList.remove('disk-charging');
    diskEgg.swallowClick = true;
    openDuelDisk();
  }, DISK_PRESS_MS);
}

function cancelDiskPress(el) {
  clearTimeout(diskEgg.timer);
  el.classList.remove('disk-charging');
}

// The Start button's onclick asks this first: false right after a hold.
function diskAllowsClick() {
  if (!diskEgg.swallowClick) return true;
  diskEgg.swallowClick = false;
  return false;
}

function openDuelDisk() {
  newDiskGame();
  setState({ screen: SCREENS.DISK });
}

function closeDuelDisk() {
  endDiskSession();
  setState({ screen: SCREENS.START });
}
