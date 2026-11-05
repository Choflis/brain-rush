/**
 * Plantillas de prompts oficiales de Brain Rush para extracción y generación con Mistral AI.
 * Exportadas en código para que sean 100% compatibles con Cloudflare Workers (sin fs.readFileSync en runtime).
 */

export const PLANTILLA_EXTRACCION_V2 = `# extraccion · v2

Eres un asistente que lee sesiones de aprendizaje de primaria (formato MINEDU de Perú) y extrae sus datos pedagógicos esenciales.

Devuelve **solo JSON válido**, sin texto antes ni después, con esta estructura exacta:

\`\`\`json
{
  "titulo": "string",
  "grado": 1,
  "area": "string",
  "competencia": "string",
  "capacidad": "string o null",
  "desempenos": ["string"],
  "criterios": [{ "id": "C1", "texto": "string" }],
  "instrumento": "string o null",
  "proposito": "string o null",
  "momentos": { "inicio": "string o null", "desarrollo": "string o null", "cierre": "string o null" },
  "materiales": ["string"]
}
\`\`\`

Reglas pedagógicas:
1. No inventes datos. Si un campo no aparece explícito, usa null o [] en listas.
2. grado es un número entero de 1 a 6. Si dice "1.° grado" o "Primer grado", extrae 1.
3. Los criterios salen de la sección "Criterios de evaluación", o de "Evidencias de aprendizaje". Numéralos C1, C2, C3 en orden (máximo 6 criterios).
4. No incluyas nombres de profesores ni de colegios en el JSON.

## Sesión a procesar:

{{SESION}}`;

export const PLANTILLA_GENERACION_V1 = `# generacion · v2

Eres un diseñador de juegos educativos para niños de primaria en el Perú. Conviertes una sesión de aprendizaje en un juego **dinámico e interactivo**, donde el niño actúa dentro de una escena. Ningún juego es una secuencia de preguntas con opciones.

## Entrada

- **Sesión confirmada (JSON):**

\`\`\`json
{{SESION_JSON}}
\`\`\`

- **Nivel:** {{NIVEL}} (grados {{GRADOS}}).
- **Tipo de juego:** {{TIPO}}.
- **Mecánica:** {{MECANICA}}.
- **Duración objetivo:** {{DURACION}} minutos.
- **Recursos disponibles (\`assets\`):** solo puedes usar estos identificadores:

\`\`\`json
{{ASSETS}}
\`\`\`

## Mecánicas

- **\`tienda\`** (N1, activación): en una tiendita, el niño arrastra productos a su estantería (\`accion: "clasificar"\`), o lleva a la bolsa la cantidad que pide un cliente (\`accion: "pedido"\`). Los productos y estanterías salen de la sesión. Si el tipo es \`activacion\`, incluye \`meta: { "tipo": "camion", "objetivo": N }\`, con N entre 5 y 15: el camión se llena entre todos los alumnos.
- **\`carrera\`** (N2, complemento): Reglita corre por el patio y cada puerta muestra una medida. El niño usa los botones ×10 y ÷10 según los pasos entre unidades y arrastra el resultado a la puerta. Las medidas y las unidades salen de la sesión.

## Qué devolver

Devuelve **solo JSON válido** (sin texto antes ni después) con la forma de la mecánica indicada. Ejemplo de la mecánica \`{{MECANICA}}\`:

{{EJEMPLO}}

## Reglas

1. **Tres niveles de dificultad** exactos: \`facil\`, \`medio\` y \`avanzado\`. Cada uno con **al menos 3 ítems**.
2. Cada ítem tiene \`criterio\`, que debe ser uno de los \`id\` de \`criterios\` de la sesión. Usa todos los criterios que la mecánica pueda evaluar.
3. Usa **solo** identificadores de \`assets\` para imágenes, personaje, escenario, estanterías, productos, animaciones y tutorial. No inventes ids.
4. **Reglita (\`personaje-reglita\`) aparece en todos los juegos.**
5. Cada texto de pantalla tiene como máximo **{{LIMITE}} palabras**.
6. El contenido sale **solo de la sesión**. No agregues datos externos ni personas reales.
7. Lenguaje claro, respetuoso e inclusivo.
8. \`retro.ok\` es \`estrella\` o \`aplauso\`. \`retro.error\` es siempre \`pista\`.
9. Dificultad creciente: \`facil\` con pocos elementos o un solo paso; \`medio\` con más elementos; \`avanzado\` con cantidades mayores.

### Reglas para \`tienda\`
- Cada ítem tiene entre 2 y 3 \`estanterias\`, y entre 4 y 10 \`productos\`. Cada producto tiene \`categoria\`, que debe ser el \`id\` de una estantería.
- \`accion: "clasificar"\`: no lleva \`pedido\`.
- \`accion: "pedido"\`: lleva \`pedido\` con \`categoria\` y \`cantidad\` (entre 1 y 10). Lleva \`consigna\` visual.
- Cada estantería del mismo ítem usa un asset **distinto**.

### Reglas para \`carrera\`
- Cada ítem tiene \`cantidad\`, \`desde\` y \`hasta\` (unidades: km, hm, dam, m, dm, cm, mm), y \`opciones\` de 3 o 4 valores distintos.
- La opción correcta es exactamente \`cantidad × 10^k\` o \`cantidad ÷ 10^k\`.
- \`enunciado\` lleva un asset de la puerta o del objeto.`;

export const EJEMPLO_TIENDA_JSON = `{
  "specVersion": "1.0",
  "titulo": "La tiendita del aula",
  "tipo": "activacion",
  "nivel": "N1",
  "grados": [1, 2],
  "duracionMin": 10,
  "mecanica": "tienda",
  "origen": { "sesion": "sesion-1", "grado": 1, "area": "Matemática", "competencia": "Resuelve problemas de cantidad" },
  "criterios": [{ "id": "C1", "texto": "Organiza productos según su categoría" }],
  "personaje": { "id": "personaje-reglita", "nombre": "Reglita" },
  "escenario": { "id": "escenario-tiendita", "tema": "tienda" },
  "tutorial": { "animacion": "anim-tutorial-tienda" },
  "meta": { "tipo": "camion", "objetivo": 10 },
  "niveles": [
    {
      "dificultad": "facil",
      "items": [
        {
          "id": "f1",
          "criterio": "C1",
          "accion": "clasificar",
          "estanterias": [
            { "id": "bebidas", "asset": "estanteria-bebidas" },
            { "id": "galletas", "asset": "estanteria-galletas" }
          ],
          "productos": [
            { "id": "p1", "asset": "producto-gaseosa", "categoria": "bebidas" },
            { "id": "p2", "asset": "producto-galleta", "categoria": "galletas" },
            { "id": "p3", "asset": "producto-agua", "categoria": "bebidas" },
            { "id": "p4", "asset": "producto-galleta", "categoria": "galletas" }
          ],
          "retro": { "ok": "estrella", "error": "pista" }
        },
        {
          "id": "f2",
          "criterio": "C1",
          "accion": "pedido",
          "consigna": { "asset": "producto-agua", "texto": "2" },
          "estanterias": [
            { "id": "bebidas", "asset": "estanteria-bebidas" },
            { "id": "galletas", "asset": "estanteria-galletas" }
          ],
          "productos": [
            { "id": "p1", "asset": "producto-gaseosa", "categoria": "bebidas" },
            { "id": "p2", "asset": "producto-agua", "categoria": "bebidas" },
            { "id": "p3", "asset": "producto-galleta", "categoria": "galletas" },
            { "id": "p4", "asset": "producto-galleta", "categoria": "galletas" }
          ],
          "pedido": { "categoria": "bebidas", "cantidad": 2 },
          "retro": { "ok": "aplauso", "error": "pista" }
        },
        {
          "id": "f3",
          "criterio": "C1",
          "accion": "clasificar",
          "estanterias": [
            { "id": "bebidas", "asset": "estanteria-bebidas" },
            { "id": "galletas", "asset": "estanteria-galletas" }
          ],
          "productos": [
            { "id": "p5", "asset": "producto-leche", "categoria": "bebidas" },
            { "id": "p6", "asset": "producto-galleta", "categoria": "galletas" },
            { "id": "p7", "asset": "producto-jugo", "categoria": "bebidas" },
            { "id": "p8", "asset": "producto-galleta", "categoria": "galletas" }
          ],
          "retro": { "ok": "estrella", "error": "pista" }
        }
      ]
    },
    {
      "dificultad": "medio",
      "items": [
        {
          "id": "m1",
          "criterio": "C1",
          "accion": "clasificar",
          "estanterias": [
            { "id": "aguas", "asset": "estanteria-aguas" },
            { "id": "jugos", "asset": "estanteria-jugos" }
          ],
          "productos": [
            { "id": "p9", "asset": "producto-agua", "categoria": "aguas" },
            { "id": "p10", "asset": "producto-jugo", "categoria": "jugos" },
            { "id": "p11", "asset": "producto-agua", "categoria": "aguas" },
            { "id": "p12", "asset": "producto-jugo", "categoria": "jugos" }
          ],
          "retro": { "ok": "estrella", "error": "pista" }
        },
        {
          "id": "m2",
          "criterio": "C1",
          "accion": "pedido",
          "consigna": { "asset": "producto-jugo", "texto": "3" },
          "estanterias": [
            { "id": "aguas", "asset": "estanteria-aguas" },
            { "id": "jugos", "asset": "estanteria-jugos" }
          ],
          "productos": [
            { "id": "p13", "asset": "producto-jugo", "categoria": "jugos" },
            { "id": "p14", "asset": "producto-jugo", "categoria": "jugos" },
            { "id": "p15", "asset": "producto-jugo", "categoria": "jugos" },
            { "id": "p16", "asset": "producto-agua", "categoria": "aguas" }
          ],
          "pedido": { "categoria": "jugos", "cantidad": 3 },
          "retro": { "ok": "aplauso", "error": "pista" }
        },
        {
          "id": "m3",
          "criterio": "C1",
          "accion": "clasificar",
          "estanterias": [
            { "id": "aguas", "asset": "estanteria-aguas" },
            { "id": "jugos", "asset": "estanteria-jugos" }
          ],
          "productos": [
            { "id": "p17", "asset": "producto-agua", "categoria": "aguas" },
            { "id": "p18", "asset": "producto-jugo", "categoria": "jugos" },
            { "id": "p19", "asset": "producto-agua", "categoria": "aguas" },
            { "id": "p20", "asset": "producto-jugo", "categoria": "jugos" }
          ],
          "retro": { "ok": "estrella", "error": "pista" }
        }
      ]
    },
    {
      "dificultad": "avanzado",
      "items": [
        {
          "id": "a1",
          "criterio": "C1",
          "accion": "clasificar",
          "estanterias": [
            { "id": "gaseosas", "asset": "estanteria-gaseosas" },
            { "id": "aguas", "asset": "estanteria-aguas" },
            { "id": "jugos", "asset": "estanteria-jugos" }
          ],
          "productos": [
            { "id": "p21", "asset": "producto-gaseosa", "categoria": "gaseosas" },
            { "id": "p22", "asset": "producto-agua", "categoria": "aguas" },
            { "id": "p23", "asset": "producto-jugo", "categoria": "jugos" },
            { "id": "p24", "asset": "producto-leche", "categoria": "aguas" },
            { "id": "p25", "asset": "producto-gaseosa", "categoria": "gaseosas" },
            { "id": "p26", "asset": "producto-jugo", "categoria": "jugos" }
          ],
          "retro": { "ok": "estrella", "error": "pista" }
        },
        {
          "id": "a2",
          "criterio": "C1",
          "accion": "pedido",
          "consigna": { "asset": "producto-leche", "texto": "2" },
          "estanterias": [
            { "id": "aguas", "asset": "estanteria-aguas" },
            { "id": "jugos", "asset": "estanteria-jugos" }
          ],
          "productos": [
            { "id": "p27", "asset": "producto-leche", "categoria": "aguas" },
            { "id": "p28", "asset": "producto-leche", "categoria": "aguas" },
            { "id": "p29", "asset": "producto-jugo", "categoria": "jugos" },
            { "id": "p30", "asset": "producto-jugo", "categoria": "jugos" }
          ],
          "pedido": { "categoria": "aguas", "cantidad": 2 },
          "retro": { "ok": "aplauso", "error": "pista" }
        },
        {
          "id": "a3",
          "criterio": "C1",
          "accion": "clasificar",
          "estanterias": [
            { "id": "gaseosas", "asset": "estanteria-gaseosas" },
            { "id": "aguas", "asset": "estanteria-aguas" }
          ],
          "productos": [
            { "id": "p31", "asset": "producto-gaseosa", "categoria": "gaseosas" },
            { "id": "p32", "asset": "producto-agua", "categoria": "aguas" },
            { "id": "p33", "asset": "producto-gaseosa", "categoria": "gaseosas" },
            { "id": "p34", "asset": "producto-agua", "categoria": "aguas" }
          ],
          "retro": { "ok": "estrella", "error": "pista" }
        }
      ]
    }
  ],
  "evaluacion": { "minimoLogro": 0.6 }
}`;

export const EJEMPLO_CARRERA_JSON = `{
  "specVersion": "1.0",
  "titulo": "Carrera del patio",
  "tipo": "complemento",
  "nivel": "N2",
  "grados": [3, 4],
  "duracionMin": 8,
  "mecanica": "carrera",
  "origen": { "sesion": "sesion-2", "grado": 3, "area": "Matemática", "competencia": "Resuelve problemas de forma, movimiento y localización" },
  "criterios": [{ "id": "C3", "texto": "Realiza conversiones usando ×10 y ÷10" }],
  "personaje": { "id": "personaje-reglita", "nombre": "Reglita" },
  "escenario": { "id": "escenario-patio", "tema": "patio" },
  "tutorial": { "animacion": "anim-tutorial-escalera" },
  "niveles": [
    {
      "dificultad": "facil",
      "items": [
        {
          "id": "f1",
          "criterio": "C3",
          "enunciado": { "asset": "puerta-guardian" },
          "cantidad": 2,
          "desde": "m",
          "hasta": "dm",
          "opciones": [20, 2, 0.2],
          "correcta": 0,
          "retro": { "ok": "estrella", "error": "pista" }
        },
        {
          "id": "f2",
          "criterio": "C3",
          "enunciado": { "asset": "objeto-lapiz" },
          "cantidad": 5,
          "desde": "cm",
          "hasta": "mm",
          "opciones": [50, 5, 0.5],
          "correcta": 0,
          "retro": { "ok": "estrella", "error": "pista" }
        },
        {
          "id": "f3",
          "criterio": "C3",
          "enunciado": { "asset": "objeto-cuerda" },
          "cantidad": 3,
          "desde": "m",
          "hasta": "cm",
          "opciones": [300, 30, 3],
          "correcta": 0,
          "retro": { "ok": "estrella", "error": "pista" }
        }
      ]
    },
    {
      "dificultad": "medio",
      "items": [
        {
          "id": "m1",
          "criterio": "C3",
          "enunciado": { "asset": "objeto-mesa" },
          "cantidad": 12,
          "desde": "dm",
          "hasta": "cm",
          "opciones": [120, 1.2, 12],
          "correcta": 0,
          "retro": { "ok": "estrella", "error": "pista" }
        },
        {
          "id": "m2",
          "criterio": "C3",
          "enunciado": { "asset": "objeto-cuaderno" },
          "cantidad": 4,
          "desde": "m",
          "hasta": "mm",
          "opciones": [4000, 400, 40],
          "correcta": 0,
          "retro": { "ok": "estrella", "error": "pista" }
        },
        {
          "id": "m3",
          "criterio": "C3",
          "enunciado": { "asset": "objeto-pizarra" },
          "cantidad": 80,
          "desde": "cm",
          "hasta": "dm",
          "opciones": [8, 800, 0.8],
          "correcta": 0,
          "retro": { "ok": "estrella", "error": "pista" }
        }
      ]
    },
    {
      "dificultad": "avanzado",
      "items": [
        {
          "id": "a1",
          "criterio": "C3",
          "enunciado": { "asset": "puerta-guardian" },
          "cantidad": 2.5,
          "desde": "km",
          "hasta": "m",
          "opciones": [2500, 250, 25],
          "correcta": 0,
          "retro": { "ok": "estrella", "error": "pista" }
        },
        {
          "id": "a2",
          "criterio": "C3",
          "enunciado": { "asset": "objeto-cuerda" },
          "cantidad": 1500,
          "desde": "m",
          "hasta": "km",
          "opciones": [1.5, 15, 150],
          "correcta": 0,
          "retro": { "ok": "estrella", "error": "pista" }
        },
        {
          "id": "a3",
          "criterio": "C3",
          "enunciado": { "asset": "objeto-mesa" },
          "cantidad": 0.4,
          "desde": "m",
          "hasta": "mm",
          "opciones": [400, 40, 4],
          "correcta": 0,
          "retro": { "ok": "estrella", "error": "pista" }
        }
      ]
    }
  ],
  "evaluacion": { "minimoLogro": 0.6 }
}`;
