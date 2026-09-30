<script lang="ts">
	import Glyph from './Glyph.svelte';

	const SHOWN_FOR = 1150;
	const FADE = 350;

	let visible = $state(true);
	let leaving = $state(false);

	$effect(() => {
		const leave = setTimeout(() => (leaving = true), SHOWN_FOR);
		const hide = setTimeout(() => (visible = false), SHOWN_FOR + FADE);
		return () => {
			clearTimeout(leave);
			clearTimeout(hide);
		};
	});
</script>

{#if visible}
	<div class="splash" class:leaving aria-hidden="true">
		<Glyph size={84} animated />
		<b>Unovis</b>
	</div>
{/if}

<style>
	.splash {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 22px;
		background: var(--bg);
		transition: opacity 0.35s ease;
	}

	.leaving {
		opacity: 0;
	}

	b {
		font-family: var(--font-display);
		font-weight: 400;
		font-size: 22px;
		letter-spacing: 0.04em;
		animation: rise 0.5s 0.45s var(--glide) both;
	}
</style>
