import type { Composition } from '../composition';
import { TAU } from '../geometry';
import { mulberry32 } from '../random';

const TILE = 256;
let noiseTile: HTMLCanvasElement | null = null;

function grainTile(): HTMLCanvasElement {
	if (noiseTile) return noiseTile;
	const tile = document.createElement('canvas');
	tile.width = tile.height = TILE;
	const ctx = tile.getContext('2d')!;
	const pixels = ctx.createImageData(TILE, TILE);
	for (let i = 0; i < pixels.data.length; i += 4) {
		const value = 255 - Math.pow(Math.random(), 2.2) * 70;
		pixels.data[i] = value;
		pixels.data[i + 1] = value * 0.985;
		pixels.data[i + 2] = value * 0.95;
		pixels.data[i + 3] = 255;
	}
	ctx.putImageData(pixels, 0, 0);
	noiseTile = tile;
	return tile;
}

/** Paper grain, vignette, fibres, an occasional fold, and ink worn back to the paper. */
export function paintPaper(ctx: CanvasRenderingContext2D, print: Composition): void {
	const { width: W, height: H, short: S, palette } = print;
	const random = mulberry32(print.seedHash ^ 0x51ed27);
	const k = S / 1400;

	ctx.save();
	ctx.globalCompositeOperation = 'multiply';
	ctx.globalAlpha = 0.6;
	const grain = ctx.createPattern(grainTile(), 'repeat');
	if (grain) {
		grain.setTransform(new DOMMatrix().scale(Math.max(1, k * 0.7)));
		ctx.fillStyle = grain;
		ctx.fillRect(0, 0, W, H);
	}
	ctx.globalAlpha = 1;

	const vignette = ctx.createRadialGradient(W / 2, H / 2, S * 0.3, W / 2, H / 2, Math.max(W, H) * 0.78);
	vignette.addColorStop(0, 'rgba(0,0,0,0)');
	vignette.addColorStop(1, 'rgba(110,80,35,.22)');
	ctx.fillStyle = vignette;
	ctx.fillRect(0, 0, W, H);

	ctx.strokeStyle = 'rgba(90,70,40,.10)';
	ctx.lineWidth = k;
	for (let i = 0, n = (W * H) / 9000 / (k * k); i < n; i++) {
		const x = random() * W;
		const y = random() * H;
		const angle = random() * TAU;
		const length = (4 + random() * 14) * k;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
		ctx.stroke();
	}

	if (random() < 0.5) {
		const half = 6 * k;
		const fold = W / 2 + (random() - 0.5) * 8 * k;
		const crease = ctx.createLinearGradient(fold - half, 0, fold + half, 0);
		crease.addColorStop(0, 'rgba(0,0,0,0)');
		crease.addColorStop(0.5, 'rgba(80,60,30,.14)');
		crease.addColorStop(1, 'rgba(0,0,0,0)');
		ctx.fillStyle = crease;
		ctx.fillRect(fold - half, 0, half * 2, H);
	}
	ctx.restore();

	ctx.save();
	ctx.fillStyle = print.ground;
	for (let i = 0, n = Math.floor((W * H) / 2300 / (k * k)); i < n; i++) {
		ctx.globalAlpha = 0.25 + random() * 0.65;
		ctx.beginPath();
		ctx.arc(random() * W, random() * H, (0.4 + random() * random() * 2.4) * k, 0, TAU);
		ctx.fill();
	}
	ctx.fillStyle = palette.ink;
	for (let i = 0, n = Math.floor((W * H) / 60000 / (k * k)); i < n; i++) {
		ctx.globalAlpha = 0.2 + random() * 0.4;
		ctx.beginPath();
		ctx.arc(random() * W, random() * H, (0.5 + random() * 1.4) * k, 0, TAU);
		ctx.fill();
	}
	ctx.restore();
}
