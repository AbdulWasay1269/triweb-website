import { snoise } from './noise.js'

/* Terrain shape, computed once (identical to the former per-frame vertex shader).
   Shared by the background worker and the in-page fallback. */
const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}
const ridge = (px, pz) => {
  const n = 1 - Math.abs(snoise(px, pz, 0))
  return n * n
}
export function terrainHeight(x, z, span) {
  const d = smooth(-span * 0.15, -span * 1.25, z)
  const valley = smooth(18, 78, Math.abs(x)) + 0.04
  let h = ridge(x * 0.011, z * 0.011) * 0.62 + ridge(x * 0.027 + 7, z * 0.027 + 7) * 0.28 + ridge(x * 0.06 + 3, z * 0.06 + 3) * 0.1
  h *= valley * (42 + (9 - 42) * d)
  // Terraces: the organic slopes snap into steps as the world turns digital
  const stepH = 2.2
  const t = smooth(0.35, 0.95, d)
  return h + (Math.floor(h / stepH + 0.5) * stepH - h) * t
}

/** Heights and normals for vertex positions [x,y,z,...] */
export function bakeHeights(positions, span) {
  const n = positions.length / 3
  const heights = new Float32Array(n)
  const normals = new Float32Array(n * 3)
  const e = 1.6
  for (let i = 0; i < n; i++) {
    const x = positions[i * 3]
    const z = positions[i * 3 + 2]
    const h = terrainHeight(x, z, span)
    const nx = h - terrainHeight(x + e, z, span)
    const nz = h - terrainHeight(x, z + e, span)
    const len = Math.hypot(nx, e, nz)
    normals[i * 3] = nx / len
    normals[i * 3 + 1] = e / len
    normals[i * 3 + 2] = nz / len
    heights[i] = h
  }
  return { heights, normals }
}
