<script lang="ts" module>
	export interface SegmentOption<V extends string> {
		value: V;
		label: string;
		title?: string;
	}
</script>

<script lang="ts" generics="T extends string">
	interface Props {
		name: string;
		label: string;
		options: readonly SegmentOption<T>[];
		value: T;
		onchange: (value: T) => void;
		compact?: boolean;
	}

	let { name, label, options, value, onchange, compact = false }: Props = $props();

	let group: HTMLDivElement;
	let thumb = $state({ x: 0, width: 0 });
	let settled = $state(false);

	$effect(() => {
		const selected = options.findIndex((option) => option.value === value);
		const measure = () => {
			const labels = group.querySelectorAll('label');
			const target = labels[selected];
			if (!target) return;
			thumb = { x: target.offsetLeft, width: target.offsetWidth };
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(group);
		const frame = requestAnimationFrame(() => (settled = true));
		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
		};
	});
</script>

<div class="segmented" class:compact role="radiogroup" aria-label={label} bind:this={group}>
	<span
		class="thumb"
		class:settled
		style:width="{thumb.width}px"
		style:transform="translateX({thumb.x}px)"
		aria-hidden="true"
	></span>
	{#each options as option (option.value)}
		<label title={option.title}>
			<input
				type="radio"
				{name}
				value={option.value}
				checked={option.value === value}
				onchange={() => onchange(option.value)}
			/>
			{option.label}
		</label>
	{/each}
</div>

<style>
	.segmented {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		border: 2px solid var(--rule);
		position: relative;
		isolation: isolate;
	}

	.thumb {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		background: var(--fg);
		z-index: -1;
	}

	.thumb.settled {
		transition:
			transform 0.36s var(--spring),
			width 0.36s var(--spring);
	}

	label {
		position: relative;
		text-align: center;
		padding: 7px 4px;
		font-size: 12.5px;
		cursor: pointer;
		border-left: 2px solid var(--rule);
		transition: color 0.2s;
	}

	label:first-of-type {
		border-left: 0;
	}

	label:has(input:checked) {
		color: var(--bg);
		font-weight: 600;
	}

	label:has(input:focus-visible) {
		outline: 3px solid var(--red);
		outline-offset: 2px;
	}

	input {
		position: absolute;
		inset: 0;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}

	.compact label {
		padding-inline: 0;
		font-size: 12px;
		font-variant-numeric: tabular-nums;
	}
</style>
