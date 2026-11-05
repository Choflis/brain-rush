# Cobertura de retos · BRAIN RUSH

Este documento define qué retos de hack4edu 2026 cubre BRAIN RUSH. La base es el MVP descrito en [02 · Requisitos](../especificacion/02-requisitos.md), no los ejemplos de `docs/examples/`. El corte que se entrega el 5 de noviembre está en [04 · MVP](../especificacion/04-mvp-hack4edu.md).

Se reclaman **cuatro retos como máximo**: uno principal y tres secundarios.

## Reto principal

**11 · Una segunda oportunidad para aprender** (✅ Reto ProFuturo)

Es el reto que se inscribe y el que opta al Premio Retos ProFuturo de 1.000 €. Las bases piden inscribir el grupo con un solo problema (Base 3), así que solo este reto se declara como principal.

**Qué pide:** identificar dificultades concretas de aprendizaje, proponer actividades de recuperación personalizadas (con juegos educativos, IA o sistemas adaptativos), funcionar con conectividad limitada y permitir que el docente supervise si hay mejoras.

**Cómo lo cubre BRAIN RUSH:**

- **Identificar dificultades.** Cada ítem del juego está ligado a un criterio de evaluación de la sesión (RF-25). El panel muestra aciertos por criterio y por alumno (RF-61) y una lista de alumnos en riesgo (RF-62).
- **Recuperación personalizada.** El juego sale de la sesión y tiene tres niveles de dificultad (RF-24). El docente lo ajusta con un pedido en lenguaje natural, que crea una nueva versión (RF-30, RF-31).
- **Juegos educativos.** Es el producto principal: juegos de recorrido, emparejar y clasificar generados desde el currículo (RF-22).
- **Conectividad limitada.** El juego guarda el progreso sin conexión y lo envía después (RF-42). La versión impresa se escanea desde el celular, sin dispositivo para el alumno (RF-50 a RF-55).
- **Supervisión docente.** El docente revisa el juego antes de publicarlo (RN-05), confirma las hojas escaneadas (RF-53) y ve los resultados en el panel (RF-60 a RF-62).

**Límites que deben decirse en el pitch:**

- El reto menciona lectura, escritura y matemáticas. El MVP cubre solo **matemática** (conversiones de longitud, en el caso de demostración).
- El sistema **no demuestra mejora de aprendizaje**. Solo registra resultados. Para medir mejora haría falta una evaluación inicial y otra final.

## Retos secundarios

### 14 · Aprender jugando, progresar de verdad

No tiene distintivo ProFuturo, así que no suma al premio. Se declara como enfoque secundario porque es el reto más directo para el motor de juegos.

**Qué pide:** juegos que demuestren aprendizaje y no solo participación, con dificultad adaptada, retroalimentación personalizada y medición de lo aprendido.

**Cómo lo cubre BRAIN RUSH:**

- **Medir aprendizaje.** La puntuación se da por criterio de la sesión (RF-25), no por puntos de juego. El panel separa participación (RF-60) de aciertos por criterio (RF-61).
- **Retroalimentación.** Cada respuesta tiene un gesto visual de acierto o de pista, sin texto obligatorio (RF-26, RF-45).
- **Dificultad.** Tres niveles definidos en el juego (RF-24).

**Límites:**

- La dificultad **no se adapta sola** al desempeño del alumno. El docente elige el nivel. La adaptación automática no está en los requisitos actuales.
- El modo de activación en clase (RF-44) está fuera del corte del hackathon.

### 02 · Aprender sin conexión

Tiene distintivo ProFuturo. Se declara como secundario porque la versión impresa es la respuesta directa al caso del alumno sin dispositivo ni conexión en casa, que el producto debe atender desde el inicio.

**Qué pide:** una experiencia que funcione sin conexión estable y se sincronice después.

**Cómo lo cubre BRAIN RUSH:**

- El juego se juega sin conexión y guarda el progreso en el dispositivo (RF-42, RNF-04).
- La hoja impresa funciona sin dispositivo ni red. Se escanea después y el resultado queda registrado (RF-50 a RF-55).

**Límites:**

- Generar juegos y ver el panel requieren conexión. Solo el juego y la hoja impresa funcionan sin red.
- En el corte del hackathon, la sincronización se prueba solo con desconexión simple.

### 13 · La escuela que aprende de sus datos

Tiene distintivo ProFuturo. Se declara como secundario porque el panel docente convierte los resultados en información comprensible.

**Qué pide:** transformar los datos educativos en información comprensible para decidir mejor, sin decisiones automáticas sobre alumnos y con privacidad.

**Cómo lo cubre BRAIN RUSH:**

- El panel muestra participación, aciertos por criterio, mapa de calor y lista de riesgo con una explicación de cada indicador (RF-60 a RF-62, RF-66).
- El sistema solo muestra alertas. Las decisiones quedan en el docente (RN-05, RN-06).
- La minimización de datos de menores (RNF-08) limita lo que se recoge.

**Límites:**

- El análisis es por aula y por criterio. No cruza datos de otras fuentes, como asistencia oficial o formación docente.
- La comparación entre aulas (RF-63) queda fuera del corte del hackathon.

## Retos no reclamados

Estos retos tienen relación con algún aspecto del producto, pero no se reclaman en el pitch, porque el MVP no lo resuelve de forma directa:

- **24 · IA para ayudar a los más pequeños:** coincide con el público de primer grado, pero el MVP apunta a 1.º a 6.º. Podría ser un candidato si el equipo decide enfocarse en los más pequeños.
- **03 · Un contenido, muchas formas de aprender:** el juego ofrece formatos visuales, pero no convierte materiales de terceros ni genera audio o subtítulos.
- **10 · Tecnología que encuentre a quien estamos dejando atrás:** el panel no registra conectividad, discapacidad ni idioma, por minimización de datos.
- **05 · Detectar antes de que sea demasiado tarde:** la lista de riesgo es básica y no usa tendencias ni modelos predictivos.

Los demás retos no tienen relación con el MVP.

## Resumen

| Reto | Distintivo ProFuturo | Rol | Justificación central |
|---|---|---|---|
| 11 · Una segunda oportunidad para aprender | ✅ | Principal | Juegos de recuperación desde la sesión, identificación por criterio y supervisión docente. |
| 14 · Aprender jugando, progresar de verdad | | Secundario | Juegos que miden aprendizaje por criterio, no por puntos. |
| 02 · Aprender sin conexión | ✅ | Secundario | Juego sin conexión y versión impresa para quien no tiene dispositivo. |
| 13 · La escuela que aprende de sus datos | ✅ | Secundario | Panel docente con explicaciones y sin decisiones automáticas. |

## Punto a confirmar con la coordinación

Confirmar que el premio transversal depende solo del reto declarado como principal (11), y que los secundarios se pueden mencionar en el pitch sin inscribirse en ellos.
