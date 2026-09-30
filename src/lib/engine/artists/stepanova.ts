import type { Composer } from '../composer';
import { shade } from '../color';
import { BODY_FONT, DISPLAY_FONT, setLetterSpacing } from '../fonts';
import { QUARTER_TURN, TAU, tracePolygon } from '../geometry';
import type { Artist } from './artist';

const MOTIFS = [
	'disc',
	'half',
	'ring',
	'square',
	'framedSquare',
	'triangle',
	'diamond',
	'quarter',
	'bars',
	'cross',
	'fourDots'
] as const;

type Motif = (typeof MOTIFS)[number];
type Arrangement = 'checker' | 'rows' | 'columns' | 'diagonal';

function paintMotif(ctx: CanvasRenderingContext2D, motif: Motif, size: number, color: string, inner: string) {
	const h = size / 2;
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	switch (motif) {
		case 'disc':
			ctx.beginPath();
			ctx.arc(0, 0, h, 0, TAU);
			ctx.fill();
			break;
		case 'half':
			ctx.beginPath();
			ctx.arc(0, h * 0.3, h, Math.PI, TAU);
			ctx.closePath();
			ctx.fill();
			break;
		case 'ring':
			ctx.lineWidth = size * 0.18;
			ctx.beginPath();
			ctx.arc(0, 0, h - size * 0.09, 0, TAU);
			ctx.stroke();
			break;
		case 'square':
			ctx.fillRect(-h, -h, size, size);
			break;
		case 'framedSquare':
			ctx.fillRect(-h, -h, size, size);
			ctx.fillStyle = inner;
			ctx.fillRect(-h * 0.45, -h * 0.45, h * 0.9, h * 0.9);
			break;
		case 'triangle':
			tracePolygon(ctx, [
				[-h, h],
				[h, h],
				[-h, -h]
			]);
			ctx.fill();
			break;
		case 'diamond':
			tracePolygon(ctx, [
				[0, -h],
				[h, 0],
				[0, h],
				[-h, 0]
			]);
			ctx.fill();
			break;
		case 'quarter':
			ctx.beginPath();
			ctx.moveTo(-h, -h);
			ctx.arc(-h, -h, size, 0, QUARTER_TURN);
			ctx.closePath();
			ctx.fill();
			break;
		case 'bars':
			for (let k = 0; k < 3; k++) ctx.fillRect(-h, -h + k * size * 0.39, size, size * 0.22);
			break;
		case 'cross':
			ctx.fillRect(-h, -size * 0.14, size, size * 0.28);
			ctx.fillRect(-size * 0.14, -h, size * 0.28, size);
			break;
		case 'fourDots':
			for (const [sx, sy] of [
				[-1, -1],
				[1, -1],
				[1, 1],
				[-1, 1]
			]) {
				ctx.beginPath();
				ctx.arc(sx * h * 0.5, sy * h * 0.5, h * 0.36, 0, TAU);
				ctx.fill();
			}
			break;
	}
}

const mod = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;

function belongsToSecond(arrangement: Arrangement, column: number, row: number): number {
	if (arrangement === 'checker') return mod(column + row, 2);
	if (arrangement === 'rows') return mod(row, 2);
	if (arrangement === 'columns') return column % 2;
	return mod(column + row, 3) === 0 ? 1 : 0;
}

function repeatPattern(c: Composer): void {
	const { width: W, height: H, short: S, palette: P, density } = c;
	const scaled = Math.round(c.range(5, 10) * (density < 1 ? 0.72 : density > 1 ? 1.35 : 1));
	const cell = S / Math.max(3, scaled);
	const columns = Math.ceil(W / cell);
	const rows = Math.ceil(H / cell) + 1;
	const first = c.pick(MOTIFS);
	let second = c.pick(MOTIFS);
	if (second === first) second = c.pick(MOTIFS);
	const firstColor = c.chance(0.6) ? P.red : P.ink;
	const secondColor = c.chance(0.6) ? (firstColor === P.red ? P.ink : P.red) : c.accent();
	const turnPerColumn = c.int(0, 3);
	const turnPerRow = c.int(0, 3);
	const scale = c.range(0.58, 0.84);
	const halfDrop = c.chance(0.3);
	const checkered = c.chance(0.35);
	const arrangement = c.pick<Arrangement>(['checker', 'checker', 'rows', 'columns', 'diagonal']);
	const border =
		c.plates.keyForm && c.chance(0.85)
			? {
					every: c.int(3, 5),
					kind: c.pick(['stripes', 'solid', 'zigzag']),
					color: c.chance(0.5) ? P.ink : P.red
				}
			: null;
	const shadow = shade(P.paper, 0.22);
	const offset = cell * 0.06;

	if (checkered) {
		c.add(null, (ctx) => {
			ctx.fillStyle = P.paper2;
			for (let j = 0; j < rows; j++)
				for (let i = 0; i < columns; i++) if ((i + j) % 2) ctx.fillRect(i * cell, j * cell, cell, cell);
		});
	}

	for (let row = halfDrop ? -1 : 0; row < rows; row++) {
		if (border && mod(row, border.every) === border.every - 1) {
			const y = row * cell;
			c.add(border.color, (ctx) => {
				ctx.fillStyle = border.color;
				if (border.kind === 'stripes') {
					for (let k = 0; k < 3; k++) ctx.fillRect(0, y + cell * (0.2 + k * 0.25), W, cell * 0.1);
				} else if (border.kind === 'solid') {
					ctx.fillRect(0, y + cell * 0.25, W, cell * 0.5);
				} else {
					ctx.beginPath();
					ctx.moveTo(0, y + cell * 0.75);
					for (let x = 0, k = 0; x <= W + cell; x += cell / 2, k++) ctx.lineTo(x, y + cell * (k % 2 ? 0.25 : 0.75));
					ctx.lineTo(W + cell, y + cell);
					ctx.lineTo(0, y + cell);
					ctx.closePath();
					ctx.fill();
				}
			});
			continue;
		}
		for (const pass of [0, 1]) {
			const color = pass ? secondColor : firstColor;
			const motif = pass ? second : first;
			c.add(color, (ctx) => {
				for (let column = 0; column <= columns; column++) {
					if (belongsToSecond(arrangement, column, row) !== pass) continue;
					const x = (column + 0.5) * cell;
					const y = (row + 0.5) * cell + (halfDrop && column % 2 ? cell / 2 : 0);
					ctx.save();
					ctx.translate(x, y);
					ctx.rotate(((column * turnPerColumn + row * turnPerRow) % 4) * QUARTER_TURN);
					if (c.plates.volumes) {
						ctx.save();
						ctx.translate(offset, offset);
						paintMotif(ctx, motif, cell * scale, shadow, shadow);
						ctx.restore();
					}
					paintMotif(ctx, motif, cell * scale, color, P.paper);
					ctx.restore();
				}
			});
		}
	}
}

/** A pinned swatch card, as sent round with textile samples. */
function sampleCard(c: Composer, number: number): void {
	const { width: W, height: H, short: S, palette: P } = c;
	c.stream(1);
	if (!c.plates.type) return;
	const cardWidth = S * c.range(0.28, 0.36);
	const cardHeight = cardWidth * 0.6;
	const x = W * c.range(0.06, 0.94) - cardWidth / 2;
	const y = H * c.range(0.08, 0.8);
	const angle = c.range(-0.08, 0.08);
	const stampAngle = c.range(-0.4, 0.4);
	const left = Math.min(W - cardWidth - S * 0.05, Math.max(S * 0.05, x));
	const lines = ['1-Я ГОС. СИТЦЕНАБИВНАЯ', 'ФАБРИКА · МОСКВА', 'РИСУНОК ' + c.seed.toUpperCase()];
	const u = cardHeight;
	c.add(null, (ctx) => {
		ctx.translate(left + cardWidth / 2, y + cardHeight / 2);
		ctx.rotate(angle);
		ctx.fillStyle = 'rgba(40,30,10,.22)';
		ctx.fillRect(-cardWidth / 2 + S * 0.006, -cardHeight / 2 + S * 0.008, cardWidth, cardHeight);
		ctx.fillStyle = P.paper;
		ctx.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
		ctx.strokeStyle = P.ink;
		ctx.lineWidth = S * 0.0018;
		ctx.strokeRect(-cardWidth / 2 + u * 0.06, -cardHeight / 2 + u * 0.06, cardWidth - u * 0.12, cardHeight - u * 0.12);
		ctx.fillStyle = P.ink;
		ctx.textBaseline = 'top';
		ctx.font = `${u * 0.15}px ${DISPLAY_FONT}`;
		ctx.fillText('ОБРАЗЕЦ № ' + number, -cardWidth / 2 + u * 0.14, -cardHeight / 2 + u * 0.15);
		ctx.font = `600 ${u * 0.085}px ${BODY_FONT}`;
		setLetterSpacing(ctx, u * 0.012);
		lines.forEach((line, k) => ctx.fillText(line, -cardWidth / 2 + u * 0.14, -cardHeight / 2 + u * (0.42 + k * 0.13)));

		const stampX = cardWidth / 2 - u * 0.32;
		const stampY = cardHeight / 2 - u * 0.3;
		ctx.save();
		ctx.translate(stampX, stampY);
		ctx.rotate(stampAngle);
		ctx.strokeStyle = P.red;
		ctx.fillStyle = P.red;
		ctx.lineWidth = u * 0.025;
		ctx.beginPath();
		ctx.arc(0, 0, u * 0.2, 0, TAU);
		ctx.stroke();
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = `${u * 0.1}px ${DISPLAY_FONT}`;
		setLetterSpacing(ctx, 0);
		ctx.fillText('ОТК', 0, u * 0.005);
		ctx.restore();

		ctx.fillStyle = P.ink;
		ctx.beginPath();
		ctx.arc(0, -cardHeight / 2 + u * 0.02, u * 0.035, 0, TAU);
		ctx.fill();
	});
}

export const stepanova: Artist = {
	id: 'stepanova',
	name: 'Varvara Stepanova',
	shortName: 'Stepanova',
	years: '1894–1958',
	palette: 'calico',
	plateLabels: { keyForm: 'Border bands', volumes: 'Relief shadow', type: 'Sample card' },
	note: 'Repeat patterns for printed cotton, after her designs for the First State Textile Printing Factory, with a pinned sample card.',
	compose(c) {
		c.stream(0);
		c.misregisterPlates();
		const { number } = c.setColophon('ТКАНЬ', 150, 1922, 1926);
		repeatPattern(c);
		sampleCard(c, number);
	}
};
