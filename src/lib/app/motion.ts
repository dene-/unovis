export type Motion = 'next' | 'previous' | 'refresh' | 'instant';

const PULL_MS = 480;
const ARRIVE_MS = 560;
const FADE_MS = 260;
const EASE_OUT = 'cubic-bezier(.2,.9,.25,1)';

function ghostOf(canvas: HTMLCanvasElement): HTMLCanvasElement {
	const ghost = document.createElement('canvas');
	ghost.width = canvas.width;
	ghost.height = canvas.height;
	ghost.getContext('2d')!.drawImage(canvas, 0, 0);
	ghost.className = 'ghost';
	ghost.setAttribute('aria-hidden', 'true');
	canvas.after(ghost);
	return ghost;
}

/**
 * Starts the transition from the print currently on the canvas to the one about to be painted.
 * Call it before painting: it lifts a copy of the old sheet and animates it away.
 */
export function beginTransition(canvas: HTMLCanvasElement, motion: Motion, dragOffset: string): void {
	canvas.style.transform = '';
	if (motion === 'instant' || !canvas.width) return;

	const ghost = ghostOf(canvas);
	const remove = () => ghost.remove();

	if (motion === 'refresh') {
		ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: 'ease-out', fill: 'forwards' })
			.finished.then(remove, remove);
		return;
	}

	const side = motion === 'previous' ? 1 : -1;
	ghost
		.animate(
			[
				{ transform: dragOffset || 'none', opacity: 1 },
				{ transform: `translate(${side * 70}%,-5%) rotate(${side * 8}deg)`, opacity: 0 }
			],
			{ duration: PULL_MS, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }
		)
		.finished.then(remove, remove);
	canvas.animate(
		[
			{ transform: `translateX(${-side * 10}%) scale(.96)`, opacity: 0 },
			{ transform: 'none', opacity: 1 }
		],
		{ duration: ARRIVE_MS, easing: EASE_OUT }
	);
}

/** Drops the copy when the sheet changed shape; a cross-fade between different sizes looks broken. */
export function settleResize(canvas: HTMLCanvasElement): void {
	for (const ghost of canvas.parentElement?.querySelectorAll('.ghost') ?? []) ghost.remove();
	canvas.animate(
		[
			{ transform: 'scale(.97)', opacity: 0.3 },
			{ transform: 'none', opacity: 1 }
		],
		{ duration: 380, easing: EASE_OUT }
	);
}
