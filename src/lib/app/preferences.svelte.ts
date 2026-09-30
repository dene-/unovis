import type { Plates, SheetSpec } from '$lib/engine';
import { DEFAULT_PREFERENCES, sanitizePreferences, type Preferences } from './preferences';

export interface PreferenceStorage {
	load(): unknown;
	save(preferences: Preferences): void;
}

export function browserStorage(key: string): PreferenceStorage {
	return {
		load() {
			try {
				return JSON.parse(localStorage.getItem(key) ?? 'null');
			} catch {
				return null;
			}
		},
		save(preferences) {
			try {
				localStorage.setItem(key, JSON.stringify(preferences));
			} catch {
				// Storage can be full or blocked; preferences then last for the session only.
			}
		}
	};
}

export class PreferencesStore {
	current = $state<Preferences>(DEFAULT_PREFERENCES);
	readonly #storage: PreferenceStorage;

	constructor(storage: PreferenceStorage) {
		this.#storage = storage;
		this.current = sanitizePreferences(storage.load());
	}

	set(patch: Partial<Omit<Preferences, 'sheet' | 'plates'>>): void {
		this.#commit({ ...this.current, ...patch });
	}

	setSheet(patch: Partial<SheetSpec>): void {
		this.#commit({ ...this.current, sheet: { ...this.current.sheet, ...patch } });
	}

	setPlate(plate: keyof Plates, on: boolean): void {
		this.#commit({ ...this.current, plates: { ...this.current.plates, [plate]: on } });
	}

	#commit(next: Preferences): void {
		this.current = next;
		this.#storage.save($state.snapshot(next) as Preferences);
	}
}
