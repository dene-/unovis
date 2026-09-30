import type { Composition } from '../composition';
import { BODY_FONT, DISPLAY_FONT, setLetterSpacing } from '../fonts';
import { paintPaper } from './texture';

export interface PaintOptions {
	/** Paint only the first N operations; used by the build-up animation. */
	upTo?: number;
	/** Canvas pixels per sheet pixel. */
	scale?: number;
	/** Apply the paper texture; skipped while a print is still building. */
	finished?: boolean;
}

function paintColophon(ctx: CanvasRenderingContext2D, print: Composition): void {
	const { width: W, height: H, short: S, palette, plates, colophon } = print;
	const margin = S * 0.045;
	const foot = S * 0.1;
	const size = S * 0.018;
	const y = plates.margin ? H - foot / 2 : H - S * 0.04;
	const left = plates.margin ? margin : S * 0.04;
	const right = plates.margin ? W - margin : W - S * 0.04;

	ctx.save();
	ctx.textBaseline = 'middle';
	if (plates.margin) {
		ctx.fillStyle = palette.paper;
		ctx.fillRect(0, H - foot, W, foot);
		ctx.fillRect(0, 0, W, margin);
		ctx.fillRect(0, 0, margin, H);
		ctx.fillRect(W - margin, 0, margin, H);
	}
	ctx.fillStyle = plates.margin ? palette.ink : print.foreground;
	ctx.font = `${size * 1.25}px ${DISPLAY_FONT}`;
	ctx.fillText(`${colophon.label} ${colophon.number}`, left, y);
	ctx.font = `500 ${size}px ${BODY_FONT}`;
	setLetterSpacing(ctx, size * 0.2);
	ctx.textAlign = 'right';
	ctx.fillText(`${print.seed.toUpperCase()} · ${colophon.year}`, right, y);
	if (plates.margin) {
		ctx.fillStyle = palette.red;
		ctx.fillRect(left, y + size * 1.1, S * 0.06, size * 0.35);
	}
	ctx.restore();
}

export function paintComposition(
	ctx: CanvasRenderingContext2D,
	print: Composition,
	{ upTo = print.ops.length, scale = 1, finished = true }: PaintOptions = {}
): void {
	const { width: W, height: H, short: S, plates } = print;
	ctx.setTransform(scale, 0, 0, scale, 0, 0);
	ctx.globalAlpha = 1;
	ctx.globalCompositeOperation = 'source-over';
	ctx.fillStyle = print.ground;
	ctx.fillRect(0, 0, W, H);

	ctx.save();
	if (plates.margin) {
		const margin = S * 0.045;
		ctx.beginPath();
		ctx.rect(margin, margin, W - 2 * margin, H - margin - S * 0.1);
		ctx.clip();
	}
	for (const op of print.ops.slice(0, upTo)) {
		ctx.save();
		if (plates.misregister && op.plate) ctx.translate(...print.registration[op.plate]);
		op.paint(ctx);
		ctx.restore();
	}
	ctx.restore();

	if (plates.margin || plates.type) paintColophon(ctx, print);
	if (finished && plates.texture) paintPaper(ctx, print);
}
