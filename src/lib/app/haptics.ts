/** A short vibration on devices that support it; silently nothing elsewhere. */
export function pulse(milliseconds = 8): void {
	try {
		navigator.vibrate?.(milliseconds);
	} catch {
		// Some browsers throw when vibration is blocked by policy.
	}
}
