import { useEffect } from 'react'
import * as THREE from 'three'
import { reducedMotion } from '../lib/motion.js'

/**
 * Shared Three.js lifecycle: renderer, resize, pause when off-screen or tab hidden,
 * capped pixel ratio, reduced-motion = single static frame, full disposal on unmount.
 * `build({ scene, camera, renderer })` returns { update(t, dt, pointer), dispose() }.
 */
let softwareCached
export function isSoftwareRenderer(renderer) {
  if (softwareCached !== undefined) return softwareCached
  try {
    const gl = renderer.getContext()
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
    softwareCached = /swiftshader|llvmpipe|software|basic render/i.test(String(name))
  } catch {
    softwareCached = false
  }
  return softwareCached
}

export function useThreeStage(containerRef, build, { fov = 50, z = 9, fps = 60, ratio = 1.5, paused } = {}) {
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' })
    } catch {
      return // WebGL unavailable: the CSS background underneath remains
    }
    // Devices without a real graphics card (software rendering) get a lite mode
    const lite = isSoftwareRenderer(renderer)
    if (lite) {
      fps = Math.min(fps, 8)
      ratio = ratio * 0.5
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, ratio))
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100)
    camera.position.z = z

    const api = build({ scene, camera, renderer, THREE })
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }

    const resize = () => {
      const w = el.clientWidth || 1
      const h = el.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      api.resize?.(w, h)
      if (reducedMotion) renderer.render(scene, camera)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    const onMove = (e) => {
      pointer.tx = (e.clientX / innerWidth) * 2 - 1
      pointer.ty = -((e.clientY / innerHeight) * 2 - 1)
    }
    addEventListener('pointermove', onMove, { passive: true })

    let visible = true
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) loop()
    })
    io.observe(el)

    let last = performance.now()
    const delta = () => {
      const now = performance.now()
      const d = (now - last) / 1000
      last = now
      return d
    }
    let raf = 0
    let t = 0
    let acc = 0
    // Pace to whole divisions of the display's refresh (every frame, every 2nd,
    // every 4th...) so frame spacing stays even: a 40 fps cap on a 60 Hz screen
    // would alternate 1- and 2-refresh gaps and read as stutter.
    const div = Math.max(1, Math.round(60 / fps))
    let n = 0
    const loop = () => {
      cancelAnimationFrame(raf)
      if (!visible || document.hidden || reducedMotion) return
      raf = requestAnimationFrame(loop)
      acc += Math.min(delta(), 0.1)
      if (++n % div) return
      const dt = Math.min(acc, 0.1)
      acc = 0
      // Skip drawing while something opaque covers this canvas
      if (paused?.()) return
      t += dt
      pointer.x += (pointer.tx - pointer.x) * 0.1
      pointer.y += (pointer.ty - pointer.y) * 0.1
      api.update(t, dt, pointer)
      renderer.render(scene, camera)
    }
    const onVis = () => {
      delta()
      loop()
    }
    document.addEventListener('visibilitychange', onVis)

    if (reducedMotion) {
      api.update(0, 0, pointer)
      renderer.render(scene, camera)
    } else loop()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVis)
      api.dispose?.()
      scene.traverse((o) => {
        o.geometry?.dispose?.()
        if (o.material) [].concat(o.material).forEach((m) => m.dispose())
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
