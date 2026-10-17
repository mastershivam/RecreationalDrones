# Design principles

The site should feel like an expedition, with an immersive dark globe and bold accents, while remaining something people can rely on before they fly. Adventure shapes the look; accuracy and legibility come first.

Name, logo, colour names and component rules are in [BRAND.md](BRAND.md). It is a proposal until the name and logo are approved.

## Principles

1. **Trust before flair.** Every rule shows its source and last-verified date. Anything unchecked reads "Not yet verified" in the warning color, never a guess. Decoration must never make a rule harder to read.
2. **The globe is the product.** The home page is the globe. Keep chrome small and let the globe fill the screen. Anything that overlaps it must be translucent and compact, and information appears in place (see Country popups) rather than sending people away from it.
3. **One accent, used for meaning.** Amber (`--color-accent`) marks primary actions. On the map, a country with a guide glows in the color of its rules level (see Rules levels). Don't use either for decoration, so the covered countries keep standing out.
4. **Dark and calm.** Dark by default, and light when the visitor's system asks for it (`prefers-color-scheme`). The light theme changes only the page and its panels; the globe and its map colors (`--map-text`, ocean, land, night) stay dark in both, so the headline over it uses the map tokens. Every text pair is contrast-tested in both themes. Surfaces are layered (bg → surface → raised) and told apart by tone, not by outlines, blur or heavy shadows. Shapes are soft: large radii, and pill-shaped controls (`--radius-lg`, `--radius-pill`). Page titles are large and tight (`--text-2xl`).
5. **Readable first.** Body text is at least 7:1 on its background and secondary text 4.5:1. Links stay underlined, so color is never the only cue.
6. **Works everywhere.** Mobile first. Respect `prefers-reduced-motion`. Every control is reachable by keyboard with a visible focus ring, and by touch (see Mobile).
7. **Light on the wire.** One self-hosted variable font (Inter Tight, from `@fontsource-variable/inter-tight`, served from our own origin) with system fonts as the fallback, no external font or tracking requests, no UI libraries. It must stay cheap to host. The one allowed exception is Cloudflare's cookieless Web Analytics beacon, once a token is set (see the launch checklist).

## Mobile

Design for a 375px-wide phone first, then widen.

- No page may scroll sideways. Long text and URLs wrap (`overflow-wrap`).
- Touch targets are at least 44px tall. Nav links get padding for this.
- Use `dvh`, not `vh`, for full-height layouts, so phone browser toolbars don't cut content off. The home page globe fills the space between header and footer through the `fill` prop on `Base.astro`.
- Respect safe areas (`env(safe-area-inset-*)`) on notched phones.
- The globe fits the screen on load (`initialZoom`), ignores tilting (`pitchWithRotate: false`), and taps look for a country within `TAP_RADIUS_PX` of the finger. Never require pixel-perfect taps.
- Overlays on the globe stay small and fade away on the first drag. The country modal is the exception: it is meant to be large, and fits the screen (with a close button of at least 44px).
- Write hints for touch and mouse alike ("tap" rather than "click").

## Home page

- **The headline is the first screen.** "Where can you fly?" is set large (`--text-hero`) over the globe with no card behind it, followed by one line naming the three things to do: search, spin, tap. It folds away on the first drag. On a phone only the headline and the one line remain. The globe is oversized on big screens (`initialZoom`), so it runs off the edges.
- **Search is the main action.** 56px tall and centred, with a `/` hint on a keyboard, a "Near me" label on the locate button until it has been used once, and chips under it for the countries opened last (kept in this browser only) and a few popular ones. The Countries page in the header is the list view, with the same data as text.
- **Motion has a purpose.** The headline, search and chips rise in one after another; a covered country lifts under the pointer and pulses once when picked; the globe spins slowly until the first touch or key (never with reduced motion); the country sheet slides in. All of it stops under `prefers-reduced-motion`. Every button has a pressed state.
- **Deep links.** `/?country=JPN` opens that country's summary, and the address follows the open sheet.

## Country popups

Country information shows on the globe, not on a new page. Clicking never navigates away.

- **Hover** (mouse only) shows a small read-only preview: the level, who must register and the fee. It has no links, so it can't be clicked into.
- **Click or tap** opens a large modal with the whole guide: the same content as the country's guide page (facts, written guide, sources). The page and the modal render one shared component, `CountryGuide.astro`, so they can't drift apart. The guide pages still exist for sharing and for search engines.
- **The sheet** opens with the level as a badge (number and name, in the level's color), then the verdict in one sentence (the guide's `restrictivenessReason`), the facts, and the single amber "Register online" button. On a desktop it slides in from the right; on a phone it rises from the bottom.
- The modal is a native `<dialog>`, so it traps focus, closes with Escape, and returns focus afterwards. It also closes with the X or by clicking the dimmed area. Its content scrolls inside it, and it never grows past the screen.
- Unchecked facts read "Not yet verified", never blank.
- Preview text is built from guide data through `popupHtml`, which escapes it. Never put raw guide text into HTML.

## How to register

Every guide has a `howToRegister` block in its frontmatter, drawn by `CountryGuide.astro` as a "How to register" section above the written guide: what to have ready, numbered steps, then cost (the `registrationFee`), how long it lasts, and what to do afterwards. It is the short version for someone who wants the steps, so the map's summary leaves it out and links to the guide page for it.

- **Only what the authority's pages say.** A step the sources do not give is not written. A missing fee, term or next step is `null` and shows as "Not yet verified". For the EU the steps are EASA's, and "have ready" says plainly that the national list has not been read.
- **Steps say what to do, never that you may fly.** A test fails on "you can fly", "allowed to fly" or "safe to fly".
- **Visitors get their own step** where the rules differ: the US Notice of Identification, Canada's Foreign SFOC-RPAS, Australia's permission, Nepal's in-person registration.
- The future registration tracker (see TODO.md) should read these steps, so keep each step to one action.

## Rules levels

Each guide has a `restrictiveness` level from 1 to 4 and a `restrictivenessReason`, and the map paints the country in that level's color. It is our judgement from the official sources, so the criteria are written in one place, `src/lib/restrictiveness.ts`, and shown on the map's Key and the countries page.

1. **No restrictions:** no registration and no test for recreational flyers. The flying rules (height, distance from people) still apply.
2. **Basic restrictions:** register online, with at most an online test. No in-person step and no permission before flying.
3. **Complex restrictions:** more than an online form and an online test: an in-person step, a second authority, a local phone number, or permission before flying.
4. **Fully restricted:** flying for fun is banned or needs a government licence.

- **Colors** are `--color-level-1` to `--color-level-4`. They fall in lightness as well as changing hue (adjacent levels differ by at least 1.2:1, tested), so they stay apart for people who cannot tell the hues apart. Each is tested against land.
- **Not covered yet.** A country with no guide is drawn in `--color-uncovered`, quieter than land that has one, and the Key says so ("Not covered, which does not mean unrestricted"). The Key lists it apart from the four levels.
- **Color is never the only cue (principle 5).** The level is written out ("Basic restrictions") in the hover preview, the summary, the guide page and the countries page, and the Key names all four.
- **A level is a judgement, so say why.** The guide's `restrictivenessReason` is one plain sentence, from the sources the guide cites. For the EU, the level is EASA's common baseline; a state's own steps are not yet read and may raise it.
- **Not a verdict.** A level says how much paperwork there is, never whether you may fly somewhere (see Voice).

## Zones layer

Places that matter for flying are drawn on the globe from the zone files in `data/zones/` (see the README, Map data). The page loads them after the globe is up, as `/data/zones.json`, which the build makes from every zone file and fails on any file that breaks the schema.

- **Airport circles for every country.** A country with a guide gets a circle round each airport, sized by its own authority's rule. `src/lib/airport-rules.ts` holds the rules, and a test fails until a new guide has one. Where the real zone is not a circle (the UK's), the circle is the smallest size the authority documents, the zone says it is *indicative*, and its note says what the circle leaves out.
- **Shown only from zoom 6.** Before that a 5 km circle is a few pixels, and a world of dots is noise that would catch taps meant for a country.
- **Color is never the only cue.** Airport zones are dashed outlines in `--color-zone-airport` with a dot at the middle. Places that need approval are solid outlines in `--color-zone-approval`. A model aircraft field is a ring in body-text color. The filter's boxes draw each one the same way. Zones never use the level colors or amber, which mean "we have a guide" and "act" (principle 3). Both zone colors are tested for contrast against land and sea.
- **The filter** is a small `Zones` panel with a labelled box per group (airport zones, approval needed or restricted, model aircraft fields), all on to start with. It is open on a desktop and a closed tab on a phone, its rows are at least 44px tall, and it sits clear of MapLibre's attribution bar, which spreads across the bottom of a narrow screen.
- **The key and the filter are two separate things.** The key is a row of chips (the four levels and "Not covered yet") for reading the map; tapping a chip says what it means in a line above the row, and tapping it again puts the words away. The `Zones` filter (the boxes) is for changing the map. The key never resizes or moves because of the filter or its own definition (which floats above it), and neither is inside the other. On a wide desktop the filter is bottom-left and the key bottom-right; on narrower screens they stack bottom-left with the key at the bottom, and the filter is a closed tab on a phone. Only they catch taps; the space between is the globe.
- **Popups.** Hover (mouse only) shows a read-only preview with what the place is, its note, the source's domain and the date, but no link. Click or tap opens a small popup with the same text and a link to the source. A zone under the pointer wins over the country under it, and a country's full guide opens from anywhere else in it. Where zones overlap, the popup lists each one and scrolls if the list is long. The tap popup has a "See this country's rules" button, which opens the country's summary, since a zone under a tap wins over the country. An outline (a Royal Park) also gets a dot at its middle, so it can be seen and tapped from afar.
- **Wording.** A zone says what a place is and who says so, never that you may fly there. A model aircraft field says it is not an approval. Data that cannot load says so plainly ("Zones could not be loaded. The map still works.") and never looks like "no zones here".
- **Not on the map yet:** temporary restrictions and NOTAMs, which change within hours. The site links to the authority's live source instead.

## Trip planner, comparing and saving

- **`/trip/`** puts the chosen countries side by side in one table (rules, who must register, fee, registration weight, minimum age, Remote ID, insurance, register link), so it is the compare view too. The choice lives in the address (`?c=japan,germany`), so a trip can be shared. Anything unchecked reads "Not yet verified".
- **The sheet** has a weight check ("My drone weighs ___ g"), answered from the guide's registration weight in words that say where registration starts and never that a flight is allowed (`weightAnswer`). Its bottom-sheet form on a phone has a grip that can be dragged down to close it.
- **Saved countries** are kept in this browser only. A saved country is a chip with a star; when its guide is checked after the visitor last opened it, the chip says "(updated)".
- **Region filter** on the Countries page: `src/lib/regions.ts` gives each guide a region, and a test fails for a guide without one.
- **Guide pages** show the country's outline (`outline.ts`, built from the map's own shapes, mainland only), a quick-facts strip, and BreadcrumbList and FAQ data for search engines. Each guide has its own social card, `public/og/<slug>.png`, made by `npm run build:og`.

## Search and location

- **Search** is a box at the top left with a list of matching countries (case and accents ignored). Picking one spins the globe there and opens its summary. It works with a keyboard (arrows and Enter), and with reduced motion the globe jumps instead of flying.
- **Use my location** is a button inside the search box. It asks the browser for the position, flies the globe there (or jumps, with reduced motion), puts a marker on it, says which country it is in, and opens that country's summary if there is a guide. If there is none, it says so. Refused permission, a timeout and a failure each get a plain message that points back to search.
- **Privacy.** The position is used only in the page, to find the country from the shapes the map already loads. It is never sent, stored or logged, and the button's tooltip says so. A test fails if any request carries it. Ask for it only when the button is pressed, never on load.

## Day and night

The globe shades the night side of the Earth, computed from the current time ([daynight.ts](src/lib/daynight.ts)) and refreshed every minute. Daylight countries show at full brightness. Night uses `--color-night` as a translucent overlay with a soft edge.

- The overlay sits under borders and labels, so those stay readable at night.
- Land and borders must stay distinguishable on the night side. When changing map colors, check the night side, not just the day side.
- Shading is decoration, not data. Never use it to say anything about whether flying is allowed.

## Tokens

All design values live in [src/styles/tokens.css](src/styles/tokens.css), the single source of truth.

- Use `var(--token)` in CSS. Never hard-code a color, font size, or spacing value in a page or component.
- Map colors are read from the same tokens at runtime ([map-config.ts](src/lib/map-config.ts)), so change them only in `tokens.css`.
- Colors must be 6-digit hex. [tokens.test.ts](src/styles/tokens.test.ts) checks contrast for every text/background pair, and a change that fails readability fails the tests.
- To add a token: add it to `tokens.css`; if it's a text or UI color that sits on another color, add its pair to the test.

## Components and patterns

- **Page layout:** `Base.astro` provides the header, footer and disclaimer. Text pages wrap content in `.prose` (readable width and padding).
- **Cards:** use `.card` for grouped facts (e.g. the rules list on a country page).
- **Unverified values:** use `<Unverified />` ([src/components/Unverified.astro](src/components/Unverified.astro)). Don't write your own wording.
- **Muted text:** `.muted` for secondary information such as dates and hints.
- **Navigation:** the link for the page you are on has `aria-current="page"`, set by `isCurrent` in [src/lib/nav.ts](src/lib/nav.ts), and is bold as well as recolored. The first tab stop on every page is a "Skip to content" link to `main#main`.
- **Reading width:** paragraphs and list items inside `.prose` stop at 65 characters. Headings use `text-wrap: balance`.
- **Not found:** `src/pages/404.astro` is served, with a 404 status, for any unknown address (`not_found_handling` in `wrangler.toml`).
- **Interaction states:** every link or button that reacts to the pointer also has a pressed state, and transitions are short (150 ms). The reduced-motion rule in `global.css` turns them off.
- **Shadows:** none by default (principle 4). A floating preview may use a shadow built from a token with `color-mix`, never a raw `rgb()` color. A test fails on any hard-coded color or font size in a page or component.

## Voice

Plain, direct and safety-minded. Say what the rule is and who it comes from. Avoid hype and legal claims. We give guidance and never say "you are allowed to fly here".

## Checklist for new UI

- Uses tokens only, with no raw colors or sizes.
- Readable at 375px wide and with keyboard only.
- Anything showing a rule also shows its source and date, or `<Unverified />`.
- Covered by a unit test if it adds logic.
