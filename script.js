if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);
window.addEventListener('DOMContentLoaded', () => window.scrollTo(0, 0));
window.addEventListener('load', () => window.scrollTo(0, 0));

let projects = [
  { title: "XD Magazine", year: 2026, url: "https://xdmag.com", orbitAngle: 5.4, orbitSpeed: 0.0015, size: 74 },
  { title: "Joanna", year: 2026, url: "https://joannaistanbul.com", orbitAngle: 4.5, orbitSpeed: 0.0015, size: 74 },
  { title: "Nick Lambrou", year: 2025, url: "https://nlambrou.com", orbitAngle: 0, orbitSpeed: 0.0015, size: 74 },
  { title: "[untold]", year: 2026, url: "untold/", orbitAngle: 3.6, orbitSpeed: 0.0015, size: 74 },
  { title: "Persistence of Color", year: 2025, url: "persistence-of-color/", orbitAngle: 1.8, orbitSpeed: 0.0015, size: 74 }
];

function distributeOrbitAnglesEvenly(list, startAngle) {
  if (!Array.isArray(list) || list.length === 0) return;
  let step = (Math.PI * 2) / list.length;
  for (let i = 0; i < list.length; i++) {
    list[i].orbitAngle = startAngle - (step * i);
  }
}

distributeOrbitAnglesEvenly(projects, 5.4);

let skyImg;
let citrusImg;
let orbReflectShader;
let skyMaskShader;

let selectedIndex = -1;
let timeScale = 1;
const TIME_SCALE_EASE = 0.08;
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
let touchStartY = 0;

const SCROLL_OVERSCROLL_DELTA_CLAMP = 40;
let pendingOverscrollDeltaX = 0;
let pendingOverscrollDeltaY = 0;
let pendingOverscrollPointerY = null;

const ORBIT_SPIN_DRAG_SENSITIVITY = 0.0035;
const ORBIT_TILT_DRAG_SENSITIVITY = 0.0035;
const ORBIT_SPIN_VELOCITY_EASE = 0.2;
const ORBIT_SPIN_INERTIA_DAMPING = 0.028;
const PAGE_TRANSITION_TILT_IMPULSE = 0.034;
let orbitSpinAngle = 0;
let orbitSpinVelocity = 0;
let orbitTiltVelocity = 0;

const ORBIT_RADIUS_VELOCITY_SCALE = 1000;
const ORBIT_RADIUS_BOOST_MAX = 200;
const ORBIT_RADIUS_BOOST_EASE = 0.06;
const ORBIT_RADIUS_TILT_WEIGHT = 0.2;
let orbitRadiusBoost = 0;
let orbitRotationMatrix = mat3Multiply(mat3RotY((28 * Math.PI) / 180), mat3RotX((38 * Math.PI) / 180));

const IS_TOUCH_DEVICE = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
document.documentElement.classList.toggle('is-touch-device', IS_TOUCH_DEVICE);

let stableViewportWidth = 0;
let stableViewportHeight = 0;
let initialViewportHeight = 0;

function applyStableViewportHeight(heightPx) {
  document.documentElement.style.setProperty('--app-height', heightPx + 'px');
}

let viewportChromeInsetPx = 0;

function applyViewportChromeInset(insetPx) {
  viewportChromeInsetPx = Math.max(0, insetPx);
  document.documentElement.style.setProperty('--viewport-chrome-inset', viewportChromeInsetPx + 'px');
}

function verticalCenterOffset() {
  return IS_TOUCH_DEVICE ? viewportChromeInsetPx / 2 : 0;
}

function measureLargeViewportHeight() {
  if (typeof CSS === 'undefined' || !CSS.supports || !CSS.supports('height', '100lvh')) {
    return window.innerHeight;
  }
  let probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100lvh;visibility:hidden;pointer-events:none;';
  document.body.appendChild(probe);
  let h = probe.getBoundingClientRect().height;
  probe.remove();
  return h > 0 ? h : window.innerHeight;
}

function resolveStableViewportHeight() {
  return IS_TOUCH_DEVICE ? Math.max(window.innerHeight, measureLargeViewportHeight()) : window.innerHeight;
}

function shouldShowOrbLabel() {
  if (document.body.classList.contains('skybox-view')) return true;
  return window.scrollY <= initialViewportHeight * 0.25;
}

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

let pageScrollLockedForBio = false;

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
  let h = resolveStableViewportHeight();
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

function positionLoadDot() {
  let dot = document.getElementById('load-dot');
  if (!dot) return;
  let centerX = (typeof width !== 'undefined' && width > 0) ? width : window.innerWidth;
  let centerY = (typeof height !== 'undefined' && height > 0) ? height : resolveStableViewportHeight();
  dot.style.left = `${centerX / 2}px`;
  dot.style.top = `${centerY / 2 - verticalCenterOffset()}px`;
}
if (IS_TOUCH_DEVICE) {
  applyViewportChromeInset(resolveStableViewportHeight() - window.innerHeight);
}
positionLoadDot();

document.body.classList.add('preload-lock');

function computeDotHitDiameter() {
  let visualRadius = computeLoadDotDiameter() / 2;
  let hitRadius = IS_TOUCH_DEVICE ? Math.max((Math.max(visualRadius * 1.1, 36) * 1.5) * 0.5, 36) : Math.max(visualRadius * 1.6, 44);
  return hitRadius * 2;
}

function sizeDotHitElement(dot) {
  if (!dot) return;
  let diameter = computeDotHitDiameter();
  dot.style.width = diameter + 'px';
  dot.style.height = diameter + 'px';
}

function positionBioCloseDot() {
  if (!bioCloseDotEl) return;
  bioCloseDotEl.style.left = `${width / 2}px`;
  bioCloseDotEl.style.top = `${height / 2 - verticalCenterOffset()}px`;
}

const DESKTOP_REVEAL_TRANSITION_DURATION = '0.55s';
const MOBILE_REVEAL_TRANSITION_DURATION = '0.7s';
const OVERLAY_FADE_TRANSITION_DURATION = '0.35s';
{
  let dot = document.getElementById('load-dot');
  if (dot) dot.classList.add('visible');
}

let bioOverlayEl;
let bioOverlayContentEl;
let bioCloseDotEl;
let pageIntroEl;
let pageIntroDynamicEl;
let pageProjectsEl;
let pageContactEl;
let pageProjectTitleLinks = [];
let pageProjectIntroTextByIndex = [];
let pageProjectIntroHrefByIndex = [];
let pageContactLinks = [];
let domProjectHoverIndex = -1;
let lastSelectedIndex = -2;
let bioOverlayOpen = true;
let bioLinks = [];
let bioActiveLinks = new Set();
const PAGE_INTRO_DEFAULT_TEXT = 'Working across web, print, images and sound.';
const INTRO_HIGHLIGHT_PHRASES = [
  'web, print, images and sound.',
  'XD',
  'print magazine',
  'commercial website',
  'Joanna',
  'portfolio website',
  'Nick Lambrou',
  '[untold]',
  'dedicated space',
  'Persistence of Color',
  'digital binding.',
  'collaborations',
  'social media.',
  'web projects'
];
const INTRO_HIGHLIGHT_PATTERN = new RegExp(
  INTRO_HIGHLIGHT_PHRASES
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|'),
  'gi'
);
const PAGE_INTRO_RESET_DELAY_MS = 70;
const PAGE_INTRO_FADE_DURATION_MS = 360;
const MOBILE_INTRO_TWO_TAP_RESET_MS = 2500;
const INTRO_LOCK_BREAKPOINT_PX = 960;
const INTRO_TWO_TAP_LINK_SELECTOR = '#page-content nav[aria-labelledby="selected-projects-title"] h3 a, #page-content footer[aria-labelledby="main-contact-heading"] a';
let pageIntroResetTimer = null;
let pageIntroTargetText = PAGE_INTRO_DEFAULT_TEXT;
let pageIntroCurrentText = PAGE_INTRO_DEFAULT_TEXT;
let pageIntroActiveHref = null;
let pageIntroFadeToken = 0;
let pageIntroSwapTimer = null;
let mobileIntroArmedLink = null;
let mobileIntroArmedTimer = null;

const HALO_COLOR_DEFAULT = [255, 255, 255];
const VISITED_TINT_HEX = ['#EB3DA8', '#1DAF3A', '#9939EF', '#E81C1D', '#FF6A2A', '#F1DF42', '#319DE5'];
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
  // Orb reflection texture: "Citrus Orchard Road Puresky" from Poly Haven (CC0)
  // https://polyhaven.com/a/citrus_orchard_road_puresky
  citrusImg = loadImage('assets/citrus_orchard_road_puresky.jpg');
}

function blockTouchScrollWhileOrbSelected(event) {
  if (!IS_TOUCH_DEVICE) return;
  if (selectedIndex !== -1) {
    event.preventDefault();
    return;
  }
  if (!event.touches || event.touches.length !== 1) return;

  let currentY = event.touches[0].clientY;
  let pullingDown = currentY > touchStartY;
  let atTop = window.scrollY <= 0;

  if (atTop && pullingDown) {
    event.preventDefault();
  }

  touchStartY = currentY;
}

function rememberTouchStartY(event) {
  if (!IS_TOUCH_DEVICE) return;
  if (!event.touches || event.touches.length !== 1) return;
  touchStartY = event.touches[0].clientY;
}

function setup() {
  stableViewportWidth = window.innerWidth;
  stableViewportHeight = resolveStableViewportHeight();
  initialViewportHeight = window.innerHeight;
  applyViewportChromeInset(IS_TOUCH_DEVICE ? stableViewportHeight - initialViewportHeight : 0);
  let cnv = createCanvas(stableViewportWidth, stableViewportHeight, WEBGL);
  applyStableViewportHeight(stableViewportHeight);
  let heroEl = document.getElementById('hero');
  if (heroEl) cnv.parent(heroEl);
  noStroke();
  if (IS_TOUCH_DEVICE) {
	document.addEventListener('touchstart', rememberTouchStartY, { passive: true });
	document.addEventListener('touchmove', blockTouchScrollWhileOrbSelected, { passive: false });
  }
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
  applyVisitedState();
  bindPageProjectLinks();

  bioOverlayEl = document.getElementById('bio-overlay');
  bioOverlayContentEl = document.querySelector('#bio-overlay .bio-overlay-content');
  pageIntroEl = document.querySelector('#page-content > article > header p');
  pageIntroDynamicEl = document.getElementById('intro-dynamic-text');
  pageProjectsEl = document.querySelector('#page-content nav[aria-labelledby="selected-projects-title"]');
  pageContactEl = document.querySelector('#page-content footer[aria-labelledby="main-contact-heading"]');
  if (pageIntroDynamicEl) {
    pageIntroCurrentText = pageIntroDynamicEl.textContent || PAGE_INTRO_DEFAULT_TEXT;
    renderIntroDynamicText(pageIntroCurrentText);
  }
  bindMobileTwoTapIntroReset();
  setupProjectIntroHoverText();
  setupContactIntroHoverText();
  setupMobileListToggles();
  lockIntroHeightOnSmallScreens();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(lockIntroHeightOnSmallScreens);
  }

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

  settleBioOpenState();
  showBioCloseDotInstantly();
  applyBioRevealCss();

  positionLoadDot();

  fadeOutLoadOverlay();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderIntroDynamicText(text) {
  if (!pageIntroDynamicEl) return;
  pageIntroCurrentText = text;
  let safeText = escapeHtml(text);
  pageIntroDynamicEl.innerHTML = safeText.replace(INTRO_HIGHLIGHT_PATTERN, (match) => `<span class="offwhite-highlight">${match}</span>`);
}

function setTouchSelectionState(nextIndex) {
  selectedIndex = nextIndex;
  lastSelectedIndex = nextIndex;
  pendingOpenIndex = -1;
}

function animateIntroTextTo(targetText, linkHref) {
  if (!pageIntroDynamicEl) return;
  let nextHref = linkHref || null;
  if (targetText === pageIntroTargetText && pageIntroCurrentText === targetText && pageIntroActiveHref === nextHref) return;
  if (pageIntroResetTimer) {
    clearTimeout(pageIntroResetTimer);
    pageIntroResetTimer = null;
  }
  if (pageIntroSwapTimer) {
    clearTimeout(pageIntroSwapTimer);
    pageIntroSwapTimer = null;
  }
  pageIntroTargetText = targetText;
  pageIntroFadeToken += 1;
  let fadeToken = pageIntroFadeToken;
  let fadeDurationMs = PAGE_INTRO_FADE_DURATION_MS;
  let swapDelayMs = fadeDurationMs;
  let lockedWidthPx = Math.ceil(pageIntroDynamicEl.getBoundingClientRect().width);

  pageIntroDynamicEl.style.display = 'inline-block';
  pageIntroDynamicEl.style.width = `${lockedWidthPx}px`;
  pageIntroDynamicEl.style.transitionDuration = `${fadeDurationMs}ms`;
  pageIntroDynamicEl.style.opacity = '0';

  pageIntroSwapTimer = window.setTimeout(() => {
    if (fadeToken !== pageIntroFadeToken) return;
    pageIntroActiveHref = nextHref;
    renderIntroDynamicText(targetText);
    requestAnimationFrame(() => {
      if (fadeToken !== pageIntroFadeToken) return;
      pageIntroDynamicEl.style.opacity = '1';
    });
  }, swapDelayMs);
}

function scheduleIntroTextReset() {
  if (pageIntroResetTimer) {
    clearTimeout(pageIntroResetTimer);
  }
  pageIntroResetTimer = setTimeout(() => {
    pageIntroResetTimer = null;
    animateIntroTextTo(PAGE_INTRO_DEFAULT_TEXT, null);
  }, PAGE_INTRO_RESET_DELAY_MS);
}

function clearMobileIntroArmedLink() {
  if (mobileIntroArmedLink) mobileIntroArmedLink.classList.remove('two-tap-armed');
  mobileIntroArmedLink = null;
  if (mobileIntroArmedTimer) {
    clearTimeout(mobileIntroArmedTimer);
    mobileIntroArmedTimer = null;
  }
}

function armMobileIntroLink(link) {
  if (mobileIntroArmedLink && mobileIntroArmedLink !== link) {
    mobileIntroArmedLink.classList.remove('two-tap-armed');
  }
  mobileIntroArmedLink = link;
  link.classList.add('two-tap-armed');
  if (mobileIntroArmedTimer) clearTimeout(mobileIntroArmedTimer);
  mobileIntroArmedTimer = setTimeout(() => {
    clearMobileIntroArmedLink();
  }, MOBILE_INTRO_TWO_TAP_RESET_MS);
}

function bindMobileTwoTapIntroReset() {
  if (!IS_TOUCH_DEVICE) return;

  document.addEventListener('touchstart', (event) => {
    if (!mobileIntroArmedLink) return;
    let tappedIntroLink = event.target && event.target.closest && event.target.closest(INTRO_TWO_TAP_LINK_SELECTOR);
    if (tappedIntroLink) return;

    clearMobileIntroArmedLink();
    if (selectedIndex === -1) {
      animateIntroTextTo(PAGE_INTRO_DEFAULT_TEXT, null);
    }
  }, { passive: true });
}

function registerMobileIntroTwoTap(link, targetText, linkHref, selectionIndex = -1) {
  if (!IS_TOUCH_DEVICE) return;

  link.addEventListener('click', (event) => {
    let alreadySelected = selectionIndex !== -1 && selectedIndex === selectionIndex;
    if (mobileIntroArmedLink === link || alreadySelected) {
      clearMobileIntroArmedLink();
      return;
    }

    event.preventDefault();
    setTouchSelectionState(selectionIndex);
    animateIntroTextTo(targetText, linkHref);
    armMobileIntroLink(link);
  });
}

function setupProjectIntroHoverText() {
  if (!pageProjectsEl || !pageIntroDynamicEl) return;

  let projectArticles = Array.from(pageProjectsEl.querySelectorAll('article'));
  pageProjectTitleLinks = [];
  pageProjectIntroTextByIndex = [];
  pageProjectIntroHrefByIndex = [];
  projectArticles.forEach((article) => {
    let titleLink = article.querySelector('h3 a');
    let descriptionLink = article.querySelector('p a');
    let targetText = (descriptionLink ? descriptionLink.textContent : '') || (titleLink ? titleLink.textContent : '');
    targetText = targetText.trim();
    let linkHref = titleLink ? (titleLink.getAttribute('href') || null) : null;
    let projectIndex = projects.findIndex((item) => item.url === linkHref);
    if (!targetText || !titleLink) return;

    pageProjectTitleLinks.push(titleLink);
    titleLink.dataset.projectIndex = String(projectIndex);
    if (projectIndex !== -1) {
      pageProjectIntroTextByIndex[projectIndex] = targetText;
      pageProjectIntroHrefByIndex[projectIndex] = linkHref;
    }

    if (IS_TOUCH_DEVICE) {
      registerMobileIntroTwoTap(titleLink, targetText, linkHref, projectIndex);
      return;
    }

    titleLink.addEventListener('mouseenter', () => {
      domProjectHoverIndex = projectIndex;
      animateIntroTextTo(targetText, linkHref);
    });
    titleLink.addEventListener('mouseleave', () => {
      if (domProjectHoverIndex === projectIndex) domProjectHoverIndex = -1;
      scheduleIntroTextReset();
    });
    titleLink.addEventListener('focus', () => {
      domProjectHoverIndex = projectIndex;
      animateIntroTextTo(targetText, linkHref);
    });
    titleLink.addEventListener('blur', () => {
      if (domProjectHoverIndex === projectIndex) domProjectHoverIndex = -1;
      scheduleIntroTextReset();
    });
  });
}

function setupContactIntroHoverText() {
  if (!pageContactEl || !pageIntroDynamicEl) return;

  pageContactLinks = Array.from(pageContactEl.querySelectorAll('a'));
  pageContactLinks.forEach((link) => {
    let targetText = (link.getAttribute('data-intro') || '').trim();
    let linkHref = link.getAttribute('href') || null;
    if (!targetText) return;

    if (IS_TOUCH_DEVICE) {
      registerMobileIntroTwoTap(link, targetText, linkHref, -1);
      return;
    }

    link.addEventListener('mouseenter', () => animateIntroTextTo(targetText, linkHref));
    link.addEventListener('mouseleave', () => scheduleIntroTextReset());
    link.addEventListener('focus', () => animateIntroTextTo(targetText, linkHref));
    link.addEventListener('blur', () => scheduleIntroTextReset());
  });
}

function updateIntroTextFromOrbSelection() {
  if (selectedIndex === lastSelectedIndex) return;
  lastSelectedIndex = selectedIndex;

  if (selectedIndex !== -1) {
    let targetText = pageProjectIntroTextByIndex[selectedIndex] || projects[selectedIndex].title;
    let targetHref = pageProjectIntroHrefByIndex[selectedIndex] || projects[selectedIndex].url || null;
    animateIntroTextTo(targetText, targetHref);
    return;
  }

  animateIntroTextTo(PAGE_INTRO_DEFAULT_TEXT, null);
}

function collectIntroDynamicCandidates() {
  let candidates = [PAGE_INTRO_DEFAULT_TEXT];

  if (pageProjectsEl) {
    let projectArticles = Array.from(pageProjectsEl.querySelectorAll('article'));
    projectArticles.forEach((article) => {
      let titleLink = article.querySelector('h3 a');
      let descriptionLink = article.querySelector('p a');
      let targetText = (descriptionLink ? descriptionLink.textContent : '') || (titleLink ? titleLink.textContent : '');
      targetText = (targetText || '').trim();
      if (targetText) candidates.push(targetText);
    });
  }

  if (pageContactEl) {
    let contactLinks = Array.from(pageContactEl.querySelectorAll('a[data-intro]'));
    contactLinks.forEach((link) => {
      let targetText = (link.getAttribute('data-intro') || '').trim();
      if (targetText) candidates.push(targetText);
    });
  }

  return candidates;
}

function lockIntroHeightOnSmallScreens() {
  if (!pageIntroEl) return;

  if (window.innerWidth >= INTRO_LOCK_BREAKPOINT_PX) {
    pageIntroEl.style.minHeight = '';
    return;
  }

  let paragraphWidth = Math.max(1, Math.round(pageIntroEl.getBoundingClientRect().width));
  let computed = window.getComputedStyle(pageIntroEl);
  let probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.left = '-9999px';
  probe.style.top = '0';
  probe.style.width = `${paragraphWidth}px`;
  probe.style.whiteSpace = 'normal';
  probe.style.fontFamily = computed.fontFamily;
  probe.style.fontSize = computed.fontSize;
  probe.style.fontWeight = computed.fontWeight;
  probe.style.fontStyle = computed.fontStyle;
  probe.style.letterSpacing = computed.letterSpacing;
  probe.style.lineHeight = computed.lineHeight;
  probe.style.wordSpacing = computed.wordSpacing;
  probe.style.textTransform = computed.textTransform;

  document.body.appendChild(probe);

  let maxHeight = 0;
  let candidates = collectIntroDynamicCandidates();
  candidates.forEach((text) => {
    probe.textContent = text;
    maxHeight = Math.max(maxHeight, probe.getBoundingClientRect().height);
  });

  probe.remove();

  if (maxHeight > 0) {
    pageIntroEl.style.minHeight = `${Math.ceil(maxHeight)}px`;
  }
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

  if (bioOverlayOpen && bioRevealTarget >= 1 && bioRevealProgress > 0.998) {
	bioRevealProgress = 1;
	applyBioRevealCss();
	pageScrollLockedForBio = false;
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
  let overlay = document.getElementById('load-overlay');
  let dot = document.getElementById('load-dot');
  if (!overlay) {
    document.body.classList.remove('preload-lock');
    return;
  }
  if (dot) {
	dot.style.transform = getComputedStyle(dot).transform;
	dot.style.animation = 'none';
	dot.offsetHeight;
  dot.style.transitionDuration = IS_TOUCH_DEVICE
    ? MOBILE_REVEAL_TRANSITION_DURATION
    : DESKTOP_REVEAL_TRANSITION_DURATION;
	dot.style.opacity = 0;
	dot.style.transform = 'translate(-50%, -50%) scale(0)';
  }
  overlay.style.transitionDuration = `${OVERLAY_FADE_TRANSITION_DURATION}, ${IS_TOUCH_DEVICE ? MOBILE_REVEAL_TRANSITION_DURATION : DESKTOP_REVEAL_TRANSITION_DURATION}`;
  requestAnimationFrame(() => {
  overlay.classList.add('revealed');
  overlay.addEventListener('transitionend', () => {
    document.body.classList.remove('preload-lock');
    overlay.remove();
  }, { once: true });
  });
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
  setSkyboxInteractionLock(false);
}

function updateBioCloseDot() {
  sizeDotHitElement(bioCloseDotEl);
  positionBioCloseDot();
  updateToggleDotVisual();
}

function setBioCloseDotHover(hovering) {
  bioDotHovering = hovering;
}

function toggleBioOverlay() {
  pageScrollLockedForBio = true;
  if (bioRevealTarget > 0.5) {
	closeBioOverlay();
  } else {
	openBioOverlay();
  }
}

function closeBioOverlay() {
  bioRevealTarget = 0;
  document.body.classList.add('skybox-view');
}

function finalizeBioClose() {
  bioOverlayOpen = false;
  bioOverlayEl.classList.remove('open');
  bioOverlayEl.setAttribute('aria-hidden', 'true');
  resetBioLinksAfterClose();
  setSkyboxInteractionLock(true);
}

function resetBioLinksAfterClose() {
  if (bioOverlayOpen) return;
  document.body.classList.remove('bio-open');
  bioActiveLinks.clear();
  if (!IS_TOUCH_DEVICE) {
	bioLinks.forEach((a) => a.classList.remove('bio-link-active'));
  }
}

function setSkyboxInteractionLock(locked) {
  let pageContentEl = document.getElementById('page-content');
  document.body.classList.toggle('skybox-view', locked);
  if (!pageContentEl) return;

  if (locked) {
    pageContentEl.setAttribute('inert', '');
    pageContentEl.setAttribute('aria-hidden', 'true');
    return;
  }

  pageContentEl.removeAttribute('inert');
  pageContentEl.removeAttribute('aria-hidden');
}

function bindPageProjectLinks() {
  let contentRoot = document.getElementById('page-content');
  if (!contentRoot) return;

  contentRoot.addEventListener('click', (event) => {
  let link = event.target.closest('nav[aria-labelledby="selected-projects-title"] a');
  if (!link) return;
  if (event.defaultPrevented) return;
  let href = link.getAttribute('href');
  let project = projects.find((item) => item.url === href);
  if (!project) return;
  markProjectVisited(project);
  applyVisitedState();
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
  let nextWidth = window.innerWidth;
  let nextHeight = resolveStableViewportHeight();

  if (IS_TOUCH_DEVICE && nextWidth === stableViewportWidth && nextHeight === stableViewportHeight) {
    return;
  }

  stableViewportWidth = nextWidth;
  stableViewportHeight = nextHeight;
  applyStableViewportHeight(stableViewportHeight);
  lockIntroHeightOnSmallScreens();
  resizeCanvas(nextWidth, nextHeight);
  positionLoadDot();
  positionBioCloseDot();
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

function findProjectHitIndex(px, py) {
  let hitIndex = -1;
  let closestDepth = Infinity;

  for (let i = 0; i < projects.length; i++) {
	let p = projects[i];
	if (!p.screenVisible) continue;

	let dx = px - p.screenX;
	let dy = py - p.screenY;
	let d = Math.sqrt(dx * dx + dy * dy);

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

  if (domProjectHoverIndex !== -1) {
    selectedIndex = domProjectHoverIndex;
    return;
  }

  let hitIndex = findProjectHitIndex(mouseX, mouseY);
  if (hitIndex === -1 && isMouseOverLabelZone()) {
	hitIndex = labelContentIndex;
  }
  selectedIndex = hitIndex;
}

function updateProjectNameSelectionState() {
  if (!pageProjectTitleLinks.length) return;
  let hasSelectedProject = selectedIndex !== -1;

  for (let i = 0; i < pageProjectTitleLinks.length; i++) {
    let link = pageProjectTitleLinks[i];
    let index = Number(link.dataset.projectIndex);
    let isSelected = index === selectedIndex;
    link.classList.toggle('orb-selected-name', isSelected);
    link.classList.toggle('orb-dimmed-name', hasSelectedProject && !isSelected);
  }

  if (mobileProjectsToggleEl) mobileProjectsToggleEl.classList.toggle('orb-dimmed-name', hasSelectedProject);
  if (mobileContactToggleEl) mobileContactToggleEl.classList.toggle('orb-dimmed-name', hasSelectedProject);

  if (hasSelectedProject) {
    setMobileListOpen(mobileContactListEl, mobileContactToggleEl, false);
    setMobileListOpen(mobileProjectsListEl, mobileProjectsToggleEl, true);
  }
}

let mobileProjectsListEl = null;
let mobileProjectsToggleEl = null;
let mobileContactListEl = null;
let mobileContactToggleEl = null;

function setMobileListOpen(listEl, toggleEl, open) {
  if (!listEl || !toggleEl) return;
  listEl.classList.toggle('open', open);
  toggleEl.setAttribute('aria-expanded', open ? 'true' : 'false');
  toggleEl.classList.toggle('is-open', open);
}

function toggleMobileList(listEl, toggleEl) {
  if (!listEl || !toggleEl) return;
  setMobileListOpen(listEl, toggleEl, !listEl.classList.contains('open'));
  toggleEl.blur();
}

function closeMobileLists() {
  setMobileListOpen(mobileProjectsListEl, mobileProjectsToggleEl, false);
  setMobileListOpen(mobileContactListEl, mobileContactToggleEl, false);
}

const MOBILE_LIST_PRESERVE_SELECTOR = '#hero, #bio-overlay, #bio-close-dot, nav[aria-labelledby="selected-projects-title"], footer[aria-labelledby="main-contact-heading"]';

function setupMobileListOutsideClose() {
  document.addEventListener('click', (event) => {
    if (event.target && event.target.closest && event.target.closest(MOBILE_LIST_PRESERVE_SELECTOR)) return;
    closeMobileLists();
  });
}

function setupDesktopListHoverToggle(sectionEl, listEl, toggleEl, otherListEl, otherToggleEl) {
  if (!sectionEl || !listEl || !toggleEl) return;

  function open() {
    setMobileListOpen(otherListEl, otherToggleEl, false);
    setMobileListOpen(listEl, toggleEl, true);
  }

  sectionEl.addEventListener('mouseenter', open);
  toggleEl.addEventListener('focus', open);
  toggleEl.addEventListener('click', () => {
    if (listEl.classList.contains('open')) {
      setMobileListOpen(listEl, toggleEl, false);
    }
  });
}

function setupMobileListToggles() {
  mobileProjectsListEl = document.getElementById('selected-projects-list');
  mobileProjectsToggleEl = document.getElementById('projects-toggle');
  mobileContactListEl = document.getElementById('main-contact-list');
  mobileContactToggleEl = document.getElementById('contact-toggle');

  if (!IS_TOUCH_DEVICE) {
    let projectsSectionEl = document.querySelector('nav[aria-labelledby="selected-projects-title"]');
    let contactSectionEl = document.querySelector('footer[aria-labelledby="main-contact-heading"]');
    setupDesktopListHoverToggle(projectsSectionEl, mobileProjectsListEl, mobileProjectsToggleEl, mobileContactListEl, mobileContactToggleEl);
    setupDesktopListHoverToggle(contactSectionEl, mobileContactListEl, mobileContactToggleEl, mobileProjectsListEl, mobileProjectsToggleEl);
    return;
  }

  if (mobileProjectsToggleEl) {
    mobileProjectsToggleEl.addEventListener('click', () => {
      setMobileListOpen(mobileContactListEl, mobileContactToggleEl, false);
      toggleMobileList(mobileProjectsListEl, mobileProjectsToggleEl);
    });
  }

  if (mobileContactToggleEl) {
    mobileContactToggleEl.addEventListener('click', () => {
      setTouchSelectionState(-1);
      setMobileListOpen(mobileProjectsListEl, mobileProjectsToggleEl, false);
      toggleMobileList(mobileContactListEl, mobileContactToggleEl);
    });
  }

  setupMobileListOutsideClose();
}

function markDragMovedIfPastThreshold(x, y) {
  if (!dragMoved && (Math.abs(x - dragStartX) > CAMERA_DRAG_CLICK_THRESHOLD || Math.abs(y - dragStartY) > CAMERA_DRAG_CLICK_THRESHOLD)) {
	dragMoved = true;
  }
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
		markDragMovedIfPastThreshold(currentX, currentY);
		if (lastTouchDragX !== null) dragDeltaX = currentX - lastTouchDragX;
		if (lastTouchDragY !== null) dragDeltaY = currentY - lastTouchDragY;
		lastTouchDragX = currentX;
		lastTouchDragY = currentY;
		dragging = true;
	  }
	} else {
	  currentX = mouseX;
	  currentY = mouseY;
	  markDragMovedIfPastThreshold(currentX, currentY);
	  dragDeltaX = mouseX - pmouseX;
	  dragDeltaY = mouseY - pmouseY;
	  dragging = true;
	}
  } else if (pendingOverscrollDeltaX !== 0 || pendingOverscrollDeltaY !== 0) {
	dragDeltaX = pendingOverscrollDeltaX;
	dragDeltaY = pendingOverscrollDeltaY;
	currentY = pendingOverscrollPointerY !== null ? pendingOverscrollPointerY : height / 2;
	dragging = true;
	pendingOverscrollDeltaX = 0;
	pendingOverscrollDeltaY = 0;
  }

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

function updateBioDimmedState() {
  if (!bioOverlayEl) return;
  bioOverlayEl.classList.toggle('orb-selected', selectedIndex !== -1);
}

function draw() {
  clear();

  updateDesktopHoverSelection();
  updateIntroTextFromOrbSelection();

  let targetTimeScale = (selectedIndex === -1) ? 1 : 0;
  timeScale = lerp(timeScale, targetTimeScale, TIME_SCALE_EASE);

  updateCameraOrientation();
  updateBioReveal();

  orbitHoverScale = lerp(orbitHoverScale, isHoveringAnyProject() ? ORBIT_HOVER_SLOWDOWN : 1, ORBIT_HOVER_EASE);

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
  let tintMix = Math.max(p.lightMix, p.visitedMix);

  drawReflectiveOrb(p.size, posX, posY, posZ, camEye, camLightDir, VISITED_TINT_COLORS[i], tintMix);
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
  updateProjectNameSelectionState();
  updateDotOcclusion(camDist);
  updateBioDimmedState();
}

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
	if (dist < computeHitRadius(p) + dotVisualRadius) {
	  occluded = true;
	  break;
	}
  }

  bioCloseDotEl.style.pointerEvents = occluded ? 'none' : '';
}

function updateOrbLabel() {
  if (!orbLabelEl) return;

  if (!shouldShowOrbLabel()) {
    orbLabelEl.style.opacity = 0;
    orbLabelEl.classList.remove('active');
    return;
  }

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

  orbLabelEl.textContent = p.title;
  orbLabelEl.href = p.url;
  orbLabelEl.style.top = `${p.screenY + p.screenRadius + (IS_TOUCH_DEVICE ? 14 : 20) - verticalCenterOffset()}px`;
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

const INTERACTIVE_ELEMENT_SELECTOR = '#label, #orb-link, #bio-close-dot, .bio-overlay-links a, #page-content a, #page-content button';

function isInteractiveTarget(event) {
  return !!(event && event.target && event.target.closest && event.target.closest(INTERACTIVE_ELEMENT_SELECTOR));
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
  if (isInteractiveTarget(event)) return false;
  beginCameraDrag(mouseX, mouseY);
  return false;
}

function mouseReleased(event) {
  if (!isDraggingCamera) return false;
  isDraggingCamera = false;
  if (isInteractiveTarget(event)) return false;
  if (!dragMoved) finalizeTap(mouseX, mouseY);
  return false;
}

function touchStarted(event) {
  if (isInteractiveTarget(event)) return true;
  if (touches.length > 0) {
	beginCameraDrag(touches[0].x, touches[0].y);
	lastTouchDragX = touches[0].x;
	lastTouchDragY = touches[0].y;
  }
  return true;
}

function touchEnded(event) {
  if (!isDraggingCamera) return true;
  isDraggingCamera = false;
  lastTouchDragX = null;
  lastTouchDragY = null;
  if (isInteractiveTarget(event)) return true;
  if (!dragMoved) finalizeTap(dragStartX, dragStartY);
  return true;
}

const PAGE_SCROLL_ANIMATION_MS = 500;
const PAGE_WHEEL_DELTA_THRESHOLD = 2;
let pageScrollAnimating = false;
let pageScrollAnimationToken = 0;

function easeInOutCubicScroll(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getPageSectionOffsets() {
  let pageContentEl = document.getElementById('page-content');
  let bottomY = pageContentEl ? pageContentEl.getBoundingClientRect().top + window.scrollY : 0;
  return { topY: 0, bottomY };
}

function isAtPageScrollBoundary(direction) {
  let { topY, bottomY } = getPageSectionOffsets();
  let targetY = direction > 0 ? bottomY : topY;
  return Math.abs(targetY - window.scrollY) < 1;
}

function prefersReducedMotionScroll() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function animatePageScrollTo(targetY) {
  let startY = window.scrollY;
  let distance = targetY - startY;
  if (Math.abs(distance) < 1) return;

  if (prefersReducedMotionScroll()) {
    window.scrollTo(0, targetY);
    return;
  }

  pageScrollAnimating = true;
  let token = ++pageScrollAnimationToken;
  let startTime = performance.now();

  function step(now) {
    if (token !== pageScrollAnimationToken) return;
    let elapsed = now - startTime;
    let t = Math.min(elapsed / PAGE_SCROLL_ANIMATION_MS, 1);
    window.scrollTo(0, startY + distance * easeInOutCubicScroll(t));
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      pageScrollAnimating = false;
    }
  }
  requestAnimationFrame(step);
}

function goToPageState(direction, tiltDirection) {
  if (pageScrollLockedForBio) return;
  let { topY, bottomY } = getPageSectionOffsets();
  let targetY = direction > 0 ? bottomY : topY;
  if (Math.abs(targetY - window.scrollY) < 1) return;
  closeMobileLists();
  let sign = tiltDirection !== undefined ? tiltDirection : direction;
  orbitTiltVelocity = sign * PAGE_TRANSITION_TILT_IMPULSE;
  animatePageScrollTo(targetY);
}

function handlePageWheel(event) {
  event.preventDefault();
  if (pageScrollLockedForBio) return;
  if (pageScrollAnimating) return;
  if (Math.abs(event.deltaY) < PAGE_WHEEL_DELTA_THRESHOLD) return;
  let direction = event.deltaY > 0 ? 1 : -1;
  if (isAtPageScrollBoundary(direction)) {
	pendingOverscrollDeltaX = constrain(event.deltaX, -SCROLL_OVERSCROLL_DELTA_CLAMP, SCROLL_OVERSCROLL_DELTA_CLAMP);
	pendingOverscrollDeltaY = constrain(event.deltaY, -SCROLL_OVERSCROLL_DELTA_CLAMP, SCROLL_OVERSCROLL_DELTA_CLAMP);
	pendingOverscrollPointerY = event.clientY;
	return;
  }
  goToPageState(direction, -direction);
}

window.addEventListener('wheel', handlePageWheel, { passive: false });

const PAGE_SWIPE_TRIGGER_PX = 45;
let pageSwipeActive = false;
let pageSwipeTriggered = false;
let pageSwipeStartX = 0;
let pageSwipeStartY = 0;

function handlePageTouchStart(event) {
  if (pageScrollLockedForBio || selectedIndex !== -1 || isInteractiveTarget(event) || !event.touches || event.touches.length !== 1) {
	pageSwipeActive = false;
	return;
  }
  pageSwipeActive = true;
  pageSwipeTriggered = false;
  pageSwipeStartX = event.touches[0].clientX;
  pageSwipeStartY = event.touches[0].clientY;
}

function handlePageTouchMove(event) {
  if (!pageSwipeActive || !event.touches || event.touches.length !== 1) return;
  if (pageScrollLockedForBio || selectedIndex !== -1) {
	pageSwipeActive = false;
	return;
  }
  event.preventDefault();
  if (pageSwipeTriggered || pageScrollAnimating) return;

  let deltaX = event.touches[0].clientX - pageSwipeStartX;
  let deltaY = event.touches[0].clientY - pageSwipeStartY;
  if (Math.abs(deltaY) < PAGE_SWIPE_TRIGGER_PX || Math.abs(deltaY) <= Math.abs(deltaX)) return;

  let direction = deltaY < 0 ? 1 : -1;
  if (isAtPageScrollBoundary(direction)) {
	return;
  }

  pageSwipeTriggered = true;
  isDraggingCamera = false;
  dragMoved = false;
  lastTouchDragX = null;
  lastTouchDragY = null;

  goToPageState(direction);
}

function handlePageTouchEnd() {
  pageSwipeActive = false;
  pageSwipeTriggered = false;
}

if (IS_TOUCH_DEVICE) {
  document.addEventListener('touchstart', handlePageTouchStart, { passive: true });
  document.addEventListener('touchmove', handlePageTouchMove, { passive: false });
  document.addEventListener('touchend', handlePageTouchEnd, { passive: true });
  document.addEventListener('touchcancel', handlePageTouchEnd, { passive: true });
}

