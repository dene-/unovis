import { SvelteMap } from 'svelte/reactivity';
import type { ArtistId } from '$lib/engine';

export interface Proof {
	id: number;
	seed: string;
	artist: ArtistId;
}

export type ProofRequest = Omit<Proof, 'id'>;

const KEPT_PROOFS = 15;

/** The prints pulled this session, newest last, with a cursor for stepping back and forth. */
export class ProofSession {
	proofs = $state<Proof[]>([]);
	index = $state(0);
	readonly current = $derived(this.proofs[this.index]);
	/** Small previews by proof id; kept apart so painting one never changes the proof itself. */
	readonly thumbnails = new SvelteMap<number, string>();
	#nextId = 0;

	constructor(first: ProofRequest) {
		this.proofs = [this.#issue(first)];
	}

	pull(request: ProofRequest): void {
		const kept = [...this.proofs.slice(0, this.index + 1), this.#issue(request)].slice(
			-KEPT_PROOFS
		);
		this.proofs = kept;
		this.index = kept.length - 1;
	}

	canStep(delta: number): boolean {
		const target = this.index + delta;
		return target >= 0 && target < this.proofs.length;
	}

	step(delta: number): boolean {
		if (!this.canStep(delta)) return false;
		this.index += delta;
		return true;
	}

	/** Re-attributes the current proof, e.g. when the artist changes but the seed stays. */
	reassign(artist: ArtistId): void {
		this.proofs[this.index] = this.#issue({ seed: this.current.seed, artist });
	}

	#issue(request: ProofRequest): Proof {
		return { id: this.#nextId++, ...request };
	}
}
