# Ajuste curricular de La tiendita · 1.º de primaria

## Propósito y alcance
Actividad de activación de Matemática para primero de primaria, basada en la sesión extraída fixtures/sesiones/n1-tienda.json. No se presenta como evaluación completa de la competencia ni como juego para toda primaria.

La competencia es Resuelve problemas de cantidad. La capacidad declarada por la sesión es Comunica su comprensión sobre los números y las operaciones. Sus criterios son C1 clasificar productos y C2 representar cantidades hasta diez. El programa local está fuera del repo, en programa-nivel-primaria-ebr.pdf; sus páginas 138/140 sirvieron de contraste, pero el archivo lleva marca En consulta y no se afirma que sea la versión vigente adoptada por el colegio.

## Qué cambió
- Cada actividad requiere primero manipular los productos y después representar una cantidad mediante una etiqueta 0–10.
- En clasificación fácil/media se cuenta un subgrupo. En clasificación avanzada se cuenta el grupo total, que puede contener distintos subgrupos.
- En pedidos se representa la cantidad preparada. La bolsa muestra objetos colocados y no un contador ni huecos que entreguen la respuesta.
- La etiqueta incorrecta permite corregir sin avanzar ni perder vidas.
- La caja se carga después de completar la representación numérica.
- El banco conserva 12 actividades. El docente puede cerrar antes desde pausa y revisar evidencia parcial; no se impone un cronómetro ni se promete que todo el banco dure 5 minutos.

## Indicadores operativos derivados de la sesión
Por criterio: observaciones, primer intento sin pistas, observaciones con ayuda, correcciones y tiempo activo. Se conservan itemId y fase accion/numero para separar la tarea de manipulación de la representación simbólica.

C1 recibe las 6 clasificaciones. C2 puede recibir 6 pedidos y 12 etiquetas numéricas: 18 observaciones diferentes, no 18 juegos ni 18 estudiantes. El archivo exportado separa las fases y conserva los registros.

Los porcentajes y contadores son indicadores del software, no rúbricas oficiales del MINEDU. Resolver finalmente con pistas no se anuncia como dominio. Una ausencia de datos se muestra como Sin evidencia.

## Integración
El resumen docente y la exportación JSON funcionan localmente, sin nombres de menores. No hay envío al backend ni incorporación automática al panel general. El contrato original inicio/respuesta/fin se conserva; las evidencias adicionales usan brainrush:evidencia en el host local y se exportan con sus criterios. Una integración real requerirá acordar el contrato con U.

## Identidad visual
La landing es la autoridad: crema #fbf7ef, naranja #f26a3d, verde #1f7a6a, tinta #14201f y fuente Segoe UI/system-ui. La mascota y las interacciones animadas se conservan. El nuevo fondo cálido fue editado con ImageGen. La landing enlaza a la demo y el build estándar incluye index.html y tiendita.html para evitar un enlace roto al publicar.

## Verificación
27 pruebas puras verdes y 10 pruebas browser verdes. El caso específico de etiqueta corregida verifica que C2 no la cuente como primer intento; se comprobó también la etapa numérica en escritorio, móvil 390×844 y horizontal 844×390. Capturas representacion-desktop.png y representacion-mobile.png.
Prueba física en teléfono y validación pedagógica con docente/estudiantes siguen pendientes. No se ha demostrado mejora de aprendizaje con un estudio de usuarios.
