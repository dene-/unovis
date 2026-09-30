import { composePrint, paintComposition, type PrintSettings } from '$lib/engine';
import type { FileType } from './preferences';

export interface PrintFile {
	file: File;
	/** Short description for confirmations, e.g. "3840×2716 PNG". */
	label: string;
}

const MIME: Record<FileType, string> = { png: 'image/png', jpg: 'image/jpeg' };
const JPEG_QUALITY = 0.93;

function encode(canvas: HTMLCanvasElement, fileType: FileType): Promise<Blob> {
	return new Promise((resolve, reject) =>
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('The canvas could not be encoded.'))),
			MIME[fileType],
			fileType === 'jpg' ? JPEG_QUALITY : undefined
		)
	);
}

/** Renders the print at its full sheet size, off screen, and encodes it. */
export async function renderPrintFile(
	seed: string,
	settings: PrintSettings,
	fileType: FileType
): Promise<PrintFile> {
	const print = composePrint(seed, settings);
	const canvas = document.createElement('canvas');
	canvas.width = print.width;
	canvas.height = print.height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('A canvas this large is not available on this device.');
	paintComposition(ctx, print);
	try {
		const blob = await encode(canvas, fileType);
		const name = `unovis_${settings.artist}_${seed}_${print.width}x${print.height}.${fileType}`;
		return {
			file: new File([blob], name, { type: MIME[fileType] }),
			label: `${print.width}×${print.height} ${fileType.toUpperCase()}`
		};
	} finally {
		canvas.width = canvas.height = 0;
	}
}
