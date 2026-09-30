/** Canvas text only uses a web font once it has loaded, so prints wait for the faces they set. */
export async function loadPrintFonts(): Promise<void> {
	try {
		await Promise.all([
			document.fonts.load('40px "Rubik Mono One"', 'ПРОУН'),
			document.fonts.load('600 20px "Jost"', 'ТИРАЖ'),
			document.fonts.load('500 20px "Jost"', 'ТИРАЖ')
		]);
	} catch {
		// Fallback faces are declared; the print still renders.
	}
}
