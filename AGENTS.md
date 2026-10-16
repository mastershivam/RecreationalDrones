## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Design

Follow [DESIGN.md](DESIGN.md) for any UI change. Use the tokens in `src/styles/tokens.css`; never hard-code colors, sizes or spacing.

## Testing

Write unit tests for each step as you go, not at the end. Every step of a plan ships with tests for the logic it adds, and `npm test` must pass before you move on to the next step.

- Tests use Vitest and sit next to the code they cover (`foo.ts` → `foo.test.ts`).
- Keep logic out of `.astro` files where you can. Put it in `src/lib/` so it can be unit-tested.
- Check that a new test can fail: break the code, watch the test fail, then restore the code.
- Before finishing, run `npm test`, `npx astro check` and `npm run build`. CI runs all three.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
