/**
 * Media registry. Each video exists in three forms:
 *   public/media/videos/full/<slug>.mp4   HD (1080p) cut with sound, opened in the player
 *   public/media/videos/loop/<slug>.mp4   short silent 720p loop for cards and backgrounds
 *   public/media/posters/<slug>.jpg       still frame shown while a video loads
 */
const BASE = import.meta.env.BASE_URL + 'media/'

export function reel(slug, { posterSlug, loopSlug } = {}) {
  return {
    slug,
    full: `${BASE}videos/full/${slug}.mp4`,
    loop: `${BASE}videos/loop/${loopSlug || slug}.mp4`,
    poster: `${BASE}posters/${posterSlug || loopSlug || slug}.jpg`,
  }
}

/** Alternate cuts of the same footage */
export const alt = {
  mansionStairs: reel('mansion', { posterSlug: 'mansion-a' }),
  mansionPool: reel('mansion', { loopSlug: 'mansion-b' }),
  fashionFabric: reel('kashmir-cloth', { loopSlug: 'kashmir-cloth-b' }),
}
