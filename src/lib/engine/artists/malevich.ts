import type { Composer } from '../composer';
import { shade, tint } from '../color';
import { QUARTER_TURN, TAU, isoBoxFaces, fillBox, tracePolygon, type Point } from '../geometry';
import type { Artist } from './artist';

interface Field {
	angle: number;
	x: number;
	y: number;
	spread: number;
}

/** A rectangle with slightly uneven corners, like a hand-cut and hand-painted plane. */
function handCut(c: Composer, length: number, thickness: number): Point[] {
	const jitter = c.short * 0.004;
	const wobble = () => c.range(-jitter, jitter);
	return [
		[-length / 2 + wobble(), -thickness / 2 + wobble()],
		[length / 2 + wobble(), -thickness / 2 + wobble()],
		[length / 2 + wobble(), thickness / 2 + wobble()],
		[-length / 2 + wobble(), thickness / 2 + wobble()]
	];
}

function plane(
	c: Composer,
	color: string,
	x: number,
	y: number,
	angle: number,
	points: Point[],
	alpha = 1
) {
	c.add(color, (ctx) => {
		ctx.globalAlpha = alpha;
		ctx.fillStyle = color;
		ctx.translate(x, y);
		ctx.rotate(angle);
		tracePolygon(ctx, points);
		ctx.fill();
	});
}

function disc(c: Composer, color: string, x: number, y: number, radius: number) {
	c.add(color, (ctx) => {
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, TAU);
		ctx.fill();
	});
}

function dissolvingPlane(c: Composer, field: Field): void {
	const S = c.short;
	c.stream(1);
	if (!c.chance(0.5)) return;
	const length = S * c.range(0.5, 0.9);
	const thickness = S * c.range(0.2, 0.45);
	const color = c.chance(0.5) ? c.accent() : c.palette.ink;
	const x = field.x + S * c.range(-0.2, 0.2);
	const y = field.y + S * c.range(-0.2, 0.2);
	const angle = field.angle + c.range(-0.3, 0.3);
	const points = handCut(c, length, thickness);
	plane(c, color, x, y, angle, points, c.range(0.07, 0.16));
}

function dominantForm(c: Composer, field: Field): void {
	const { short: S, palette: P } = c;
	c.stream(2);
	if (!c.plates.keyForm) return;
	const kind = c.pick(['square', 'trapezoid', 'cross', 'circle', 'bar']);
	const size = S * c.range(0.2, 0.34);
	const x = field.x + S * c.range(-0.12, 0.12);
	const y = field.y + S * c.range(-0.12, 0.12);
	const angle = field.angle + c.range(-0.2, 0.2);
	const taper = c.range(0.5, 0.85);
	if (kind === 'square') {
		plane(c, P.ink, x, y, angle, handCut(c, size, size));
	} else if (kind === 'trapezoid') {
		plane(c, P.red, x, y, angle, [
			[-size * 0.6, -size * 0.3],
			[size * 0.6, -size * 0.3 * taper],
			[size * 0.6, size * 0.3 * taper],
			[-size * 0.6, size * 0.3]
		]);
	} else if (kind === 'cross') {
		const color = c.chance(0.6) ? P.ink : P.red;
		const arm = size * c.range(0.2, 0.28);
		plane(c, color, x, y, angle, handCut(c, size * 1.2, arm));
		const uprightAngle = angle + QUARTER_TURN + c.range(-0.1, 0.1);
		plane(c, color, x, y, uprightAngle, handCut(c, size * 0.9, arm));
	} else if (kind === 'circle') {
		disc(c, c.chance(0.5) ? P.ink : P.red, x, y, size * 0.45);
	} else {
		plane(c, P.red, x, y, angle, handCut(c, size * 2, size * 0.26));
	}
}

function floatingPlanes(c: Composer, field: Field): void {
	const { short: S, palette: P } = c;
	c.stream(3);
	const planes: {
		x: number;
		y: number;
		angle: number;
		points: Point[];
		color: string;
		area: number;
	}[] = [];
	for (let i = 0, n = c.count(8, 16); i < n; i++) {
		const angle = c.chance(0.65)
			? field.angle
			: c.chance(0.6)
				? field.angle + QUARTER_TURN
				: field.angle + c.range(-0.35, 0.35);
		const along = (c.range(0, 1) + c.range(0, 1) - 1) * field.spread * 1.4;
		const across = (c.range(0, 1) + c.range(0, 1) - 1) * field.spread;
		const x = field.x + Math.cos(field.angle) * along - Math.sin(field.angle) * across;
		const y = field.y + Math.sin(field.angle) * along + Math.cos(field.angle) * across;
		const length = S * c.range(0.03, 0.3) * (c.chance(0.2) ? 1.6 : 1);
		const thickness = Math.min(S * 0.09, length * c.range(0.06, 0.4));
		const roll = c.range(0, 1);
		const color = roll < 0.3 ? P.ink : roll < 0.55 ? P.red : c.accent();
		planes.push({
			x,
			y,
			angle,
			points: handCut(c, length, thickness),
			color,
			area: length * thickness
		});
	}
	planes
		.sort((a, b) => b.area - a.area)
		.forEach((p) => plane(c, p.color, p.x, p.y, p.angle, p.points));
}

function hairlines(c: Composer, field: Field): void {
	const { short: S, palette: P } = c;
	c.stream(4);
	for (let i = 0, n = c.count(1, 3.5); i < n; i++) {
		const angle = c.chance(0.6) ? field.angle : field.angle + QUARTER_TURN;
		const length = S * c.range(0.3, 0.8);
		const weight = S * c.range(0.002, 0.006);
		const x = field.x + S * c.range(-0.25, 0.25);
		const y = field.y + S * c.range(-0.25, 0.25);
		c.add(P.ink, (ctx) => {
			ctx.fillStyle = P.ink;
			ctx.translate(x, y);
			ctx.rotate(angle);
			ctx.fillRect(-length / 2, -weight / 2, length, weight);
		});
	}
}

function satellites(c: Composer, field: Field): void {
	const S = c.short;
	c.stream(5);
	for (let i = 0, n = c.count(0, 2.2); i < n; i++) {
		const color = c.chance(0.5) ? c.palette.ink : c.accent();
		const x = field.x + S * c.range(-0.38, 0.38);
		const y = field.y + S * c.range(-0.38, 0.38);
		disc(c, color, x, y, S * c.range(0.01, 0.04));
	}
}

/** A white plaster tower of stacked blocks, after the Arkhitektons. */
function arkhitekton(c: Composer): void {
	const { width: W, height: H, short: S, palette: P } = c;
	const cos30 = Math.cos(Math.PI / 6);
	c.stream(6);
	if (!c.plates.volumes) return;
	const levels = c.int(3, 7);
	let x = W * c.range(0.25, 0.7);
	let y = H * c.range(0.78, 0.92);
	let a = S * c.range(0.14, 0.24);
	let b = S * c.range(0.1, 0.18);
	const blocks: [number, number, number, number, number][] = [];
	for (let k = 0; k < levels; k++) {
		const h = S * c.range(0.02, 0.07);
		blocks.push([x, y, a, b, h]);
		if (c.chance(0.35)) {
			const wingA = a * c.range(1.2, 1.7);
			const wingB = b * c.range(0.2, 0.35);
			const wingH = h * c.range(0.4, 0.8);
			blocks.push([
				x - cos30 * (wingA - a) * 0.5,
				y - 0.5 * (wingA - a) * 0.5 - h + wingH,
				wingA,
				wingB,
				wingH
			]);
		}
		const nextA = a * c.range(0.55, 0.88);
		const nextB = b * c.range(0.55, 0.88);
		const slideA = c.range(0, 1);
		const slideB = c.range(0, 1);
		x += cos30 * (a - nextA) * slideA - cos30 * (b - nextB) * slideB;
		y += -h + 0.5 * (a - nextA) * slideA + 0.5 * (b - nextB) * slideB;
		a = nextA;
		b = nextB;
	}
	const colors = {
		top: tint(P.paper, 0.6),
		left: shade(P.paper, 0.07),
		right: shade(P.paper, 0.2)
	};
	c.add(null, (ctx) => {
		ctx.lineWidth = S * 0.0012;
		ctx.strokeStyle = P.ink;
		for (const [bx, by, ba, bb, bh] of blocks) {
			const faces = isoBoxFaces(bx, by, ba, bb, bh);
			fillBox(ctx, faces, colors);
			ctx.globalAlpha = 0.4;
			for (const face of [faces.left, faces.right, faces.top]) {
				tracePolygon(ctx, face);
				ctx.stroke();
			}
			ctx.globalAlpha = 1;
		}
	});
}

export const malevich: Artist = {
	id: 'malevich',
	name: 'Kazimir Malevich',
	shortName: 'Malevich',
	years: '1879–1935',
	palette: 'suprematist',
	plateLabels: { keyForm: 'Dominant plane', volumes: 'Arkhitekton', type: 'Colophon' },
	note: 'Suprematism, the movement Constructivism grew out of: hand-cut planes floating on an open white field, with plaster Arkhitekton towers.',
	compose(c) {
		c.stream(0);
		const field: Field = {
			angle: c.range(-0.9, 0.9),
			x: c.width * c.range(0.35, 0.65),
			y: c.height * c.range(0.33, 0.6),
			spread: c.short * c.range(0.2, 0.34)
		};
		c.misregisterPlates();
		c.setColophon('СУПРЕМАТИЗМ', 80, 1915, 1920);
		dissolvingPlane(c, field);
		dominantForm(c, field);
		floatingPlanes(c, field);
		hairlines(c, field);
		satellites(c, field);
		arkhitekton(c);
	}
};
