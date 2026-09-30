<script lang="ts">
	let { size = 34, animated = false }: { size?: number; animated?: boolean } = $props();
</script>

<span class="glyph" class:animated style:--size="{size}px" aria-hidden="true"></span>

<style>
	.glyph {
		display: block;
		flex: none;
		position: relative;
		width: var(--size);
		height: var(--size);
	}

	.glyph::before {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--fg);
		clip-path: polygon(0 0, 100% 50%, 0 100%);
	}

	.glyph::after {
		content: '';
		position: absolute;
		width: 53%;
		height: 53%;
		right: -12%;
		top: -12%;
		border-radius: 50%;
		background: var(--red);
	}

	.animated::before {
		animation: slide-in 0.7s var(--glide) both;
	}

	.animated::after {
		animation: pop 0.6s 0.35s var(--spring) both;
	}

	@keyframes slide-in {
		from {
			transform: translateX(-120%);
			opacity: 0;
		}
		to {
			transform: none;
			opacity: 1;
		}
	}
</style>
