import type { PaletteId } from './palettes';
import type { SheetSpec } from './sheet';

export const ARTIST_IDS = [
	'lissitzky',
	'rodchenko',
	'malevich',
	'popova',
	'klutsis',
	'stepanova',
	'stenberg'
] as const;

export type ArtistId = (typeof ARTIST_IDS)[number];

export const DENSITIES = {
	sparse: 0.62,
	balanced: 1,
	dense: 1.5
} as const;

export type Density = keyof typeof DENSITIES;

/** Layers a print can switch on or off without changing the rest of the composition. */
export interface Plates {
	keyForm: boolean;
	volumes: boolean;
	type: boolean;
	misregister: boolean;
	texture: boolean;
	margin: boolean;
}

export interface PrintSettings {
	artist: ArtistId;
	palette: PaletteId;
	sheet: SheetSpec;
	density: Density;
	plates: Plates;
}
