# 02 · Requisitos

Prioridad: **M** = Must (MVP), **S** = Should (después del MVP), **C** = Could (futuro).

## 1. Personas

**P1 · Docente de primaria (usuario principal).** Trabaja con 25 a 35 alumnos de 1.º a 6.º. Tiene poco tiempo para preparar material. Usa el celular con frecuencia y la computadora del aula con proyector. No es experto en tecnología. Necesita: un juego listo para clase en pocos minutos, y saber qué entendieron sus alumnos.

**P2 · Alumno de 1.º a 3.º (lector emergente).** Lee poco o nada. Entiende por imagen, color, sonido y movimiento. Necesita: un juego que se entienda sin leer, con instrucciones animadas y botones grandes.

**P3 · Alumno de 4.º a 6.º (lector en desarrollo).** Lee con dificultad en textos largos. Necesita: textos cortos, apoyo con audio opcional y retroalimentación visual.

**P4 · Familia.** Quiere que el niño juegue en casa sin complicaciones. Puede tener un solo celular compartido o no tener dispositivo.

**P5 · Coordinador académico / dirección.** Quiere ver el avance agregado del colegio y gestionar docentes, aulas y créditos.

## 2. Requisitos funcionales

### 2.1 Gestión de colegio y acceso

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El colegio se registra con datos básicos y elige un plan. | M (simulado en MVP) |
| RF-02 | El docente inicia sesión con correo institucional o cuenta del colegio. Se valida el dominio. | M |
| RF-03 | Un administrador del colegio da de alta docentes, aulas y alumnos (por lista o CSV). | M (lista simple) |
| RF-04 | Cada aula tiene un código de acceso para alumnos. El alumno entra con el código y su nombre de la lista; no necesita correo. | M |
| RF-05 | Roles: administrador del colegio, docente, alumno, familia (solo lectura, futuro). Cada rol solo ve sus datos. | M (sin familia) |
| RF-06 | Los créditos se muestran por colegio con historial de consumo. | M (contador simulado) |

### 2.2 Ingesta de la sesión

| ID | Requisito | Prioridad |
|---|---|---|
| RF-10 | El docente sube o pega la sesión (texto, .docx o .pdf). | M (texto y .docx) |
| RF-11 | El sistema extrae: título, grado, área, competencia, capacidad, desempeños, criterios de evaluación, instrumento, propósito y momentos de la sesión. | M |
| RF-12 | El docente revisa y corrige los datos extraídos antes de generar el juego. | M |
| RF-13 | Si no se encuentra un campo, el sistema lo pide al docente en lugar de inventarlo. | M |

### 2.3 Generación del juego

| ID | Requisito | Prioridad |
|---|---|---|
| RF-20 | El docente elige el tipo: **activación** o **complemento**. | M |
| RF-21 | El docente elige grado (1.º a 6.º) y duración objetivo (5, 10 o 15 minutos). | M |
| RF-22 | El sistema propone una mecánica adecuada al tipo y a la competencia. Mecánicas mínimas: **recorrido** (avanzar por niveles), **emparejar**, **clasificar**, **secuencia** (ordenar pasos), **decisión** (elegir una opción con consecuencia). | M (tres en MVP: recorrido, emparejar, clasificar) |
| RF-23 | El juego tiene misiones, escenario y personaje guía, todos originales. | M |
| RF-24 | El juego genera al menos tres niveles de dificultad (fácil, medio, avanzado) con los mismos criterios. | M |
| RF-25 | Cada ítem del juego está ligado a un criterio de evaluación de la sesión. | M |
| RF-26 | Cada ítem tiene imagen o ícono y, como máximo, una frase corta de texto. Toda instrucción tiene versión animada o con audio. | M |
| RF-27 | El juego de activación tiene modo proyección (una pantalla grande) y modo participación (cada alumno en su dispositivo). | S |
| RF-28 | El sistema valida el juego antes de mostrarlo (esquema, tamaño, contenido permitido). Si falla, reintenta o informa. | M |
| RF-29 | Cada juego generado se guarda como versión inmutable con fecha, prompt y autor. | M |

### 2.4 Iteración por el docente

| ID | Requisito | Prioridad |
|---|---|---|
| RF-30 | El docente pide cambios en lenguaje natural ("más fácil", "con animales", "menos tiempo"). | M |
| RF-31 | Cada cambio crea una nueva versión. El docente puede ver la versión anterior y volver a ella. | M |
| RF-32 | El docente puede editar manualmente textos, imágenes (de la biblioteca) y respuestas correctas. | S |
| RF-33 | Un juego publicado no cambia para los alumnos hasta que el docente publique la nueva versión. | M |

### 2.5 Publicación y juego

| ID | Requisito | Prioridad |
|---|---|---|
| RF-40 | El docente publica el juego para un aula. Se genera un enlace y un código QR. | M |
| RF-41 | El juego corre en navegador en computadora, tablet y celular, sin instalación. | M |
| RF-42 | El juego funciona con conexión inestable: el progreso se guarda en el dispositivo y se sincroniza después. | M |
| RF-43 | El juego incluye tutorial animado que no requiere lectura. | M |
| RF-44 | El juego de activación usa códigos de sala: el docente proyecta un código y los alumnos se unen. | S (en MVP se simula con modo proyección) |
| RF-45 | Al terminar, el alumno ve una pantalla de logro visual (estrellas o insignias) y un resumen de lo que practicó. | M |
| RF-46 | El alumno puede repetir el juego. Se guarda el mejor intento y el número de intentos. | M |

### 2.6 Versión imprimible

| ID | Requisito | Prioridad |
|---|---|---|
| RF-50 | El sistema genera un PDF A4 con la misma mecánica del juego: recorrido, tarjetas de emparejar o clasificar, con ilustraciones. | M (una mecánica en MVP) |
| RF-51 | El PDF incluye un código QR con el identificador del juego y de la hoja, y un área para el nombre del alumno. | M |
| RF-52 | Las respuestas se marcan con casillas o círculos grandes (sin escribir). | M |
| RF-53 | El docente escanea la hoja con el celular desde el navegador (foto). El sistema detecta el QR y las marcas, y muestra un resumen para confirmar antes de guardar. | M (con confirmación manual) |
| RF-54 | Si la lectura automática falla, el docente marca las respuestas a mano desde la misma pantalla. | M |
| RF-55 | Las hojas escaneadas se registran como resultados del alumno, igual que los juegos digitales. | M |

### 2.7 Panel docente (métricas)

| ID | Requisito | Prioridad |
|---|---|---|
| RF-60 | Vista de asistencia y participación por aula y por sesión. | M |
| RF-61 | Porcentaje de aciertos por criterio de evaluación y por alumno (mapa de calor). | M |
| RF-62 | Lista de alumnos en riesgo (participación o aciertos bajos en criterios clave). | M |
| RF-63 | Comparación entre aulas del mismo grado y área. | S |
| RF-64 | Exportar resultados en CSV. | M |
| RF-65 | Registrar la evaluación en el instrumento del colegio (lista de cotejo) a partir de los resultados. | S |
| RF-66 | Las métricas explican qué significa cada indicador, sin lenguaje técnico. | M |

### 2.8 Panel del alumno

| ID | Requisito | Prioridad |
|---|---|---|
| RF-70 | Pantalla de inicio con íconos grandes: juegos disponibles, mis logros, mis juegos imprimibles. | M |
| RF-71 | Juegos bloqueados se muestran con candado e imagen, sin texto. | M |
| RF-72 | Vista de progreso con insignias, no con notas numéricas. | M |

### 2.9 Asistente de IA del docente

| ID | Requisito | Prioridad |
|---|---|---|
| RF-80 | El docente puede pedir ideas para una sesión o explicación de un criterio. | S |
| RF-81 | Las respuestas del asistente citan la fuente de la sesión cargada. No inventa contenido curricular. | S |

## 3. Requisitos no funcionales

| ID | Categoría | Requisito | Medida |
|---|---|---|---|
| RNF-01 | Accesibilidad visual | Contraste mínimo WCAG AA. Botones de al menos 44 px. | Auditoría automática y prueba con niños |
| RNF-02 | Accesibilidad lectora | Toda instrucción tiene versión animada o audio. Texto máximo de 12 palabras por pantalla en 1.º a 3.º. | Revisión de contenido |
| RNF-03 | Dispositivos | Funciona en Chrome o Safari modernos en celular de gama baja (2 GB RAM). | Prueba en un equipo de gama baja |
| RNF-04 | Conectividad | El juego se puede jugar con conexión intermitente y guarda el progreso local. | Prueba con red desconectada |
| RNF-05 | Rendimiento | Primer juego visible en menos de 3 s en 4G. El juego a 30 fps en dispositivos de gama baja. | Medición con herramientas del navegador |
| RNF-06 | Generación | Un juego se genera en menos de 60 s. La iteración en menos de 30 s. | Medición en logs |
| RNF-07 | Seguridad | Datos en tránsito con HTTPS. Contraseñas con hash. Ningún dato de alumno en el código del cliente. | Revisión de código |
| RNF-08 | Privacidad de menores | No se piden correos personales de alumnos. Se minimiza el dato: nombre de lista e identificador interno. Retención configurable por colegio. | Revisión de diseño |
| RNF-09 | Contenido seguro | El texto generado pasa por lista de términos no permitidos y validación de esquema. Imágenes solo de biblioteca aprobada o generadas con filtro. | Pruebas con entradas adversas |
| RNF-10 | Portabilidad de IA | El proveedor de modelos está detrás de una interfaz. Cambiar de proveedor no toca el motor de juegos. | Prueba con un segundo proveedor |
| RNF-11 | Costos | Cada acción registra tokens y costo estimado. Hay límite diario por colegio. | Panel interno de costos |
| RNF-12 | Idioma | Interfaz y juegos en español en la primera versión. La arquitectura separa textos para traducir después (quechua, inglés, portugués). | Revisión de la estructura de textos |
| RNF-13 | Disponibilidad | 99 % mensual en horario escolar (7:00 a 18:00 hora local). | Monitoreo |
| RNF-14 | Respaldo | Juegos, versiones y resultados se respaldan a diario. | Prueba de restauración |

## 4. Reglas de negocio

- RN-01: Un colegio no puede generar juegos si no tiene créditos disponibles, salvo que el plan los incluya en su cuota.
- RN-02: Publicar, jugar y ver resultados nunca consume créditos.
- RN-03: Una hoja impresa solo puede escanearse para el juego y la aula a la que pertenece.
- RN-04: Un alumno solo ve juegos de su grado y aula.
- RN-05: El docente siempre revisa un juego generado antes de publicarlo.
- RN-06: Las métricas de un alumno solo son visibles para su docente, el coordinador del colegio y su familia (futuro).

## 5. Criterios de aceptación clave (historias)

**HU-1 · Generar desde la sesión.** Como docente, quiero subir mi sesión de "Unidades de longitud" (3.º de primaria) y obtener un juego que use esa competencia y esos criterios, para no preparar material desde cero.
- Dado un archivo de sesión válido, cuando lo subo, entonces el sistema muestra competencia, desempeño y criterios extraídos en menos de 30 s.
- Dado que los criterios están extraídos, cuando genero el juego, entonces cada ítem indica el criterio que evalúa.

**HU-2 · Ajustar sin empezar de nuevo.** Como docente, quiero pedir "hazlo más fácil" y que el juego cambie sin perder la versión anterior.
- Dado un juego publicado, cuando pido un ajuste, entonces se crea una nueva versión en borrador y la publicada no cambia hasta que la publique.

**HU-3 · Alumno que no lee.** Como alumno de 1.º, quiero entender qué hacer solo mirando la animación de inicio.
- Dado un juego de complemento, cuando lo abro por primera vez, entonces veo un tutorial animado y puedo jugar sin leer.

**HU-4 · Juego sin internet estable.** Como alumno en casa con señal mala, quiero seguir jugando y que mi progreso se guarde.
- Dado que se corta la conexión, cuando termino un nivel, entonces el progreso se guarda y se envía al volver la conexión.

**HU-5 · Hoja impresa.** Como alumno sin dispositivo, quiero llevar una hoja a casa y devolverla al día siguiente.
- Dado un juego imprimible, cuando el docente escanea la hoja, entonces el sistema reconoce al alumno y las respuestas, y muestra un resumen para confirmar.

**HU-6 · Alumnos en riesgo.** Como docente, quiero ver qué alumnos no están aprendiendo un criterio para darles apoyo.
- Dado resultados de tres juegos, cuando un alumno tiene menos del 50 % de aciertos en un criterio, entonces aparece en la lista de riesgo con ese criterio.

**HU-7 · Crédito agotado.** Como administrador, quiero saber cuántos créditos quedan y qué consume cada acción.
- Dado un colegio con 0 créditos, cuando el docente intenta generar un juego, entonces se le informa y se ofrece comprar créditos (simulado en MVP).

## 6. Fuera de alcance (esta versión)

- Notas oficiales y sincronización con sistemas del Ministerio.
- Chat entre alumnos.
- Juegos en 3D.
- Aplicaciones nativas.
- Cobro automatizado de suscripciones.
