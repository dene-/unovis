<script lang="ts" module>
	import type { IconName } from './Icon.svelte';

	export interface DockTab<Id extends string> {
		id: Id;
		label: string;
		icon: IconName;
	}
</script>

<script lang="ts" generics="T extends string">
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { dragDismiss } from '$lib/attachments/drag-dismiss';
	import Icon from './Icon.svelte';

	interface Props {
		tabs: readonly DockTab<T>[];
		/** The tab whose panel is open, or null when all are closed. */
		active: T | null;
		/** Height of the dock, reported so floating UI can sit above it. */
		height: number;
		reducedMotion: boolean;
		actions: Snippet;
		panel: Snippet<[T]>;
	}

	let {
		tabs,
		active = $bindable(),
		height = $bindable(),
		reducedMotion,
		actions,
		panel
	}: Props = $props();

	let panelElement = $state<HTMLElement>();
	const current = $derived(tabs.find((tab) => tab.id === active));
	const duration = $derived(reducedMotion ? 0 : 280);

	const close = () => (active = null);
	const toggle = (id: T) => (active = active === id ? null : id);
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && close()} />

{#if current}
	<button
		class="scrim"
		style:bottom="{height}px"
		tabindex="-1"
		aria-label="Close {current.label}"
		onclick={close}
		transition:fade={{ duration }}
	></button>
	<section
		class="panel"
		style:bottom="{height}px"
		aria-label={current.label}
		bind:this={panelElement}
		transition:fly={{ y: 60, duration, opacity: 0 }}
	>
		<header {@attach dragDismiss({ panel: () => panelElement, onDismiss: close })}>
			<i class="grip" aria-hidden="true"></i>
			<h2>{current.label}</h2>
			<button type="button" class="close" aria-label="Close {current.label}" onclick={close}>
				<Icon name="close" size={18} />
			</button>
		</header>
		<div class="content">
			{#key current.id}
				<div class="body" in:fade={{ duration: duration / 2 }}>
					{@render panel(current.id)}
				</div>
			{/key}
		</div>
	</section>
{/if}

<div class="dock" bind:clientHeight={height}>
	<div class="actions">
		{@render actions()}
	</div>
	<nav aria-label="Print controls">
		{#each tabs as tab (tab.id)}
			<button type="button" aria-pressed={active === tab.id} onclick={() => toggle(tab.id)}>
				<Icon name={tab.icon} />
				<span>{tab.label}</span>
			</button>
		{/each}
	</nav>
</div>

<style>
	.dock {
		position: relative;
		z-index: 25;
		background: var(--panel);
		border-top: 6px solid var(--red);
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	.actions {
		display: grid;
		grid-template-columns: 52px minmax(0, 1fr) auto;
		gap: 8px;
		padding: 10px 16px;
	}

	nav {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		border-top: 1px solid color-mix(in srgb, var(--rule) 25%, transparent);
	}

	nav button {
		position: relative;
		display: grid;
		justify-items: center;
		gap: 3px;
		padding: 9px 2px 8px;
		border: 0;
		background: none;
		color: var(--muted);
		font-size: 11px;
		cursor: pointer;
		transition:
			color 0.2s,
			transform 0.14s var(--spring);
	}

	nav button::before {
		content: '';
		position: absolute;
		top: -1px;
		left: 28%;
		right: 28%;
		height: 3px;
		background: var(--red);
		transform: scaleX(0);
		transition: transform 0.3s var(--spring);
	}

	nav button:active {
		transform: scale(0.92);
	}

	nav button[aria-pressed='true'] {
		color: var(--fg);
		font-weight: 600;
	}

	nav button[aria-pressed='true']::before {
		transform: scaleX(1);
	}

	.scrim {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 15;
		padding: 0;
		border: 0;
		background: var(--scrim);
	}

	.panel {
		position: fixed;
		left: 0;
		right: 0;
		z-index: 20;
		display: flex;
		flex-direction: column;
		max-height: min(62dvh, 560px);
		background: var(--panel);
		box-shadow: 0 -14px 40px -12px rgba(0, 0, 0, 0.35);
		transition: transform 0.3s var(--glide);
	}

	header {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		padding: 6px 8px 4px 16px;
		touch-action: none;
		cursor: grab;
	}

	.grip {
		grid-column: 1 / -1;
		justify-self: center;
		width: 40px;
		height: 4px;
		margin-bottom: 4px;
		background: var(--muted);
		opacity: 0.5;
	}

	h2 {
		margin: 0;
		font-family: var(--font-display);
		font-weight: 400;
		font-size: 14px;
		letter-spacing: 0.04em;
	}

	.close {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border: 0;
		background: none;
		color: var(--muted);
		cursor: pointer;
	}

	.content {
		overflow: auto;
		overscroll-behavior: contain;
		padding: 4px 16px 16px;
	}

	.body {
		display: grid;
		gap: 12px;
	}
</style>
