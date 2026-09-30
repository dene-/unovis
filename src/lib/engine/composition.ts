import type { Point } from './geometry';
import type { Palette } from './palettes';
import type { Plates } from './settings';

/** Printing plate an element is inked on; plates shift independently when misregistered. */
export type Plate = 'red' | 'ink' | 'accent';

export type Paint = (ctx: CanvasRenderingContext2D) => void;

export interface DrawOp {
	plate: Plate | null;
	paint: Paint;
}

export interface Colophon {
	label: string;
	number: number;
	year: number;
}

export interface Composition {
	seed: string;
	seedHash: number;
	width: number;
	height: number;
	short: number;
	palette: Palette;
	plates: Plates;
	ops: readonly DrawOp[];
	registration: Record<Plate, Point>;
	colophon: Colophon;
	ground: string;
	foreground: string;
}
