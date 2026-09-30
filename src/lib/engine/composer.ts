import type { Colophon, Composition, DrawOp, Paint, Plate } from './composition';
import type { Point } from './geometry';
import type { Palette } from './palettes';
import { hashString, mulberry32, type RandomSource } from './random';
import type { Plates } from './settings';

/**
 * What an artist sees while composing: the sheet, the inks, seeded randomness and a place to put
 * drawing operations. Artists depend on this interface, never on how prints are rendered.
 */
export interface Composer {
	readonly seed: string;
	readonly width: number;
	readonly height: number;
	readonly short: number;
	readonly palette: Palette;
	readonly plates: Plates;
	readonly density: number;

	/** Switch to the random stream for one layer, so toggling another layer never reshuffles it. */
	stream(layer: number): void;
	range(min: number, max: number): number;
	int(min: number, max: number): number;
	pick<T>(items: readonly T[]): T;
	chance(probability: number): boolean;
	/** A random count scaled by the density setting. */
	count(min: number, max: number): number;
	accent(): string;
	anyColor(): string;

	add(color: string | null, paint: Paint): void;
	misregisterPlates(): void;
	setColophon(label: string, maxNumber: number, firstYear: number, lastYear: number): Colophon;
	setGround(ground: string, foreground: string): void;
}

export interface ComposerSetup {
	seed: string;
	width: number;
	height: number;
	palette: Palette;
	plates: Plates;
	density: number;
}

export class SeededComposer implements Composer {
	readonly seed: string;
	readonly width: number;
	readonly height: number;
	readonly short: number;
	readonly palette: Palette;
	readonly plates: Plates;
	readonly density: number;

	private readonly seedHash: number;
	private random: RandomSource;
	private readonly ops: DrawOp[] = [];
	private registration: Record<Plate, Point> = { red: [0, 0], accent: [0, 0], ink: [0, 0] };
	private colophon: Colophon = { label: '', number: 1, year: 1920 };
	private ground: string;
	private foreground: string;

	constructor({ seed, width, height, palette, plates, density }: ComposerSetup) {
		this.seed = seed;
		this.width = width;
		this.height = height;
		this.short = Math.min(width, height);
		this.palette = palette;
		this.plates = plates;
		this.density = density;
		this.seedHash = hashString(seed);
		this.random = mulberry32(this.seedHash);
		this.ground = palette.paper;
		this.foreground = palette.ink;
	}

	stream(layer: number): void {
		this.random = mulberry32(this.seedHash ^ Math.imul(layer + 1, 0x9e3779b1));
	}

	range(min: number, max: number): number {
		return min + this.random() * (max - min);
	}

	int(min: number, max: number): number {
		return Math.floor(this.range(min, max + 1));
	}

	pick<T>(items: readonly T[]): T {
		return items[Math.floor(this.random() * items.length)];
	}

	chance(probability: number): boolean {
		return this.random() < probability;
	}

	count(min: number, max: number): number {
		return Math.max(0, Math.round(this.range(min, max) * this.density));
	}

	accent(): string {
		return this.palette.accents.length ? this.pick(this.palette.accents) : this.palette.ink;
	}

	anyColor(): string {
		const roll = this.random();
		if (roll < 0.38) return this.palette.red;
		if (roll < 0.72) return this.palette.ink;
		return this.accent();
	}

	add(color: string | null, paint: Paint): void {
		this.ops.push({ plate: color === null ? null : this.plateOf(color), paint });
	}

	misregisterPlates(): void {
		const drift = (amount: number): Point => [
			this.short * this.range(-amount, amount),
			this.short * this.range(-amount, amount)
		];
		this.registration = { red: drift(0.004), accent: drift(0.003), ink: [0, 0] };
	}

	setColophon(label: string, maxNumber: number, firstYear: number, lastYear: number): Colophon {
		const number = this.int(1, maxNumber);
		const year = this.int(firstYear, lastYear);
		this.colophon = { label, number, year };
		return this.colophon;
	}

	setGround(ground: string, foreground: string): void {
		this.ground = ground;
		this.foreground = foreground;
	}

	build(): Composition {
		return {
			seed: this.seed,
			seedHash: this.seedHash,
			width: this.width,
			height: this.height,
			short: this.short,
			palette: this.palette,
			plates: this.plates,
			ops: this.ops,
			registration: this.registration,
			colophon: this.colophon,
			ground: this.ground,
			foreground: this.foreground
		};
	}

	private plateOf(color: string): Plate {
		if (color === this.palette.red) return 'red';
		if (color === this.palette.ink) return 'ink';
		return 'accent';
	}
}
