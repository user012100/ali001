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
  'i.png', 'j.png', 'k.jpeg', 'l.png', 'm.jpg', 'n.png', 'o.JPG', 'p.png',
  'q.png', 'r.png', 's.png', 't.png', 'u.jpg', 'v.jpg',
].map((name) => 'assets/' + encodeURIComponent(name));

const grid = document.getElementById('grid');
let lastSrc = null;

const isVideo = (src) => /\.(mp4|webm|mov)$/i.test(src);

function pickRandom() {
  let src;
  do {
    src = MEDIA[Math.floor(Math.random() * MEDIA.length)];
  } while (src === lastSrc && MEDIA.length > 1);
  lastSrc = src;
  return src;
}

function createMedia(src) {
  if (isVideo(src)) {
    const video = document.createElement('video');
    video.src = src;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});
    return video;
  }
  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  img.draggable = false;
  return img;
}

function toggleCell(cell) {
  const existing = cell.firstElementChild;
  if (existing) {
    existing.remove();
  } else {
    cell.appendChild(createMedia(pickRandom()));
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
