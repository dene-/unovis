import type { Attachment } from 'svelte/attachments';

export interface SheetDragOptions {
	enabled: () => boolean;
	isOpen: () => boolean;
	setOpen: (open: boolean) => void;
	/** Height left visible when the sheet is closed. */
	peek: () => number;
	/** 0 when closed, 1 when fully open; updated while dragging. */
	onProgress: (openness: number | null) => void;
}

const SLOP = 8;
const FLICK = 0.35;
const OVERDRAG = 0.25;

/** Drag a bottom sheet open or closed by its handle, or by its body while it is scrolled to the top. */
export function sheetDrag(options: SheetDragOptions): Attachment<HTMLElement> {
	return (sheet) => {
		let drag: {
			id: number;
			x: number;
			y: number;
			t: number;
			startedOpen: boolean;
			travel: number;
			position: number;
			active: boolean;
			fromHandle: boolean;
		} | null = null;
		let suppressClick = false;

		const down = (event: PointerEvent) => {
			if (!options.enabled()) return;
			const target = event.target as Element;
			const fromHandle = !!target.closest('[data-sheet-handle]');
			if (!fromHandle && options.isOpen() && sheet.scrollTop > 0) return;
			if (target.closest('input[type="text"]')) return;
			const travel = sheet.offsetHeight - options.peek();
			const startedOpen = options.isOpen();
			drag = {
				id: event.pointerId,
				x: event.clientX,
				y: event.clientY,
				t: performance.now(),
				startedOpen,
				travel,
				position: startedOpen ? 0 : travel,
				active: false,
				fromHandle
			};
		};

		const move = (event: PointerEvent) => {
			if (!drag || event.pointerId !== drag.id) return;
			const dy = event.clientY - drag.y;
			if (!drag.active) {
				if (Math.abs(dy) < SLOP || Math.abs(dy) < Math.abs(event.clientX - drag.x)) return;
				if (drag.startedOpen && dy < 0 && !drag.fromHandle) {
					drag = null;
					return;
				}
				drag.active = true;
				suppressClick = true;
				sheet.dataset.dragging = '';
				sheet.setPointerCapture(event.pointerId);
			}
			let position = (drag.startedOpen ? 0 : drag.travel) + dy;
			if (position < 0) position *= OVERDRAG;
			if (position > drag.travel) position = drag.travel + (position - drag.travel) * OVERDRAG;
			drag.position = position;
			sheet.style.transform = `translateY(${position}px)`;
			options.onProgress(Math.max(0, Math.min(1, 1 - position / drag.travel)));
		};

		const up = (event: PointerEvent) => {
			if (!drag || event.pointerId !== drag.id) return;
			const finished = drag;
			drag = null;
			if (!finished.active) return;
			const start = finished.startedOpen ? 0 : finished.travel;
			const velocity = (finished.position - start) / Math.max(1, performance.now() - finished.t);
			delete sheet.dataset.dragging;
			sheet.style.transform = '';
			options.onProgress(null);
			options.setOpen(
				velocity < -FLICK
					? true
					: velocity > FLICK
						? false
						: finished.position < finished.travel / 2
			);
			setTimeout(() => (suppressClick = false), 50);
		};

		const swallowClick = (event: MouseEvent) => {
			if (!suppressClick) return;
			event.stopPropagation();
			event.preventDefault();
		};

		sheet.addEventListener('pointerdown', down);
		sheet.addEventListener('click', swallowClick, true);
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', up);
		window.addEventListener('pointercancel', up);
		return () => {
			sheet.removeEventListener('pointerdown', down);
			sheet.removeEventListener('click', swallowClick, true);
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', up);
			window.removeEventListener('pointercancel', up);
		};
	};
}
