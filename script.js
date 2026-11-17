const MOBILE_CELL_SIZE = 50;
const DESKTOP_CELL_SIZE = 150;
const MOBILE_MAX_WIDTH = 768;

// Picked once on load, so the size never changes afterwards
const CELL_SIZE =
  Math.min(window.screen.width, window.innerWidth) <= MOBILE_MAX_WIDTH
    ? MOBILE_CELL_SIZE
    : DESKTOP_CELL_SIZE;

// Static sites can't list a folder, so the media files are listed here.
const MEDIA = [
  'a.JPG', 'b.jpeg', 'c.jpg', 'd.png', 'e.jpg', 'f.png', 'g.mp4', 'h.png',
  'i.JPG', 'j.png', 'k.jpeg', 'l.png', 'm.jpg', 'n.png', 'o.JPG', 'o.png',
  'p.png', 'r.png', 's.mov', 't.png', 'u.jpg', 'v.jpg', 'w.JPG', 'x.JPG', 'y.jpg',
].map((name) => 'assets/' + encodeURIComponent(name));

const grid = document.getElementById('grid');
let deck = [];

const isVideo = (src) => /\.(mp4|webm|mov)$/i.test(src);

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// Draws from a shuffled deck so every item shows once before any repeats,
// and skips anything currently visible on screen.
function pickNext() {
  const visible = new Set(
    Array.from(grid.querySelectorAll('[data-src]'), (el) => el.dataset.src)
  );

  for (let attempt = 0; attempt < 2; attempt++) {
    if (deck.length === 0) deck = shuffle(MEDIA.slice());
    const index = deck.findIndex((src) => !visible.has(src));
    if (index !== -1) return deck.splice(index, 1)[0];
    deck = [];
  }

  // Every item is already on screen
  return MEDIA[Math.floor(Math.random() * MEDIA.length)];
}

function createMedia(src) {
  let el;
  if (isVideo(src)) {
    el = document.createElement('video');
    el.src = src;
    el.autoplay = true;
    el.loop = true;
    el.muted = true;
    el.playsInline = true;
    el.play().catch(() => {});
  } else {
    el = document.createElement('img');
    el.src = src;
    el.alt = '';
    el.draggable = false;
  }
  el.dataset.src = src;
  return el;
}

function toggleCell(cell) {
  const existing = cell.firstElementChild;
  if (existing) {
    existing.remove();
  } else {
    cell.appendChild(createMedia(pickNext()));
  }
}

function buildGrid() {
  // Sized once on load from the larger of the window and the screen resolution
  const width = Math.max(window.innerWidth, window.screen.width);
  const height = Math.max(window.innerHeight, window.screen.height);
  const cols = Math.max(1, Math.ceil(width / CELL_SIZE));
  const rows = Math.max(1, Math.ceil(height / CELL_SIZE));

  grid.style.gridTemplateColumns = `repeat(${cols}, ${CELL_SIZE}px)`;
  grid.style.gridTemplateRows = `repeat(${rows}, ${CELL_SIZE}px)`;

  const needed = cols * rows;
  while (grid.children.length > needed) grid.lastElementChild.remove();
  while (grid.children.length < needed) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'touch') toggleCell(cell);
    });
    grid.appendChild(cell);
  }
}

// Touch pointers are captured by the first cell, so track the finger manually
let lastTouchCell = null;

function touchOver(e) {
  if (e.pointerType !== 'touch') return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const cell = el && el.closest('.cell');
  if (cell && cell !== lastTouchCell) {
    lastTouchCell = cell;
    toggleCell(cell);
  }
}

function touchEnd(e) {
  if (e.pointerType === 'touch') lastTouchCell = null;
}

grid.addEventListener('pointerdown', touchOver);
grid.addEventListener('pointermove', touchOver);
grid.addEventListener('pointerup', touchEnd);
grid.addEventListener('pointercancel', touchEnd);

buildGrid();
