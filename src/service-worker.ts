/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { base, build, files, prerendered, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `unovis-${version}`;
const SHELL = `${base}/`;
const IMMUTABLE = new Set(build);
const ASSETS = new Set([...build, ...files, ...prerendered]);

/** Cached one by one, so a single failed download cannot keep an older version in charge. */
async function precache(): Promise<void> {
	const cache = await caches.open(CACHE);
	await Promise.allSettled([...ASSETS].map((asset) => cache.add(asset)));
}

worker.addEventListener('install', (event) => {
	event.waitUntil(precache().then(() => worker.skipWaiting()));
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

/**
 * Hashed build files never change, so they come straight from the cache. Everything else, the page
 * included, comes from the network first so a new deploy shows up on the next visit; the cache is
 * only the offline fallback.
 */
async function respond(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE);
	const { pathname } = new URL(request.url);

	if (IMMUTABLE.has(pathname)) {
		const cached = await cache.match(pathname);
		if (cached) return cached;
	}

	try {
		const response = await fetch(request);
		if (response.ok && ASSETS.has(pathname)) await cache.put(pathname, response.clone());
		return response;
	} catch (error) {
		const fallback =
			(await cache.match(pathname)) ??
			(request.mode === 'navigate' ? await cache.match(SHELL) : undefined);
		if (fallback) return fallback;
		throw error;
	}
}

worker.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (event.request.method !== 'GET' || url.origin !== location.origin) return;
	event.respondWith(respond(event.request));
});
