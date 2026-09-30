<script lang="ts">
	import { untrack } from 'svelte';
	import { paintComposition, type Composition } from '$lib/engine';
	import { beginTransition, settleResize, type Motion } from '$lib/app/motion';
	import { snapshotThumbnail } from '$lib/app/thumbnails';
	import { swipe, type SwipeDirection } from '$lib/attachments/swipe';

	interface Props {
		print: Composition;
		/** False until the print's fonts have loaded; nothing is painted before then. */
		ready: boolean;
		label: string;
		motion: Motion;
		dragOffset: string;
		reducedMotion: boolean;
		canGoBack: boolean;
		onswipe: (direction: SwipeDirection, dragOffset: string) => void;
		ontap: () => void;
		onrefused: () => void;
		onpainted: (thumbnail: string) => void;
	}

	let {
		print,
		ready,
		label,
		motion,
		dragOffset,
		reducedMotion,
		canGoBack,
		onswipe,
		ontap,
		onrefused,
		onpainted
	}: Props = $props();

	/** The on-screen proof is capped for smooth animation; saving renders the full sheet. */
	const PREVIEW_LONG_EDGE = 2200;
	const BUILD_MS = 760;

	let canvas: HTMLCanvasElement;
	let painted = false;

	$effect(() => {
		if (!ready) return;
		const current = print;
		const kind = untrack(() => (reducedMotion ? 'instant' : motion));
		const offset = untrack(() => dragOffset);
		const scale = Math.min(1, PREVIEW_LONG_EDGE / Math.max(current.width, current.height));
		const width = Math.round(current.width * scale);
		const height = Math.round(current.height * scale);

		beginTransition(canvas, painted ? kind : 'instant', offset);
		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
			if (kind === 'refresh') settleResize(canvas);
		}
		const ctx = canvas.getContext('2d')!;
		const finish = () => {
			paintComposition(ctx, current, { scale });
			painted = true;
			untrack(() => onpainted(snapshotThumbnail(canvas)));
		};

		if (kind === 'refresh' || kind === 'instant') {
			finish();
			return;
		}

		let frame = 0;
		const started = performance.now();
		const build = (now: number) => {
			const progress = Math.min(1, (now - started) / BUILD_MS);
			if (progress === 1) return finish();
			const eased = 1 - Math.pow(1 - progress, 3);
			paintComposition(ctx, current, {
				scale,
				upTo: Math.ceil(eased * current.ops.length),
				finished: false
			});
			frame = requestAnimationFrame(build);
		};
		frame = requestAnimationFrame(build);
		return () => cancelAnimationFrame(frame);
	});
</script>

<div class="frame">
	<canvas
		bind:this={canvas}
		role="button"
		tabindex="0"
		aria-label="{label}. Tap for a new print, swipe to move through this session."
		onkeydown={(event) => event.key === 'Enter' && ontap()}
		{@attach swipe({
			canGoBack: () => canGoBack,
			reducedMotion: () => reducedMotion,
			onTap: () => ontap(),
			onSwipe: (direction, offset) => onswipe(direction, offset),
			onRefused: () => onrefused()
		})}
	></canvas>
</div>

<style>
	.frame {
		position: relative;
		line-height: 0;
		max-width: 100%;
		touch-action: pan-y;
	}

	canvas {
		display: block;
		max-width: 100%;
		max-height: var(--print-max-height, calc(100dvh - 32px - clamp(32px, 6vw, 80px)));
		width: auto;
		height: auto;
		background: #e8e0c9;
		box-shadow: var(--shadow);
		cursor: grab;
		will-change: transform;
	}

	canvas:active {
		cursor: grabbing;
	}

	.frame :global(.ghost) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		box-shadow: var(--shadow);
	}

	@media (max-width: 880px) {
		.frame {
			touch-action: none;
		}
	}
</style>
