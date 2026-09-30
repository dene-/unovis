<script lang="ts">
	import { ARTISTS, ARTIST_IDS, type ArtistId } from '$lib/engine';
	import type { ArtistChoice } from '$lib/app/preferences';
	import ChoiceGrid from './ChoiceGrid.svelte';

	interface Props {
		value: ArtistChoice;
		/** The artist actually drawing this seed; differs from `value` when that is "any". */
		drawing: ArtistId;
		previews: Record<ArtistChoice, string> | null;
		onselect: (choice: ArtistChoice) => void;
	}

	let { value, drawing, previews, onselect }: Props = $props();

	const choices: ArtistChoice[] = [...ARTIST_IDS, 'any'];
	const artist = $derived(ARTISTS[drawing]);
</script>

<ChoiceGrid
	label="Artist"
	{choices}
	{value}
	columns={4}
	{onselect}
	caption={(choice) => (choice === 'any' ? 'Any artist' : ARTISTS[choice].shortName)}
>
	{#snippet card(choice)}
		<span class="preview">
			{#if previews}<img src={previews[choice]} alt="" />{/if}
			{#if choice === 'any'}<b aria-hidden="true">?</b>{/if}
		</span>
	{/snippet}
</ChoiceGrid>

<div class="note" aria-live="polite">
	{#key drawing}
		<div class="note-body">
			<b>{value === 'any' ? 'Any artist · this seed: ' : ''}{artist.name}</b>
			<span class="years">{artist.years}</span>
			<p>{artist.note}</p>
		</div>
	{/key}
</div>

<style>
	.preview {
		position: relative;
		display: block;
		aspect-ratio: 5 / 7;
		max-width: 100%;
		overflow: hidden;
		background: var(--wall);
	}

	.preview img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.preview b {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-family: var(--font-display);
		font-weight: 400;
		font-size: 26px;
		color: var(--red);
		text-shadow: 0 0 6px var(--panel);
	}

	.note {
		border-left: 4px solid var(--red);
		padding-left: 10px;
	}

	.note-body {
		display: grid;
		gap: 3px;
		animation: rise 0.38s var(--glide);
	}

	.note b {
		font-weight: 600;
		font-size: 14.5px;
	}

	.years {
		font-family: var(--font-mono);
		font-size: 11.5px;
		color: var(--muted);
	}

	.note p {
		margin: 0;
		max-width: 44ch;
		font-size: 13px;
		color: var(--muted);
	}
</style>
