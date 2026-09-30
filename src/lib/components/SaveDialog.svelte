<script lang="ts">
	import { canShare, downloadSaver, shareSaver } from '$lib/app/savers';

	interface Props {
		/** The rendered print; the dialog is open while this is set. */
		file: File | null;
		onclose: () => void;
		onsaved: (message: string) => void;
	}

	let { file, onclose, onsaved }: Props = $props();

	let dialog: HTMLDialogElement;
	let preview = $state('');
	const shareable = $derived(file ? canShare(file) : false);

	$effect(() => {
		if (!file) {
			dialog.close();
			return;
		}
		const url = URL.createObjectURL(file);
		preview = url;
		dialog.showModal();
		return () => URL.revokeObjectURL(url);
	});

	async function share() {
		if (!file) return;
		const outcome = await shareSaver.save(file).catch(() => 'cancelled' as const);
		if (outcome === 'shared') {
			onsaved('Shared');
			onclose();
		}
	}

	async function download() {
		if (!file) return;
		await downloadSaver.save(file);
		onsaved('Saved ' + file.name);
		onclose();
	}
</script>

<dialog bind:this={dialog} onclose={() => file && onclose()} aria-labelledby="save-title">
	<h2 id="save-title">Pull this print</h2>
	{#if preview}<img src={preview} alt="Full-resolution print" />{/if}
	<p>Share it to Photos or Files, or download it.</p>
	<div class="actions">
		{#if shareable}<button class="btn" type="button" onclick={share}>Share</button>{/if}
		<button class="btn" type="button" onclick={download}>Download</button>
		<button class="btn" type="button" onclick={onclose}>Close</button>
	</div>
</dialog>

<style>
	dialog {
		display: grid;
		gap: 12px;
		max-width: min(560px, calc(100vw - 32px));
		max-height: calc(100dvh - 32px);
		padding: 18px;
		border: 0;
		border-top: 6px solid var(--red);
		background: var(--panel);
		color: var(--fg);
		box-shadow: var(--shadow);
		animation: rise 0.35s var(--glide);
	}

	dialog:not([open]) {
		display: none;
	}

	dialog::backdrop {
		background: var(--scrim);
		animation: fade-in 0.25s ease;
	}

	h2 {
		margin: 0;
		font-family: var(--font-display);
		font-weight: 400;
		font-size: 17px;
	}

	img {
		display: block;
		max-height: 60vh;
		margin-inline: auto;
		box-shadow: var(--shadow);
	}

	p {
		margin: 0;
		font-size: 13.5px;
		color: var(--muted);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
</style>
