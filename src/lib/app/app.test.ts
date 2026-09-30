import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERENCES, sanitizePreferences } from './preferences';
import { cleanSeed, formatLink, parseLink, printSettings, resolveArtist } from './prints';
import { ProofSession } from './session.svelte';

describe('sanitizePreferences', () => {
	it('falls back to the defaults for anything unreadable', () => {
		expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES);
		expect(sanitizePreferences('nonsense')).toEqual(DEFAULT_PREFERENCES);
	});

	it('keeps valid fields and replaces invalid ones individually', () => {
		const result = sanitizePreferences({
			artist: 'popova',
			palette: 'not-a-palette',
			sheet: { orientation: 'landscape', ratio: '7:3', resolution: '8k' },
			plates: { margin: true, texture: 'yes' }
		});
		expect(result.artist).toBe('popova');
		expect(result.palette).toBe(DEFAULT_PREFERENCES.palette);
		expect(result.sheet).toEqual({ orientation: 'landscape', ratio: 'iso', resolution: '8k' });
		expect(result.plates.margin).toBe(true);
		expect(result.plates.texture).toBe(DEFAULT_PREFERENCES.plates.texture);
	});
});

describe('prints', () => {
	it('gives "any artist" one fixed artist per seed', () => {
		expect(resolveArtist('any', 'abc123')).toBe(resolveArtist('any', 'abc123'));
		expect(resolveArtist('malevich', 'abc123')).toBe('malevich');
	});

	it('uses the artist’s own inks unless an ink set is chosen', () => {
		expect(printSettings(DEFAULT_PREFERENCES, 'stepanova').palette).toBe('calico');
		expect(printSettings({ ...DEFAULT_PREFERENCES, palette: 'steel' }, 'stepanova').palette).toBe(
			'steel'
		);
	});

	it('round-trips links and rejects unknown artists', () => {
		const link = { artist: 'klutsis', seed: 'q00001' } as const;
		expect(parseLink(formatLink(link))).toEqual(link);
		expect(parseLink('#picasso-q00001')).toBeNull();
		expect(parseLink('#stenberg-new')?.seed).toMatch(/^[a-z0-9]{6}$/);
	});

	it('reduces typed seeds to lowercase letters and digits', () => {
		expect(cleanSeed(' Proun-19 20! ')).toBe('proun1920');
	});
});

describe('ProofSession', () => {
	it('steps back and forth within the proofs pulled so far', () => {
		const session = new ProofSession({ seed: 'aaaaaa', artist: 'lissitzky' });
		session.pull({ seed: 'bbbbbb', artist: 'lissitzky' });
		expect(session.step(1)).toBe(false);
		expect(session.step(-1)).toBe(true);
		expect(session.current.seed).toBe('aaaaaa');
		expect(session.step(-1)).toBe(false);
	});

	it('drops the forward history when a new proof is pulled from the middle', () => {
		const session = new ProofSession({ seed: 'aaaaaa', artist: 'lissitzky' });
		session.pull({ seed: 'bbbbbb', artist: 'lissitzky' });
		session.step(-1);
		session.pull({ seed: 'cccccc', artist: 'popova' });
		expect(session.proofs.map((proof) => proof.seed)).toEqual(['aaaaaa', 'cccccc']);
	});

	it('keeps only the most recent fifteen proofs', () => {
		const session = new ProofSession({ seed: 'seed00', artist: 'lissitzky' });
		for (let i = 1; i <= 20; i++) session.pull({ seed: `seed${i}`, artist: 'lissitzky' });
		expect(session.proofs).toHaveLength(15);
		expect(session.current.seed).toBe('seed20');
	});
});
