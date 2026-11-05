# 06 · Diseño de los juegos del MVP

Características de los juegos que genera BRAIN RUSH. **Confirmado el 4 de noviembre.** Reemplaza las mecánicas «trivia» y «recorrido» del [plan de implementación](05-plan-implementacion-mvp.md). Reglita aparece en todos los juegos; las dinámicas se adaptan a cada sesión.

## 1. Restricción de diseño

Ningún juego puede ser una secuencia de preguntas con opciones. Cada respuesta del niño debe ser una **acción dentro de una escena**: arrastrar, construir, mover a un personaje, clasificar, alimentar o saltar. La pregunta se formula con imágenes y se responde haciendo algo.

## 2. Niveles y sesiones disponibles

| Nivel | Carpeta | Grados | Sesiones disponibles | Juego propuesto |
|---|---|---|---|---|
| **N1** | `docs/sesiones/nivel-3/` | 1.º y 2.º | «Jugamos para conocernos mejor» (1.º, s1) y «Elaboran el cartel con los precios de los productos» (1.º, s9) | **La tiendita** (activación) |
| **N2** | `docs/sesiones/nivel-4/` | 3.º y 4.º | «Unidades de longitud» (3.º), «Pictogramas», «Enfermedades respiratorias», «Historieta» | **La carrera de conversiones** (complemento) |
| **N3** | `docs/sesiones/nivel-5/` | 5.º y 6.º | Ninguna todavía | Pendiente |

## 3. Juego N1 · La tiendita (activación)

**Sesión base:** «Elaboran el cartel con los precios de los productos y sus nombres» (1.º, Matemática, resuelve problemas de cantidad hasta 10).

**Historia en una frase:** la tiendita está desordenada y los clientes necesitan sus productos.

**Mecánica:** cada producto cae en la pantalla y el niño lo arrastra a la estantería correcta (bebidas, frutas, limpieza). Después, un cliente pide un grupo, por ejemplo «3 botellas de gaseosa», con pictogramas, y el niño cuenta arrastrando cada botella a la bolsa.

**En el aula (activación):**
- La pantalla grande muestra la tienda y el camión de reparto.
- Cada alumno tiene su estantería en el celular o la tablet, con botones grandes.
- Meta **colectiva**: entre todos llenan el camión con 10 productos. La barra del camión sube con cada acierto de cualquier alumno. No hay ranking individual en pantalla.
- Cuando el camión se llena, el grupo ve una animación de celebración.

**Criterios que evalúa:** clasificar por categoría (C1), agrupar y contar hasta 10 (C2), representar cantidades con objetos (C3). Los criterios exactos vienen de la sesión.

**Ritmo:** 3 niveles de dificultad (fácil: 2 categorías; medio: 3; avanzado: subgrupos, por ejemplo gaseosa y jugo dentro de bebidas). Total 8 a 10 minutos.

## 4. Juego N2 · La carrera de conversiones (complemento)

**Sesión base:** «Unidades de longitud» (3.º, Matemática, conversiones con ×10 y ÷10).

**Historia en una frase:** Reglita tiene que llegar a la meta del patio, y para cruzar cada puerta debe convertir la medida que pide el guardián.

**Mecánica:** Reglita corre por el patio. Delante aparece una puerta con una medida, por ejemplo «7 m → cm». El niño toca el botón **×10** o **÷10** tantas veces como escalones haya entre las unidades, viendo cómo la cifra se multiplica o divide en una escalera animada. Después arrastra el número correcto a la puerta. Si acierta, Reglita salta la puerta y la escalera se ilumina. Si se equivoca, la escalera muestra el camino correcto y puede intentarlo de nuevo sin penalización.

**Dinámica:**
- Cada tramo del patio es una estación distinta: tienda, huerto, biblioteca. La variedad viene de las escenas, no de cambiar la regla.
- Al final de cada tramo, Reglita crece un poco y se consigue un sticker del patio.
- En el juego impreso, la misma escalera se usa como tablero: el niño marca la respuesta en el espacio de cada puerta.

**Criterios que evalúa:** identificar unidades (C1), múltiplos y submúltiplos (C2), conversiones ×10 y ÷10 (C3), resolver problemas de longitud (C4).

**Ritmo:** 3 niveles de dificultad (fácil: un salto; medio: dos saltos o cambio de dirección; avanzado: escalera completa y cantidades mayores). Total 8 a 12 minutos, sin límite de tiempo por pregunta.

## 5. Juego N3 · Pendiente

Se diseña cuando lleguen las sesiones de 5.º y 6.º. Como referencia, una sesión de CyT sobre prevención de enfermedades (de 3.º en `nivel-4`) permitiría una «mochila del cuidador» de decisiones. Eso se decidirá con la sesión de N3, no antes.

## 6. Características comunes a todos los juegos

**Sin lectura obligatoria.** Cada juego empieza con una demostración animada de 3 segundos. El texto aparece solo como apoyo, con los límites de palabras del nivel (N1: 8; N2: 15; N3: 25).

**Retroalimentación con consecuencias, no con castigos.** El acierto hace algo visible (la carga sube, Reglita salta, el cliente baila). El error muestra la consecuencia real y permite volver a intentar. No hay texto de error ni sonido de fracaso.

**Recompensas que el niño ve.** Estrellas, stickers y un personaje que crece. No hay puntajes numéricos ni tablas de posiciones visibles.

**Controles simples.** Arrastrar, tocar y mantener. Botones de al menos 44 px. Funciona con un dedo en celular de gama baja.

**Duración.** Entre 8 y 12 minutos por juego. Cada nivel de dificultad tiene 3 a 4 rondas de unos 60 a 90 segundos.

**Accesibilidad.** Colores acompañados de forma e ícono. Sonido opcional y subtítulos en los audios.

**Diferencia entre modos.** La activación tiene una meta colectiva y una pantalla grande que todos ven. El complemento es individual, funciona sin conexión y guarda el progreso en el dispositivo.

**Personajes originales.** Reglita es la guía de N2. Los personajes de N1 y N3 se crean como parte de sus juegos, sin usar personajes de otras obras.

## 7. Consecuencias para el sistema

Estas mecánicas exigen cambios que ya están previstos en el plan, pero que hay que confirmar:

| Cambio | Motivo |
|---|---|
| Reemplazado: `trivia` por `tienda` (N1) en el esquema GameSpec | Los ítems de N1 son arrastres y conteos, no opciones. |
| Reemplazado: `recorrido` por `carrera` (N2) | La carrera usa botones de operación y arrastre, y el juego impreso tiene tablero. |
| Agregar a `packages/assets/catalogo.json` productos de tienda, estanterías, camión, puertas y tramos del patio | Las escenas necesitan esos recursos. |
| Motor de juego con dos interacciones: arrastrar y tocar, más la barra colectiva | Es el mínimo para todas las mecánicas propuestas. |
| Prompts de generación por mecánica (`tienda` y `carrera`) | El modelo debe producir la configuración de cada escena, no preguntas. |

## 8. Decisiones que necesito que confirmes

1. **N1:** ¿La tiendita es el juego de activación para 1.º y 2.º, con meta colectiva del camión?
2. **N2:** ¿La carrera de conversiones es el juego de complemento para 3.º y 4.º?
3. **Meta colectiva:** ¿Prefieres que la activación sea colectiva (recomendado) o individual?
4. **Duración:** ¿8 a 12 minutos está bien para el tiempo de clase y el tiempo en casa?
5. **Personajes:** ¿Aprueban a Reglita para N2 y creamos un personaje para N1?
6. **Sesiones de N3:** ¿Cuándo llegan las sesiones de 5.º y 6.º para diseñar su juego?
