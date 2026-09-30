/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { base, build, files, prerendered, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `unovis-${version}`;
const SHELL = `${base}/`;
const ASSETS = new Set([...build, ...files, ...prerendered]);

worker.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll([...ASSETS]))
			.then(() => worker.skipWaiting())
	);
});

worker.addEventListener('activate', (event) => {
	const stale = (key: string) => key !== CACHE;
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter(stale).map((key) => caches.delete(key))))
			.then(() => worker.clients.claim())
	);
});

/** Build files never change under the same version, so they come from the cache; the rest from the network. */
async function respond(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE);
	const { pathname } = new URL(request.url);
	const cached = ASSETS.has(pathname) ? await cache.match(pathname) : undefined;
	if (cached) return cached;

	try {
		return await fetch(request);
	} catch (error) {
		const fallback = request.mode === 'navigate' ? await cache.match(SHELL) : undefined;
		if (fallback) return fallback;
		throw error;
	}
}

worker.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (event.request.method !== 'GET' || url.origin !== location.origin) return;
	event.respondWith(respond(event.request));
});
