import type { Paint } from '../composition';
import { BODY_FONT, DISPLAY_FONT, setLetterSpacing } from '../fonts';
import type { Palette } from '../palettes';
import type { Composer } from '../composer';

export type WordStyle = 'plain' | 'band' | 'spaced' | 'outline';

export interface WordSpec {
	text: string;
	x: number;
	y: number;
	angle: number;
	size: number;
	style: WordStyle;
	color: string;
	band?: string;
	font?: string;
	weight?: string;
}

/** A word set on its baseline midline; a band reverses it out of a solid bar. */
export function paintWord(palette: Palette, word: WordSpec): Paint {
	const { text, x, y, angle, size, style, color, band = color, font = DISPLAY_FONT, weight } = word;
	return (ctx) => {
		ctx.translate(x, y);
		ctx.rotate(angle);
		ctx.font = `${weight ? weight + ' ' : ''}${size}px ${font}`;
		ctx.textBaseline = 'middle';
		if (style === 'spaced') setLetterSpacing(ctx, size * 0.32);
		const width = ctx.measureText(text).width;
		if (style === 'band') {
			ctx.fillStyle = band;
			ctx.fillRect(-size * 0.35, -size * 0.72, width + size * 0.7, size * 1.44);
			ctx.fillStyle = palette.paper;
			ctx.fillText(text, 0, size * 0.04);
		} else if (style === 'outline') {
			ctx.strokeStyle = color;
			ctx.lineWidth = Math.max(1.5, size * 0.035);
			ctx.strokeText(text, 0, size * 0.04);
		} else {
			ctx.fillStyle = color;
			ctx.fillText(text, 0, size * 0.04);
		}
	};
}

/** A small stack of printer's imprint lines. */
export function paintImprint(
	lines: readonly string[],
	x: number,
	y: number,
	angle: number,
	size: number,
	color: string
): Paint {
	return (ctx) => {
		ctx.translate(x, y);
		ctx.rotate(angle);
		ctx.fillStyle = color;
		ctx.font = `600 ${size}px ${BODY_FONT}`;
		setLetterSpacing(ctx, size * 0.18);
		ctx.textBaseline = 'top';
		lines.forEach((line, i) => ctx.fillText(line, 0, i * size * 1.45));
	};
}

/** Picks two or three imprint lines. */
export function pickImprint(c: Composer, source: readonly string[]): string[] {
	return [c.pick(source), c.pick(source), c.pick(source)].slice(0, c.int(2, 3));
}

export const readable = (angle: number) => (Math.cos(angle) < 0 ? angle + Math.PI : angle);
