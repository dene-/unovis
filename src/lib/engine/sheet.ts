export const ASPECT_RATIOS = {
	'1:1': 1,
	'5:4': 5 / 4,
	'4:3': 4 / 3,
	'3:2': 3 / 2,
	iso: Math.SQRT2,
	'16:9': 16 / 9,
	'21:9': 21 / 9
} as const;

export const RESOLUTIONS = {
	hd: 1920,
	'2k': 2560,
	'4k': 3840,
	'8k': 7680
} as const;

export type AspectRatio = keyof typeof ASPECT_RATIOS;
export type Resolution = keyof typeof RESOLUTIONS;
export const ORIENTATIONS = ['portrait', 'landscape'] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

export interface SheetSpec {
	orientation: Orientation;
	ratio: AspectRatio;
	resolution: Resolution;
}

export interface SheetSize {
	width: number;
	height: number;
}

export function sheetSize({ orientation, ratio, resolution }: SheetSpec): SheetSize {
	const long = RESOLUTIONS[resolution];
	const short = Math.round(long / ASPECT_RATIOS[ratio] / 2) * 2;
	return orientation === 'landscape'
		? { width: long, height: short }
		: { width: short, height: long };
}
