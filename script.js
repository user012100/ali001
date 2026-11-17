var MOBILE_MAX_WIDTH = 768;
var MOBILE_COLUMNS = 5;
var DESKTOP_CELL_SIZE = 160;
var COOLDOWN = 10;

var ARENA_API_URL = 'https://api.are.na/v2/channels/ali001?per=100';

var grid = document.getElementById('grid');
var isMobile = Math.min(window.screen.width, window.innerWidth) <= MOBILE_MAX_WIDTH;

var cellWidth = 0;
var cellHeight = 0;

var MEDIA = [];
var deck = [];
var recentlyShown = [];

function loadMedia() {
  fetch(ARENA_API_URL)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      var blocks = data.contents;
      for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i];
        if (block.class === 'Image' && block.image) {
          MEDIA.push(block.image.large.url);
        } else if (block.class === 'Attachment' && block.attachment &&
          block.attachment.content_type.indexOf('video') === 0) {
          MEDIA.push(block.attachment.url);
        }
      }
      buildGrid();
    })
    .catch(function (error) {
      console.error('Could not load media from Are.na', error);
    });
}

function isVideo(url) {
  return url.indexOf('.mp4') !== -1;
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

function rememberShown(src) {
  recentlyShown.push(src);
  if (recentlyShown.length > COOLDOWN) {
    recentlyShown.shift();
  }
}

function pickNext() {
  var visible = getVisibleSources();

  for (var attempt = 0; attempt < 2; attempt++) {
    if (deck.length === 0) {
      deck = shuffle(MEDIA.slice());
    }

    var okIndex = -1;
    for (var i = 0; i < deck.length; i++) {
      if (recentlyShown.indexOf(deck[i]) !== -1) continue;
      if (okIndex === -1) okIndex = i;
      if (visible.indexOf(deck[i]) === -1) {
        okIndex = i;
        break;
      }
    }

    if (okIndex !== -1) {
      var src = deck.splice(okIndex, 1)[0];
      rememberShown(src);
      return src;
    }

    deck = [];
  }

  var fallback = MEDIA[Math.floor(Math.random() * MEDIA.length)];
  rememberShown(fallback);
  return fallback;
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

function addCell() {
  var cell = document.createElement('div');
  cell.className = 'cell';
  cell.addEventListener('pointerenter', function (event) {
    if (event.pointerType !== 'touch') {
      toggleCell(event.currentTarget);
    }
  });
  grid.appendChild(cell);
}

function setCellCount(total) {
  while (grid.children.length > total) {
    grid.removeChild(grid.lastElementChild);
  }
  while (grid.children.length < total) {
    addCell();
  }
}

function buildGrid() {
  var width = window.innerWidth;
  var height = window.innerHeight;

  var cols = isMobile ? MOBILE_COLUMNS : Math.max(1, Math.round(width / DESKTOP_CELL_SIZE));
  cellWidth = width / cols;

  var rows = Math.max(1, Math.round(height / cellWidth));
  cellHeight = height / rows;

  grid.style.setProperty('--cell-width', cellWidth + 'px');
  grid.style.setProperty('--cell-height', cellHeight + 'px');
  grid.style.width = width + 'px';
  grid.style.height = height + 'px';

  setCellCount(cols * rows);
}

function handleResize() {
  if (Math.min(window.screen.width, window.innerWidth) <= MOBILE_MAX_WIDTH) return;

  var width = window.innerWidth;
  var height = window.innerHeight;

  grid.style.width = width + 'px';
  grid.style.height = height + 'px';

  var cols = Math.ceil(width / cellWidth);
  var rows = Math.ceil(height / cellHeight);
  setCellCount(cols * rows);
}

window.addEventListener('resize', handleResize);

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

loadMedia();
