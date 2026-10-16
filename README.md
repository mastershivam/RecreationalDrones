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

## Deploy (Cloudflare Pages)

Connect the repo in the Cloudflare dashboard (Workers & Pages → Create → Pages → Connect to Git) and use these settings:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `NODE_VERSION=22`

GitHub Actions (`.github/workflows/ci.yml`) type-checks and builds every push and PR. Cloudflare handles the deploy.

## Status

Phase 1 (foundations) is done. The basemap is MapLibre's low-resolution demo style, which is a placeholder. Phase 2 replaces it with a Protomaps PMTiles basemap on R2 and adds airport restriction layers.

## Licensing

Map data © OpenStreetMap contributors (ODbL) once OSM-derived layers are added. Check each national dataset's licence before redistributing it.
