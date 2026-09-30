import type { Composer } from '../composer';
import { mixHex, shade, tint } from '../color';
import { QUARTER_TURN, TAU, tracePolygon, type Point } from '../geometry';
import type { Artist } from './artist';
import { IMPRINTS, SLOGANS } from './lexicon';
import { paintImprint, paintWord, readable, type WordStyle } from './lettering';

interface Scene {
	angle: number;
	x: number;
	y: number;
	/** Colour of line work: ink on paper, paper on a dark ground. */
	line: string;
	inks: string[];
}

type PlaneShape = 'triangle' | 'trapezoid' | 'sail' | 'shard';

function planeOutline(shape: PlaneShape, size: number, lean: number): Point[] {
	if (shape === 'triangle') {
		return [
			[-size / 2, size * 0.35],
			[size / 2, size * 0.35],
			[size * (lean - 0.5), -size * 0.5]
		];
	}
	if (shape === 'trapezoid') {
		return [
			[-size / 2, size * 0.3],
			[size / 2, size * 0.3],
			[size * lean * 0.5, -size * 0.3],
			[-size * lean * 0.5, -size * 0.3]
		];
	}
	return [
		[-size / 2, -size * 0.2],
		[size * 0.3, -size * 0.45],
		[size / 2, size * 0.25],
		[-size * 0.2, size * 0.4]
	];
}

/** Overlapping planes shaded like painted metal. */
function architectonics(c: Composer, scene: Scene): void {
	const S = c.short;
	c.stream(1);
	for (let i = 0, n = c.count(5, 9); i < n; i++) {
		const shape = c.pick<PlaneShape>(['triangle', 'trapezoid', 'sail', 'sail', 'shard']);
		const size = S * c.range(0.14, 0.45);
		const angle = scene.angle + c.range(-0.7, 0.7);
		const x = scene.x + S * c.range(-0.3, 0.3);
		const y = scene.y + S * c.range(-0.32, 0.32);
		const color = c.pick(scene.inks);
		const lean = c.range(0.3, 0.8);
		const bend = c.range(-0.5, 0.5);
		const light = c.range(0, TAU);
		const outline = planeOutline(shape, size, lean);
		c.add(color, (ctx) => {
			ctx.translate(x, y);
			ctx.rotate(angle);
			const dx = (Math.cos(light) * size) / 2;
			const dy = (Math.sin(light) * size) / 2;
			const gradient = ctx.createLinearGradient(-dx, -dy, dx, dy);
			gradient.addColorStop(0, tint(color, 0.2));
			gradient.addColorStop(1, shade(color, 0.28));
			ctx.fillStyle = gradient;
			if (shape === 'sail') {
				ctx.beginPath();
				ctx.moveTo(-size / 2, size * 0.4);
				ctx.lineTo(size / 2, size * 0.4);
				ctx.quadraticCurveTo(size * bend, -size * 0.1, -size * 0.35, -size * 0.55);
				ctx.closePath();
			} else {
				tracePolygon(ctx, outline);
			}
			ctx.fill();
		});
	}
}

function cylinders(c: Composer, scene: Scene): void {
	const S = c.short;
	c.stream(2);
	if (!c.plates.volumes) return;
	for (let i = 0, n = c.int(1, 2); i < n; i++) {
		const cone = c.chance(0.4);
		const width = S * c.range(0.05, 0.12);
		const height = S * c.range(0.2, 0.42);
		const angle = scene.angle + c.range(-0.4, 0.4);
		const x = scene.x + S * c.range(-0.3, 0.3);
		const y = scene.y + S * c.range(-0.3, 0.3);
		const color = c.pick(scene.inks);
		const highlight = tint(color, 0.35);
		c.add(color, (ctx) => {
			ctx.translate(x, y);
			ctx.rotate(angle);
			const gradient = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
			gradient.addColorStop(0, shade(color, 0.45));
			gradient.addColorStop(0.38, highlight);
			gradient.addColorStop(1, shade(color, 0.5));
			ctx.fillStyle = gradient;
			if (cone) {
				tracePolygon(ctx, [
					[0, -height / 2],
					[width / 2, height / 2],
					[-width / 2, height / 2]
				]);
				ctx.fill();
			} else {
				ctx.fillRect(-width / 2, -height / 2, width, height);
			}
			ctx.beginPath();
			ctx.ellipse(0, height / 2, width / 2, width * 0.16, 0, 0, Math.PI);
			ctx.fill();
			if (!cone) {
				ctx.fillStyle = highlight;
				ctx.beginPath();
				ctx.ellipse(0, -height / 2, width / 2, width * 0.16, 0, 0, TAU);
				ctx.fill();
			}
		});
	}
}

/** The line webs of the space-force constructions. */
function spaceForce(c: Composer, scene: Scene): void {
	const { short: S, palette: P } = c;
	c.stream(3);
	if (!c.plates.keyForm) return;
	const directions = [scene.angle, scene.angle + c.range(0.5, 1.1), scene.angle - c.range(0.4, 0.9)];
	const lines: { x: number; y: number; angle: number; length: number; weight: number; color: string }[] = [];
	for (let i = 0, n = c.count(7, 14); i < n; i++) {
		lines.push({
			x: scene.x + S * c.range(-0.4, 0.4),
			y: scene.y + S * c.range(-0.4, 0.4),
			angle: c.pick(directions) + c.range(-0.04, 0.04),
			length: S * c.range(0.5, 1.4),
			weight: S * (c.chance(0.25) ? c.range(0.008, 0.016) : c.range(0.0018, 0.004)),
			color: c.chance(0.8) ? scene.line : P.red
		});
	}
	const arcs: { x: number; y: number; radius: number; start: number; sweep: number; weight: number; color: string }[] =
		[];
	for (let i = 0, n = c.count(1, 3); i < n; i++) {
		arcs.push({
			x: scene.x + S * c.range(-0.3, 0.3),
			y: scene.y + S * c.range(-0.3, 0.3),
			radius: S * c.range(0.15, 0.5),
			start: c.range(0, TAU),
			sweep: c.range(0.6, 2),
			weight: S * c.range(0.003, 0.012),
			color: c.chance(0.8) ? scene.line : P.red
		});
	}
	c.add(scene.line === P.ink ? P.ink : null, (ctx) => {
		for (const line of lines) {
			ctx.save();
			ctx.fillStyle = line.color;
			ctx.translate(line.x, line.y);
			ctx.rotate(line.angle);
			ctx.fillRect(-line.length / 2, -line.weight / 2, line.length, line.weight);
			ctx.restore();
		}
		for (const arc of arcs) {
			ctx.strokeStyle = arc.color;
			ctx.lineWidth = arc.weight;
			ctx.beginPath();
			ctx.arc(arc.x, arc.y, arc.radius, arc.start, arc.start + arc.sweep);
			ctx.stroke();
		}
	});
}

function lettering(c: Composer, scene: Scene): void {
	const { width: W, height: H, short: S, palette: P } = c;
	c.stream(4);
	if (!c.plates.type) return;
	for (let i = 0, n = Math.max(1, c.count(0.6, 2)); i < n; i++) {
		const text = c.pick(SLOGANS);
		const size = S * c.range(0.04, 0.09) * (text.length > 6 ? 0.75 : 1);
		const angle = c.pick([readable(scene.angle), 0, -QUARTER_TURN]);
		const x = W * c.range(0.08, 0.6);
		const y = H * c.range(0.12, 0.88);
		const style = c.pick<WordStyle>(['plain', 'band', 'outline']);
		const color = c.chance(0.6) ? scene.line : P.red;
		c.add(style === 'band' ? null : color, paintWord(P, { text, x, y, angle, size, style, color, band: P.red }));
	}
	if (c.chance(0.5)) {
		const lines = [c.pick(IMPRINTS), c.pick(IMPRINTS)];
		const x = W * c.range(0.1, 0.7);
		const y = H * c.range(0.1, 0.9);
		c.add(scene.line, paintImprint(lines, x, y, 0, S * c.range(0.012, 0.016), scene.line));
	}
}

export const popova: Artist = {
	id: 'popova',
	name: 'Lyubov Popova',
	shortName: 'Popova',
	years: '1889–1924',
	palette: 'cobalt',
	plateLabels: { keyForm: 'Space-force lines', volumes: 'Shaded cylinders', type: 'Cyrillic type' },
	note: 'Painterly architectonics: overlapping planes shaded like painted metal, crossed by the line webs of her space-force constructions.',
	compose(c) {
		const P = c.palette;
		c.stream(0);
		const dark = c.chance(0.3);
		const angle = c.range(-1.1, 1.1);
		const x = c.width * c.range(0.38, 0.62);
		const y = c.height * c.range(0.38, 0.62);
		c.misregisterPlates();
		c.setColophon('АРХИТЕКТОНИКА', 40, 1916, 1924);
		if (dark) c.setGround(mixHex(P.ink, P.paper, 0.1), P.paper);
		const scene: Scene = {
			angle,
			x,
			y,
			line: dark ? P.paper : P.ink,
			inks: dark ? [P.red, P.paper, ...P.accents, P.paper2] : [P.red, P.ink, ...P.accents, P.paper2]
		};
		architectonics(c, scene);
		cylinders(c, scene);
		spaceForce(c, scene);
		lettering(c, scene);
	}
};
