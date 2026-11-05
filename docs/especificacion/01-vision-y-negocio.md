# 01 · Visión y modelo de negocio

## 1. Problema

- Los docentes de primaria planifican sesiones detalladas, pero no tienen tiempo ni herramientas para convertirlas en juegos. Lo que termina en clase suele ser una ficha o un quiz.
- Los juegos educativos existentes son, en su mayoría, preguntas con texto. Muchos alumnos de 1.º a 6.º todavía están aprendiendo a leer, así que el texto les impide entender la dinámica.
- El docente no ve con claridad qué entendió cada alumno ni quién necesita apoyo, y las métricas se pierden entre fichas y cuadernos.
- No todos los alumnos tienen un dispositivo o conexión en casa. Un juego que solo funciona en línea deja fuera a parte del aula.

## 2. Propuesta de valor

Para **colegios de primaria** que quieren innovar en el aula con transformación digital, Aula Conecta es un **motor que genera videojuegos a partir de la sesión de aprendizaje del docente**. A diferencia de un banco de preguntas, genera **mecánicas, misiones, escenarios, niveles de dificultad y evaluaciones** alineadas a la competencia y al desempeño de la sesión.

Diferenciadores:

1. **Parte de la sesión real.** El docente sube su sesión (texto, Word o PDF) y el sistema extrae propósito, competencia, desempeños, criterios e instrumento. El juego se diseña para esos criterios.
2. **Pensado para lectores emergentes.** La dinámica se entiende por imágenes, íconos, animación, color y audio. El texto es mínimo y siempre opcional.
3. **Dos modos de uso con la misma fuente.** El mismo juego sirve para la clase (activación), para casa (complemento) y en versión impresa.
4. **Iterable por el docente.** El docente pide ajustes en lenguaje natural ("más fácil", "con animales de la selva", "con menos tiempo") y obtiene una nueva versión.
5. **Métricas accionables.** Asistencia, participación, aciertos por criterio, alumnos en riesgo y comparación entre aulas.

## 3. Clientes y usuarios

| Cliente (quien paga) | Usuario directo | Beneficiario |
|---|---|---|
| Colegio privado o público (dirección, coordinación académica) | Docente de aula (primaria, 1.º a 6.º) | Alumno de primaria, familia |

Usuarios secundarios: coordinador académico (ve métricas agregadas del colegio) y, en el futuro, familias (acceso al juego de complemento y al reporte del hijo).

Los clientes son **colegios**, no familias. Las familias no pagan; esto evita fricción y permite que el colegio sea responsable de la protección de datos de los menores (ver §6).

## 4. Modelo de negocio: suscripción + créditos

El modelo cubre dos costos: la **plataforma fija** (licencia, acceso, panel, almacenamiento) y el **costo variable de IA y de impresión**, que depende del uso.

### 4.1 Planes de suscripción (por colegio, mensual o anual)

| Plan | Incluye | Público objetivo |
|---|---|---|
| **Piloto** (gratis, tiempo limitado) | 1 docente, 1 aula, créditos de prueba, sin impresión | Validación con un colegio |
| **Aula** | Hasta 5 docentes, panel de métricas, créditos mensuales, impresión básica | Colegio pequeño o un nivel |
| **Institucional** | Docentes y aulas ilimitados del colegio, panel de coordinación, créditos ampliados, soporte | Colegio completo |

Cada plan define: número de docentes, aulas y alumnos activos; créditos mensuales incluidos; retención de datos; y soporte.

### 4.2 Créditos (consumo variable)

Los créditos cubren el costo de generar y adaptar juegos. Son **por colegio** y se pueden comprar en paquetes adicionales cuando se agotan.

Propuesta inicial de consumo (a calibrar con el costo real medido en el piloto):

| Acción | Créditos |
|---|---|
| Generar un juego de complemento desde una sesión | 1 |
| Generar un juego de activación desde una sesión | 2 |
| Iterar un juego (un ajuste en lenguaje natural) | 0,5 |
| Generar la versión imprimible (PDF con código QR) | 0,5 |
| Regenerar un juego completo desde cero | 1 |
| Publicar y jugar | Sin costo |

Reglas:

- Los juegos publicados y las respuestas de los alumnos no consumen créditos.
- Un juego generado y no publicado se puede reutilizar sin costo.
- Los créditos que no se usan en el mes caducan o se acumulan según el plan (decisión pendiente, ver 04).

### 4.3 Costos que se deben cubrir

| Rubro | Naturaleza | Notas |
|---|---|---|
| Llamadas a modelo de IA (Mistral) | Variable | Por juego e iteración. Se mide en tokens por acción. |
| Almacenamiento y entrega de archivos (Cloudflare R2) | Variable, bajo | Juegos, PDFs, imágenes. Sin cargos de salida en R2. |
| Cómputo y base de datos (Cloudflare Workers y D1) | Fijo bajo / variable | Crece con alumnos activos. |
| Impresión (si el colegio la hace fuera) | Variable | El sistema entrega PDF; la impresión la hace el colegio o un servicio externo. |
| Soporte y capacitación | Fijo | Incluido en plan Institucional. |

Principio: **el margen se calcula por crédito y por alumno activo**, no solo por licencia. Antes de fijar precios, el piloto debe medir costo real por generación, por iteración y por alumno al mes.

### 4.4 Precios

Los precios concretos no se definen en esta especificación. Se fijarán en moneda local (PEN para Perú) después de medir el piloto. Ningún precio se publica hasta tener el costo real.

## 5. Alcance del producto

Dentro del alcance:

- Ingesta de la sesión de aprendizaje (formato MINEDU y texto libre).
- Generación de juegos de activación y de complemento.
- Iteración del juego por el docente.
- Juego jugable en navegador (computadora, tablet, celular).
- Versión imprimible con escaneo desde el celular.
- Panel docente de métricas y panel del alumno.
- Gestión de colegio, docentes, aulas y créditos.

Fuera del alcance de la primera versión:

- Pagos en línea automatizados (se simulan en el MVP).
- Apps nativas (Android o iOS).
- Integración con sistemas de notas oficiales (SIAGIE u otros).
- Juegos 3D complejos. El formato se apoya en 2D y animaciones simples.
- Generación de voz propia (se usa voz del navegador o grabaciones).

## 6. Riesgos y consideraciones de privacidad

- **Menores de edad.** Los alumnos no deben crear cuentas con correos personales. El acceso es por código de aula y nombre de lista, y el colegio es responsable del consentimiento de las familias.
- **Normativa.** En Perú aplica la Ley 29733 (Protección de Datos Personales) y su reglamento. Si el producto se usa en otros países, se revisa RGPD u otra normativa local.
- **Contenido generado por IA.** Todo juego pasa por validación de esquema y revisión del docente antes de publicarse. No se muestra contenido libre generado por el modelo sin filtro.
- **Dependencia de un proveedor de IA.** El sistema debe poder cambiar de modelo sin reescribir el juego (ver 03).
- **Calidad educativa.** Un juego generado puede tener errores de contenido. El docente siempre revisa antes de publicar.
