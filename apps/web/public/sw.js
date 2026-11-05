// Service worker de BRAIN RUSH: deja abrir la app sin red una vez visitada.
// Solo cachea el mismo origen (la API vive en otro puerto y no se toca).
const VERSION = "br-v1";
const SHELL = ["/", "/index.html"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  if (peticion.method !== "GET") return;
  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;

  if (peticion.mode === "navigate") {
    evento.respondWith(
      fetch(peticion)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(VERSION).then((cache) => cache.put("/index.html", copia));
          return respuesta;
        })
        .catch(() => caches.match("/index.html").then((r) => r ?? Response.error())),
    );
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    evento.respondWith(
      caches.match(peticion).then(
        (cacheada) =>
          cacheada ??
          fetch(peticion).then((respuesta) => {
            const copia = respuesta.clone();
            caches.open(VERSION).then((cache) => cache.put(peticion, copia));
            return respuesta;
          }),
      ),
    );
  }
});
