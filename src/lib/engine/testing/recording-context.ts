/**
 * A stand-in for CanvasRenderingContext2D that records every call and assignment, so tests can
 * compare what two prints would draw without a real canvas.
 */
export function recordingContext(): { ctx: CanvasRenderingContext2D; log: string[] } {
	const log: string[] = [];
	const gradient = { addColorStop: (...args: unknown[]) => log.push(`stop ${args.join(',')}`) };
	const round = (value: unknown) => (typeof value === 'number' ? value.toFixed(3) : String(value));

	const target: Record<string, unknown> = {
		measureText: (text: string) => ({ width: text.length * 10 }),
		createLinearGradient: () => gradient,
		createRadialGradient: () => gradient,
		createPattern: () => null
	};

	const ctx = new Proxy(target, {
		get(object, key: string) {
			if (key in object) return object[key];
			return (...args: unknown[]) => log.push(`${key}(${args.map(round).join(',')})`);
		},
		set(_target, key: string, value) {
			log.push(`${key}=${round(value)}`);
			return true;
		}
	});

	return { ctx: ctx as unknown as CanvasRenderingContext2D, log };
}
