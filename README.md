# Aula Conecta · Motor de juegos educativos desde la sesión de clase

> Nombre de trabajo. El nombre definitivo está pendiente de decisión.

**Aula Conecta** es una plataforma B2B para colegios de primaria. Convierte las sesiones de aprendizaje que ya escribe cada docente en **videojuegos educativos generados con IA**, que se pueden jugar en la web, imprimir en papel y revisar desde un panel de métricas.

Los juegos son de dos tipos:

- **Activación:** el docente lo proyecta y todos los alumnos participan desde sus dispositivos durante la clase.
- **Complemento:** los alumnos lo juegan en casa, en cualquier dispositivo, o en versión impresa cuando no tienen acceso.

## Documentación

| Documento | Contenido |
|---|---|
| [01 · Visión y modelo de negocio](docs/especificacion/01-vision-y-negocio.md) | Problema, clientes, propuesta de valor, suscripción y créditos. |
| [02 · Requisitos](docs/especificacion/02-requisitos.md) | Personas, requisitos funcionales y no funcionales, criterios de aceptación. |
| [03 · Arquitectura técnica](docs/especificacion/03-arquitectura-tecnica.md) | Stack de despliegue, formato del juego, generación con IA, impresión y escaneo. |
| [04 · MVP para hack4edu 2026](docs/especificacion/04-mvp-hack4edu.md) | Alcance del MVP, rúbrica del concurso, plan de entrega y decisiones pendientes. |
| [Dirección de arte](docs/arte-conceptual.md) | Estilo visual basado en la referencia de diseño. |
| [Retos de hack4edu 2026](docs/bases/retos-hack4edu-2026.md) | Los 29 retos publicados, con descripciones y distintivo «Reto ProFuturo». |
| [Cobertura de retos](docs/bases/cobertura-retos.md) | Qué retos cubre el sistema, con qué grado y con qué límites. |

## Fuentes del proyecto

- `docs/sesiones/`: sesiones de aprendizaje reales (formato MINEDU: propósito, competencias, desempeños, criterios, momentos de la sesión, instrumento de evaluación).
- `docs/examples/`: ejemplos de juegos generados (trivia, emparejar, recorrido 3D, dilemas) y el prototipo del panel docente (`index.html`).
- `docs/design/idea.jpeg`: referencia de estilo visual.
- `docs/bases/bases-hack4edu.pdf`: bases del concurso para el que se prepara el MVP.

## Estado

**Etapa actual: especificación.** Esta versión reemplaza la idea anterior de un juego en Roblox. Aún no hay código de producción. El prototipo de ejemplo en `docs/examples/index.html` es solo una maqueta de referencia.
