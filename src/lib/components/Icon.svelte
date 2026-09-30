<script lang="ts" module>
	export type IconName = 'back' | 'save' | 'artist' | 'inks' | 'sheet' | 'plates' | 'prints' | 'close';
</script>

<script lang="ts">
	let { name, size = 22 }: { name: IconName; size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="square"
	aria-hidden="true"
>
	{#if name === 'back'}
		<path d="M14 5l-7 7 7 7" />
	{:else if name === 'save'}
		<path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
	{:else if name === 'artist'}
		<path d="M4 6l13 6-13 6z" fill="currentColor" stroke="none" />
		<circle cx="18" cy="6" r="3" fill="currentColor" stroke="none" />
	{:else if name === 'inks'}
		<path d="M6 20V6M12 20V11M18 20V15" stroke-width="4" />
	{:else if name === 'sheet'}
		<path d="M6 3h12v18H6zM6 16h12" />
	{:else if name === 'plates'}
		<path d="M12 4l9 5-9 5-9-5zM3 14l9 5 9-5" />
	{:else if name === 'prints'}
		<path d="M4 8h12v12H4zM8 4h12v12" />
	{:else}
		<path d="M6 6l12 12M18 6L6 18" />
	{/if}
</svg>
