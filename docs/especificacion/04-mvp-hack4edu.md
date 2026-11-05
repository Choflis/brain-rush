# 04 · MVP para hack4edu 2026

## 1. Situación y plazos

- Fecha de hoy: **4 de noviembre de 2026**.
- Ejecución del hackathon: del 3 al 5 de noviembre de 2026 (23:59 hora local). **Queda menos de un día y medio.**
- Entregables obligatorios (Base 5): presentación de **5 minutos** (PPT), **video de 3 minutos** y **enlace al código** en GitHub o GitLab.
- Fallo del jurado: 7 de noviembre.

Por eso el MVP es un **corte vertical**: una sola sesión real, un tipo de juego de complemento bien hecho, una versión imprimible y un panel de métricas. Lo que no entre en esta lista va a la hoja de «próximos pasos» del pitch.

## 2. Modalidad: innovadora

El equipo concurre en la **modalidad innovadora (a)**. Sus criterios son: creatividad e innovación (40 %), grado de acabado y calidad final (20 %), posibilidad de transferir el prototipo al mercado (20 %) y orientación a resolver problemas de educación digital con IA en países desfavorecidos (20 %).

Condición de la modalidad: el proyecto debe desarrollarse **exclusivamente durante los días 3-5 de noviembre**. El jurado puede aplicar una penalización del **20 %** si no hay evidencias suficientes.

El desarrollo comenzó el 3 de noviembre. Para sostenerlo ante el jurado:

1. **Historial de Git completo.** No reescribir ni aplastar commits (`git rebase`, `squash` o `push --force`). El historial empieza el 4 de noviembre a las 01:41 (hora de Perú) y todos los commits quedan dentro de la ventana.
2. **Documento `PROCEDENCIA.md` en la raíz del repositorio**, con la cronología del trabajo: qué se hizo el 3 de noviembre, qué el 4 y qué el 5. Debe indicar qué se tomó de material previo y cuál es su origen. Las sesiones de aprendizaje son material de la institución y se citan como tal.
3. **Ficha del concurso sin trabajo previo.** Los documentos de especificación se presentan como parte del trabajo del hackathon y no como un proyecto anterior.
4. **Coherencia en la presentación.** El pitch y el video muestran el trabajo de los días 3 a 5. No se presenta el concepto anterior como si fuera parte del proyecto.

Si el coordinador local considera que la idea se originó antes del 3 de noviembre, el jurado podría aplicar la penalización. Conviene consultarlo hoy con hack4edu@fundacionprofuturo.org, o con el interlocutor de la sede local, para confirmar el criterio aplicable.

## 3. Reto: 11 · Una segunda oportunidad para aprender

Hay que abordar un reto del catálogo para optar también al **Premio Retos ProFuturo de 1.000 €**. Los retos con distintivo ProFuturo son 02, 03, 06, 10, 11, 12, 13, 15, 17 y 20.

Elegimos el **Reto 11**. Su texto pide:

> «Desarrollar una solución tecnológica capaz de identificar dificultades concretas de aprendizaje y proponer actividades de recuperación personalizadas […]. La propuesta podrá utilizar inteligencia artificial, juegos educativos o sistemas adaptativos […], incluso en escuelas con conectividad limitada, permitiendo al docente supervisar los avances y comprobar si realmente se producen mejoras en el aprendizaje.»

Cada punto del texto corresponde a una parte de nuestro proyecto:

| Pide el reto | Lo cubrimos con |
|---|---|
| Identificar dificultades concretas | Métricas por criterio de evaluación de la sesión (RF-61, RF-62). |
| Actividades de recuperación personalizadas | Juegos generados desde la sesión, con tres niveles de dificultad (RF-24). |
| Juegos educativos | Motor de juegos de recorrido, emparejar y clasificar. |
| IA | Generación del juego a partir de la sesión y de los criterios (03, sección 6). |
| Conectividad limitada | Juego sin conexión (RF-42) y versión imprimible con escaneo (RF-50 a RF-55). |
| El docente supervisa | Revisión obligatoria antes de publicar (RN-05), panel de métricas y confirmación de hojas escaneadas. |
| Comprobar mejoras | Comparación de aciertos por criterio entre juegos de una misma competencia. |

La cobertura completa, con los cuatro retos declarados como máximo (11 principal; 14, 02 y 13 secundarios) y sus límites, está en [cobertura de retos](../bases/cobertura-retos.md). Solo el Reto 11 se inscribe.

**Rúbrica del Premio Retos ProFuturo** (Base 6.c, jurado internacional): impacto social en contextos vulnerables (25 %), enfoque inclusivo y equitativo (25 %), sostenibilidad y escalabilidad (25 %) y uso ético y responsable de la IA (25 %). Los argumentos del pitch deben apoyarse en estos cuatro puntos.

## 4. Alcance del MVP

### 4.1 Incluido (obligatorio para la demo)

| # | Funcionalidad | Criterio de terminado |
|---|---|---|
| M1 | Ingreso del docente (cuenta demo, sin contraseña real) y del alumno con código de aula y selección de nombre | Ambos roles ven solo su pantalla. |
| M2 | Ingesta de sesión: pegar texto y revisar campos extraídos (competencia, desempeño, criterios) | La sesión «Unidades de longitud» se extrae correctamente con revisión manual. |
| M3 | Generación de un **juego de complemento de tipo recorrido** sobre conversiones ×10 y ÷10, en 3 niveles | Cada ítem muestra su criterio y cumple el GameSpec. |
| M4 | Reproductor web con tutorial animado sin texto, retroalimentación visual y guardado de progreso local | Un niño de 1.º puede jugar el tutorial sin leer. |
| M5 | Iteración: un pedido en lenguaje natural crea una nueva versión (ej.: «hazlo más fácil») | Se ve la versión anterior y la nueva. |
| M6 | Publicación con enlace y código QR | El alumno entra desde el celular con el QR. |
| M7 | Versión imprimible A4 del mismo juego con QR y casillas | Se imprime desde el navegador. |
| M8 | Escaneo de la hoja con el celular, con confirmación manual | Se registra un resultado con fuente «papel». |
| M9 | Panel docente: participación, aciertos por criterio, lista de alumnos en riesgo y exportación CSV | Los datos de M4 y M8 aparecen en el panel. |
| M10 | Créditos simulados: saldo visible y descuento al generar, iterar e imprimir | Un colegio sin saldo recibe el aviso. |

### 4.2 Stretch (solo si M1 a M10 están estables)

- S1: modo proyección para activación (una pantalla, sin datos personales).
- S2: segundo tipo de mecánica (emparejar).
- S3: segunda sesión de ejemplo (Personal Social, semáforo) para mostrar que el motor es general.

### 4.3 Fuera del MVP (decir explícitamente en el pitch)

- Pagos reales, planes y facturación.
- Sincronización con SIAGIE o sistemas oficiales.
- Juegos 3D (los ejemplos de `docs/examples/` quedan como referencia de mecánicas, no como código reutilizado).
- Quechua, inglés y portugués.
- Panel de familias.

## 5. Juego de demostración

**Sesión:** «Unidades de longitud» · 3.º de primaria · Matemática (fuente: `docs/sesiones/11 MAT UNIDADES DE LONGITUD.docx`).

**Mecánica:** recorrido de conversión. El personaje (guía «Reglita») avanza por una escalera de unidades `km → hm → dam → m → dm → cm → mm`. En cada salto aparece el símbolo ×10 o ÷10. El alumno elige cuántas veces saltar.

**Niveles:**

1. **Fácil:** de metros a centímetros, con ilustraciones de objetos (lápiz, cuerda).
2. **Medio:** de metros a milímetros, o de centímetros a metros.
3. **Avanzado:** problemas de la ficha (ej.: 3 km a m, 200 cm a m).

**Criterios cubiertos:** C1 (identifica unidades), C3 (conversiones ×10 y ÷10). El criterio C2 (múltiplos y submúltiplos) se usa en el tutorial.

**Imprimible:** la misma escalera en A4 con círculos para marcar la respuesta y un QR.

Este caso es el que se presenta en la demo porque se conecta directamente con la sesión real y con el instrumento de evaluación del colegio (lista de cotejo).

## 6. Guion de la presentación (5 minutos)

| Tiempo | Momento | Contenido |
|---|---|---|
| 0:00–0:40 | Problema | Un docente planifica bien, pero no tiene tiempo de convertir la sesión en juego. Y los niños que no leen no entienden los juegos actuales. Hay alumnos que tras avanzar de grado no consolidaron lectura ni matemáticas. |
| 0:40–1:10 | Propuesta | Sube la sesión → obtiene juego de complemento, imprimible, con métricas por criterio. |
| 1:10–2:30 | Demo en vivo | Subir sesión → revisar criterios → generar → ajustar con «más fácil» → publicar QR → jugar en celular. |
| 2:30–3:30 | Papel | Imprimir → alumno sin celular → escanear hoja → ver el resultado en el panel. |
| 3:30–4:20 | Negocio y escalabilidad | Suscripción por colegio + créditos por generación. Costo medido por juego. Crecimiento por colegio. |
| 4:20–5:00 | Impacto y ética | Recuperación sin depender del dispositivo; el docente revisa todo; datos de menores minimizados; licencia abierta. |

Preparar un **plan B** para la demo: un juego ya generado y un PDF impreso listo en caso de que falle la red o la IA.

## 7. Video de 3 minutos

- Mismo flujo que la demo, grabado con anticipación para no depender de la conexión.
- Incluir una toma de un niño (con permiso de su familia, o con actor/a adulto) usando el juego sin leer.
- Subtítulos en español.
- Sin logos de terceros sin permiso (las bases indican cómo usar el logo de la universidad).

## 8. Cumplimiento de las bases

| Requisito | Cómo se cumple | Responsable |
|---|---|---|
| Inscripción individual y grupo declarado | Confirmar que el equipo está inscrito con modalidad **innovadora** y el reto **11** declarados. | Coordinador |
| Modalidad innovadora: desarrollo entre el 3 y el 5 de noviembre | Historial de Git sin reescritura y `PROCEDENCIA.md` con la cronología (sección 2). | Equipo |
| Código abierto | Licencia **MIT** para el código. Documentación y assets con **CC BY-NC-SA 3.0** (recomendado por las bases). | Equipo |
| Código en GitHub o GitLab | Repositorio público con README y pasos de ejecución. | Equipo |
| Presentación de 5 minutos (PPT) | Basada en el guion de la sección 6. | Equipo |
| Video de 3 minutos | Sección 7. | Equipo |
| Originalidad y derechos | Mascota, escenario y biblioteca de ilustraciones originales o con licencia verificada. | Equipo |
| No usar marcas de terceros | Sin personajes de películas ni logos de otras empresas. Los ejemplos de `docs/examples/` solo se usan como referencia si su autoría es del equipo. | Equipo |
| Datos personales (RGPD / normativa local) | El demo usa datos ficticios o de la sesión, sin datos de alumnos reales. | Equipo |
| Código ético | Lenguaje respetuoso, sin comentarios que estigmaticen a los estudiantes en las métricas. | Equipo |

Nota sobre el archivo `docs/examples/index.html`: contiene una contraseña de demostración visible en el código (`1234`) y un acceso simulado. Es aceptable como maqueta interna, pero **no debe mostrarse como versión final ni desplegarse** sin cambiar el acceso.

## 9. Plan de trabajo (hasta el 5 de noviembre)

**Bloque 1 · Hoy (4 de nov., tarde y noche)**

- Confirmar inscripción, modalidad innovadora y reto 11 con la coordinación.
- Estructura del repositorio (ya creada) y `PROCEDENCIA.md`.
- Definir el GameSpec v1 y el validador (`packages/gamespec`).
- Escribir el prompt de extracción y probarlo con la sesión de unidades de longitud.

**Bloque 2 · Mañana (5 de nov., primera mitad)**

- Motor de recorrido en Phaser con 3 niveles y tutorial animado (M3, M4).
- Generación del juego con Mistral y validación (M3).
- Iteración con un pedido de ajuste (M5).

**Bloque 3 · Mañana (5 de nov., segunda mitad)**

- Publicación, QR y acceso del alumno (M1, M6).
- Hoja imprimible con QR y casillas, y escaneo con confirmación manual (M7, M8).
- Panel docente básico y créditos simulados (M9, M10).

**Bloque 4 · Entrega (5 de nov.)**

- Grabar el video (3 min), preparar la presentación (5 min) y ensayar la demo.
- Limpiar el README y dejar el repositorio público.
- Enviar el formulario de entrega antes de las 23:59.

Si al final de la mañana M4 o M8 no funcionan, se recorta a una demo con juego digital y se muestra la hoja impresa como imagen, explicándolo en el pitch.

## 10. Riesgos del hackathon

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Tiempo insuficiente | Alto | Corte vertical; stretch solo si lo anterior está estable. |
| Límite de la capa gratuita de Mistral | Medio | Generar y guardar el juego demo antes; plan B con juego ya generado. |
| Escaneo poco confiable | Medio | Confirmación manual siempre visible; mostrar el resultado con foto del papel en el video. |
| Falta de biblioteca de ilustraciones | Alto | Usar 20 a 30 íconos SVG propios para el demo; el resto como trabajo futuro. |
| Penalización por desarrollo previo al 3 de nov. | Alto | Historial de Git íntegro, `PROCEDENCIA.md` y consulta a la coordinación (sección 2). |
| Reto 11 pide más de lo que cubrimos | Medio | Enfocar el pitch en recuperación de matemáticas y supervisión docente; no prometer lectura ni escritura. |

## 11. Decisiones pendientes (responsable: equipo)

| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| D1 | Nombre del producto | — | **Resuelto:** el MVP se llama BRAIN RUSH. |
| D2 | Modalidad | Innovadora / senior | **Innovadora** (ya decidida). Ver sección 2. |
| D3 | Reto | Reto 11 / Reto 14 / otro | **Reto 11** (distintivo ProFuturo, encaje directo). |
| D4 | Motor de juego | Phaser / PixiJS | Phaser (más rápido de montar). |
| D5 | Autenticación del docente en MVP | Cuenta demo / enlace mágico | Cuenta demo, con enlace mágico como fase 2. |
| D6 | Licencia del código | MIT / Apache-2.0 | MIT (más simple). |
| D7 | Moneda y precios | PEN / USD | Definir después del piloto con costo real. |
| D8 | Vigencia de créditos | Caducan al mes / se acumulan | Se acumulan dentro del año escolar. |
| D9 | Consentimiento de familias | Formulario del colegio / en la plataforma | Formulario del colegio (fase 2 con firma digital). |
| D10 | Fuente de ilustraciones | Diseño propio / íconos con licencia | Mezcla: íconos con licencia verificada + mascota propia. |
| D11 | Mascota y personajes | Original (no usar personajes existentes) | Original. Ver dirección de arte. |

## 12. Criterio de éxito del MVP

- Un docente sube una sesión real y obtiene un juego jugable en menos de 10 minutos.
- Un alumno de 1.º puede entender el tutorial sin leer.
- Una hoja impresa se escanea y aparece en el panel.
- El jurado puede ver el repositorio, el video y el panel en un solo recorrido.
