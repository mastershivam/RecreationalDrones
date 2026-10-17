## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Design

Follow [DESIGN.md](DESIGN.md) for any UI change. Use the tokens in `src/styles/tokens.css`; never hard-code colors, sizes or spacing.

## Testing

Every commit is preceded by creating all missing unit, end-to-end and regression tests, then running them all. See CLAUDE.md section 5 for the rule.

- **Unit** tests use Vitest and sit next to the code they cover (`foo.ts` → `foo.test.ts`). Run with `npm test`.
- **End-to-end** tests use Playwright, sit in `e2e/` and are named `*.e2e.ts` (so Vitest ignores them). Run with `npm run test:e2e`. They build the site and serve it with `wrangler dev`, the real Workers runtime, in Chrome (desktop and a phone-sized project). They do not use the Astro dev server, because production behaves differently (static assets ignore HTTP range requests, for example). They seed a local R2 bucket with `data/basemap.pmtiles`, so the Worker serves the map's tile file just as it does in production. Locally they use the Chrome that is installed. In CI, Playwright installs Chromium. The home page has two test hooks: `data-ready="true"` on `#map` when every tile has loaded, and `?e2e` in the URL to expose the map as `window.__map`.
- **Regression** tests pin a fixed bug. Name the bug in the test (see the `serves a byte range` test in `e2e/globe.e2e.ts` for an example) so nobody removes it by mistake.
- Keep logic out of `.astro` files where you can. Put it in `src/lib/` so it can be unit-tested.
- Check that a new test can fail: break the code, watch the test fail, then restore the code.
- Before every commit, run `npm test`, the end-to-end tests, `npx astro check` and `npm run build`. CI runs the same checks.

## Adding a country

1. Write the guide in `src/content/countries/<name>.mdx`, from the authority's own documents (see an existing one).
2. Add its airport rule to `src/lib/airport-rules.ts`: the radius the authority gives, the document it comes from, and a note saying what the rule is and what it leaves out. If the authority gives no distance, write `{ none: 'why' }`.
3. Run `npm run build:zones` to make `data/zones/<iso3>-airports.geojson`, and add a bounding box for the country to `BOX` in `src/lib/zones-data.test.ts`.
4. Add the country to `OTHER` (or the EU list) in `src/lib/regions.ts`, and run `npm run build:og` to make its social card (`public/og/<slug>.png`).
5. Run the tests. `src/lib/zones-data.test.ts` fails until steps 2 and 3 are done.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
