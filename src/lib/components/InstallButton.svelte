<script lang="ts" module>
	/**
	 * Chrome fires this once, early, and only to listeners already in place, so it is caught as
	 * soon as this module loads rather than when the button mounts.
	 */
	let deferred = $state<BeforeInstallPromptEvent | null>(null);

	if (typeof window !== 'undefined') {
		window.addEventListener('beforeinstallprompt', (event) => {
			event.preventDefault();
			deferred = event;
		});
	}
</script>

<script lang="ts">
	let { oninstalled }: { oninstalled: () => void } = $props();

	const installed =
		matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
	const onIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

	$effect(() => {
		const done = () => {
			deferred = null;
			oninstalled();
		};
		window.addEventListener('appinstalled', done);
		return () => window.removeEventListener('appinstalled', done);
	});

	async function install() {
		if (!deferred) return;
		await deferred.prompt();
		await deferred.userChoice.catch(() => null);
		deferred = null;
	}
</script>

{#if deferred}
	<button class="btn" type="button" onclick={install}>Install Unovis</button>
{:else if onIos && !installed}
	<p>To install, tap Share, then Add to Home Screen.</p>
{/if}

<style>
	p {
		margin: 0;
	}
</style>
