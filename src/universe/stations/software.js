import * as THREE from 'three'
import { BRAND, chrome, glass, energyMaterial, glowSprite, lightTrail, burst, damp } from '../shared.js'

/**
 * SOFTWARE COMPANY: a digital city. A scanning grid floor, instanced glowing
 * towers, data streams racing between them, holographic code panels and a
 * glass Core in the middle.
 * Interactive: the Core (Compile: it unfolds, the towers surge, a scan wave
 * sweeps the floor) and the code panels (Deploy: panel flips and streams flare).
 */

function codeTexture(seed) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 320
  const g = c.getContext('2d')
  g.fillStyle = 'rgba(20,10,10,0.0)'
  g.clearRect(0, 0, 256, 320)
  g.strokeStyle = 'rgba(255,140,100,0.9)'
  g.lineWidth = 2
  g.strokeRect(4, 4, 248, 312)
  let r = seed * 9301 + 49297
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280)
  for (let y = 26; y < 300; y += 16) {
    let x = 16 + Math.floor(rnd() * 3) * 16
    const parts = 1 + Math.floor(rnd() * 4)
    for (let p = 0; p < parts && x < 230; p++) {
      const w = 14 + rnd() * 60
      g.fillStyle = rnd() > 0.7 ? 'rgba(255,90,50,0.95)' : rnd() > 0.5 ? 'rgba(255,200,170,0.85)' : 'rgba(255,240,230,0.55)'
      g.fillRect(x, y, Math.min(w, 240 - x), 6)
      x += w + 8
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

export function createSoftware(ctx) {
  const { tier } = ctx
  const g = new THREE.Group()

  // Grid floor with scan wave
  const floorMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScan: { value: -1 }, uColor: { value: BRAND.vermilion.clone() }, uHi: { value: BRAND.peach.clone() } },
    vertexShader: /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uScan; uniform vec3 uColor; uniform vec3 uHi; varying vec3 vW;
      float line(float v, float w){ float f = abs(fract(v) - 0.5); return smoothstep(w, 0.0, 0.5 - f); }
      void main(){
        vec2 p = vW.xz - vec2(0.0, ${(-0.0).toFixed(1)});
        float minor = max(line(p.x * 0.5, 0.03), line(p.y * 0.5, 0.03));
        float major = max(line(p.x * 0.125, 0.012), line(p.y * 0.125, 0.012));
        float d = length(p - vec2(0.0, -6.0));
        float fade = smoothstep(46.0, 6.0, d);
        float pulse = 0.5 + 0.5 * sin(d * 0.6 - uTime * 2.0);
        float scan = uScan > 0.0 ? smoothstep(2.5, 0.0, abs(d - uScan * 40.0)) : 0.0;
        // The shared world draws the grid; this layer only adds the compile scan wave
        vec3 col = uHi * scan * (0.6 + major) + uColor * major * pulse * 0.25;
        float a = (scan * 0.7 + major * pulse * 0.15) * fade;
        gl_FragColor = vec4(col * 1.4, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -4.5
  g.add(floor)

  // Instanced towers
  const towerCount = tier === 'high' ? 90 : tier === 'mid' ? 48 : 30
  const towerGeo = new THREE.BoxGeometry(1, 1, 1)
  towerGeo.translate(0, 0.5, 0)
  const towerMat = new THREE.MeshStandardMaterial({ color: '#141a2a', metalness: 0.9, roughness: 0.25, emissive: new THREE.Color('#ff3a20'), emissiveIntensity: 0.06 })
  const towers = new THREE.InstancedMesh(towerGeo, towerMat, towerCount)
  const capMat = new THREE.MeshBasicMaterial({ color: BRAND.ember, transparent: true, opacity: 0.9 })
  const caps = new THREE.InstancedMesh(new THREE.BoxGeometry(1.02, 0.06, 1.02), capMat, towerCount)
  const tData = []
  const dummy = new THREE.Object3D()
  for (let i = 0; i < towerCount; i++) {
    let x, z
    do {
      x = (Math.random() - 0.5) * 60
      z = -Math.random() * 46 + 6
    } while (Math.abs(x) < 7 && z > -16)
    const w = 0.8 + Math.random() * 1.6
    const h = 2 + Math.pow(Math.random(), 2) * 14
    tData.push({ x, z, w, h, ph: Math.random() * 6.28 })
  }
  g.add(towers, caps)

  // Data streams: light trails arcing between towers
  const streams = []
  const streamCount = tier === 'high' ? 14 : 7
  for (let i = 0; i < streamCount; i++) {
    const a = tData[(i * 7) % towerCount]
    const b = tData[(i * 13 + 5) % towerCount]
    const p0 = new THREE.Vector3(a.x, -4.5 + a.h, a.z)
    const p2 = new THREE.Vector3(b.x, -4.5 + b.h, b.z)
    const mid = p0.clone().lerp(p2, 0.5)
    mid.y += 6 + Math.random() * 6
    const curve = new THREE.QuadraticBezierCurve3(p0, mid, p2)
    const tr = lightTrail(curve, i % 3 ? BRAND.ember : BRAND.peach, { width: 0.06, speed: 0.3 + Math.random() * 0.3, length: 0.3 })
    streams.push(tr)
    g.add(tr)
  }
  // Vertical data rain
  const rainCount = tier === 'high' ? 600 : 250
  const rainPos = new Float32Array(rainCount * 3)
  const rainSpeed = new Float32Array(rainCount)
  for (let i = 0; i < rainCount; i++) {
    rainPos.set([(Math.random() - 0.5) * 60, Math.random() * 24 - 4, -Math.random() * 46 + 6], i * 3)
    rainSpeed[i] = 2 + Math.random() * 5
  }
  const rainGeo = new THREE.BufferGeometry()
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3))
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: BRAND.peach, size: 0.09, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }))
  rain.frustumCulled = false
  g.add(rain)

  // Holographic code panels
  const panels = []
  const panelSpots = [
    [-8, 2.2, -2, 0.55],
    [8.5, 1.4, -4, -0.6],
    [-5.5, -1.2, 3, 0.35],
  ]
  panelSpots.forEach(([x, y, z, ry], i) => {
    const codeTex = codeTexture(i + 1)
    codeTex.anisotropy = ctx.maxAniso || 4
    const mat = new THREE.MeshBasicMaterial({ map: codeTex, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4), mat)
    m.position.set(x, y, z)
    m.rotation.y = ry
    m.userData = { base: new THREE.Vector3(x, y, z), ry, hover: 0, flip: 0, flipTarget: 0 }
    panels.push(m)
    g.add(m)
  })

  // The Core: nested glass + chrome polyhedra that unfold
  const core = new THREE.Group()
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 0), glass('#ffb38f', 0.2))
  const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.42, 0)), new THREE.LineBasicMaterial({ color: BRAND.ember, transparent: true, opacity: 0.8 }))
  const inner = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), chrome('#f2ece8', 0.1))
  const coreEnergyMat = energyMaterial(BRAND.vermilion, { intensity: 1.2 })
  const coreEnergy = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 3), coreEnergyMat)
  const coreGlow = glowSprite(BRAND.ember, 9, 0.35)
  core.add(shell, wire, inner, coreEnergy, coreGlow)
  // fragments that fly out when compiled
  const frags = []
  const fragGeo = new THREE.TetrahedronGeometry(0.5, 0)
  const fragMat = chrome('#e6dfdb', 0.18)
  for (let i = 0; i < 20; i++) {
    const f = new THREE.Mesh(fragGeo, fragMat)
    const dir = new THREE.Vector3().randomDirection()
    f.userData = { dir, rot: new THREE.Vector3(Math.random(), Math.random(), Math.random()) }
    f.position.copy(dir).multiplyScalar(1.8)
    f.visible = false
    frags.push(f)
    core.add(f)
  }
  core.position.set(0, 1.2, -6)
  g.add(core)

  const pBurst = burst(tier === 'high' ? 400 : 160, BRAND.ember)
  g.add(pBurst.object)

  const state = { coreHover: 0, open: 0, openTarget: 0, surge: 0, scan: -1 }

  const placeTowers = (t) => {
    tData.forEach((d, i) => {
      const h = d.h * (1 + state.surge * 0.45 * (0.5 + 0.5 * Math.sin(t * 3 + d.ph)) + Math.sin(t * 0.6 + d.ph) * 0.04)
      dummy.position.set(d.x, -4.5, d.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(d.w, h, d.w)
      dummy.updateMatrix()
      towers.setMatrixAt(i, dummy.matrix)
      dummy.position.y = -4.5 + h
      dummy.scale.set(d.w, 1, d.w)
      dummy.updateMatrix()
      caps.setMatrixAt(i, dummy.matrix)
    })
    towers.instanceMatrix.needsUpdate = true
    caps.instanceMatrix.needsUpdate = true
  }
  placeTowers(0)

  return {
    group: g,
    camera: { pos: new THREE.Vector3(0, 3.2, 18), look: new THREE.Vector3(0, 0.5, -6) },
    interactives: [
      {
        targets: [core],
        label: 'Compile',
        hover: (on) => (state.coreHover = on ? 1 : 0),
        click: () => {
          state.openTarget = state.openTarget ? 0 : 1
          state.surge = 1
          state.scan = 0.001
          pBurst.fire(core.position.clone(), 12)
          return state.openTarget === 1
        },
      },
      ...panels.map((p) => ({
        targets: [p],
        label: 'Deploy',
        hover: (on) => (p.userData.hover = on ? 1 : 0),
        click: () => {
          p.userData.flipTarget = p.userData.flipTarget ? 0 : 1
          state.surge = Math.max(state.surge, 0.6)
          return p.userData.flipTarget === 1
        },
      })),
    ],
    reset() {
      state.openTarget = 0
      panels.forEach((p) => (p.userData.flipTarget = 0))
    },
    update(t, dt, env) {
      floorMat.uniforms.uTime.value = t
      if (state.scan > 0) {
        state.scan += dt * 0.5
        if (state.scan > 1.2) state.scan = -1
      }
      floorMat.uniforms.uScan.value = state.scan
      state.surge = damp(state.surge, state.openTarget * 0.25, 1.4, dt)
      placeTowers(t)
      towerMat.emissiveIntensity = 0.05 + state.surge * 0.25
      capMat.opacity = 0.6 + 0.3 * Math.sin(t * 2) + state.surge * 0.3

      streams.forEach((s) => {
        s.material.uniforms.uTime.value = t
        s.material.uniforms.uBoost.value = state.surge
      })
      const sp = 1 + state.surge * 3
      for (let i = 0; i < rainCount; i++) {
        let y = rainPos[i * 3 + 1] - rainSpeed[i] * dt * sp
        if (y < -4.5) y = 20
        rainPos[i * 3 + 1] = y
      }
      rainGeo.attributes.position.needsUpdate = true

      // Core
      state.open = damp(state.open, state.openTarget, 2.5, dt)
      core.rotation.y += dt * (0.25 + state.coreHover * 0.6 + state.open * 0.4)
      core.rotation.x = damp(core.rotation.x, env.pointer.y * 0.4, 2, dt)
      core.position.y = 1.2 + Math.sin(t * 0.8) * 0.25
      const hs = 1 + state.coreHover * 0.08
      shell.scale.setScalar(hs * (1 + state.open * 0.6))
      wire.scale.setScalar(hs * (1 + state.open * 0.6))
      shell.material.opacity = 0.2 * (1 - state.open * 0.7)
      inner.rotation.x += dt * (0.6 + state.open * 2)
      inner.rotation.z += dt * 0.4
      coreEnergyMat.uniforms.uTime.value = t
      coreEnergyMat.uniforms.uIntensity.value = damp(coreEnergyMat.uniforms.uIntensity.value, 1 + state.coreHover * 1.5 + state.open * 2, 4, dt)
      coreGlow.material.opacity = 0.3 + state.coreHover * 0.25 + state.open * 0.35
      frags.forEach((f) => {
        f.visible = state.open > 0.02
        f.position.copy(f.userData.dir).multiplyScalar(1.8 + state.open * 4.5)
        f.rotation.set(f.userData.rot.x * t, f.userData.rot.y * t, f.userData.rot.z * t)
      })
      pBurst.update(dt)

      panels.forEach((p, i) => {
        const d = p.userData
        d.flip = damp(d.flip, d.flipTarget, 3, dt)
        p.rotation.y = d.ry + d.flip * Math.PI + env.pointer.x * 0.15
        p.position.y = d.base.y + Math.sin(t * 0.7 + i * 2) * 0.3 + d.hover * 0.3
        p.material.opacity = 0.55 + d.hover * 0.4 + Math.sin(t * 6 + i) * 0.04
        p.scale.setScalar(1 + d.hover * 0.08)
        p.material.map.offset.y = (t * 0.03 * (1 + d.flip * 4)) % 1
      })
    },
  }
}
