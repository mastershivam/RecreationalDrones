# Recreational Drones

A map of recreational drone rules by country. It's a static Astro site with a MapLibre map and one MDX guide per country.

## Develop

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to dist/
npm test           # Vitest unit tests, including every country guide's frontmatter
npx astro check    # type-checks and validates every country guide
```

## Design

See [DESIGN.md](DESIGN.md) for the design principles. All colors, type and spacing are tokens in `src/styles/tokens.css`.

## Adding a country

Create `src/content/countries/<slug>.mdx`. The frontmatter schema is in `src/lib/country-schema.ts`, and the build fails if a guide doesn't match it.

- `iso3` must be the country's ISO 3166-1 alpha-3 code (e.g. `GBR`). The map uses it to link the country to its guide.
- Use `null` for any rule you haven't checked against an official source. The page then shows "Not yet verified" instead of a guess.
- Every guide needs at least one official `sources` URL and a `lastVerified` date.

## Deploy (Cloudflare Workers)

The site is static files served by Cloudflare Workers static assets (see `wrangler.toml`). In the Cloudflare dashboard, go to Workers & Pages → Create → Import a repository, pick this repo, and use:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Environment variable: `NODE_VERSION=22`

The Worker name in the dashboard must match `name` in `wrangler.toml` (`recreationaldrones`). To deploy from your machine instead, run `npm run build && npx wrangler deploy` after `npx wrangler login`.

GitHub Actions (`.github/workflows/ci.yml`) runs tests, type-checks and builds every push and PR. Cloudflare handles the deploy.

## Status

Phase 1 (foundations) is done, and the basemap is now Protomaps. Next is airport restriction layers, and optionally moving the tiles to R2 for deeper zoom.

## Map data

Everything the map loads is served from this site, so there are no third-party requests.

| File | What it is | How to rebuild |
|---|---|---|
| `public/tiles/basemap.pmtiles` | Protomaps basemap (OpenStreetMap data), zoom 0-5, about 15 MB | `pmtiles extract https://build.protomaps.com/<YYYYMMDD>.pmtiles public/tiles/basemap.pmtiles --maxzoom=5` ([pmtiles CLI](https://github.com/protomaps/go-pmtiles/releases)) |
| `public/data/countries.geojson` | Country shapes the map uses to highlight and link guides (Natural Earth, public domain) | `npm run build:countries` |
| `public/fonts/` | Noto Sans glyphs for labels (Latin ranges only, OFL licence) | Copy from [protomaps/basemaps-assets](https://github.com/protomaps/basemaps-assets) |

The tiles stop at zoom 5, and the map enlarges them beyond that, so detail gets soft when zoomed right in. Cloudflare Pages limits files to 25 MB. For deeper zoom, host a bigger extract on R2 and change `BASEMAP_URL` in `src/lib/map-style.ts`.

## Licensing

Basemap © OpenStreetMap contributors (ODbL) via Protomaps, credited on the map. Natural Earth is public domain. Check each national dataset's licence before redistributing it.
