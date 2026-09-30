<script lang="ts">
	import { cleanSeed } from '$lib/app/prints';

	let { seed, onsubmit }: { seed: string; onsubmit: (seed: string) => void } = $props();
</script>

<input
	type="text"
	value={seed}
	spellcheck="false"
	autocomplete="off"
	autocapitalize="off"
	enterkeyhint="go"
	maxlength="16"
	aria-label="Seed"
	onchange={(event) => {
		const typed = cleanSeed(event.currentTarget.value);
		if (typed && typed !== seed) onsubmit(typed);
		else event.currentTarget.value = seed;
	}}
	onkeydown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
/>

<style>
	input {
		min-width: 0;
		width: 100%;
		padding: 9px 10px;
		border: 2px solid var(--rule);
		border-radius: 0;
		background: var(--bg);
		font-family: var(--font-mono);
		font-size: 16px;
		text-transform: lowercase;
	}
</style>
