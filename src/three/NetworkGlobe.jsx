import { useRef } from 'react'
import { useThreeStage } from './useThreeStage.js'
import { isSmallScreen } from '../lib/motion.js'

/**
 * Software division centrepiece: a globe of connected nodes with data pulses
 * travelling along the links — infrastructure, integrations and AI agents.
 */
export default function NetworkGlobe({ className = '' }) {
  const ref = useRef(null)
  useThreeStage(
    ref,
    ({ scene, THREE }) => {
      const N = isSmallScreen() ? 70 : 120
      const R = 3
      const nodes = []
      const golden = Math.PI * (3 - Math.sqrt(5))
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2
        const r = Math.sqrt(1 - y * y)
        const th = golden * i
        nodes.push(new THREE.Vector3(Math.cos(th) * r * R, y * R, Math.sin(th) * r * R))
      }
      // Connect each node to its 3 nearest neighbours
      const links = []
      const seen = new Set()
      nodes.forEach((a, i) => {
        nodes
          .map((b, j) => [j, a.distanceToSquared(b)])
          .filter(([j]) => j !== i)
          .sort((m, n) => m[1] - n[1])
          .slice(0, 3)
          .forEach(([j]) => {
            const key = i < j ? `${i}-${j}` : `${j}-${i}`
            if (!seen.has(key)) {
              seen.add(key)
              links.push([i, j])
            }
          })
      })

      const group = new THREE.Group()
      scene.add(group)

      const lineGeo = new THREE.BufferGeometry()
      const lp = new Float32Array(links.length * 6)
      links.forEach(([i, j], k) => {
        lp.set([nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z], k * 6)
      })
      lineGeo.setAttribute('position', new THREE.BufferAttribute(lp, 3))
      group.add(new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: '#ffb38f', transparent: true, opacity: 0.22 })))

      const dotGeo = new THREE.BufferGeometry().setFromPoints(nodes)
      group.add(new THREE.Points(dotGeo, new THREE.PointsMaterial({ color: '#ff6a3d', size: 0.09, transparent: true, opacity: 0.95 })))

      // Core: an inner icosahedron "AI" core
      const core = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.1, 1)),
        new THREE.LineBasicMaterial({ color: '#ff6a3d', transparent: true, opacity: 0.45 }),
      )
      group.add(core)

      // Pulses
      const P = 26
      const pulses = Array.from({ length: P }, () => ({ link: links[(Math.random() * links.length) | 0], t: Math.random(), speed: 0.3 + Math.random() * 0.6 }))
      const pulseGeo = new THREE.BufferGeometry()
      const pp = new Float32Array(P * 3)
      pulseGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3))
      group.add(
        new THREE.Points(
          pulseGeo,
          new THREE.PointsMaterial({ color: '#ffb38f', size: 0.16, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }),
        ),
      )
      const tmp = new THREE.Vector3()

      return {
        update(t, dt, p) {
          group.rotation.y = t * 0.12 + p.x * 0.5
          group.rotation.x = 0.25 + p.y * 0.25
          core.rotation.y = -t * 0.4
          core.rotation.z = t * 0.2
          pulses.forEach((pl, k) => {
            pl.t += dt * pl.speed
            if (pl.t > 1) {
              pl.t = 0
              pl.link = links[(Math.random() * links.length) | 0]
            }
            tmp.lerpVectors(nodes[pl.link[0]], nodes[pl.link[1]], pl.t)
            pp.set([tmp.x, tmp.y, tmp.z], k * 3)
          })
          pulseGeo.attributes.position.needsUpdate = true
        },
      }
    },
    { fov: 45, z: 9.5, fps: 60, ratio: 2 },
  )
  return <div ref={ref} className={`absolute inset-0 ${className}`} aria-hidden="true" />
}
