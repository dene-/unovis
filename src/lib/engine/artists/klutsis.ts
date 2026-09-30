import type { Composer } from '../composer';
import { shade, tint } from '../color';
import { TAU, centredIsoBoxFaces, fillBox, tracePolygon } from '../geometry';
import type { Artist } from './artist';
import { IMPRINTS, NUMERALS, PLAN_SLOGANS } from './lexicon';
import { paintImprint, paintWord, readable, type WordStyle } from './lettering';

interface Dynamics {
	/** Vanishing point the rays burst from. */
	vx: number;
	vy: number;
	cx: number;
	cy: number;
	angle: number;
}

function rayBurst(c: Composer, d: Dynamics): void {
	const { short: S, palette: P } = c;
	c.stream(1);
	if (!c.plates.keyForm) return;
	const rays = c.int(7, 15);
	const span = c.range(0.5, 1.1);
	const bold = c.chance(0.55);
	const color = bold ? P.red : P.paper2;
	const reach = S * 3;
	c.add(bold ? color : null, (ctx) => {
		ctx.fillStyle = color;
		for (let k = 0; k < rays; k += 2) {
			const from = d.angle - span / 2 + (k * span) / rays;
			const to = from + span / rays;
			tracePolygon(ctx, [
				[d.vx, d.vy],
				[d.vx + Math.cos(from) * reach, d.vy + Math.sin(from) * reach],
				[d.vx + Math.cos(to) * reach, d.vy + Math.sin(to) * reach]
			]);
			ctx.fill();
		}
	});
}

function banners(c: Composer, d: Dynamics): void {
	const { short: S, palette: P } = c;
	c.stream(2);
	for (let i = 0, n = c.count(1, 4); i < n; i++) {
		const thickness = S * c.range(0.02, 0.07);
		const length = S * c.range(0.5, 1.5);
		const across = S * c.range(-0.45, 0.45);
		const along = S * c.range(-0.3, 0.3);
		const color = c.chance(0.55) ? P.red : P.ink;
		const x = d.cx + Math.cos(d.angle) * along - Math.sin(d.angle) * across;
		const y = d.cy + Math.sin(d.angle) * along + Math.cos(d.angle) * across;
		c.add(color, (ctx) => {
			ctx.fillStyle = color;
			ctx.translate(x, y);
			ctx.rotate(d.angle);
			ctx.fillRect(-length / 2, -thickness / 2, length, thickness);
		});
	}
}

/** The gridded disc of the dynamic-city posters. Returns its radius, or 0 when there is none. */
function cityDisc(c: Composer, d: Dynamics): number {
	const { short: S, palette: P } = c;
	c.stream(3);
	if (!c.chance(0.75)) return 0;
	const radius = S * c.range(0.15, 0.26);
	const color = c.chance(0.55) ? P.ink : P.red;
	const x = d.cx + S * c.range(-0.08, 0.08);
	const y = d.cy + S * c.range(-0.08, 0.08);
	const meridians = c.int(2, 5);
	const tilt = c.range(-0.5, 0.5);
	c.add(color, (ctx) => {
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, TAU);
		ctx.fill();
		ctx.strokeStyle = P.paper;
		ctx.lineWidth = S * 0.003;
		ctx.translate(x, y);
		ctx.rotate(tilt);
		for (let j = 1; j <= meridians; j++) {
			ctx.beginPath();
			ctx.ellipse(0, 0, (radius * j) / (meridians + 1), radius, 0, 0, TAU);
			ctx.stroke();
		}
		for (let j = -meridians; j <= meridians; j++) {
			const py = (radius * j) / (meridians + 1);
			const half = Math.sqrt(radius * radius - py * py);
			ctx.beginPath();
			ctx.moveTo(-half, py);
			ctx.lineTo(half, py);
			ctx.stroke();
		}
	});
	return radius;
}

/** Halftone patches standing in for photomontage. */
function halftones(c: Composer, d: Dynamics): void {
	const { width: W, height: H, short: S, palette: P } = c;
	c.stream(4);
	for (let i = 0, n = c.count(1, 2.4); i < n; i++) {
		const width = S * c.range(0.18, 0.36);
		const height = S * c.range(0.14, 0.3);
		const x = W * c.range(0.15, 0.85);
		const y = H * c.range(0.15, 0.85);
		const angle = c.chance(0.6) ? d.angle : 0;
		const step = S * c.range(0.009, 0.014);
		const waveX = c.range(2, 6) / width;
		const waveY = c.range(2, 6) / height;
		const phase = c.range(0, TAU);
		const backed = c.chance(0.5);
		c.add(P.ink, (ctx) => {
			ctx.translate(x, y);
			ctx.rotate(angle);
			if (backed) {
				ctx.fillStyle = P.paper2;
				ctx.fillRect(-width / 2, -height / 2, width, height);
			}
			ctx.fillStyle = P.ink;
			for (let py = -height / 2 + step / 2; py < height / 2; py += step) {
				for (let px = -width / 2 + step / 2; px < width / 2; px += step) {
					const tone =
						0.5 +
						0.5 *
							Math.sin(px * waveX * Math.PI + phase) *
							Math.cos(py * waveY * Math.PI - phase * 0.7);
					ctx.beginPath();
					ctx.arc(px, py, step * 0.54 * Math.max(0.1, tone), 0, TAU);
					ctx.fill();
				}
			}
		});
	}
}

function floatingBlocks(c: Composer, d: Dynamics, discRadius: number): void {
	const S = c.short;
	c.stream(5);
	if (!c.plates.volumes) return;
	for (let i = 0, n = c.count(2, 5); i < n; i++) {
		const bearing = c.range(0, TAU);
		const distance = (discRadius || S * 0.15) * c.range(1.1, 1.9);
		const x = d.cx + Math.cos(bearing) * distance;
		const y = d.cy + Math.sin(bearing) * distance;
		const faces = centredIsoBoxFaces(
			S * c.range(0.03, 0.09),
			S * c.range(0.03, 0.08),
			S * c.range(0.04, 0.14)
		);
		const tilt = d.angle * 0.3 + c.range(-0.3, 0.3);
		const color = c.anyColor();
		c.add(color, (ctx) => {
			ctx.translate(x, y);
			ctx.rotate(tilt);
			fillBox(ctx, faces, { left: color, right: shade(color, 0.38), top: tint(color, 0.28) });
		});
	}
}

function slogans(c: Composer, d: Dynamics): void {
	const { width: W, height: H, short: S, palette: P } = c;
	c.stream(6);
	if (!c.plates.type) return;
	const numeral = c.pick(NUMERALS);
	const numeralSize = S * c.range(0.18, 0.3) * (numeral.length > 2 ? 0.55 : 1);
	const nx = W * c.range(0.06, 0.5);
	const ny = H * c.range(0.2, 0.85);
	const numeralColor = c.chance(0.6) ? P.red : P.ink;
	const outlined = c.chance(0.35);
	c.add(
		numeralColor,
		paintWord(P, {
			text: numeral,
			x: nx,
			y: ny,
			angle: 0,
			size: numeralSize,
			style: outlined ? 'outline' : 'plain',
			color: numeralColor
		})
	);

	const text = c.pick(PLAN_SLOGANS);
	const size = S * c.range(0.045, 0.075);
	const x = W * c.range(0.08, 0.5);
	const y = H * c.range(0.1, 0.9);
	const style = c.pick<WordStyle>(['band', 'band', 'plain', 'spaced']);
	const band = c.chance(0.6) ? P.red : P.ink;
	c.add(
		style === 'band' ? null : P.ink,
		paintWord(P, { text, x, y, angle: readable(d.angle), size, style, color: P.ink, band })
	);

	if (c.chance(0.6)) {
		const lines = [c.pick(IMPRINTS), c.pick(IMPRINTS)];
		const ix = W * c.range(0.1, 0.7);
		const iy = H * c.range(0.1, 0.9);
		c.add(P.ink, paintImprint(lines, ix, iy, 0, S * c.range(0.012, 0.016), P.ink));
	}
}

export const klutsis: Artist = {
	id: 'klutsis',
	name: 'Gustav Klutsis',
	shortName: 'Klutsis',
	years: '1895–1938',
	palette: 'steel',
	plateLabels: { keyForm: 'Ray burst', volumes: 'Floating blocks', type: 'Cyrillic type' },
	note: 'Dynamic-city posters: rays from a vanishing point, a gridded disc, halftone fields in place of photomontage and giant numerals.',
	compose(c) {
		c.stream(0);
		const vx = c.width * c.pick([c.range(0.02, 0.3), c.range(0.7, 0.98)]);
		const vy = c.height * c.pick([c.range(0.02, 0.25), c.range(0.75, 0.98)]);
		const cx = c.width * c.range(0.38, 0.62);
		const cy = c.height * c.range(0.36, 0.6);
		const dynamics: Dynamics = { vx, vy, cx, cy, angle: Math.atan2(cy - vy, cx - vx) };
		c.misregisterPlates();
		c.setColophon('ПЛАКАТ', 50, 1920, 1935);
		rayBurst(c, dynamics);
		banners(c, dynamics);
		const discRadius = cityDisc(c, dynamics);
		halftones(c, dynamics);
		floatingBlocks(c, dynamics, discRadius);
		slogans(c, dynamics);
	}
};
