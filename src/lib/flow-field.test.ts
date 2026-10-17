import { describe, expect, it } from 'vitest';
import { FIELD_SCALE, createNoise, createParticles, fieldAngle, flowOpacity, mulberry32, particleCount, readFlowColors, spawn, step } from './flow-field';

describe('mulberry32', () => {
	it('repeats exactly for the same seed, and differs for another', () => {
		const [a, b, c] = [mulberry32(7), mulberry32(7), mulberry32(8)];
		const run = (r: () => number) => [r(), r(), r()];
		expect(run(a)).toEqual(run(b));
		expect(run(mulberry32(7))).not.toEqual(run(c));
	});

	it('gives numbers from 0 up to but not including 1', () => {
		const r = mulberry32(1);
		for (let i = 0; i < 1000; i++) {
			const v = r();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});
});

describe('createNoise', () => {
	const noise = createNoise(42);

	it('stays within 0 and 1', () => {
		for (let i = 0; i < 2000; i++) {
			const v = noise(i * 0.37, i * 0.11 - 50, i * 0.05);
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThanOrEqual(1);
		}
	});

	it('is the same for the same seed and point, and different for another seed', () => {
		expect(createNoise(42)(3.3, 4.4, 5.5)).toBe(noise(3.3, 4.4, 5.5));
		expect(createNoise(43)(3.3, 4.4, 5.5)).not.toBe(noise(3.3, 4.4, 5.5));
	});

	it('is smooth: a tiny step changes the value only a little, so lines curve and do not jump', () => {
		for (let i = 0; i < 500; i++) {
			const [x, y, z] = [i * 0.173, i * 0.071, i * 0.013];
			expect(Math.abs(noise(x + 0.001, y, z) - noise(x, y, z))).toBeLessThan(0.01);
			expect(Math.abs(noise(x, y + 0.001, z) - noise(x, y, z))).toBeLessThan(0.01);
			expect(Math.abs(noise(x, y, z + 0.001) - noise(x, y, z))).toBeLessThan(0.01);
		}
	});

	it('is not flat: it uses much of its range', () => {
		const values = Array.from({ length: 2000 }, (_, i) => noise(i * 0.9, i * 0.37, 0));
		expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(0.7);
	});

	it('works for negative coordinates too', () => {
		expect(noise(-3.2, -7.9, -0.4)).toBeGreaterThanOrEqual(0);
		expect(noise(-3.2, -7.9, -0.4)).toBeLessThanOrEqual(1);
	});
});

describe('fieldAngle', () => {
	const noise = createNoise(1);

	it('is within two turns', () => {
		for (let i = 0; i < 500; i++) expect(fieldAngle(noise, i * 13, i * 7, i * 100)).toBeLessThanOrEqual(Math.PI * 4);
	});

	it('changes slowly from place to place and over time, so neighbouring lines run together', () => {
		const a = fieldAngle(noise, 400, 300, 0);
		expect(Math.abs(fieldAngle(noise, 401, 300, 0) - a)).toBeLessThan(0.05);
		expect(Math.abs(fieldAngle(noise, 400, 300, 16) - a)).toBeLessThan(0.05);
		expect(FIELD_SCALE).toBeLessThan(0.01);
	});
});

describe('particles', () => {
	const [w, h] = [800, 600];

	it('are made inside the screen, part-way through their lives', () => {
		const ps = createParticles(300, w, h, mulberry32(3));
		expect(ps).toHaveLength(300);
		for (const p of ps) {
			expect(p.x).toBeGreaterThanOrEqual(0);
			expect(p.x).toBeLessThanOrEqual(w);
			expect(p.y).toBeLessThanOrEqual(h);
			expect(p.age).toBeLessThan(p.life);
		}
		expect(new Set(ps.map((p) => Math.round(p.life))).size).toBeGreaterThan(50);
	});

	it('move one step of the given speed along the field, and remember where they were', () => {
		const noise = createNoise(5);
		const rand = mulberry32(9);
		const p = spawn({ x: 0, y: 0, px: 0, py: 0, age: 0, life: 0 }, w, h, rand);
		p.x = 400;
		p.y = 300;
		const reborn = step(p, noise, 0, w, h, rand, 2);
		expect(reborn).toBe(false);
		expect(p.px).toBe(400);
		expect(Math.hypot(p.x - 400, p.y - 300)).toBeCloseTo(2, 5);
		expect(p.age).toBe(1);
	});

	it('are reborn inside the screen when they leave it, and say so', () => {
		const noise = createNoise(5);
		const rand = mulberry32(9);
		const p = { x: w - 0.1, y: 300, px: 0, py: 0, age: 5, life: 200 };
		let reborn = false;
		for (let i = 0; i < 50 && !reborn; i++) {
			p.x = w - 0.01;
			reborn = step(p, noise, 0, w, h, rand, 5) || reborn;
		}
		expect(reborn).toBe(true);
		expect(p.x).toBeGreaterThanOrEqual(0);
		expect(p.x).toBeLessThanOrEqual(w);
		expect(p.px).toBe(p.x);
		expect(p.age).toBe(0);
	});

	it('are reborn when their life ends', () => {
		const noise = createNoise(5);
		const p = { x: 400, y: 300, px: 400, py: 300, age: 200, life: 200 };
		expect(step(p, noise, 0, w, h, mulberry32(2))).toBe(true);
		expect(p.age).toBe(0);
	});

	it('stay on screen over a long run', () => {
		const noise = createNoise(11);
		const rand = mulberry32(4);
		const ps = createParticles(200, w, h, rand);
		for (let t = 0; t < 600; t++) for (const p of ps) step(p, noise, t * 16, w, h, rand);
		for (const p of ps) {
			expect(p.x).toBeGreaterThanOrEqual(0);
			expect(p.x).toBeLessThanOrEqual(w);
			expect(p.y).toBeGreaterThanOrEqual(0);
			expect(p.y).toBeLessThanOrEqual(h);
		}
	});
});

describe('particleCount', () => {
	it('grows with the screen, within a floor and a ceiling', () => {
		expect(particleCount(1440, 900)).toBe(498);
		expect(particleCount(200, 100)).toBe(120);
		expect(particleCount(3840, 2160)).toBe(900);
	});

	it('uses fewer on a phone, which has less power to draw with', () => {
		expect(particleCount(390, 844)).toBeLessThanOrEqual(320);
		expect(particleCount(390, 844)).toBeLessThan(particleCount(1440, 900));
		expect(particleCount(600, 4000)).toBe(320);
	});
});

describe('flowOpacity', () => {
	it('is full over the whole globe, fades as you zoom in, and is gone before zones show at zoom 6', () => {
		expect(flowOpacity(0.5)).toBe(0.7);
		expect(flowOpacity(3)).toBe(0.7);
		expect(flowOpacity(4.5)).toBeCloseTo(0.35, 3);
		expect(flowOpacity(6)).toBe(0);
		expect(flowOpacity(8)).toBe(0);
	});

	it('never goes up as you zoom in', () => {
		let last = Infinity;
		for (let z = 0; z <= 8; z += 0.25) {
			const o = flowOpacity(z);
			expect(o).toBeLessThanOrEqual(last);
			last = o;
		}
	});
});

describe('readFlowColors', () => {
	it('reads both colors from their tokens, trimmed', () => {
		expect(readFlowColors((name) => ` ${name}-v `)).toEqual(['--color-flow-1-v', '--color-flow-2-v']);
	});

	it('throws naming the token when one is missing', () => {
		expect(() => readFlowColors((name) => (name === '--color-flow-2' ? '' : '#fff'))).toThrow('--color-flow-2');
	});
});
