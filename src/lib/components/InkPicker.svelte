<script lang="ts">
	import { PALETTES, PALETTE_IDS, type Palette, type PaletteId } from '$lib/engine';
	import type { PaletteChoice } from '$lib/app/preferences';
	import ChoiceGrid from './ChoiceGrid.svelte';

	interface Props {
		value: PaletteChoice;
		/** The current artist's own inks, shown on the "Artist's own" chip. */
		artistPalette: PaletteId;
		onselect: (choice: PaletteChoice) => void;
	}

	let { value, artistPalette, onselect }: Props = $props();

	const choices: PaletteChoice[] = ['auto', ...PALETTE_IDS];
	const BAR_HEIGHTS = [100, 70, 45, 30];

	const paletteOf = (choice: PaletteChoice) => PALETTES[choice === 'auto' ? artistPalette : choice];

	function inks(palette: Palette): string[] {
		const colors = [palette.ink, palette.red, ...palette.accents].slice(0, BAR_HEIGHTS.length);
		while (colors.length < BAR_HEIGHTS.length) colors.push(palette.paper2);
		return colors;
	}
</script>

<ChoiceGrid
	label="Ink set"
	{choices}
	{value}
	columns={5}
	{onselect}
	caption={(choice) => (choice === 'auto' ? 'Artist’s own' : PALETTES[choice].name)}
>
	{#snippet card(choice)}
		{@const palette = paletteOf(choice)}
		<span class="chip" style:background={palette.paper}>
			{#each inks(palette) as color, i (i)}
				<i style:background={color} style:height="{BAR_HEIGHTS[i]}%"></i>
			{/each}
		</span>
	{/snippet}
</ChoiceGrid>

<style>
	.chip {
		display: flex;
		align-items: flex-end;
		gap: 2px;
		height: 32px;
		padding: 4px;
		outline: 1px solid color-mix(in srgb, var(--rule) 25%, transparent);
	}

	.chip i {
		display: block;
		flex: 1;
		transition: background-color 0.3s;
	}
</style>
