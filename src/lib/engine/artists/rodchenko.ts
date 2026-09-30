import type { Composer } from '../composer';
import { DISPLAY_FONT } from '../fonts';
import { QUARTER_TURN, TAU, tracePolygon, type Point } from '../geometry';
import type { Artist } from './artist';
import { IMPRINTS, SLOGANS } from './lexicon';
import { paintImprint, pickImprint } from './lettering';

function colourBlock(c: Composer, diagonal: number): void {
	const { width: W, height: H, palette: P } = c;
	c.stream(1);
	if (!c.chance(0.75)) return;
	const color = c.chance(0.6) ? P.red : c.chance(0.5) ? P.ink : c.accent();
	const mode = c.pick(['vertical', 'horizontal', 'diagonal', 'corner']);
	const far = c.chance(0.5);
	const fx = W * c.range(0.3, 0.7);
	const fy = H * c.range(0.3, 0.7);
	c.add(color, (ctx) => {
		ctx.fillStyle = color;
		if (mode === 'vertical') {
			if (far) ctx.fillRect(fx, 0, W - fx, H);
			else ctx.fillRect(0, 0, fx, H);
		} else if (mode === 'horizontal') {
			if (far) ctx.fillRect(0, fy, W, H - fy);
			else ctx.fillRect(0, 0, W, fy);
		} else if (mode === 'diagonal') {
			ctx.translate(fx, fy);
			ctx.rotate(diagonal);
			ctx.fillRect(-W * 3, far ? 0 : -H * 3, W * 6, H * 3);
		} else {
			const corner: Point[] = far
				? [
						[W, H],
						[W - fx * 1.3, H],
						[W, H - fy * 1.3]
					]
				: [
						[0, 0],
						[fx * 1.3, 0],
						[0, fy * 1.3]
					];
			tracePolygon(ctx, corner);
			ctx.fill();
		}
	});
}

function compassDrawing(c: Composer, diagonal: number): void {
	const { width: W, height: H, short: S, palette: P } = c;
	c.stream(2);
	if (!c.chance(0.65)) return;
	const cx = W * c.range(0.25, 0.75);
	const cy = H * c.range(0.25, 0.75);
	const weight = S * c.range(0.002, 0.0035);
	const circles: { x: number; y: number; radius: number; heavy: boolean }[] = [];
	for (let i = 0, n = c.int(3, 6); i < n; i++) {
		circles.push({
			x: cx + S * c.range(-0.15, 0.15),
			y: cy + S * c.range(-0.15, 0.15),
			radius: S * c.range(0.04, 0.24),
			heavy: c.chance(0.2)
		});
	}
	const rules: { x: number; y: number; angle: number; length: number }[] = [];
	for (let i = 0, n = c.int(2, 4); i < n; i++) {
		const through = c.pick(circles);
		rules.push({
			x: through.x,
			y: through.y,
			angle: c.pick([0, QUARTER_TURN, diagonal, c.range(0, Math.PI)]),
			length: S * c.range(0.4, 1.1)
		});
	}
	const filled = c.pick(circles);
	const fill = c.chance(0.5) ? P.red : P.ink;
	c.add(P.ink, (ctx) => {
		ctx.strokeStyle = P.ink;
		for (const circle of circles) {
			ctx.lineWidth = circle.heavy ? weight * 4 : weight;
			ctx.beginPath();
			ctx.arc(circle.x, circle.y, circle.radius, 0, TAU);
			ctx.stroke();
		}
		ctx.lineWidth = weight;
		for (const rule of rules) {
			const dx = (Math.cos(rule.angle) * rule.length) / 2;
			const dy = (Math.sin(rule.angle) * rule.length) / 2;
			ctx.beginPath();
			ctx.moveTo(rule.x - dx, rule.y - dy);
			ctx.lineTo(rule.x + dx, rule.y + dy);
			ctx.stroke();
		}
	});
	c.add(fill, (ctx) => {
		ctx.fillStyle = fill;
		ctx.beginPath();
		ctx.arc(filled.x, filled.y, filled.radius * 0.25, 0, TAU);
		ctx.fill();
	});
}

function heavyRules(c: Composer, diagonal: number): void {
	const { width: W, height: H, short: S, palette: P } = c;
	c.stream(3);
	for (let i = 0, n = c.count(2, 5); i < n; i++) {
		const angle = c.pick([0, 0, QUARTER_TURN, diagonal]);
		const length = S * c.range(0.3, 1.1);
		const thickness = S * c.range(0.012, 0.05);
		const x = W * c.range(0.1, 0.9);
		const y = H * c.range(0.1, 0.9);
		const color = c.chance(0.6) ? P.ink : P.red;
		c.add(color, (ctx) => {
			ctx.fillStyle = color;
			ctx.translate(x, y);
			ctx.rotate(angle);
			ctx.fillRect(-length / 2, -thickness / 2, length, thickness);
		});
	}
}

/** Nested rings turned about a vertical axis, hung from the top edge. */
function hangingConstruction(c: Composer): void {
	const { width: W, height: H, short: S, palette: P } = c;
	c.stream(4);
	if (!c.plates.volumes) return;
	const x = W * c.range(0.25, 0.75);
	const y = H * c.range(0.3, 0.6);
	const outer = S * c.range(0.12, 0.24);
	const rings = c.int(5, 9);
	const phase = c.range(0, Math.PI);
	const turn = c.range(0.25, 0.6);
	const tilt = c.range(-0.25, 0.25);
	const weight = S * c.range(0.0022, 0.004);
	const accented = c.int(0, rings - 1);
	c.add(P.ink, (ctx) => {
		ctx.lineWidth = weight;
		ctx.strokeStyle = P.ink;
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, y - outer);
		ctx.stroke();
		for (let j = 0; j < rings; j++) {
			const ry = outer * (1 - (j / rings) * 0.85);
			const rx = Math.max(0.06, Math.abs(Math.cos(phase + j * turn))) * ry;
			ctx.strokeStyle = j === accented ? P.red : P.ink;
			ctx.lineWidth = j === accented ? weight * 2.4 : weight;
			ctx.beginPath();
			ctx.ellipse(x, y, rx, ry, tilt, 0, TAU);
			ctx.stroke();
		}
	});
}

/** A megaphone cone with the slogan growing as it travels out of the mouth. */
function shoutCone(c: Composer): void {
	const { width: W, height: H, short: S, palette: P } = c;
	c.stream(5);
	if (!c.plates.keyForm) return;
	const fromLeft = c.chance(0.5);
	const ox = fromLeft ? W * c.range(0.02, 0.2) : W * c.range(0.8, 0.98);
	const oy = H * c.range(0.6, 0.95);
	const aim = Math.atan2(H * c.range(0.15, 0.45) - oy, W * c.range(0.3, 0.7) - ox);
	const spread = c.range(0.22, 0.4);
	const length = S * c.range(0.8, 1.25);
	const color = c.chance(0.6) ? P.red : P.ink;
	const words = [c.pick(SLOGANS), c.pick(SLOGANS), c.pick(SLOGANS)].slice(0, c.int(1, 3));
	const mouth = color === P.red ? P.ink : P.red;
	const edge = (offset: number): Point => [
		ox + Math.cos(aim + offset) * length,
		oy + Math.sin(aim + offset) * length
	];

	c.add(color, (ctx) => {
		ctx.fillStyle = color;
		tracePolygon(ctx, [[ox, oy], edge(-spread / 2), edge(spread / 2)]);
		ctx.fill();
	});
	c.add(mouth, (ctx) => {
		ctx.fillStyle = mouth;
		ctx.beginPath();
		ctx.arc(ox, oy, S * 0.032, 0, TAU);
		ctx.fill();
	});
	if (!c.plates.type) return;
	c.add(null, (ctx) => {
		const flipped = Math.cos(aim) < 0;
		ctx.translate(ox, oy);
		ctx.rotate(flipped ? aim + Math.PI : aim);
		ctx.fillStyle = P.paper;
		ctx.textBaseline = 'middle';
		ctx.textAlign = flipped ? 'right' : 'left';
		const slope = Math.tan(spread / 2);
		let distance = length * 0.22;
		for (const word of words) {
			const size = 2 * distance * slope * 0.62;
			ctx.font = `${size}px ${DISPLAY_FONT}`;
			const width = ctx.measureText(word).width;
			if (distance + width > length * 0.97) break;
			ctx.fillText(word, flipped ? -distance : distance, 0);
			distance += width + size * 0.5;
		}
	});
}

function typeBlocks(c: Composer): void {
	const { width: W, height: H, short: S, palette: P } = c;
	c.stream(6);
	if (!c.plates.type) return;

	const boxed = c.pick(SLOGANS.filter((word) => word.length <= 6));
	const box = S * c.range(0.055, 0.09);
	const vertical = c.chance(0.4);
	const bx = W * c.range(0.06, 0.45);
	const by = H * c.range(0.06, 0.55);
	const first = c.chance(0.5) ? P.red : P.ink;
	const second = first === P.red ? P.ink : P.red;
	c.add(null, (ctx) => {
		ctx.font = `${box * 0.62}px ${DISPLAY_FONT}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		[...boxed].forEach((letter, i) => {
			const x = bx + (vertical ? 0 : i * box);
			const y = by + (vertical ? i * box : 0);
			ctx.fillStyle = i % 2 ? second : first;
			ctx.fillRect(x, y, box, box);
			ctx.fillStyle = P.paper;
			ctx.fillText(letter, x + box / 2, y + box * 0.53);
		});
	});

	const headline = c.pick(SLOGANS);
	const size = S * c.range(0.07, 0.12) * (headline.length > 6 ? 0.66 : 1);
	const hx = W * c.range(0.06, 0.25);
	const hy = H * c.range(0.6, 0.9);
	const color = c.chance(0.6) ? P.ink : P.red;
	const underlined = c.chance(0.6);
	c.add(color, (ctx) => {
		ctx.font = `${size}px ${DISPLAY_FONT}`;
		ctx.fillStyle = color;
		ctx.textBaseline = 'alphabetic';
		ctx.fillText(headline, hx, hy);
		if (underlined) ctx.fillRect(hx, hy + size * 0.2, ctx.measureText(headline).width, size * 0.13);
	});

	if (c.chance(0.6)) {
		const lines = pickImprint(c, IMPRINTS);
		const x = W * c.range(0.1, 0.7);
		const y = H * c.range(0.1, 0.9);
		const angle = c.pick([0, -QUARTER_TURN]);
		c.add(P.ink, paintImprint(lines, x, y, angle, S * c.range(0.012, 0.017), P.ink));
	}
}

function dots(c: Composer): void {
	const { width: W, height: H, short: S } = c;
	c.stream(7);
	for (let i = 0, n = c.count(1, 3); i < n; i++) {
		const x = W * c.range(0.1, 0.9);
		const y = H * c.range(0.1, 0.9);
		const radius = S * c.range(0.015, 0.06);
		const color = c.anyColor();
		c.add(color, (ctx) => {
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, TAU);
			ctx.fill();
		});
	}
}

export const rodchenko: Artist = {
	id: 'rodchenko',
	name: 'Alexander Rodchenko',
	shortName: 'Rodchenko',
	years: '1891–1956',
	palette: 'ochre',
	plateLabels: { keyForm: 'Shout cone', volumes: 'Hanging rings', type: 'Cyrillic type' },
	note: 'LEF-era graphics: colour-block splits, letters set in boxes, compass-and-ruler drawings and a cone of shouted type.',
	compose(c) {
		c.stream(0);
		const diagonal = (c.pick([-45, 45, -30, 30, -60, 60]) * Math.PI) / 180;
		c.misregisterPlates();
		c.setColophon('КОНСТРУКЦИЯ', 60, 1919, 1930);
		colourBlock(c, diagonal);
		compassDrawing(c, diagonal);
		heavyRules(c, diagonal);
		hangingConstruction(c);
		shoutCone(c);
		typeBlocks(c);
		dots(c);
	}
};
