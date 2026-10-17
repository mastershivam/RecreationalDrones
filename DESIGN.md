# Design principles

The site should feel like an expedition, with an immersive dark globe and bold accents, while remaining something people can rely on before they fly. Adventure shapes the look; accuracy and legibility come first.

Name, logo, colour names and component rules are in [BRAND.md](BRAND.md). It is a proposal until the name and logo are approved.

## Principles

1. **Trust before flair.** Every rule shows its source and last-verified date. Anything unchecked reads "Not yet verified" in the warning color, never a guess. Decoration must never make a rule harder to read.
2. **The globe is the product.** The home page is the globe. Keep chrome small and let the globe fill the screen. Anything that overlaps it must be translucent and compact, and information appears in place (see Country popups) rather than sending people away from it.
3. **One accent, used for meaning.** Amber (`--color-accent`) marks primary actions. On the map, a country with a guide glows in the color of its rules level (see Rules levels). Don't use either for decoration, so the covered countries keep standing out.
4. **Dark and calm.** One dark theme. Surfaces are layered (bg → surface → raised) with thin borders instead of heavy shadows. Shapes are soft: large radii, and pill-shaped controls (`--radius-lg`, `--radius-pill`). Page titles are large and tight (`--text-2xl`).
5. **Readable first.** Body text is at least 7:1 on its background and secondary text 4.5:1. Links stay underlined, so color is never the only cue.
6. **Works everywhere.** Mobile first. Respect `prefers-reduced-motion`. Every control is reachable by keyboard with a visible focus ring, and by touch (see Mobile).
7. **Light on the wire.** System fonts, no external font or tracking requests, no UI libraries. It must stay cheap to host. The one allowed exception is Cloudflare's cookieless Web Analytics beacon, once a token is set (see the launch checklist).

## Flow field

The look of the site is a **flow field**: fine lines drifting along a smooth noise field, like air or current. It is atmosphere, so it never carries data, never follows real wind, and never implies anything about whether flying is allowed.

- **On the map,** the lines drift over the globe and the space round it. The canvas sits inside the map, above its canvas and below its popups, markers and panels, so nothing readable is ever under a line. It fades out between zoom 3 and zoom 6 (`flowOpacity`), so it is gone before zones appear, and it cannot be tapped.
- **On every other page,** a fixed canvas sits behind the content, strongest at the top and fading out down the page (the map page has its own). Cards are solid, so the text a person reads is never on a line.
- **Colors** are `--color-flow-1` and `--color-flow-2`, which mean nothing. Never use level, zone or accent colors for flow lines, or they would carry meaning.
- **Reduced motion:** the field is drawn once as a still picture and does not move, and it follows the setting if it changes while the page is open.
- **Cost:** about 500 particles on a desktop and 320 on a phone, a canvas capped at 1.5x pixel density, and it pauses when the tab is hidden. If it ever slows the globe, lower `particleCount` before anything else.
- **Where the code is:** the maths is in `src/lib/flow-field.ts` (seeded, so a test can repeat a field exactly) and the drawing in `src/lib/flow-canvas.ts`.

## Launch checklist: what makes it a real site

Each of these is tested in `e2e/launch-checklist.e2e.ts`, so a change that breaks one fails the build.

1. **Custom 404:** `404.astro`, served with a 404 status and kept out of search (`noindex`).
2. **A main action above the fold:** on the map, the search box and the location button. On a guide, the "Register online" button under the title (it goes to the official source if we have no registration page).
3. **A title per page:** the page name, then "· Recreational Drones". Every title is unique and at most 75 characters.
4. **A description per page:** unique, at most 160 characters. A guide's is built from its data (`guideDescription`).
5. **Social image:** `public/og-image.png`, 1200 × 630, made by `node brand/build-icons.mjs`, with `og:*` and `twitter:*` tags and a canonical link on every page.
6. **Icons:** `favicon.svg`, `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` and `site.webmanifest`, all from `brand/favicon.svg`.
7. **robots.txt:** allows the site, keeps crawlers off the 15 MB tile file, names the sitemap.
8. **sitemap.xml:** every page, with a guide's last-checked day. The address comes from `SITE_URL` in `src/lib/site.ts`: change it when a custom domain is attached.
9. **Alt text on every image:** a test fails on any `<img>` without it, and on any decorative canvas that is not `aria-hidden`.
10. **Mobile:** designed for 375 px first, and every browser test runs on a phone-sized project too.
11. **A sticky mobile action:** on a guide, the register button stays at the bottom of a phone screen while you read. The map has no such button because its search box is always on screen.
12. **Fast:** the guide and countries pages are about 26 KB and paint in well under 2 seconds on a throttled phone connection (a test checks it). The map page shows its search box and intro in under 2 seconds, but the globe itself downloads about 1 MB compressed (the map code and country shapes), so on a slow connection it finishes later. Built files are cached for a year (`public/_headers`).
13. **Form error states:** the site has no forms. The search says "No guide for that country yet", and the location button has a message for each way it can fail. If a form is added, give it error states before it ships.
14. **Thank-you page:** not needed, since there is no form. A mistake is reported on GitHub, from a link on every guide.
15. **Privacy page:** `/privacy/`, linked from every footer. It says what is and is not collected, and a test fails if analytics is switched on without the page saying so.
16. **Cookie banner:** none, because the site sets no cookies and stores nothing. A test checks that a visit sets no cookies, no local or session storage, and loads nothing from another site. If that ever changes, add a banner in the same commit.
17. **Analytics:** the code is there and off. Cloudflare Web Analytics is cookieless, and it needs a token from the Cloudflare dashboard in `ANALYTICS_TOKEN` (`src/lib/site.ts`). Until then there are no analytics, and the privacy page says so.
18. **Real contact details:** `/contact/`, which points to the project's GitHub issue tracker (no email is published), and a "Report a mistake" link on every guide that opens a new issue with the country filled in.

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

- **Hover** (mouse only) shows a small read-only preview: the level, who must register and the fee. It has no links, so it can't be clicked into.
- **Click or tap** opens a large modal with the whole guide: the same content as the country's guide page (facts, written guide, sources). The page and the modal render one shared component, `CountryGuide.astro`, so they can't drift apart. The guide pages still exist for sharing and for search engines.
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
- **Color is never the only cue (principle 5).** The level is written out ("Basic restrictions") in the hover preview, the summary, the guide page and the countries page, and the Key names all four.
- **A level is a judgement, so say why.** The guide's `restrictivenessReason` is one plain sentence, from the sources the guide cites. For the EU, the level is EASA's common baseline; a state's own steps are not yet read and may raise it.
- **Not a verdict.** A level says how much paperwork there is, never whether you may fly somewhere (see Voice).

## Zones layer

Places that matter for flying are drawn on the globe from the zone files in `data/zones/` (see the README, Map data). The page loads them after the globe is up, as `/data/zones.json`, which the build makes from every zone file and fails on any file that breaks the schema.

- **Airport circles for every country.** A country with a guide gets a circle round each airport, sized by its own authority's rule. `src/lib/airport-rules.ts` holds the rules, and a test fails until a new guide has one. Where the real zone is not a circle (the UK's), the circle is the smallest size the authority documents, the zone says it is *indicative*, and its note says what the circle leaves out.
- **Shown only from zoom 6.** Before that a 5 km circle is a few pixels, and a world of dots is noise that would catch taps meant for a country.
- **Color is never the only cue.** Airport zones are dashed outlines in `--color-zone-airport` with a dot at the middle. Places that need approval are solid outlines in `--color-zone-approval`. A model aircraft field is a ring in body-text color. The panel's key draws each one the same way. Zones never use the level colors or amber, which mean "we have a guide" and "act" (principle 3). Both zone colors are tested for contrast against land and sea.
- **The filter** is a small `Zones` panel with a labelled box per group (airport zones, approval needed or restricted, model aircraft fields), all on to start with. It is open on a desktop and a closed tab on a phone, its rows are at least 44px tall, and it sits clear of MapLibre's attribution bar, which spreads across the bottom of a narrow screen.
- **Popups.** Hover (mouse only) shows a read-only preview with what the place is, its note, the source's domain and the date, but no link. Click or tap opens a small popup with the same text and a link to the source. A zone under the pointer wins over the country under it, and a country's full guide opens from anywhere else in it. Where zones overlap, the popup lists each one and scrolls if the list is long. The tap popup has a "See this country's rules" button, which opens the country's summary, since a zone under a tap wins over the country. An outline (a Royal Park) also gets a dot at its middle, so it can be seen and tapped from afar.
- **Wording.** A zone says what a place is and who says so, never that you may fly there. A model aircraft field says it is not an approval. Data that cannot load says so plainly ("Zones could not be loaded. The map still works.") and never looks like "no zones here".
- **Not on the map yet:** temporary restrictions and NOTAMs, which change within hours. The site links to the authority's live source instead.

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
