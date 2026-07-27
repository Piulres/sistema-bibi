/** Cache offline básico da trilha PWA — shell /instalar + ícones. */
const CACHE = "bibi-shell-v1";
const PRECACHE = [
  "/instalar",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const { pathname } = new URL(event.request.url);
  const shellAsset =
    pathname === "/instalar" ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/icons/");

  if (!shellAsset) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request)),
  );
});
