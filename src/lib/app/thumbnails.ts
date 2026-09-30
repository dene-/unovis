import {
	ARTISTS,
	ARTIST_IDS,
	composePrint,
	paintComposition,
	sheetSize,
	type ArtistId,
	type SheetSpec
} from '$lib/engine';
import { DEFAULT_PREFERENCES } from './preferences';

const PREVIEW_SHEET: SheetSpec = { orientation: 'portrait', ratio: 'iso', resolution: 'hd' };
const PREVIEW_WIDTH = 100;
const COLLAGE: ArtistId[] = ['lissitzky', 'malevich', 'stepanova', 'stenberg'];
/** Fixed so the picker shows the same sample of each artist every time. */
const PREVIEW_SEED = 'unovis';

function previewCanvas(): HTMLCanvasElement {
	const { width, height } = sheetSize(PREVIEW_SHEET);
	const canvas = document.createElement('canvas');
	canvas.width = PREVIEW_WIDTH;
	canvas.height = Math.round((PREVIEW_WIDTH * height) / width);
	return canvas;
}

function paintArtistPreview(artist: ArtistId): HTMLCanvasElement {
	const canvas = previewCanvas();
	const print = composePrint(PREVIEW_SEED, {
		artist,
		palette: ARTISTS[artist].palette,
		sheet: PREVIEW_SHEET,
		density: DEFAULT_PREFERENCES.density,
		plates: { ...DEFAULT_PREFERENCES.plates, texture: false, misregister: false }
	});
	paintComposition(canvas.getContext('2d')!, print, {
		scale: PREVIEW_WIDTH / print.width,
		finished: false
	});
	return canvas;
}

/** Small representative prints for the artist picker, plus a collage for "Any artist". */
export function artistPreviews(): Record<ArtistId | 'any', string> {
	const canvases = Object.fromEntries(
		ARTIST_IDS.map((id) => [id, paintArtistPreview(id)])
	) as Record<ArtistId, HTMLCanvasElement>;
	const collage = previewCanvas();
	const ctx = collage.getContext('2d')!;
	const { width, height } = collage;
	COLLAGE.forEach((id, i) =>
		ctx.drawImage(
			canvases[id],
			((i % 2) * width) / 2,
			(Math.floor(i / 2) * height) / 2,
			width / 2,
			height / 2
		)
	);
	const urls = Object.fromEntries(
		ARTIST_IDS.map((id) => [id, canvases[id].toDataURL('image/png')])
	) as Record<ArtistId, string>;
	return { ...urls, any: collage.toDataURL('image/png') };
}

export function snapshotThumbnail(source: HTMLCanvasElement, width = 140): string {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = Math.round((width * source.height) / source.width);
	canvas.getContext('2d')!.drawImage(source, 0, 0, canvas.width, canvas.height);
	return canvas.toDataURL('image/jpeg', 0.8);
}
