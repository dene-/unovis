<script lang="ts">
	import type { Toaster } from '$lib/app/toaster.svelte';

	let { toaster }: { toaster: Toaster } = $props();
</script>

<div class="toast" class:visible={toaster.visible} role="status" aria-live="polite">
	{toaster.message}
</div>

<style>
	.toast {
		position: fixed;
		left: 50%;
		bottom: calc(var(--peek, 0px) + 20px + env(safe-area-inset-bottom, 0px));
		z-index: 40;
		display: flex;
		align-items: center;
		gap: 10px;
		max-width: calc(100vw - 32px);
		padding: 10px 16px;
		background: var(--fg);
		color: var(--bg);
		box-shadow: var(--shadow);
		font-size: 13.5px;
		font-weight: 500;
		pointer-events: none;
		opacity: 0;
		transform: translate(-50%, 16px) scale(0.96);
		transition:
			opacity 0.22s,
			transform 0.4s var(--spring);
	}

	.toast::before {
		content: '';
		flex: none;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--red);
	}

	.visible {
		opacity: 1;
		transform: translate(-50%, 0) scale(1);
	}
</style>
