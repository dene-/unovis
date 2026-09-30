import type { Composer } from '../composer';
import { BODY_FONT, DISPLAY_FONT } from '../fonts';
import { QUARTER_TURN, TAU, tracePolygon } from '../geometry';
import type { Artist } from './artist';
import { FILM_BILLING, FILM_TITLES } from './lexicon';
import { paintWord } from './lettering';

interface Staging {
	horizon: number;
	vanishX: number;
	cx: number;
	cy: number;
}

/** A checkered floor rushing to the horizon. */
function recedingFloor(c: Composer, set: Staging): void {
	const { width: W, height: H, short: S, palette: P } = c;
	c.stream(1);
	if (!c.plates.volumes) return;
	const spacing = S * c.range(0.06, 0.12);
	const bands = c.int(6, 11);
	const color = c.chance(0.6) ? P.ink : P.red;
	const falloff = c.range(1.8, 2.6);
	const vanishingDepth = H * 1.6;
	c.add(color, (ctx) => {
		ctx.fillStyle = color;
		const rays = Math.ceil((W * 2.5) / (spacing * 4)) + 2;
		const xAt = (ray: number, y: number) =>
			set.vanishX + (ray * spacing * 4 * (y - set.horizon)) / (vanishingDepth - set.horizon);
		const yAt = (band: number) =>
			set.horizon + (H - set.horizon) * 1.15 * Math.pow(band / bands, falloff);
		for (let band = 0; band < bands; band++) {
			for (let ray = -rays; ray < rays; ray++) {
				if ((((ray + band) % 2) + 2) % 2 === 0) continue;
				const top = yAt(band);
				const bottom = yAt(band + 1);
				tracePolygon(ctx, [
					[xAt(ray, top), top],
					[xAt(ray + 1, top), top],
					[xAt(ray + 1, bottom), bottom],
					[xAt(ray, bottom), bottom]
				]);
				ctx.fill();
			}
		}
		ctx.fillRect(0, set.horizon - S * 0.002, W, S * 0.004);
	});
}

function vortex(c: Composer, set: Staging): void {
	const { short: S, palette: P } = c;
	c.stream(2);
	if (!c.plates.keyForm) return;
	const kind = c.pick(['spiral', 'target', 'target', 'spiral', 'rings']);
	const radius = S * c.range(0.18, 0.32);
	const color = c.chance(0.6) ? P.red : P.ink;
	const alternate = c.chance(0.5) ? P.paper : color === P.red ? P.ink : P.red;
	const turns = c.int(4, 8);
	const rings = c.int(5, 9);
	const weight = Math.min(S * c.range(0.012, 0.022), (radius / turns) * 0.5);
	const driftX = c.range(-0.5, 0.5);
	const driftY = c.range(-0.5, 0.5);
	const { cx, cy } = set;

	if (kind === 'spiral') {
		c.add(color, (ctx) => {
			ctx.strokeStyle = color;
			ctx.lineWidth = weight;
			ctx.beginPath();
			const end = turns * TAU;
			for (let t = 0; t <= end; t += 0.03) {
				const r = (radius * t) / end;
				const x = cx + Math.cos(t) * r;
				const y = cy + Math.sin(t) * r;
				if (t) ctx.lineTo(x, y);
				else ctx.moveTo(x, y);
			}
			ctx.stroke();
		});
	} else if (kind === 'target') {
		c.add(alternate === P.paper ? color : null, (ctx) => {
			for (let k = 0; k < rings; k++) {
				ctx.fillStyle = k % 2 ? alternate : color;
				ctx.beginPath();
				ctx.arc(cx, cy, radius * (1 - k / rings), 0, TAU);
				ctx.fill();
			}
		});
	} else {
		c.add(color, (ctx) => {
			ctx.strokeStyle = color;
			ctx.lineWidth = weight * 0.8;
			for (let k = 0; k < rings; k++) {
				const f = k / rings;
				ctx.beginPath();
				ctx.arc(cx + driftX * radius * f, cy + driftY * radius * f, radius * (1 - f * 0.9), 0, TAU);
				ctx.stroke();
			}
		});
	}
}

function filmStrip(c: Composer): void {
	const { width: W, height: H, short: S, palette: P } = c;
	c.stream(3);
	if (!c.chance(0.7)) return;
	const angle = c.range(-0.6, 0.6) + (c.chance(0.3) ? QUARTER_TURN : 0);
	const breadth = S * c.range(0.1, 0.16);
	const length = S * 1.9;
	const x = W * c.range(0.2, 0.8);
	const y = H * c.range(0.2, 0.85);
	const frameLength = breadth * 0.8;
	const gap = breadth * 0.12;
	const frames: string[] = [];
	for (let k = 0, n = Math.ceil(length / (frameLength + gap)); k < n; k++) {
		frames.push(c.chance(0.5) ? P.paper2 : c.pick([P.red, c.accent(), P.paper2]));
	}
	c.add(P.ink, (ctx) => {
		ctx.translate(x, y);
		ctx.rotate(angle);
		ctx.fillStyle = P.ink;
		ctx.fillRect(-length / 2, -breadth / 2, length, breadth);
		const pitch = breadth * 0.14;
		ctx.fillStyle = P.paper;
		for (let px = -length / 2 + pitch * 0.3; px < length / 2; px += pitch) {
			ctx.fillRect(px, -breadth / 2 + breadth * 0.05, pitch * 0.5, breadth * 0.1);
			ctx.fillRect(px, breadth / 2 - breadth * 0.15, pitch * 0.5, breadth * 0.1);
		}
		frames.forEach((fill, k) => {
			ctx.fillStyle = fill;
			ctx.fillRect(
				-length / 2 + k * (frameLength + gap) + gap / 2,
				-breadth * 0.31,
				frameLength,
				breadth * 0.62
			);
		});
	});
}

function accents(c: Composer): void {
	const { width: W, height: H, short: S } = c;
	c.stream(4);
	for (let i = 0, n = c.count(1, 3); i < n; i++) {
		const angle = c.range(-1, 1);
		const length = S * c.range(0.3, 0.9);
		const thickness = S * c.range(0.02, 0.06);
		const x = W * c.range(0.1, 0.9);
		const y = H * c.range(0.1, 0.9);
		const color = c.anyColor();
		c.add(color, (ctx) => {
			ctx.fillStyle = color;
			ctx.translate(x, y);
			ctx.rotate(angle);
			ctx.fillRect(-length / 2, -thickness / 2, length, thickness);
		});
	}
	for (let i = 0, n = c.count(1, 3); i < n; i++) {
		const x = W * c.range(0.1, 0.9);
		const y = H * c.range(0.1, 0.9);
		const radius = S * c.range(0.012, 0.045);
		const color = c.anyColor();
		c.add(color, (ctx) => {
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, TAU);
			ctx.fill();
		});
	}
}

/** A tumbling title whose letters grow (or shrink) as they go. */
function billing(c: Composer): void {
	const { width: W, height: H, short: S, palette: P } = c;
	c.stream(5);
	if (!c.plates.type) return;
	const title = c.pick(FILM_TITLES);
	const base = S * c.range(0.07, 0.11) * (title.length > 6 ? 0.66 : 1);
	const growth = c.range(-0.06, 0.12);
	const angle = c.range(-0.3, 0.3);
	const x = W * c.range(0.06, 0.2);
	const y = H * c.range(0.14, 0.9);
	const color = c.chance(0.55) ? P.red : P.ink;
	const shadowed = c.chance(0.5);
	const shadow = color === P.ink ? P.red : P.ink;
	c.add(color, (ctx) => {
		ctx.translate(x, y);
		ctx.rotate(angle);
		ctx.textBaseline = 'alphabetic';
		let advance = 0;
		[...title].forEach((letter, i) => {
			const size = base * (1 + i * growth);
			ctx.font = `${size}px ${DISPLAY_FONT}`;
			if (shadowed) {
				ctx.fillStyle = shadow;
				ctx.fillText(letter, advance + size * 0.07, size * 0.07);
			}
			ctx.fillStyle = color;
			ctx.fillText(letter, advance, 0);
			advance += ctx.measureText(letter).width * 1.02;
		});
	});
	const line = c.pick(FILM_BILLING);
	const band = c.chance(0.5) ? P.ink : P.red;
	const bx = W * c.range(0.08, 0.4);
	const by = H * c.range(0.1, 0.92);
	const size = S * c.range(0.022, 0.03);
	c.add(
		null,
		paintWord(P, {
			text: line,
			x: bx,
			y: by,
			angle: 0,
			size,
			style: 'band',
			color: P.ink,
			band,
			font: BODY_FONT,
			weight: '600'
		})
	);
}

export const stenberg: Artist = {
	id: 'stenberg',
	name: 'Stenberg brothers',
	shortName: 'Stenbergs',
	years: 'Vladimir 1899–1982 · Georgii 1900–1933',
	palette: 'cinema',
	plateLabels: { keyForm: 'Spiral & target', volumes: 'Receding floor', type: 'Cyrillic type' },
	note: 'Film-poster vertigo: spirals and targets, checkered floors rushing to the horizon, film strips and tumbling titles.',
	compose(c) {
		c.stream(0);
		const set: Staging = {
			horizon: c.height * c.range(0.5, 0.72),
			vanishX: c.width * c.range(0.2, 0.8),
			cx: c.width * c.range(0.3, 0.7),
			cy: c.height * c.range(0.26, 0.5)
		};
		c.misregisterPlates();
		c.setColophon('КИНО', 40, 1923, 1933);
		recedingFloor(c, set);
		vortex(c, set);
		filmStrip(c);
		accents(c);
		billing(c);
	}
};
