const PREFIX = 'unovis:seen:';

/** Whether a one-time hint has already been shown on this device. */
export function hasSeen(hint: string): boolean {
	try {
		return localStorage.getItem(PREFIX + hint) === '1';
	} catch {
		return false;
	}
}

export function markSeen(hint: string): void {
	try {
		localStorage.setItem(PREFIX + hint, '1');
	} catch {
		// Without storage the hint simply shows again next time.
	}
}
