// angles are redistributed evenly below, so only the count matters here
let projects = [
  { orbitAngle: 0, orbitSpeed: 0.0015, size: 74 },
  { orbitAngle: 0, orbitSpeed: 0.0015, size: 74 },
  { orbitAngle: 0, orbitSpeed: 0.0015, size: 74 },
  { orbitAngle: 0, orbitSpeed: 0.0015, size: 74 },
  { orbitAngle: 0, orbitSpeed: 0.0015, size: 74 }
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
let skyShader;

let selectedIndex = -1;
let timeScale = 1;
const TIME_SCALE_EASE = 0.08;

const ORBIT_MAJOR_RADIUS = 300;
const ORBIT_MINOR_RADIUS = 165;
// kept independent of the radii above so pulling the orbits inward doesn't also zoom the camera in
const ORBIT_CONTENT_RADIUS = 470;

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

const SCROLL_OVERSCROLL_DELTA_CLAMP = 50;
let pendingOverscrollDeltaX = 0;
let pendingOverscrollDeltaY = 0;
let pendingOverscrollPointerY = null;

const ORBIT_SPIN_DRAG_SENSITIVITY = 0.0035;
const ORBIT_TILT_DRAG_SENSITIVITY = 0.0035;
const ORBIT_SPIN_VELOCITY_EASE = 0.2;
const ORBIT_SPIN_INERTIA_DAMPING = 0.028;
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

const LIGHT_MIX_EASE = 0.08;

const HALO_SCALE = IS_TOUCH_DEVICE ? 1.2 : 1.15;
const HALO_DEPTH_OFFSET_RATIO = 0.35;

const ORBIT_HOVER_SLOWDOWN = 0.15;
const ORBIT_HOVER_EASE = 0.05;
let orbitHoverScale = 1;

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

if (IS_TOUCH_DEVICE) {
  applyViewportChromeInset(resolveStableViewportHeight() - window.innerHeight);
}

const HALO_COLOR_DEFAULT = [255, 255, 255];
const ORB_TINT_HEX = ['#EB3DA8', '#1DAF3A', '#9939EF', '#E81C1D', '#FF6A2A'];
// blends each tint toward white so the orbs read slightly less saturated
const ORB_TINT_DESATURATION = 0.2;
const ORB_TINT_COLORS = ORB_TINT_HEX.map(hexToRgb).map((rgb) => rgb.map((c) => c + (255 - c) * ORB_TINT_DESATURATION));

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

const SKY_VERT = `
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

const SKY_FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uSkyTex;

varying vec2 vTexCoord;

void main() {
  gl_FragColor = vec4(texture2D(uSkyTex, vTexCoord).rgb, 1.0);
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
  orbReflectShader = createShader(ORB_REFLECT_VERT, ORB_REFLECT_FRAG);
  skyShader = createShader(SKY_VERT, SKY_FRAG);
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
  resizeCanvas(nextWidth, nextHeight);
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

function isHoveringAnyProject() {
  if (IS_TOUCH_DEVICE) return false;

  return findProjectHitIndex(mouseX, mouseY) !== -1;
}

function updateDesktopHoverSelection() {
  if (IS_TOUCH_DEVICE) return;

  selectedIndex = findProjectHitIndex(mouseX, mouseY);
}

function handleTap(px, py) {
  selectedIndex = findProjectHitIndex(px, py);
}

function beginCameraDrag(x, y) {
  isDraggingCamera = true;
  dragMoved = false;
  dragStartX = x;
  dragStartY = y;
}

function mousePressed() {
  beginCameraDrag(mouseX, mouseY);
  return false;
}

function mouseReleased() {
  if (!isDraggingCamera) return false;
  isDraggingCamera = false;
  if (!dragMoved) handleTap(mouseX, mouseY);
  return false;
}

function touchStarted() {
  if (touches.length > 0) {
    beginCameraDrag(touches[0].x, touches[0].y);
    lastTouchDragX = touches[0].x;
    lastTouchDragY = touches[0].y;
  }
  return true;
}

function touchEnded() {
  if (!isDraggingCamera) return true;
  isDraggingCamera = false;
  lastTouchDragX = null;
  lastTouchDragY = null;
  if (!dragMoved) handleTap(dragStartX, dragStartY);
  return true;
}

function handleOrbitWheel(event) {
  event.preventDefault();
  pendingOverscrollDeltaX = -constrain(event.deltaX, -SCROLL_OVERSCROLL_DELTA_CLAMP, SCROLL_OVERSCROLL_DELTA_CLAMP);
  pendingOverscrollDeltaY = -constrain(event.deltaY, -SCROLL_OVERSCROLL_DELTA_CLAMP, SCROLL_OVERSCROLL_DELTA_CLAMP);
  pendingOverscrollPointerY = event.clientY;
}

window.addEventListener('wheel', handleOrbitWheel, { passive: false });

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

  document.body.style.cursor = isDraggingCamera ? 'grabbing' : 'default';
}

function draw() {
  clear();

  updateDesktopHoverSelection();

  let targetTimeScale = (selectedIndex === -1) ? 1 : 0;
  timeScale = lerp(timeScale, targetTimeScale, TIME_SCALE_EASE);

  updateCameraOrientation();

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
  shader(skyShader);
  skyShader.setUniform('uSkyTex', skyImg);
  sphere(2000, 48, 48);
  resetShader();
  pop();

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

    drawReflectiveOrb(p.size, posX, posY, posZ, camEye, camLightDir, ORB_TINT_COLORS[i], 1);
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
}
