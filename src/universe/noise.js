/**
 * 3D simplex noise: a line-for-line JavaScript port of the GLSL `snoise`
 * in src/three/gradientShader.js (Ashima Arts / Ian McEwan). Used to work
 * out the terrain's shape once on the CPU, so the GPU no longer recomputes
 * it for every vertex on every frame. Intermediate values are rounded to
 * 32-bit floats where the GPU version would be, so both give the same result.
 */
const f = Math.fround
const mod289 = (x) => f(x - f(Math.floor(f(x * f(1 / 289))) * 289))
const permute = (x) => mod289(f(f(f(x * 34) + 1) * x))
const taylorInvSqrt = (r) => f(1.79284291400159 - f(0.85373472095314 * r))
const step = (edge, x) => (x < edge ? 0 : 1)

export function snoise(vx, vy, vz) {
  const Cx = 1 / 6
  const Cy = 1 / 3
  const s = (vx + vy + vz) * Cy
  let ix = Math.floor(vx + s)
  let iy = Math.floor(vy + s)
  let iz = Math.floor(vz + s)
  const t = (ix + iy + iz) * Cx
  const x0x = vx - ix + t
  const x0y = vy - iy + t
  const x0z = vz - iz + t

  // g = step(x0.yzx, x0.xyz); l = 1 - g
  const gx = step(x0y, x0x)
  const gy = step(x0z, x0y)
  const gz = step(x0x, x0z)
  const lx = 1 - gx
  const ly = 1 - gy
  const lz = 1 - gz
  // i1 = min(g.xyz, l.zxy); i2 = max(g.xyz, l.zxy)
  const i1x = Math.min(gx, lz)
  const i1y = Math.min(gy, lx)
  const i1z = Math.min(gz, ly)
  const i2x = Math.max(gx, lz)
  const i2y = Math.max(gy, lx)
  const i2z = Math.max(gz, ly)

  const x1x = x0x - i1x + Cx
  const x1y = x0y - i1y + Cx
  const x1z = x0z - i1z + Cx
  const x2x = x0x - i2x + Cy
  const x2y = x0y - i2y + Cy
  const x2z = x0z - i2z + Cy
  const x3x = x0x - 0.5
  const x3y = x0y - 0.5
  const x3z = x0z - 0.5

  ix = mod289(ix)
  iy = mod289(iy)
  iz = mod289(iz)
  const pz = [0, i1z, i2z, 1].map((o) => permute(iz + o))
  const py = [0, i1y, i2y, 1].map((o, k) => permute(pz[k] + iy + o))
  const p = [0, i1x, i2x, 1].map((o, k) => permute(py[k] + ix + o))

  // ns = n_ * D.wyz - D.xzx, with n_ = 1/7 and D = (0, 0.5, 1, 2)
  const n_ = f(0.142857142857)
  const nsx = f(n_ * 2)
  const nsy = f(f(n_ * 0.5) - 1)
  const nsz = n_
  const gxs = []
  const gys = []
  const h = []
  for (let k = 0; k < 4; k++) {
    // 32-bit rounding here matters: e.g. 7 × (1/7) must land on 1, as it does on the GPU
    const j = f(p[k] - f(49 * Math.floor(f(f(p[k] * nsz) * nsz))))
    const xq = Math.floor(f(j * nsz))
    const yq = Math.floor(f(j - f(7 * xq)))
    gxs[k] = f(f(xq * nsx) + nsy)
    gys[k] = f(f(yq * nsx) + nsy)
    h[k] = f(f(1 - Math.abs(gxs[k])) - Math.abs(gys[k]))
  }
  // b0 = (x.xy, y.xy), b1 = (x.zw, y.zw); s = floor(b) * 2 + 1; sh = -step(h, 0)
  const sh = h.map((v) => -step(v, 0))
  const sgn = (v) => Math.floor(v) * 2 + 1
  // a0 = b0.xzyw + s0.xzyw * sh.xxyy ; a1 = b1.xzyw + s1.xzyw * sh.zzww
  const g0 = [gxs[0] + sgn(gxs[0]) * sh[0], gys[0] + sgn(gys[0]) * sh[0], h[0]]
  const g1 = [gxs[1] + sgn(gxs[1]) * sh[1], gys[1] + sgn(gys[1]) * sh[1], h[1]]
  const g2 = [gxs[2] + sgn(gxs[2]) * sh[2], gys[2] + sgn(gys[2]) * sh[2], h[2]]
  const g3 = [gxs[3] + sgn(gxs[3]) * sh[3], gys[3] + sgn(gys[3]) * sh[3], h[3]]
  const grads = [g0, g1, g2, g3].map((g) => {
    const n = taylorInvSqrt(g[0] * g[0] + g[1] * g[1] + g[2] * g[2])
    return [g[0] * n, g[1] * n, g[2] * n]
  })
  const xs = [
    [x0x, x0y, x0z],
    [x1x, x1y, x1z],
    [x2x, x2y, x2z],
    [x3x, x3y, x3z],
  ]
  let sum = 0
  for (let k = 0; k < 4; k++) {
    const [ax, ay, az] = xs[k]
    let m = Math.max(0.6 - (ax * ax + ay * ay + az * az), 0)
    m *= m
    sum += m * m * (grads[k][0] * ax + grads[k][1] * ay + grads[k][2] * az)
  }
  return 42 * sum
}
