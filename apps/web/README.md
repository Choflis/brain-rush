# apps/web

Interfaz web: panel docente, panel del alumno y reproductor de juegos (Phaser). Se despliega en Cloudflare Pages.

## Desarrollo

```bash
# desde la raíz del repositorio
npm install
npm run dev:web      # http://localhost:5173
npm run dev:api      # http://localhost:8787 (en otra terminal)
```

Copia `apps/web/.env.example` a `apps/web/.env` si la API no corre en el puerto 8787.

## Rutas

| Ruta | Dueño | Estado |
|---|---|---|
| `/` | U | Landing del producto |
| `/docente/login` | U | Acceso demo (token `demo-docente`) |
| `/docente` | U | Panel docente: lista de juegos |
| `/j/:codigo` | C | Reproductor de complemento (C4) |
| `/s/:codigo` | C | Sala del alumno (C5) |
| `/proyectar/:codigo` | C | Sala proyectada (C5) |

El esqueleto, las rutas y el login son de U. Las pantallas de juego y sala son de C y se montan
en las rutas ya registradas.

## Cliente de la API

`src/app/api.ts` implementa el [contrato v1](../../docs/especificacion/08-contrato.md) y expone un
objeto `api` con todas las rutas. Las pantallas de C lo importan desde `../app/api`; no deben
duplicar `fetch` ni inventar formas de respuesta.

Consulta [03 · Arquitectura técnica](../../docs/especificacion/03-arquitectura-tecnica.md) y [02 · Requisitos](../../docs/especificacion/02-requisitos.md).
