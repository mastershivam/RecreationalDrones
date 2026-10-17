import { createNoise, createParticles, fieldAngle, mulberry32, particleCount, readFlowColors, spawn, step, type Particle } from './flow-field';

export interface FlowOptions {
	// Two line colors, from the design tokens.
	colors: [string, string];
	// Draw one still frame and stop, for people who ask for less motion.
	reduced: boolean;
	seed?: number;
}

// A still picture traces each line once along the field: this many steps of this many pixels, so about 220 px long.
const STILL_STEPS = 140;
const STILL_SPEED = 1.6;

// Draws the flow field on a canvas and keeps it moving. Returns a function that stops it.
// The canvas is decoration: it should have pointer-events: none and aria-hidden, and be laid out by the page.
export function startFlow(canvas: HTMLCanvasElement, { colors, reduced, seed = 20261017 }: FlowOptions): () => void {
	const ctx = canvas.getContext('2d');
	if (!ctx) return () => {};
	const noise = createNoise(seed);
	const rand = mulberry32(seed + 1);
	let particles: Particle[] = [];
	let width = 0;
	let height = 0;
	let frame = 0;
	let t = 0;
	let stopped = false;

	function resize() {
		const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
		width = canvas.clientWidth;
		height = canvas.clientHeight;
		canvas.width = Math.max(1, Math.round(width * dpr));
		canvas.height = Math.max(1, Math.round(height * dpr));
		ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
		particles = createParticles(particleCount(width, height), width, height, rand);
	}

	function draw() {
		// Fade what is already there a little, so each line leaves a trail that dies away.
		ctx!.globalCompositeOperation = 'destination-out';
		ctx!.fillStyle = 'rgba(0, 0, 0, 0.028)';
		ctx!.fillRect(0, 0, width, height);
		ctx!.globalCompositeOperation = 'source-over';
		ctx!.lineWidth = 1.25;
		ctx!.lineCap = 'round';
		colors.forEach((color, which) => {
			ctx!.strokeStyle = color;
			ctx!.globalAlpha = which === 0 ? 0.85 : 0.6;
			ctx!.beginPath();
			for (let i = which; i < particles.length; i += 2) {
				const p = particles[i];
				if (!step(p, noise, t, width, height, rand)) {
					ctx!.moveTo(p.px, p.py);
					ctx!.lineTo(p.x, p.y);
				}
			}
			ctx!.stroke();
		});
		ctx!.globalAlpha = 1;
		t += 16;
	}

	// The picture for people who ask for less motion. Every line is traced once and stroked once, which is a few
	// milliseconds, where replaying hundreds of frames of fading trails took seconds on a large screen.
	function drawStill() {
		ctx!.clearRect(0, 0, width, height);
		ctx!.lineWidth = 1.25;
		ctx!.lineCap = 'round';
		colors.forEach((color, which) => {
			ctx!.strokeStyle = color;
			ctx!.globalAlpha = which === 0 ? 0.7 : 0.5;
			ctx!.beginPath();
			const p: Particle = { x: 0, y: 0, px: 0, py: 0, age: 0, life: 0 };
			for (let i = which; i < particles.length; i += 2) {
				spawn(p, width, height, rand);
				ctx!.moveTo(p.x, p.y);
				for (let s = 0; s < STILL_STEPS; s++) {
					const a = fieldAngle(noise, p.x, p.y, 0);
					p.x += Math.cos(a) * STILL_SPEED;
					p.y += Math.sin(a) * STILL_SPEED;
					if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) break;
					ctx!.lineTo(p.x, p.y);
				}
			}
			ctx!.stroke();
		});
		ctx!.globalAlpha = 1;
	}

	function loop() {
		if (stopped) return;
		draw();
		frame = requestAnimationFrame(loop);
	}

	const observer = new ResizeObserver(() => {
		resize();
		if (reduced) drawStill();
	});
	observer.observe(canvas);
	resize();
	if (reduced) {
		const started = performance.now();
		drawStill();
		// Kept so a test can check the still picture stays cheap (it once took seconds and stalled the whole page).
		canvas.dataset.flowMs = String(Math.round(performance.now() - started));
		canvas.dataset.flow = 'still';
	} else {
		canvas.dataset.flow = 'moving';
		loop();
	}

	return () => {
		stopped = true;
		cancelAnimationFrame(frame);
		observer.disconnect();
		canvas.dataset.flow = 'stopped';
	};
}

// Starts the flow on a canvas with the colors from the design tokens, and follows the "reduce motion" setting, even if
// it changes while the page is open. Returns a function that stops it.
export function mountFlow(canvas: HTMLCanvasElement): () => void {
	const colors = readFlowColors((name) => getComputedStyle(document.documentElement).getPropertyValue(name));
	const media = matchMedia('(prefers-reduced-motion: reduce)');
	let stop = startFlow(canvas, { colors, reduced: media.matches });
	const onChange = () => {
		stop();
		stop = startFlow(canvas, { colors, reduced: media.matches });
	};
	media.addEventListener('change', onChange);
	return () => {
		media.removeEventListener('change', onChange);
		stop();
	};
}
