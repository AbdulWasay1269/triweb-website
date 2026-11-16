# TriWeb Solutions website

A multi-page, 3D animated website for TriWeb Solutions and its two divisions: TriWeb Media Productions and TriWeb Software Company.

## Pages

| Page | Address | What's on it |
| --- | --- | --- |
| Home | `/` | Hero with rotating 3D reels, the two divisions, featured work (sideways-scrolling showcase), why TriWeb, process, call to action |
| About | `/#about` | Founders, story quote, values, the two divisions, why TriWeb, process |
| Media Productions | `/#media` | Services with live demos, reel strip, brand identity, industries, studio work |
| Software Company | `/#software` | Web development demo, AI workflow demo, automation use cases, enterprise and integrations |
| Portfolio | `/#work` | Filterable grid, HD player with sound |
| Contact | `/#contact` | Enquiry form, contact details, FAQ |

Pages use `#about`-style addresses, so the site works on any static host with no server setup, and every page can be bookmarked or shared.

## Run it

Requires [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install        # once
npm run dev        # local development at http://localhost:5173
npm run build      # production build into /dist
npm run preview    # preview the production build at http://localhost:4173
```

To publish, upload the contents of `dist/` to any static host: Netlify, Vercel, Cloudflare Pages, or regular hosting via cPanel/FTP.

## What to fill in

| What | Where |
| --- | --- |
| Email, phone, WhatsApp, location | `src/data/site.js` → `contact` |
| Social media links | `src/data/site.js` → `social` (empty ones stay hidden) |
| Logo | Already set: `src/components/Logo.jsx` uses a vector trace of the official icon (`public/media/brand/`) |
| Portfolio items | `src/data/portfolio.js` |

Email (triwebinnovations@gmail.com), phone (0323 1554573), WhatsApp and Instagram (@triwebsolutions) are set in `src/data/site.js`. The contact form opens the visitor's email app with the message filled in. To receive messages directly instead, connect a form service such as Formspree in `ContactForm` (`src/blocks/ContactBlocks.jsx`).

The floating WhatsApp button uses `contact.whatsapp`. Clear it to hide the button.

## Brand

Taken from the TriWeb brand identity guide:

| Token | Value | Use |
| --- | --- | --- |
| Dark Navy | `#0B1220` | Backgrounds (`obsidian` in the code) |
| Vermilion | `#FF3A20` | Primary accent, buttons, Media division (`vermilion`) |
| Ember | `#FF7A45` | Lighter vermilion for gradients (`ember`) |
| Steel / Ice | `#5A78E6` / `#A9C1EA` | Cool tones derived from the navy, used for the Software division |
| Typeface | Outfit | Bold + light pairing mirrors the "triweb / solutions" wordmark |

Colour tokens live at the top of `src/index.css`.

## Project structure

```
public/media/
  videos/full/   HD 1080p cuts with sound, played in the full-screen player
  videos/loop/   short silent 720p loops for cards and previews
  posters/       still frames shown while videos load
  software/      ← put Software Company screenshots here
  brand/         ← put official logo files here
src/
  pages/         one file per page
  blocks/        sections shared between pages
  components/    nav, footer, buttons, cards, video player, page wrapper
  visuals/       interactive service demos (Media + Software)
  three/         3D: scroll-driven background, network globe
  data/          site settings, portfolio, media registry (edit these)
  lib/           animation and smooth-scroll helpers
  router.jsx     page routing
```

## Adding new work

### A new video

With [ffmpeg](https://ffmpeg.org) installed, run from the project folder (replace `my-reel` and `input.mp4`):

```bash
# HD cut with sound
ffmpeg -i input.mp4 -vf "scale=-2:'min(1920,ih)':flags=lanczos,fps=30" -c:v libx264 -preset fast -crf 21 -maxrate 5000k -bufsize 10000k -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart public/media/videos/full/my-reel.mp4
# 8-second silent loop starting at 2s
ffmpeg -ss 2 -t 8 -i input.mp4 -an -vf "scale=-2:'min(1280,ih)':flags=lanczos,fps=30" -c:v libx264 -preset medium -crf 21 -maxrate 3500k -bufsize 7000k -pix_fmt yuv420p -movflags +faststart public/media/videos/loop/my-reel.mp4
# Poster frame at 3s
ffmpeg -ss 3 -i input.mp4 -frames:v 1 -vf "scale=-2:1280" -q:v 3 public/media/posters/my-reel.jpg
```

Then add an entry to `src/data/portfolio.js`:

```js
{ id: 'my-reel', title: 'Grand opening reel', brand: 'Client name', category: 'restaurants', format: 'Short-form reel', media: reel('my-reel') },
```

iPhone videos are usually HEVC, which Chrome and Firefox can't play reliably. These commands convert them to H.264, which plays everywhere.

### Software Company projects

Save screenshots in `public/media/software/`, then add:

```js
{ id: 'my-site', title: 'Restaurant website', brand: 'Client name', category: 'software', format: 'Website',
  media: { image: import.meta.env.BASE_URL + 'media/software/my-site.jpg' } },
```

## Video playback

- Loops load only when they are near the screen and play only while visible.
- A playback manager caps how many play at once (2 on phones, 5 on desktop), so scrolling stays smooth.
- Each video fades in only once real frames are playing, so there are no black flashes.
- If a browser blocks autoplay (for example iPhone Low Power Mode), the poster frame stays visible.
- The full-screen player shows a loading spinner and offers a retry if a file fails. It supports arrow keys, swipe and Esc, and pauses all background loops while it's open.

## Asset inventory

All 14 supplied videos are used (two uploads were duplicates). Brand names in `portfolio.js` come only from text and logos visible in the footage. Please confirm the spelling.

| Slug | Source file | Content |
| --- | --- | --- |
| ootak-bbq | 24885_1.mp4 | Ootak Restaurant BBQ platter ad |
| ootak-artists | 24884.mp4 | Ootak "The Artists" kitchen team |
| by-the-flame | 24878.mp4 | By the Flame cheese-pull naan |
| sweet-dreams-boba | 24886.mp4 | Sweet Dreams blueberry boba |
| sweet-factory | 24877.mp4 | The Sweet Factory bakery display |
| thusoo | 24879.mp4 | Thusoo momos and drinks |
| cactus-cafe | 24887.mp4 | Cactus cafe interior |
| tree-house | IMG_8029_1.mp4 | Tree House restaurant |
| flame-karahi | 24913.mp4 | Flame-cooked karahi |
| special-momos | 283adc97-24880.mp4 | Special momos plating |
| pocket-pizza | 24882.mp4 | Pocket pizza assembly |
| noodles | 24881.mp4 | Noodles "problems" countdown |
| tres-leches | 24912.mp4 | "Pick up a fork" dessert |
| mansion | IMG_0400_MOV.mp4 | "The Mansion After Dark" property film |
| kashmir-cloth | IMG_0601.MP4 | Kashmir Cloth fashion film (the original is 600×1080, so it stays at that size) |

## 3D cinematic background

Everything behind the content is one real-time Three.js world (`src/universe/`). It is a single isolated layer: `App.jsx` loads it lazily in place of the previous background, and no page, section or component markup was changed for it.

- **One world.** A single landscape (`src/universe/world.js`) runs under every scene: it begins as the hero's navy mountains, gains glowing contour lines, steps into terraces and becomes a digital grid. One horizon sun, sky glow, rim light and fog carry through, the ground answers the cursor with a pool of ember light, and a soft light sweep marks each section change.
- **Journey.** Six scenes sit along a camera path: Hero (energy portal), Media (film strips cut from your own video frames, a cinema lens, a film reel), Software (a digital city), AI automations (a neural network and a point-cloud brain), About (your logo in extruded chrome) and Finale (a vermilion star). Scrolling flies the camera between them. Each scene is tied to an existing section by selector (`JOURNEYS` in `engine.js`), so the scene matches the section on screen.
- **Mouse.** Camera parallax, a light that follows the cursor, and objects that lean toward it.
- **Hover and click.** Interactive objects show an action on the cursor (Ignite, Focus, Roll, Compile, Deploy, Activate, Train, Assemble, Shine, Spin). Clicking triggers the transformation; a **Reset scene** pill appears to return to the original.
- **Never in the way.** Pointer events over links, buttons, forms, cards, video, images, or any solid panel are left to the site; the canvas itself captures nothing.
- **Quality tiers.** `high` (dedicated graphics card: bloom and lens pass, 60 fps while moving, 30 when still), `mid` (laptops with built-in graphics, phones, tablets: no bloom, 40/24 fps), `low` (no graphics card: holds still while scrolling, 8 fps otherwise). All tiers draw at the screen's real resolution with antialiasing, so the scene stays sharp. If frames run slow, quality steps down by lowering the frame rate and dropping bloom first; resolution is trimmed only as a last resort and never below the screen's own pixel size. Force one with `?quality=high|mid|low`; turn the 3D off with `?no3d` to compare.
- **Loading.** Three.js and the 3D world download only after the page has loaded, and the scenes are built and their shaders compiled while the browser is idle, so nothing is built mid-scroll.
- **Pauses** when the tab is hidden, the video player is open, or a full-screen reel covers it. Reduced-motion users get a still scene that follows the scroll. Without WebGL a static gradient in the brand colours is shown.
- All 3D content is procedural or made from your own posters: no paid assets or external services.

## Home hero

`blocks/CinematicHero.jsx` art-directs the copy; the 3D centrepiece, **the TriWeb Gateway**, is the `hero` scene in `src/universe/stations/hero.js`. Three gunmetal-chrome frames with glass panes stand in a triangle on a floating obsidian mirror plinth. A glass prism with an energy core hovers at the centre, silk ribbons of orange light weave through the frames, and a light shaft falls from above, with the shared world's mountains and sun behind.

- **Layout.** On desktop the headline owns the left of the frame and the sculpture the right. On phones the sculpture is framed above the copy.
- **Opening.** The camera glides in and the light fades up while the frames rise out of the plinth one by one and the ribbons draw themselves. Meanwhile the headline rises line by line and a sweep of light crosses "We engineer the future."
- **Interaction.**
  - Mouse: parallax, and the frame nearest the cursor leans in and warms.
  - Hover and click: "Ignite" on the prism (an energy surge, a shockwave and a white-gold charged palette); "Align" on the frames (they turn into a triptych facing you).
  - Scroll: the frames open, the sculpture turns and the ribbons rise as you scroll away.
  - Idle: the sculpture rotates slowly and the ribbons keep flowing.
- **Fallback.** Without WebGL the hero shows a still of the sculpture (`public/media/brand/hero-still.jpg`).

The previous layered-mountain hero (`blocks/LayeredHero.jsx`) is kept in the project, because inner pages still use its `PageHorizon`.

## Sections at a glance

- **Create / Engineer / Scale** (`GiantType` in `blocks/Cinematic.jsx`) is a pinned title sequence: one word at a time, each rising out of depth letter by letter with its caption, then drifting toward the viewer. Reduced-motion visitors see the three words stacked.
- **Portfolio** cards (`ProjectCard` in `blocks/Work.jsx`) use one 4:5 frame, a slow hover zoom and clear category, service, title and client. Clicking opens a project page in the player (`components/Lightbox.jsx`): HD video, the project's real details only, "Start a similar project" and more projects.
- **Divisions** open with a "Media Production / TriWeb / Software & AI" line. Cards carry a division identity (`<TiltCard division="media|software">`): film perforations for Media, blueprint dots and corner marks for Software & AI.
- **Cards** have depth at rest; when engaged they tilt, lift their heading and icon forward, glow softly in orange and redraw their icon line by line.
- **Final call to action** is a full-screen moment over the 3D star with one button: "Start your project".

## Tech

React 19 + Vite, Tailwind CSS 4, GSAP (ScrollTrigger, SplitText), Lenis smooth scrolling, Three.js, Lucide icons. Fonts are Outfit (brand typeface) and JetBrains Mono, both self-hosted.

The 3D background pauses when the tab is hidden and caps its resolution. It uses fewer shapes on phones. `prefers-reduced-motion` turns off smooth scrolling, autoplay, transitions and scroll animations.
