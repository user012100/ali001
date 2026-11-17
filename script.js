var MOBILE_CELL_SIZE = 50;
var DESKTOP_CELL_SIZE = 150;
var MOBILE_MAX_WIDTH = 768;

var screenWidth = Math.min(window.screen.width, window.innerWidth);
var CELL_SIZE = DESKTOP_CELL_SIZE;
if (screenWidth <= MOBILE_MAX_WIDTH) {
  CELL_SIZE = MOBILE_CELL_SIZE;
}

var files = [
  'a.jpeg', 'b.jpeg', 'c.jpeg', 'd.png', 'e.jpg', 'f.png', 'g.mp4', 'h.png',
  'i.jpeg', 'j.png', 'k.jpeg', 'l.jpg', 'm.jpg', 'n.mp4', 'o.jpg', 'p.png',
  'r.png', 's.mp4', 't.png', 'u.jpeg', 'v.jpg', 'w.jpg', 'x.jpeg', 'y.jpg'
];

var MEDIA = [];
for (var i = 0; i < files.length; i++) {
  MEDIA.push('assets/' + files[i]);
}

var grid = document.getElementById('grid');
grid.style.setProperty('--cell-size', CELL_SIZE + 'px');

var deck = [];

function isVideo(src) {
  return src.indexOf('.mp4') !== -1;
}

function shuffle(list) {
  for (var i = list.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = list[i];
    list[i] = list[j];
    list[j] = temp;
  }
  return list;
}

function getVisibleSources() {
  var visible = [];
  var cells = grid.querySelectorAll('.cell');
  for (var i = 0; i < cells.length; i++) {
    if (cells[i].currentSrc) {
      visible.push(cells[i].currentSrc);
    }
  }
  return visible;
}

function pickNext() {
  var visible = getVisibleSources();

  for (var attempt = 0; attempt < 2; attempt++) {
    if (deck.length === 0) {
      deck = shuffle(MEDIA.slice());
    }
    for (var i = 0; i < deck.length; i++) {
      if (visible.indexOf(deck[i]) === -1) {
        return deck.splice(i, 1)[0];
      }
    }
    deck = [];
  }

  return MEDIA[Math.floor(Math.random() * MEDIA.length)];
}

function createMedia(src) {
  var el;
  if (isVideo(src)) {
    el = document.createElement('video');
    el.src = src;
    el.autoplay = true;
    el.loop = true;
    el.muted = true;
    el.playsInline = true;
    try {
      el.play();
    } catch (err) {
    }
  } else {
    el = document.createElement('img');
    el.src = src;
    el.alt = '';
    el.draggable = false;
  }
  return el;
}

function toggleCell(cell) {
  if (cell.firstChild) {
    cell.removeChild(cell.firstChild);
    cell.currentSrc = '';
  } else {
    var src = pickNext();
    cell.appendChild(createMedia(src));
    cell.currentSrc = src;
  }
}

function buildGrid() {
  var width = Math.max(window.innerWidth, window.screen.width);
  var height = Math.max(window.innerHeight, window.screen.height);
  var cols = Math.ceil(width / CELL_SIZE);
  var rows = Math.ceil(height / CELL_SIZE);
  var total = cols * rows;

  for (var i = 0; i < total; i++) {
    var cell = document.createElement('div');
    cell.className = 'cell';
    cell.addEventListener('pointerenter', function (event) {
      if (event.pointerType !== 'touch') {
        toggleCell(event.currentTarget);
      }
    });
    grid.appendChild(cell);
  }
}

var lastTouchCell = null;

function handleTouchMove(event) {
  if (event.pointerType !== 'touch') return;
  var element = document.elementFromPoint(event.clientX, event.clientY);
  var cell = element ? element.closest('.cell') : null;
  if (cell && cell !== lastTouchCell) {
    lastTouchCell = cell;
    toggleCell(cell);
  }
}

function handleTouchEnd(event) {
  if (event.pointerType === 'touch') {
    lastTouchCell = null;
  }
}

grid.addEventListener('pointerdown', handleTouchMove);
grid.addEventListener('pointermove', handleTouchMove);
grid.addEventListener('pointerup', handleTouchEnd);
grid.addEventListener('pointercancel', handleTouchEnd);

buildGrid();