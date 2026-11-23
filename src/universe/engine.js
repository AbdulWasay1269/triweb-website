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
import { gsap } from '../lib/motion.js'
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
  // Phones and tablets have 2-3x screens: drawn at 1x the scene looked soft and
  // blurry, so they may go up to 2x and never drop below 1.5x. If a phone's GPU
  // can't keep up, the controller lowers the frame rate rather than the sharpness.
  const handheld = matchMedia('(pointer: coarse)').matches
  const maxRatio = tier === 'high' || tier === 'mid' ? Math.min(dpr, 2) : 0.45
  // Start one notch below the maximum on very dense screens and let the
  // controller earn the rest, so the first seconds are never the slow ones.
  let ratio = tier === 'low' ? 0.45 : Math.min(maxRatio, Math.max(handheld ? 1.5 : 1, dpr * 0.75))
  // Phones keep 1.5x as long as they can; if the glow has already been switched
  // off and frames are still slow, sharpness may go a little lower (1.2x)
  // instead of halving the frame rate, which read as lag while scrolling.
  const minRatio = Math.min(dpr, tier === 'low' ? 0.4 : handheld ? 1.5 : 1)
  const floorRatio = Math.min(dpr, tier === 'low' ? 0.4 : handheld ? 1.2 : 1)
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
  // Cinematic glow (bloom) and the lens finish run on every device with a real
  // graphics chip; if one can't keep up, the controller drops them automatically.
  // Phones and tablets draw without the glow passes. On a tall screen the sun
  // sits right behind the sculpture and the glow washed the whole hero out into
  // a white, blurry-looking haze (it only cleared once a slow phone dropped the
  // glow to save time). Without it the scene is crisp from the first frame, and
  // the phone's GPU has far less to do every frame, which keeps scrolling smooth.
  // ?noglow: draw without the glow passes (for testing and capturing stills)
  const noGlow = new URLSearchParams(location.search).has('noglow')
  const setupComposer = () => {
    if (tier === 'low' || handheld || noGlow) return
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
      const at = path.indexOf(key)
      if (at >= 0) s.group.position.set(0, 0, -at * SPACING)
      // Stand-in lights: when a scene is hidden its own lights drop out of the
      // count, and three.js then recompiles every material's shader (a visible
      // stutter while scrolling). Matching zero-intensity lights switch on in
      // their place, so the light count, and the compiled shaders, never change.
      s.standIns = []
      s.group.traverse((o) => {
        if (!o.isLight) return
        const d = new o.constructor()
        d.intensity = 0
        d.visible = !s.group.visible
        scene.add(d)
        s.standIns.push(d)
      })
      stations[key] = s
    }
    return stations[key]
  }
  // Keep each scene's stand-in lights opposite to the scene itself
  const syncStandIns = () => {
    for (const s of Object.values(stations)) for (const d of s.standIns) d.visible = !s.group.visible
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
    syncStandIns()
    path.forEach((k, i) => {
      // Only the first scene is built when the 3D world starts (so starting it
      // is a short moment, not a long freeze); the rest are built one by one
      // in pauses between scrolls (prebuild) and get their position then.
      const s = i === 0 ? getStation(k) : stations[k]
      // A station can appear once per page; later duplicates reuse the first slot
      if (s && path.indexOf(k) === i) s.group.position.set(0, 0, -i * SPACING)
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
  const fallbackAt = new THREE.Vector3()
  const stationCam = (key, pos, look) => {
    const s = stations[key]
    if (!s) {
      // Not built yet (it will be in the next pause): aim where it will stand,
      // never build it here, mid-scroll
      const first = stations[path[0]]
      fallbackAt.set(0, 0, -path.indexOf(key) * SPACING)
      look.copy(first.camera.look).add(fallbackAt)
      pos.copy(first.camera.pos).add(fallbackAt)
      if (portrait) pos.sub(look).multiplyScalar(1.45).add(look)
      return
    }
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
  // When the hero's still image was shown while loading, the live scene starts
  // in the same final framing so the cross-fade is seamless (no second opening)
  let intro = reducedMotion || document.documentElement.classList.contains('u3d-still') ? 1 : 0
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
    // Follows the scroll closely (it trailed noticeably before), still eased so it glides
    chapter = snap || reducedMotion ? target : damp(chapter, target, 9, dt)
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
      camPos.x = damp(camPos.x, tPos.x, 7, dt)
      camPos.y = damp(camPos.y, tPos.y, 7, dt)
      camPos.z = damp(camPos.z, tPos.z, 7, dt)
      camLook.x = damp(camLook.x, tLook.x, 9, dt)
      camLook.y = damp(camLook.y, tLook.y, 9, dt)
      camLook.z = damp(camLook.z, tLook.z, 9, dt)
    }
    camera.position.copy(camPos)
    // A slow cinematic drift, so the scene is always gently alive
    if (!reducedMotion) {
      camera.position.x += Math.sin(t * 0.11) * 0.45 + Math.sin(t * 0.047) * 0.25
      camera.position.y += Math.sin(t * 0.15 + 1.3) * 0.22
    }
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
      for (const d of s.standIns) d.visible = !near
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
    if (!ready && reducedMotion) announce(performance.now())
  }
  // The scene is announced (and the hero picture fades out over it) only once
  // it is really running on screen. The first frames are drawn while still
  // hidden: on some computers the graphics driver needs seconds to get them on
  // screen (it finishes preparing shaders then), which showed as a dark hero
  // between the picture and the live scene. So: wait for a run of smooth frames.
  let smoothRun = 0
  let startedAt = 0
  const announce = (now) => {
    ready = true
    warmUntil = now + 2500
    emit('triweb:3dready', {})
  }

  /* ---------- Loop: refresh-aligned pacing + adaptive resolution ---------- */
  // Frames are paced to the display itself: every refresh while something is
  // moving (scroll, mouse, an effect), exactly every second refresh when the
  // visitor is reading. Divisors of the refresh rate keep frame spacing even,
  // so there is no judder at 60, 120 or 144 Hz.
  let divisor = 1 // 1 = full refresh rate; raised only if the GPU can't keep up
  // Full frame rate all the time on real graphics chips, so the scene's motion
  // never turns choppy when the visitor stops scrolling
  const idleExtra = tier === 'low' ? 6 : 1
  let lastActive = performance.now()
  let lastScroll = 0
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
  let composerDrops = 0
  // The first seconds are busy (scenes being built, shaders, videos and the
  // page's own opening animation). Frames that are slow for those reasons
  // made phones drop to a soft, blurry resolution right at the start, which
  // then took a long time to recover; so the controller waits them out.
  let warmUntil = Infinity
  const tune = (now, renderMs, expectedMs) => {
    if (now < warmUntil) return
    // One long frame (a page layout, garbage collection) mustn't count as a slow device
    renderMs = Math.min(renderMs, expectedMs * 2.5)
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
        composerDrops++
      } else if (ratio > floorRatio + 0.01) setRatio(Math.max(floorRatio, ratio * 0.88))
      else if (divisor < 2) divisor = 2
    } else if (fastFor > 3000) {
      // Headroom again: step back up, in reverse order. Before, half frame rate
      // and a dropped glow were permanent, so one heavy moment (often the first
      // scroll) left the scene choppy for the rest of the visit.
      lastChange = now
      fastFor = 0
      if (divisor > 1) divisor = 1
      else if (ratio < minRatio - 0.01) setRatio(Math.min(minRatio, ratio * 1.08))
      else if (!composer && tier !== 'low' && !handheld && composerDrops < 2) {
        setupComposer()
        composer.setPixelRatio(ratio)
        composer.setSize(container.clientWidth || innerWidth, container.clientHeight || innerHeight)
      }
      else if (ratio < maxRatioNow - 0.01) setRatio(Math.min(maxRatioNow, ratio * 1.08))
    }
  }
  // Runs on the same frame clock as the smooth scroll, right after it, so the
  // 3D camera always uses this frame's scroll position (it was a frame behind
  // the page before, which read as jitter between the page and the scene).
  const loop = () => {
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
    if (!ready) {
      smoothRun = interval < 70 ? smoothRun + 1 : 0
      if (smoothRun >= 10 || now - startedAt > 12000) announce(now)
      return
    }
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
  // Prepare every shader the scenes will ever need, before the visitor
  // scrolls: also parts that start hidden, and for the render target the
  // glow pass actually draws into. Shaders compiled on first use froze the
  // page for a moment each, which showed up as stutter while scrolling.
  const prepare = (root, compileFn) => {
    const hidden = []
    root.traverse((o) => {
      if (!o.visible) {
        hidden.push(o)
        o.visible = true
      }
    })
    syncStandIns()
    // Both versions: through the glow pass, and straight to the screen (used
    // if a device has to switch the glow off)
    if (composer) {
      renderer.setRenderTarget(composer.readBuffer)
      compileFn(root)
    }
    renderer.setRenderTarget(null)
    compileFn(root)
    hidden.forEach((o) => (o.visible = false))
    syncStandIns()
  }
  const parallel = renderer.extensions.has('KHR_parallel_shader_compile')
  let earlyDone = false
  // Background preparation (building other pages' scenes, compiling shaders)
  // never runs while the visitor is scrolling: it waits for a pause, so it
  // can't cause a hitch mid-scroll.
  let lastScrollAt = 0
  const onAnyScroll = () => (lastScrollAt = performance.now())
  addEventListener('scroll', onAnyScroll, { passive: true })
  const busy = () => performance.now() - lastScrollAt < 700 || Math.abs(scrollState.velocity) > 0.3
  const whenCalm = (fn) => {
    const run = () => {
      if (disposed) return
      if (busy()) idleId = idle(run, { timeout: 1500 })
      else fn()
    }
    idleId = idle(run, { timeout: 1500 })
  }
  const prebuild = () => {
    // First: this page's own scenes, right away. Before, nothing was prepared
    // until every page's scenes had been built (several seconds on a phone),
    // so an early scroll still compiled shaders mid-flight.
    if (!earlyDone) {
      earlyDone = true
      if (parallel) prepare(scene, (root) => renderer.compileAsync(root, camera).catch(() => {}))
      else {
        const own = [world.group, ...new Set(path.map((k) => stations[k]?.group).filter(Boolean))]
        const step = () => {
          const r = own.shift()
          if (!r) return (whenCalm(prebuild))
          prepare(r, (x) => renderer.compile(x, camera, scene))
          whenCalm(step)
        }
        whenCalm(step)
        return
      }
    }
    // This page's own scenes first, then the other pages'
    const missing = path.find((k) => !stations[k]) || Object.keys(BUILDERS).find((k) => !stations[k])
    if (!missing) {
      if (parallel) {
        // The GPU compiles in the background (Chrome, Edge). compileAsync collects
        // programs synchronously, so everything can be hidden again right after.
        prepare(scene, (root) => renderer.compileAsync(root, camera).catch(() => {}))
        needsLayout = true
        return
      }
      // No background compiling (e.g. Firefox, Safari): compiling everything at
      // once froze the page, so prepare one scene per idle moment instead.
      const queue = [world.group, ...Object.values(stations).map((st) => st.group)]
      const compileNext = () => {
        const root = queue.shift()
        if (!root) {
          needsLayout = true
          return
        }
        prepare(root, (r) => renderer.compile(r, camera, scene))
        whenCalm(compileNext)
      }
      whenCalm(compileNext)
      return
    }
    const built = getStation(missing)
    // Its shaders get ready right away too, in case the visitor scrolls there soon
    if (parallel) prepare(built.group, (root) => renderer.compileAsync(root, camera, scene).catch(() => {}))
    else if (path.includes(missing)) prepare(built.group, (root) => renderer.compile(root, camera, scene))
    whenCalm(prebuild)
  }
  // The other scenes are built a few seconds in, after the page has opened
  setTimeout(() => !disposed && whenCalm(prebuild), 3500)
  const bodyRO = new ResizeObserver(() => (needsLayout = true))
  bodyRO.observe(document.body)
  // Start drawing once the landscape is shaped and, where the browser can
  // compile shaders in the background, once they are compiled: the first
  // frame then costs no more than any other, so the page's opening animation
  // doesn't stutter while the 3D scene starts up. (The scene fades in anyway.)
  let started = false
  let disposed = false
  const begin = () => {
    if (started || disposed) return
    started = true
    startedAt = performance.now()
    if (reducedMotion) {
      frame(0)
      addEventListener('scroll', onScrollStatic, { passive: true })
    } else gsap.ticker.add(loop)
  }
  const warmups = [world.ready]
  earlyDone = true
  if (parallel) {
    let compiled
    prepare(scene, (root) => (compiled = renderer.compileAsync(root, camera).catch(() => {})))
    warmups.push(compiled)
  } else {
    // No background compiling (Safari, Firefox): compile this page's scenes one
    // at a time in free moments before the first frame, instead of all at once
    // inside it (a freeze of a second or more on phones).
    warmups.push(
      new Promise((resolve) => {
        const own = [world.group, ...new Set(path.map((k) => stations[k]?.group).filter(Boolean))]
        const step = () => {
          const r = own.shift()
          if (!r) return resolve()
          prepare(r, (x) => renderer.compile(x, camera, scene))
          whenCalm(step)
        }
        whenCalm(step)
      }),
    )
  }
  Promise.all(warmups).then(begin)
  // Never wait for ever (a stuck driver): draw anyway after a while
  setTimeout(begin, 8000)

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
    // Live numbers for the ?debug3d panel
    stats: () => ({ tier, ratio: +ratio.toFixed(2), divisor, programs: renderer.info.programs?.length ?? 0, y: Math.round(scrollState.y), scrollY: Math.round(scrollY), frames: renderer.info.render.frame, velocity: +scrollState.velocity.toFixed(2), covered: isCovered(), hidden: document.hidden, gpu: (() => { try { const gl = renderer.getContext(); const e = gl.getExtension('WEBGL_debug_renderer_info'); return String(gl.getParameter(e ? e.UNMASKED_RENDERER_WEBGL : gl.RENDERER)) } catch { return '?' } })() }),
    debug: () => ({ tier, ratio, bloom: !!composer, path, keys, chapter, stations: Object.keys(stations), calls: renderer.info.render.calls, tris: renderer.info.render.triangles }),
    dispose() {
      disposed = true
      gsap.ticker.remove(loop)
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
      removeEventListener('scroll', onAnyScroll)
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
