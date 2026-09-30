const FORWARD = new Set(['ArrowRight', 'ArrowDown']);
const BACKWARD = new Set(['ArrowLeft', 'ArrowUp']);

/** Arrow-key movement inside a radio group; returns the newly chosen value, or null for other keys. */
export function rove<T>(event: KeyboardEvent, values: readonly T[], current: T): T | null {
	const step = FORWARD.has(event.key) ? 1 : BACKWARD.has(event.key) ? -1 : 0;
	if (!step) return null;
	event.preventDefault();
	event.stopPropagation();
	const index = values.indexOf(current);
	return values[(index + step + values.length) % values.length];
}
