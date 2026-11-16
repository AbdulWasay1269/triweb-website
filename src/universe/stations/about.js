import * as THREE from 'three'
import { BRAND, chrome, lightShaft, glowSprite, streakSprite, burst, logo3D, damp } from '../shared.js'

/**
 * ABOUT: dimensional typography. TriWeb's own logo letters, extruded in
 * polished chrome, floating on a reflective plane under three converging
 * light shafts (the three founders).
 * Interactive: the logo (Assemble: letters explode outward and come back
 * together) and each shaft spotlight (Shine: it brightens and sweeps).
 */
export function createAbout(ctx) {
  const { tier } = ctx
  const g = new THREE.Group()

  const mat = chrome('#f4eeea', 0.12)
  const accent = new THREE.MeshStandardMaterial({ color: BRAND.vermilion, metalness: 0.7, roughness: 0.22, emissive: BRAND.vermilion, emissiveIntensity: 0.15 })
  const { group: logo, pieces } = logo3D({ depth: 80, material: mat, scale: 0.011 })
  pieces.forEach((p) => {
    p.userData.dir = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, Math.random() * 1.5 + 0.5).normalize()
    p.userData.spin = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(6)
  })
  const box = new THREE.Box3().setFromObject(logo)
  const size = box.getSize(new THREE.Vector3())
  const fit = 11 / Math.max(size.x, 0.001)
  logo.scale.setScalar(fit)
  logo.position.set(0, 0.6, -4)
  g.add(logo)
  // Vermilion backplate: the brand's icon box, floating behind the chrome letters
  const plateShape = new THREE.Shape()
  const pw = size.x * fit * 1.08
  const ph = size.y * fit * 1.12
  const rr = Math.min(pw, ph) * 0.12
  plateShape.moveTo(-pw / 2 + rr, -ph / 2)
  plateShape.lineTo(pw / 2 - rr, -ph / 2)
  plateShape.quadraticCurveTo(pw / 2, -ph / 2, pw / 2, -ph / 2 + rr)
  plateShape.lineTo(pw / 2, ph / 2 - rr)
  plateShape.quadraticCurveTo(pw / 2, ph / 2, pw / 2 - rr, ph / 2)
  plateShape.lineTo(-pw / 2 + rr, ph / 2)
  plateShape.quadraticCurveTo(-pw / 2, ph / 2, -pw / 2, ph / 2 - rr)
  plateShape.lineTo(-pw / 2, -ph / 2 + rr)
  plateShape.quadraticCurveTo(-pw / 2, -ph / 2, -pw / 2 + rr, -ph / 2)
  const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(plateShape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3 }), accent)
  plate.position.set(0, 0.6, -5.4)
  // The brand plate glows only once the monument is engaged (hover/click)
  plate.visible = false
  g.add(plate)
  // Hit volume for the logo
  const logoHit = new THREE.Mesh(new THREE.BoxGeometry(size.x * fit * 1.05, Math.max(size.y * fit, 2) * 1.3, 2), new THREE.MeshBasicMaterial({ visible: false }))
  logoHit.position.copy(logo.position)
  g.add(logoHit)

  // Reflective floor
  const floorGlow = glowSprite(BRAND.vermilion, 26, 0.18)
  floorGlow.position.set(0, -4.6, -4)
  g.add(floorGlow)

  // Three converging shafts (founders)
  const shafts = []
  const shaftColors = [BRAND.vermilion, BRAND.peach, BRAND.ember]
  const shaftHits = []
  for (let i = 0; i < 3; i++) {
    const s = lightShaft(shaftColors[i], { radius: 4.2, height: 26, opacity: 0.22 })
    const x = (i - 1) * 12
    s.position.set(x, 18, -6)
    s.rotation.z = (i - 1) * -0.42
    s.userData = { baseRot: s.rotation.z, hover: 0, shine: 0 }
    shafts.push(s)
    g.add(s)
    const src = glowSprite(shaftColors[i], 4, 0.6)
    src.position.set(x, 18, -6)
    g.add(src)
    s.userData.src = src
    const hit = new THREE.Mesh(new THREE.SphereGeometry(2, 12, 8), new THREE.MeshBasicMaterial({ visible: false }))
    hit.position.set(x * 0.55, 7, -6)
    hit.userData.shaft = s
    shaftHits.push(hit)
    g.add(hit)
  }
  const flare = streakSprite(new THREE.Color('#ffd7c4'), 30, 0.3, 0.25)
  flare.position.set(0, 0.6, -2)
  g.add(flare)

  // Dust motes drifting in the beams
  const dustCount = tier === 'high' ? 700 : 260
  const dPos = new Float32Array(dustCount * 3)
  for (let i = 0; i < dustCount; i++) dPos.set([(Math.random() - 0.5) * 34, Math.random() * 18 - 3, -Math.random() * 14 + 2], i * 3)
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3))
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: BRAND.peach, size: 0.07, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }))
  g.add(dust)

  const pBurst = burst(tier === 'high' ? 500 : 200, BRAND.peach)
  g.add(pBurst.object)

  // The whole monument stands back and to the right, rising behind the page
  // header's mountains, so it never sits behind the headline
  const stage = new THREE.Group()
  ;[...g.children].forEach((c) => stage.add(c))
  stage.position.set(14, -3.5, -40)
  g.add(stage)

  const state = { hover: 0, apart: 0, apartTarget: 0, flash: 0 }
  const tmp = new THREE.Vector3()

  return {
    group: g,
    camera: { pos: new THREE.Vector3(0, 1.2, 17), look: new THREE.Vector3(0, 0.4, -4) },
    interactives: [
      {
        targets: [logoHit],
        label: 'Assemble',
        hover: (on) => (state.hover = on ? 1 : 0),
        click: () => {
          state.apartTarget = state.apartTarget ? 0 : 1
          state.flash = 1
          pBurst.fire(logo.position.clone(), 13)
          return state.apartTarget === 1
        },
      },
      ...shaftHits.map((h) => ({
        targets: [h],
        label: 'Shine',
        hover: (on) => (h.userData.shaft.userData.hover = on ? 1 : 0),
        click: () => {
          h.userData.shaft.userData.shine = 1.5
          return false
        },
      })),
    ],
    reset() {
      state.apartTarget = 0
    },
    update(t, dt, env) {
      state.apart = damp(state.apart, state.apartTarget, state.apartTarget ? 2.2 : 3, dt)
      state.flash = damp(state.flash, 0, 2, dt)
      const k = state.apart
      pieces.forEach((p, i) => {
        const d = p.userData
        tmp.copy(d.home).addScaledVector(d.dir, k * (5 + (i % 5) * 1.2) / fit)
        tmp.y += Math.sin(t * 0.9 + i) * (0.05 + state.hover * 0.12) / fit
        p.position.copy(tmp)
        p.rotation.set(d.spin.x * k, d.spin.y * k + Math.sin(t * 0.5 + i) * 0.04 * (1 + state.hover * 3), d.spin.z * k)
      })
      logo.rotation.y = damp(logo.rotation.y, env.pointer.x * 0.35, 2.2, dt)
      logo.rotation.x = damp(logo.rotation.x, -env.pointer.y * 0.18, 2.2, dt)
      logo.position.y = 0.6 + Math.sin(t * 0.6) * 0.15
      plate.position.y = logo.position.y
      plate.rotation.copy(logo.rotation)
      plate.scale.setScalar(1 - state.apart * 0.15 + state.hover * 0.03)
      plate.visible = state.hover > 0 || state.apart > 0.02 || state.flash > 0.05
      logo.visible = plate.visible
      accent.emissiveIntensity = 0.12 + state.hover * 0.5 + state.flash
      flare.material.opacity = 0.2 + state.hover * 0.25 + state.flash * 0.6
      floorGlow.material.opacity = 0.15 + state.hover * 0.1 + state.flash * 0.3

      shafts.forEach((s, i) => {
        const d = s.userData
        d.shine = damp(d.shine, 0, 1.2, dt)
        s.material.uniforms.uTime.value = t
        s.material.uniforms.uOpacity.value = 0.18 + (env.beams || 0) * 0.3 + d.hover * 0.2 + d.shine * 0.3 + state.flash * 0.1
        s.rotation.z = d.baseRot + Math.sin(t * 0.3 + i * 2) * 0.05 + d.shine * Math.sin(t * 4) * 0.12
        d.src.material.opacity = 0.5 + (env.beams || 0) * 0.35 + d.hover * 0.4 + d.shine * 0.4
      })
      for (let i = 0; i < dustCount; i++) {
        let y = dPos[i * 3 + 1] + dt * 0.25
        if (y > 15) y = -3
        dPos[i * 3 + 1] = y
        dPos[i * 3] += Math.sin(t * 0.3 + i) * dt * 0.1
      }
      dustGeo.attributes.position.needsUpdate = true
      pBurst.update(dt)
    },
  }
}
