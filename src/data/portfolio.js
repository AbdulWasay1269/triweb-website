/**
 * Optional per-project write-up (shown in the project view only when filled in):
 *   summary, challenge, solution, result. Leave them out rather than guessing.
 */
import { reel } from './media.js'

/**
 * ============================================================
 *  PORTFOLIO — add, remove or reorder work here.
 * ============================================================
 *  category: 'restaurants' | 'fashion' | 'real-estate' | 'software'
 *  brand:    only the name visible in the footage itself (null when none is shown).
 *            Please confirm these and correct any spelling.
 *  media:    reel('<slug>') for videos, or { image: '/media/...' } for a still.
 *
 *  Software projects: add entries with category 'software' and an image, e.g.
 *  { id:'my-site', title:'Restaurant website', category:'software',
 *    format:'Website', media:{ image: import.meta.env.BASE_URL + 'media/software/my-site.jpg' } }
 */
export const categories = [
  { id: 'all', label: 'All work' },
  { id: 'restaurants', label: 'Cafes & restaurants' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'real-estate', label: 'Real estate & rentals' },
  { id: 'software', label: 'Software & automation' },
]

export const portfolio = [
  { id: 'ootak-bbq', title: 'BBQ platter launch reel', brand: 'Ootak Restaurant', category: 'restaurants', format: 'Ad production', media: reel('ootak-bbq') },
  { id: 'mansion', title: 'The mansion after dark', brand: null, category: 'real-estate', format: 'Property film', media: reel('mansion') },
  { id: 'sweet-dreams-boba', title: 'Blueberry boba tea reveal', brand: 'Sweet Dreams', category: 'restaurants', format: 'Product reel', media: reel('sweet-dreams-boba') },
  { id: 'kashmir-cloth', title: 'Fabric and fashion film', brand: 'Kashmir Cloth', category: 'fashion', format: 'Fashion campaign', media: reel('kashmir-cloth') },
  { id: 'by-the-flame', title: 'The cheese-pull naan', brand: 'By the Flame', category: 'restaurants', format: 'Short-form reel', media: reel('by-the-flame') },
  { id: 'tree-house', title: 'An evening walkthrough', brand: 'Tree House', category: 'restaurants', format: 'Venue film', media: reel('tree-house') },
  { id: 'flame-karahi', title: 'Flame-fired karahi', brand: null, category: 'restaurants', format: 'Cinematic food reel', media: reel('flame-karahi') },
  { id: 'cactus-cafe', title: 'Find your comfort spot', brand: 'Cactus', category: 'restaurants', format: 'Cafe ambience reel', media: reel('cactus-cafe') },
  { id: 'sweet-factory', title: 'The bakery display', brand: 'The Sweet Factory', category: 'restaurants', format: 'Menu reel', media: reel('sweet-factory') },
  { id: 'ootak-artists', title: 'Meet the artists', brand: 'Ootak Restaurant', category: 'restaurants', format: 'Team feature', media: reel('ootak-artists') },
  { id: 'special-momos', title: 'Special momos plating', brand: null, category: 'restaurants', format: 'Short-form reel', media: reel('special-momos') },
  { id: 'noodles', title: 'Counting down problems with noodles', brand: null, category: 'restaurants', format: 'Short-form reel', media: reel('noodles') },
  { id: 'pocket-pizza', title: 'Pocket pizza assembly', brand: null, category: 'restaurants', format: 'Product reel', media: reel('pocket-pizza') },
  { id: 'tres-leches', title: 'Pick up a fork', brand: null, category: 'restaurants', format: 'Dessert reel', media: reel('tres-leches') },
  { id: 'thusoo', title: 'Momos and mocktails', brand: 'Thusoo', category: 'restaurants', format: 'Split-screen edit', media: reel('thusoo') },
]
