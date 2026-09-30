<script lang="ts">
	import type { SvelteMap } from 'svelte/reactivity';
	import { ARTISTS } from '$lib/engine';
	import type { Proof } from '$lib/app/session.svelte';

	interface Props {
		proofs: Proof[];
		index: number;
		thumbnails: SvelteMap<number, string>;
		onselect: (index: number) => void;
	}

	let { proofs, index, thumbnails, onselect }: Props = $props();
</script>

<div class="strip">
	{#each proofs as proof, i (proof.id)}
		{@const name = ARTISTS[proof.artist].shortName}
		{@const thumbnail = thumbnails.get(proof.id)}
		<button
			type="button"
			title="{name} · {proof.seed}"
			aria-label="Show {name} print, seed {proof.seed}"
			aria-current={i === index ? 'true' : undefined}
			onclick={() => i !== index && onselect(i)}
		>
			{#if thumbnail}<img src={thumbnail} alt="" />{/if}
		</button>
	{/each}
</div>

<style>
	.strip {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 6px;
	}

	button {
		display: grid;
		place-items: center;
		aspect-ratio: 1;
		max-width: 100%;
		padding: 0;
		overflow: hidden;
		border: 2px solid transparent;
		background: var(--wall);
		cursor: pointer;
		animation: pop 0.42s var(--spring);
		transition: transform 0.14s var(--spring);
	}

	button:active {
		transform: scale(0.95);
	}

	button[aria-current='true'] {
		border-color: var(--red);
	}

	img {
		display: block;
		max-width: 100%;
		max-height: 100%;
	}
</style>
