import type { ArtistId } from '../settings';
import type { Artist } from './artist';
import { klutsis } from './klutsis';
import { lissitzky } from './lissitzky';
import { malevich } from './malevich';
import { popova } from './popova';
import { rodchenko } from './rodchenko';
import { stenberg } from './stenberg';
import { stepanova } from './stepanova';

export type { Artist } from './artist';

export const ARTISTS: Record<ArtistId, Artist> = {
	lissitzky,
	rodchenko,
	malevich,
	popova,
	klutsis,
	stepanova,
	stenberg
};
