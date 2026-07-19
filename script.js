let projects = [
  { title: "XD Magazine", year: 2026, url: "https://xdmag.com", orbitAngle: 5.4, orbitSpeed: 0.0015, size: 74 },
  { title: "Joanna", year: 2026, url: "https://joannaistanbul.com", orbitAngle: 4.5, orbitSpeed: 0.0015, size: 74 },
  { title: "[untold]", year: 2026, url: "untold/", orbitAngle: 3.6, orbitSpeed: 0.0015, size: 74 },
  { title: "Gossip", year: 2026, url: "gossip/", orbitAngle: 2.7, orbitSpeed: 0.0015, size: 74 },
  { title: "Persistence of Color", year: 2025, url: "persistence-of-color/", orbitAngle: 1.8, orbitSpeed: 0.0015, size: 74 },
  { title: "Cult of the Ugly", year: 2025, url: "cult-of-the-ugly/", orbitAngle: 0.9, orbitSpeed: 0.0015, size: 74 },
  { title: "Nick Lambrou", year: 2025, url: "https://nlambrou.com", orbitAngle: 0, orbitSpeed: 0.0015, size: 74 }
];

let skyImg;
let citrusImg;
let orbReflectShader;

let selectedIndex = -1;
let keyboardFocusIndex = -1;
let timeScale = 1;
const TIME_SCALE_EASE = 0.06;
let orbLabelEl;
let orbLinkEl;

let blackHole = { screenX: 0, screenY: 0, screenRadius: 0, screenVisible: false };

let labelContentIndex = -1;
let labelPhase = 'idle';
let labelFadeOutUntil = 0;
const LABEL_FADE_MS = 250;
const LABEL_EDGE_PADDING = 16;

const ORBIT_MAJOR_RADIUS = 380;
const ORBIT_MINOR_RADIUS = 210;
const ORBIT_CONTENT_RADIUS = ORBIT_MAJOR_RADIUS + 90;

let camYaw = Math.PI;
const CAM_AUTO_ROTATE_SPEED = 0.0009;
const CAMERA_YAW_DRAG_SENSITIVITY = 0.00025;

const CAMERA_DRAG_CLICK_THRESHOLD = 8;
let isDraggingCamera = false;
let dragMoved = false;
let dragStartX = 0;
let dragStartY = 0;
let lastTouchDragX = null;
let lastTouchDragY = null;

const ORBIT_SPIN_DRAG_SENSITIVITY = 0.0022;
const ORBIT_SPIN_VELOCITY_EASE = 0.15;
const ORBIT_SPIN_INERTIA_DAMPING = 0.04;
let orbitSpinAngle = 0;
let orbitSpinVelocity = 0;

const CAMERA_TILT_MAX_DEG = 25;
const CAMERA_TILT_SENSITIVITY = 0.0011;
const CAMERA_TILT_EASE = 0.18;
const CAMERA_TILT_VELOCITY_EASE = 0.3;
const CAMERA_TILT_INERTIA_DAMPING = 0.02;
let camTiltX = 0;
let camTiltZ = 0;
let camTiltXBase = 0;
let camTiltZBase = 0;
let camTiltTargetX = 0;
let camTiltTargetZ = 0;
let camTiltVelocityX = 0;

const IS_TOUCH_DEVICE = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

const SKYBOX_MIN_BRIGHTNESS = 0.5;

const LIGHT_MIX_EASE = 0.08;
const VISITED_MIX_EASE = 0.05;

const HALO_SCALE = IS_TOUCH_DEVICE ? 1.2 : 1.15;
const HALO_DEPTH_OFFSET_RATIO = 0.35;

const BLACK_HOLE_SIZE = 28;
const BLACK_HOLE_PULSE_AMPLITUDE = 5;
const BLACK_HOLE_PULSE_SPEED = 0.012;
let blackHolePulsePhase = 0;

const BLACK_HOLE_HOVER_SCALE = 3;
const BLACK_HOLE_HOVER_EASE = 0.05;
let blackHoleHoverScale = 1;

const ORBIT_HOVER_SLOWDOWN = 0.15;
const ORBIT_HOVER_EASE = 0.05;
let orbitHoverScale = 1;

let scrollTouchStartY = null;
let scrollTouchLastY = null;
let scrollTouchLastX = null;

const BIO_SCROLL_SENSITIVITY = 0.0016;
const BIO_TOUCH_SENSITIVITY = 0.0022;
const BIO_REVEAL_EASE = 0.12;
const BIO_REVEAL_CLOSE_FAST_EASE = 0.5;
const BIO_REVEAL_CLOSE_FAST_THRESHOLD = 0.67;
const BIO_REVEAL_OPEN_SETTLE_EASE = 0.03;
const BIO_WHEEL_IDLE_MS = 350;
let bioRevealTarget = 0;
let bioRevealProgress = 0;
let bioCloseDotRevealed = false;
let bioGestureActive = false;
let bioGestureAnchor = 0;
let bioLastScrollDirection = 0;
let bioWheelIdleTimer = null;

function computeFitDistance(vFov, aspect) {
  let distForHeight = ORBIT_CONTENT_RADIUS / Math.tan(vFov / 2);
  let dist = distForHeight;
  if (aspect >= 1) {
	let distForWidth = ORBIT_CONTENT_RADIUS / (Math.tan(vFov / 2) * aspect);
	dist = Math.max(distForHeight, distForWidth);
  }
  dist *= 1.15;
  if (IS_TOUCH_DEVICE) dist *= 1.45;
  return dist;
}

function computeLoadDotDiameter() {
  let w = window.innerWidth;
  let h = window.innerHeight;
  let vFov = 2 * Math.atan((h / 2) / 800);
  let dist = computeFitDistance(vFov, w / h);
  dist = Math.min(Math.max(dist, 500), 4000);
  return (BLACK_HOLE_SIZE * 800) / dist;
}

function sizeDotElement(dot) {
  if (!dot) return;
  let diameter = computeLoadDotDiameter();
  dot.style.width = diameter + 'px';
  dot.style.height = diameter + 'px';
  dot.style.marginLeft = (-diameter / 2) + 'px';
  dot.style.marginTop = (-diameter / 2) + 'px';
}

function sizeLoadDot() {
  sizeDotElement(document.getElementById('load-dot'));
}
sizeLoadDot();

function computeDotHitDiameter() {
  let visualRadius = computeLoadDotDiameter() / 2;
  let hitRadius = IS_TOUCH_DEVICE ? Math.max(visualRadius * 1.1, 36) * 1.5 : Math.max(visualRadius * 1.6, 44);
  return hitRadius * 2;
}

function sizeDotHitElement(dot) {
  if (!dot) return;
  let diameter = computeDotHitDiameter();
  dot.style.width = diameter + 'px';
  dot.style.height = diameter + 'px';
  dot.style.marginLeft = (-diameter / 2) + 'px';
  dot.style.marginTop = (-diameter / 2) + 'px';
}

const LOAD_DOT_DELAY_MS = 300;
let loadDotShown = false;
let loadDotTimer;
if (IS_TOUCH_DEVICE) {
  let dot = document.getElementById('load-dot');
  if (dot) dot.classList.add('visible');
  loadDotShown = true;
} else {
  loadDotTimer = setTimeout(() => {
	let dot = document.getElementById('load-dot');
	if (dot) dot.classList.add('visible');
	loadDotShown = true;
  }, LOAD_DOT_DELAY_MS);
}

let bioOverlayEl;
let bioCloseDotEl;
let bioCloseDotVisualEl;
let bioCloseDotClosing = false;
let bioLinksContainerEl;
let bioOverlayOpen = false;
let bioLinks = [];
let bioActiveLinks = new Set();

const HALO_COLOR_DEFAULT = [255, 255, 255];
const VISITED_TINT_HEX = ['#D1549E', '#4FAE86', '#C23B2E', '#D9CB55', '#E8703C', '#8C4FE8', '#23264A'];
const VISITED_TINT_COLORS = VISITED_TINT_HEX.map(hexToRgb);
const VISITED_TINT_OPACITY = [1, 1, 1, 1, 1, 1, 0.5];
const VISITED_STORAGE_KEY = 'visitedProjectUrls';

function hexToRgb(hex) {
  let n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const ORB_REFLECT_VERT = `
precision highp float;
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uOrbTranslation;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vWorldPos = aPosition + uOrbTranslation;
  vWorldNormal = aNormal;
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
`;

const ORB_REFLECT_FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uEnvMap;
uniform vec3 uEyePosition;
uniform vec3 uLightDir;
uniform vec3 uTintColor;
uniform float uTintAmount;
uniform float uKeyLightAmount;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;

#define PI 3.14159265359

const vec3 LIGHT_COLOR = vec3(1.0, 0.93, 0.8);

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 incident = normalize(vWorldPos - uEyePosition);
  vec3 r = reflect(incident, normal);
  float u = 0.5 + atan(r.z, r.x) / (2.0 * PI);
  float v = 0.5 + asin(clamp(r.y, -1.0, 1.0)) / PI;
  vec3 envColor = texture2D(uEnvMap, vec2(u, v)).rgb;

  vec3 tintedEnv = mix(envColor, envColor * uTintColor, uTintAmount);

  float fresnel = pow(1.0 - max(dot(normal, -incident), 0.0), 3.0);

  vec3 lightDir = normalize(uLightDir);
  vec3 viewDir = -incident;
  vec3 halfVec = normalize(lightDir + viewDir);
  float specular = pow(max(dot(normal, halfVec), 0.0), 50.0);
  float diffuseWrap = max(dot(normal, lightDir), 0.0) * 0.06;

  vec3 color = tintedEnv + fresnel * 0.65 + LIGHT_COLOR * (specular * 0.8 + diffuseWrap) * uKeyLightAmount;

  gl_FragColor = vec4(color, 1.0);
}
`;

// Skybox texture: "Lonely Road Afternoon Puresky" from Poly Haven (CC0)
// https://polyhaven.com/a/lonely_road_afternoon_puresky
function preload() {
  skyImg = loadImage('assets/lonely_road_afternoon_puresky.jpg');
  // Orb reflection env map: "Citrus Orchard Road Puresky" from Poly Haven (CC0)
  // https://polyhaven.com/a/citrus_orchard_road_puresky
  citrusImg = loadImage('assets/citrus_orchard_road_puresky.jpg');
}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  orbLinkEl = document.getElementById('orb-link');
  orbLinkEl.addEventListener('click', () => {
	if (selectedIndex === -1) return;
	markProjectVisited(projects[selectedIndex]);
  });
  orbLabelEl = document.getElementById('label');
  orbLabelEl.addEventListener('click', (e) => {
	if (labelContentIndex === -1) return;
	markProjectVisited(projects[labelContentIndex]);
  });
  orbLabelEl.addEventListener('touchend', (e) => {
	e.preventDefault();
	e.stopPropagation();
	if (labelContentIndex === -1) return;
	let p = projects[labelContentIndex];
	openInNewTab(p.url);
	markProjectVisited(p);
  }, { passive: false });
  orbReflectShader = createShader(ORB_REFLECT_VERT, ORB_REFLECT_FRAG);
  moveFallbackContentIntoCanvas(cnv.canvas);
  syncProjectsFromDom();
  applyVisitedState();

  bioOverlayEl = document.getElementById('bio-overlay');
  bioLinksContainerEl = document.querySelector('.bio-overlay-links');

  bioCloseDotEl = document.getElementById('bio-close-dot');
  bioCloseDotVisualEl = document.getElementById('bio-close-dot-visual');
  bioCloseDotEl.addEventListener('click', (e) => {
	e.stopPropagation();
	bioCloseDotClosing = true;
	shrinkBioCloseDot();
	closeBioOverlay();
  });
  bioCloseDotEl.addEventListener('touchend', (e) => {
	e.preventDefault();
	e.stopPropagation();
	bioCloseDotClosing = true;
	shrinkBioCloseDot();
	closeBioOverlay();
  }, { passive: false });
  if (!IS_TOUCH_DEVICE) {
	bioCloseDotEl.addEventListener('mouseenter', () => setBioCloseDotHover(true));
	bioCloseDotEl.addEventListener('mouseleave', () => setBioCloseDotHover(false));
  }

  bioLinks = Array.from(document.querySelectorAll('#bio-overlay .bio-overlay-links a'));
  if (IS_TOUCH_DEVICE) {
	bioLinks.forEach((a) => a.classList.add('bio-link-active'));
  } else {
	bioLinks.forEach((a) => {
	  a.addEventListener('mouseenter', () => setBioLinkActive(a, true));
	  a.addEventListener('mouseleave', () => setBioLinkActive(a, false));
	});
	window.addEventListener('resize', renderBioLinksMask);
  }

  bioLinks.forEach((a) => {
	a.addEventListener('touchend', (e) => {
	  e.preventDefault();
	  e.stopPropagation();
	  flashBioLinkTap(a);
	  navigateBioLink(a);
	}, { passive: false });
  });

  window.addEventListener('wheel', handleScrollWheel, { passive: true });
  window.addEventListener('touchstart', handleScrollTouchStart, { passive: true });
  window.addEventListener('touchmove', handleScrollTouchMove, { passive: true });
  window.addEventListener('touchend', handleScrollTouchEnd, { passive: true });

  fadeOutLoadOverlay();
}

function handleScrollWheel(e) {
  updateBioRevealFromInput(e.deltaY * BIO_SCROLL_SENSITIVITY);
  clearTimeout(bioWheelIdleTimer);
  bioWheelIdleTimer = setTimeout(endBioScrollGesture, BIO_WHEEL_IDLE_MS);
}

function handleScrollTouchStart(e) {
  if (e.touches.length !== 1) {
	scrollTouchStartY = null;
	scrollTouchLastY = null;
	scrollTouchLastX = null;
	return;
  }
  scrollTouchStartY = e.touches[0].clientY;
  scrollTouchLastY = scrollTouchStartY;
  scrollTouchLastX = e.touches[0].clientX;
}

function handleScrollTouchMove(e) {
  if (isDraggingCamera && dragMoved) return;
  if (scrollTouchLastY === null || e.touches.length !== 1) return;
  let x = e.touches[0].clientX;
  let y = e.touches[0].clientY;
  let fingerDeltaX = x - scrollTouchLastX;
  let fingerDeltaY = y - scrollTouchLastY;
  scrollTouchLastX = x;
  scrollTouchLastY = y;
  if (Math.abs(fingerDeltaX) > Math.abs(fingerDeltaY)) return;
  updateBioRevealFromInput(-fingerDeltaY * BIO_TOUCH_SENSITIVITY);
}

function handleScrollTouchEnd(e) {
  scrollTouchStartY = null;
  scrollTouchLastY = null;
  scrollTouchLastX = null;
  endBioScrollGesture();
}

function updateBioRevealFromInput(delta) {
  if (delta === 0) return;
  if (!bioGestureActive) {
	bioGestureActive = true;
	bioGestureAnchor = (bioRevealTarget > 0.5) ? 1 : 0;
  }
  bioLastScrollDirection = (delta > 0) ? 1 : -1;
  bioRevealTarget = Math.min(1, Math.max(0, bioRevealTarget + delta));
  if (bioRevealTarget > 0 && !bioOverlayOpen) settleBioOpenState();
}

function endBioScrollGesture() {
  if (!bioGestureActive) return;
  bioGestureActive = false;
  let movingAwayFromAnchor = (bioGestureAnchor === 0 && bioLastScrollDirection > 0)
	|| (bioGestureAnchor === 1 && bioLastScrollDirection < 0);
  bioRevealTarget = movingAwayFromAnchor ? (1 - bioGestureAnchor) : bioGestureAnchor;
  if (bioRevealTarget > 0 && !bioOverlayOpen) settleBioOpenState();
}

function updateBioReveal() {
  let closing = bioRevealTarget < bioRevealProgress;
  let growing = bioRevealTarget > bioRevealProgress;
  let ease = BIO_REVEAL_EASE;
  if (closing && bioRevealProgress > BIO_REVEAL_CLOSE_FAST_THRESHOLD) {
	ease = BIO_REVEAL_CLOSE_FAST_EASE;
  } else if (growing && !bioGestureActive) {
	ease = BIO_REVEAL_OPEN_SETTLE_EASE;
  }
  bioRevealProgress = lerp(bioRevealProgress, bioRevealTarget, ease);
  applyBioRevealCss();

  if (bioOverlayOpen && !bioCloseDotRevealed && bioRevealTarget >= 1 && bioRevealProgress >= 0.6) {
	bioCloseDotRevealed = true;
	if (bioCloseDotVisualEl) bioCloseDotVisualEl.style.opacity = 1;
	updateBioCloseDot();
  }

  if (bioOverlayOpen && bioRevealTarget <= 0 && bioRevealProgress < 0.002) {
	bioRevealProgress = 0;
	applyBioRevealCss();
	finalizeBioClose();
  }
}

function applyBioRevealCss() {
  if (!bioOverlayEl) return;
  bioOverlayEl.style.setProperty('--bio-reveal', (bioRevealProgress * 150) + '%');
}

function fadeOutLoadOverlay() {
  clearTimeout(loadDotTimer);
  let overlay = document.getElementById('load-overlay');
  let dot = document.getElementById('load-dot');
  if (!overlay) return;
  if (loadDotShown && !IS_TOUCH_DEVICE) {
	if (dot) {
	  dot.style.transitionDuration = '1.6s';
	  dot.style.opacity = 0;
	}
	requestAnimationFrame(() => {
	  overlay.classList.add('revealed');
	  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
	});
  } else {
	if (dot) {
	  dot.style.transitionDuration = '0.9s';
	  dot.style.opacity = 0;
	}
	requestAnimationFrame(() => {
	  overlay.classList.add('hidden');
	  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
	});
  }
}

function setBioLinkActive(a, active) {
  if (active) bioActiveLinks.add(a);
  else bioActiveLinks.delete(a);
  a.classList.toggle('bio-link-active', active);
  renderBioLinksMask();
}

function renderBioLinksMask() {
  if (IS_TOUCH_DEVICE) return;
  if (!bioOverlayOpen || bioLinks.length === 0) return;
  let vw = window.innerWidth, vh = window.innerHeight;
  let holes = '';
  bioLinks.forEach((a) => {
	if (bioActiveLinks.has(a)) return;
	let rect = a.getBoundingClientRect();
	let cs = getComputedStyle(a);
	let fontSize = parseFloat(cs.fontSize);
	let fontFamily = cs.fontFamily.replace(/"/g, "'");
	let text = escapeXmlText(a.textContent);
	let midY = rect.top + rect.height / 2;
	holes += `<text x='${rect.left}' y='${midY}' dominant-baseline='central' `
	  + `font-family='${fontFamily}' font-size='${fontSize}' font-weight='${cs.fontWeight}' fill='black'>${text}</text>`;
  });
  if (!holes) {
	clearBioLinksMask();
	return;
  }
  let svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${vw}' height='${vh}' viewBox='0 0 ${vw} ${vh}'>`
	+ `<mask id='m'>`
	+ `<rect x='0' y='0' width='${vw}' height='${vh}' fill='white'/>`
	+ holes
	+ `</mask>`
	+ `<rect x='0' y='0' width='${vw}' height='${vh}' fill='white' mask='url(#m)'/>`
	+ `</svg>`;
  let url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  bioOverlayEl.style.maskSize = `${vw}px ${vh}px`;
  bioOverlayEl.style.webkitMaskSize = `${vw}px ${vh}px`;
  bioOverlayEl.style.maskPosition = '0 0';
  bioOverlayEl.style.webkitMaskPosition = '0 0';
  bioOverlayEl.style.maskRepeat = 'no-repeat';
  bioOverlayEl.style.webkitMaskRepeat = 'no-repeat';
  bioOverlayEl.style.maskImage = url;
  bioOverlayEl.style.webkitMaskImage = url;
}

function clearBioLinksMask() {
  bioOverlayEl.style.maskImage = 'none';
  bioOverlayEl.style.webkitMaskImage = 'none';
}

function escapeXmlText(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function openBioOverlay() {
  if (bioOverlayOpen) return;
  bioRevealTarget = 1;
  settleBioOpenState();
}

function settleBioOpenState() {
  bioOverlayOpen = true;
  bioOverlayEl.classList.add('open');
  bioOverlayEl.setAttribute('aria-hidden', 'false');
  document.body.classList.add('bio-open');
  renderBioLinksMask();
  bioCloseDotClosing = false;
  bioCloseDotRevealed = false;
  shrinkBioCloseDot();
}

function updateBioCloseDot() {
  sizeDotHitElement(bioCloseDotEl);
  sizeDotElement(bioCloseDotVisualEl);
}

function setBioCloseDotHover(hovering) {
  if (!bioCloseDotVisualEl) return;
  if (bioCloseDotClosing) return;
  let diameter = computeLoadDotDiameter() * (hovering ? BLACK_HOLE_HOVER_SCALE : 1);
  bioCloseDotVisualEl.style.width = diameter + 'px';
  bioCloseDotVisualEl.style.height = diameter + 'px';
  bioCloseDotVisualEl.style.marginLeft = (-diameter / 2) + 'px';
  bioCloseDotVisualEl.style.marginTop = (-diameter / 2) + 'px';
}

function shrinkBioCloseDot() {
  if (!bioCloseDotVisualEl) return;
  bioCloseDotVisualEl.style.width = '0px';
  bioCloseDotVisualEl.style.height = '0px';
  bioCloseDotVisualEl.style.marginLeft = '0px';
  bioCloseDotVisualEl.style.marginTop = '0px';
  bioCloseDotVisualEl.style.opacity = 0;
}

function closeBioOverlay() {
  if (!bioOverlayOpen) return;
  bioRevealTarget = 0;
}

function finalizeBioClose() {
  bioOverlayOpen = false;
  bioCloseDotRevealed = false;
  bioOverlayEl.classList.remove('open');
  bioOverlayEl.setAttribute('aria-hidden', 'true');
  resetBioLinksAfterClose();
}

function resetBioLinksAfterClose() {
  if (bioOverlayOpen) return;
  document.body.classList.remove('bio-open');
  bioActiveLinks.clear();
  if (!IS_TOUCH_DEVICE) {
	bioLinks.forEach((a) => a.classList.remove('bio-link-active'));
  }
  clearBioLinksMask();
}

function moveFallbackContentIntoCanvas(canvasEl) {
  let template = document.getElementById('canvas-fallback-content');
  if (!template) return;
  canvasEl.appendChild(template.content.cloneNode(true));
}

function syncProjectsFromDom() {
  let links = document.querySelectorAll('#project-list a');
  links.forEach((link, i) => {
	if (i >= projects.length) return;
	let match = link.textContent.match(/^(.*)\s+\((\d{4})\)$/);
	if (match) {
	  projects[i].title = match[1].trim();
	  projects[i].year = parseInt(match[2], 10);
	}
	projects[i].url = link.getAttribute('href');
  });
}

function loadVisitedUrls() {
  try {
	let raw = localStorage.getItem(VISITED_STORAGE_KEY);
	return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
	return new Set();
  }
}

function saveVisitedUrls(urlSet) {
  try {
	localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify([...urlSet]));
  } catch (e) {
  }
}

function applyVisitedState() {
  let visited = loadVisitedUrls();
  projects.forEach(p => { p.visited = visited.has(p.url); });
}

function markProjectVisited(p) {
  if (p.visited) return;
  p.visited = true;
  let visited = loadVisitedUrls();
  visited.add(p.url);
  saveVisitedUrls(visited);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function computeCameraDistance() {
  let dist = computeFitDistance(currentVFov(), width / height);
  return constrain(dist, 500, 4000);
}

function drawReflectiveOrb(size, posX, posY, posZ, eye, lightDir, tintColor, tintAmount, keyLightAmount) {
  shader(orbReflectShader);
  orbReflectShader.setUniform('uEnvMap', citrusImg);
  orbReflectShader.setUniform('uEyePosition', [eye.x, eye.y, eye.z]);
  orbReflectShader.setUniform('uLightDir', [lightDir.x, lightDir.y, lightDir.z]);
  orbReflectShader.setUniform('uOrbTranslation', [posX, posY, posZ]);
  orbReflectShader.setUniform('uTintColor', tintColor.map(c => c / 255));
  orbReflectShader.setUniform('uTintAmount', tintAmount || 0);
  orbReflectShader.setUniform('uKeyLightAmount', keyLightAmount === undefined ? 1 : keyLightAmount);
  sphere(size / 2, 24, 24);
  resetShader();
}

function currentVFov() {
  return 2 * Math.atan((height / 2) / 800);
}

function computeCameraBasis(eye, up) {
  let zLen = Math.sqrt(eye.x * eye.x + eye.y * eye.y + eye.z * eye.z);
  let zx = eye.x / zLen, zy = eye.y / zLen, zz = eye.z / zLen;

  let rx = up.y * zz - up.z * zy;
  let ry = up.z * zx - up.x * zz;
  let rz = up.x * zy - up.y * zx;
  let rLen = Math.sqrt(rx * rx + ry * ry + rz * rz);
  rx /= rLen; ry /= rLen; rz /= rLen;

  let ux = ry * zz - rz * zy;
  let uy = rz * zx - rx * zz;
  let uz = rx * zy - ry * zx;

  return { right: { x: rx, y: ry, z: rz }, up: { x: ux, y: uy, z: uz }, forward: { x: zx, y: zy, z: zz } };
}

function worldToScreen(x, y, z, eye, up) {
  let basis = computeCameraBasis(eye, up);
  let r = basis.right, u = basis.up, fwd = basis.forward;

  let relX = x - eye.x, relY = y - eye.y, relZ = z - eye.z;
  let viewX = relX * r.x + relY * r.y + relZ * r.z;
  let viewY = relX * u.x + relY * u.y + relZ * u.z;
  let viewZ = relX * fwd.x + relY * fwd.y + relZ * fwd.z;

  let depth = -viewZ;
  if (depth <= 0.0001) return null;

  let tanHalf = Math.tan(currentVFov() / 2);
  let aspect = width / height;
  let ndcX = viewX / (depth * tanHalf * aspect);
  let ndcY = viewY / (depth * tanHalf);

  return {
	x: (ndcX * 0.5 + 0.5) * width,
	y: (1 - (ndcY * 0.5 + 0.5)) * height,
	depth: depth
  };
}

function worldRadiusToScreenRadius(worldRadius, depth) {
  let tanHalf = Math.tan(currentVFov() / 2);
  return (worldRadius / (depth * tanHalf)) * (height / 2);
}

function computeCameraLightDir(eye, up) {
  let basis = computeCameraBasis(eye, up);
  let r = basis.right, u = basis.up, fwd = basis.forward;

  let lx = r.x * 0.5 + u.x * 0.7 + fwd.x * 0.5;
  let ly = r.y * 0.5 + u.y * 0.7 + fwd.y * 0.5;
  let lz = r.z * 0.5 + u.z * 0.7 + fwd.z * 0.5;
  let lLen = Math.sqrt(lx * lx + ly * ly + lz * lz);
  return { x: lx / lLen, y: ly / lLen, z: lz / lLen };
}

function computeHitRadius(p) {
  return IS_TOUCH_DEVICE
	? max(p.screenRadius * 1.1, 36)
	: max(p.screenRadius * 1.6, 44);
}

function hitTestPoint(px, py, x, y, radius) {
  let dx = px - x;
  let dy = py - y;
  return Math.sqrt(dx * dx + dy * dy) <= radius;
}

function findProjectHitIndex(px, py) {
  let hitIndex = -1;
  let closestDist = Infinity;

  for (let i = 0; i < projects.length; i++) {
	let p = projects[i];
	if (!p.screenVisible) continue;

	let dx = px - p.screenX;
	let dy = py - p.screenY;
	let d = Math.sqrt(dx * dx + dy * dy);

	if (d <= computeHitRadius(p) && d < closestDist) {
	  closestDist = d;
	  hitIndex = i;
	}
  }

  return hitIndex;
}

function computeProjectHoverZone(p) {
  let hitRadius = computeHitRadius(p);
  let left = p.screenX - hitRadius;
  let top = p.screenY - hitRadius;
  let right = p.screenX + hitRadius;
  let bottom = p.screenY + hitRadius;

  if (labelContentIndex !== -1 && projects[labelContentIndex] === p && orbLabelEl && orbLabelEl.style.opacity === '1') {
	let labelRect = orbLabelEl.getBoundingClientRect();
	left = Math.min(left, labelRect.left);
	right = Math.max(right, labelRect.right);
	bottom = Math.max(bottom, labelRect.bottom);
  }

  return { left, top, right, bottom };
}

function isMouseOverLabelZone() {
  if (IS_TOUCH_DEVICE || labelContentIndex === -1) return false;
  if (!orbLabelEl || orbLabelEl.style.opacity !== '1') return false;
  let p = projects[labelContentIndex];
  if (!p || !p.screenVisible) return false;

  let zone = computeProjectHoverZone(p);
  return mouseX >= zone.left && mouseX <= zone.right && mouseY >= zone.top && mouseY <= zone.bottom;
}

function isHoveringAnyProject() {
  if (IS_TOUCH_DEVICE) return false;
  if (bioOverlayOpen) return false;

  return findProjectHitIndex(mouseX, mouseY) !== -1 || isMouseOverLabelZone();
}

function updateDesktopHoverSelection() {
  if (IS_TOUCH_DEVICE) return;
  if (keyboardFocusIndex !== -1) return;
  if (bioOverlayOpen) {
	selectedIndex = -1;
	return;
  }

  let hitIndex = findProjectHitIndex(mouseX, mouseY);
  if (hitIndex === -1 && isMouseOverLabelZone()) {
	hitIndex = labelContentIndex;
  }
  selectedIndex = hitIndex;
}

function updateCameraOrientation() {
  let dragDeltaX = 0;
  let dragDeltaY = 0;
  let dragging = false;
  let currentX = 0;
  let currentY = 0;

  if (isDraggingCamera && !bioOverlayOpen) {
	if (IS_TOUCH_DEVICE) {
	  if (touches.length > 0) {
		currentX = touches[0].x;
		currentY = touches[0].y;
		if (!dragMoved && (Math.abs(currentX - dragStartX) > CAMERA_DRAG_CLICK_THRESHOLD || Math.abs(currentY - dragStartY) > CAMERA_DRAG_CLICK_THRESHOLD)) {
		  dragMoved = true;
		}
		if (lastTouchDragX !== null) dragDeltaX = currentX - lastTouchDragX;
		if (lastTouchDragY !== null) dragDeltaY = currentY - lastTouchDragY;
		lastTouchDragX = currentX;
		lastTouchDragY = currentY;
		dragging = true;
	  }
	} else {
	  currentX = mouseX;
	  currentY = mouseY;
	  if (!dragMoved && (Math.abs(currentX - dragStartX) > CAMERA_DRAG_CLICK_THRESHOLD || Math.abs(currentY - dragStartY) > CAMERA_DRAG_CLICK_THRESHOLD)) {
		dragMoved = true;
	  }
	  dragDeltaX = mouseX - pmouseX;
	  dragDeltaY = mouseY - pmouseY;
	  dragging = true;
	}
  }

  let spinDirection = (dragging && currentY < height / 2) ? -1 : 1;
  let targetSpinVelocity = dragging ? dragDeltaX * ORBIT_SPIN_DRAG_SENSITIVITY * spinDirection : 0;
  let spinEase = dragging ? ORBIT_SPIN_VELOCITY_EASE : ORBIT_SPIN_INERTIA_DAMPING;
  orbitSpinVelocity = lerp(orbitSpinVelocity, targetSpinVelocity, spinEase);
  orbitSpinAngle += orbitSpinVelocity;

  camYaw += CAM_AUTO_ROTATE_SPEED * timeScale;
  if (dragging) {
	camYaw += dragDeltaX * CAMERA_YAW_DRAG_SENSITIVITY;
  }

  let maxTiltRad = CAMERA_TILT_MAX_DEG * (Math.PI / 180);

  let softClampTilt = (value) => maxTiltRad * Math.tanh(value / maxTiltRad);
  if (dragging) {
	let totalDragY = currentY - dragStartY;
	camTiltTargetX = softClampTilt(camTiltXBase + totalDragY * CAMERA_TILT_SENSITIVITY);
	let instantTiltVelocityX = dragDeltaY * CAMERA_TILT_SENSITIVITY;
	camTiltVelocityX = lerp(camTiltVelocityX, instantTiltVelocityX, CAMERA_TILT_VELOCITY_EASE);
  } else {

	camTiltVelocityX = lerp(camTiltVelocityX, 0, CAMERA_TILT_INERTIA_DAMPING);
	camTiltTargetX = softClampTilt(camTiltTargetX + camTiltVelocityX);
  }

  camTiltZ = lerp(camTiltZ, camTiltTargetZ, CAMERA_TILT_EASE);
  camTiltX = lerp(camTiltX, camTiltTargetX, CAMERA_TILT_EASE);
}

function isHoveringBlackHole() {
  if (IS_TOUCH_DEVICE) return false;
  if (bioOverlayOpen) return false;
  if (!blackHole.screenVisible) return false;
  return hitTestPoint(mouseX, mouseY, blackHole.screenX, blackHole.screenY, computeHitRadius(blackHole));
}

function updateHoverCursor() {
  if (IS_TOUCH_DEVICE) return;
  if (bioOverlayOpen) {
	document.body.style.cursor = 'default';
	return;
  }

  if (isDraggingCamera) {
	document.body.style.cursor = 'grabbing';
	return;
  }

  let hovering = isHoveringBlackHole() || isHoveringAnyProject();

  document.body.style.cursor = hovering ? 'pointer' : 'default';
}

function draw() {
  background(0);

  updateDesktopHoverSelection();

  let targetTimeScale = (selectedIndex === -1) ? 1 : 0;
  timeScale = lerp(timeScale, targetTimeScale, TIME_SCALE_EASE);

  updateCameraOrientation();
  updateBioReveal();
  blackHolePulsePhase += BLACK_HOLE_PULSE_SPEED * timeScale;
  let blackHoleSize = BLACK_HOLE_SIZE + sin(blackHolePulsePhase) * BLACK_HOLE_PULSE_AMPLITUDE;

  let blackHoleHovering = isHoveringBlackHole();
  blackHoleHoverScale = lerp(blackHoleHoverScale, blackHoleHovering ? BLACK_HOLE_HOVER_SCALE : 1, BLACK_HOLE_HOVER_EASE);
  blackHoleSize *= blackHoleHoverScale;

  orbitHoverScale = lerp(orbitHoverScale, isHoveringAnyProject() ? ORBIT_HOVER_SLOWDOWN : 1, ORBIT_HOVER_EASE);

  let camDist = computeCameraDistance();
  let upX = sin(camYaw);
  let upZ = cos(camYaw);
  let eyeX = -camDist * cos(camTiltX) * sin(camTiltZ);
  let eyeY = camDist * cos(camTiltX) * cos(camTiltZ);
  let eyeZ = camDist * sin(camTiltX);
  camera(eyeX, eyeY, eyeZ, 0, 0, 0, upX, 0, upZ);
  let camEye = { x: eyeX, y: eyeY, z: eyeZ };
  let camUp = { x: upX, y: 0, z: upZ };
  let camLightDir = computeCameraLightDir(camEye, camUp);

  push();
  camera(0, camDist, 0, 0, 0, 0, 0, 0, 1);
  noLights();
  let skyBrightness = lerp(SKYBOX_MIN_BRIGHTNESS * 255, 255, timeScale);
  tint(skyBrightness);
  texture(skyImg);
  sphere(2000, 48, 48);
  noTint();
  pop();

  push();
  noStroke();
  drawReflectiveOrb(blackHoleSize, 0, 0, 0, camEye, camLightDir, [0, 0, 0], 1, 0);
  pop();

  let blackHoleProj = worldToScreen(0, 0, 0, camEye, camUp);
  if (blackHoleProj) {
	blackHole.screenX = blackHoleProj.x;
	blackHole.screenY = blackHoleProj.y;
	blackHole.screenRadius = worldRadiusToScreenRadius(blackHoleSize / 2, blackHoleProj.depth);
	blackHole.screenVisible = true;
  } else {
	blackHole.screenVisible = false;
  }

  let majorRadius = ORBIT_MAJOR_RADIUS;
  let minorRadius = ORBIT_MINOR_RADIUS;
  let tiltX = radians(38);
  let tiltY = radians(28);

  for (let i = 0; i < projects.length; i++) {
	let p = projects[i];

	let major = majorRadius + (i - 3) * 6;
	let minor = minorRadius + (i - 3) * 4;

	let x = major * cos(p.orbitAngle + orbitSpinAngle);
	let z = minor * sin(p.orbitAngle + orbitSpinAngle);
	let y = 0;

	let y1 = y * cos(tiltX) - z * sin(tiltX);
	let z1 = y * sin(tiltX) + z * cos(tiltX);
	let x1 = x;

	let posX = x1 * cos(tiltY) + z1 * sin(tiltY);
	let posY = y1;
	let posZ = -x1 * sin(tiltY) + z1 * cos(tiltY);

	push();
	translate(posX, posY, posZ);
	if (p.lightMix === undefined) p.lightMix = 0;
	let lightTarget = (i === selectedIndex) ? 1 : 0;
	p.lightMix = lerp(p.lightMix, lightTarget, LIGHT_MIX_EASE);

	if (p.visitedMix === undefined) p.visitedMix = 0;
	let visitedTarget = p.visited ? VISITED_TINT_OPACITY[i] : 0;
	p.visitedMix = lerp(p.visitedMix, visitedTarget, VISITED_MIX_EASE);

	if (p.lightMix > 0.01) {
	  let dx = camEye.x - posX, dy = camEye.y - posY, dz = camEye.z - posZ;
	  let dLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
	  dx /= dLen; dy /= dLen; dz /= dLen;

	  let refX = 0, refY = 0, refZ = 1;
	  if (Math.abs(dz) > 0.9) { refX = 1; refY = 0; refZ = 0; }

	  let rightX = refY * dz - refZ * dy;
	  let rightY = refZ * dx - refX * dz;
	  let rightZ = refX * dy - refY * dx;
	  let rLen = Math.sqrt(rightX * rightX + rightY * rightY + rightZ * rightZ);
	  rightX /= rLen; rightY /= rLen; rightZ /= rLen;

	  let upX2 = dy * rightZ - dz * rightY;
	  let upY2 = dz * rightX - dx * rightZ;
	  let upZ2 = dx * rightY - dy * rightX;

	  let rayOffset = p.size * HALO_DEPTH_OFFSET_RATIO;
	  let newDist = dLen + rayOffset;
	  let sizeCompensation = newDist / dLen;

	  push();
	  noStroke();
	  noLights();
	  translate(-dx * rayOffset, -dy * rayOffset, -dz * rayOffset);
	  applyMatrix(
		rightX, upX2, dx, 0,
		rightY, upY2, dy, 0,
		rightZ, upZ2, dz, 0,
		0, 0, 0, 1
	  );
	  let haloColor = HALO_COLOR_DEFAULT;
	  fill(haloColor[0], haloColor[1], haloColor[2], 255 * p.lightMix);
	  circle(0, 0, p.size * HALO_SCALE * sizeCompensation);
	  pop();
	}

	drawReflectiveOrb(p.size, posX, posY, posZ, camEye, camLightDir, VISITED_TINT_COLORS[i], p.visitedMix);
	pop();

	let proj = worldToScreen(posX, posY, posZ, camEye, camUp);
	if (proj) {
	  p.screenX = proj.x;
	  p.screenY = proj.y;
	  p.screenRadius = worldRadiusToScreenRadius(p.size / 2, proj.depth);
	  p.screenVisible = true;
	} else {
	  p.screenVisible = false;
	}
	p.orbitAngle += p.orbitSpeed * timeScale * orbitHoverScale;
  }
  updateHoverCursor();
  updateOrbLabel();
  updateOrbLinkHitzone();
}

function updateOrbLabel() {
  if (!orbLabelEl) return;

  if (labelPhase === 'idle') {
	if (selectedIndex !== labelContentIndex) {
	  labelPhase = 'fadeOut';
	  labelFadeOutUntil = millis() + LABEL_FADE_MS;
	  orbLabelEl.style.opacity = 0;
	  orbLabelEl.classList.remove('active');
	  return;
	}
  } else if (labelPhase === 'fadeOut') {
	if (millis() < labelFadeOutUntil) return;
	labelContentIndex = selectedIndex;
	labelPhase = 'idle';
  }

  applyLabelContent();
}

function applyLabelContent() {
  let p = (labelContentIndex !== -1) ? projects[labelContentIndex] : null;
  if (!p || !p.screenVisible) {
	orbLabelEl.style.opacity = 0;
	orbLabelEl.classList.remove('active');
	return;
  }

  orbLabelEl.textContent = `${p.title} (${p.year})`;
  orbLabelEl.href = p.url;
  orbLabelEl.style.top = `${p.screenY + p.screenRadius + (IS_TOUCH_DEVICE ? 14 : 20)}px`;
  orbLabelEl.style.opacity = 1;
  orbLabelEl.classList.add('active');

  let halfWidth = orbLabelEl.offsetWidth / 2;
  let minCenter = LABEL_EDGE_PADDING + halfWidth;
  let maxCenter = width - LABEL_EDGE_PADDING - halfWidth;
  let centerX = (maxCenter < minCenter) ? (width / 2) : constrain(p.screenX, minCenter, maxCenter);
  orbLabelEl.style.left = `${centerX}px`;
}

let pendingOpenIndex = -1;

function updateOrbLinkHitzone() {
  if (!orbLinkEl) return;

  if (IS_TOUCH_DEVICE || selectedIndex === -1) {
	orbLinkEl.style.pointerEvents = 'none';
	return;
  }

  let p = projects[selectedIndex];
  if (!p.screenVisible) {
	orbLinkEl.style.pointerEvents = 'none';
	return;
  }

  let zone = computeProjectHoverZone(p);
  orbLinkEl.href = p.url;
  orbLinkEl.style.left = `${zone.left}px`;
  orbLinkEl.style.top = `${zone.top}px`;
  orbLinkEl.style.width = `${zone.right - zone.left}px`;
  orbLinkEl.style.height = `${zone.bottom - zone.top}px`;
  orbLinkEl.style.pointerEvents = 'auto';
}

function handleTap(px, py) {
  if (blackHole.screenVisible && hitTestPoint(px, py, blackHole.screenX, blackHole.screenY, computeHitRadius(blackHole))) {
	openBioOverlay();
	return;
  }

  let hitIndex = findProjectHitIndex(px, py);

  if (hitIndex !== -1 && hitIndex === selectedIndex) {
	pendingOpenIndex = hitIndex;
	return;
  }

  pendingOpenIndex = -1;
  selectedIndex = hitIndex;
}

function openInNewTab(url) {
  window.location.href = url;
}

function navigateBioLink(a) {
  let href = a.getAttribute('href');
  window.location.href = href;
}

const BIO_LINK_TAP_FLASH_MS = 300;

function flashBioLinkTap(a) {
  a.classList.add('bio-link-tap');
  setTimeout(() => a.classList.remove('bio-link-tap'), BIO_LINK_TAP_FLASH_MS);
}

function beginCameraDrag(x, y) {
  isDraggingCamera = true;
  dragMoved = false;
  dragStartX = x;
  dragStartY = y;
  camTiltXBase = camTiltX;
  camTiltZBase = camTiltZ;
}

function finalizeTap(x, y) {
  handleTap(x, y);
  if (pendingOpenIndex !== -1) {
	let p = projects[pendingOpenIndex];
	openInNewTab(p.url);
	markProjectVisited(p);
	pendingOpenIndex = -1;
  }
}

function mousePressed(event) {
  if (bioOverlayOpen) return false;
  if (event && event.target && event.target.closest && event.target.closest('#label, #orb-link')) return false;
  beginCameraDrag(mouseX, mouseY);
  return false;
}

function mouseReleased(event) {
  if (!isDraggingCamera) return false;
  isDraggingCamera = false;
  if (bioOverlayOpen) return false;
  if (event && event.target && event.target.closest && event.target.closest('#label, #orb-link')) return false;
  if (!dragMoved) finalizeTap(mouseX, mouseY);
  return false;
}

function touchStarted(event) {
  if (bioOverlayOpen) return false;
  if (event && event.target && event.target.closest && event.target.closest('#label, #orb-link')) return false;
  if (touches.length > 0) {
	beginCameraDrag(touches[0].x, touches[0].y);
	lastTouchDragX = touches[0].x;
	lastTouchDragY = touches[0].y;
  }
  return false;
}

function touchEnded(event) {
  if (bioOverlayOpen) { isDraggingCamera = false; return false; }
  if (!isDraggingCamera) return false;
  isDraggingCamera = false;
  lastTouchDragX = null;
  lastTouchDragY = null;
  if (event && event.target && event.target.closest && event.target.closest('#label, #orb-link')) return false;
  if (!dragMoved) finalizeTap(dragStartX, dragStartY);
  return false;
}

function applyKeyboardFocus() {
  selectedIndex = (keyboardFocusIndex >= 0 && keyboardFocusIndex < projects.length) ? keyboardFocusIndex : -1;

  let emailIndex = projects.length + 1;
  let instagramIndex = projects.length + 2;

  if (keyboardFocusIndex === projects.length) {
	openBioOverlay();
  } else if (keyboardFocusIndex !== emailIndex && keyboardFocusIndex !== instagramIndex) {
	closeBioOverlay();
  }

  if (!IS_TOUCH_DEVICE) {
	bioLinks.forEach((a, i) => {
	  let focused = (i === 0 && keyboardFocusIndex === emailIndex) || (i === 1 && keyboardFocusIndex === instagramIndex);
	  setBioLinkActive(a, focused);
	});
  }
}

function resetKeyboardFocus() {
  keyboardFocusIndex = -1;
  selectedIndex = -1;
  pendingOpenIndex = -1;
  closeBioOverlay();
  if (!IS_TOUCH_DEVICE) {
	bioLinks.forEach((a) => setBioLinkActive(a, false));
  }
}

function keyPressed() {
  if (document.activeElement && document.activeElement !== document.body) return;

  if (keyCode === 32) {
	let maxIndex = projects.length + 2;
	keyboardFocusIndex = (keyboardFocusIndex < maxIndex) ? keyboardFocusIndex + 1 : -1;
	applyKeyboardFocus();
	return false;
  }

  if (keyCode === ESCAPE) {
	resetKeyboardFocus();
	return false;
  }

  if (keyCode === ENTER || keyCode === RETURN) {
	let emailIndex = projects.length + 1;
	let instagramIndex = projects.length + 2;

	if (keyboardFocusIndex >= 0 && keyboardFocusIndex < projects.length) {
	  let p = projects[keyboardFocusIndex];
	  openInNewTab(p.url);
	  markProjectVisited(p);
	} else if (keyboardFocusIndex === projects.length) {
	  openBioOverlay();
	} else if (keyboardFocusIndex === emailIndex) {
	  navigateBioLink(bioLinks[0]);
	} else if (keyboardFocusIndex === instagramIndex) {
	  navigateBioLink(bioLinks[1]);
	}
	return false;
  }
}