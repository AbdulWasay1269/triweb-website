import { bakeHeights } from './terrain.js'

// Shaping the landscape takes a few hundred thousand noise samples: done here,
// off the page's main thread, it no longer freezes the opening animation.
self.onmessage = ({ data }) => {
  const { heights, normals } = bakeHeights(data.positions, data.span)
  self.postMessage({ heights, normals }, [heights.buffer, normals.buffer])
}
