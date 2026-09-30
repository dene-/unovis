<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		header: Snippet;
		actions: Snippet;
		children: Snippet;
	}

	let { header, actions, children }: Props = $props();
</script>

<aside class="panel" aria-label="Press controls">
	{@render header()}
	<div class="section">
		{@render actions()}
	</div>
	{@render children()}
</aside>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		overflow: auto;
		overscroll-behavior: contain;
		background: var(--panel);
		border-top: 6px solid var(--red);
	}
</style>
