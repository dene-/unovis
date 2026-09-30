<script lang="ts">
	import '@fontsource/rubik-mono-one';
	import '@fontsource/jost/400.css';
	import '@fontsource/jost/500.css';
	import '@fontsource/jost/600.css';
	import '@fontsource/ibm-plex-mono/400.css';
	import '../app.css';
	import { followUpdates } from '$lib/app/updates';

	let { children } = $props();

	followUpdates();
</script>

{@render children()}
