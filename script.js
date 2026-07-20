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
let skyMaskShader;

let selectedIndex = -1;
let timeScale = 1;
const TIME_SCALE_EASE = 0.06;
let orbLabelEl;
let orbLinkEl;

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
const CAMERA_YAW_DRAG_SENSITIVITY = 0.00045;

const CAMERA_DRAG_CLICK_THRESHOLD = 8;
let isDraggingCamera = false;
let dragMoved = false;
let dragStartX = 0;
let dragStartY = 0;
let lastTouchDragX = null;
let lastTouchDragY = null;

const ORBIT_SPIN_DRAG_SENSITIVITY = 0.0035;
const ORBIT_TILT_DRAG_SENSITIVITY = 0.0035;
const ORBIT_SPIN_VELOCITY_EASE = 0.2;
const ORBIT_SPIN_INERTIA_DAMPING = 0.028;
let orbitSpinAngle = 0;
let orbitSpinVelocity = 0;
let orbitTiltVelocity = 0;

// The faster the orbit is currently being spun by dragging, the farther out the orbs fling from
// the orbit's center, like centrifugal force. ORBIT_RADIUS_VELOCITY_SCALE converts the spin
// velocity (radians/frame) into extra world-space radius, clamped by ORBIT_RADIUS_BOOST_MAX and
// smoothed by ORBIT_RADIUS_BOOST_EASE so it settles back down once the spin decays.
const ORBIT_RADIUS_VELOCITY_SCALE = 1000;
const ORBIT_RADIUS_BOOST_MAX = 200;
const ORBIT_RADIUS_BOOST_EASE = 0.06;
// Tilting the ring contributes far more subtly to the radius boost than spinning it does.
const ORBIT_RADIUS_TILT_WEIGHT = 0.2;
let orbitRadiusBoost = 0;
// Accumulated full 3D orientation of the orbit ring, initialized to the default tilted look.
// (Uses plain math here, not p5's radians(), since p5 globals aren't attached yet at this point.)
let orbitRotationMatrix = mat3Multiply(mat3RotY((28 * Math.PI) / 180), mat3RotX((38 * Math.PI) / 180));

const IS_TOUCH_DEVICE = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

const SKYBOX_MIN_BRIGHTNESS = 0.5;
const SKY_MASK_SOFTNESS = 1.5;
const SKY_MASK_OVERSHOOT = 1.05;

const LIGHT_MIX_EASE = 0.08;
const VISITED_MIX_EASE = 0.05;

const HALO_SCALE = IS_TOUCH_DEVICE ? 1.2 : 1.15;
const HALO_DEPTH_OFFSET_RATIO = 0.35;

const TOGGLE_DOT_BASE_SIZE = 28;
const BIO_CLOSE_DOT_HOVER_SCALE = 1.75;
const BIO_CLOSE_DOT_HOVER_EASE = 0.15;
const TOGGLE_DOT_DIP_SCALE = 0.15;
const TOGGLE_DOT_COLOR_OPEN = [255, 255, 255];
const TOGGLE_DOT_COLOR_CLOSED = [0, 0, 0];
const TOGGLE_DOT_PULSE_PERIOD_MS = 6500;
const TOGGLE_DOT_PULSE_AMPLITUDE = 0.24;
let bioDotHovering = false;
let bioDotHoverScale = 1;
let toggleDotDiameterPx = 0;
let toggleDotColor = TOGGLE_DOT_COLOR_CLOSED;

const ORBIT_HOVER_SLOWDOWN = 0.15;
const ORBIT_HOVER_EASE = 0.05;
let orbitHoverScale = 1;

const BIO_REVEAL_CLOSE_EASE = 0.09;
const BIO_REVEAL_OPEN_SETTLE_EASE = 0.09;
let bioRevealTarget = 1;
let bioRevealProgress = 1;

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
  return (TOGGLE_DOT_BASE_SIZE * 800) / dist;
}

function sizeDotElement(dot) {
  if (!dot) return;
  let diameter = computeLoadDotDiameter();
  dot.style.width = diameter + 'px';
  dot.style.height = diameter + 'px';
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
}

const LOAD_DOT_DELAY_MS = 300;
const MOBILE_ZOOM_DELAY_MS = 300;
const DESKTOP_REVEAL_TRANSITION_DURATION = '1.6s';
const MOBILE_REVEAL_TRANSITION_DURATION = '2.4s';
let loadTookLong = false;
let loadDotTimer;
{
  let dot = document.getElementById('load-dot');
  if (dot) dot.classList.add('visible');
  loadDotTimer = setTimeout(() => {
	loadTookLong = true;
  }, IS_TOUCH_DEVICE ? MOBILE_ZOOM_DELAY_MS : LOAD_DOT_DELAY_MS);
}

let bioOverlayEl;
let bioCloseDotEl;
let bioOverlayOpen = true;
let bioLinks = [];
let bioActiveLinks = new Set();

const HALO_COLOR_DEFAULT = [255, 255, 255];
const VISITED_TINT_HEX = ['#DD5CA9', '#1DAF3A', '#D93B2B', '#F1DF42', '#FF6A2A', '#965AF2', '#67B7EC'];
const VISITED_TINT_COLORS = VISITED_TINT_HEX.map(hexToRgb);
const VISITED_TINT_OPACITY = [1, 1, 1, 1, 1, 1, 1];
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

const SKY_MASK_VERT = `
precision highp float;
attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
`;

const SKY_MASK_FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uSkyTex;
uniform float uBrightness;
uniform vec2 uMaskCenter;
uniform float uMaskRadius;
uniform float uMaskSoftness;

varying vec2 vTexCoord;

void main() {
  vec3 skyColor = texture2D(uSkyTex, vTexCoord).rgb * uBrightness;
  float dist = distance(gl_FragCoord.xy, uMaskCenter);
  float skyVisibility = smoothstep(uMaskRadius - uMaskSoftness, uMaskRadius + uMaskSoftness, dist);
  gl_FragColor = vec4(skyColor * skyVisibility, skyVisibility);
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
  skyMaskShader = createShader(SKY_MASK_VERT, SKY_MASK_FRAG);
  moveFallbackContentIntoCanvas(cnv.canvas);
  syncProjectsFromDom();
  applyVisitedState();

  bioOverlayEl = document.getElementById('bio-overlay');

  bioCloseDotEl = document.getElementById('bio-close-dot');
  bioCloseDotEl.addEventListener('click', (e) => {
	e.stopPropagation();
	toggleBioOverlay();
  });
  bioCloseDotEl.addEventListener('touchend', (e) => {
	e.preventDefault();
	e.stopPropagation();
	toggleBioOverlay();
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
  }

  bioLinks.forEach((a) => {
	a.addEventListener('touchend', (e) => {
	  e.preventDefault();
	  e.stopPropagation();
	  flashBioLinkTap(a);
	  navigateBioLink(a);
	}, { passive: false });
  });

  bioOverlayEl.classList.add('open');
  bioOverlayEl.setAttribute('aria-hidden', 'false');
  document.body.classList.add('bio-open');
  showBioCloseDotInstantly();
  applyBioRevealCss();

  fadeOutLoadOverlay();
}

function showBioCloseDotInstantly() {
  if (bioCloseDotEl) bioCloseDotEl.style.transition = 'none';
  updateBioCloseDot();
  if (bioCloseDotEl) bioCloseDotEl.offsetHeight;
  if (bioCloseDotEl) bioCloseDotEl.style.transition = '';
}

function updateBioReveal() {
  let growing = bioRevealTarget > bioRevealProgress;
  let ease = growing ? BIO_REVEAL_OPEN_SETTLE_EASE : BIO_REVEAL_CLOSE_EASE;
  bioRevealProgress = lerp(bioRevealProgress, bioRevealTarget, ease);
  applyBioRevealCss();
  updateToggleDotVisual();

  if (bioOverlayOpen && bioRevealTarget <= 0 && bioRevealProgress < 0.002) {
	bioRevealProgress = 0;
	applyBioRevealCss();
	updateToggleDotVisual();
	finalizeBioClose();
  }
}

function computeBioMaskMaxRadius() {
  return Math.sqrt(width * width + height * height) / 2 * SKY_MASK_OVERSHOOT;
}

function applyBioRevealCss() {
  if (!bioOverlayEl) return;
  let radiusPx = bioRevealProgress * computeBioMaskMaxRadius();
  bioOverlayEl.style.clipPath = `circle(${radiusPx}px at 50% 50%)`;
}

function computeDotPulseScale() {
  let phase = (millis() % TOGGLE_DOT_PULSE_PERIOD_MS) / TOGGLE_DOT_PULSE_PERIOD_MS;
  return 1 - TOGGLE_DOT_PULSE_AMPLITUDE * Math.cos(phase * Math.PI * 2);
}

function updateToggleDotVisual() {
  let hoverTarget = bioDotHovering ? BIO_CLOSE_DOT_HOVER_SCALE : 1;
  bioDotHoverScale = lerp(bioDotHoverScale, hoverTarget, BIO_CLOSE_DOT_HOVER_EASE);

  let fullDiameter = computeLoadDotDiameter();
  let opening = bioRevealTarget > 0.5;
  let sizeScale;
  let color;

  if (opening) {
	sizeScale = TOGGLE_DOT_DIP_SCALE + (1 - TOGGLE_DOT_DIP_SCALE) * bioRevealProgress;
	color = TOGGLE_DOT_COLOR_OPEN;
  } else {
	let restDistance = 1 - Math.abs(bioRevealProgress - 0.5) * 2;
	sizeScale = 1 - restDistance * (1 - TOGGLE_DOT_DIP_SCALE);
	color = bioRevealProgress > 0.5 ? TOGGLE_DOT_COLOR_OPEN : TOGGLE_DOT_COLOR_CLOSED;
  }

  toggleDotDiameterPx = fullDiameter * sizeScale * bioDotHoverScale * computeDotPulseScale();
  toggleDotColor = color;
}

function fadeOutLoadOverlay() {
  clearTimeout(loadDotTimer);
  let overlay = document.getElementById('load-overlay');
  let dot = document.getElementById('load-dot');
  if (!overlay) return;
  let shouldZoomOut = loadTookLong;
  // Freeze the dot's current pulse-animated transform, then stop the animation and transition
  // to a scaled-down transform instead, so it visibly shrinks away rather than just fading.
  if (dot) {
	dot.style.transform = getComputedStyle(dot).transform;
	dot.style.animation = 'none';
	dot.offsetHeight;
  }
  if (shouldZoomOut) {
	if (dot) {
	  dot.style.transitionDuration = IS_TOUCH_DEVICE ? MOBILE_REVEAL_TRANSITION_DURATION : DESKTOP_REVEAL_TRANSITION_DURATION;
	  dot.style.opacity = 0;
	  dot.style.transform = 'translate(-50%, -50%) scale(0)';
	}
	if (IS_TOUCH_DEVICE) {
	  overlay.style.transitionDuration = `0.9s, ${MOBILE_REVEAL_TRANSITION_DURATION}`;
	}
	requestAnimationFrame(() => {
	  overlay.classList.add('revealed');
	  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
	});
  } else {
	if (dot) {
	  dot.style.transitionDuration = '0.9s';
	  dot.style.opacity = 0;
	  dot.style.transform = 'translate(-50%, -50%) scale(0)';
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
}

function openBioOverlay() {
  bioRevealTarget = 1;
  settleBioOpenState();
}

function settleBioOpenState() {
  bioOverlayOpen = true;
  bioOverlayEl.classList.add('open');
  bioOverlayEl.setAttribute('aria-hidden', 'false');
  document.body.classList.add('bio-open');
}

function updateBioCloseDot() {
  sizeDotHitElement(bioCloseDotEl);
  updateToggleDotVisual();
}

function setBioCloseDotHover(hovering) {
  bioDotHovering = hovering;
}

function toggleBioOverlay() {
  if (bioRevealTarget > 0.5) {
	closeBioOverlay();
  } else {
	openBioOverlay();
  }
}

function closeBioOverlay() {
  bioRevealTarget = 0;
}

function finalizeBioClose() {
  bioOverlayOpen = false;
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

function mat3RotX(angle) {
  let c = Math.cos(angle), s = Math.sin(angle);
  return [
	1, 0, 0,
	0, c, -s,
	0, s, c
  ];
}

function mat3RotY(angle) {
  let c = Math.cos(angle), s = Math.sin(angle);
  return [
	c, 0, s,
	0, 1, 0,
	-s, 0, c
  ];
}

// Rodrigues' rotation formula: builds a rotation matrix around an arbitrary
// (unit-length) axis. Used for tilt so the rotation always happens around the
// camera's actual current on-screen horizontal axis, rather than a fixed world axis.
function mat3RotAxis(axis, angle) {
  let c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
  let x = axis.x, y = axis.y, z = axis.z;
  return [
	t * x * x + c, t * x * y - s * z, t * x * z + s * y,
	t * x * y + s * z, t * y * y + c, t * y * z - s * x,
	t * x * z - s * y, t * y * z + s * x, t * z * z + c
  ];
}

function mat3Multiply(a, b) {
  let r = new Array(9);
  for (let row = 0; row < 3; row++) {
	for (let col = 0; col < 3; col++) {
	  r[row * 3 + col] =
		a[row * 3 + 0] * b[0 * 3 + col] +
		a[row * 3 + 1] * b[1 * 3 + col] +
		a[row * 3 + 2] * b[2 * 3 + col];
	}
  }
  return r;
}

function mat3Apply(m, x, y, z) {
  return {
	x: m[0] * x + m[1] * y + m[2] * z,
	y: m[3] * x + m[4] * y + m[5] * z,
	z: m[6] * x + m[7] * y + m[8] * z
  };
}

// Re-orthonormalizes an accumulated rotation matrix (Gram-Schmidt on rows) to prevent
// floating-point drift from distorting the orbit after continuous incremental rotation.
function mat3Orthonormalize(m) {
  let r0 = [m[0], m[1], m[2]];
  let r1 = [m[3], m[4], m[5]];
  let r2 = [m[6], m[7], m[8]];

  let dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  let norm = (a) => Math.sqrt(dot(a, a));
  let sub = (a, b, s) => [a[0] - b[0] * s, a[1] - b[1] * s, a[2] - b[2] * s];
  let scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

  r0 = scale(r0, 1 / norm(r0));
  r1 = sub(r1, r0, dot(r1, r0));
  r1 = scale(r1, 1 / norm(r1));
  r2 = sub(r2, r0, dot(r2, r0));
  r2 = sub(r2, r1, dot(r2, r1));
  r2 = scale(r2, 1 / norm(r2));

  return [r0[0], r0[1], r0[2], r1[0], r1[1], r1[2], r2[0], r2[1], r2[2]];
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

function screenRadiusToWorldRadius(screenRadius, depth) {
  let tanHalf = Math.tan(currentVFov() / 2);
  return (screenRadius / (height / 2)) * depth * tanHalf;
}

function drawToggleDot(camEye, camUp, camDist) {
  let radius = screenRadiusToWorldRadius(toggleDotDiameterPx / 2, camDist);
  if (radius <= 0) return;
  let [r, g, b] = toggleDotColor;

  push();
  noStroke();
  noLights();
  fill(r, g, b, 255);
  sphere(radius, 24, 24);
  pop();
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
  let closestDepth = Infinity;

  for (let i = 0; i < projects.length; i++) {
	let p = projects[i];
	if (!p.screenVisible) continue;

	let dx = px - p.screenX;
	let dy = py - p.screenY;
	let d = Math.sqrt(dx * dx + dy * dy);

	// When multiple orbs' hit zones overlap at the cursor, prefer whichever orb is
	// physically nearer the camera (smaller screenDepth), matching what's actually
	// visible/on top, rather than whichever center happens to sit closest to the cursor.
	if (d <= computeHitRadius(p) && p.screenDepth < closestDepth) {
	  closestDepth = p.screenDepth;
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

  return findProjectHitIndex(mouseX, mouseY) !== -1 || isMouseOverLabelZone();
}

function updateDesktopHoverSelection() {
  if (IS_TOUCH_DEVICE) return;

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

  if (isDraggingCamera) {
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

  // Horizontal drag spins the orbs along their orbit path (a phase shift applied before
  // the ring's 3D tilt, so it always reads as "the orbs moving along the ring"). Vertical
  // drag tumbles the whole ring around the camera's actual current on-screen horizontal
  // axis (not a fixed world axis), so it stays natural as the camera auto-rotates. Both
  // share the same sensitivity and inertia, and neither is clamped.
  //
  // The ring's face normal is its local Y axis; orbitRotationMatrix[4] is that axis'
  // current world-space Y component (the camera always sits along world +Y looking at
  // the origin, so this is the dot product of the normal with the direction facing the
  // camera). Once the ring tips past edge-on and this crosses zero, we're looking at its
  // back face, so the left/right spin sense flips to keep the visible face's motion
  // matching the drag direction. Separately, grabbing the ring's far/top half on screen
  // vs its near/bottom half also flips the perceived spin sense (like turning a wheel by
  // its far edge vs its near edge), so that factor is combined in too.
  let normalFacingFactor = orbitRotationMatrix[4] >= 0 ? 1 : -1;
  let screenHalfFactor = (dragging && currentY < height / 2) ? -1 : 1;
  let spinDirection = normalFacingFactor * screenHalfFactor;
  let targetSpinVelocity = dragging ? dragDeltaX * ORBIT_SPIN_DRAG_SENSITIVITY * spinDirection : 0;
  let targetTiltVelocity = dragging ? -dragDeltaY * ORBIT_TILT_DRAG_SENSITIVITY : 0;
  let spinEase = dragging ? ORBIT_SPIN_VELOCITY_EASE : ORBIT_SPIN_INERTIA_DAMPING;
  orbitSpinVelocity = lerp(orbitSpinVelocity, targetSpinVelocity, spinEase);
  orbitSpinAngle += orbitSpinVelocity;
  orbitTiltVelocity = lerp(orbitTiltVelocity, targetTiltVelocity, spinEase);

  let tiltAxis = { x: -Math.cos(camYaw), y: 0, z: Math.sin(camYaw) };
  orbitRotationMatrix = mat3Multiply(mat3RotAxis(tiltAxis, orbitTiltVelocity), orbitRotationMatrix);
  orbitRotationMatrix = mat3Orthonormalize(orbitRotationMatrix);

  camYaw += CAM_AUTO_ROTATE_SPEED * timeScale;
  if (dragging) {
	camYaw += dragDeltaX * CAMERA_YAW_DRAG_SENSITIVITY;
  }
}

function updateHoverCursor() {
  if (IS_TOUCH_DEVICE) return;

  if (isDraggingCamera) {
	document.body.style.cursor = 'grabbing';
	return;
  }

  let hovering = isHoveringAnyProject();

  document.body.style.cursor = hovering ? 'pointer' : 'default';
}

function draw() {
  clear();

  updateDesktopHoverSelection();

  let targetTimeScale = (selectedIndex === -1) ? 1 : 0;
  timeScale = lerp(timeScale, targetTimeScale, TIME_SCALE_EASE);

  updateCameraOrientation();
  updateBioReveal();

  orbitHoverScale = lerp(orbitHoverScale, isHoveringAnyProject() ? ORBIT_HOVER_SLOWDOWN : 1, ORBIT_HOVER_EASE);

  // Both spin (yaw-like motion along the orbit path) and tilt (tumbling the ring) fling the
  // orbs outward from center, so their combined angular speed drives the radius boost. Tilt is
  // weighted down heavily so it only nudges the radius subtly compared to spin.
  let combinedRadiusVelocity = Math.hypot(orbitSpinVelocity, orbitTiltVelocity * ORBIT_RADIUS_TILT_WEIGHT);
  let targetRadiusBoost = Math.min(combinedRadiusVelocity * ORBIT_RADIUS_VELOCITY_SCALE, ORBIT_RADIUS_BOOST_MAX);
  orbitRadiusBoost = lerp(orbitRadiusBoost, targetRadiusBoost, ORBIT_RADIUS_BOOST_EASE);
  let minorRadiusBoost = orbitRadiusBoost * (ORBIT_MINOR_RADIUS / ORBIT_MAJOR_RADIUS);

  let camDist = computeCameraDistance();
  let upX = sin(camYaw);
  let upZ = cos(camYaw);
  let eyeX = 0;
  let eyeY = camDist;
  let eyeZ = 0;
  camera(eyeX, eyeY, eyeZ, 0, 0, 0, upX, 0, upZ);
  let camEye = { x: eyeX, y: eyeY, z: eyeZ };
  let camUp = { x: upX, y: 0, z: upZ };
  let camLightDir = computeCameraLightDir(camEye, camUp);

  push();
  camera(0, camDist, 0, 0, 0, 0, 0, 0, 1);
  noLights();
  if (bioRevealProgress < 0.999) {
	let density = pixelDensity();
	let maxMaskRadius = Math.sqrt(width * width + height * height) / 2 * density * SKY_MASK_OVERSHOOT;
	shader(skyMaskShader);
	skyMaskShader.setUniform('uSkyTex', skyImg);
	skyMaskShader.setUniform('uBrightness', lerp(SKYBOX_MIN_BRIGHTNESS, 1, timeScale));
	skyMaskShader.setUniform('uMaskCenter', [width * density / 2, height * density / 2]);
	skyMaskShader.setUniform('uMaskRadius', bioRevealProgress * maxMaskRadius);
	skyMaskShader.setUniform('uMaskSoftness', SKY_MASK_SOFTNESS * density);
	sphere(2000, 48, 48);
	resetShader();
  }
  pop();

  drawToggleDot(camEye, camUp, camDist);

  let majorRadius = ORBIT_MAJOR_RADIUS;
  let minorRadius = ORBIT_MINOR_RADIUS;

  for (let i = 0; i < projects.length; i++) {
	let p = projects[i];

	let major = majorRadius + (i - 3) * 6 + orbitRadiusBoost;
	let minor = minorRadius + (i - 3) * 4 + minorRadiusBoost;

	let x = major * cos(p.orbitAngle + orbitSpinAngle);
	let z = minor * sin(p.orbitAngle + orbitSpinAngle);
	let y = 0;

	let worldPos = mat3Apply(orbitRotationMatrix, x, y, z);
	let posX = worldPos.x;
	let posY = worldPos.y;
	let posZ = worldPos.z;

	push();
	translate(posX, posY, posZ);
	if (p.lightMix === undefined) p.lightMix = 0;
	let lightTarget = (i === selectedIndex) ? 1 : 0;
	p.lightMix = lerp(p.lightMix, lightTarget, LIGHT_MIX_EASE);

	if (p.visitedMix === undefined) p.visitedMix = 0;
	let visitedTarget = p.visited ? VISITED_TINT_OPACITY[i] : 0;
	p.visitedMix = lerp(p.visitedMix, visitedTarget, VISITED_MIX_EASE);

	drawReflectiveOrb(p.size, posX, posY, posZ, camEye, camLightDir, VISITED_TINT_COLORS[i], p.visitedMix);
	pop();

	p.posX = posX;
	p.posY = posY;
	p.posZ = posZ;

	let proj = worldToScreen(posX, posY, posZ, camEye, camUp);
	if (proj) {
	  p.screenX = proj.x;
	  p.screenY = proj.y;
	  p.screenRadius = worldRadiusToScreenRadius(p.size / 2, proj.depth);
	  p.screenDepth = proj.depth;
	  p.screenVisible = true;
	} else {
	  p.screenVisible = false;
	}
	p.orbitAngle += p.orbitSpeed * timeScale * orbitHoverScale;
  }

  // Halos are drawn in their own pass, after every orb's opaque sphere is already in the
  // depth buffer. That way each halo's normal depth TEST correctly checks it against every
  // orb's real depth (not just the orb it belongs to, and regardless of loop order), so it's
  // properly hidden behind whichever orbs are actually nearer the camera. Depth WRITE stays
  // off for halos since nothing else draws after them: this avoids a translucent, nearly-
  // faded-out halo from ever blocking anything (the cause of the old black-trail glitch),
  // while still letting them draw correctly over anything farther away.
  for (let i = 0; i < projects.length; i++) {
	let p = projects[i];
	if (p.lightMix === undefined || p.lightMix <= 0.01 || !p.screenVisible) continue;

	let posX = p.posX, posY = p.posY, posZ = p.posZ;

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
	translate(posX, posY, posZ);
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
	drawingContext.depthMask(false);
	circle(0, 0, p.size * HALO_SCALE * sizeCompensation);
	drawingContext.depthMask(true);
	pop();
  }

  updateHoverCursor();
  updateOrbLabel();
  updateOrbLinkHitzone();
  updateDotOcclusion(camDist);
}

// The toggle dot always sits at world origin, dead center of the screen. When an orb currently
// orbits in front of it (closer to the camera) and its screen circle overlaps the dot's ACTUAL
// VISIBLE silhouette, that orb is visually covering the dot: clicks/hovers there should hit the
// orb, not the dot. The dot's DOM hit element normally sits above the canvas in stacking order
// (so it's clickable at all), so disable its pointer events for as long as an occluding orb is
// over it, letting the click/hover fall through to the orb's own hit-testing underneath.
//
// This check deliberately uses the dot's real on-screen visual radius here (not its much-larger
// DOM hit radius from computeDotHitDiameter()): using the inflated hit radius made the dot look
// "occluded" -- and get its pointer-events disabled -- whenever an orb merely passed nearby,
// even while still fully visible and not actually covered. Since an orb's own hit radius
// (computeHitRadius) is already generously bigger than its visual size, any point where the dot
// is genuinely covered is still safely within the orb's own hit zone, so clicks there properly
// fall through to the orb with no dead zone in between.
function updateDotOcclusion(camDist) {
  if (!bioCloseDotEl) return;

  let dotVisualRadius = toggleDotDiameterPx / 2;
  let centerX = width / 2;
  let centerY = height / 2;
  let occluded = false;

  for (let i = 0; i < projects.length; i++) {
	let p = projects[i];
	if (!p.screenVisible || p.screenDepth >= camDist) continue;

	let dx = p.screenX - centerX;
	let dy = p.screenY - centerY;
	let dist = Math.sqrt(dx * dx + dy * dy);
	if (dist < p.screenRadius + dotVisualRadius) {
	  occluded = true;
	  break;
	}
  }

  bioCloseDotEl.style.pointerEvents = occluded ? 'none' : '';
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
  if (event && event.target && event.target.closest && event.target.closest('#label, #orb-link, #bio-close-dot, .bio-overlay-links a')) return false;
  beginCameraDrag(mouseX, mouseY);
  return false;
}

function mouseReleased(event) {
  if (!isDraggingCamera) return false;
  isDraggingCamera = false;
  if (event && event.target && event.target.closest && event.target.closest('#label, #orb-link, #bio-close-dot, .bio-overlay-links a')) return false;
  if (!dragMoved) finalizeTap(mouseX, mouseY);
  return false;
}

function touchStarted(event) {
  if (event && event.target && event.target.closest && event.target.closest('#label, #orb-link, #bio-close-dot, .bio-overlay-links a')) return false;
  if (touches.length > 0) {
	beginCameraDrag(touches[0].x, touches[0].y);
	lastTouchDragX = touches[0].x;
	lastTouchDragY = touches[0].y;
  }
  return false;
}

function touchEnded(event) {
  if (!isDraggingCamera) return false;
  isDraggingCamera = false;
  lastTouchDragX = null;
  lastTouchDragY = null;
  if (event && event.target && event.target.closest && event.target.closest('#label, #orb-link, #bio-close-dot, .bio-overlay-links a')) return false;
  if (!dragMoved) finalizeTap(dragStartX, dragStartY);
  return false;
}

