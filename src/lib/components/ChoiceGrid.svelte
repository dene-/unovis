<script lang="ts" generics="T extends string">
	import type { Snippet } from 'svelte';
	import { rove } from '$lib/app/roving';

	interface Props {
		label: string;
		choices: readonly T[];
		value: T;
		columns: number;
		onselect: (choice: T) => void;
		card: Snippet<[T]>;
		caption: (choice: T) => string;
	}

	let { label, choices, value, columns, onselect, card, caption }: Props = $props();

	let group: HTMLDivElement;

	function keydown(event: KeyboardEvent) {
		const next = rove(event, choices, value);
		if (next === null) return;
		onselect(next);
		group.querySelector<HTMLElement>(`[data-choice="${next}"]`)?.focus();
	}
</script>

<div
	class="grid"
	style:--columns={columns}
	role="radiogroup"
	aria-label={label}
	tabindex="-1"
	bind:this={group}
	onkeydown={keydown}
>
	{#each choices as choice (choice)}
		<button
			type="button"
			role="radio"
			data-choice={choice}
			aria-checked={choice === value}
			tabindex={choice === value ? 0 : -1}
			onclick={() => onselect(choice)}
		>
			{@render card(choice)}
			<span class="caption">{caption(choice)}</span>
		</button>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
		gap: 7px;
	}

	button {
		display: grid;
		align-content: start;
		gap: 3px;
		padding: 0;
		border: 2px solid transparent;
		background: none;
		text-align: left;
		cursor: pointer;
		transition: transform 0.14s var(--spring);
	}

	button:active {
		transform: scale(0.95);
	}

	button[aria-checked='true'] {
		border-color: var(--rule);
		animation: pop 0.42s var(--spring);
	}

	.caption {
		padding: 0 2px 2px;
		font-size: 11px;
		line-height: 1.15;
	}

	button[aria-checked='true'] .caption {
		font-weight: 600;
	}
</style>
