import * as THREE from 'three'
import { BRAND, chrome, darkMetal, glass, energyMaterial, glowSprite, streakSprite, lightTrail, lightShaft, burst, damp } from '../shared.js'

/**
 * MEDIA PRODUCTIONS: a cinema world. Film strips made from TriWeb's own
 * video frames spiral through space, a giant cinema lens watches, a film reel
 * turns and spotlights sweep the haze.
 * Interactive: the lens (Focus: aperture snaps + flare + rack-focus pulse)
 * and the reel (Roll: reel and film strips speed up, light trails flare).
 */

/** Builds a film-strip texture from the poster frames (with sprocket holes). */
function filmTexture(posters) {
  const fw = 270
  const fh = 480
  const pad = 36
  const n = posters.length
  const c = document.createElement('canvas')
  c.width = n * (fw + 16)
  c.height = fh + pad * 2
  const g = c.getContext('2d')
  const draw = (imgs) => {
    g.fillStyle = '#0d0d10'
    g.fillRect(0, 0, c.width, c.height)
    for (let i = 0; i < n; i++) {
      const x = i * (fw + 16) + 8
      const img = imgs[i]
      if (img) {
        g.drawImage(img, x, pad, fw, fh)
        g.fillStyle = 'rgba(255,90,40,0.12)'
        g.fillRect(x, pad, fw, fh)
      } else {
        g.fillStyle = '#2a1a1a'
        g.fillRect(x, pad, fw, fh)
      }
      // sprocket holes
      g.fillStyle = '#e9dfd6'
      for (let k = 0; k < 6; k++) {
        const hx = x + 10 + k * ((fw - 20) / 6)
        g.fillRect(hx, 10, 20, 15)
        g.fillRect(hx, c.height - 25, 20, 15)
      }
    }
  }
  draw([])
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.anisotropy = 8
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  // Load the real poster frames, then redraw
  const imgs = new Array(n)
  let loaded = 0
  posters.forEach((src, i) => {
    const im = new Image()
    im.decoding = 'async'
    im.onload = () => {
      imgs[i] = im
      if (++loaded === n || loaded % 4 === 0) {
        draw(imgs)
        tex.needsUpdate = true
      }
    }
    im.onerror = () => loaded++
    im.src = src
  })
  return tex
}

/** A ribbon mesh along a curve with UVs (u along the length, v across). */
function ribbon(curve, width, segments, repeat) {
  const pts = curve.getSpacedPoints(segments)
  const pos = []
  const uv = []
  const idx = []
  const tan = new THREE.Vector3()
  const nrm = new THREE.Vector3()
  const up = new THREE.Vector3(0, 0, 1)
  for (let i = 0; i <= segments; i++) {
    curve.getTangentAt(i / segments, tan)
    nrm.crossVectors(tan, up).normalize()
    const p = pts[i]
    pos.push(p.x - nrm.x * width, p.y - nrm.y * width, p.z - nrm.z * width, p.x + nrm.x * width, p.y + nrm.y * width, p.z + nrm.z * width)
    uv.push((i / segments) * repeat, 0, (i / segments) * repeat, 1)
    if (i < segments) {
      const a = i * 2
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

export function createMedia(ctx) {
  const { tier, posters } = ctx
  const g = new THREE.Group()

  // Film strips: long ribbons of TriWeb's own frames running across the
  // landscape at different depths, like film travelling through a projector.
  // They sweep side to side behind the content instead of circling it.
  const tex = filmTexture(posters)
  tex.anisotropy = ctx.maxAniso || 8
  const texAspect = tex.image.width / tex.image.height
  const strips = []
  const stripCount = tier === 'high' ? 3 : 2
  for (let s = 0; s < stripCount; s++) {
    const pts = []
    for (let k = 0; k <= 80; k++) {
      const x = -70 + (k / 80) * 140
      // Kept low in the frame so headings and paragraphs above stay clear
      const y = -8 + s * 2.2 + Math.sin(x * 0.045 + s * 1.3) * 1.2
      const z = -18 - s * 9 + Math.cos(x * 0.035 + s * 1.7) * 9
      pts.push(new THREE.Vector3(x, y, z))
    }
    const curve = new THREE.CatmullRomCurve3(pts)
    const width = 1.6
    const repeat = curve.getLength() / (width * 2 * texAspect)
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.7, color: new THREE.Color(0.85, 0.78, 0.76) })
    const mesh = new THREE.Mesh(ribbon(curve, width, tier === 'high' ? 300 : 180, repeat), mat)
    strips.push(mesh)
    g.add(mesh)
    // matching light trail riding along the strip edge
    const tr = lightTrail(curve, s % 2 ? BRAND.ember : BRAND.peach, { width: 0.05, speed: 0.12, length: 0.18 })
    tr.position.set(0, 1.75, 0)
    g.add(tr)
    strips.push(tr)
  }

  // Cinema lens
  const lens = new THREE.Group()
  const barrelMat = darkMetal(0.3)
  const ringMat = chrome('#e7e1de', 0.14)
  const radii = [3.2, 3.0, 2.8, 2.6]
  radii.forEach((r, i) => {
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.9, 64, 1, true), i % 2 ? ringMat : barrelMat)
    cyl.rotation.x = Math.PI / 2
    cyl.position.z = -i * 0.9
    lens.add(cyl)
    const lip = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 12, 96), ringMat)
    lip.position.z = -i * 0.9 + 0.45
    lens.add(lip)
  })
  // Aperture blades
  const blades = []
  for (let i = 0; i < 8; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 0.04), darkMetal(0.25))
    const pivot = new THREE.Group()
    pivot.rotation.z = (i / 8) * Math.PI * 2
    b.position.set(1.3, 0, 0)
    pivot.add(b)
    pivot.position.z = -1.6
    blades.push(b)
    lens.add(pivot)
  }
  const lensGlass = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), glass('#ffc2a6', 0.22))
  lensGlass.position.z = 0.46
  const lensCore = glowSprite(BRAND.ember, 5, 0.5)
  lensCore.position.z = -1.2
  const lensStreak = streakSprite(new THREE.Color('#ffd2bd'), 22, 0.35, 0)
  lensStreak.position.z = 0.6
  lens.add(lensGlass, lensCore, lensStreak)
  lens.position.set(-36, 17, -22)
  lens.rotation.y = 0.45
  g.add(lens)

  // Film reel
  const reel = new THREE.Group()
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.16, 16, 96), chrome('#ddd6d2', 0.15))
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 32), chrome('#ffffff', 0.1))
  hub.rotation.x = Math.PI / 2
  reel.add(rim, hub)
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.2, 0.12), chrome('#cfc8c4', 0.2))
    spoke.position.y = 1.35
    const pv = new THREE.Group()
    pv.rotation.z = (i / 5) * Math.PI * 2
    pv.add(spoke)
    reel.add(pv)
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), new THREE.MeshBasicMaterial({ color: BRAND.vermilion, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))
    hole.position.set(Math.cos((i / 5) * Math.PI * 2 + 0.6) * 1.55, Math.sin((i / 5) * Math.PI * 2 + 0.6) * 1.55, 0.05)
    reel.add(hole)
  }
  const reelGlowMat = energyMaterial(BRAND.vermilion, { intensity: 0.4 })
  const reelGlow = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.4, 16, 96), reelGlowMat)
  reel.add(reelGlow)
  reel.position.set(36, -7, -22)
  reel.rotation.y = -0.5
  g.add(reel)

  // Sweeping spotlights
  const spots = []
  for (let i = 0; i < 2; i++) {
    const s = lightShaft(i ? BRAND.peach : BRAND.ember, { radius: 6, height: 34, opacity: 0.16 })
    s.position.set(i ? 9 : -9, 16, -10)
    spots.push(s)
    g.add(s)
  }

  // Premiere searchlights (Media page): tall beams rising from behind the
  // mountains and sweeping slowly across the sky. Hidden unless asked for.
  const searchlights = []
  const searchGroup = new THREE.Group()
  ;[-58, -22, 22, 58].forEach((x, i) => {
    const beam = lightShaft(i % 2 ? BRAND.peach : new THREE.Color('#ffc9a8'), { radius: 9, height: 150, opacity: 0 })
    beam.rotation.x = Math.PI // origin at the ground, widening upward
    const pivot = new THREE.Group()
    pivot.position.set(x, -6, -120)
    pivot.add(beam)
    pivot.userData = { base: (x / 58) * -0.32, ph: i * 1.7 }
    searchlights.push({ pivot, beam })
    searchGroup.add(pivot)
    const foot = glowSprite(BRAND.peach, 16, 0)
    foot.position.set(x, -4, -118)
    searchGroup.add(foot)
    searchlights[i].foot = foot
  })
  searchGroup.visible = false
  g.add(searchGroup)

  const pBurst = burst(tier === 'high' ? 500 : 200, BRAND.peach)
  g.add(pBurst.object)
  const state = { lensHover: 0, aperture: 0, flare: 0, reelHover: 0, reelSpin: 0, rollSpeed: 0, focus: 0 }

  return {
    group: g,
    camera: { pos: new THREE.Vector3(0, 1.5, 22), look: new THREE.Vector3(0, 0.5, -10) },
    interactives: [
      {
        targets: [lens],
        label: 'Focus',
        hover: (on) => (state.lensHover = on ? 1 : 0),
        click: () => {
          state.aperture = state.aperture ? 0 : 1
          state.flare = 1.4
          state.focus = 1
          pBurst.fire(lens.position.clone().add(new THREE.Vector3(0, 0, 1)), 10)
          return state.aperture === 1
        },
      },
      {
        targets: [reel],
        label: 'Roll',
        hover: (on) => (state.reelHover = on ? 1 : 0),
        click: () => {
          state.rollSpeed = state.rollSpeed ? 0 : 1
          state.reelSpin = 6
          return state.rollSpeed === 1
        },
      },
    ],
    reset() {
      state.aperture = 0
      state.rollSpeed = 0
    },
    update(t, dt, env) {
      const speed = 0.02 + state.rollSpeed * 0.12 + state.reelSpin * 0.02
      tex.offset.x -= dt * speed
      strips.forEach((s) => {
        if (s.material.uniforms) {
          s.material.uniforms.uTime.value = t * (1 + state.rollSpeed * 2)
          s.material.uniforms.uBoost.value = state.rollSpeed * 0.8
        }
      })
      // Lens: blades open/close, hover tilts toward the cursor
      const open = state.aperture ? 0.55 : 0.05
      blades.forEach((b, i) => (b.rotation.z = damp(b.rotation.z, open + state.lensHover * 0.15 + Math.sin(t * 0.8 + i) * 0.02, 4, dt)))
      lens.rotation.y = damp(lens.rotation.y, 0.45 + env.pointer.x * 0.25 + state.lensHover * -0.2, 3, dt)
      lens.rotation.x = damp(lens.rotation.x, -env.pointer.y * 0.2, 3, dt)
      state.flare = damp(state.flare, 0, 2.2, dt)
      lensStreak.material.opacity = Math.min(1, state.flare * 0.7 + state.lensHover * 0.25)
      lensCore.material.opacity = 0.4 + state.lensHover * 0.3 + state.flare * 0.4
      state.focus = damp(state.focus, 0, 2, dt)
      lens.scale.setScalar(1 + state.focus * 0.12 + state.lensHover * 0.04)
      pBurst.update(dt)

      // Reel
      state.reelSpin = damp(state.reelSpin, 0, 1.2, dt)
      reel.rotation.z -= dt * (0.25 + state.rollSpeed * 2.5 + state.reelSpin)
      reelGlowMat.uniforms.uTime.value = t
      reelGlowMat.uniforms.uIntensity.value = damp(reelGlowMat.uniforms.uIntensity.value, 0.35 + state.reelHover * 1.4 + state.rollSpeed * 0.8, 4, dt)
      reel.position.y = -7 + Math.sin(t * 0.6) * 0.3

      // Premiere mood
      const prem = env.premiere || 0
      searchGroup.visible = false // the world-level searchlights now carry this
      if (prem > 0) {
        searchlights.forEach(({ pivot, beam, foot }) => {
          const u = pivot.userData
          pivot.rotation.z = u.base + Math.sin(t * 0.22 + u.ph) * 0.3
          pivot.rotation.x = -0.12 + Math.sin(t * 0.17 + u.ph) * 0.06
          beam.material.uniforms.uTime.value = t
          beam.material.uniforms.uOpacity.value = 0.36 * prem
          foot.material.opacity = 0.5 * prem
        })
      }
      // On the Media and Portfolio pages the strips bow out once the header scrolls away,
      // so they never sit behind card captions
      const stripFade = env.bokeh ? 1 - THREE.MathUtils.smoothstep(env.vh || 0, 0.35, 0.85) * 0.95 : 1
      strips.forEach((s, i) => {
        if (s.material.isMeshBasicMaterial) s.material.opacity = (0.7 + prem * 0.22) * stripFade
        // The deepest strip swings past a phone's narrow camera as a dark column, so phones skip it
        s.visible = (s.material.isMeshBasicMaterial || stripFade > 0.5) && !(env.portrait && i >= 4)
      })
      spots.forEach((s, i) => {
        s.material.uniforms.uTime.value = t
        s.rotation.z = Math.sin(t * 0.35 + i * 2) * 0.55
        s.rotation.x = Math.cos(t * 0.27 + i) * 0.25
      })
    },
  }
}
