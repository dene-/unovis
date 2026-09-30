<script lang="ts">
	import { afterNavigate, replaceState } from '$app/navigation';
	import { MediaQuery } from 'svelte/reactivity';
	import { prefersReducedMotion } from 'svelte/motion';
	import { ARTISTS, composePrint, PALETTES, type Plates, type SheetSpec } from '$lib/engine';
	import { renderPrintFile, type PrintFile } from '$lib/app/export';
	import { loadPrintFonts } from '$lib/app/fonts';
	import { pulse } from '$lib/app/haptics';
	import type { Motion } from '$lib/app/motion';
	import type { ArtistChoice, FileType, PaletteChoice, Preferences } from '$lib/app/preferences';
	import { browserStorage, PreferencesStore } from '$lib/app/preferences.svelte';
	import {
		cleanSeed,
		formatLink,
		newSeed,
		parseLink,
		printSettings,
		resolveArtist
	} from '$lib/app/prints';
	import { preferredSaver } from '$lib/app/savers';
	import { ProofSession } from '$lib/app/session.svelte';
	import { artistPreviews } from '$lib/app/thumbnails';
	import { Toaster } from '$lib/app/toaster.svelte';
	import type { SwipeDirection } from '$lib/attachments/swipe';
	import ArtistPicker from '$lib/components/ArtistPicker.svelte';
	import ControlSheet from '$lib/components/ControlSheet.svelte';
	import Glyph from '$lib/components/Glyph.svelte';
	import InkPicker from '$lib/components/InkPicker.svelte';
	import InstallButton from '$lib/components/InstallButton.svelte';
	import PlateToggles from '$lib/components/PlateToggles.svelte';
	import PrintStage from '$lib/components/PrintStage.svelte';
	import ProofStrip from '$lib/components/ProofStrip.svelte';
	import SaveDialog from '$lib/components/SaveDialog.svelte';
	import Segmented from '$lib/components/Segmented.svelte';
	import Splash from '$lib/components/Splash.svelte';
	import Toast from '$lib/components/Toast.svelte';

	const preferences = new PreferencesStore(browserStorage('unovis:preferences'));
	const toaster = new Toaster();
	const phone = new MediaQuery('max-width: 880px');
	const touchScreen = new MediaQuery('pointer: coarse');
	const standalone =
		matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

	const link = parseLink(location.hash);
	if (link && resolveArtist(preferences.current.artist, link.seed) !== link.artist) {
		preferences.set({ artist: link.artist });
	}
	const firstSeed = link?.seed ?? newSeed();
	const session = new ProofSession({
		seed: firstSeed,
		artist: resolveArtist(preferences.current.artist, firstSeed)
	});

	let motion = $state<Motion>('next');
	let dragOffset = $state('');
	let fontsLoaded = $state(false);
	let previews = $state<Record<ArtistChoice, string> | null>(null);
	let sheetOpen = $state(false);
	let peek = $state(0);
	let saving = $state(false);
	let pendingFile = $state<File | null>(null);
	let routerReady = $state(false);
	let controls: ReturnType<typeof ControlSheet>;
	let artistSection: HTMLElement;

	const seed = $derived(session.current.seed);
	const drawing = $derived(session.current.artist);
	const artist = $derived(ARTISTS[drawing]);
	const settings = $derived(printSettings(preferences.current, drawing));
	const print = $derived(composePrint(seed, settings));

	loadPrintFonts().then(() => {
		fontsLoaded = true;
		previews = artistPreviews();
	});

	afterNavigate(() => (routerReady = true));

	$effect(() => {
		const hash = formatLink({ artist: drawing, seed });
		if (routerReady) replaceState(hash, {});
	});

	function pull(nextSeed: string, dragged = '') {
		motion = 'next';
		dragOffset = dragged;
		session.pull({ seed: nextSeed, artist: resolveArtist(preferences.current.artist, nextSeed) });
	}

	function pullNew(dragged = '') {
		pulse();
		pull(newSeed(), dragged);
	}

	function step(delta: number, dragged = ''): boolean {
		if (!session.canStep(delta)) return false;
		motion = delta < 0 ? 'previous' : 'next';
		dragOffset = dragged;
		pulse();
		session.step(delta);
		const chosen = preferences.current.artist;
		if (chosen !== 'any' && chosen !== session.current.artist) {
			preferences.set({ artist: session.current.artist });
		}
		return true;
	}

	function swiped(direction: SwipeDirection, dragged: string) {
		if (direction === 'previous') step(-1, dragged);
		else if (!step(1, dragged)) pullNew(dragged);
	}

	function chooseArtist(choice: ArtistChoice) {
		if (choice === preferences.current.artist) return;
		pulse(6);
		motion = 'next';
		dragOffset = '';
		preferences.set({ artist: choice });
		session.reassign(resolveArtist(choice, seed));
	}

	/** Changes that keep the composition cross-fade into place. */
	function restyle(change: () => void, kind: Motion = 'refresh') {
		pulse(5);
		motion = kind;
		dragOffset = '';
		change();
	}

	function setSheet(patch: Partial<SheetSpec>) {
		restyle(() => preferences.setSheet(patch), 'resolution' in patch ? 'instant' : 'refresh');
	}

	async function save() {
		if (saving) return;
		saving = true;
		pulse(6);
		await new Promise(requestAnimationFrame);
		let rendered: PrintFile;
		try {
			rendered = await renderPrintFile(seed, settings, preferences.current.fileType);
		} catch {
			toaster.show("Your device couldn't render a sheet that large. Try a lower resolution.");
			saving = false;
			return;
		}
		try {
			const outcome = await preferredSaver(rendered.file, touchScreen.current).save(rendered.file);
			if (outcome !== 'cancelled') {
				toaster.show(`${outcome === 'shared' ? 'Shared' : 'Saved'} ${rendered.label}`);
			}
		} catch {
			// Sharing needs a fresh tap once rendering took a while; the dialog offers one.
			pendingFile = rendered.file;
		} finally {
			saving = false;
		}
	}

	function keydown(event: KeyboardEvent) {
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		const target = event.target as HTMLElement;
		if (event.key === 'Escape' && sheetOpen) {
			sheetOpen = false;
			return;
		}
		if (target.matches('input[type="text"], dialog *')) return;
		const inGroup = !!target.closest('[role="radiogroup"]');
		if (event.key === ' ' && !target.matches('button, input')) {
			event.preventDefault();
			pullNew();
		} else if (event.key === 'n' || event.key === 'N') pullNew();
		else if (event.key === 'ArrowLeft' && !inGroup) step(-1);
		else if (event.key === 'ArrowRight' && !inGroup) step(1);
	}

	const orientations = [
		{ value: 'portrait', label: 'Portrait' },
		{ value: 'landscape', label: 'Landscape' }
	] as const;
	const ratios = [
		{ value: '1:1', label: '1:1', title: 'Square' },
		{ value: '5:4', label: '5:4' },
		{ value: '4:3', label: '4:3' },
		{ value: '3:2', label: '3:2' },
		{ value: 'iso', label: 'A4', title: 'ISO A-series paper (A4, A3…)' },
		{ value: '16:9', label: '16:9' },
		{ value: '21:9', label: '21:9' }
	] as const;
	const resolutions = [
		{ value: 'hd', label: 'HD' },
		{ value: '2k', label: '2K' },
		{ value: '4k', label: '4K' },
		{ value: '8k', label: '8K' }
	] as const;
	const fileTypes = [
		{ value: 'png', label: 'PNG' },
		{ value: 'jpg', label: 'JPG' }
	] as const;
	const densities = [
		{ value: 'sparse', label: 'Sparse' },
		{ value: 'balanced', label: 'Balanced' },
		{ value: 'dense', label: 'Dense' }
	] as const;
</script>

<svelte:head>
	<title>Unovis</title>
</svelte:head>

<svelte:window onkeydown={keydown} />

<div class="app" style:--peek="{peek}px">
	<main class="stage">
		<header class="appbar">
			<Glyph size={26} />
			<div class="title">
				<b>Unovis</b>
				<span>after {artist.name}</span>
			</div>
			<button class="btn" type="button" onclick={() => controls.reveal(artistSection)}
				>Artist</button
			>
		</header>

		<PrintStage
			{print}
			ready={fontsLoaded}
			label="Print after {artist.name}, seed {seed}, {PALETTES[settings.palette].name} inks"
			{motion}
			{dragOffset}
			reducedMotion={prefersReducedMotion.current}
			canGoBack={session.canStep(-1)}
			onswipe={swiped}
			ontap={() => pullNew()}
			onrefused={() => toaster.show('This is the first print of the session')}
			onpainted={(thumbnail) => session.thumbnails.set(session.current.id, thumbnail)}
		/>

		<p class="hint">
			tap or swipe ← for a new print · swipe → to go back<br />space for new · arrow keys for
			history
		</p>
	</main>

	<ControlSheet asSheet={phone.current} bind:open={sheetOpen} bind:peek bind:this={controls}>
		{#snippet header()}
			<div class="masthead">
				<Glyph />
				<h1>Unovis</h1>
				<p>Constructivist print generator</p>
			</div>
		{/snippet}

		{#snippet actions()}
			<button class="btn primary" type="button" onclick={() => pullNew()}>
				New print <span class="arrow" aria-hidden="true"></span>
			</button>
			<div class="seed-row">
				<input
					type="text"
					value={seed}
					spellcheck="false"
					autocomplete="off"
					maxlength="16"
					aria-label="Seed"
					onchange={(event) => {
						const typed = cleanSeed(event.currentTarget.value);
						if (typed && typed !== seed) pull(typed);
						else event.currentTarget.value = seed;
					}}
					onkeydown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
				/>
				<button class="btn" class:busy={saving} type="button" disabled={saving} onclick={save}>
					Save
				</button>
			</div>
			<div class="save-spec">
				<span>
					{preferences.current.sheet.resolution.toUpperCase()}
					{preferences.current.fileType.toUpperCase()} · {print.width}×{print.height}
				</span>
				<span>{saving ? 'Rendering…' : ''}</span>
			</div>
		{/snippet}

		<section class="section" bind:this={artistSection}>
			<div class="label">Artist</div>
			<ArtistPicker
				value={preferences.current.artist}
				{drawing}
				{previews}
				onselect={chooseArtist}
			/>
		</section>

		<section class="section">
			<div class="label">Ink set</div>
			<InkPicker
				value={preferences.current.palette}
				artistPalette={artist.palette}
				onselect={(palette: PaletteChoice) => restyle(() => preferences.set({ palette }))}
			/>
		</section>

		<section class="section">
			<div class="label">Sheet</div>
			<Segmented
				name="orientation"
				label="Orientation"
				options={orientations}
				value={preferences.current.sheet.orientation}
				onchange={(orientation) => setSheet({ orientation })}
			/>
			<Segmented
				name="ratio"
				label="Aspect ratio"
				compact
				options={ratios}
				value={preferences.current.sheet.ratio}
				onchange={(ratio) => setSheet({ ratio })}
			/>
			<div class="label">
				Resolution <span class="dims">{print.width} × {print.height} px</span>
			</div>
			<Segmented
				name="resolution"
				label="Resolution"
				options={resolutions}
				value={preferences.current.sheet.resolution}
				onchange={(resolution) => setSheet({ resolution })}
			/>
			<div class="label">File</div>
			<Segmented
				name="file-type"
				label="File type"
				options={fileTypes}
				value={preferences.current.fileType}
				onchange={(fileType: FileType) => preferences.set({ fileType })}
			/>
			<div class="label">Density</div>
			<Segmented
				name="density"
				label="Density"
				options={densities}
				value={preferences.current.density}
				onchange={(density: Preferences['density']) => restyle(() => preferences.set({ density }))}
			/>
		</section>

		<section class="section">
			<div class="label">Plates</div>
			<PlateToggles
				plates={preferences.current.plates}
				labels={artist.plateLabels}
				onchange={(plate: keyof Plates, on: boolean) =>
					restyle(() => preferences.setPlate(plate, on))}
			/>
		</section>

		<section class="section">
			<div class="label">This session <span><kbd>←</kbd> <kbd>→</kbd></span></div>
			<ProofStrip
				proofs={session.proofs}
				index={session.index}
				thumbnails={session.thumbnails}
				onselect={(index) => step(index - session.index)}
			/>
		</section>

		<footer class="footnote">
			<InstallButton oninstalled={() => toaster.show('Unovis installed')} />
			<p>
				Same artist and seed, same print. Changing ink or plates keeps the composition; a new seed
				rearranges it.
			</p>
		</footer>
	</ControlSheet>

	<Toast {toaster} />
</div>

<SaveDialog
	file={pendingFile}
	onclose={() => (pendingFile = null)}
	onsaved={(message) => toaster.show(message)}
/>
{#if standalone && !prefersReducedMotion.current}<Splash />{/if}

<style>
	.app {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 360px;
		gap: 16px;
		height: 100%;
		padding: 16px;
	}

	.stage {
		position: relative;
		display: grid;
		place-items: center;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		padding: clamp(16px, 3vw, 40px);
		background: var(--wall);
	}

	.appbar {
		display: none;
	}

	.hint {
		position: absolute;
		left: 16px;
		bottom: 12px;
		margin: 0;
		font-family: var(--font-mono);
		font-size: 11px;
		line-height: 1.3;
		letter-spacing: 0.02em;
		color: var(--muted);
	}

	.masthead {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 4px 14px;
		padding: 20px 20px 16px;
		border-bottom: 2px solid var(--rule);
	}

	.masthead :global(.glyph) {
		grid-row: span 2;
	}

	.masthead h1 {
		margin: 0;
		font-family: var(--font-display);
		font-weight: 400;
		font-size: 22px;
		line-height: 1;
		letter-spacing: 0.02em;
	}

	.masthead p {
		margin: 0;
		font-size: 13px;
		color: var(--muted);
	}

	.primary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 14px 16px;
		border-color: var(--red);
		background: var(--red);
		color: var(--on-red);
		font-family: var(--font-display);
		font-weight: 400;
		font-size: 15px;
		letter-spacing: 0.04em;
	}

	.primary:hover {
		background: var(--red);
		filter: brightness(1.08);
	}

	.primary:active .arrow {
		transform: translateX(10px);
	}

	.arrow {
		width: 0;
		height: 0;
		border-left: 14px solid currentColor;
		border-top: 8px solid transparent;
		border-bottom: 8px solid transparent;
		transition: transform 0.3s var(--spring);
	}

	.primary:hover .arrow {
		transform: translateX(4px);
	}

	.seed-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 8px;
	}

	.seed-row input {
		min-width: 0;
		padding: 9px 10px;
		border: 2px solid var(--rule);
		border-radius: 0;
		background: var(--bg);
		font-family: var(--font-mono);
		font-size: 16px;
		text-transform: lowercase;
	}

	.busy {
		position: relative;
		overflow: hidden;
	}

	.busy::after {
		content: '';
		position: absolute;
		left: 0;
		bottom: 0;
		width: 40%;
		height: 3px;
		background: var(--red);
		animation: progress 1s linear infinite;
	}

	@keyframes progress {
		from {
			left: -40%;
		}
		to {
			left: 100%;
		}
	}

	.save-spec {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 10px;
		min-height: 1.2em;
		font-family: var(--font-mono);
		font-size: 11.5px;
		color: var(--muted);
	}

	.dims {
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 400;
		letter-spacing: 0;
		text-transform: none;
		font-variant-numeric: tabular-nums;
	}

	kbd {
		padding: 0 4px;
		border: 1px solid currentColor;
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0;
	}

	.footnote {
		display: grid;
		gap: 10px;
		margin-top: auto;
		padding: 14px 20px 20px;
		font-size: 12px;
		color: var(--muted);
	}

	.footnote p {
		margin: 0;
		max-width: 44ch;
	}

	@media (max-width: 880px) {
		.app {
			display: block;
			padding: 0;
			overflow: hidden;
		}

		.stage {
			position: fixed;
			inset: 0;
			--bar: 52px;
			--print-max-height: calc(
				100dvh - env(safe-area-inset-top, 0px) - var(--bar) - var(--peek) - 28px
			);
			padding: calc(env(safe-area-inset-top, 0px) + var(--bar) + 8px) 16px calc(var(--peek) + 16px);
		}

		.appbar {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			z-index: 2;
			display: flex;
			align-items: center;
			gap: 12px;
			padding: calc(env(safe-area-inset-top, 0px) + 10px) 16px 8px;
		}

		.title {
			display: grid;
			flex: 1;
			min-width: 0;
			line-height: 1.15;
		}

		.title b {
			font-family: var(--font-display);
			font-weight: 400;
			font-size: 15px;
			letter-spacing: 0.03em;
		}

		.title span {
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
			font-size: 12.5px;
			color: var(--muted);
		}

		.appbar .btn {
			padding: 6px 10px;
			background: var(--panel);
		}

		.hint {
			display: none;
		}
	}
</style>
