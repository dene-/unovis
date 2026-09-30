export const DISPLAY_FONT = '"Rubik Mono One","Arial Black",sans-serif';
export const BODY_FONT = '"Jost","Futura","Helvetica Neue",Arial,sans-serif';

export function setLetterSpacing(ctx: CanvasRenderingContext2D, pixels: number): void {
	if ('letterSpacing' in ctx) ctx.letterSpacing = `${pixels}px`;
}
