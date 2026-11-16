import * as THREE from 'three'
import { BRAND, glowTexture, energyMaterial, glowSprite, burst, damp } from '../shared.js'

/**
 * AI AUTOMATIONS: a living neural network. Layers of glowing nodes, synapse
 * lines with energy pulses flowing through them, and a point-cloud brain.
 * Interactive: the brain (Activate: an activation wave runs layer by layer
 * and the brain lights up) and every node layer (Train: that layer fires).
 */

export function createAI(ctx) {
  const { tier } = ctx
  const g = new THREE.Group()

  // Layered network
  const layerSizes = tier === 'high' ? [6, 10, 14, 10, 6] : [5, 8, 10, 8, 5]
  const layerX = (li) => (li - (layerSizes.length - 1) / 2) * 5.2
  const nodes = []
  layerSizes.forEach((n, li) => {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + li
      const r = 1.2 + n * 0.32
      nodes.push({ li, p: new THREE.Vector3(layerX(li), Math.sin(a) * r * 0.8, Math.cos(a) * r * 0.6 - 4) })
    }
  })
  // Nodes are points of light, not shaded balls, so the network reads as a network
  const nodeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.75, 0.55) })
  const nodeMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 16, 12), nodeMat, nodes.length)
  const nodeColor = new THREE.Color()
  const dummy = new THREE.Object3D()
  nodes.forEach((n, i) => {
    dummy.position.copy(n.p)
    dummy.updateMatrix()
    nodeMesh.setMatrixAt(i, dummy.matrix)
    nodeMesh.setColorAt(i, nodeColor.set('#ffffff'))
  })
  g.add(nodeMesh)
  // Halo sprites per node (Points)
  const haloPos = new Float32Array(nodes.length * 3)
  nodes.forEach((n, i) => haloPos.set([n.p.x, n.p.y, n.p.z], i * 3))
  const haloGeo = new THREE.BufferGeometry()
  haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPos, 3))
  const haloAct = new Float32Array(nodes.length)
  haloGeo.setAttribute('aAct', new THREE.BufferAttribute(haloAct, 1))
  const haloMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: glowTexture() }, uPR: { value: ctx.pixelRatio || 1 }, uA: { value: BRAND.vermilion.clone() }, uB: { value: BRAND.peach.clone() } },
    vertexShader: /* glsl */ `attribute float aAct; uniform float uPR; varying float vAct;
      void main(){ vAct = aAct; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = (90.0 + aAct * 160.0) * uPR / -mv.z; }`,
    fragmentShader: /* glsl */ `uniform sampler2D uMap; uniform vec3 uA; uniform vec3 uB; varying float vAct;
      void main(){ float a = texture2D(uMap, gl_PointCoord).a; gl_FragColor = vec4(mix(uA, uB, vAct) * 1.5, a * (0.35 + vAct * 0.65)); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const halos = new THREE.Points(haloGeo, haloMat)
  halos.frustumCulled = false
  g.add(halos)

  // Synapses between consecutive layers (sparse) + travelling pulses
  const edges = []
  const byLayer = layerSizes.map((_, li) => nodes.map((n, i) => (n.li === li ? i : -1)).filter((i) => i >= 0))
  for (let li = 0; li < layerSizes.length - 1; li++) {
    byLayer[li].forEach((a) => {
      byLayer[li + 1].forEach((b) => {
        if (Math.random() < (tier === 'high' ? 0.45 : 0.3)) edges.push([a, b])
      })
    })
  }
  const linePos = new Float32Array(edges.length * 6)
  const lineU = new Float32Array(edges.length * 2)
  const lineLayer = new Float32Array(edges.length * 2)
  const linePh = new Float32Array(edges.length * 2)
  edges.forEach(([a, b], i) => {
    const pa = nodes[a].p
    const pb = nodes[b].p
    linePos.set([pa.x, pa.y, pa.z, pb.x, pb.y, pb.z], i * 6)
    lineU.set([0, 1], i * 2)
    lineLayer.set([nodes[a].li, nodes[a].li], i * 2)
    const ph = Math.random()
    linePh.set([ph, ph], i * 2)
  })
  const lineGeo = new THREE.BufferGeometry()
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3))
  lineGeo.setAttribute('aU', new THREE.BufferAttribute(lineU, 1))
  lineGeo.setAttribute('aL', new THREE.BufferAttribute(lineLayer, 1))
  lineGeo.setAttribute('aPh', new THREE.BufferAttribute(linePh, 1))
  const lineMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uWave: { value: -10 }, uA: { value: BRAND.vermilion.clone() }, uB: { value: BRAND.peach.clone() }, uBoost: { value: 0 } },
    vertexShader: /* glsl */ `attribute float aU; attribute float aL; attribute float aPh; varying float vU; varying float vL; varying float vPh;
      void main(){ vU = aU; vL = aL; vPh = aPh; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `uniform float uTime; uniform float uWave; uniform vec3 uA; uniform vec3 uB; uniform float uBoost; varying float vU; varying float vL; varying float vPh;
      void main(){
        float head = fract(uTime * 0.45 + vPh);
        float pulse = smoothstep(0.12, 0.0, abs(vU - head));
        float wave = smoothstep(0.9, 0.0, abs((vL + vU) - uWave));
        float a = 0.3 + pulse * 0.75 + wave * 0.9 + uBoost * 0.15;
        gl_FragColor = vec4(mix(uA, uB, pulse + wave) * (1.2 + wave * 2.0), a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const synapses = new THREE.LineSegments(lineGeo, lineMat)
  g.add(synapses)

  // Invisible hit volumes per layer (for hover/click on a layer)
  const layerHits = layerSizes.map((n, li) => {
    const r = 1.2 + n * 0.32
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.8, 16), new THREE.MeshBasicMaterial({ visible: false }))
    m.rotation.z = Math.PI / 2
    m.scale.set(1, 1, 0.8)
    m.position.set(layerX(li), 0, -4)
    m.userData = { li, hover: 0 }
    g.add(m)
    return m
  })

  // Point-cloud brain (two hemispheres) above the network
  const brainCount = tier === 'high' ? 3800 : tier === 'mid' ? 1800 : 900
  const bPos = new Float32Array(brainCount * 3)
  const bSeed = new Float32Array(brainCount)
  for (let i = 0; i < brainCount; i++) {
    const side = i % 2 ? 1 : -1
    const v = new THREE.Vector3().randomDirection()
    // squash into a hemisphere lobe with gyri-like noise
    const wob = 1 + 0.12 * Math.sin(v.x * 9) * Math.sin(v.y * 11) * Math.sin(v.z * 7)
    v.multiply(new THREE.Vector3(1.5, 1.3, 2.1)).multiplyScalar(wob * (0.85 + Math.random() * 0.15))
    v.x = Math.abs(v.x) * side + side * 0.15
    bPos.set([v.x, v.y, v.z], i * 3)
    bSeed[i] = Math.random()
  }
  const brainGeo = new THREE.BufferGeometry()
  brainGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3))
  brainGeo.setAttribute('aSeed', new THREE.BufferAttribute(bSeed, 1))
  const brainMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAct: { value: 0 }, uHover: { value: 0 }, uMap: { value: glowTexture() }, uPR: { value: ctx.pixelRatio || 1 }, uA: { value: BRAND.vermilion.clone() }, uB: { value: BRAND.peach.clone() } },
    vertexShader: /* glsl */ `uniform float uTime; uniform float uAct; uniform float uHover; uniform float uPR; attribute float aSeed; varying float vGlow;
      void main(){
        vec3 p = position;
        float wave = sin(p.z * 2.0 - uTime * 3.0 + aSeed * 6.0);
        p *= 1.0 + uAct * 0.08 * wave + uHover * 0.04;
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        gl_Position = projectionMatrix * mv;
        vGlow = 0.35 + 0.65 * smoothstep(0.6, 1.0, wave * 0.5 + 0.5) * (0.4 + uAct) + uHover * 0.3;
        gl_PointSize = (2.0 + aSeed * 3.0) * uPR * (22.0 / -mv.z) * (1.0 + uAct * 0.6);
      }`,
    fragmentShader: /* glsl */ `uniform sampler2D uMap; uniform vec3 uA; uniform vec3 uB; varying float vGlow;
      void main(){ float a = texture2D(uMap, gl_PointCoord).a; gl_FragColor = vec4(mix(uA, uB, vGlow) * (1.0 + vGlow), a * vGlow); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const brain = new THREE.Points(brainGeo, brainMat)
  brain.frustumCulled = false
  const brainGroup = new THREE.Group()
  brainGroup.add(brain)
  const brainHit = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 12), new THREE.MeshBasicMaterial({ visible: false }))
  brainHit.scale.set(1.3, 1.1, 1.4)
  brainGroup.add(brainHit)
  const brainCoreMat = energyMaterial(BRAND.ember, { intensity: 0.6 })
  const brainCore = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 24), brainCoreMat)
  brainGroup.add(brainCore, glowSprite(BRAND.vermilion, 10, 0.25))
  brainGroup.position.set(0, 6.4, -6)
  g.add(brainGroup)

  // Energy flowing from brain down into the network: a vertical spiral of points
  const flowCount = tier === 'high' ? 400 : 160
  const fPos = new Float32Array(flowCount * 3)
  const fData = Array.from({ length: flowCount }, () => ({ a: Math.random() * 6.28, y: Math.random(), s: 0.15 + Math.random() * 0.3 }))
  const flowGeo = new THREE.BufferGeometry()
  flowGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3))
  const flow = new THREE.Points(flowGeo, new THREE.PointsMaterial({ map: glowTexture(), color: BRAND.peach, size: 0.35, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }))
  flow.frustumCulled = false
  g.add(flow)

  const pBurst = burst(tier === 'high' ? 450 : 180, BRAND.peach)
  g.add(pBurst.object)

  const state = { brainHover: 0, act: 0, actTarget: 0, wave: -10, waving: false, layerFire: new Array(layerSizes.length).fill(0) }

  return {
    group: g,
    camera: { pos: new THREE.Vector3(0, 2, 20), look: new THREE.Vector3(0, 1.4, -5) },
    interactives: [
      {
        targets: [brainHit],
        label: 'Activate',
        hover: (on) => (state.brainHover = on ? 1 : 0),
        click: () => {
          state.actTarget = state.actTarget ? 0 : 1
          state.wave = -1
          state.waving = true
          pBurst.fire(brainGroup.position.clone(), 11)
          return state.actTarget === 1
        },
      },
      ...layerHits.map((h) => ({
        targets: [h],
        label: 'Train',
        hover: (on) => (h.userData.hover = on ? 1 : 0),
        click: () => {
          state.layerFire[h.userData.li] = 1.6
          return false
        },
      })),
    ],
    reset() {
      state.actTarget = 0
    },
    update(t, dt, env) {
      lineMat.uniforms.uTime.value = t
      if (state.waving) {
        state.wave += dt * 3.2
        if (state.wave > layerSizes.length + 1) {
          state.waving = false
          state.wave = -10
        }
      } else if (state.actTarget && Math.random() < dt * 0.5) {
        // while active, waves keep rolling
        state.wave = -1
        state.waving = true
      }
      lineMat.uniforms.uWave.value = state.wave
      state.act = damp(state.act, state.actTarget, 2, dt)
      lineMat.uniforms.uBoost.value = state.act

      // Node activation: wave + per-layer fire + idle shimmer + hover
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        const w = state.waving ? Math.max(0, 1 - Math.abs(n.li - state.wave)) : 0
        const lf = state.layerFire[n.li]
        const hov = layerHits[n.li].userData.hover
        const shimmer = 0.15 + 0.15 * Math.sin(t * 2 + i * 1.7)
        haloAct[i] = damp(haloAct[i], Math.min(1, w + lf * 0.7 + hov * 0.6 + shimmer + state.act * 0.25), 8, dt)
        dummy.position.copy(n.p)
        dummy.position.y += Math.sin(t * 0.8 + i) * 0.08
        dummy.scale.setScalar(1 + haloAct[i] * 0.45)
        dummy.updateMatrix()
        nodeMesh.setMatrixAt(i, dummy.matrix)
      }
      nodeMesh.instanceMatrix.needsUpdate = true
      haloGeo.attributes.aAct.needsUpdate = true
      for (let li = 0; li < state.layerFire.length; li++) state.layerFire[li] = damp(state.layerFire[li], 0, 2.2, dt)

      // Brain
      brainMat.uniforms.uTime.value = t
      brainMat.uniforms.uAct.value = state.act
      brainMat.uniforms.uHover.value = damp(brainMat.uniforms.uHover.value, state.brainHover, 5, dt)
      brainCoreMat.uniforms.uTime.value = t
      brainCoreMat.uniforms.uIntensity.value = 0.5 + state.brainHover * 0.8 + state.act * 1.6
      brainGroup.rotation.y = t * 0.15 + env.pointer.x * 0.4
      brainGroup.rotation.x = damp(brainGroup.rotation.x, -env.pointer.y * 0.25, 2, dt)
      g.rotation.y = damp(g.rotation.y, env.pointer.x * 0.12, 1.5, dt)

      // Energy flow spiral
      const fs = 1 + state.act * 2.5
      fData.forEach((d, i) => {
        d.y -= dt * d.s * fs
        if (d.y < 0) d.y += 1
        d.a += dt * 1.2
        const r = 0.6 + (1 - d.y) * 3.5
        fPos.set([Math.cos(d.a) * r, -2 + d.y * 8.4, Math.sin(d.a) * r - 5], i * 3)
      })
      flowGeo.attributes.position.needsUpdate = true
      pBurst.update(dt)
    },
  }
}
