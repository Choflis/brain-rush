# Reglita como compañera de juego

Objetivo: dar protagonismo y movimiento a la mascota original durante la partida. La Tiendita es la superficie principal; Carrera también mejora el tamaño y desplazamiento del personaje. Usar OpenDesign frontend-design y animate; conservar reglas, criterios, sonidos opcionales y controles existentes.

- [x] Pruebas previas de personaje visible y grande en móvil/escritorio, movimiento, reacción al acierto, pausa y movimiento reducido.
- [x] Compañera DOM en La Tiendita con imagen original, pasos articulados con capas CSS, mirada, saludo y estados de caminar/celebrar/ayudar. Área propia para no tapar fichas ni estantes.
- [x] Jerarquía y escenario de tienda más expresivos, productos legibles, progreso y celebraciones claras. Mantener mínimo táctil de 56 px y diez productos visibles.
- [x] Carrera: personaje mayor y recorrido animado entre unidades sin modificar conversiones, intentos ni eventos.
- [x] Verificar partida completa, pedidos, arrastre, teclado, pausa, móviles, preferencias de movimiento, tipos/build/tests y revisión. Publicar según autorización vigente.

Validación final: 34 pruebas de interfaz, 10 de navegador de La Tiendita (partida completa y horizontal), 66 de motor/GameSpec, tipos y build. Revisión independiente verificó corrección de horizontal y cancelación de movimiento al invertir conversiones rápidas. Sin cambios a configuración de despliegue.
