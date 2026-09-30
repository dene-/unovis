import { describe, expect, it } from 'vitest';
import { ARTIST_IDS, composePrint, paintComposition, type PrintSettings } from './index';
import { hashString, mulberry32 } from './random';
import { sheetSize } from './sheet';
import { recordingContext } from './testing/recording-context';

const settings = (overrides: Partial<PrintSettings> = {}): PrintSettings => ({
	artist: 'lissitzky',
	palette: 'proun',
	sheet: { orientation: 'portrait', ratio: 'iso', resolution: 'hd' },
	density: 'balanced',
	plates: {
		keyForm: true,
		volumes: true,
		type: true,
		misregister: true,
		texture: false,
		margin: false
	},
	...overrides
});

function drawingOf(seed: string, printSettings: PrintSettings): string[] {
	const { ctx, log } = recordingContext();
	paintComposition(ctx, composePrint(seed, printSettings));
	return log;
}

describe('random', () => {
	it('repeats the same sequence for the same seed', () => {
		const a = mulberry32(42);
		const b = mulberry32(42);
		expect([a(), a(), a()]).toEqual([b(), b(), b()]);
	});

	it('hashes strings to stable unsigned integers', () => {
		expect(hashString('unovis')).toBe(hashString('unovis'));
		expect(hashString('unovis')).toBeGreaterThanOrEqual(0);
		expect(hashString('unovis')).not.toBe(hashString('unovis!'));
	});
});

describe('sheetSize', () => {
	it('puts the resolution on the long edge and rounds the short edge to an even number', () => {
		expect(sheetSize({ orientation: 'portrait', ratio: 'iso', resolution: '4k' })).toEqual({
			width: 2716,
			height: 3840
		});
		expect(sheetSize({ orientation: 'landscape', ratio: '16:9', resolution: '4k' })).toEqual({
			width: 3840,
			height: 2160
		});
	});
});

describe('composePrint', () => {
	it.each(ARTIST_IDS)('draws the same %s print for the same seed', (artist) => {
		expect(drawingOf('k3y5ee', settings({ artist }))).toEqual(
			drawingOf('k3y5ee', settings({ artist }))
		);
	});

	it.each(ARTIST_IDS)('draws a different %s print for a different seed', (artist) => {
		expect(drawingOf('k3y5ee', settings({ artist }))).not.toEqual(
			drawingOf('a1b2c3', settings({ artist }))
		);
	});

	it.each(ARTIST_IDS)('composes %s on every sheet shape', (artist) => {
		for (const orientation of ['portrait', 'landscape'] as const) {
			for (const ratio of ['1:1', 'iso', '21:9'] as const) {
				const print = composePrint(
					't805tp',
					settings({ artist, sheet: { orientation, ratio, resolution: 'hd' } })
				);
				expect(print.ops.length).toBeGreaterThan(0);
			}
		}
	});

	it('keeps the rest of the composition when one plate is switched off', () => {
		const full = composePrint('6liv3w', settings());
		const plain = composePrint(
			'6liv3w',
			settings({ plates: { ...settings().plates, type: false } })
		);
		expect(plain.ops.length).toBeLessThan(full.ops.length);
		expect(plain.colophon).toEqual(full.colophon);
		expect(plain.registration).toEqual(full.registration);
	});

	it('changes only the inks when the palette changes', () => {
		const proun = composePrint('e74w4k', settings({ palette: 'proun' }));
		const cinema = composePrint('e74w4k', settings({ palette: 'cinema' }));
		expect(cinema.ops.length).toBe(proun.ops.length);
		expect(cinema.palette.name).toBe('Cinema');
	});

	it('scales with the sheet rather than changing with resolution', () => {
		const small = composePrint('zz9x0q', settings());
		const large = composePrint(
			'zz9x0q',
			settings({ sheet: { ...settings().sheet, resolution: '8k' } })
		);
		expect(large.ops.length).toBe(small.ops.length);
		expect(large.width / small.width).toBeCloseTo(4, 2);
	});
});
