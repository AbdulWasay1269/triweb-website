import * as THREE from 'three'
import { BRAND, chrome, glass, energyMaterial, glowSprite, lightShaft, burst, damp, glowTexture } from '../shared.js'

/**
 * HERO: "The TriWeb Gateway".
 *
 * A sculpture designed for the brand: three chrome architectural frames
 * (tri: three minds, three founders) stand in a triangle on a floating
 * obsidian mirror plinth. Each frame holds a pane of glass. Hovering at the
 * centre is a glass prism with an energy core: the creative spark. Silk-like
 * ribbons of orange light weave through the frames: creativity flowing
 * through technology. A shaft of light falls on the prism from above, and the
 * mountains and the low sun of the shared world sit behind it all.
 *
 * Interactions
 * - Cursor proximity: the frame nearest the cursor leans in and its edges warm.
 * - Hover: "Ignite" on the prism, "Align" on the frames.
 * - Click the prism: energy surges through the ribbons, a shockwave crosses the
 *   plinth and the sculpture shifts to a white-gold "charged" palette.
 * - Click a frame: the three frames turn to face the viewer as a triptych.
 * - Scroll away: the frames open outward, the sculpture turns, the ribbons rise.
 * - On load: frames rise out of the plinth one by one, ribbons draw themselves.
 */

/** A silk ribbon: a twisting band of light along a closed curve. */
function silkRibbon(curve, color, { width = 0.32, twists = 3, segments = 360, speed = 0.06, phase = 0 } = {}) {
  const frames = curve.computeFrenetFrames(segments, true)
  const pos = []
  const nrm = []
  const u = []
  const side = []
  const idx = []
  const p = new THREE.Vector3()
  const d = new THREE.Vector3()
  const n = new THREE.Vector3()
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    curve.getPointAt(t % 1, p)
    const k = i % segments
    const a = t * Math.PI * 2 * twists + phase
    d.copy(frames.normals[k]).multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[k], Math.sin(a))
    n.crossVectors(frames.tangents[k], d).normalize()
    const w = width * (0.55 + 0.45 * Math.sin(t * Math.PI * 6 + phase))
    for (const s of [-1, 1]) {
      pos.push(p.x + d.x * w * s, p.y + d.y * w * s, p.z + d.z * w * s)
      nrm.push(n.x, n.y, n.z)
      u.push(t)
      side.push(s)
    }
    if (i < segments) {
      const b = i * 2
      idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3))
  geo.setAttribute('aU', new THREE.Float32BufferAttribute(u, 1))
  geo.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1))
  geo.setIndex(idx)
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: color.clone() },
      uHot: { value: new THREE.Color('#ffbf99') },
      uSpeed: { value: speed },
      uPhase: { value: phase },
      uBoost: { value: 0 },
      uReveal: { value: 0 },
      uCharge: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute float aU; attribute float aSide;
      varying float vU; varying float vSide; varying float vFacing;
      void main(){
        vU = aU; vSide = aSide;
        vec3 nV = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vFacing = abs(dot(nV, normalize(-mv.xyz)));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uColor; uniform vec3 uHot; uniform float uSpeed; uniform float uPhase;
      uniform float uBoost; uniform float uReveal; uniform float uCharge;
      varying float vU; varying float vSide; varying float vFacing;
      void main(){
        // Drawn on during the opening: only the part of the loop already revealed shows
        float shown = smoothstep(uReveal, uReveal - 0.04, vU);
        float edge = 1.0 - smoothstep(0.55, 1.0, abs(vSide));
        // Silk sheen: bright where the band faces the viewer, darker as it turns away
        float sheen = pow(vFacing, 1.6);
        // Light travelling along the ribbon: soft bands plus two bright heads
        float flow = 0.55 + 0.45 * sin((vU * 26.0 - uTime * (1.2 + uBoost * 3.0)) * 3.14159);
        float h1 = fract(uTime * uSpeed * (1.0 + uBoost * 3.0) + uPhase);
        float d1 = h1 - vU; d1 += step(d1, 0.0);
        float h2 = fract(h1 + 0.5);
        float d2 = h2 - vU; d2 += step(d2, 0.0);
        float heads = exp(-d1 * 22.0) + exp(-d2 * 22.0);
        vec3 base = mix(uColor, uHot, uCharge * 0.75);
        vec3 col = base * (0.35 + sheen * 0.9) * flow + uHot * heads * (0.9 + uBoost);
        float a = edge * shown * (0.32 + sheen * 0.55 + heads * 0.7) * (1.0 + uBoost * 0.6);
        gl_FragColor = vec4(col * (1.35 + uBoost), a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
  return new THREE.Mesh(geo, mat)
}

/** Rounded-rectangle outline for an architectural frame (outer shape with a hole). */
function frameShape(w, h, t, r) {
  const rr = (s, x, y, ww, hh, rad) => {
    s.moveTo(x + rad, y)
    s.lineTo(x + ww - rad, y)
    s.quadraticCurveTo(x + ww, y, x + ww, y + rad)
    s.lineTo(x + ww, y + hh - rad)
    s.quadraticCurveTo(x + ww, y + hh, x + ww - rad, y + hh)
    s.lineTo(x + rad, y + hh)
    s.quadraticCurveTo(x, y + hh, x, y + hh - rad)
    s.lineTo(x, y + rad)
    s.quadraticCurveTo(x, y, x + rad, y)
  }
  const outer = new THREE.Shape()
  rr(outer, -w / 2, 0, w, h, r)
  const hole = new THREE.Path()
  rr(hole, -w / 2 + t, t, w - t * 2, h - t * 2, Math.max(0.05, r - t * 0.6))
  outer.holes.push(hole)
  const inner = new THREE.Shape()
  rr(inner, -w / 2 + t, t, w - t * 2, h - t * 2, Math.max(0.05, r - t * 0.6))
  return { outer, inner }
}

export function createHero(ctx) {
  const { tier } = ctx
  const g = new THREE.Group()
  const sculpt = new THREE.Group() // everything that moves together
  g.add(sculpt)

  /* ---------- Plinth: a floating obsidian mirror ---------- */
  const plinthMat = new THREE.MeshStandardMaterial({ color: '#0c1322', metalness: 1, roughness: 0.12, envMapIntensity: 1.5 })
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(4.7, 4.95, 0.42, 128), plinthMat)
  plinth.position.y = -0.21
  sculpt.add(plinth)
  const rimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.42, 0.24) })
  const rim = new THREE.Mesh(new THREE.TorusGeometry(4.72, 0.03, 8, 160), rimMat)
  rim.rotation.x = Math.PI / 2
  sculpt.add(rim)
  // Triangle inlay on the plinth top, and the click shockwave
  const triPts = [0, 1, 2, 0].map((i) => {
    const a = Math.PI / 2 + (i * Math.PI * 2) / 3
    return new THREE.Vector3(Math.cos(a) * 3.3, 0.01, Math.sin(a) * 3.3)
  })
  const inlayMat = new THREE.LineBasicMaterial({ color: BRAND.ember, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending })
  sculpt.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(triPts), inlayMat))
  const waveMat = new THREE.MeshBasicMaterial({ color: BRAND.peach, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  const wave = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 128), waveMat)
  wave.rotation.x = -Math.PI / 2
  wave.position.y = 0.02
  sculpt.add(wave)
  // Soft reflection of the core on the mirror
  const pool = glowSprite(BRAND.vermilion, 12, 0.5)
  pool.position.set(0, 0.05, 0)
  pool.scale.set(9, 3, 1)
  sculpt.add(pool)

  /* ---------- Three architectural frames ---------- */
  const specs = [
    { w: 2.9, h: 7.2, ang: Math.PI / 2 },
    { w: 2.4, h: 5.4, ang: Math.PI / 2 + (Math.PI * 2) / 3 },
    { w: 2.0, h: 4.1, ang: Math.PI / 2 + (Math.PI * 4) / 3 },
  ]
  const frames = specs.map((sp, i) => {
    const { outer, inner } = frameShape(sp.w, sp.h, 0.2, 0.5)
    const geo = new THREE.ExtrudeGeometry(outer, { depth: 0.26, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 10 })
    geo.translate(0, 0, -0.13)
    const mat = chrome('#cfc6c2', 0.1)
    mat.emissive = BRAND.vermilion.clone()
    mat.emissiveIntensity = 0
    const frame = new THREE.Mesh(geo, mat)
    const paneMat = glass('#ff9a70', 0.06)
    const pane = new THREE.Mesh(new THREE.ShapeGeometry(inner, 10), paneMat)
    const edgeMat = new THREE.LineBasicMaterial({ color: BRAND.ember, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
    const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(inner.getPoints(12).map((v) => new THREE.Vector3(v.x, v.y, 0.15))), edgeMat)
    const holder = new THREE.Group()
    holder.add(frame, pane, edge)
    const pivot = new THREE.Group()
    pivot.add(holder)
    const r = 2.9
    pivot.userData = { ...sp, i, r, home: new THREE.Vector3(Math.cos(sp.ang) * r, 0, Math.sin(sp.ang) * r), prox: 0, hover: 0, rise: 0 }
    pivot.position.copy(pivot.userData.home)
    // Face the centre, turned a little so the openings read from the front
    pivot.rotation.y = -sp.ang + Math.PI / 2 + 0.35
    pivot.userData.baseRot = pivot.rotation.y
    holder.rotation.z = (i - 1) * 0.03
    sculpt.add(pivot)
    return { pivot, holder, frame, pane, edge, mat, paneMat, edgeMat }
  })

  /* ---------- The spark: a glass prism with an energy core ---------- */
  const spark = new THREE.Group()
  const prismGeo = new THREE.CylinderGeometry(1.05, 1.05, 2.5, 3, 1)
  const prism = new THREE.Mesh(prismGeo, glass('#ffd2bd', 0.09))
  const prismEdges = new THREE.LineSegments(new THREE.EdgesGeometry(prismGeo), new THREE.LineBasicMaterial({ color: new THREE.Color(1.4, 1.1, 1.0), transparent: true, opacity: 0.85 }))
  const coreMat = energyMaterial(BRAND.vermilion, { intensity: 1.6, flow: 1.4 })
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 4), coreMat)
  const coreGlow = glowSprite(BRAND.ember, 4.2, 0.45)
  const sparkLight = new THREE.PointLight('#ff6a3d', 10, 12, 2)
  spark.add(prism, prismEdges, core, coreGlow, sparkLight)
  spark.position.y = 3.1
  sculpt.add(spark)

  /* ---------- Silk ribbons weaving through the frames ---------- */
  const ribbonColors = [BRAND.vermilion, BRAND.ember, BRAND.peach]
  const ribbons = []
  const ribbonCount = tier === 'low' ? 2 : 3
  for (let k = 0; k < ribbonCount; k++) {
    const pts = []
    const N = 14
    for (let j = 0; j < N; j++) {
      const a = (j / N) * Math.PI * 2 + k * 0.9
      const r = 3.3 + Math.sin(a * 3 + k) * 1.3
      const y = 2.6 + k * 0.7 + Math.sin(a * 2 + k * 1.7) * 1.9
      pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r))
    }
    const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal')
    const rib = silkRibbon(curve, ribbonColors[k], { width: 0.52 - k * 0.08, twists: 2 + k, segments: tier === 'high' ? 420 : 260, speed: 0.05 + k * 0.015, phase: k * 2.1 })
    ribbons.push(rib)
    sculpt.add(rib)
  }

  /* ---------- Volumetric light from above, dust in the beam ---------- */
  // Warm fill from the front-left so the chrome reads bright against the sunset
  const fill = new THREE.PointLight('#ffb38f', 55, 30, 1.6)
  fill.position.set(-6, 7, 8)
  sculpt.add(fill)
  const shaft = lightShaft(BRAND.peach, { radius: 3.4, height: 22, opacity: 0.14 })
  shaft.position.set(0, 19, 0)
  sculpt.add(shaft)
  const dustCount = tier === 'high' ? 420 : tier === 'mid' ? 220 : 90
  const dPos = new Float32Array(dustCount * 3)
  const dSeed = []
  for (let i = 0; i < dustCount; i++) {
    const a = Math.random() * Math.PI * 2
    const r = 0.6 + Math.random() * 6.5
    dSeed.push({ a, r, y: Math.random() * 11, s: 0.08 + Math.random() * 0.25 })
  }
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3))
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: glowTexture(), color: BRAND.peach, size: 0.12, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false }))
  dust.frustumCulled = false
  sculpt.add(dust)

  const pBurst = burst(tier === 'high' ? 500 : 220, BRAND.peach)
  g.add(pBurst.object)

  /* ---------- Hit volumes ---------- */
  const sparkHit = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 8), new THREE.MeshBasicMaterial({ visible: false }))
  spark.add(sparkHit)
  frames.forEach((f) => {
    const hit = new THREE.Mesh(new THREE.BoxGeometry(f.pivot.userData.w, f.pivot.userData.h, 0.6), new THREE.MeshBasicMaterial({ visible: false }))
    hit.position.y = f.pivot.userData.h / 2
    f.holder.add(hit)
    f.hit = hit
  })

  const state = { sparkHover: 0, charge: 0, chargeTarget: 0, surge: 0, align: 0, alignTarget: 0, wave: 0, spin: 0 }
  const camera = { pos: new THREE.Vector3(), look: new THREE.Vector3() }
  const tmp = new THREE.Vector3()
  const anchor = { x: 7.6, y: -3.4 }

  const layout = (portrait) => {
    // Desktop: sculpture on the right third, the headline owns the left.
    // Portrait: sculpture centred above the text.
    if (portrait) {
      // Phones: the sculpture is framed in the top of the screen, above the copy
      anchor.x = 0
      anchor.y = -0.6
      camera.pos.set(0, -0.5, 20)
      camera.look.set(0, -6.2, 0)
    } else {
      anchor.x = 7.4
      anchor.y = -3.1
      camera.pos.set(0.6, 2.3, 17.2)
      camera.look.set(3.6, 0.9, 0)
    }
  }
  layout(false)

  return {
    group: g,
    camera,
    sunX: 175, // the shared world's sun sits behind the sculpture
    ambience: { glow: 1, exposure: 1.32 }, // golden hour for the opening shot
    interactives: [
      {
        targets: [sparkHit],
        label: 'Ignite',
        hover: (on) => (state.sparkHover = on ? 1 : 0),
        click: () => {
          state.chargeTarget = state.chargeTarget ? 0 : 1
          state.surge = 1.6
          state.wave = 1
          spark.getWorldPosition(tmp)
          pBurst.fire(tmp, 11)
          return state.chargeTarget === 1
        },
      },
      ...frames.map((f) => ({
        targets: [f.hit],
        label: 'Align',
        hover: (on) => (f.pivot.userData.hover = on ? 1 : 0),
        click: () => {
          state.alignTarget = state.alignTarget ? 0 : 1
          state.surge = Math.max(state.surge, 0.8)
          return state.alignTarget === 1
        },
      })),
    ],
    reset() {
      state.chargeTarget = 0
      state.alignTarget = 0
    },
    update(t, dt, env) {
      if (env.portrait !== undefined) layout(env.portrait)
      const intro = env.intro ?? 1
      const local = THREE.MathUtils.clamp(env.local ?? 0, 0, 1) // 0 at the hero, 1 by the next scene
      sculpt.position.set(anchor.x, anchor.y + Math.sin(t * 0.55) * 0.12, 0)

      // Idle + scroll: a slow turn, faster and further as the visitor scrolls away
      state.spin += dt * (0.05 + state.surge * 0.1)
      sculpt.rotation.y = state.spin + local * 1.1 + env.pointer.x * 0.12
      sculpt.rotation.x = damp(sculpt.rotation.x, -env.pointer.y * 0.05, 2, dt)
      state.surge = damp(state.surge, 0, 1.3, dt)
      state.charge = damp(state.charge, state.chargeTarget, 2, dt)
      state.align = damp(state.align, state.alignTarget, 2.4, dt)

      // Frames: rise on load, lean toward the cursor, open outward on scroll
      const camQ = env.cameraQuat
      frames.forEach((f, i) => {
        const u = f.pivot.userData
        u.rise = THREE.MathUtils.clamp((intro - 0.08 - i * 0.12) / 0.5, 0, 1)
        const e = 1 - Math.pow(1 - u.rise, 3)
        f.pivot.getWorldPosition(tmp)
        tmp.y += u.h * 0.5
        const near = env.ray ? THREE.MathUtils.clamp(1 - (env.ray.distanceToPoint(tmp) - 0.8) / 4, 0, 1) : 0
        u.prox = damp(u.prox, near, 5, dt)
        const spread = 1 + local * 0.6
        f.pivot.position.set(u.home.x * spread, -u.h * (1 - e) - 0.2 * (1 - e), u.home.z * spread)
        // Align: all three turn to face the viewer as a triptych
        const target = u.baseRot + u.prox * 0.18 + Math.sin(t * 0.4 + i * 2) * 0.03
        let rot = target
        if (camQ) {
          const faceCam = -sculpt.rotation.y
          rot = THREE.MathUtils.lerp(target, faceCam, state.align)
        }
        f.pivot.rotation.y = damp(f.pivot.rotation.y, rot, 4, dt)
        f.holder.rotation.x = damp(f.holder.rotation.x, -u.prox * 0.05, 4, dt)
        f.mat.emissiveIntensity = u.prox * 0.35 + u.hover * 0.45 + state.surge * 0.25 + state.charge * 0.15
        f.paneMat.opacity = 0.08 + u.prox * 0.1 + u.hover * 0.12 + state.align * 0.08
        f.edgeMat.opacity = Math.min(1, u.prox * 0.6 + u.hover * 0.8 + state.surge * 0.5 + state.align * 0.4) * e
        f.mat.opacity = 1
      })

      // The spark
      const ignite = THREE.MathUtils.clamp((intro - 0.35) / 0.4, 0, 1)
      spark.rotation.y += dt * (0.35 + state.sparkHover * 0.8 + state.surge * 2)
      spark.position.y = 3.1 + Math.sin(t * 0.9) * 0.18 + local * 1.4
      const sp = 1 + state.sparkHover * 0.08 + state.surge * 0.06
      spark.scale.setScalar(sp * (0.4 + 0.6 * ignite))
      coreMat.uniforms.uTime.value = t
      coreMat.uniforms.uIntensity.value = (1.2 + state.sparkHover * 0.6 + state.surge * 1.6 + state.charge * 0.8) * ignite
      coreMat.uniforms.uColor.value.lerpColors(BRAND.vermilion, BRAND.gold, state.charge * 0.8)
      coreGlow.material.opacity = (0.38 + state.sparkHover * 0.12 + state.surge * 0.3) * ignite
      sparkLight.intensity = (9 + state.sparkHover * 6 + state.surge * 30 + state.charge * 8) * ignite
      sparkLight.color.lerpColors(new THREE.Color('#ff6a3d'), new THREE.Color('#ffd2a0'), state.charge)

      // Ribbons: draw on during the opening, surge on click, rise on scroll
      ribbons.forEach((r, k) => {
        const m = r.material.uniforms
        m.uTime.value = t
        m.uReveal.value = THREE.MathUtils.clamp((intro - 0.25 - k * 0.08) / 0.55, 0, 1) * 1.05
        m.uBoost.value = state.surge * 0.8 + state.sparkHover * 0.25
        m.uCharge.value = state.charge
        r.position.y = local * (1.5 + k)
        r.rotation.y = local * (0.6 - k * 0.4)
      })

      // Plinth, shaft, dust
      rimMat.color.setRGB(1.6 + state.charge * 0.6, 0.42 + state.charge * 0.5, 0.24 + state.charge * 0.3).multiplyScalar(0.3 + 0.7 * intro)
      inlayMat.opacity = (0.35 + state.surge * 0.5 + state.charge * 0.3) * intro
      pool.material.opacity = (0.42 + state.sparkHover * 0.15 + state.surge * 0.3) * ignite
      shaft.material.uniforms.uTime.value = t
      shaft.material.uniforms.uOpacity.value = (0.2 + state.sparkHover * 0.06 + state.charge * 0.06) * intro
      if (state.wave > 0) {
        state.wave = Math.max(0, state.wave - dt * 0.9)
        wave.scale.setScalar(1 + (1 - state.wave) * 9)
        waveMat.opacity = state.wave * 0.9
      }
      for (let i = 0; i < dustCount; i++) {
        const d = dSeed[i]
        d.y += dt * d.s * (1 + state.surge * 3)
        if (d.y > 11) d.y = 0
        d.a += dt * 0.05
        dPos[i * 3] = Math.cos(d.a) * d.r
        dPos[i * 3 + 1] = d.y
        dPos[i * 3 + 2] = Math.sin(d.a) * d.r
      }
      dustGeo.attributes.position.needsUpdate = true
      pBurst.update(dt)
    },
  }
}
