import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { noiseGLSL } from '../three/gradientShader.js'
import { LOGO_PATH, LOGO_W, LOGO_H } from '../components/logoPath.js'

export const BRAND = {
  vermilion: new THREE.Color('#ff3a20'),
  ember: new THREE.Color('#ff7a45'),
  peach: new THREE.Color('#ffb38f'),
  gold: new THREE.Color('#ffc46b'),
  white: new THREE.Color('#fff4ec'),
  navy: new THREE.Color('#0b1220'),
}

/* ---------------- Textures ---------------- */
let glowTex
/** Soft round glow used by every particle and sprite. */
export function glowTexture() {
  if (glowTex) return glowTex
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  gr.addColorStop(0, 'rgba(255,255,255,1)')
  gr.addColorStop(0.2, 'rgba(255,255,255,0.8)')
  gr.addColorStop(0.5, 'rgba(255,255,255,0.18)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, 128, 128)
  glowTex = new THREE.CanvasTexture(c)
  glowTex.colorSpace = THREE.SRGBColorSpace
  return glowTex
}

/** Anamorphic lens streak (thin horizontal flare). */
export function streakSprite(color, w = 18, h = 0.35, opacity = 0.7) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 16
  const g = c.getContext('2d')
  const gr = g.createLinearGradient(0, 0, 256, 0)
  gr.addColorStop(0, 'rgba(255,255,255,0)')
  gr.addColorStop(0.5, 'rgba(255,255,255,1)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(0, 6, 256, 4)
  const tex = new THREE.CanvasTexture(c)
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }))
  s.scale.set(w, h, 1)
  return s
}

export function glowSprite(color, size = 4, opacity = 0.8) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }))
  s.scale.setScalar(size)
  return s
}

/* ---------------- Materials ---------------- */
export function chrome(color = '#e8e4e2', rough = 0.16) {
  return new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: rough, envMapIntensity: 1.25 })
}
export function darkMetal(rough = 0.35) {
  return new THREE.MeshStandardMaterial({ color: '#1a2236', metalness: 0.9, roughness: rough, envMapIntensity: 0.9 })
}
/** Glassy look without the cost of real transmission. */
export function glass(tint = '#ffb38f', opacity = 0.18) {
  return new THREE.MeshPhysicalMaterial({ color: tint, metalness: 0.1, roughness: 0.02, transparent: true, opacity, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 2.2, depthWrite: false, side: THREE.DoubleSide })
}

/**
 * Energy material: fresnel rim + flowing noise. `uBoost` drives hover/click
 * glow; values above 1 feed the bloom pass.
 */
export function energyMaterial(color = BRAND.vermilion, { intensity = 2.2, flow = 1, additive = true } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: color.clone() }, uBoost: { value: 0 }, uIntensity: { value: intensity }, uFlow: { value: flow } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){
        vec4 wp = modelMatrix * vec4(position,1.0);
        vP = position;
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uColor; uniform float uBoost; uniform float uIntensity; uniform float uFlow;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      ${noiseGLSL}
      void main(){
        float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
        float n = snoise(vP * 0.6 + vec3(0.0, uTime * 0.6 * uFlow, uTime * 0.3));
        float energy = 0.35 + 0.65 * smoothstep(-0.4, 0.9, n);
        vec3 col = uColor * (fr * 1.4 + energy * 0.55) * (uIntensity + uBoost * 2.5);
        col += vec3(1.0, 0.9, 0.8) * pow(fr, 4.0) * (0.6 + uBoost);
        gl_FragColor = vec4(col, clamp(fr * 0.9 + energy * 0.35 + uBoost * 0.2, 0.0, 1.0));
      }`,
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  })
}

/* ---------------- Atmosphere ---------------- */

/** Deep starfield with twinkle and size attenuation. */
export function starfield(count, radius, depth) {
  const pos = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const r = radius * (0.35 + Math.random() * 0.65)
    const a = Math.random() * Math.PI * 2
    pos[i * 3] = Math.cos(a) * r
    pos[i * 3 + 1] = Math.sin(a) * r * 0.7
    pos[i * 3 + 2] = -Math.random() * depth + 60
    seed[i] = Math.random()
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uMap: { value: glowTexture() }, uPR: { value: 1 }, uWarp: { value: 0 } },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uPR; uniform float uWarp; attribute float aSeed; varying float vA; varying float vS;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.2 + aSeed * 3.2) * uPR * (80.0 / -mv.z) * (1.0 + uWarp * 0.6);
        vA = 0.45 + 0.55 * sin(uTime * (0.6 + aSeed * 2.0) + aSeed * 40.0);
        vS = aSeed;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; varying float vA; varying float vS;
      void main(){
        vec4 t = texture2D(uMap, gl_PointCoord);
        vec3 c = mix(vec3(1.0,0.86,0.78), vec3(1.0,0.45,0.3), step(0.82, vS));
        gl_FragColor = vec4(c * 1.3, t.a * vA);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  return new THREE.Points(geo, mat)
}

/**
 * Tileable cloud noise, baked once on the CPU into a small texture (two
 * different fbm patterns in R and G). Shaders sample it instead of running
 * noise per pixel, which is what made the big cloud layers expensive.
 */
let _noiseTex = null
export function noiseTexture() {
  if (_noiseTex) return _noiseTex
  const N = 256
  const lattice = (seed) => {
    const g = new Float32Array(64 * 64)
    let r = seed
    for (let i = 0; i < g.length; i++) {
      r = (r * 16807) % 2147483647
      g[i] = r / 2147483647
    }
    return g
  }
  const value = (g, x, y, period) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = x - xi
    const yf = y - yi
    const u = xf * xf * (3 - 2 * xf)
    const v = yf * yf * (3 - 2 * yf)
    const at = (i, j) => g[((j % period) + period) % period * 64 + (((i % period) + period) % period)]
    const a = at(xi, yi)
    const b = at(xi + 1, yi)
    const c = at(xi, yi + 1)
    const d = at(xi + 1, yi + 1)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
  }
  const fbm = (g, x, y) => {
    let s = 0
    let a = 0.5
    let f = 4
    for (let o = 0; o < 5; o++) {
      s += a * value(g, (x * f) / N, (y * f) / N, f)
      f *= 2
      a *= 0.5
    }
    return s
  }
  const g1 = lattice(1234567)
  const g2 = lattice(7654321)
  const data = new Uint8Array(N * N * 4)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4
      data[i] = Math.min(255, fbm(g1, x, y) * 255)
      data[i + 1] = Math.min(255, fbm(g2, x, y) * 255)
      data[i + 2] = 0
      data[i + 3] = 255
    }
  }
  _noiseTex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat)
  _noiseTex.wrapS = _noiseTex.wrapT = THREE.RepeatWrapping
  _noiseTex.magFilter = THREE.LinearFilter
  _noiseTex.minFilter = THREE.LinearMipmapLinearFilter
  _noiseTex.generateMipmaps = true
  _noiseTex.needsUpdate = true
  return _noiseTex
}

/** Volumetric nebula cloud: a camera-facing plane with drifting baked noise. */
export function nebula(colorA, colorB, size = 120, opacity = 0.5) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uA: { value: colorA.clone() }, uB: { value: colorB.clone() }, uOpacity: { value: opacity }, uSeed: { value: Math.random() }, uNoise: { value: noiseTexture() } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform float uOpacity; uniform float uSeed; uniform sampler2D uNoise; varying vec2 vUv;
      void main(){
        vec2 p = vUv - 0.5;
        float r = length(p);
        float n = texture2D(uNoise, p * 0.9 + vec2(uSeed, uTime * 0.004)).r * 2.0 - 1.0;
        float n2 = texture2D(uNoise, p * 1.7 + n * 0.12 + vec2(uTime * -0.006, uSeed * 2.0)).g * 2.0 - 1.0;
        // Clouds live in the sky only: nothing below the middle of the plane
        float d = smoothstep(0.5, 0.05, r) * smoothstep(-0.2, 0.7, n + n2 * 0.5) * smoothstep(0.42, 0.62, vUv.y);
        vec3 col = mix(uA, uB, smoothstep(-0.3, 0.6, n2));
        gl_FragColor = vec4(col * d * 1.2, d * uOpacity);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat)
  return m
}

/**
 * Light trails: glowing ribbons along a curve with a bright head racing
 * along them. `curve` is any THREE.Curve.
 */
export function lightTrail(curve, color, { width = 0.12, segments = 160, speed = 0.25, length = 0.25, phase = Math.random() } = {}) {
  const pts = curve.getSpacedPoints(segments)
  const pos = new Float32Array((segments + 1) * 2 * 3)
  const u = new Float32Array((segments + 1) * 2)
  const side = new Float32Array((segments + 1) * 2)
  const idx = []
  const up = new THREE.Vector3(0, 1, 0)
  const tan = new THREE.Vector3()
  const nrm = new THREE.Vector3()
  for (let i = 0; i <= segments; i++) {
    const p = pts[i]
    curve.getTangentAt(i / segments, tan)
    nrm.crossVectors(tan, up).normalize()
    if (nrm.lengthSq() < 0.01) nrm.set(1, 0, 0)
    for (let s = 0; s < 2; s++) {
      const k = i * 2 + s
      const sgn = s ? 1 : -1
      pos.set([p.x + nrm.x * width * sgn, p.y + nrm.y * width * sgn, p.z + nrm.z * width * sgn], k * 3)
      u[k] = i / segments
      side[k] = sgn
    }
    if (i < segments) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aU', new THREE.BufferAttribute(u, 1))
  geo.setAttribute('aSide', new THREE.BufferAttribute(side, 1))
  geo.setIndex(idx)
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: color.clone() }, uSpeed: { value: speed }, uLen: { value: length }, uPhase: { value: phase }, uBoost: { value: 0 } },
    vertexShader: /* glsl */ `attribute float aU; attribute float aSide; varying float vU; varying float vSide; void main(){ vU = aU; vSide = aSide; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uColor; uniform float uSpeed; uniform float uLen; uniform float uPhase; uniform float uBoost;
      varying float vU; varying float vSide;
      void main(){
        float head = fract(uTime * uSpeed + uPhase);
        float d = head - vU; if (d < 0.0) d += 1.0;
        float tail = smoothstep(uLen, 0.0, d);
        float core = 1.0 - abs(vSide);
        float base = 0.06;
        float a = (tail * (0.6 + core) + base * core) * (1.0 + uBoost);
        gl_FragColor = vec4(uColor * (1.4 + tail * 2.5 + uBoost * 2.0), a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
  return new THREE.Mesh(geo, mat)
}

/** Volumetric light shaft: an open cone that fades along its length and at the edges. */
export function lightShaft(color, { radius = 3, height = 30, opacity = 0.35 } = {}) {
  const geo = new THREE.CylinderGeometry(0.25, radius, height, 48, 1, true)
  geo.translate(0, -height / 2, 0)
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color.clone() }, uOpacity: { value: opacity }, uH: { value: height }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `varying float vY; varying vec3 vN; varying vec3 vV;
      void main(){ vY = position.y; vec4 wp = modelMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */ `uniform vec3 uColor; uniform float uOpacity; uniform float uH; uniform float uTime; varying float vY; varying vec3 vN; varying vec3 vV;
      void main(){
        float along = 1.0 - clamp(-vY / uH, 0.0, 1.0);
        float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.5);
        float flicker = 0.9 + 0.1 * sin(uTime * 3.0 + vY);
        gl_FragColor = vec4(uColor * 1.2, along * along * edge * uOpacity * flicker);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
  return new THREE.Mesh(geo, mat)
}

/** One-shot particle burst for click reactions. */
export function burst(count, color) {
  const pos = new Float32Array(count * 3)
  const vel = new Float32Array(count * 3)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.PointsMaterial({ map: glowTexture(), color, size: 0.5, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })
  const pts = new THREE.Points(geo, mat)
  pts.frustumCulled = false
  let life = 0
  return {
    object: pts,
    fire(origin = new THREE.Vector3(), speed = 14) {
      for (let i = 0; i < count; i++) {
        const v = new THREE.Vector3().randomDirection().multiplyScalar(speed * (0.3 + Math.random() * 0.7))
        vel.set([v.x, v.y, v.z], i * 3)
        pos.set([origin.x, origin.y, origin.z], i * 3)
      }
      geo.attributes.position.needsUpdate = true
      life = 1
      mat.opacity = 1
    },
    update(dt) {
      if (life <= 0) return
      life -= dt * 0.7
      for (let i = 0; i < count * 3; i++) {
        pos[i] += vel[i] * dt
        vel[i] *= 0.965
      }
      geo.attributes.position.needsUpdate = true
      mat.opacity = Math.max(0, life)
      mat.size = 0.5 + (1 - life) * 0.4
    },
  }
}

/* ---------------- Brand geometry ---------------- */
let logoShapesCache
/** Shapes of the official "tri / web" letters, centred, in world units (≈ 16 wide). */
export function logoShapes() {
  if (logoShapesCache) return logoShapesCache
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOGO_W} ${LOGO_H}"><path d="${LOGO_PATH}"/></svg>`
  const data = new SVGLoader().parse(svg)
  const shapes = []
  data.paths.forEach((p) => p.toShapes(true).forEach((s) => shapes.push(s)))
  logoShapesCache = shapes
  return shapes
}
/**
 * Extruded chrome logo. Each letter piece is its own mesh so they can be
 * animated apart. Returns { group, pieces }.
 */
export function logo3D({ depth = 90, material, scale = 0.01 } = {}) {
  const group = new THREE.Group()
  const pieces = []
  logoShapes().forEach((shape) => {
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 10, bevelSize: 6, bevelSegments: 3, curveSegments: 10 })
    geo.computeBoundingBox()
    const c = new THREE.Vector3()
    geo.boundingBox.getCenter(c)
    geo.translate(-c.x, -c.y, -c.z)
    const m = new THREE.Mesh(geo, material)
    // SVG y runs downward: flip, then scale to world units
    m.position.set((c.x - LOGO_W / 2) * scale, -(c.y - LOGO_H / 2) * scale, 0)
    m.scale.set(scale, -scale, scale)
    m.userData.home = m.position.clone()
    group.add(m)
    pieces.push(m)
  })
  return { group, pieces }
}

/** Smoothly approach a target value. */
export const damp = (a, b, lambda, dt) => THREE.MathUtils.damp(a, b, lambda, dt)
