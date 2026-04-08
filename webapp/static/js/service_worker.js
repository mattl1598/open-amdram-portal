const CACHE_NAME = 'images-v1'
const PRECACHE_CACHE_NAME = 'precache-v1'

async function cacheImageEntries(images) {
	const cache = await caches.open(CACHE_NAME)

	for (const [originalUrl, imageData] of Object.entries(images || {})) {
		if (!originalUrl || !imageData || !imageData.base64) {
			continue
		}

		const bytes = Uint8Array.from(atob(imageData.base64), c => c.charCodeAt(0))
		const response = new Response(bytes, {
			headers: {
				'Content-Type': imageData.mimetype || 'image/webp',
				'Cache-Control': 'public, max-age=31536000',
			},
		})

		await cache.put(originalUrl, response)
	}
}

async function cacheUrls(urls) {
	const cache = await caches.open(PRECACHE_CACHE_NAME)

	for (const url of urls || []) {
		if (!url) continue

		try {
			const response = await fetch(url, { cache: 'no-store' })
			if (response && response.ok) {
				await cache.put(url, response.clone())
			}
		} catch (err) {
			console.warn('Failed to precache URL:', url, err)
		}
	}
}

self.addEventListener('install', (event) => {
	self.skipWaiting()
})

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim())
})

self.addEventListener('message', (event) => {
	const data = event.data

	if (!data) {
		return
	}

	const work = (async () => {
		if (data.type === 'CACHE_IMAGES') {
			await cacheImageEntries(data.images)
		} else if (data.type === 'PRECACHE_URLS') {
			await cacheUrls(data.urls)
		} else {
			return
		}

		if (event.ports && event.ports[0]) {
			event.ports[0].postMessage({ ok: true })
		}
	})()

	event.waitUntil(work)
})

self.addEventListener('fetch', (event) => {
	const request = event.request

	if (request.destination !== 'image') {
		return
	}

	event.respondWith((async () => {
		const cache = await caches.open(CACHE_NAME)
		const cached = await cache.match(request.url)

		if (cached) {
			return cached
		}

		return fetch(request)
	})())
})