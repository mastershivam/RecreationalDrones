// Makes the icons and the social image in public/ from the logo files in this folder:
// favicon.ico, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png and og-image.png (1200 x 630).
// Run with: node brand/build-icons.mjs   (needs Chrome; no other install)
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root));
const dataUri = (path) => `data:image/svg+xml;base64,${read(path).toString('base64')}`;
const TILE = '#0a0e1a'; // --color-bg
const TEXT = '#eef1fa'; // --color-text
const MUTED = '#a4aecb'; // --color-text-muted

const browser = await chromium.launch({ channel: 'chrome' });

// The logo mark filling a square, on the page background so the corners are not transparent.
async function square(size) {
	const page = await browser.newPage({ viewport: { width: size, height: size } });
	await page.setContent(`<style>html,body{margin:0;background:${TILE}}img{display:block;width:${size}px;height:${size}px}</style><img src="${dataUri('brand/favicon.svg')}">`);
	const png = await page.screenshot({ type: 'png' });
	await page.close();
	return png;
}

const [icon32, icon180, icon192, icon512] = await Promise.all([32, 180, 192, 512].map(square));
writeFileSync(new URL('public/favicon-32.png', root), icon32);
writeFileSync(new URL('public/apple-touch-icon.png', root), icon180);
writeFileSync(new URL('public/icon-192.png', root), icon192);
writeFileSync(new URL('public/icon-512.png', root), icon512);

// favicon.ico: an ICO file may hold a PNG image, so wrap the 32 px one.
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // one image
header[6] = 32; // width
header[7] = 32; // height
header.writeUInt16LE(1, 12); // colour planes
header.writeUInt16LE(32, 14); // bits per pixel
header.writeUInt32LE(icon32.length, 14 + 4);
header.writeUInt32LE(22, 18); // where the image starts
writeFileSync(new URL('public/favicon.ico', root), Buffer.concat([header, icon32]));

// The social image: name and tagline on the left, the mark on the right.
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(`
<style>
	html,body{margin:0;width:1200px;height:630px;background:${TILE};font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:${TEXT}}
	main{position:relative;width:1200px;height:630px;overflow:hidden}
	img{position:absolute;right:-40px;top:-5px;width:640px;height:640px}
	div{position:absolute;left:80px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center}
	h1{margin:0;font-size:92px;line-height:0.98;letter-spacing:-0.03em}
	p{margin:32px 0 0;font-size:36px;line-height:1.3;color:${MUTED};text-wrap:balance}
</style>
<main><img src="${dataUri('brand/logo-mark.svg')}"><div><h1>Recreational Drones</h1><p>Where and how you can fly, country by country.</p></div></main>`);
writeFileSync(new URL('public/og-image.png', root), await page.screenshot({ type: 'png' }));
await browser.close();
console.log('Wrote the icons and public/og-image.png');
