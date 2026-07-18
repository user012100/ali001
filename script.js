let projects = [
  { title: "XD Magazine", year: 2026, url: "https://xdmag.com", orbitAngle: 5.4, spinAngle: 4.2, orbitSpeed: 0.0015, spinSpeed: 0.003, size: 82 },
  { title: "Joanna", year: 2026, url: "https://joannaistanbul.com", orbitAngle: 0, spinAngle: 0, orbitSpeed: 0.0015, spinSpeed: 0.003, size: 76 },
  { title: "[untold]", year: 2026, url: "https://user012100.github.io/functions", orbitAngle: 0.9, spinAngle: 0.7, orbitSpeed: 0.0015, spinSpeed: 0.003, size: 70 },
  { title: "Gossip", year: 2026, url: "https://user012100.github.io/links", orbitAngle: 1.8, spinAngle: 1.4, orbitSpeed: 0.0015, spinSpeed: 0.003, size: 78 },
  { title: "Persistence of Memory", year: 2025, url: "https://user012100.github.io/binding", orbitAngle: 2.7, spinAngle: 2.1, orbitSpeed: 0.0015, spinSpeed: 0.003, size: 67 },
  { title: "Cult of the Ugly", year: 2025, url: "https://user012100.github.io/spread", orbitAngle: 3.6, spinAngle: 2.8, orbitSpeed: 0.0015, spinSpeed: 0.003, size: 74 },
  { title: "Nick Lambrou", year: 2025, url: "https://nlambrou.com", orbitAngle: 4.5, spinAngle: 3.5, orbitSpeed: 0.0015, spinSpeed: 0.003, size: 71 }
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
const LABEL_FADE_MS = 120;
const LABEL_EDGE_PADDING = 16;

const ORBIT_MAJOR_RADIUS = 380;
const ORBIT_MINOR_RADIUS = 210;
const ORBIT_CONTENT_RADIUS = ORBIT_MAJOR_RADIUS + 90;

let camYaw = 0;
const CAM_AUTO_ROTATE_SPEED = 0.0009;

const IS_TOUCH_DEVICE = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

const SKYBOX_MIN_BRIGHTNESS = 0.5;

const LIGHT_MIX_EASE = 0.08;
const VISITED_MIX_EASE = 0.05;

const HALO_SCALE = IS_TOUCH_DEVICE ? 1.2 : 1.15;
const HALO_DEPTH_OFFSET_RATIO = 0.35;

const BLACK_HOLE_SIZE = 14;
const BLACK_HOLE_PULSE_AMPLITUDE = 2.5;
const BLACK_HOLE_PULSE_SPEED = 0.012;
let blackHolePulsePhase = 0;

const BLACK_HOLE_HOVER_SCALE = 3;
const BLACK_HOLE_HOVER_EASE = 0.05;
let blackHoleHoverScale = 1;

const ORBIT_HOVER_SLOWDOWN = 0.15;
const ORBIT_HOVER_EASE = 0.05;
let orbitHoverScale = 1;

function sizeLoadDot() {
  let dot = document.getElementById('load-dot');
  if (!dot) return;
  let w = window.innerWidth;
  let h = window.innerHeight;
  let vFov = 2 * Math.atan((h / 2) / 800);
  let distForHeight = ORBIT_CONTENT_RADIUS / Math.tan(vFov / 2);
  let dist = distForHeight;
  if (w / h >= 1) {
	let distForWidth = ORBIT_CONTENT_RADIUS / (Math.tan(vFov / 2) * (w / h));
	dist = Math.max(distForHeight, distForWidth);
  }
  dist *= 1.15;
  if (IS_TOUCH_DEVICE) dist *= 1.45;
  dist = Math.min(Math.max(dist, 500), 4000);
  let diameter = (BLACK_HOLE_SIZE * 800) / dist;
  dot.style.width = diameter + 'px';
  dot.style.height = diameter + 'px';
  dot.style.marginLeft = (-diameter / 2) + 'px';
  dot.style.marginTop = (-diameter / 2) + 'px';
}
sizeLoadDot();

const LOAD_DOT_DELAY_MS = 500;
let loadDotTimer = setTimeout(() => {
  let dot = document.getElementById('load-dot');
  if (dot) dot.classList.add('visible');
}, LOAD_DOT_DELAY_MS);

let bioOverlayEl;
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
uniform vec3 uTintColor;
uniform float uTintAmount;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;

#define PI 3.14159265359

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 incident = normalize(vWorldPos - uEyePosition);
  vec3 r = reflect(incident, normal);
  float u = 0.5 + atan(r.z, r.x) / (2.0 * PI);
  float v = 0.5 + asin(clamp(r.y, -1.0, 1.0)) / PI;
  vec3 envColor = texture2D(uEnvMap, vec2(u, v)).rgb;

  vec3 tintedEnv = mix(envColor, envColor * uTintColor, uTintAmount);

  float fresnel = pow(1.0 - max(dot(normal, -incident), 0.0), 3.0);
  vec3 color = tintedEnv + fresnel * 0.65;

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
  bioOverlayEl.addEventListener('click', (e) => {
	if (e.target.closest('a')) return;
	closeBioOverlay();
  });
  bioOverlayEl.addEventListener('touchend', (e) => {
	if (e.target.closest('a')) return;
	e.preventDefault();
	closeBioOverlay();
  });

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
	  navigateBioLink(a);
	}, { passive: false });
  });

  fadeOutLoadOverlay();
}

function fadeOutLoadOverlay() {
  clearTimeout(loadDotTimer);
  let overlay = document.getElementById('load-overlay');
  if (!overlay) return;
  requestAnimationFrame(() => {
	overlay.classList.add('hidden');
	overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  });
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

const BIO_OVERLAY_CLOSE_MS = 400;

function openBioOverlay() {
  if (bioOverlayOpen) return;
  bioOverlayOpen = true;
  bioOverlayEl.style.transitionDuration = '';
  bioOverlayEl.style.transitionTimingFunction = '';
  bioOverlayEl.classList.add('open');
  bioOverlayEl.setAttribute('aria-hidden', 'false');
  document.body.classList.add('bio-open');
  renderBioLinksMask();
}

function closeBioOverlay() {
  if (!bioOverlayOpen) return;
  bioOverlayOpen = false;
  bioOverlayEl.style.transitionDuration = `${BIO_OVERLAY_CLOSE_MS}ms`;
  bioOverlayEl.style.transitionTimingFunction = 'cubic-bezier(0.05, 0.85, 0.1, 1)';
  bioOverlayEl.classList.remove('open');
  bioOverlayEl.setAttribute('aria-hidden', 'true');

  let resetOnce = () => {
	bioOverlayEl.removeEventListener('transitionend', onTransitionEnd);
	clearTimeout(fallbackTimer);
	resetBioLinksAfterClose();
  };
  let onTransitionEnd = (e) => {
	if (e.propertyName === 'clip-path') resetOnce();
  };
  bioOverlayEl.addEventListener('transitionend', onTransitionEnd);
  let fallbackTimer = setTimeout(resetOnce, BIO_OVERLAY_CLOSE_MS + 50);
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
  let vFov = currentVFov();
  let aspect = width / height;
  let distForHeight = ORBIT_CONTENT_RADIUS / tan(vFov / 2);
  let dist = distForHeight;
  if (aspect >= 1) {
	let distForWidth = ORBIT_CONTENT_RADIUS / (tan(vFov / 2) * aspect);
	dist = max(distForHeight, distForWidth);
  }
  dist *= 1.15;
  if (IS_TOUCH_DEVICE) {
	dist *= 1.45;
  }
  return constrain(dist, 500, 4000);
}

function drawReflectiveOrb(size, posX, posY, posZ, eye, tintColor, tintAmount) {
  shader(orbReflectShader);
  orbReflectShader.setUniform('uEnvMap', citrusImg);
  orbReflectShader.setUniform('uEyePosition', [eye.x, eye.y, eye.z]);
  orbReflectShader.setUniform('uOrbTranslation', [posX, posY, posZ]);
  orbReflectShader.setUniform('uTintColor', tintColor.map(c => c / 255));
  orbReflectShader.setUniform('uTintAmount', tintAmount || 0);
  sphere(size / 2, 24, 24);
  resetShader();
}

function currentVFov() {
  return 2 * Math.atan((height / 2) / 800);
}

function worldToScreen(x, y, z, eye, up) {
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

  let relX = x - eye.x, relY = y - eye.y, relZ = z - eye.z;
  let viewX = relX * rx + relY * ry + relZ * rz;
  let viewY = relX * ux + relY * uy + relZ * uz;
  let viewZ = relX * zx + relY * zy + relZ * zz;

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

function computeHitRadius(p) {
  return IS_TOUCH_DEVICE
	? max(p.screenRadius * 1.1, 36)
	: max(p.screenRadius * 1.6, 44);
}

function isHoveringAnyProject() {
  if (IS_TOUCH_DEVICE) return false;

  for (let i = 0; i < projects.length; i++) {
	let p = projects[i];
	if (!p.screenVisible) continue;

	let dx = mouseX - p.screenX;
	let dy = mouseY - p.screenY;
	let d = Math.sqrt(dx * dx + dy * dy);

	if (d <= computeHitRadius(p)) {
	  return true;
	}
  }

  return false;
}

function updateHoverCursor() {
  if (IS_TOUCH_DEVICE) return;

  let hovering = false;

  if (blackHole.screenVisible) {
	let dx = mouseX - blackHole.screenX;
	let dy = mouseY - blackHole.screenY;
	let d = Math.sqrt(dx * dx + dy * dy);
	if (d <= computeHitRadius(blackHole)) {
	  hovering = true;
	}
  }

  if (!hovering && isHoveringAnyProject()) {
	hovering = true;
  }

  document.body.style.cursor = hovering ? 'pointer' : 'default';
}

function draw() {
  background(0);

  let targetTimeScale = (selectedIndex === -1) ? 1 : 0;
  timeScale = lerp(timeScale, targetTimeScale, TIME_SCALE_EASE);

  camYaw += CAM_AUTO_ROTATE_SPEED * timeScale;
  blackHolePulsePhase += BLACK_HOLE_PULSE_SPEED * timeScale;
  let blackHoleSize = BLACK_HOLE_SIZE + sin(blackHolePulsePhase) * BLACK_HOLE_PULSE_AMPLITUDE;

  let blackHoleHovering = false;
  if (!IS_TOUCH_DEVICE && blackHole.screenVisible) {
	let dx = mouseX - blackHole.screenX;
	let dy = mouseY - blackHole.screenY;
	let d = Math.sqrt(dx * dx + dy * dy);
	if (d <= computeHitRadius(blackHole)) {
	  blackHoleHovering = true;
	}
  }
  blackHoleHoverScale = lerp(blackHoleHoverScale, blackHoleHovering ? BLACK_HOLE_HOVER_SCALE : 1, BLACK_HOLE_HOVER_EASE);
  blackHoleSize *= blackHoleHoverScale;

  orbitHoverScale = lerp(orbitHoverScale, isHoveringAnyProject() ? ORBIT_HOVER_SLOWDOWN : 1, ORBIT_HOVER_EASE);

  let camDist = computeCameraDistance();
  let upX = sin(camYaw);
  let upZ = cos(camYaw);
  camera(0, camDist, 0, 0, 0, 0, upX, 0, upZ);
  let camEye = { x: 0, y: camDist, z: 0 };
  let camUp = { x: upX, y: 0, z: upZ };

  push();
  noLights();
  let skyBrightness = lerp(SKYBOX_MIN_BRIGHTNESS * 255, 255, timeScale);
  tint(skyBrightness);
  texture(skyImg);
  sphere(2000, 48, 48);
  noTint();
  pop();

  push();
  noStroke();
  drawReflectiveOrb(blackHoleSize, 0, 0, 0, camEye, [0, 0, 0], 1);
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

	let x = major * cos(p.orbitAngle);
	let z = minor * sin(p.orbitAngle);
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

	drawReflectiveOrb(p.size, posX, posY, posZ, camEye, VISITED_TINT_COLORS[i], p.visitedMix);
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
	p.spinAngle += p.spinSpeed * timeScale;
  }
  updateHoverCursor();
  updateOrbLabel();
  updateOrbLinkHitzone();
}

function updateOrbLabel() {
  if (!orbLabelEl) return;

  if (labelPhase === 'idle') {
	if (selectedIndex !== labelContentIndex) {
	  if (labelContentIndex === -1) {
		labelContentIndex = selectedIndex;
	  } else {
		labelPhase = 'fadeOut';
		labelFadeOutUntil = millis() + LABEL_FADE_MS;
		orbLabelEl.style.opacity = 0;
		orbLabelEl.classList.remove('active');
		return;
	  }
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

  let hitRadius = computeHitRadius(p);
  orbLinkEl.href = p.url;
  orbLinkEl.style.left = `${p.screenX - hitRadius}px`;
  orbLinkEl.style.top = `${p.screenY - hitRadius}px`;
  orbLinkEl.style.width = `${hitRadius * 2}px`;
  orbLinkEl.style.height = `${hitRadius * 2}px`;
  orbLinkEl.style.pointerEvents = 'auto';
}

function handleTap(px, py) {
  if (blackHole.screenVisible) {
	let dx = px - blackHole.screenX;
	let dy = py - blackHole.screenY;
	let d = Math.sqrt(dx * dx + dy * dy);
	if (d <= computeHitRadius(blackHole)) {
	  openBioOverlay();
	  return;
	}
  }

  let hitIndex = -1;
  let closestDist = Infinity;

  for (let i = 0; i < projects.length; i++) {
	let p = projects[i];
	if (!p.screenVisible) continue;

	let dx = px - p.screenX;
	let dy = py - p.screenY;
	let d = Math.sqrt(dx * dx + dy * dy);
	let hitRadius = computeHitRadius(p);

	if (d <= hitRadius && d < closestDist) {
	  closestDist = d;
	  hitIndex = i;
	}
  }

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

function mousePressed(event) {
  if (bioOverlayOpen) return false;
  if (event && event.target && event.target.closest && event.target.closest('#label, #orb-link')) return false;
  handleTap(mouseX, mouseY);
  if (pendingOpenIndex !== -1) {
	let p = projects[pendingOpenIndex];
	openInNewTab(p.url);
	markProjectVisited(p);
	pendingOpenIndex = -1;
  }
  return false;
}

function touchStarted(event) {
  if (bioOverlayOpen) return false;
  if (event && event.target && event.target.closest && event.target.closest('#label, #orb-link')) return false;
  if (touches.length > 0) {
	handleTap(touches[0].x, touches[0].y);
  }
  return false;
}

function touchEnded() {
  if (bioOverlayOpen) return false;
  if (pendingOpenIndex !== -1) {
	let p = projects[pendingOpenIndex];
	openInNewTab(p.url);
	markProjectVisited(p);
	pendingOpenIndex = -1;
  }
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