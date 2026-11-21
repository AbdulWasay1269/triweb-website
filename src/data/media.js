/**
 * Media registry. Each video exists in three forms:
 *   public/media/videos/full/<slug>.mp4   HD (1080p) cut with sound, opened in the player
 *   public/media/videos/loop/<slug>.mp4   short silent 720p loop for cards and backgrounds
 *   public/media/posters/<slug>.webp      still frame shown while a video loads (720 wide),
 *                                         plus <slug>-360.webp and <slug>-540.webp for smaller cards
 */
const BASE = import.meta.env.BASE_URL + 'media/'

export function reel(slug, { posterSlug, loopSlug } = {}) {
  return {
    slug,
    full: `${BASE}videos/full/${slug}.mp4`,
    loop: `${BASE}videos/loop/${loopSlug || slug}.mp4`,
    poster: `${BASE}posters/${posterSlug || loopSlug || slug}.webp`,
    // Same frame at 360/540/720 px wide: the browser downloads the one that fits the card
    posterSmall: `${BASE}posters/${posterSlug || loopSlug || slug}-360.webp`,
    posterSet: [360, 540].map((w) => `${BASE}posters/${posterSlug || loopSlug || slug}-${w}.webp ${w}w`).concat(`${BASE}posters/${posterSlug || loopSlug || slug}.webp 720w`).join(', '),
  }
}

/** Alternate cuts of the same footage */
export const alt = {
  mansionStairs: reel('mansion', { posterSlug: 'mansion-a' }),
  mansionPool: reel('mansion', { loopSlug: 'mansion-b' }),
  fashionFabric: reel('kashmir-cloth', { loopSlug: 'kashmir-cloth-b' }),
}
