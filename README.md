# Recreational Drones

A map of recreational drone rules by country. It's a static Astro site with a MapLibre map and one MDX guide per country.

## Develop

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to dist/
npm test           # Vitest unit tests, including every country guide's frontmatter
npm run test:e2e   # Playwright end-to-end tests in Chrome, against the real Workers runtime
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

Phase 1 (foundations) is done. The basemap is Protomaps, with deep-zoom tiles served from R2 (see below). Next is airport restriction layers.

## Map data

Everything the map loads comes from this site, so there are no third-party requests.

| File | What it is | How to rebuild |
|---|---|---|
| R2 bucket `recreationaldrones-tiles`, object `basemap.pmtiles` | The **production** basemap: Protomaps (OpenStreetMap data), zoom 0-7, about 189 MB. Private. The Worker serves it at `/tiles/basemap.pmtiles` | `pmtiles extract https://build.protomaps.com/<YYYYMMDD>.pmtiles data/basemap-deep.pmtiles --maxzoom=7`, then upload it (see below). `data/basemap-deep.pmtiles` is git-ignored |
| `data/basemap.pmtiles` | A small **test** basemap, zoom 0-5, about 15 MB, committed. Used by `npm run dev` and the end-to-end tests, so nobody needs R2 or the big file to work on the site | `pmtiles extract https://build.protomaps.com/<YYYYMMDD>.pmtiles data/basemap.pmtiles --maxzoom=5` ([pmtiles CLI](https://github.com/protomaps/go-pmtiles/releases)) |
| `public/data/countries.geojson` | Country shapes the map uses to highlight and link guides (Natural Earth 50m, public domain) | `npm run build:countries` |
| `data/zones/*.geojson` | **Zones**: places that matter for flying, one file per country and source (GeoJSON, one zone per line, with a `meta` block giving source, licence and when it was fetched or last checked). The build combines each country's files into `/data/zones/<iso3>.json`, which the map fetches when it reaches the country, and draws them from zoom 6 (see DESIGN.md, Zones layer). `*-airports`: a circle round every airport in each country with a guide, sized by its authority's rule (UK 2 nautical miles, indicative; Nepal 5 km; Thailand 9 km; Canada 3 nautical miles and Australia 5.5 km, both indicative), positions from OurAirports (public domain); every new country needs a rule in `src/lib/airport-rules.ts`. `*-model-fields`: model aircraft fields mapped in OpenStreetMap (ODbL), from Geofabrik extracts; thin coverage (52 in the UK, 1 in Thailand, none in Nepal). `gbr-royal-parks`: the eight London areas the Royal Parks policy says need NATS or London Heliport approval, with OpenStreetMap outlines. `gbr-curated`: Richmond Park Flying Field. A zone says what a place is and who says so, never that you may fly there | `npm run build:zones` (airports); `npm run build:fields` (model fields; needs `uv`, downloads about 3 GB into `data/osm/`, which git ignores); the two `gbr-` files are edited by hand. A weekly GitHub Actions job (`.github/workflows/refresh-data.yml`) rebuilds the airport files and opens a pull request, and opens an issue for guides and hand-checked files not checked for six months (`node scripts/check-stale.ts`) |
| `public/fonts/` | Noto Sans glyphs for labels (Latin, Greek and Cyrillic ranges only, OFL licence). Names in other scripts may show gaps | Copy from [protomaps/basemaps-assets](https://github.com/protomaps/basemaps-assets) |

The map zooms one level past the tiles and enlarges them, so detail softens beyond zoom 7 in production (beyond 5 in dev).

### Deep-zoom tiles on R2

A PMTiles file is read in small pieces with HTTP byte ranges, and Cloudflare Workers static assets ignore those and send the whole file, which once left the deployed map blank. So the file lives in a private R2 bucket and the Worker (`src/worker.ts`, using `src/lib/tile-server.ts`) answers range requests for `/tiles/basemap.pmtiles` itself. Only `/tiles/*` runs the Worker (`run_worker_first` in `wrangler.toml`), and every other request is a plain static asset.

**One-time setup, before the first deploy.** The deploy fails if the bucket named in `wrangler.toml` does not exist, so do this first (it needs your Cloudflare login):

```sh
npx wrangler login
npx wrangler r2 bucket create recreationaldrones-tiles
npx wrangler r2 object put recreationaldrones-tiles/basemap.pmtiles --file data/basemap-deep.pmtiles --remote
```

Then push. To change the tiles later, run the **Refresh basemap** workflow from the Actions tab (below), or extract a new file and run the last command again. Visitors may see the old one for up to a day, because responses are cached for 24 hours.

**Refreshing the tiles from GitHub.** `.github/workflows/refresh-basemap.yml` (Actions tab, "Refresh basemap", Run workflow) takes the newest Protomaps build of the last 7 days (or the `YYYYMMDD` you type), cuts it to zoom 0-7, checks its size and zoom range, saves the live file as `basemap-previous.pmtiles` in the bucket, uploads the new one, and checks the live site now serves a file of that size. It is manual because it changes what every visitor sees. Tick "Dry run" to do everything except the upload. Before the first real upload, add two repository secrets: `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` (a token with "Workers R2 Storage: Edit" for your account). To roll back, copy `basemap-previous.pmtiles` back over `basemap.pmtiles` with `wrangler r2 object get` and `put` (`--remote`). The committed test basemap is a fixed fixture and is not refreshed, so git history does not grow.

**Plan limits to know about.** A map load makes dozens of tile requests, and each one runs the Worker and reads R2. On the free Workers plan that is capped at 100,000 Worker requests a day, which is roughly a few thousand map loads. The Workers Paid plan ($5 a month) raises it to 10 million a month. R2 reads (10 million a month free) are unlikely to be the limit. If traffic outgrows this, serve the bucket publicly on a custom domain instead and change the URL in `src/lib/map-style.ts`.

**Known blemish.** The country highlight uses Natural Earth 50m shapes, which are coarser than the OpenStreetMap coastline, so at zoom 6 and 7 the highlight can spill a little over the sea.

See [TODO.md](TODO.md) for what's planned next.

## Licensing

Basemap © OpenStreetMap contributors (ODbL) via Protomaps, credited on the map. Natural Earth is public domain. Check each national dataset's licence before redistributing it.
