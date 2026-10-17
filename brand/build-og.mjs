// Makes one social-share card per country guide, public/og/<slug>.png (1200 x 630): the country, its rules level in
// the level's color, and the site name. Colors come from src/styles/tokens.css.
// Run with: node brand/build-og.mjs   (needs Chrome; no other install). Run again when a guide's level or name changes.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { parse } from 'yaml';

const root = new URL('../', import.meta.url);
const tokens = readFileSync(new URL('src/styles/tokens.css', root), 'utf8');
const token = (name) => tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))[1];
const LABELS = ['No restrictions', 'Basic restrictions', 'Complex restrictions', 'Fully restricted'];
const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

mkdirSync(new URL('public/og/', root), { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const dir = new URL('src/content/countries/', root);
for (const file of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
	const { name, restrictiveness: level } = parse(readFileSync(new URL(file, dir), 'utf8').match(/^---\n([\s\S]*?)\n---/)[1]);
	await page.setContent(`<style>
		body{margin:0;width:1200px;height:630px;box-sizing:border-box;padding:72px;background:${token('color-bg')};color:${token('color-text')};font-family:'Inter Tight',system-ui,sans-serif;display:flex;flex-direction:column;justify-content:space-between}
		.site{font-size:34px;color:${token('color-text-muted')}}
		h1{margin:0;font-size:132px;line-height:1;letter-spacing:-0.03em}
		.level{display:inline-flex;align-items:center;gap:20px;margin-top:36px;padding:12px 40px 12px 12px;border-radius:999px;background:${token(`color-level-${level}`)};color:${token('color-on-accent')};font-size:48px;font-weight:700}
		.n{display:grid;place-items:center;width:84px;height:84px;border-radius:50%;background:${token('color-on-accent')};color:${token(`color-level-${level}`)}}
	</style><div class="site">Recreational Drones</div><div><div class="site">Drone rules in</div><h1>${esc(name)}</h1><div class="level"><span class="n">${level}</span>${LABELS[level - 1]}</div></div>`);
	writeFileSync(new URL(`public/og/${file.replace('.mdx', '')}.png`, root), await page.screenshot({ type: 'png' }));
}
await browser.close();
