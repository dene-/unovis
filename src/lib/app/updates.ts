/**
 * Keeps an open or installed app on the latest deploy: it checks for a new version whenever the app
 * comes back to the foreground, and reloads once when that version takes over.
 */
export function followUpdates(): void {
	if (!('serviceWorker' in navigator)) return;
	const worker = navigator.serviceWorker;
	const upgrading = !!worker.controller;
	let reloaded = false;

	worker.addEventListener('controllerchange', () => {
		if (!upgrading || reloaded) return;
		reloaded = true;
		location.reload();
	});

	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState !== 'visible') return;
		worker.getRegistration().then((registration) => registration?.update());
	});
}
