<script lang="ts">
	import type { Artist, Plates } from '$lib/engine';

	interface Props {
		plates: Plates;
		labels: Artist['plateLabels'];
		onchange: (plate: keyof Plates, on: boolean) => void;
	}

	let { plates, labels, onchange }: Props = $props();

	const toggles = $derived<{ key: keyof Plates; label: string }[]>([
		{ key: 'keyForm', label: labels.keyForm },
		{ key: 'volumes', label: labels.volumes },
		{ key: 'type', label: labels.type },
		{ key: 'misregister', label: 'Misregister' },
		{ key: 'texture', label: 'Paper & wear' },
		{ key: 'margin', label: 'Print margin' }
	]);
</script>

<div class="plates">
	{#each toggles as toggle (toggle.key)}
		<label>
			<input
				type="checkbox"
				checked={plates[toggle.key]}
				onchange={(event) => onchange(toggle.key, event.currentTarget.checked)}
			/>
			{toggle.label}
		</label>
	{/each}
</div>

<style>
	.plates {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px 12px;
	}

	label {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		padding: 3px 0;
		font-size: 13.5px;
		cursor: pointer;
		transition: transform 0.14s var(--spring);
	}

	label:active {
		transform: scale(0.95);
	}

	input {
		appearance: none;
		position: relative;
		flex: none;
		width: 16px;
		height: 16px;
		margin: 0;
		border: 2px solid var(--rule);
		cursor: pointer;
		transition:
			background-color 0.2s,
			border-color 0.2s;
	}

	input::after {
		content: '';
		position: absolute;
		inset: 2px;
		background: var(--on-red);
		clip-path: polygon(0 0, 100% 50%, 0 100%);
		transform: scale(0);
		transition: transform 0.3s var(--spring);
	}

	input:checked {
		background: var(--red);
		border-color: var(--red);
	}

	input:checked::after {
		transform: scale(1);
	}
</style>
