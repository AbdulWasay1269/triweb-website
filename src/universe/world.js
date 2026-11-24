import * as THREE from 'three'
import { BRAND, lightShaft, glowTexture, noiseTexture } from './shared.js'
import { bakeHeights } from './terrain.js'

/**
 * The continuous world every scene sits in, so the site reads as one film:
 *
 * - One landscape runs under the whole camera path. At the start it is the
 *   same navy mountain range as the hero; as the journey goes on, glowing
 *   contour lines trace it, the slopes step into terraces and it turns into a
 *   digital grid: nature becoming technology.
 * - One sun on the horizon (the hero's vermilion sun) and one sky glow travel
 *   with the camera, so lighting, colour and depth never change character.
 * - The ground answers the cursor with a soft pool of ember light.
 */
export function createWorld(ctx) {
  const { tier, length } = ctx
  const g = new THREE.Group()
  const BASE_Y = -5

  /* ---------------- Sky: horizon glow behind everything ---------------- */
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { uHorizon: { value: 0.0 }, uWarm: { value: BRAND.vermilion.clone() }, uPeach: { value: BRAND.peach.clone() }, uTop: { value: new THREE.Color('#0b1220') }, uMood: { value: 0 }, uGlow: { value: 0 }, uSunU: { value: 0.5 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uHorizon; uniform vec3 uWarm; uniform vec3 uPeach; uniform vec3 uTop; uniform float uMood; uniform float uGlow; uniform float uSunU; varying vec2 vUv;
      void main(){
        float y = vUv.y - 0.5 - uHorizon;
        float band = exp(-abs(y) * 34.0);
        float wide = exp(-max(y, 0.0) * 9.0) * smoothstep(-0.06, 0.0, y);
        float side = 1.0 - smoothstep(0.0, 0.55, abs(vUv.x - 0.5));
        vec3 col = uTop + uWarm * wide * (0.07 + uGlow * 0.08) * side + mix(uWarm, uPeach, 0.3 + uMood * 0.25 + uGlow * 0.15) * band * (0.38 + uGlow * 0.3) * side;
        // Golden hour (hero): a warm sunset bloom around the sun, a lifted sky
        vec2 sd = vec2((vUv.x - uSunU) * 2.9, y);
        float core = exp(-length(sd * vec2(1.0, 1.6)) * 9.0);
        float halo = exp(-length(sd * vec2(0.55, 3.4)) * 4.2);
        float above = smoothstep(-0.05, 0.02, y) * (1.0 - smoothstep(0.08, 0.32, y));
        vec3 gold = mix(uPeach, vec3(1.0, 0.78, 0.55), 0.35);
        col += (gold * core * 0.9 + uWarm * halo * 0.42) * uGlow * above;
        // keep the upper sky navy, with only a faint lift so it isn't flat black
        col += vec3(0.03, 0.045, 0.1) * uGlow * smoothstep(0.05, 0.45, y);
        gl_FragColor = vec4(col, 1.0);
      }`,
    depthWrite: false,
    depthTest: false,
  })
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2600, 900), skyMat)
  sky.renderOrder = -10
  sky.frustumCulled = false
  g.add(sky)

  /* ---------------- Sun: the hero's sun, always on the horizon ---------------- */
  const sunMat = new THREE.ShaderMaterial({
    uniforms: { uA: { value: BRAND.vermilion.clone() }, uB: { value: new THREE.Color('#ffd2bd') }, uPulse: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uA; uniform vec3 uB; uniform float uPulse; varying vec2 vUv;
      void main(){
        vec2 p = vUv - 0.5;
        float r = length(p);
        float disc = smoothstep(0.16, 0.15, r);
        float glow = exp(-r * 9.0) * 0.55 + exp(-r * 20.0) * 0.8;
        float streak = exp(-abs(p.y) * 160.0) * exp(-abs(p.x) * 2.8) * 0.8;
        vec3 col = mix(uA, uB, smoothstep(0.16, 0.0, r) * 0.7) * (disc * 1.3 + glow * (0.8 + uPulse)) + uB * streak;
        gl_FragColor = vec4(col, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), sunMat)
  sun.renderOrder = -9
  sun.frustumCulled = false
  g.add(sun)

  /* ---------------- Terrain: mountains → contours → terraces → grid ---------------- */
  const W = 460
  const L = length + 700
  const seg = tier === 'high' ? [200, 560] : tier === 'mid' ? [130, 360] : [70, 180]
  const geo = new THREE.PlaneGeometry(W, L, seg[0], seg[1])
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, 0, -L / 2 + 320)
  // The landscape's shape is computed in a background worker (see terrain.worker.js)
  const terrainReady = bakeTerrain(geo, 340)
  const terrainMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSpan: { value: 340 },
      uCam: { value: new THREE.Vector3() },
      uPointer: { value: new THREE.Vector3(0, 0, -9999) },
      uPointerOn: { value: 0 },
      uFog: { value: new THREE.Color('#0b1220') },
      uSun: { value: BRAND.vermilion.clone() },
      uEmber: { value: BRAND.ember.clone() },
      uPeach: { value: BRAND.peach.clone() },
      uGlow: { value: 0 },
    },
    // The terrain's shape never changes, so it is worked out once on the CPU
    // (bakeTerrain below, the same formula the GPU used to run per vertex per frame)
    vertexShader: /* glsl */ `
      uniform float uSpan;
      attribute float aH;
      varying vec3 vW; varying vec3 vN; varying float vH; varying float vD;
      float digital(float z){ return smoothstep(-uSpan * 0.15, -uSpan * 1.25, z); }
      void main(){
        vec3 p = (modelMatrix * vec4(position, 1.0)).xyz;
        vN = normal; vW = p; vH = aH; vD = digital(p.z);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uCam; uniform vec3 uPointer; uniform float uPointerOn; uniform vec3 uFog; uniform vec3 uSun; uniform vec3 uEmber; uniform vec3 uPeach; uniform float uGlow;
      varying vec3 vW; varying vec3 vN; varying float vH; varying float vD;
      // Antialiased line that fades out once it gets thinner than a pixel,
      // instead of smearing into a wash in the distance
      float lineAA(float v, float w){
        float fw = fwidth(v);
        float f = abs(fract(v) - 0.5);
        float l = 1.0 - smoothstep(w, w + fw * 1.5, 0.5 - f);
        return l * (1.0 - smoothstep(0.08, 0.35, fw));
      }
      void main(){
        vec3 V = normalize(uCam - vW);
        float dist = length(uCam - vW);
        // Layered navy like the hero's ridges: higher = a touch lighter
        vec3 base = mix(vec3(0.035, 0.055, 0.105), vec3(0.09, 0.12, 0.2), clamp(vH / 30.0, 0.0, 1.0));
        // Sun on the horizon ahead: rim light on slopes facing it, a warm wash on ridge tops
        vec3 L = normalize(vec3(0.0, 0.32, -1.0));
        float facing = max(dot(vN, L), 0.0);
        float slope = smoothstep(0.04, 0.45, 1.0 - vN.y);
        float rim = pow(max(1.0 - max(dot(vN, V), 0.0), 0.0), 3.0) * (0.35 + facing) * slope;
        vec3 col = base * (0.55 + 0.45 * max(vN.y, 0.0)) * (1.0 + uGlow * 0.5) + uSun * rim * (0.55 + uGlow * 0.6) + uEmber * facing * slope * (0.1 + uGlow * 0.25);
        // Glowing contour lines trace the mountains, then the grid takes over
        float contour = lineAA(vH / 2.2, 0.02) * smoothstep(0.08, 0.45, vD) * (1.0 - smoothstep(0.75, 1.0, vD)) * step(0.3, vH);
        float grid = max(lineAA(vW.x / 4.0, 0.015), lineAA(vW.z / 4.0, 0.015)) * smoothstep(0.55, 1.0, vD);
        float major = max(lineAA(vW.x / 20.0, 0.008), lineAA(vW.z / 20.0, 0.008)) * smoothstep(0.4, 1.0, vD);
        // A slow pulse of light travels down the path, like data flowing home
        float pulse = smoothstep(6.0, 0.0, abs(mod(vW.z + uTime * 18.0, 140.0) - 70.0));
        vec3 lines = uEmber * contour * 0.9 + uSun * grid * (0.45 + pulse * 1.2) + uPeach * major * 0.5;
        col += lines * (1.0 - smoothstep(60.0, 240.0, dist));
        // Cursor light pool on the ground
        float pd = length(vW.xz - uPointer.xz);
        col += uEmber * uPointerOn * exp(-pd * 0.11) * (0.28 + grid * 1.6 + contour);
        // Atmospheric depth: fade into the same navy, warmer toward the sun
        float fog = 1.0 - exp(-dist * 0.0062);
        vec3 fogCol = mix(uFog, uFog + uSun * (0.05 + uGlow * 0.14), smoothstep(0.6, 1.0, -V.z));
        col = mix(col, fogCol, clamp(fog, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
  const terrain = new THREE.Mesh(geo, terrainMat)
  terrain.position.y = BASE_Y
  terrain.frustumCulled = false
  terrain.visible = false
  terrainReady.then(() => (terrain.visible = true))
  g.add(terrain)


  // ── Page moods: premiere searchlights, cinematic bokeh, aurora curtains ──
  // Each has an amount that the engine sets per page; at 0 it is hidden and costs nothing.
  const fxRoot = new THREE.Group()
  g.add(fxRoot)

  // Searchlights: six beams rising from behind the horizon, sweeping slowly
  const searchRig = new THREE.Group()
  searchRig.visible = false
  fxRoot.add(searchRig)
  const beamCols = [BRAND.gold, BRAND.peach, BRAND.ember, BRAND.gold, BRAND.peach, BRAND.ember]
  const beams = [-96, -58, -20, 20, 58, 96].map((x, i) => {
    const pivot = new THREE.Group()
    pivot.position.set(x, BASE_Y + 1, -150 - (i % 2) * 26)
    const shaft = lightShaft(new THREE.Color(beamCols[i]), { radius: 11, height: 190, opacity: 0 })
    shaft.rotation.x = Math.PI
    shaft.frustumCulled = false
    pivot.add(shaft)
    const foot = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: beamCols[i], transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
    foot.scale.set(26, 12, 1)
    pivot.add(foot)
    searchRig.add(pivot)
    return { pivot, shaft, foot, phase: i * 1.7, speed: 0.16 + (i % 3) * 0.05, lean: (x / 96) * 0.22 }
  })

  // Aurora: two vast curtains of light low in the sky, in brand colours
  const auroraRig = new THREE.Group()
  auroraRig.visible = false
  fxRoot.add(auroraRig)
  const auroraMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAmount: { value: 0 }, uNoise: { value: noiseTexture() }, uA: { value: new THREE.Color(BRAND.vermilion) }, uB: { value: new THREE.Color(BRAND.peach) }, uC: { value: new THREE.Color(BRAND.gold) }, uSeed: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `uniform float uTime; uniform float uAmount; uniform sampler2D uNoise; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform float uSeed; varying vec2 vUv;
      void main(){
        float t = uTime * 0.018;
        // The curtain's lower edge waves across the sky
        float fold = texture2D(uNoise, vec2(vUv.x * 0.9 + t + uSeed, 0.3)).r;
        float fold2 = texture2D(uNoise, vec2(vUv.x * 2.3 - t * 1.6 + uSeed, 0.7)).g;
        float edge = 0.18 + fold * 0.32 + fold2 * 0.12;
        float h = vUv.y - edge;
        if (h < -0.04) discard;
        // Vertical rays, drifting sideways
        float rays = texture2D(uNoise, vec2(vUv.x * 7.0 + fold * 1.4 - t * 3.0, 0.15 + t * 0.4)).r;
        rays = pow(max(rays, 0.0), 1.6) * 1.6 + 0.25;
        float base = smoothstep(-0.04, 0.02, h) * exp(-max(h, 0.0) * 3.4);
        float glowLine = exp(-abs(h) * 46.0) * 0.6;
        float sides = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
        float topFade = 1.0 - smoothstep(0.55, 0.95, vUv.y);
        vec3 col = mix(uC, uB, smoothstep(0.0, 0.08, h));
        col = mix(col, uA, smoothstep(0.08, 0.32, h));
        float a = (base * rays + glowLine) * sides * topFade * uAmount;
        gl_FragColor = vec4(col * a * 0.8, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
  const curtains = [
    { x: -60, y: 8, z: -380, w: 620, h: 230, seed: 0.0, ry: 0.12 },
    { x: 120, y: 26, z: -420, w: 560, h: 210, seed: 0.37, ry: -0.18 },
  ].map((c) => {
    const m = auroraMat.clone()
    m.uniforms.uNoise.value = noiseTexture()
    m.uniforms.uSeed.value = c.seed
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(c.w, c.h, 1, 1), m)
    mesh.position.set(c.x, c.y + c.h / 2, c.z)
    mesh.rotation.y = c.ry
    mesh.frustumCulled = false
    auroraRig.add(mesh)
    return mesh
  })

  // Bokeh: soft out-of-focus orbs that live in front of the camera
  const BOKEH = ctx.tier === 'low' ? 28 : ctx.tier === 'mid' ? 48 : 70
  const bPos = new Float32Array(BOKEH * 3)
  const bSize = new Float32Array(BOKEH)
  const bCol = new Float32Array(BOKEH * 3)
  const bSeed = new Float32Array(BOKEH)
  const palette = [BRAND.gold, BRAND.peach, BRAND.ember, BRAND.vermilion, '#ffe2b8'].map((c) => new THREE.Color(c))
  let rs = 7
  const rnd = () => ((rs = (rs * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < BOKEH; i++) {
    const z = -8 - rnd() * 46
    bPos[i * 3] = (rnd() * 2 - 1) * -z * 0.95
    bPos[i * 3 + 1] = (rnd() * 2 - 1) * -z * 0.55
    bPos[i * 3 + 2] = z
    bSize[i] = 0.5 + rnd() * 1.6
    const c = palette[Math.floor(rnd() * palette.length)]
    bCol.set([c.r, c.g, c.b], i * 3)
    bSeed[i] = rnd() * 100
  }
  const bGeo = new THREE.BufferGeometry()
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3))
  bGeo.setAttribute('aSize', new THREE.BufferAttribute(bSize, 1))
  bGeo.setAttribute('aCol', new THREE.BufferAttribute(bCol, 3))
  bGeo.setAttribute('aSeed', new THREE.BufferAttribute(bSeed, 1))
  const bokehMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAmount: { value: 0 }, uScale: { value: 400 } },
    vertexShader: /* glsl */ `attribute float aSize; attribute vec3 aCol; attribute float aSeed; uniform float uTime; uniform float uScale; varying vec3 vCol; varying float vA;
      void main(){
        vec3 p = position;
        float span = -p.z * 1.1;
        p.y = mod(p.y + span + uTime * (0.25 + fract(aSeed) * 0.35), span * 2.0) - span;
        p.x += sin(uTime * 0.2 + aSeed) * 0.8;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = min(aSize * uScale / -mv.z * 0.9, 200.0);
        gl_Position = projectionMatrix * mv;
        vCol = aCol;
        vA = (0.55 + 0.45 * sin(uTime * 0.6 + aSeed * 3.0)) * smoothstep(-6.0, -12.0, mv.z);
      }`,
    fragmentShader: /* glsl */ `uniform float uAmount; varying vec3 vCol; varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float disc = smoothstep(1.0, 0.82, d);
        float rim = smoothstep(0.62, 0.9, d) * disc;
        float a = (disc * 0.22 + rim * 0.28) * vA * uAmount;
        gl_FragColor = vec4(vCol * a, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
  const bokeh = new THREE.Points(bGeo, bokehMat)
  bokeh.frustumCulled = false
  bokeh.renderOrder = 10
  const bokehRig = new THREE.Group()
  bokehRig.visible = false
  bokehRig.add(bokeh)
  fxRoot.add(bokehRig)

  // Ground mist: slow, drifting layers of haze low over the land, catching
  // the sunset light. Adds depth and constant gentle motion (all real GPUs).
  const mistRig = new THREE.Group()
  mistRig.visible = ctx.tier !== 'low'
  fxRoot.add(mistRig)
  const mistMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uNoise: { value: noiseTexture() }, uWarm: { value: new THREE.Color(BRAND.ember) }, uCool: { value: new THREE.Color('#2a3550') }, uGlow: { value: 0 }, uSeed: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `uniform float uTime; uniform sampler2D uNoise; uniform vec3 uWarm; uniform vec3 uCool; uniform float uGlow; uniform float uSeed; varying vec2 vUv; varying vec3 vW;
      void main(){
        vec2 p = vW.xz * 0.006 + vec2(uSeed, uSeed * 0.7);
        float a = texture2D(uNoise, p + vec2(uTime * 0.006, uTime * 0.002)).r;
        float b = texture2D(uNoise, p * 2.3 - vec2(uTime * 0.009, -uTime * 0.004)).g;
        float m = smoothstep(0.35, 0.85, a * 0.65 + b * 0.45);
        // Soft at the edges of the layer and never thick right in front of the lens
        float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x) * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
        // Mostly cool navy haze, only lightly warmed by the sunset
        vec3 col = mix(uCool, uWarm, 0.12 + uGlow * 0.12 + vUv.y * 0.1);
        gl_FragColor = vec4(col * m * edge * 0.11, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const mistLayers = [
    { y: 2.5, w: 420, d: 260, seed: 0.0 },
    { y: 6.5, w: 520, d: 320, seed: 0.41 },
  ].map((m) => {
    const mat = mistMat.clone()
    mat.uniforms.uNoise.value = mistMat.uniforms.uNoise.value
    mat.uniforms.uSeed.value = m.seed
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.d), mat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = BASE_Y + m.y
    mesh.frustumCulled = false
    mistRig.add(mesh)
    return { mesh, depth: m.d }
  })

  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BASE_Y)
  const ray = new THREE.Ray()
  const hit = new THREE.Vector3()
  const fwd = new THREE.Vector3()

  return {
    group: g,
    baseY: BASE_Y,
    ready: terrainReady,
    update(t, dt, { camera, pointer, ndc, chapter, flash, sunX = 0, glow = 0, premiere = 0, bokeh: bokehAmt = 0, aurora = 0, pxScale = 400 }) {
      terrainMat.uniforms.uTime.value = t
      terrainMat.uniforms.uCam.value.copy(camera.position)
      // Sky and sun ride with the camera, so the horizon is always there
      camera.getWorldDirection(fwd)
      sky.position.set(camera.position.x, 30, camera.position.z - 470)
      sun.position.set(camera.position.x * 0.92 + sunX + pointer.x * -6, 14 + pointer.y * -3, camera.position.z - 460)
      sun.lookAt(camera.position)
      sky.lookAt(camera.position.x, 30, camera.position.z)
      skyMat.uniforms.uHorizon.value = (camera.position.y * 0.4 + 1 - 30) / 900
      skyMat.uniforms.uMood.value = 0.5 + 0.5 * Math.sin(chapter * 1.3)
      sunMat.uniforms.uPulse.value = flash + glow * 0.45
      sun.scale.setScalar(1 + glow * 0.3)
      skyMat.uniforms.uGlow.value = glow
      skyMat.uniforms.uSunU.value = 0.5 + (sunX - pointer.x * 6) / 2600
      terrainMat.uniforms.uGlow.value = glow

      // Page moods
      searchRig.visible = premiere > 0.01
      if (searchRig.visible) {
        searchRig.position.set(camera.position.x, 0, camera.position.z)
        for (const b of beams) {
          b.pivot.rotation.z = b.lean + Math.sin(t * b.speed + b.phase) * 0.42
          b.pivot.rotation.x = -0.12 + Math.sin(t * b.speed * 0.7 + b.phase) * 0.08
          b.shaft.material.uniforms.uOpacity.value = 0.42 * premiere
          b.shaft.material.uniforms.uTime.value = t
          b.foot.material.opacity = 0.6 * premiere
        }
      }
      auroraRig.visible = aurora > 0.01
      if (auroraRig.visible) {
        auroraRig.position.set(camera.position.x * 0.85, camera.position.y * 0.3, camera.position.z)
        for (const c of curtains) { c.material.uniforms.uTime.value = t; c.material.uniforms.uAmount.value = aurora }
      }
      bokehRig.visible = bokehAmt > 0.01
      if (bokehRig.visible) {
        bokehRig.position.copy(camera.position)
        bokehRig.quaternion.copy(camera.quaternion)
        bokehMat.uniforms.uTime.value = t
        bokehMat.uniforms.uAmount.value = bokehAmt
        bokehMat.uniforms.uScale.value = pxScale
      }
      if (mistRig.visible) {
        // The haze rides along in front of the camera, starting a little ahead of it
        for (const m of mistLayers) {
          m.mesh.position.x = camera.position.x
          m.mesh.position.z = camera.position.z - m.depth / 2 - 18
          m.mesh.material.uniforms.uTime.value = t
          m.mesh.material.uniforms.uGlow.value = glow
        }
      }
      // Cursor → ground
      ray.origin.copy(camera.position)
      ray.direction.set(ndc.x, ndc.y, 0.5).unproject(camera).sub(camera.position).normalize()
      const on = Math.abs(ndc.x) <= 1 && ray.intersectPlane(ground, hit)
      if (on) terrainMat.uniforms.uPointer.value.lerp(hit, Math.min(1, dt * 8))
      const u = terrainMat.uniforms.uPointerOn
      u.value += ((on ? 1 : 0) - u.value) * Math.min(1, dt * 4)
    },
  }
}

function applyTerrain(geo, { heights, normals }) {
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) + heights[i])
  pos.needsUpdate = true
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  geo.setAttribute('aH', new THREE.BufferAttribute(heights, 1))
  geo.computeBoundingSphere()
}
function bakeTerrain(geo, span) {
  const n = geo.attributes.position.count
  // Placeholders so the material compiles with the right attributes meanwhile
  geo.setAttribute('aH', new THREE.BufferAttribute(new Float32Array(n), 1))
  const inPage = () => applyTerrain(geo, bakeHeights(geo.attributes.position.array, span))
  return new Promise((resolve) => {
    let worker
    try {
      worker = new Worker(new URL('./terrain.worker.js', import.meta.url), { type: 'module' })
    } catch {
      inPage()
      return resolve()
    }
    const done = (fn) => {
      worker.terminate()
      fn()
      resolve()
    }
    worker.onmessage = ({ data }) => done(() => applyTerrain(geo, data))
    worker.onerror = () => done(inPage)
    worker.postMessage({ positions: geo.attributes.position.array.slice(), span })
  })
}
