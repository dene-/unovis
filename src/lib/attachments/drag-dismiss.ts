import type { Attachment } from 'svelte/attachments';

export interface DragDismissOptions {
	/** The element that follows the finger; the handle is only where the drag starts. */
	panel: () => HTMLElement | undefined;
	onDismiss: () => void;
}

const DISTANCE = 90;
const VELOCITY = 0.5;

/** Pull a panel down by its handle to close it. */
export function dragDismiss(options: DragDismissOptions): Attachment<HTMLElement> {
	return (handle) => {
		let drag: { id: number; y: number; t: number; dy: number } | null = null;

		const down = (event: PointerEvent) => {
			if ((event.target as Element).closest('button')) return;
			drag = { id: event.pointerId, y: event.clientY, t: performance.now(), dy: 0 };
			handle.setPointerCapture(event.pointerId);
		};

		const move = (event: PointerEvent) => {
			const panel = options.panel();
			if (!drag || event.pointerId !== drag.id || !panel) return;
			drag.dy = Math.max(0, event.clientY - drag.y);
			panel.style.transition = 'none';
			panel.style.transform = `translateY(${drag.dy}px)`;
		};

		const up = (event: PointerEvent) => {
			const panel = options.panel();
			if (!drag || event.pointerId !== drag.id || !panel) return;
			const { dy, t } = drag;
			drag = null;
			panel.style.transition = '';
			if (dy > DISTANCE || dy / Math.max(1, performance.now() - t) > VELOCITY) {
				options.onDismiss();
			} else {
				panel.style.transform = '';
			}
		};

		handle.addEventListener('pointerdown', down);
		handle.addEventListener('pointermove', move);
		handle.addEventListener('pointerup', up);
		handle.addEventListener('pointercancel', up);
		return () => {
			handle.removeEventListener('pointerdown', down);
			handle.removeEventListener('pointermove', move);
			handle.removeEventListener('pointerup', up);
			handle.removeEventListener('pointercancel', up);
		};
	};
}
