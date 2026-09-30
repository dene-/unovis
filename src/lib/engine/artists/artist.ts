import type { Composer } from '../composer';
import type { PaletteId } from '../palettes';
import type { ArtistId } from '../settings';

export interface Artist {
	id: ArtistId;
	name: string;
	shortName: string;
	years: string;
	note: string;
	palette: PaletteId;
	/** What the key-form, volumes and type plates mean in this artist's hand. */
	plateLabels: { keyForm: string; volumes: string; type: string };
	compose(c: Composer): void;
}
