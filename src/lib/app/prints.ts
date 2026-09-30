import { ARTISTS, ARTIST_IDS, hashString, type ArtistId, type PrintSettings } from '$lib/engine';
import type { ArtistChoice, Preferences } from './preferences';

const SEED_LENGTH = 6;
const LINK_PATTERN = /^([a-z]+)-([a-z0-9]+)$/;

export function newSeed(): string {
	return Math.floor(Math.random() * 36 ** SEED_LENGTH)
		.toString(36)
		.padStart(SEED_LENGTH, '0');
}

export function cleanSeed(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '')
		.slice(0, 16);
}

/** "Any artist" still gives every seed one fixed artist, so a seed always reproduces its print. */
export function resolveArtist(choice: ArtistChoice, seed: string): ArtistId {
	if (choice !== 'any') return choice;
	return ARTIST_IDS[hashString('artist:' + seed) % ARTIST_IDS.length];
}

export function printSettings(preferences: Preferences, artist: ArtistId): PrintSettings {
	return {
		artist,
		palette: preferences.palette === 'auto' ? ARTISTS[artist].palette : preferences.palette,
		sheet: preferences.sheet,
		density: preferences.density,
		plates: preferences.plates
	};
}

export interface PrintLink {
	artist: ArtistId;
	seed: string;
}

export const formatLink = ({ artist, seed }: PrintLink) => `#${artist}-${seed}`;

/** Reads `#artist-seed`; `#artist-new` asks for a fresh seed. */
export function parseLink(hash: string): PrintLink | null {
	const match = hash.replace(/^#/, '').match(LINK_PATTERN);
	if (!match || !(ARTIST_IDS as readonly string[]).includes(match[1])) return null;
	return { artist: match[1] as ArtistId, seed: match[2] === 'new' ? newSeed() : match[2] };
}
