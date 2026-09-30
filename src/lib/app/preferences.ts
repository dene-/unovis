import {
	ARTIST_IDS,
	ASPECT_RATIOS,
	DENSITIES,
	ORIENTATIONS,
	PALETTE_IDS,
	RESOLUTIONS,
	type ArtistId,
	type Density,
	type AspectRatio,
	type PaletteId,
	type Plates,
	type Resolution,
	type SheetSpec
} from '$lib/engine';

export type ArtistChoice = ArtistId | 'any';
export type PaletteChoice = PaletteId | 'auto';
export const FILE_TYPES = ['png', 'jpg'] as const;
export type FileType = (typeof FILE_TYPES)[number];

export interface Preferences {
	artist: ArtistChoice;
	palette: PaletteChoice;
	sheet: SheetSpec;
	density: Density;
	fileType: FileType;
	plates: Plates;
}

export const DEFAULT_PREFERENCES: Preferences = {
	artist: 'lissitzky',
	palette: 'auto',
	sheet: { orientation: 'portrait', ratio: 'iso', resolution: '4k' },
	density: 'balanced',
	fileType: 'png',
	plates: { keyForm: true, volumes: true, type: true, misregister: true, texture: true, margin: false }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
	return allowed.includes(value as T) ? (value as T) : fallback;
}

function readPlates(stored: Record<string, unknown>): Plates {
	const plates = { ...DEFAULT_PREFERENCES.plates };
	for (const key of Object.keys(plates) as (keyof Plates)[]) {
		if (typeof stored[key] === 'boolean') plates[key] = stored[key];
	}
	return plates;
}

/** Accepts whatever was stored and returns valid preferences, keeping every field that checks out. */
export function sanitizePreferences(stored: unknown): Preferences {
	const d = DEFAULT_PREFERENCES;
	if (!isRecord(stored)) return structuredClone(d);
	const sheet = isRecord(stored.sheet) ? stored.sheet : {};
	const plates = isRecord(stored.plates) ? stored.plates : {};
	return {
		artist: oneOf<ArtistChoice>(stored.artist, [...ARTIST_IDS, 'any'], d.artist),
		palette: oneOf<PaletteChoice>(stored.palette, [...PALETTE_IDS, 'auto'], d.palette),
		sheet: {
			orientation: oneOf(sheet.orientation, ORIENTATIONS, d.sheet.orientation),
			ratio: oneOf(sheet.ratio, Object.keys(ASPECT_RATIOS) as AspectRatio[], d.sheet.ratio),
			resolution: oneOf(sheet.resolution, Object.keys(RESOLUTIONS) as Resolution[], d.sheet.resolution)
		},
		density: oneOf(stored.density, Object.keys(DENSITIES) as Density[], d.density),
		fileType: oneOf(stored.fileType, FILE_TYPES, d.fileType),
		plates: readPlates(plates)
	};
}
