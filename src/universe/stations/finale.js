import * as THREE from 'three'
import { BRAND, glowTexture, energyMaterial, glowSprite, streakSprite, burst, damp, noiseTexture } from '../shared.js'
import { noiseGLSL } from '../../three/gradientShader.js'

/**
 * FINAL CTA: a vermilion star. A boiling plasma core, a corona, god rays,
 * energy rings and particles streaming inward.
 * Interactive: the star (Ignite: supernova flash, rings blast outward and the
 * core flips to white-gold) and the rings (Spin).
 */
export function createFinale(ctx) {
  const { tier } = ctx
  const g = new THREE.Group()

  // Plasma core
  const coreMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uA: { value: BRAND.vermilion.clone() }, uB: { value: BRAND.gold.clone() }, uHot: { value: 0 } },
    vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vP; varying vec3 vV;
      void main(){ vN = normalize(normalMatrix * normal); vP = position; vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform float uHot; varying vec3 vN; varying vec3 vP; varying vec3 vV;
      ${noiseGLSL}
      void main(){
        float n = snoise(vP * 0.9 + vec3(0.0, uTime * 0.35, 0.0));
        float n2 = snoise(vP * 2.4 - vec3(uTime * 0.5));
        float cells = smoothstep(-0.2, 0.8, n * 0.65 + n2 * 0.35);
        float rim = pow(max(1.0 - max(dot(vN, vV), 0.0), 0.0), 2.0);
        vec3 hot = mix(uB, vec3(1.0, 0.97, 0.9), uHot);
        vec3 col = mix(uA * 0.9, hot, cells) * (1.6 + uHot) + uB * rim * 1.5;
        // Soft highlight roll-off keeps the plasma orange instead of clipping to yellow
        col = 1.0 - exp(-col * 1.15);
        gl_FragColor = vec4(col * 1.25, 1.0);
      }`,
  })
  const core = new THREE.Mesh(new THREE.SphereGeometry(3, 64, 48), coreMat)
  core.position.set(0, 0.5, -8)
  g.add(core)

  // Corona (fresnel energy shell)
  const coronaMat = energyMaterial(BRAND.ember, { intensity: 1.4, flow: 1.6 })
  const corona = new THREE.Mesh(new THREE.SphereGeometry(3.7, 48, 32), coronaMat)
  corona.position.copy(core.position)
  g.add(corona)
  const halo = glowSprite(BRAND.vermilion, 26, 0.55)
  halo.position.copy(core.position)
  const halo2 = glowSprite(BRAND.gold, 12, 0.5)
  halo2.position.copy(core.position)
  const streak = streakSprite(new THREE.Color('#ffd0b8'), 60, 0.6, 0.55)
  streak.position.copy(core.position).add(new THREE.Vector3(0, 0, 3.8))
  g.add(halo, halo2, streak)

  // God rays: a fan of radial planes with a stripe shader, facing the camera
  const raysMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: BRAND.ember.clone() }, uBoost: { value: 0 }, uNoise: { value: noiseTexture() } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `uniform float uTime; uniform vec3 uColor; uniform float uBoost; uniform sampler2D uNoise; varying vec2 vUv;
      void main(){
        vec2 p = vUv - 0.5; float r = length(p); float a = atan(p.y, p.x);
        float rays = smoothstep(0.28, 0.78, texture2D(uNoise, vec2(a * 0.477, uTime * 0.01)).r);
        rays = pow(max(rays, 0.0), 3.0) * 1.6 + 0.08;
        float fall = smoothstep(0.5, 0.08, r) * smoothstep(0.04, 0.12, r);
        float a2 = rays * fall * (0.55 + uBoost);
        gl_FragColor = vec4(uColor * (1.2 + uBoost), a2);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const rays = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), raysMat)
  rays.position.copy(core.position).add(new THREE.Vector3(0, 0, -0.5))
  g.add(rays)

  // Energy rings
  const rings = []
  const ringGroup = new THREE.Group()
  ringGroup.position.copy(core.position)
  for (let i = 0; i < 3; i++) {
    const m = energyMaterial(i === 1 ? BRAND.peach : BRAND.vermilion, { intensity: 1.6, flow: 2 })
    const r = new THREE.Mesh(new THREE.TorusGeometry(5.2 + i * 1.5, 0.05 + i * 0.015, 12, 160), m)
    r.rotation.set(Math.PI / 2 + (i - 1) * 0.35, (i - 1) * 0.4, 0)
    r.userData = { base: r.rotation.clone(), sp: 0.15 + i * 0.08 }
    rings.push(r)
    ringGroup.add(r)
  }
  g.add(ringGroup)
  const ringHit = new THREE.Mesh(new THREE.TorusGeometry(6.6, 1.4, 8, 32), new THREE.MeshBasicMaterial({ visible: false }))
  ringHit.position.copy(core.position)
  ringHit.rotation.x = Math.PI / 2
  g.add(ringHit)
  const coreHit = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 12), new THREE.MeshBasicMaterial({ visible: false }))
  coreHit.position.copy(core.position)
  g.add(coreHit)

  // Inflow particles
  const inCount = tier === 'high' ? 1400 : tier === 'mid' ? 600 : 300
  const iPos = new Float32Array(inCount * 3)
  const iData = Array.from({ length: inCount }, () => ({ dir: new THREE.Vector3().randomDirection(), d: 4 + Math.random() * 22, s: 2 + Math.random() * 4, sw: Math.random() * 6.28 }))
  const inGeo = new THREE.BufferGeometry()
  inGeo.setAttribute('position', new THREE.BufferAttribute(iPos, 3))
  const inMat = new THREE.PointsMaterial({ map: glowTexture(), color: BRAND.peach, size: 0.28, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
  const inflow = new THREE.Points(inGeo, inMat)
  inflow.frustumCulled = false
  g.add(inflow)

  // Supernova shockwave
  const novaMat = new THREE.MeshBasicMaterial({ color: BRAND.gold, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  const nova = new THREE.Mesh(new THREE.RingGeometry(3.6, 4.1, 128), novaMat)
  nova.position.copy(core.position).add(new THREE.Vector3(0, 0, 0.5))
  g.add(nova)
  const pBurst = burst(tier === 'high' ? 900 : 320, BRAND.gold)
  g.add(pBurst.object)

  const state = { hover: 0, ringHover: 0, hot: 0, hotTarget: 0, nova: 0, spin: 0 }

  return {
    group: g,
    camera: { pos: new THREE.Vector3(0, 2.6, 17), look: new THREE.Vector3(0, 4.6, -8) },
    interactives: [
      {
        targets: [coreHit],
        label: 'Ignite',
        hover: (on) => (state.hover = on ? 1 : 0),
        click: () => {
          state.hotTarget = state.hotTarget ? 0 : 1
          state.nova = 1
          pBurst.fire(core.position.clone(), 18)
          return state.hotTarget === 1
        },
      },
      {
        targets: [ringHit],
        label: 'Spin',
        hover: (on) => (state.ringHover = on ? 1 : 0),
        click: () => {
          state.spin = 5
          return false
        },
      },
    ],
    reset() {
      state.hotTarget = 0
    },
    update(t, dt, env) {
      state.hot = damp(state.hot, state.hotTarget, 2, dt)
      coreMat.uniforms.uTime.value = t
      coreMat.uniforms.uHot.value = state.hot
      coronaMat.uniforms.uTime.value = t
      coronaMat.uniforms.uIntensity.value = damp(coronaMat.uniforms.uIntensity.value, 1.2 + state.hover * 1.2 + state.hot * 0.8 + state.nova * 2, 5, dt)
      const pulse = 1 + Math.sin(t * 1.4) * 0.02 + state.hover * 0.05
      core.scale.setScalar(pulse)
      corona.scale.setScalar(pulse * (1 + state.nova * 0.25))
      halo.material.opacity = 0.45 + state.hover * 0.2 + state.nova * 0.5
      halo.scale.setScalar(26 * (1 + state.nova * 0.6 + state.hot * 0.2))
      halo2.material.opacity = 0.4 + state.hot * 0.3
      streak.material.opacity = 0.45 + state.hover * 0.2 + state.nova * 0.5
      raysMat.uniforms.uTime.value = t
      raysMat.uniforms.uBoost.value = state.hover * 0.3 + state.hot * 0.4 + state.nova
      rays.rotation.z = t * 0.03

      if (state.nova > 0) {
        state.nova = Math.max(0, state.nova - dt * 0.8)
        const k = 1 - state.nova
        nova.scale.setScalar(1 + k * 6)
        novaMat.opacity = state.nova
      }
      state.spin = damp(state.spin, 0, 1, dt)
      rings.forEach((r, i) => {
        r.rotation.z += dt * (r.userData.sp + state.spin * (0.4 + i * 0.2) + state.ringHover * 0.4)
        r.scale.setScalar(1 + state.nova * (0.6 + i * 0.3) + state.ringHover * 0.04)
        r.material.uniforms.uTime.value = t
        r.material.uniforms.uIntensity.value = 1.4 + state.ringHover * 1.4 + state.nova * 2
      })
      ringGroup.rotation.x = damp(ringGroup.rotation.x, env.pointer.y * 0.3, 2, dt)
      ringGroup.rotation.y = damp(ringGroup.rotation.y, env.pointer.x * 0.4, 2, dt)

      const pull = 1 + state.hover * 0.8 + state.hot * 1.2
      const c = core.position
      iData.forEach((d, i) => {
        d.d -= dt * d.s * pull
        if (d.d < 3.2) d.d = 18 + Math.random() * 8
        d.sw += dt * 0.6
        iPos[i * 3] = c.x + d.dir.x * d.d + Math.cos(d.sw) * 0.4
        iPos[i * 3 + 1] = c.y + d.dir.y * d.d * 0.75
        iPos[i * 3 + 2] = c.z + d.dir.z * d.d + Math.sin(d.sw) * 0.4
      })
      inGeo.attributes.position.needsUpdate = true
      inMat.color.lerpColors(BRAND.peach, BRAND.gold, state.hot)
      pBurst.update(dt)
    },
  }
}
