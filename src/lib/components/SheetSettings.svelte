<script lang="ts">
	import type { Density, SheetSpec } from '$lib/engine';
	import type { FileType } from '$lib/app/preferences';
	import Segmented from './Segmented.svelte';

	interface Props {
		sheet: SheetSpec;
		fileType: FileType;
		density: Density;
		/** Final size in pixels, shown next to the resolution. */
		size: { width: number; height: number };
		onsheet: (patch: Partial<SheetSpec>) => void;
		onfiletype: (fileType: FileType) => void;
		ondensity: (density: Density) => void;
	}

	let { sheet, fileType, density, size, onsheet, onfiletype, ondensity }: Props = $props();

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

<Segmented
	name="orientation"
	label="Orientation"
	options={orientations}
	value={sheet.orientation}
	onchange={(orientation) => onsheet({ orientation })}
/>
<Segmented
	name="ratio"
	label="Aspect ratio"
	compact
	options={ratios}
	value={sheet.ratio}
	onchange={(ratio) => onsheet({ ratio })}
/>
<div class="label">
	Resolution <span class="dims">{size.width} × {size.height} px</span>
</div>
<Segmented
	name="resolution"
	label="Resolution"
	options={resolutions}
	value={sheet.resolution}
	onchange={(resolution) => onsheet({ resolution })}
/>
<div class="label">File</div>
<Segmented
	name="file-type"
	label="File type"
	options={fileTypes}
	value={fileType}
	onchange={onfiletype}
/>
<div class="label">Density</div>
<Segmented name="density" label="Density" options={densities} value={density} onchange={ondensity} />

<style>
	.dims {
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 400;
		letter-spacing: 0;
		text-transform: none;
		font-variant-numeric: tabular-nums;
	}
</style>
