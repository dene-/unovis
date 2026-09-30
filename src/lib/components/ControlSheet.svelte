<script lang="ts">
	import type { Snippet } from 'svelte';
	import { sheetDrag } from '$lib/attachments/sheet-drag';

	interface Props {
		/** On phones the controls become a bottom sheet; elsewhere they are a side column. */
		asSheet: boolean;
		open: boolean;
		/** Height the closed sheet leaves visible, reported so the stage can make room. */
		peek: number;
		header: Snippet;
		actions: Snippet;
		children: Snippet;
	}

	let { asSheet, open = $bindable(), peek = $bindable(), header, actions, children }: Props = $props();

	let sheet: HTMLElement;
	let actionsBox: HTMLElement;
	let dragProgress = $state<number | null>(null);
	let revealTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (!asSheet) {
			peek = 0;
			open = false;
			return;
		}
		const measure = () => (peek = actionsBox.offsetTop + actionsBox.offsetHeight);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(actionsBox);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (!open && sheet) sheet.scrollTop = 0;
	});

	$effect(() => () => clearTimeout(revealTimer));

	/** Opens the sheet and scrolls a section into view once the sheet has risen. */
	export function reveal(target: HTMLElement): void {
		open = true;
		clearTimeout(revealTimer);
		revealTimer = setTimeout(
			() => sheet.scrollTo({ top: target.offsetTop - 10, behavior: 'smooth' }),
			250
		);
	}
</script>

{#if asSheet}
	<button
		class="scrim"
		class:on={open || dragProgress !== null}
		style:opacity={dragProgress ?? undefined}
		style:transition={dragProgress === null ? undefined : 'none'}
		tabindex="-1"
		aria-label="Close controls"
		onclick={() => (open = false)}
	></button>
{/if}

<aside
	class="controls"
	class:sheet={asSheet}
	class:open
	aria-label="Press controls"
	bind:this={sheet}
	{@attach sheetDrag({
		enabled: () => asSheet,
		isOpen: () => open,
		setOpen: (value) => (open = value),
		peek: () => peek,
		onProgress: (value) => (dragProgress = value)
	})}
>
	{#if asSheet}
		<button
			class="handle"
			data-sheet-handle
			aria-expanded={open}
			aria-label={open ? 'Hide controls' : 'Show controls'}
			onclick={() => (open = !open)}
		>
			<i></i>
		</button>
	{:else}
		{@render header()}
	{/if}

	<div class="section actions" bind:this={actionsBox}>
		{@render actions()}
	</div>

	{@render children()}
</aside>

<style>
	.controls {
		min-width: 0;
		min-height: 0;
		overflow: auto;
		overscroll-behavior: contain;
		display: flex;
		flex-direction: column;
		background: var(--panel);
		border-top: 6px solid var(--red);
		user-select: none;
		-webkit-user-select: none;
	}

	.controls :global(.section) {
		padding: 16px 20px;
		border-bottom: 1px solid color-mix(in srgb, var(--rule) 30%, transparent);
		display: grid;
		gap: 10px;
	}

	.sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 20;
		height: min(88dvh, 820px);
		overflow: hidden;
		padding-bottom: env(safe-area-inset-bottom, 0px);
		box-shadow: 0 -14px 40px -12px rgba(0, 0, 0, 0.35);
		transform: translateY(calc(100% - var(--peek, 0px)));
		transition: transform 0.46s var(--glide);
	}

	.sheet.open {
		transform: none;
		overflow: auto;
	}

	.sheet:global([data-dragging]) {
		transition: none;
	}

	.sheet .actions {
		border-bottom: 2px solid var(--rule);
		padding-top: 8px;
	}

	.handle {
		display: block;
		width: 100%;
		border: 0;
		background: none;
		padding: 10px 0 2px;
		cursor: grab;
		touch-action: none;
	}

	.handle i {
		display: block;
		width: 44px;
		height: 5px;
		margin: 0 auto;
		background: var(--muted);
		opacity: 0.6;
	}

	.scrim {
		position: fixed;
		inset: 0;
		z-index: 15;
		border: 0;
		padding: 0;
		background: var(--scrim);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.35s;
	}

	.scrim.on {
		opacity: 1;
		pointer-events: auto;
	}
</style>
