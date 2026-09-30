import type { Composer } from '../composer';
import { shade, tint } from '../color';
import { DISPLAY_FONT } from '../fonts';
import {
	QUARTER_TURN,
	TAU,
	centredIsoBoxFaces,
	fillBox,
	tracePolygon,
	type Point
} from '../geometry';
import type { Artist } from './artist';
import { IMPRINTS, SLOGANS } from './lexicon';
import { paintImprint, paintWord, pickImprint, type WordStyle } from './lettering';

interface Axis {
	angle: number;
	direction: Point;
	normal: Point;
	/** A point `along` the diagonal and `across` it from the composition's centre. */
	at(along: number, across?: number): Point;
}

interface Disc {
	x: number;
	y: number;
	radius: number;
	color: string;
}

function layAxis(c: Composer): Axis {
	c.stream(0);
	const angle = (c.pick([-60, -45, -45, -30, -22, 22, 30, 45, 45, 60]) * Math.PI) / 180;
	const direction: Point = [Math.cos(angle), Math.sin(angle)];
	const normal: Point = [-direction[1], direction[0]];
	const cx = c.width * c.range(0.4, 0.6);
	const cy = c.height * c.range(0.4, 0.6);
	c.misregisterPlates();
	c.setColophon('ПРОУН', 24, 1919, 1932);
	return {
		angle,
		direction,
		normal,
		at: (along, across = 0) => [
			cx + direction[0] * along + normal[0] * across,
			cy + direction[1] * along + normal[1] * across
		]
	};
}

function ground(c: Composer, axis: Axis): void {
	const { width: W, height: H, short: S, palette: P } = c;
	c.stream(1);
	if (!c.chance(0.7)) return;
	const color = c.chance(0.82) ? P.paper2 : c.accent();
	const alpha = color === P.paper2 ? 1 : 0.55;
	const mode = c.pick(['half', 'band', 'band', 'disc']);
	if (mode === 'half') {
		const [x, y] = axis.at(c.range(-S * 0.3, S * 0.3));
		const angle = axis.angle + c.pick([0, QUARTER_TURN]);
		c.add(null, (ctx) => {
			ctx.fillStyle = color;
			ctx.globalAlpha = alpha;
			ctx.translate(x, y);
			ctx.rotate(angle);
			ctx.fillRect(-W * 3, 0, W * 6, H * 3);
		});
	} else if (mode === 'band') {
		const [x, y] = axis.at(c.range(-S * 0.3, S * 0.3), c.range(-S * 0.3, S * 0.3));
		const breadth = S * c.range(0.22, 0.5);
		const angle = axis.angle + c.pick([0, QUARTER_TURN]);
		c.add(null, (ctx) => {
			ctx.fillStyle = color;
			ctx.globalAlpha = alpha;
			ctx.translate(x, y);
			ctx.rotate(angle);
			ctx.fillRect(-W * 3, -breadth / 2, W * 6, breadth);
		});
	} else {
		const x = W * c.range(0.2, 0.8);
		const y = H * c.range(0.2, 0.8);
		const radius = S * c.range(0.4, 0.65);
		c.add(null, (ctx) => {
			ctx.fillStyle = color;
			ctx.globalAlpha = alpha;
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, TAU);
			ctx.fill();
		});
	}
}

function hairlines(c: Composer, axis: Axis): void {
	const { short: S, palette: P } = c;
	c.stream(2);
	for (let i = 0, n = c.count(1, 3.4); i < n; i++) {
		const angle = c.pick([axis.angle, axis.angle, axis.angle + QUARTER_TURN, axis.angle + c.range(-0.35, 0.35)]);
		const lines = c.int(1, 5);
		const gap = S * c.range(0.011, 0.026);
		const length = S * c.range(0.5, 1.5);
		const weight = S * c.range(0.0016, 0.0045);
		const [x, y] = axis.at(c.range(-S * 0.5, S * 0.5), c.range(-S * 0.4, S * 0.4));
		const color = c.chance(0.8) ? P.ink : P.red;
		c.add(color, (ctx) => {
			ctx.translate(x, y);
			ctx.rotate(angle);
			ctx.fillStyle = color;
			for (let j = 0; j < lines; j++) ctx.fillRect(-length / 2, j * gap - (lines * gap) / 2, length, weight);
		});
	}
}

function arcs(c: Composer, axis: Axis): void {
	const { short: S, palette: P } = c;
	c.stream(3);
	for (let i = 0, n = c.count(0, 2.4); i < n; i++) {
		const [x, y] = axis.at(c.range(-S * 0.4, S * 0.4), c.range(-S * 0.4, S * 0.4));
		const radius = S * c.range(0.18, 0.55);
		const start = c.range(0, TAU);
		const sweep = c.range(0.5, 2.4);
		const weight = S * c.range(0.005, 0.03);
		const color = c.chance(0.6) ? P.ink : c.chance(0.5) ? P.red : c.accent();
		c.add(color, (ctx) => {
			ctx.strokeStyle = color;
			ctx.lineWidth = weight;
			ctx.lineCap = 'butt';
			ctx.beginPath();
			ctx.arc(x, y, radius, start, start + sweep);
			ctx.stroke();
		});
	}
}

function spine(c: Composer, axis: Axis): void {
	const { short: S, palette: P } = c;
	c.stream(4);
	if (!c.chance(0.78)) return;
	const length = S * c.range(0.9, 1.6);
	const thickness = S * c.range(0.012, 0.034);
	const [x, y] = axis.at(c.range(-S * 0.1, S * 0.1), c.range(-S * 0.22, S * 0.22));
	const color = c.chance(0.7) ? P.ink : P.red;
	c.add(color, (ctx) => {
		ctx.fillStyle = color;
		ctx.translate(x, y);
		ctx.rotate(axis.angle);
		ctx.fillRect(-length / 2, -thickness / 2, length, thickness);
	});
}

function disc(c: Composer, axis: Axis): Disc {
	const { width: W, height: H, short: S, palette: P } = c;
	const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
	c.stream(5);
	const radius = S * c.range(0.14, 0.28);
	const [ax, ay] = axis.at(c.range(-S * 0.28, S * 0.05), c.range(-S * 0.18, S * 0.18));
	const x = clamp(ax, W * 0.2, W * 0.8);
	const y = clamp(ay, H * 0.18, H * 0.82);
	const color = c.chance(0.6) ? P.red : P.ink;
	const other = color === P.red ? P.ink : P.red;
	const kind = c.pick(['solid', 'solid', 'solid', 'split', 'split', 'ring']);
	const splitAngle = axis.angle + c.pick([0, QUARTER_TURN]);
	const splitColor = c.chance(0.55) ? other : c.accent();
	const ringWidth = radius * c.range(0.12, 0.3);
	const moon = c.chance(0.45)
		? { x: W * c.range(0.12, 0.88), y: H * c.range(0.12, 0.88), radius: S * c.range(0.025, 0.075), color: c.anyColor() }
		: null;

	if (c.plates.keyForm) {
		if (kind === 'solid') {
			c.add(color, (ctx) => {
				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.arc(x, y, radius, 0, TAU);
				ctx.fill();
			});
		} else if (kind === 'split') {
			const half = (fill: string, from: number) =>
				c.add(fill, (ctx) => {
					ctx.fillStyle = fill;
					ctx.beginPath();
					ctx.arc(x, y, radius, from, from + Math.PI);
					ctx.closePath();
					ctx.fill();
				});
			half(color, splitAngle);
			half(splitColor, splitAngle + Math.PI);
		} else {
			c.add(color, (ctx) => {
				ctx.strokeStyle = color;
				ctx.lineWidth = ringWidth;
				ctx.beginPath();
				ctx.arc(x, y, radius - ringWidth / 2, 0, TAU);
				ctx.stroke();
			});
		}
	}
	if (moon) {
		c.add(moon.color, (ctx) => {
			ctx.fillStyle = moon.color;
			ctx.beginPath();
			ctx.arc(moon.x, moon.y, moon.radius, 0, TAU);
			ctx.fill();
		});
	}
	return { x, y, radius, color };
}

function prouns(c: Composer, axis: Axis): void {
	const { short: S, palette: P } = c;
	c.stream(6);
	if (!c.plates.volumes) return;
	for (let i = 0, n = Math.max(1, c.count(1, 2.8)); i < n; i++) {
		const [x, y] = axis.at(c.range(-S * 0.42, S * 0.42), c.range(-S * 0.36, S * 0.36));
		const a = S * c.range(0.06, 0.2);
		const b = S * c.range(0.04, 0.15);
		const h = S * c.range(0.03, 0.26);
		const tilt = axis.angle * 0.22 + c.range(-0.18, 0.18);
		const color = c.anyColor();
		const wireframe = c.chance(0.35);
		const weight = S * 0.0022;
		const faces = centredIsoBoxFaces(a, b, h);
		const top = tint(color, 0.28);
		const line = color === P.ink ? P.red : P.ink;
		c.add(wireframe ? line : color, (ctx) => {
			ctx.translate(x, y);
			ctx.rotate(tilt);
			if (!wireframe) {
				fillBox(ctx, faces, { left: color, right: shade(color, 0.38), top });
				return;
			}
			ctx.fillStyle = top;
			tracePolygon(ctx, faces.top);
			ctx.fill();
			ctx.strokeStyle = line;
			ctx.lineWidth = weight;
			ctx.lineJoin = 'miter';
			for (const face of [faces.top, faces.left, faces.right]) {
				tracePolygon(ctx, face);
				ctx.stroke();
			}
			const [corner, alongA, , alongB] = faces.base;
			ctx.setLineDash([weight * 4, weight * 3]);
			ctx.beginPath();
			for (const end of [alongA, alongB, faces.top[0]]) {
				ctx.moveTo(...corner);
				ctx.lineTo(...end);
			}
			ctx.stroke();
		});
	}
}

function bars(c: Composer, axis: Axis): void {
	const { short: S } = c;
	c.stream(7);
	for (let i = 0, n = c.count(3, 6.5); i < n; i++) {
		const angle = c.chance(0.7) ? axis.angle : axis.angle + QUARTER_TURN;
		const length = S * c.range(0.12, 0.56);
		const thickness = S * c.range(0.016, 0.075);
		const [x, y] = axis.at(c.range(-S * 0.55, S * 0.55), c.range(-S * 0.42, S * 0.42));
		const color = c.anyColor();
		const depth = c.chance(0.24) ? Math.min(thickness * 1.2, S * 0.04) * c.range(0.6, 1) : 0;
		const side = c.chance(0.5) ? 1 : -1;
		c.add(color, (ctx) => {
			ctx.translate(x, y);
			ctx.rotate(angle);
			if (depth) {
				const dx = depth * 0.8;
				const dy = depth * 0.8 * side;
				const edge = side > 0 ? thickness / 2 : -thickness / 2;
				ctx.fillStyle = shade(color, 0.35);
				tracePolygon(ctx, [
					[length / 2, -thickness / 2],
					[length / 2 + dx, -thickness / 2 + dy],
					[length / 2 + dx, thickness / 2 + dy],
					[length / 2, thickness / 2]
				]);
				ctx.fill();
				ctx.fillStyle = tint(color, 0.22);
				tracePolygon(ctx, [
					[-length / 2, edge],
					[length / 2, edge],
					[length / 2 + dx, edge + dy],
					[-length / 2 + dx, edge + dy]
				]);
				ctx.fill();
			}
			ctx.fillStyle = color;
			ctx.fillRect(-length / 2, -thickness / 2, length, thickness);
		});
	}
}

function wedge(c: Composer, axis: Axis, target: Disc): void {
	const { short: S, palette: P } = c;
	c.stream(8);
	if (!c.plates.keyForm || !c.chance(0.88)) return;
	const side = c.chance(0.5) ? 1 : -1;
	const length = S * c.range(0.45, 0.9);
	const halfBase = S * c.range(0.05, 0.12);
	const [dx, dy] = [axis.direction[0] * side, axis.direction[1] * side];
	const tipX = target.x - dx * target.radius * c.range(0, 0.5);
	const tipY = target.y - dy * target.radius * c.range(0, 0.5);
	const tip: Point = [tipX, tipY];
	const base: Point = [target.x + dx * length, target.y + dy * length];
	const [nx, ny] = axis.normal;
	const color = target.color === P.red ? (c.chance(0.5) ? P.ink : P.paper) : P.red;
	c.add(color === P.paper ? null : color, (ctx) => {
		ctx.fillStyle = color;
		tracePolygon(ctx, [
			tip,
			[base[0] + nx * halfBase, base[1] + ny * halfBase],
			[base[0] - nx * halfBase, base[1] - ny * halfBase]
		]);
		ctx.fill();
	});
	if (c.chance(0.4)) {
		const [x, y] = axis.at(c.range(-S * 0.45, S * 0.45), c.range(-S * 0.4, S * 0.4));
		const reach = S * c.range(0.15, 0.35);
		const spread = S * c.range(0.015, 0.04);
		const angle = axis.angle + c.pick([QUARTER_TURN, -QUARTER_TURN, Math.PI * 0.25]);
		const splinter = c.anyColor();
		c.add(splinter, (ctx) => {
			ctx.fillStyle = splinter;
			ctx.translate(x, y);
			ctx.rotate(angle);
			tracePolygon(ctx, [
				[0, 0],
				[reach, -spread],
				[reach, spread]
			]);
			ctx.fill();
		});
	}
}

function marks(c: Composer, axis: Axis): void {
	const { width: W, height: H, short: S, palette: P } = c;
	c.stream(9);
	for (let i = 0, n = c.count(2, 5); i < n; i++) {
		const size = S * c.range(0.012, 0.045);
		const x = W * c.range(0.1, 0.9);
		const y = H * c.range(0.1, 0.9);
		const angle = c.chance(0.6) ? axis.angle : 0;
		const color = c.chance(0.5) ? P.red : P.ink;
		c.add(color, (ctx) => {
			ctx.fillStyle = color;
			ctx.translate(x, y);
			ctx.rotate(angle);
			ctx.fillRect(-size / 2, -size / 2, size, size);
		});
	}
	if (!c.chance(0.35)) return;
	const dots = c.int(3, 7);
	const radius = S * c.range(0.006, 0.014);
	const gap = S * c.range(0.024, 0.04);
	const [x, y] = axis.at(c.range(-S * 0.4, S * 0.4), c.range(-S * 0.35, S * 0.35));
	const angle = c.pick([axis.angle, axis.angle + QUARTER_TURN]);
	const color = c.chance(0.7) ? P.ink : P.red;
	c.add(color, (ctx) => {
		ctx.fillStyle = color;
		ctx.translate(x, y);
		ctx.rotate(angle);
		for (let j = 0; j < dots; j++) {
			ctx.beginPath();
			ctx.arc(j * gap, 0, radius, 0, TAU);
			ctx.fill();
		}
	});
}

function lettering(c: Composer, axis: Axis): void {
	const { width: W, height: H, short: S, palette: P } = c;
	c.stream(10);
	if (!c.plates.type) return;
	for (let i = 0, n = Math.max(1, c.count(1, 3)); i < n; i++) {
		const text = c.pick(SLOGANS);
		const size = S * c.range(0.04, 0.105) * (text.length > 6 ? 0.72 : 1);
		const angle = c.pick([axis.angle, axis.angle, -QUARTER_TURN, 0, axis.angle - QUARTER_TURN]);
		const x = W * c.range(0.1, 0.72);
		const y = H * c.range(0.14, 0.9);
		const style = c.pick<WordStyle>(['plain', 'plain', 'band', 'spaced']);
		const color = c.chance(0.55) ? P.ink : P.red;
		const band = c.chance(0.5) ? P.red : P.ink;
		c.add(style === 'band' ? null : color, paintWord(P, { text, x, y, angle, size, style, color, band }));
	}
	if (c.chance(0.3)) {
		const text = c.pick(SLOGANS.filter((word) => word.length <= 5));
		const size = S * c.range(0.03, 0.055);
		const x = W * c.range(0.08, 0.9);
		const y = H * c.range(0.08, 0.5);
		const color = c.chance(0.5) ? P.red : P.ink;
		c.add(color, (ctx) => {
			ctx.font = `${size}px ${DISPLAY_FONT}`;
			ctx.fillStyle = color;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			[...text].forEach((letter, j) => ctx.fillText(letter, x, y + j * size * 1.1));
		});
	}
	if (c.chance(0.65)) {
		const lines = pickImprint(c, IMPRINTS);
		const size = S * c.range(0.012, 0.017);
		const [x, y] = axis.at(c.range(-S * 0.35, S * 0.35), c.range(-S * 0.35, S * 0.35));
		const angle = c.pick([axis.angle, 0, -QUARTER_TURN]);
		c.add(P.ink, paintImprint(lines, x, y, angle, size, P.ink));
	}
}

export const lissitzky: Artist = {
	id: 'lissitzky',
	name: 'El Lissitzky',
	shortName: 'Lissitzky',
	years: '1890–1941',
	palette: 'proun',
	plateLabels: { keyForm: 'Wedge & disc', volumes: 'Proun volumes', type: 'Cyrillic type' },
	note: 'Prouns and propaganda: a wedge driven into a disc, axonometric volumes and bars locked to one diagonal.',
	compose(c) {
		const axis = layAxis(c);
		ground(c, axis);
		hairlines(c, axis);
		arcs(c, axis);
		spine(c, axis);
		const target = disc(c, axis);
		prouns(c, axis);
		bars(c, axis);
		wedge(c, axis, target);
		marks(c, axis);
		lettering(c, axis);
	}
};
