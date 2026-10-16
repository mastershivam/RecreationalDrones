# Brand and design spec

This is the brand layer on top of [DESIGN.md](DESIGN.md): the name, logo, colours, type and component rules. DESIGN.md says how the product behaves. This file says how it looks and sounds. Nothing here is applied to the site yet, because the name and logo need your decision first (see "Decisions needed").

Logo files are in [brand/](brand/). View them in a browser or on GitHub.

## Decisions needed

| # | Decision | My recommendation |
|---|---|---|
| 1 | Site name | **Flyable**, with "drone rules by country" as the descriptor |
| 2 | Tagline | **Know before you fly.** |
| 3 | Logo | The globe split by the day and night line, with a small amber drone over the Atlantic Ocean (below) |
| 4 | Domain | Register once you have chosen. See the name section for what I found |

The palette needs no decision. It is the one the site already uses, now with names and a written spec.

## 1. Name

**Recommendation: Flyable.**

- It answers the question the site answers: "is it flyable here?" Pilots already use the word ("flyable conditions"), so it sounds natural without being a drone cliché.
- Seven letters, easy to say and spell, and it works for a site that may cover more than recreational drones later.
- It says nothing about a country, so the site can grow from the UK guide to the whole globe.
- "Recreational Drones" is a fine **descriptor** ("Flyable: drone rules by country") but a weak name. It is generic, so it is hard to search for, hard to protect and easy to confuse with other sites.

**Runners-up**

| Name | For | Against |
|---|---|---|
| Sky Rules | Playful, short, memorable | "Sky" is a large UK media and telecoms brand, which is a real objection risk |
| Drone Atlas | Says exactly what it is | Descriptive, forgettable, hard to trademark |

**Rejected**

| Name | Why |
|---|---|
| Fly Atlas | `flyatlas.com` is an aviation company, and `flyatlas.app` is an airline-training product. Same industry, so it would be confused with them |
| Flyway | A well-known database migration tool already owns the name in search |
| Almost every short `.com` | Taken. This is normal, not a sign that the idea is bad |

**What I checked, and what I could not**

I looked up DNS records for candidate domains. A name with no DNS records is only *possibly* unregistered: **this is not a registration check, and I did not run a trademark search.**

| Domain | What I saw |
|---|---|
| `flyable.com` | Parked, "for sale". Expect a premium price |
| `flyable.app`, `flyable.io` | In use by someone. I could not tell what for |
| `flyable.co.uk`, `flyable.org` | No DNS records, so possibly free |

Before committing, check the name at a domain registrar, and search the [UK IPO trademark database](https://www.gov.uk/search-for-trademark) and the WIPO Global Brand Database. Also look at whatever lives on `flyable.io` and `flyable.app`, in case it is a product in the same space. If it is, pick another name. Everything below works with any name, since the logo mark has no letters in it.

**Tagline: "Know before you fly."** It is short, it names the benefit, and it carries the right message: check first. It must never become a claim of permission. Never write "fly anywhere" or "you can fly here".

## 2. Voice

Plain, direct and safety-minded. It matches the Voice section of DESIGN.md.

- Say what the rule is and who it comes from. Always point to the official source.
- Guidance, not permission: "Check before you fly", never "You are allowed to fly".
- Sentence case everywhere. No exclamation marks. No hype words ("seamless", "unlock", "revolutionary").
- Short sentences. Verbs first on buttons: "Open the full guide".
- Admit what we don't know: "Not yet verified. Check the official source."

## 3. Logo

**Concept.** The real world, seen from space over Europe and Africa, split by the line between day and night, with a small amber drone hovering over the Atlantic Ocean, where the day and night line crosses. It is the site in one picture: a world map with real countries, the live day and night shading that is already on the globe, and a drone meaning "here is where you can fly". The drone is drawn from above as four rotors on an X-shaped frame with a camera at the front, and it is tilted so it looks like it is flying out over the sea. It is the only amber on the mark, which keeps the rule that amber means "we have data here, you can act".

**Files** (in [brand/](brand/))

| File | Use |
|---|---|
| `logo-mark.svg` | The mark alone, on dark backgrounds. Header, social, app tiles |
| `favicon.svg` | The mark on a dark rounded tile with a heavier rim and a bigger, bolder drone. Use for the favicon and app icon, and anywhere under 24 px |
| `logo-lockup.svg` | Mark and wordmark side by side. Header, README, sharing images |
| `logo-mark-mono.svg` | One colour using `currentColor`. Print, stamps, light backgrounds. Land is shown as a lighter tint, with no night crescent |
| `build-logo.mjs` | Generates all four files from the site's own country shapes (see below). Edit this, not the SVGs |

**Construction** (64-unit grid, so it scales cleanly)

- **Globe:** circle, radius 26, centred. Sea is Deep sea `#040b1c`, land is Horizon `#3f5f94`, rim is Mist `#9bb3dd` at 2.5.
- **Land:** the real country shapes from the same Natural Earth data the site uses, drawn as seen from space, centred on 12°E, 28°N (Europe, North Africa and Arabia). Coastlines are simplified so each file stays small (the mark is about 12 KB). Country borders are thin Mist lines at 55 % opacity. They only show at larger sizes, which is the point.
- **Night:** a Night `#02040a` crescent at 55 % on the left, between the rim and an ellipse (radius 10 by 26). Day is the larger part, so the mark is optimistic, not gloomy.
- **Drone:** Beacon `#ff9f1c`, centred at (18.5, 25), which is open ocean at about 28°W, 38°N (near the Azores), off the coast of Portugal and Morocco. Seen from above and tilted 18° clockwise so its camera points up and to the right. An X-shaped frame (strokes 1.5 wide, arms 4.8 from the centre), four rotors (radius 2.4), a body (radius 2.2, outlined in Deep sea so it separates from the frame), and a camera at the front (a small rounded block merged into the body). It is about 12 units across, so it covers little of the map but still reads at small sizes.
- **Favicon version:** a bolder drone (rotors 3.1, arms 5.4, frame 2) and much simpler land (islands dropped, coasts simplified further), on a Midnight tile with a rim of 3.5. Land has a same-colour outline so there are no cracks between countries.
- **To change anything** (the centre of the globe, how much detail, the drone's size or tilt), edit the numbers at the top of `brand/build-logo.mjs` and run it with `npm i --no-save d3-geo && node brand/build-logo.mjs`. `d3-geo` is not a project dependency, because it is only needed for this.

**Rules**

- Clear space around the mark: at least a quarter of its width on every side.
- Minimum size: mark 24 px, lockup 24 px tall. Below 24 px use `favicon.svg`.
- It is designed for dark backgrounds (Midnight or Cabin). On light backgrounds use the mono version, or place the full mark on a Midnight tile.
- Don't recolour the drone. In this product amber always means "we have data here, you can act".
- Don't add a glow, atmosphere or shadow. We deliberately removed the glow from the globe, and the logo follows that.
- Don't move the drone onto land or to the Middle East. It stays over the Atlantic Ocean (a test checks this). Don't flip the day and night line, re-rotate the globe, stretch, or add a second drone, a plane or a flight path. The 18° tilt is part of the logo. Don't straighten it or tilt it further.
- Don't swap the globe for a flat blue circle. The real country shapes are what make it a map.
- Accessible name: "Flyable" (the lockup) or "Flyable logo" (the mark alone). Decorative copies next to the wordmark get empty `alt`.

**Wordmark.** "Flyable" in the system bold font, 34 on a 64-unit height, letter-spacing +0.5. The file uses live text, so **convert it to outlines before using it anywhere other than this site**, so it looks identical on every device. Don't wait for a custom font. The mark carries the personality.

## 4. Colour

The palette is the site's existing palette (`src/styles/tokens.css`), with names so people can talk about it. **The brand needs no token changes.**

Theme: **Night flight.** One dark theme with deep navy surfaces and a single warm amber signal.

| Name | Hex | Token | Role |
|---|---|---|---|
| Midnight | `#0a0e1a` | `--color-bg` | Page background |
| Cabin | `#121a2e` | `--color-surface` | Cards, popups, dialog |
| Cabin raised | `#1a2440` | `--color-surface-raised` | Hover and raised surfaces |
| Dusk | `#2a3658` | `--color-border` | Hairlines and dividers |
| Deep sea | `#040b1c` | `--color-ocean` | Ocean on the globe |
| Night | `#02040a` | `--color-night` | The night shading on the globe |
| Horizon | `#3f5f94` | `--color-land` | Land on the globe |
| Mist | `#9bb3dd` | `--color-land-border` | Country borders, logo rim |
| **Beacon** | `#ff9f1c` | `--color-accent` | **Signature.** Countries with a guide, the logo's drone, primary actions, focus ring |
| On beacon | `#1a1100` | `--color-on-accent` | Text on Beacon |
| Moon | `#eef1fa` | `--color-text` | Body text |
| Fog | `#a4aecb` | `--color-text-muted` | Secondary text |
| Signal | `#6fd3ff` | `--color-link` | Links only |
| Caution | `#ffd166` | `--color-warning` | "Not yet verified" only |

**How much of each.** About 80 % Midnight and Cabin surfaces, about 15 % Horizon, Mist and Deep sea (the globe and structure), and **5 % or less Beacon**. Amber is powerful because it is rare. If a page has amber in three places, remove two.

**One job per colour.** Amber = we have data or you can act. Cyan = a link. Yellow = unverified. Don't borrow one for another job, or the colours stop carrying meaning.

**Contrast** (WCAG 2.x ratios, calculated; the token tests enforce the ones that matter)

| Pair | Ratio | Needs | Result |
|---|---|---|---|
| Moon on Midnight | 17.1 | 4.5 | Pass |
| Moon on Cabin | 15.3 | 4.5 | Pass |
| Fog on Midnight | 8.7 | 4.5 | Pass |
| Fog on Cabin | 7.8 | 4.5 | Pass |
| Signal on Midnight | 11.4 | 4.5 | Pass |
| Signal on Cabin | 10.3 | 4.5 | Pass |
| Caution on Cabin | 12.0 | 4.5 | Pass |
| On beacon on Beacon | 9.1 | 4.5 | Pass |
| Moon on Horizon (labels) | 5.7 | 4.5 | Pass |
| Beacon on Midnight | 9.4 | 3 | Pass |
| Beacon on Horizon (highlight on land) | 3.1 | 3 | Pass, barely |
| Horizon on Deep sea (land on sea) | 3.1 | 3 | Pass, barely |
| Mist on Horizon (borders) | 3.0 | 1.5 | Pass |
| Dusk on Midnight (hairline) | 1.6 | decorative | Fine for dividers only |

Two pairs pass by a hair (3.1 against 3). **Don't darken Horizon or Beacon without re-running the token tests.**

**Dark only.** There is no light theme. If one is ever added, it needs its own palette and its own contrast checks, not an inversion.

**Not decided: restrictiveness colours.** The to-do list has a four-level colour scale (no restrictions to fully restricted). That scale must not reuse Beacon, because Beacon already means "we have a guide". When it is designed: separate colours that are distinguishable by people with colour blindness, at least 3:1 against Horizon, a legend, and **a second cue other than colour** (pattern or label), as DESIGN.md already requires.

## 5. Typography

System fonts only: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`. This keeps the site fast and free of third-party requests. The personality comes from the mark, the colour and the copy, not from a font download.

| Style | Size | Weight | Line height | Use |
|---|---|---|---|---|
| Display | 2rem | 700 | 1.2 | Page title (h1) |
| Title | 1.25rem | 700 | 1.2 | Section heading (h2), popup title, brand name in header |
| Body | 1rem | 400 | 1.6 | Everything else |
| Small | 0.875rem | 400 | 1.5 | Hints, footer, popup body |
| Label | 0.75rem | 600, uppercase, +0.04em | 1.4 | Fact labels ("WHO MUST REGISTER") |

Don't go below 0.75rem. Use two weights in a block at most. If a custom font is ever added, use one self-hosted variable font under 60 KB, for headings only.

## 6. Layout and components

**Space:** the tokens `--space-1` (4 px) to `--space-5` (48 px). **Radius:** 0.75rem for cards, popups and buttons; fully round for the logo globe and the close button. **Elevation:** flat by default. Popup shadow `0 8px 24px rgb(0 0 0 / 0.5)`, dialog `0 16px 48px rgb(0 0 0 / 0.6)`. Nothing else casts a shadow.

| Component | Spec |
|---|---|
| Header | Mark 28 px, then the wordmark in Title style, then navigation links on the right. Hairline bottom border in Dusk. Height about 49 px |
| Footer | Small, Fog, hairline top border. Always carries the "guidance only, not legal advice" notice |
| Links | Signal, always underlined, never colour alone |
| Primary button | Beacon fill, On beacon text, Title weight, minimum height 44 px, radius 0.75rem. At most one per view |
| Secondary button | Transparent, 1 px Mist border, Moon text, same size. Hover: Cabin raised fill |
| Focus ring | 2 px Beacon, 2 px offset, on every interactive element |
| Card | Cabin, 1 px Dusk border, radius 0.75rem, padding 1 rem by 1.5 rem |
| Hover preview | Cabin card, no links, follows the pointer. Facts in Small |
| Guide dialog | Cabin panel on a Night backdrop at 75 %. Close button 44 px at the top right |
| Unverified | Caution text "Not yet verified". Always this exact wording and colour, never blank |
| Legend | Small, Fog, swatch plus text |

**Touch:** every target is at least 44 px. **Phones:** nothing scrolls sideways, and the dialog fits the screen and scrolls inside itself.

## 7. The globe

These are decisions, not suggestions.

- A 3D globe on the page background, **with no rim, atmosphere or glow** (removed on purpose).
- Land (Horizon) against sea (Deep sea) is at least 3:1, and the token tests enforce it.
- Night: Night overlay at 40 % with a soft blurred edge. It sits under the borders and labels, so those stay readable at night. Shading is decoration, never data.
- Covered country: Beacon fill at 55 % plus a 1.5 px Beacon outline.
- Country labels in Moon, uppercase, on Horizon. Ocean labels in Fog, italic.
- The attribution ("Protomaps © OpenStreetMap") is always visible and never covered.

## 8. Motion

Short and quiet. Hover changes take 150 ms. Popups and dialogs 250 ms. The intro card fade after the first drag takes 400 ms. Everything uses ease-out. **Respect `prefers-reduced-motion`** (already in the global styles). No looping or decorative animation.

## 9. Accessibility

- Text contrast of at least 4.5:1, and 3:1 for large text and graphics, as in the table above.
- Colour is never the only cue (links are underlined, unverified is worded, the globe highlight is also in the hover preview).
- Visible focus ring on everything. Dialog closes with Escape and the close button.
- Logo text alternatives as in the logo rules.

## 10. Sharing and icons

| Asset | Spec |
|---|---|
| Favicon | `brand/favicon.svg`, plus a 32 px PNG for old browsers |
| App icon | 180 px PNG of `favicon.svg` (Apple touch icon) |
| Theme colour | `#0a0e1a` (already set) |
| Social image | 1200 × 630 PNG: Midnight background, large mark on the right with the day and night line, the name and tagline on the left in Moon, one amber highlight only |
| Page titles | "{Page} · Flyable". Home: "Flyable: drone rules by country" |
| Description | "Where and how you can fly a recreational drone, country by country. Always check the official source." |

## 11. If you adopt this: what changes in the code

Nothing is changed yet. If you approve the name and logo, the work is small:

1. `src/layouts/Base.astro`: add the mark to the header, change the brand text and the title suffix.
2. `public/favicon.svg`: replace with `brand/favicon.svg`. Add the 32 px and 180 px PNGs, and the social image with its `og:` tags.
3. Home page title and intro wording; README and DESIGN.md headings.
4. Add a "Brand" link at the top of DESIGN.md.
5. Tests: update any end-to-end test that checks the old brand text, and add one that checks the header shows the logo and the favicon exists.
6. **Domain and Worker name.** The Worker is called `recreationaldrones`, and its `workers.dev` address comes from that name. Renaming the Worker changes the address. Better: keep the Worker name and attach your new domain to it in the Cloudflare dashboard. That keeps the existing deploy working.
