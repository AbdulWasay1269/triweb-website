import { useRef } from 'react'
import { useThreeStage } from './useThreeStage.js'
import { isSmallScreen } from '../lib/motion.js'
import { scrollState } from '../lib/scroll.js'
import { noiseGLSL } from './gradientShader.js'

/* =====================================================================
   Cinematic background: an endless flight along a mountain valley.
   The camera never stops flying (gently when idle, faster while you
   scroll), and scroll position drives the time of day like a film:
   golden hour → sunset → twilight with stars → night with aurora.
   ===================================================================== */

// Keyframes along the page (0 = top, 1 = bottom)
const KEYS = [
  { at: 0.0, top: '#18284f', horizon: '#ff9a5c', sun: '#ffd0a8', elev: 0.12, night: 0, aurora: 0 },
  { at: 0.34, top: '#1d1d42', horizon: '#ff3a20', sun: '#ff7a45', elev: 0.03, night: 0.05, aurora: 0 },
  { at: 0.67, top: '#0b1220', horizon: '#3b3a74', sun: '#ff7a45', elev: -0.06, night: 0.65, aurora: 0.45 },
  { at: 1.0, top: '#050914', horizon: '#1a1f3d', sun: '#ff7a45', elev: -0.16, night: 1, aurora: 1 },
]

const skyVert = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}
`
const skyFrag = /* glsl */ `
uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSunCol; uniform vec3 uSunDir;
uniform vec3 uAur1; uniform vec3 uAur2;
uniform float uNight; uniform float uAurora; uniform float uTime; uniform float uTravel;
varying vec3 vDir;
${noiseGLSL}
float fbm(vec2 p, float t){ float a = 0.5, s = 0.0; for(int i = 0; i < 3; i++){ s += a * snoise(vec3(p, t)); p *= 2.03; a *= 0.5; } return s; }
float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
void main(){
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uHorizon, uTop, smoothstep(-0.02, 0.55, h));
  float sd = max(dot(d, uSunDir), 0.0);
  float sunVis = 1.0 - uNight * 0.85;
  col += uSunCol * (pow(sd, 1200.0) * 8.0 + pow(sd, 60.0) * 0.6 + pow(sd, 7.0) * 0.22) * sunVis;
  // Anamorphic lens flare: a thin horizontal streak through the sun, like a cinema lens
  float streak = exp(-abs(d.y - uSunDir.y) * 140.0) * pow(max(dot(normalize(d.xz), normalize(uSunDir.xz)), 0.0), 8.0);
  col += mix(uSunCol, vec3(1.0, 0.85, 0.75), 0.35) * streak * 0.5 * sunVis;
  if (h > 0.0) {
    // Clouds drift with time and with the flight
    vec2 cp = d.xz / (h + 0.1) * 0.9 + vec2(uTime * 0.008, -uTravel * 0.0035 + uTime * 0.012);
    float c = fbm(cp * 0.7, uTime * 0.02) * 0.5 + 0.5;
    float cm = smoothstep(0.48, 0.85, c) * smoothstep(0.0, 0.18, h) * (1.0 - smoothstep(0.35, 0.85, h));
    vec3 cloudLit = mix(uHorizon * 1.05, uSunCol * 1.2, pow(sd, 3.0));
    vec3 cloudCol = mix(cloudLit, uTop * 0.6 + vec3(0.02, 0.02, 0.05), uNight);
    col = mix(col, cloudCol, cm * 0.75);
    // Stars
    vec3 sp = floor(d * 380.0);
    float st = step(0.996, hash(sp)) * uNight * smoothstep(0.02, 0.2, h) * (1.0 - cm);
    col += st * (0.55 + 0.45 * sin(uTime * 2.5 + hash(sp + 1.0) * 40.0));
    // Aurora curtains (skipped entirely until night falls)
    if (uAurora > 0.01) {
    vec2 ap = d.xz / (h + 0.3);
    float band = fbm(vec2(ap.x * 0.7 + uTime * 0.04, ap.y * 0.25 - uTravel * 0.002), uTime * 0.05);
    float curtain = pow(smoothstep(0.0, 1.0, 1.0 - abs(band) * 2.2), 3.0);
    float vert = smoothstep(0.02, 0.18, h) * (1.0 - smoothstep(0.38, 0.8, h));
    col += mix(uAur1, uAur2, smoothstep(0.1, 0.55, h)) * curtain * vert * uAurora * 2.0;
    }
  }
  // Filmic exposure curve: bright areas roll off to white without hue shifts
  col = vec3(1.0) - exp(-col * 1.1);
  gl_FragColor = vec4(col, 1.0);
}
`

const landVert = /* glsl */ `
uniform float uTravel;
varying vec3 vWorld; varying float vH; varying vec3 vNrm;
${noiseGLSL}
float terrain(vec2 p){
  float h = 0.0, a = 1.0; vec2 q = p * 0.011;
  for(int i = 0; i < 4; i++){ float n = 1.0 - abs(snoise(vec3(q, 3.1))); h += n * n * a; q *= 2.07; a *= 0.47; }
  h = h * 27.0 - 8.0;
  float valley = smoothstep(5.0, 60.0, abs(p.x + sin(p.y * 0.012) * 18.0));
  return h * mix(0.1, 1.0, valley) - (1.0 - valley) * 2.0;
}
void main(){
  vec3 p = position;
  vec2 wp = vec2(p.x, p.z - uTravel);
  float h = terrain(wp);
  float hw = max(h, 0.0);
  float e = 1.4;
  float hx = max(terrain(wp + vec2(e, 0.0)), 0.0);
  float hz = max(terrain(wp + vec2(0.0, e)), 0.0);
  vNrm = normalize(vec3(hw - hx, e, hw - hz));
  p.y = hw;
  vH = h;
  vec4 w = modelMatrix * vec4(p, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`
const landFrag = /* glsl */ `
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uHorizon; uniform vec3 uTop; uniform vec3 uCam;
uniform float uNight; uniform float uTime; uniform float uTravel; uniform float uFog;
varying vec3 vWorld; varying float vH; varying vec3 vNrm;
${noiseGLSL}
void main(){
  vec3 n = normalize(vNrm);
  vec3 L = normalize(uSunDir + vec3(0.0, 0.18, 0.0));
  float diff = max(dot(n, L), 0.0);
  float rim = pow(1.0 - max(n.y, 0.0), 2.0);
  vec3 rock = vec3(0.075, 0.07, 0.11);
  vec3 col = rock * (0.25 + uTop * 1.2) + rock * uSunCol * diff * 2.6 * (1.0 - uNight * 0.7);
  col += uSunCol * rim * 0.06 * (1.0 - uNight);
  float peak = smoothstep(13.0, 22.0, vH) * smoothstep(0.55, 0.9, n.y);
  col = mix(col, uSunCol * (0.25 + diff * 0.9) * (1.0 - uNight * 0.6) + uTop * 0.35, peak * 0.55);
  if (vH <= 0.02) {
    // River: reflects the sky, sun glitters on ripples
    vec3 v = normalize(vWorld - uCam);
    vec2 rp = vec2(vWorld.x, vWorld.z - uTravel) * 0.18;
    float rx = snoise(vec3(rp, uTime * 0.35));
    float rz = snoise(vec3(rp * 1.7 + 9.0, uTime * 0.3));
    vec3 wn = normalize(vec3(rx * 0.08, 1.0, rz * 0.08));
    vec3 r = reflect(v, wn);
    float s = pow(max(dot(r, normalize(uSunDir)), 0.0), 90.0);
    vec3 sky = mix(uHorizon, uTop, smoothstep(0.0, 0.5, r.y));
    col = sky * 0.6 + uSunCol * s * 3.5 * (1.0 - uNight * 0.6);
  }
  float dist = length(vWorld - uCam);
  float f = 1.0 - exp(-pow(dist * uFog, 1.5));
  col = mix(col, uHorizon * 0.95, f);
  gl_FragColor = vec4(col, 1.0);
}
`

/**
 * True while something opaque fills the whole screen (the Home hero, the
 * full-screen reel, the video player): no point drawing the sky behind it.
 */
function isCovered() {
  if (window.__lightboxOpen) return true
  const els = document.querySelectorAll('[data-occlude]')
  for (const el of els) {
    const r = el.getBoundingClientRect()
    if (r.top <= 1 && r.bottom >= innerHeight - 1 && r.left <= 1 && r.right >= innerWidth - 1) return true
  }
  return false
}

export default function SceneBackground() {
  const ref = useRef(null)

  useThreeStage(
    ref,
    ({ scene, camera, renderer, THREE }) => {
      const small = isSmallScreen()
      camera.near = 0.5
      camera.far = 900
      camera.fov = 58
      camera.updateProjectionMatrix()

      const K = KEYS.map((k) => ({ ...k, top: new THREE.Color(k.top), horizon: new THREE.Color(k.horizon), sun: new THREE.Color(k.sun) }))
      const sunDir = new THREE.Vector3()
      const shared = {
        uTop: { value: new THREE.Color() },
        uHorizon: { value: new THREE.Color() },
        uSunCol: { value: new THREE.Color() },
        uSunDir: { value: sunDir },
        uNight: { value: 0 },
        uTime: { value: 0 },
        uTravel: { value: 0 },
      }

      const sky = new THREE.Mesh(
        new THREE.SphereGeometry(600, 48, 24),
        new THREE.ShaderMaterial({
          vertexShader: skyVert,
          fragmentShader: skyFrag,
          side: THREE.BackSide,
          depthWrite: false,
          uniforms: { ...shared, uAurora: { value: 0 }, uAur1: { value: new THREE.Color('#ff3a20') }, uAur2: { value: new THREE.Color('#ff9a6b') } },
        }),
      )
      sky.renderOrder = -1
      scene.add(sky)

      const geo = new THREE.PlaneGeometry(720, 420, small ? 80 : 150, small ? 55 : 105)
      geo.rotateX(-Math.PI / 2)
      const land = new THREE.Mesh(
        geo,
        new THREE.ShaderMaterial({
          vertexShader: landVert,
          fragmentShader: landFrag,
          uniforms: { ...shared, uCam: { value: camera.position }, uFog: { value: 0.0048 } },
        }),
      )
      land.position.z = -180
      scene.add(land)

      // Adaptive quality: drop resolution further if frames are slow
      let baseRatio = renderer.getPixelRatio()
      let slowTime = 0
      let travel = 0
      let speed = 0
      let smoothP = 0
      const tmp = { top: new THREE.Color(), horizon: new THREE.Color(), sun: new THREE.Color() }

      const sample = (p) => {
        let i = 0
        while (i < K.length - 2 && p > K[i + 1].at) i++
        const a = K[i]
        const b = K[i + 1]
        const t = THREE.MathUtils.smoothstep(p, a.at, b.at)
        tmp.top.copy(a.top).lerp(b.top, t)
        tmp.horizon.copy(a.horizon).lerp(b.horizon, t)
        tmp.sun.copy(a.sun).lerp(b.sun, t)
        return { elev: a.elev + (b.elev - a.elev) * t, night: a.night + (b.night - a.night) * t, aurora: a.aurora + (b.aurora - a.aurora) * t }
      }

      return {
        update(t, dt, p) {
          if (dt > 1 / 22) slowTime += dt
          else slowTime = Math.max(0, slowTime - dt * 0.5)
          if (slowTime > 2 && baseRatio > 0.3) {
            baseRatio = Math.max(0.28, baseRatio * 0.8)
            renderer.setPixelRatio(baseRatio)
            renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight, false)
            slowTime = 0
          }
          // Time of day follows scroll progress (eased)
          smoothP += (scrollState.progress - smoothP) * 0.05
          const k = sample(smoothP)
          shared.uTop.value.copy(tmp.top)
          shared.uHorizon.value.copy(tmp.horizon)
          shared.uSunCol.value.copy(tmp.sun)
          shared.uNight.value = k.night
          sky.material.uniforms.uAurora.value = k.aurora
          sunDir.set(0.28, k.elev, -1).normalize()

          // Flight: always moving, faster while scrolling
          const target = 4 + Math.min(Math.abs(scrollState.velocity) * 2.2, 70)
          speed += (target - speed) * 0.04
          travel += speed * dt
          shared.uTravel.value = travel
          shared.uTime.value = t

          // Camera drifts and banks like a drone shot
          camera.position.set(Math.sin(t * 0.07) * 6 + p.x * 3, 30 + Math.sin(t * 0.11) * 2 + p.y * 1.5, 0)
          camera.lookAt(Math.sin(t * 0.05) * 12 + p.x * 10, 21 + p.y * 4, -100)
          camera.rotation.z += Math.sin(t * 0.09) * 0.03 - Math.max(-0.05, Math.min(0.05, scrollState.velocity * 0.0015))
          sky.position.copy(camera.position)
        },
      }
    },
    { fov: 58, z: 0, fps: 30, ratio: isSmallScreen() ? 0.45 : 0.6, paused: isCovered },
  )

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-obsidian" aria-hidden="true">
      <div ref={ref} className="absolute inset-0" />
      {/* Readability: darken behind content, keep the horizon glowing */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,18,32,0.55)_0%,rgba(11,18,32,0.35)_45%,rgba(11,18,32,0.45)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_45%,transparent,rgba(11,18,32,0.55))]" />
    </div>
  )
}
