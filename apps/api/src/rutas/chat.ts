import type { Hono } from "hono";
import type { AppEnv } from "../tipos.ts";
import { MistralProvider, type MensajeChat } from "../ai/mistral.ts";

const PROMPT_SISTEMA_REGLITA = `Eres Reglita 📏, la mascota y copiloto pedagógica inteligente de Brain Rush, diseñada para acompañar a docentes de primaria en el Perú.

Tu personalidad:
- Eres cálida, entusiasta, cercana y muy pedagógica.
- Conoces en profundidad el Currículo Nacional de la Educación Básica (CNEB), las competencias, capacidades, estándares de aprendizaje y criterios de evaluación.
- Tu misión es ayudar al maestro a:
  1. Sugerir dinámicas de activación de clase (15 minutos con el proyector en la pizarra para despertar atención sin frustración).
  2. Ajustar la dificultad de los videojuegos (velocidad, andamiaje con pistas visuales, cantidades, distractores matemáticos).
  3. Brindar pautas de refuerzo formativo para estudiantes que requieren apoyo (logro menor al 60%).
  4. Formular preguntas metacognitivas potentes para el cierre de la sesión.

Reglas de respuesta:
- Sé concisa y directa al grano: los profesores de aula tienen poco tiempo entre clases.
- Respuestas de 2 a 4 párrafos cortos o listas con viñetas claras.
- Usa tono motivador pero formalmente pedagógico ("¡Hola, profe!", "Excelente enfoque para tu sesión...").`;

export function rutasChat(app: Hono<AppEnv>) {
  app.post("/api/chat", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as {
      mensaje?: string;
      historial?: Array<{ remitente: string; texto: string }>;
      contexto?: {
        juegoId?: string;
        sesionId?: string;
        codigo?: string;
        tema?: string;
      };
    };

    const mensaje = body.mensaje?.trim();
    if (!mensaje) {
      return c.json({ error: { mensaje: "El mensaje no puede estar vacío." } }, 400);
    }

    const apiKey = c.env.MISTRAL_API_KEY;

    // Si hay API Key de Mistral, realizamos la llamada al modelo LLM real
    if (apiKey) {
      try {
        const provider = new MistralProvider({ apiKey });

        const mensajesLLM: MensajeChat[] = [
          { role: "system", content: PROMPT_SISTEMA_REGLITA },
        ];

        // Inyectar contexto si existe
        if (body.contexto) {
          mensajesLLM.push({
            role: "system",
            content: `Contexto actual del docente en pantalla: ${JSON.stringify(body.contexto)}`,
          });
        }

        // Incorporar los últimos mensajes del historial
        if (Array.isArray(body.historial)) {
          for (const m of body.historial.slice(-6)) {
            mensajesLLM.push({
              role: m.remitente === "docente" ? "user" : "assistant",
              content: m.texto,
            });
          }
        }

        mensajesLLM.push({ role: "user", content: mensaje });

        const resultado = await provider.chat(mensajesLLM);
        return c.json({
          ok: true,
          respuesta: resultado.respuesta,
          modelo: resultado.modelo,
        });
      } catch (e) {
        // En caso de fallo transitorio del servicio de IA, continuar al fallback pedagógico
      }
    }

    // Fallback pedagógico enriquecido (funciona offline o sin API key)
    const lower = mensaje.toLowerCase();
    let respuesta = "";

    if (lower.includes("inicio") || lower.includes("proyección") || lower.includes("activación")) {
      respuesta =
        "Para los primeros 15 minutos, proyecta «La Tiendita» en la pizarra. Pide a 2 estudiantes voluntarios que salgan a la pantalla y al resto que indique con las manos cuántos productos faltan para llenar el camión. ¡Despierta la atención de inmediato y crea espíritu de equipo!";
    } else if (lower.includes("cálculo") || lower.includes("sumar") || lower.includes("números")) {
      respuesta =
        "Te sugiero la dinámica «Carrera relámpago»: antes de iniciar el juego en tablets, lanza un reto oral en la pizarra como: '¿Cuántos centímetros hay en 2 metros?'. El estudiante que responda elige la velocidad del corredor en el simulador.";
    } else if (lower.includes("ritmo") || lower.includes("apoyo") || lower.includes("refuerzo")) {
      respuesta =
        "En juegos individuales de complemento, activa 'Pistas visuales automáticas' tras el primer error. Así el estudiante no se frustra y asocia la cantidad con colores antes de pasar al siguiente nivel.";
    } else if (lower.includes("cierre") || lower.includes("pregunt")) {
      respuesta =
        "Una excelente pregunta metacognitiva de cierre: «¿Qué estrategia usaron para no equivocarse al clasificar los productos? ¿Qué aprendimos que podamos usar en el mercado de verdad?». Con 3 participaciones cierras la sesión con broche de oro.";
    } else {
      respuesta =
        `¡Excelente consulta, profe! Para «${mensaje}», te recomiendo vincularlo directamente con la evidencia de aprendizaje de tu sesión. Puedes usar la actividad en proyector como motivación inicial y dejar el juego interactivo para afianzar en parejas.`;
    }

    return c.json({
      ok: true,
      respuesta,
      modelo: "heuristico-pedagogico",
    });
  });
}
