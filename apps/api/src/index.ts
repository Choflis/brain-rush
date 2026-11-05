// API del motor de juegos: auth, ingesta de sesiones, generación y versionado de juegos,
// resultados, métricas y créditos. Pendiente: rutas con Hono.
export default {
  async fetch(): Promise<Response> {
    return new Response("BRAIN RUSH API · pendiente de implementar", { status: 501 });
  },
} satisfies ExportedHandler;
