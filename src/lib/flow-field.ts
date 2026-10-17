// The maths behind the flow-field backdrop: a smooth noise field turns each point into a direction, and particles
// follow it. It is decoration only (DESIGN.md, Flow field): it never carries data or implies wind or rules.
export type Rand = () => number;

// A small seeded generator, so a test (or a screenshot) can repeat a field exactly.
export function mulberry32(seed: number): Rand {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export type Noise = (x: number, y: number, z: number) => number;

// Hash of a lattice point to [0, 1).
function lattice(seed: number, x: number, y: number, z: number): number {
	let h = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647)) >>> 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// Value noise in three dimensions (x, y and time), smooth in all three, with values in [0, 1].
export function createNoise(seed: number): Noise {
	return (x, y, z) => {
		const [ix, iy, iz] = [Math.floor(x), Math.floor(y), Math.floor(z)];
		const [fx, fy, fz] = [smooth(x - ix), smooth(y - iy), smooth(z - iz)];
		const at = (dx: number, dy: number, dz: number) => lattice(seed, ix + dx, iy + dy, iz + dz);
		const plane = (dz: number) => mix(mix(at(0, 0, dz), at(1, 0, dz), fx), mix(at(0, 1, dz), at(1, 1, dz), fx), fy);
		return mix(plane(0), plane(1), fz);
	};
}

// How coarse the field is (lines bend over about 1/SCALE pixels) and how fast it drifts.
export const FIELD_SCALE = 0.0016;
export const FIELD_DRIFT = 0.00004;

// The direction, in radians, a particle at (x, y) is pushed at time t (milliseconds). Two full turns give long curls.
export function fieldAngle(noise: Noise, x: number, y: number, t: number): number {
	return noise(x * FIELD_SCALE, y * FIELD_SCALE, t * FIELD_DRIFT) * Math.PI * 4;
}

export interface Particle {
	x: number;
	y: number;
	// Where it was last frame, so a line can be drawn from there.
	px: number;
	py: number;
	age: number;
	life: number;
}

export function spawn(p: Particle, width: number, height: number, rand: Rand): Particle {
	p.x = p.px = rand() * width;
	p.y = p.py = rand() * height;
	p.age = 0;
	// Staggered lifetimes, so the whole field never restarts at once.
	p.life = 160 + rand() * 360;
	return p;
}

export function createParticles(count: number, width: number, height: number, rand: Rand): Particle[] {
	return Array.from({ length: count }, () => {
		const p = spawn({ x: 0, y: 0, px: 0, py: 0, age: 0, life: 0 }, width, height, rand);
		// Start part-way through a life, so the first frame is already full.
		p.age = Math.floor(rand() * p.life);
		return p;
	});
}

// Moves one particle a step along the field. Returns true if it was reborn somewhere else (the renderer must not
// draw a line from its old place to the new one).
export function step(p: Particle, noise: Noise, t: number, width: number, height: number, rand: Rand, speed = 1.1): boolean {
	const a = fieldAngle(noise, p.x, p.y, t);
	p.px = p.x;
	p.py = p.y;
	p.x += Math.cos(a) * speed;
	p.y += Math.sin(a) * speed;
	p.age += 1;
	if (p.age > p.life || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
		spawn(p, width, height, rand);
		return true;
	}
	return false;
}

// Enough particles to fill the screen with lines without crowding it, and fewer on a phone (less to draw).
export function particleCount(width: number, height: number): number {
	const count = Math.round((width * height) / 2600);
	return Math.min(width < 640 ? 320 : 900, Math.max(120, count));
}

// The backdrop sits over the globe. It thins out as you zoom in, so that it never gets between you and a zone.
export function flowOpacity(zoom: number): number {
	const FULL = 0.7;
	if (zoom <= 3) return FULL;
	if (zoom >= 6) return 0;
	return Math.round(FULL * ((6 - zoom) / 3) * 1000) / 1000;
}

// The two line colors, read from the design tokens (`read` is getComputedStyle(...).getPropertyValue in the browser).
export function readFlowColors(read: (name: string) => string): [string, string] {
	const color = (name: string) => {
		const value = read(name).trim();
		if (!value) throw new Error(`Design token ${name} is not defined`);
		return value;
	};
	return [color('--color-flow-1'), color('--color-flow-2')];
}
