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
  // Towers: dark glass skyscrapers with lit window grids, glowing edges and a
  // band of light scanning up each one, so the city reads as alive at night
  // (the plain dark blocks looked flat and gloomy without the glow effect)
  const towerMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSurge: { value: 0 },
      uBody: { value: new THREE.Color('#121a2e') },
      uBase: { value: new THREE.Color('#3a1420') },
      uWin: { value: new THREE.Color('#ffc9a6') },
      uWinHot: { value: new THREE.Color('#ff6a3d') },
      uEdge: { value: new THREE.Color('#ff7a45') },
      uFog: { value: new THREE.Color('#0d1424') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vLocal; varying vec3 vScale; varying vec3 vNrm; varying vec3 vWorld; varying float vSeed;
      void main(){
        vScale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        vLocal = position;
        vNrm = normal;
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        vSeed = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uSurge;
      uniform vec3 uBody; uniform vec3 uBase; uniform vec3 uWin; uniform vec3 uWinHot; uniform vec3 uEdge; uniform vec3 uFog;
      varying vec3 vLocal; varying vec3 vScale; varying vec3 vNrm; varying vec3 vWorld; varying float vSeed;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      void main(){
        float h = vLocal.y;                       // 0 at the base, 1 at the roof
        float H = h * vScale.y;                   // height in world units
        bool roof = abs(vNrm.y) > 0.5;
        bool sideX = abs(vNrm.x) > 0.5;
        float across = sideX ? vLocal.z : vLocal.x; // -0.5..0.5 across the face
        float width = sideX ? vScale.z : vScale.x;
        vec3 col = mix(uBase, uBody, smoothstep(0.0, 0.35, h));
        if (!roof) {
          // Window grid in world units, so tall and short towers match
          vec2 uv = vec2((across + 0.5) * width, H);
          vec2 cell = uv / vec2(0.34, 0.5);
          vec2 id = floor(cell);
          vec2 f = fract(cell);
          float win = step(0.2, f.x) * step(f.x, 0.8) * step(0.28, f.y) * step(f.y, 0.78);
          float r = hash(id + vSeed * 91.0 + (sideX ? 17.0 : 0.0));
          float lit = step(0.52 - uSurge * 0.3, r) * (0.75 + 0.25 * sin(uTime * (0.4 + r * 1.6) + r * 40.0));
          vec3 wc = mix(uWin, uWinHot, step(0.86, r));
          col += wc * win * lit * (0.55 + 0.45 * h);
          // Vertical edges catch the light
          float edgeD = (0.5 - abs(across)) * width;
          col += uEdge * smoothstep(0.06, 0.0, edgeD) * (0.25 + 0.75 * h);
          // A band of light scanning up the tower
          float span = vScale.y + 3.0;
          float bandY = fract(uTime * (0.07 + vSeed * 0.06) + vSeed) * span - 1.5;
          col += uWinHot * smoothstep(0.9, 0.0, abs(H - bandY)) * (0.35 + uSurge * 0.6);
        }
        // Glowing roof edge
        float topD = (1.0 - h) * vScale.y;
        col += uEdge * smoothstep(0.08, 0.0, topD) * 1.4;
        if (roof) {
          float rim = smoothstep(0.08, 0.0, (0.5 - max(abs(vLocal.x), abs(vLocal.z))) * min(vScale.x, vScale.z));
          col = uBody * 1.3 + uEdge * rim * 1.4;
        }
        // Distance haze, so the far city recedes into the night
        float fogF = smoothstep(14.0, 62.0, length(vWorld - cameraPosition));
        col = mix(col, uFog, fogF * 0.7);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  })
  const towers = new THREE.InstancedMesh(towerGeo, towerMat, towerCount)
  const tData = []
  const dummy = new THREE.Object3D()
  for (let i = 0; i < towerCount; i++) {
    let x, z, h
    if (i % 4 === 3) {
      // A low district straight ahead, under the camera's flight path: a carpet
      // of lit windows that also fills tall phone screens
      x = (Math.random() - 0.5) * 18
      z = -18 - Math.random() * 24
      h = 1 + Math.random() * 3.5
    } else {
      do {
        x = (Math.random() - 0.5) * 60
        z = -Math.random() * 46 + 6
        // Keep the camera's flight path clear, so it glides between the towers
        // instead of through dark walls
      } while (Math.abs(x) < (z > -16 ? 7 : 9.5))
      h = 2 + Math.pow(Math.random(), 2) * 14
    }
    const w = 0.8 + Math.random() * 1.6
    tData.push({ x, z, w, h, ph: Math.random() * 6.28 })
  }
  g.add(towers)

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
    })
    towers.instanceMatrix.needsUpdate = true
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
      towerMat.uniforms.uTime.value = t
      towerMat.uniforms.uSurge.value = state.surge

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
