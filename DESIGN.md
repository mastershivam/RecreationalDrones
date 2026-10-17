# Design principles

The site should feel like an expedition, with an immersive dark globe and bold accents, while remaining something people can rely on before they fly. Adventure shapes the look; accuracy and legibility come first.

Name, logo, colour names and component rules are in [BRAND.md](BRAND.md). It is a proposal until the name and logo are approved.

## Principles

1. **Trust before flair.** Every rule shows its source and last-verified date. Anything unchecked reads "Not yet verified" in the warning color, never a guess. Decoration must never make a rule harder to read.
2. **The globe is the product.** The home page is the globe. Keep chrome small and let the globe fill the screen. Anything that overlaps it must be translucent and compact, and information appears in place (see Country popups) rather than sending people away from it.
3. **One accent, used for meaning.** Amber (`--color-accent`) marks "we have a guide for this" on the map, plus primary actions. Don't use it for decoration, so the covered countries keep standing out.
4. **Dark and calm.** One dark theme. Surfaces are layered (bg → surface → raised) with thin borders instead of heavy shadows.
5. **Readable first.** Body text is at least 7:1 on its background and secondary text 4.5:1. Links stay underlined, so color is never the only cue.
6. **Works everywhere.** Mobile first. Respect `prefers-reduced-motion`. Every control is reachable by keyboard with a visible focus ring, and by touch (see Mobile).
7. **Light on the wire.** System fonts, no external font or tracking requests, no UI libraries. It must stay cheap to host.

## Mobile

Design for a 375px-wide phone first, then widen.

- No page may scroll sideways. Long text and URLs wrap (`overflow-wrap`).
- Touch targets are at least 44px tall. Nav links get padding for this.
- Use `dvh`, not `vh`, for full-height layouts, so phone browser toolbars don't cut content off. The home page globe fills the space between header and footer through the `fill` prop on `Base.astro`.
- Respect safe areas (`env(safe-area-inset-*)`) on notched phones.
- The globe fits the screen on load (`initialZoom`), ignores tilting (`pitchWithRotate: false`), and taps look for a country within `TAP_RADIUS_PX` of the finger. Never require pixel-perfect taps.
- Overlays on the globe stay small and fade away on the first drag. The country modal is the exception: it is meant to be large, and fits the screen (with a close button of at least 44px).
- Write hints for touch and mouse alike ("tap" rather than "click").

## Country popups

Country information shows on the globe, not on a new page. Clicking never navigates away.

- **Hover** (mouse only) shows a small read-only preview of the key facts. It has no links, so it can't be clicked into.
- **Click or tap** opens a large modal with the whole guide: the same content as the country's guide page (facts, written guide, sources). The page and the modal render one shared component, `CountryGuide.astro`, so they can't drift apart. The guide pages still exist for sharing and for search engines.
- The modal is a native `<dialog>`, so it traps focus, closes with Escape, and returns focus afterwards. It also closes with the X or by clicking the dimmed area. Its content scrolls inside it, and it never grows past the screen.
- Unchecked facts read "Not yet verified", never blank.
- Preview text is built from guide data through `popupHtml`, which escapes it. Never put raw guide text into HTML.

## Zones layer

Places that matter for flying are drawn on the globe from the zone files in `data/zones/` (see the README, Map data). The page loads them after the globe is up, as `/data/zones.json`, which the build makes from every zone file and fails on any file that breaks the schema.

- **Airport circles for every country.** A country with a guide gets a circle round each airport, sized by its own authority's rule. `src/lib/airport-rules.ts` holds the rules, and a test fails until a new guide has one. Where the real zone is not a circle (the UK's), the circle is the smallest size the authority documents, the zone says it is *indicative*, and its note says what the circle leaves out.
- **Shown only from zoom 6.** Before that a 5 km circle is a few pixels, and a world of dots is noise that would catch taps meant for a country.
- **Color is never the only cue.** Airport zones are dashed outlines in `--color-zone-airport` with a dot at the middle. Places that need approval are solid outlines in `--color-zone-approval`. A model aircraft field is a ring in body-text color. The panel's key draws each one the same way. Zones are never amber, which means "we have a guide" (principle 3). Both zone colors are tested for contrast against land and sea.
- **The filter** is a small `Zones` panel with a labelled box per group (airport zones, approval needed or restricted, model aircraft fields), all on to start with. It is open on a desktop and a closed tab on a phone, its rows are at least 44px tall, and it sits clear of MapLibre's attribution bar, which spreads across the bottom of a narrow screen.
- **Popups.** Hover (mouse only) shows a read-only preview with what the place is, its note, the source's domain and the date, but no link. Click or tap opens a small popup with the same text and a link to the source. A zone under the pointer wins over the country under it, and a country's full guide opens from anywhere else in it. Where zones overlap, the popup lists each, up to three.
- **Wording.** A zone says what a place is and who says so, never that you may fly there. A model aircraft field says it is not an approval. Data that cannot load says so plainly ("Zones could not be loaded. The map still works.") and never looks like "no zones here".
- **Not on the map yet:** temporary restrictions and NOTAMs, which change within hours. The site links to the authority's live source instead.

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
