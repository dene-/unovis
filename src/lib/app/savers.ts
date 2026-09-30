export type SaveOutcome = 'saved' | 'shared' | 'cancelled';

export interface PrintSaver {
	save(file: File): Promise<SaveOutcome>;
}

export function canShare(file: File): boolean {
	try {
		return navigator.canShare?.({ files: [file] }) ?? false;
	} catch {
		return false;
	}
}

/** Hands the file to the system share sheet, so a phone can put it straight into Photos or Files. */
export const shareSaver: PrintSaver = {
	async save(file) {
		try {
			await navigator.share({ files: [file] });
			return 'shared';
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
			throw error;
		}
	}
};

export const downloadSaver: PrintSaver = {
	async save(file) {
		const url = URL.createObjectURL(file);
		const link = Object.assign(document.createElement('a'), { href: url, download: file.name });
		document.body.append(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(url), 5000);
		return 'saved';
	}
};

export function preferredSaver(file: File, touchScreen: boolean): PrintSaver {
	return touchScreen && canShare(file) ? shareSaver : downloadSaver;
}
