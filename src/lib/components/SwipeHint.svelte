<script lang="ts">
	import { fade } from 'svelte/transition';
	import { hasSeen, markSeen } from '$lib/app/hints';

	const HINT = 'swipe';
	/** Ignore the tap that may still be in flight from opening the app. */
	const ARM_AFTER = 600;

	let visible = $state(!hasSeen(HINT));

	$effect(() => {
		if (!visible) return;
		const dismiss = () => {
			visible = false;
			markSeen(HINT);
		};
		const timer = setTimeout(
			() => window.addEventListener('pointerdown', dismiss, { once: true }),
			ARM_AFTER
		);
		return () => {
			clearTimeout(timer);
			window.removeEventListener('pointerdown', dismiss);
		};
	});
</script>

{#if visible}
	<div class="hint" role="note" out:fade={{ duration: 200 }}>
		<span class="gesture" aria-hidden="true"><i></i></span>
		Swipe the print for a new one, or back to the last
	</div>
{/if}

<style>
	.hint {
		position: absolute;
		left: 16px;
		right: 16px;
		bottom: 20px;
		margin-inline: auto;
		z-index: 3;
		display: flex;
		align-items: center;
		gap: 12px;
		width: fit-content;
		padding: 10px 14px;
		background: var(--fg);
		color: var(--bg);
		box-shadow: var(--shadow);
		font-size: 13px;
		font-weight: 500;
		pointer-events: none;
		animation: rise 0.5s 0.6s var(--glide) both;
	}

	.gesture {
		position: relative;
		flex: none;
		width: 40px;
		height: 16px;
	}

	.gesture::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 7px;
		height: 2px;
		background: currentColor;
		opacity: 0.35;
	}

	.gesture i {
		position: absolute;
		top: 0;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--red);
		animation: swipe 1.6s var(--glide) infinite;
	}

	@keyframes swipe {
		0% {
			left: 24px;
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		70% {
			left: 0;
			opacity: 1;
		}
		100% {
			left: 0;
			opacity: 0;
		}
	}
</style>
