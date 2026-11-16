import { useRef } from 'react'
import { useThreeStage } from './useThreeStage.js'
import { makeGradientMesh } from './gradientShader.js'
import { isSmallScreen } from '../lib/motion.js'

/**
 * Vivid liquid-gradient background for a section. Waves flow over time and
 * lean toward the pointer. Pass three colours.
 */
export default function ShaderGradient({ colors = ['#ff7a45', '#ff6a3d', '#ff3a20'], bright = 1, amp = 1.4, className = '' }) {
  const ref = useRef(null)
  useThreeStage(
    ref,
    ({ scene, camera, THREE }) => {
      const small = isSmallScreen()
      const { mesh, mat } = makeGradientMesh(THREE, { colors, bright, amp, segments: small ? [70, 45] : [120, 75] })
      mesh.rotation.x = -0.55
      mesh.rotation.z = -0.25
      mesh.position.set(0, -0.5, -2)
      scene.add(mesh)
      return {
        update(t, dt, p) {
          mat.uniforms.uTime.value = t
          mat.uniforms.uFlow.value.set(p.x * 0.25, p.y * 0.25)
          mesh.rotation.z = -0.25 + p.x * 0.06
          camera.position.y = p.y * 0.3
          camera.lookAt(0, 0, -2)
        },
      }
    },
    { fov: 45, z: 9, fps: 30, ratio: 0.6 },
  )
  return <div ref={ref} className={`absolute inset-0 ${className}`} aria-hidden="true" />
}
