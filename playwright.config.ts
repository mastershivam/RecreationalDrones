import { defineConfig, devices } from '@playwright/test';

// Set E2E_PORT to run alongside another test run (for example from a second terminal or session).
const PORT = Number(process.env.E2E_PORT ?? 8787);

export default defineConfig({
	testDir: './e2e',
	testMatch: '**/*.e2e.ts',
	fullyParallel: true,
	// Every test on the map page runs a software-rendered globe, so too many at once starve each other of CPU.
	// A CI runner has 4 CPUs and each shard runs on its own runner, so it can run one more at a time than a laptop.
	workers: process.env.CI ? 3 : 2,
	// A retry that passes is reported as "flaky", so it still shows up.
	retries: 1,
	expect: { timeout: 10_000 },
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: `http://127.0.0.1:${PORT}`,
		trace: 'retain-on-failure',
		// Locally, use the Chrome that is already installed. CI installs Playwright's own Chromium.
		channel: process.env.CI ? undefined : 'chrome',
		// The map needs WebGL, which headless Chrome only has through software rendering.
		launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'], channel: process.env.CI ? undefined : 'chrome' } },
		{ name: 'mobile', use: { ...devices['Pixel 7'], channel: process.env.CI ? undefined : 'chrome' } },
	],
	// Test the real Workers runtime serving the built site and the basemap from R2, not the Astro dev server.
	// Production differs from dev (static assets ignore HTTP range requests, for example), and that difference
	// has already caused a bug. The local R2 bucket is seeded with the small test basemap in data/.
	webServer: {
		command: [
			'npm run build',
			'wrangler r2 object put recreationaldrones-tiles/basemap.pmtiles --file data/basemap.pmtiles --local',
			`wrangler dev --port ${PORT} --ip 127.0.0.1`,
		].join(' && '),
		url: `http://127.0.0.1:${PORT}`,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
	},
});
