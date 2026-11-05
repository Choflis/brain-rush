# packages/prompts

Prompts versionados para el modelo de IA:

- `extraccion/`: sesión de aprendizaje → datos estructurados (competencia, desempeños, criterios).
- `generacion/`: sesión confirmada → GameSpec en JSON.
- `iteracion/`: GameSpec actual + pedido del docente → GameSpec modificado.

Cada prompt tiene un número de versión. Los cambios se registran en `game_versions` para poder reproducir un juego.
