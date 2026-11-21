import * as THREE from 'three'
import { currentRoute } from '../lib/routes.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { BRAND, starfield, nebula, damp } from './shared.js'
import { createWorld } from './world.js'
import { createHero } from './stations/hero.js'
import { createMedia } from './stations/media.js'
import { createSoftware } from './stations/software.js'
import { createAI } from './stations/ai.js'
import { createAbout } from './stations/about.js'
import { createFinale } from './stations/finale.js'
import { scrollState } from '../lib/scroll.js'
import { isSoftwareRenderer } from '../three/useThreeStage.js'

/* =======================================================================
   TriWeb Universe: one continuous real-time 3D world behind the site.
   Six "stations" sit along a camera path. Each page marks its sections
   with data-station="…"; as you scroll, the camera flies from one station
   to the next, dwelling while a section is on screen.
   ======================================================================= */

const BUILDERS = { hero: createHero, media: createMedia, software: createSoftware, ai: createAI, about: createAbout, finale: createFinale }
const SPACING = 170
const FALLBACK = { '': ['hero', 'media', 'software', 'ai', 'about', 'finale'] }
const FIRST = 'main section'
const CTA = 'section[aria-labelledby="cta-title"]'
/**
 * Which existing section each station is tied to, per page. The site's own
 * markup is read as it is: nothing on the pages had to change for this.
 */
const JOURNEYS = {
  '': [
    ['hero', 'section[aria-labelledby="hero-title"]'],
    ['media', '#divisions'],
    ['software', '[data-title-sequence]'],
    ['ai', 'section[aria-labelledby="why-title"]'],
    ['finale', CTA],
  ],
  // The About page opens at twilight: sunset glow behind the founders diagram,
  // and the three founders' beams of light meeting in the sky
  about: [['about', FIRST, { glow: 0.85, exposure: 1.26, sunX: 150, beams: 1 }], ['finale', CTA]],
  // The Media page opens like a film premiere: searchlights sweeping the sky,
  // the sun glowing behind the video cards like a projector
  media: [['media', FIRST, { glow: 0.72, exposure: 1.3, sunX: 170, premiere: 1, bokeh: 1 }], ['finale', CTA, { glow: 0.45, exposure: 1.2, premiere: 0.85, bokeh: 0.9 }]],
  software: [['software', FIRST], ['ai', '#case-studies'], ['finale', CTA]],
  work: [['media', FIRST, { glow: 0.6, exposure: 1.26, sunX: -150, aurora: 1, bokeh: 0.55 }], ['finale', CTA, { glow: 0.35, exposure: 1.18, aurora: 0.9, bokeh: 0.5 }]],
  contact: [['finale', FIRST], ['about', 'section[aria-labelledby="faq-title"]']],
}
const routeKey = () => {
  const h = currentRoute()
  return JOURNEYS[h] ? h : ''
}

/** Elements that keep their own pointer behaviour: the 3D scene ignores events over them. */
const UI = 'a, button, input, textarea, select, label, summary, [role="button"], [role="tab"], [role="dialog"], [role="slider"], [data-cursor], video, img, nav, header, footer, form, .card, .glass, [data-no3d]'

const LensShader = {
  uniforms: { tDiffuse: { value: null }, uAberr: { value: 0 }, uVignette: { value: 0.9 }, uTime: { value: 0 } },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uAberr; uniform float uVignette; uniform float uTime; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5;
      float d = dot(c, c);
      vec2 off = c * uAberr * (0.4 + d * 2.0);
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;
      col *= mix(1.0, smoothstep(0.85, 0.15, d * 1.6), uVignette);
      col += (hash(vUv * 800.0) - 0.5) * 0.018;
      gl_FragColor = vec4(col, 1.0);
    }`,
}

function pickTier(renderer) {
  // ?quality=high|mid|low overrides detection (handy for testing a device class)
  const forced = new URLSearchParams(location.search).get('quality')
  if (forced === 'high' || forced === 'mid' || forced === 'low') return forced
  if (isSoftwareRenderer(renderer)) return 'low'
  const touch = matchMedia('(pointer: coarse)').matches
  if (touch || innerWidth < 900 || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) < 4) return 'mid'
  // Bloom and the lens pass are reserved for dedicated graphics cards;
  // laptops with built-in graphics get the same scene without them.
  let gpu = ''
  try {
    const gl = renderer.getContext()
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    gpu = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER))
  } catch {
    /* unknown GPU: stay conservative */
  }
  return /nvidia|geforce|rtx|quadro|radeon (rx|pro)|apple m[1-9]/i.test(gpu) ? 'high' : 'mid'
}

export function createUniverse(container, { posters = [], reducedMotion = false, isCovered = () => false } = {}) {
  /* ---------- Renderer ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false })
  const tier = pickTier(renderer)
  // Draw at the screen's real resolution so the scene stays sharp (capped on
  // very dense phone/retina screens, where the extra pixels aren't visible
  // behind the content but would cost a lot). Machines without a graphics
  // card get a reduced resolution; they only render while the page is still.
  const dpr = devicePixelRatio || 1
  // Up to the screen's full density on capable GPUs (crisp on 4K / retina);
  // the controller in the loop lowers it only when frames would suffer.
  const maxRatio = tier === 'high' ? Math.min(dpr, 2) : tier === 'mid' ? Math.min(dpr, 1.5) : 0.45
  // Start one notch below the maximum on very dense screens and let the
  // controller earn the rest, so the first seconds are never the slow ones.
  let ratio = tier === 'low' ? 0.45 : Math.min(maxRatio, Math.max(1, dpr * 0.75))
  const minRatio = Math.min(dpr, tier === 'low' ? 0.4 : 1)
  renderer.setPixelRatio(ratio)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#0b1220') // the site's obsidian
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = envRT.texture
  scene.environmentIntensity = 0.85
  pmrem.dispose()

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 520)
  camera.position.set(0, 0.6, 22)

  // Lights: warm key, cool-navy fill, and a light that follows the cursor
  scene.add(new THREE.AmbientLight('#2a3350', 0.6))
  const key = new THREE.DirectionalLight('#ffd2bd', 2.2)
  key.position.set(6, 10, 8)
  scene.add(key)
  // Rim light comes from the horizon sun, the same direction in every scene
  const rim = new THREE.DirectionalLight('#ff3a20', 2.6)
  rim.position.set(0, 3.2, -10)
  scene.add(rim)
  const cursorLight = new THREE.PointLight('#ff8a5c', tier === 'low' ? 0 : 90, 46, 1.6)
  scene.add(cursorLight)

  /* ---------- Global atmosphere ---------- */
  const depth = SPACING * 6 + 260
  const stars = starfield(tier === 'high' ? 4200 : tier === 'mid' ? 2200 : 900, 150, depth)
  stars.material.uniforms.uPR.value = ratio
  stars.frustumCulled = false
  scene.add(stars)
  const nebulae = []
  const nebColors = [
    [BRAND.vermilion, new THREE.Color('#3b2a6b')],
    [BRAND.ember, new THREE.Color('#1e2c5a')],
    [new THREE.Color('#ff2d55'), BRAND.peach],
  ]
  // Nebulae are full-screen noise shaders: skipped on devices without a graphics card
  for (let i = 0; i < (tier === 'low' ? 0 : 6); i++) {
    const [a, b] = nebColors[i % 3]
    const n = nebula(a, b, 300, 0.32)
    n.position.set((i % 2 ? 1 : -1) * 50, 40, -i * SPACING - 170)
    nebulae.push(n)
    scene.add(n)
  }

  const world = createWorld({ tier, length: depth })
  scene.add(world.group)

  /* ---------- Post-processing ---------- */
  let composer = null
  let bloom = null
  let lens = null
  const setupComposer = () => {
    if (tier !== 'high') return
    composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: renderer.capabilities.isWebGL2 ? 4 : 0 }))
    composer.addPass(new RenderPass(scene, camera))
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.85, 0.55, 0.72)
    composer.addPass(bloom)
    lens = new ShaderPass(LensShader)
    composer.addPass(lens)
    composer.addPass(new OutputPass())
  }
  setupComposer()

  /* ---------- Stations ---------- */
  const ctx = { tier, posters, pixelRatio: ratio, maxAniso: renderer.capabilities.getMaxAnisotropy() }
  const stations = {}
  const getStation = (key) => {
    if (!stations[key]) {
      const s = BUILDERS[key](ctx)
      s.key = key
      s.group.visible = false
      s.hoverables = s.interactives.flatMap((it, idx) => {
        it.key = `${key}:${idx}`
        return it.targets.map((obj) => {
          obj.traverse((o) => (o.userData.__interactive = it))
          return obj
        })
      })
      scene.add(s.group)
      stations[key] = s
    }
    return stations[key]
  }

  // Path layout for the current page
  let path = []
  let keys = []
  let pathAmb = []
  const layout = () => {
    const found = JOURNEYS[routeKey()]
      .map(([k, sel, amb]) => {
        const el = document.querySelector(sel)
        return el && [k, el.closest('section') || el, amb]
      })
      .filter(Boolean)
    const els = found.map((x) => x[1])
    path = found.length ? found.map((x) => x[0]) : FALLBACK['']
    // Per-page mood for a scene (overrides the scene's own default)
    pathAmb = found.length ? found.map((x) => x[2] || null) : []
    // Measure where each station's section sits in the document
    const docH = document.documentElement.scrollHeight
    const max = Math.max(1, docH - innerHeight)
    keys = path.map((_, i) => {
      const el = els[i]
      if (!el) return (i / Math.max(1, path.length - 1)) * max
      const r = el.getBoundingClientRect()
      const top = r.top + scrollState.y
      return Math.min(max, Math.max(0, top - innerHeight * 0.25))
    })
    keys[0] = 0
    for (let i = 1; i < keys.length; i++) keys[i] = Math.max(keys[i], keys[i - 1] + 1)
    Object.values(stations).forEach((s) => (s.group.visible = false))
    path.forEach((k, i) => {
      // A station can appear once per page; later duplicates reuse the first slot
      const s = getStation(k)
      if (path.indexOf(k) === i) s.group.position.set(0, 0, -i * SPACING)
    })
  }

  /* ---------- Camera rig ---------- */
  const camPos = new THREE.Vector3()
  const camLook = new THREE.Vector3()
  const tPos = new THREE.Vector3()
  const tLook = new THREE.Vector3()
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const la = new THREE.Vector3()
  const lb = new THREE.Vector3()
  let portrait = false
  let chapter = 0 // float position along the path
  const stationCam = (key, pos, look) => {
    const s = getStation(key)
    look.copy(s.camera.look).add(s.group.position)
    pos.copy(s.camera.pos).add(s.group.position)
    if (portrait) pos.sub(look).multiplyScalar(1.45).add(look)
  }
  const dwell = (f) => {
    // Hold on each station while its section is on screen, then glide
    const x = THREE.MathUtils.clamp((f - 0.18) / 0.64, 0, 1)
    return x * x * x * (x * (x * 6 - 15) + 10)
  }
  const computeChapter = () => {
    const y = scrollState.y
    if (path.length < 2 || y <= keys[0]) return 0
    for (let i = 0; i < keys.length - 1; i++) {
      if (y < keys[i + 1]) return i + dwell((y - keys[i]) / (keys[i + 1] - keys[i]))
    }
    return path.length - 1
  }

  /* ---------- Interaction ---------- */
  const raycaster = new THREE.Raycaster()
  raycaster.camera = camera
  const ndc = new THREE.Vector2(9, 9)
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  let pointerDirty = false
  let overUI = true
  let hovered = null
  const altered = new Set()
  const emit = (name, detail) => dispatchEvent(new CustomEvent(name, { detail }))
  const setHovered = (it) => {
    if (it === hovered) return
    hovered?.hover(false)
    hovered = it
    hovered?.hover(true)
    document.documentElement.classList.toggle('universe-hover', !!it)
    emit('triweb:3dhover', { label: it ? it.label : null })
  }
  const activeStation = () => {
    const k = path[Math.min(path.length - 1, Math.round(chapter))]
    return k && stations[k]
  }
  // Is the 3D scene actually visible at this point, or covered by a solid panel?
  let solidCache = new WeakMap()
  let cacheAge = 0
  const isSolid = (el) => {
    let v = solidCache.get(el)
    if (v === undefined) {
      const cs = getComputedStyle(el)
      const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/)
      const alpha = m ? (m[1].split(',')[3] === undefined ? 1 : parseFloat(m[1].split(',')[3])) : 0
      v = alpha > 0.5 || (cs.backgroundImage !== 'none' && el.offsetWidth * el.offsetHeight > 20000) || el.tagName === 'CANVAS'
      solidCache.set(el, v)
    }
    return v
  }
  const covered = (x, y) => {
    for (const el of document.elementsFromPoint(x, y)) {
      if (el === renderer.domElement || el === container || el === document.body || el === document.documentElement) return false
      if (el.closest('[aria-hidden="true"].fixed')) continue // background layers, cursor
      if (isUI(el) || isSolid(el)) return true
    }
    return false
  }
  const client = { x: -1, y: -1 }
  let blocked = true
  let lastY = -1
  const pick = () => {
    const s = activeStation()
    if (!s || overUI || client.x < 0) return null
    if (pointerDirty || lastY !== scrollState.y) {
      lastY = scrollState.y
      blocked = covered(client.x, client.y)
    }
    if (blocked) return null
    raycaster.setFromCamera(ndc, camera)
    const hit = raycaster.intersectObjects(s.hoverables, true)[0]
    return hit ? hit.object.userData.__interactive : null
  }

  const isUI = (el) => !!(el && el.closest && el.closest(UI))
  const onMove = (e) => {
    pointer.tx = (e.clientX / innerWidth) * 2 - 1
    pointer.ty = -((e.clientY / innerHeight) * 2 - 1)
    ndc.set(pointer.tx, pointer.ty)
    client.x = e.clientX
    client.y = e.clientY
    overUI = isUI(e.target) || window.__lightboxOpen
    pointerDirty = true
  }
  let down = null
  const onDown = (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now() }
  }
  let kick = 0
  const onUp = (e) => {
    if (!down) return
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y)
    const quick = performance.now() - down.t < 1000
    down = null
    if (moved > 8 || !quick || e.button > 0) return
    if (isUI(e.target) || window.__lightboxOpen) return
    if (String(getSelection?.() || '').length) return
    onMove(e)
    const it = pick()
    if (!it) return
    if (e.pointerType !== 'mouse') {
      // Touch: show the hover state briefly so taps feel alive
      it.hover(true)
      setTimeout(() => it !== hovered && it.hover(false), 700)
    }
    const on = it.click()
    if (on) altered.add(it.key)
    else altered.delete(it.key)
    kick = 1
    emit('triweb:3dstate', { altered: altered.size > 0 })
  }
  const onReset = () => {
    Object.values(stations).forEach((s) => s.reset())
    altered.clear()
    kick = 0.6
    emit('triweb:3dstate', { altered: false })
  }
  addEventListener('pointermove', onMove, { passive: true })
  addEventListener('pointerdown', onDown, { passive: true })
  addEventListener('pointerup', onUp, { passive: true })
  addEventListener('triweb:3dreset', onReset)

  /* ---------- Route changes ---------- */
  let warp = 0
  let snap = true
  const onRevealed = () => {
    layout()
    snap = true
    snapFrame = true
    lastSection = -1
    warp = 1
    setHovered(null)
  }
  addEventListener('triweb:revealed', onRevealed)

  /* ---------- Resize ---------- */
  const resize = () => {
    const w = container.clientWidth || innerWidth
    const h = container.clientHeight || innerHeight
    portrait = w / h < 0.8
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
    composer?.setPixelRatio(ratio)
    composer?.setSize(w, h)
    layout()
    snap = true
    if (reducedMotion) frame(0)
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)

  /* ---------- Frame ---------- */
  let t = 0
  let needsLayout = false
  let fov = 50
  let pickTick = 0
  // Opening shot: the camera glides in from high and far, the light fades up
  let intro = reducedMotion ? 1 : 0
  let ready = false
  const ease = (x) => 1 - Math.pow(1 - x, 3)
  let lastSection = -1
  let snapFrame = true
  const frame = (dt) => {
    t += dt
    if (needsLayout) {
      // The page grew or shrank (images, lazy sections): re-measure once
      needsLayout = false
      layout()
    }
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 6)
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 6)

    // Where on the path are we?
    const target = computeChapter()
    chapter = snap || reducedMotion ? target : damp(chapter, target, 5, dt)
    const i = Math.min(path.length - 1, Math.floor(chapter))
    const j = Math.min(path.length - 1, i + 1)
    const f = chapter - i
    intro = Math.min(1, intro + dt / 3.4)
    const ie = ease(intro)
    stationCam(path[i], a, la)
    stationCam(path[j], b, lb)
    tPos.lerpVectors(a, b, f)
    tLook.lerpVectors(la, lb, f)
    if (ie < 1) {
      tPos.y += 6 * (1 - ie)
      tPos.z += 14 * (1 - ie)
      tLook.y += 2.5 * (1 - ie)
    }
    // Swooping arc between stations, alternating sides like a crane shot
    const arc = Math.sin(Math.PI * f)
    const side = i % 2 ? 1 : -1
    tPos.x += arc * 14 * side
    tPos.y += arc * 5
    // Idle drift + mouse parallax
    tPos.x += Math.sin(t * 0.17) * 0.6 + pointer.x * 1.6
    tPos.y += Math.sin(t * 0.23) * 0.35 + pointer.y * 0.9
    tLook.x += pointer.x * 0.6
    tLook.y += pointer.y * 0.35
    if (snap || ie < 1) {
      camPos.copy(tPos)
      camLook.copy(tLook)
      snap = false
    } else {
      camPos.x = damp(camPos.x, tPos.x, 4, dt)
      camPos.y = damp(camPos.y, tPos.y, 4, dt)
      camPos.z = damp(camPos.z, tPos.z, 4, dt)
      camLook.x = damp(camLook.x, tLook.x, 5, dt)
      camLook.y = damp(camLook.y, tLook.y, 5, dt)
      camLook.z = damp(camLook.z, tLook.z, 5, dt)
    }
    camera.position.copy(camPos)
    if (kick > 0) {
      camera.position.x += (Math.random() - 0.5) * kick * 0.25
      camera.position.y += (Math.random() - 0.5) * kick * 0.25
      kick = Math.max(0, kick - dt * 2.5)
    }
    camera.lookAt(camLook)
    camera.rotateZ(arc * 0.06 * side - THREE.MathUtils.clamp(scrollState.velocity * 0.0012, -0.04, 0.04))

    // Speed = warp: stars stretch, lens widens, aberration grows
    const speed = Math.min(Math.abs(scrollState.velocity) / 40, 1)
    warp = damp(warp, 0, 1.6, dt)
    const w = Math.max(speed, warp, arc * 0.35)
    const baseFov = portrait ? 60 : 50
    fov = damp(fov, baseFov + w * 9, 4, dt)
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    stars.material.uniforms.uTime.value = t
    stars.material.uniforms.uWarp.value = w
    nebulae.forEach((n, i) => {
      // Only the cloud behind the current scene is drawn
      n.visible = Math.abs(i - chapter) < 1.3
      if (!n.visible) return
      n.material.uniforms.uTime.value = t
      n.lookAt(camera.position)
    })
    if (lens) {
      lens.uniforms.uAberr.value = w * 0.006 + kick * 0.004
      lens.uniforms.uTime.value = t % 10
    }
    if (bloom) bloom.strength = 0.8 + kick * 0.5 + w * 0.2

    // Cursor light floats a few units in front of the camera, toward the pointer
    cursorLight.position.set(pointer.x * 9, pointer.y * 5, -6).applyMatrix4(camera.matrixWorld)

    const sa = stations[path[i]]
    const sb = stations[path[j]]
    const ambA = pathAmb[i] || sa?.ambience || {}
    const ambB = pathAmb[j] || sb?.ambience || {}
    const sunX = portrait ? 0 : THREE.MathUtils.lerp(ambA.sunX ?? sa?.sunX ?? 0, ambB.sunX ?? sb?.sunX ?? 0, f)
    const glow = THREE.MathUtils.lerp(ambA.glow || 0, ambB.glow || 0, f)
    const exposure = THREE.MathUtils.lerp(ambA.exposure || 1.05, ambB.exposure || 1.05, f)
    const amb = (k) => THREE.MathUtils.lerp(ambA[k] || 0, ambB[k] || 0, f)
    world.update(t, dt, { camera, pointer, ndc, chapter, flash: kick, sunX, glow, premiere: amb('premiere'), bokeh: amb('bokeh'), aurora: amb('aurora'), pxScale: renderer.domElement.height * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) })
    renderer.toneMappingExposure = exposure * (0.3 + 0.7 * ie)
    if (bloom) bloom.strength *= 0.4 + 0.6 * ie

    // A soft light sweep marks each new section, like a cut in a film
    const nearest = Math.round(chapter)
    if (nearest !== lastSection) {
      if (lastSection !== -1 && !snapFrame) emit('triweb:3dsection', { key: path[nearest] })
      lastSection = nearest
    }
    snapFrame = false

    // The cursor's ray into the scene, for proximity effects
    const rayOn = client.x >= 0 && !overUI
    if (rayOn) raycaster.setFromCamera(ndc, camera)

    // Only the stations around the camera are drawn and animated
    path.forEach((k, idx) => {
      const s = stations[k]
      if (!s || path.indexOf(k) !== idx) return
      // A scene is drawn only once the camera has started travelling toward it,
      // so the next scene never peeks in behind the current one
      const near = chapter > idx - 0.97 && chapter < idx + 1.02
      s.group.visible = near
      if (near) s.update(t, reducedMotion ? 0 : dt, { pointer, chapter, f, local: chapter - idx, portrait, intro: ie, ray: rayOn ? raycaster.ray : null, cameraQuat: camera.quaternion, beams: pathAmb[idx]?.beams || 0, premiere: pathAmb[idx]?.premiere || 0, bokeh: pathAmb[idx]?.bokeh || 0, vh: window.scrollY / Math.max(1, window.innerHeight) })
    })
    cacheAge += dt
    if (cacheAge > 2) {
      cacheAge = 0
      solidCache = new WeakMap()
    }
    if (pointerDirty || ++pickTick % 8 === 0) {
      setHovered(pick())
      pointerDirty = false
    }

    if (composer) composer.render(dt)
    else renderer.render(scene, camera)
    if (!ready) {
      ready = true
      emit('triweb:3dready', {})
    }
  }

  /* ---------- Loop: refresh-aligned pacing + adaptive resolution ---------- */
  // Frames are paced to the display itself: every refresh while something is
  // moving (scroll, mouse, an effect), exactly every second refresh when the
  // visitor is reading. Divisors of the refresh rate keep frame spacing even,
  // so there is no judder at 60, 120 or 144 Hz.
  let divisor = 1 // 1 = full refresh rate; raised only if the GPU can't keep up
  const idleExtra = tier === 'low' ? 6 : 2
  let lastActive = performance.now()
  let lastScroll = 0
  let raf = 0
  let frameNo = 0
  let lastRender = performance.now()
  let lastTick = performance.now()
  // Display refresh interval, measured (ms)
  let refresh = 16.7
  let refreshSamples = []
  // Quality controller state
  const maxRatioNow = maxRatio
  let ema = 0
  let slowFor = 0
  let fastFor = 0
  let lastChange = 0
  const setRatio = (r) => {
    r = Math.round(r * 100) / 100
    if (Math.abs(r - ratio) < 0.02) return
    ratio = r
    renderer.setPixelRatio(ratio)
    stars.material.uniforms.uPR.value = ratio
    resize()
  }
  // Step down: resolution first (never below the screen's own pixel size),
  // then bloom, then half rate. Step up: resolution back toward the screen's
  // full density (sharp on 4K and retina) once there is headroom.
  const tune = (now, renderMs, expectedMs) => {
    ema = ema ? ema * 0.9 + renderMs * 0.1 : renderMs
    const over = ema > expectedMs * 1.28
    const under = ema < expectedMs * 1.06
    slowFor = over ? slowFor + renderMs : 0
    fastFor = under ? fastFor + renderMs : 0
    if (now - lastChange < 1200) return
    if (slowFor > 900) {
      lastChange = now
      slowFor = 0
      if (ratio > minRatio + 0.01) setRatio(Math.max(minRatio, ratio * 0.85))
      else if (composer) {
        composer.dispose()
        composer = null
        bloom = null
        lens = null
      } else if (divisor < 2) divisor = 2
    } else if (fastFor > 4000 && ratio < maxRatioNow - 0.01 && divisor === 1) {
      lastChange = now
      fastFor = 0
      setRatio(Math.min(maxRatioNow, ratio * 1.08))
    }
  }
  const loop = () => {
    raf = requestAnimationFrame(loop)
    const now = performance.now()
    const interval = now - lastTick
    lastTick = now
    if (interval > 3 && interval < 40) {
      refreshSamples.push(interval)
      if (refreshSamples.length > 60) {
        refreshSamples.sort((a, b) => a - b)
        refresh = refreshSamples[6] // a low percentile: the display's own interval
        refreshSamples = []
      }
    }
    if (document.hidden || isCovered()) {
      lastRender = now
      return
    }
    if (Math.abs(scrollState.velocity) > 0.3 || pointerDirty || kick > 0) lastActive = now
    if (Math.abs(scrollState.velocity) > 0.3) lastScroll = now
    // Without a graphics card every 3D frame blocks the page, so the scene
    // holds still while the visitor scrolls and catches up the moment they stop.
    if (tier === 'low' && now - lastScroll < 350) return
    const div = now - lastActive < 1500 ? divisor : divisor * idleExtra
    frameNo++
    if (frameNo % div) return
    const elapsed = now - lastRender
    lastRender = now
    const dt = Math.min(elapsed / 1000, 0.1)
    frame(dt)
    if (tier !== 'low' && div === divisor) tune(now, elapsed, refresh * div)
  }

  // Reduced motion: no animation loop, the scene just follows the scroll position
  let scrollRaf = 0
  const onScrollStatic = () => {
    cancelAnimationFrame(scrollRaf)
    scrollRaf = requestAnimationFrame(() => frame(0))
  }

  resize()
  layout()
  getStation(path[0])
  // Build the remaining scenes one by one while the browser is idle and
  // compile their shaders in the background, so scrolling never stalls.
  const idle = window.requestIdleCallback || ((fn) => setTimeout(() => fn({ timeRemaining: () => 8 }), 200))
  let idleId = 0
  const prebuild = () => {
    const missing = Object.keys(BUILDERS).find((k) => !stations[k])
    if (!missing) {
      // compileAsync collects programs synchronously, so scenes can be hidden again right after
      Object.values(stations).forEach((s) => (s.group.visible = true))
      if (renderer.extensions.has('KHR_parallel_shader_compile')) renderer.compileAsync(scene, camera).catch(() => {})
      else renderer.compile(scene, camera)
      Object.values(stations).forEach((s) => (s.group.visible = false))
      needsLayout = true
      return
    }
    getStation(missing)
    idleId = idle(prebuild, { timeout: 1500 })
  }
  idleId = idle(prebuild, { timeout: 1500 })
  const bodyRO = new ResizeObserver(() => (needsLayout = true))
  bodyRO.observe(document.body)
  if (reducedMotion) {
    frame(0)
    addEventListener('scroll', onScrollStatic, { passive: true })
  } else loop()

  const onVisibility = () => {
    last = performance.now()
  }
  document.addEventListener('visibilitychange', onVisibility)

  return {
    tier,
    renderer,
    /** Screen position of an interactive object (used by automated tests). */
    screenOf(key, idx = 0) {
      const s = stations[key]
      if (!s) return null
      const v = new THREE.Vector3()
      new THREE.Box3().setFromObject(s.interactives[idx].targets[0]).getCenter(v)
      v.project(camera)
      return [((v.x + 1) / 2) * innerWidth, ((1 - v.y) / 2) * innerHeight]
    },
    probe(x, y) {
      ndc.set((x / innerWidth) * 2 - 1, -((y / innerHeight) * 2 - 1))
      const el = document.elementFromPoint(x, y)
      const s = activeStation()
      raycaster.setFromCamera(ndc, camera)
      const hits = s ? raycaster.intersectObjects(s.hoverables, true) : []
      return { active: s && s.key, ui: isUI(el) || covered(x, y), el: el && el.tagName, hits: hits.length, label: hits[0] && hits[0].object.userData.__interactive?.label }
    },
    debug: () => ({ tier, ratio, bloom: !!composer, path, keys, chapter, stations: Object.keys(stations), calls: renderer.info.render.calls, tris: renderer.info.render.triangles }),
    dispose() {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(scrollRaf)
      ;(window.cancelIdleCallback || clearTimeout)(idleId)
      ro.disconnect()
      bodyRO.disconnect()
      removeEventListener('pointermove', onMove)
      removeEventListener('pointerdown', onDown)
      removeEventListener('pointerup', onUp)
      removeEventListener('triweb:3dreset', onReset)
      removeEventListener('triweb:revealed', onRevealed)
      removeEventListener('scroll', onScrollStatic)
      document.removeEventListener('visibilitychange', onVisibility)
      document.documentElement.classList.remove('universe-hover')
      scene.traverse((o) => {
        o.geometry?.dispose?.()
        if (o.material) [].concat(o.material).forEach((m) => {
          Object.values(m.uniforms || {}).forEach((u) => u.value?.isTexture && u.value.dispose())
          m.map?.dispose?.()
          m.dispose()
        })
      })
      envRT.dispose()
      composer?.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
