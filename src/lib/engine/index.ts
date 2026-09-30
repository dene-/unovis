import { ARTISTS } from './artists';
import { SeededComposer } from './composer';
import type { Composition } from './composition';
import { PALETTES } from './palettes';
import { DENSITIES, type PrintSettings } from './settings';
import { sheetSize } from './sheet';

export function composePrint(seed: string, settings: PrintSettings): Composition {
	const composer = new SeededComposer({
		seed,
		...sheetSize(settings.sheet),
		palette: PALETTES[settings.palette],
		plates: settings.plates,
		density: DENSITIES[settings.density]
	});
	ARTISTS[settings.artist].compose(composer);
	return composer.build();
}

export { ARTISTS, type Artist } from './artists';
export { hashString } from './random';
export type { Composition } from './composition';
export { paintComposition } from './render/paint';
export { PALETTES, PALETTE_IDS, type Palette, type PaletteId } from './palettes';
export {
	ARTIST_IDS,
	DENSITIES,
	type ArtistId,
	type Density,
	type Plates,
	type PrintSettings
} from './settings';
export {
	ASPECT_RATIOS,
	ORIENTATIONS,
	RESOLUTIONS,
	sheetSize,
	type AspectRatio,
	type Orientation,
	type Resolution,
	type SheetSpec
} from './sheet';
