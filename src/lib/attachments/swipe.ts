import type { Attachment } from 'svelte/attachments';

export type SwipeDirection = 'next' | 'previous';

export interface SwipeOptions {
	canGoBack: () => boolean;
	reducedMotion: () => boolean;
	onTap: () => void;
	/** Called with the element's transform at release, so the outgoing print can continue from it. */
	onSwipe: (direction: SwipeDirection, dragOffset: string) => void;
	onRefused: () => void;
}

const SLOP = 8;
const COMMIT_DISTANCE = 90;
const COMMIT_VELOCITY = 0.55;
const RESISTANCE = 0.3;

/** Drag the element sideways like a sheet of paper; a tap is a tap. */
export function swipe(options: SwipeOptions): Attachment<HTMLElement> {
	return (node) => {
		let drag: { id: number; x: number; y: number; t: number; dx: number; moving: boolean } | null = null;

		const springBack = () => {
			const from = node.style.transform;
			node.style.transform = '';
			if (from && !options.reducedMotion()) {
				node.animate([{ transform: from }, { transform: 'none' }], {
					duration: 480,
					easing: 'cubic-bezier(.3,1.5,.5,1)'
				});
			}
		};

		const down = (event: PointerEvent) => {
			if (event.button !== 0) return;
			drag = { id: event.pointerId, x: event.clientX, y: event.clientY, t: performance.now(), dx: 0, moving: false };
		};

		const move = (event: PointerEvent) => {
			if (!drag || event.pointerId !== drag.id) return;
			const dx = event.clientX - drag.x;
			const dy = event.clientY - drag.y;
			if (!drag.moving && Math.abs(dx) > SLOP && Math.abs(dx) > Math.abs(dy)) {
				drag.moving = true;
				node.setPointerCapture(event.pointerId);
			}
			if (!drag.moving) return;
			drag.dx = dx > 0 && !options.canGoBack() ? dx * RESISTANCE : dx;
			node.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx * 0.025}deg)`;
		};

		const up = (event: PointerEvent) => {
			if (!drag || event.pointerId !== drag.id) return;
			const { dx, t, moving } = drag;
			drag = null;
			if (!moving) return options.onTap();
			const velocity = dx / Math.max(1, performance.now() - t);
			if (Math.abs(dx) < COMMIT_DISTANCE && Math.abs(velocity) < COMMIT_VELOCITY) return springBack();
			if (dx > 0 && !options.canGoBack()) {
				springBack();
				return options.onRefused();
			}
			options.onSwipe(dx < 0 ? 'next' : 'previous', node.style.transform);
		};

		const cancel = () => {
			if (!drag) return;
			drag = null;
			springBack();
		};

		node.addEventListener('pointerdown', down);
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', up);
		window.addEventListener('pointercancel', cancel);
		return () => {
			node.removeEventListener('pointerdown', down);
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', up);
			window.removeEventListener('pointercancel', cancel);
		};
	};
}
