# Cobertura de retos · Aula Conecta

Este documento indica qué retos de hack4edu 2026 cubre el sistema, con qué grado y con qué justificación. Las descripciones de los retos están en [retos-hack4edu-2026.md](retos-hack4edu-2026.md). Los requisitos se citan con su identificador de [02 · Requisitos](../especificacion/02-requisitos.md) y el alcance del MVP está en [04 · MVP](../especificacion/04-mvp-hack4edu.md).

## Regla de declaración

Las bases piden inscribir al grupo con **el problema en que van a trabajar** (singular). El premio transversal se concede al proyecto que «dé respuesta a uno de los retos» con distintivo ProFuturo (Base 7.c).

Por eso el sistema se declara con **un reto principal**, que es el que se inscribe y el que opta al premio. Los demás retos se citan como **cobertura secundaria**: el sistema contribuye a ellos, pero no se presenta como su solución completa.

**Reto principal declarado: 11 · Una segunda oportunidad para aprender** (✅ Reto ProFuturo).

## Niveles de cobertura

| Nivel | Significado |
|---|---|
| **Principal** | El sistema resuelve el núcleo del reto y se demuestra en el MVP. |
| **Secundaria** | El sistema aporta una parte concreta del reto, con funcionalidad que se puede demostrar. No resuelve el reto completo. |
| **Tangencial** | Relación de contexto sin funcionalidad propia. No se reclama. |

## Resumen

| Reto | Distintivo | Nivel | Funcionalidades que lo sostienen |
|---|---|---|---|
| **11 · Una segunda oportunidad para aprender** | ✅ | **Principal** | RF-20, RF-22, RF-24, RF-25, RF-61, RF-62, RF-42, RF-50 a RF-55 |
| **14 · Aprender jugando, progresar de verdad** | | **Principal** (dentro del MVP) | RF-22, RF-24, RF-25, RF-45, RF-61 |
| 02 · Aprender sin conexión | ✅ | Secundaria | RF-42, RF-50 a RF-55, RNF-04 |
| 24 · IA para ayudar a los más pequeños | | Secundaria | RF-26, RNF-02, RF-43 |
| 13 · La escuela que aprende de sus datos | ✅ | Secundaria | RF-60 a RF-64, RN-06 |
| 03 · Un contenido, muchas formas de aprender | ✅ | Secundaria | RF-26 (audio e imagen), RNF-01, RNF-02 |
| 10 · Tecnología que encuentre a quien estamos dejando atrás | ✅ | Secundaria | RF-62, RF-63, RNF-08 |
| 05 · Detectar antes de que sea demasiado tarde | | Secundaria | RF-62 (alumnos en riesgo), RN-06 |
| 20 · Que ningún talento pase desapercibido | ✅ | Tangencial | — |
| 26 · Cada uno con su ritmo | | Tangencial | — |
| Resto de retos (01, 04, 06–09, 12, 15–19, 21–23, 25, 27–29) | Varios | Sin cobertura | — |

## Justificación por reto

### 11 · Una segunda oportunidad para aprender (principal)

Pide identificar dificultades concretas, proponer actividades de recuperación personalizadas con juegos educativos, funcionar con conectividad limitada y permitir que el docente supervise si hay mejoras.

- **Identificar dificultades:** cada ítem del juego está ligado a un criterio de la sesión (RF-25). Los aciertos se agregan por criterio y por alumno (RF-61). Los alumnos con aciertos bajos en un criterio aparecen en la lista de riesgo (RF-62, HU-6).
- **Actividades de recuperación personalizadas:** el juego se genera desde la sesión y tiene tres niveles de dificultad (RF-24). El docente puede ajustarlo con un pedido en lenguaje natural (RF-30).
- **Juegos educativos:** el motor de mecánicas de juego (RF-22).
- **Conectividad limitada:** el juego guarda el progreso sin conexión y lo envía después (RF-42), y existe una versión impresa que se escanea (RF-50 a RF-55).
- **Supervisión docente:** el docente revisa cada juego antes de publicarlo (RN-05), confirma las hojas escaneadas (RF-53) y ve los resultados en el panel (RF-60 a RF-62).
- **Comprobar mejoras:** la comparación entre intentos y entre juegos del mismo criterio permite ver si un alumno mejora. **Limitación del MVP:** sin una evaluación previa y otra posterior no se mide mejora de aprendizaje. Se debe presentar como una capacidad del sistema y no como un resultado demostrado.

**Límite del reto:** el texto menciona lectura, escritura y matemáticas. El MVP cubre solo matemática (conversiones de longitud). La cobertura de lectura y escritura queda como trabajo futuro, y el pitch no debe presentarla como hecha.

### 14 · Aprender jugando, progresar de verdad (principal dentro del MVP)

Pide que el juego demuestre aprendizaje y no solo participación: adaptar la dificultad, retroalimentar, medir lo aprendido y distinguir participación de aprendizaje real.

- **Medir aprendizaje:** los aciertos se registran por criterio y no por puntos (RF-25, RF-61). El panel separa participación (RF-60) de aciertos (RF-61).
- **Retroalimentación:** cada respuesta tiene una respuesta visual de acierto o pista (RF-26, [arte](../arte-conceptual.md)).
- **Dificultad adaptada:** tres niveles (RF-24). **Limitación del MVP:** la dificultad no cambia sola según el desempeño del alumno. Se hace por nivel elegido por el docente, por lo que la adaptación automática queda como trabajo futuro.
- **Distinguir juego de aprendizaje:** las insignias (RF-45) no sustituyen las métricas del panel. El alumno ve insignias y el docente ve criterios.

**Por qué no tiene distintivo:** el reto 14 no está marcado como ProFuturo. Es secundario para el premio, pero es el reto más cercano a la propuesta y conviene mencionarlo en el pitch.

### 02 · Aprender sin conexión (secundaria, con distintivo)

Pide una experiencia offline-first que sincronice cuando vuelva la red.

- El juego se juega sin conexión, guarda el progreso localmente y lo envía después (RF-42, RNF-04, HU-4).
- La versión impresa funciona sin dispositivo ni red (RF-50 a RF-55, HU-5).
- **Limitación:** en el MVP la sincronización se prueba con desconexión simple. No se garantiza el funcionamiento offline de la generación de juegos ni del panel, que requieren conexión.

### 24 · IA para ayudar a los más pequeños (secundaria)

Pide instrucciones sencillas, visuales y con audio para niños pequeños, con actividades con materiales cotidianos y recursos limitados.

- Las instrucciones son animadas y con texto máximo de 12 palabras para grados 1.º a 3.º (RF-26, RNF-02). El tutorial no requiere lectura (RF-43, HU-3).
- **Limitación:** el audio es opcional y depende de la voz del navegador (ver 01, sección 5). Las actividades con materiales cotidianos (por ejemplo, usar una regla de casa) no están en el MVP. Se pueden añadir como actividades de la hoja impresa.

### 13 · La escuela que aprende de sus datos (secundaria, con distintivo)

Pide transformar datos escolares en información comprensible para docentes y directores, sin decisiones automáticas sobre alumnos y con privacidad.

- El panel convierte los resultados en tablas, mapas de calor y listas de riesgo con una explicación (RF-60 a RF-62, RF-66).
- Las decisiones quedan en el docente (RN-05, RN-06). El sistema solo muestra alertas, no decide.
- **Limitación:** el análisis es a nivel de aula y criterio. No incluye analítica de la escuela completa ni datos de otras fuentes (asistencia oficial, formación docente).

### 03 · Un contenido, muchas formas de aprender (secundaria, con distintivo)

Pide convertir un recurso en formatos accesibles.

- Un mismo juego se presenta como pantalla digital, hoja impresa y, en la biblioteca de assets, con texto reducido e ilustraciones (RF-26, RNF-01, RNF-02).
- **Limitación:** no convierte materiales de terceros ni genera audio ni subtítulos automáticos en el MVP. La cobertura es la del formato de juego, no la del reto completo.

### 10 · Tecnología que encuentre a quien estamos dejando atrás (secundaria, con distintivo)

Pide detectar brechas de acceso y aprendizaje sin identificar individualmente de forma discriminatoria.

- El panel identifica alumnos con bajo desempeño por criterio, y los compara entre aulas (RF-62, RF-63).
- La versión impresa llega a quien no tiene dispositivo (RF-50 a RF-55).
- **Limitación:** el sistema no registra conectividad, discapacidad ni idioma de los alumnos. Por el principio de minimización (RNF-08) no los recoge. Solo ve el resultado, no la causa de la brecha. Por eso la cobertura es parcial.

### 05 · Detectar antes de que sea demasiado tarde (secundaria)

Pide señales tempranas de dificultad y explicar qué factores provocan cada alerta, sin etiquetar al alumno.

- La lista de riesgo indica el criterio con bajo desempeño (RF-62, HU-6), que es la explicación de la alerta.
- **Limitación:** la alerta se basa en pocos juegos y no en tendencias de largo plazo. No hay modelo predictivo. El reto menciona señales de participación y progreso, que el MVP solo cubre en parte.

## Retos tangenciales y sin cobertura

- **20 · Que ningún talento pase desapercibido:** los juegos miden criterios de matemática, no habilidades como creatividad o liderazgo. No se reclama.
- **26 · Cada uno con su ritmo:** el sistema no sigue la explicación del docente en tiempo real. La activación en sala (RF-44) queda como trabajo futuro. No se reclama.
- **Otros retos:** no tienen relación con la funcionalidad del MVP (por ejemplo, 22 sobre comunicación para personas con discapacidad auditiva, o 17 sobre laboratorios virtuales).

## Qué declarar en el pitch

1. **Reto principal:** 11. El MVP demuestra identificación de dificultades por criterio, juego de recuperación y supervisión docente.
2. **Reto 14:** citado como enfoque de medición de aprendizaje, no como premio.
3. **Cobertura secundaria:** 02, 24, 13, 03, 10 y 05, cada uno con una frase que indique lo que el MVP aporta y lo que no.
4. **Límites:** lectura y escritura no están cubiertas, no hay medición de mejora real, la dificultad no se adapta sola y la conectividad no se registra.

Declarar límites reduce el riesgo de que el jurado perciba la propuesta como exagerada.

## Punto a confirmar con la coordinación

Las bases hablan de un problema por equipo, así que se debe confirmar si el proyecto puede citar varios retos. Este documento asume que solo el principal se inscribe y que los secundarios se mencionan como cobertura parcial.
