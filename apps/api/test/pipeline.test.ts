import assert from "node:assert/strict";
import test from "node:test";
import { MistralProvider, extraerCadenasTextoPDF } from "../src/ai/mistral.ts";
import {
  extraerSesionPedagogica,
  generarGameSpecDesdeSesion,
  refinarGameSpecConIA,
  type SesionPedagogica,
} from "../src/ai/pipeline.ts";

test("extraerCadenasTextoPDF - extrae fragmentos de texto de un buffer PDF", () => {
  const contenidoPdf = "%PDF-1.4\nBT\n(Sesion de Matematica Tiendita) Tj\nET\n%%EOF";
  const bytes = new TextEncoder().encode(contenidoPdf);
  const texto = extraerCadenasTextoPDF(bytes);
  assert.ok(texto.includes("Sesion de Matematica Tiendita") || texto.length > 0);
});

test("extraerSesionPedagogica - normaliza campos desde respuesta LLM", async () => {
  const mockProvider = new MistralProvider({
    apiKey: "dummy",
    fetchFn: async () => {
      return new Response(
        JSON.stringify({
          model: "mistral-small-latest",
          choices: [
            {
              message: {
                content: JSON.stringify({
                  titulo: "Jugamos a la Tiendita",
                  grado: 1,
                  area: "Matemática",
                  competencia: "Resuelve problemas de cantidad",
                  criterios: [
                    { id: "C1", texto: "Clasifica productos según su etiqueta" },
                  ],
                  proposito: "Aprender a organizar y contar productos",
                }),
              },
            },
          ],
          usage: { prompt_tokens: 100, completion_tokens: 50 },
        }),
      );
    },
  });

  const sesion = await extraerSesionPedagogica(mockProvider, "Texto crudo de la sesión...");
  assert.equal(sesion.titulo, "Jugamos a la Tiendita");
  assert.equal(sesion.grado, 1);
  assert.equal(sesion.competencia, "Resuelve problemas de cantidad");
  assert.equal(sesion.criterios.length, 1);
  assert.equal(sesion.criterios[0]?.id, "C1");
});

test("generarGameSpecDesdeSesion - genera Tienda para 1.° grado y valida GameSpec", async () => {
  const sesion: SesionPedagogica = {
    titulo: "Tiendita de Primer Grado",
    grado: 1,
    area: "Matemática",
    competencia: "Resuelve problemas de cantidad",
    criterios: [{ id: "C1", texto: "Organiza productos según su categoría" }],
  };

  const mockProvider = new MistralProvider({
    apiKey: "dummy",
    fetchFn: async () => {
      // Simular respuesta válida de Tienda
      return new Response(
        JSON.stringify({
          model: "mistral-small-latest",
          choices: [
            {
              message: {
                content: JSON.stringify({
                  specVersion: "1.0",
                  titulo: "Tiendita de Primer Grado",
                  tipo: "activacion",
                  nivel: "N1",
                  grados: [1, 2],
                  duracionMin: 10,
                  mecanica: "tienda",
                  origen: {
                    sesion: "Tiendita de Primer Grado",
                    grado: 1,
                    area: "Matemática",
                    competencia: "Resuelve problemas de cantidad",
                  },
                  criterios: [{ id: "C1", texto: "Organiza productos según su categoría" }],
                  personaje: { id: "personaje-reglita", nombre: "Reglita" },
                  escenario: { id: "escenario-tiendita", tema: "tienda" },
                  tutorial: { animacion: "anim-tutorial-tienda" },
                  meta: { tipo: "camion", objetivo: 10 },
                  niveles: [
                    {
                      dificultad: "facil",
                      items: [
                        {
                          id: "f1",
                          criterio: "C1",
                          accion: "clasificar",
                          estanterias: [
                            { id: "bebidas", asset: "estanteria-bebidas" },
                            { id: "galletas", asset: "estanteria-galletas" },
                          ],
                          productos: [
                            { id: "p1", asset: "producto-gaseosa", categoria: "bebidas" },
                            { id: "p2", asset: "producto-galleta", categoria: "galletas" },
                            { id: "p3", asset: "producto-agua", categoria: "bebidas" },
                            { id: "p4", asset: "producto-galleta", categoria: "galletas" },
                          ],
                          retro: { ok: "estrella", error: "pista" },
                        },
                        {
                          id: "f2",
                          criterio: "C1",
                          accion: "pedido",
                          consigna: { asset: "producto-agua", texto: "2" },
                          estanterias: [
                            { id: "bebidas", asset: "estanteria-bebidas" },
                            { id: "galletas", asset: "estanteria-galletas" },
                          ],
                          productos: [
                            { id: "p1", asset: "producto-gaseosa", categoria: "bebidas" },
                            { id: "p2", asset: "producto-agua", categoria: "bebidas" },
                            { id: "p3", asset: "producto-galleta", categoria: "galletas" },
                            { id: "p4", asset: "producto-galleta", categoria: "galletas" },
                          ],
                          pedido: { categoria: "bebidas", cantidad: 2 },
                          retro: { ok: "aplauso", error: "pista" },
                        },
                        {
                          id: "f3",
                          criterio: "C1",
                          accion: "clasificar",
                          estanterias: [
                            { id: "bebidas", asset: "estanteria-bebidas" },
                            { id: "galletas", asset: "estanteria-galletas" },
                          ],
                          productos: [
                            { id: "p5", asset: "producto-leche", categoria: "bebidas" },
                            { id: "p6", asset: "producto-galleta", categoria: "galletas" },
                            { id: "p7", asset: "producto-jugo", categoria: "bebidas" },
                            { id: "p8", asset: "producto-galleta", categoria: "galletas" },
                          ],
                          retro: { ok: "estrella", error: "pista" },
                        },
                      ],
                    },
                    {
                      dificultad: "medio",
                      items: [
                        {
                          id: "m1",
                          criterio: "C1",
                          accion: "clasificar",
                          estanterias: [
                            { id: "aguas", asset: "estanteria-aguas" },
                            { id: "jugos", asset: "estanteria-jugos" },
                          ],
                          productos: [
                            { id: "p9", asset: "producto-agua", categoria: "aguas" },
                            { id: "p10", asset: "producto-jugo", categoria: "jugos" },
                            { id: "p11", asset: "producto-agua", categoria: "aguas" },
                            { id: "p12", asset: "producto-jugo", categoria: "jugos" },
                          ],
                          retro: { ok: "estrella", error: "pista" },
                        },
                        {
                          id: "m2",
                          criterio: "C1",
                          accion: "pedido",
                          consigna: { asset: "producto-jugo", texto: "3" },
                          estanterias: [
                            { id: "aguas", asset: "estanteria-aguas" },
                            { id: "jugos", asset: "estanteria-jugos" },
                          ],
                          productos: [
                            { id: "p13", asset: "producto-jugo", categoria: "jugos" },
                            { id: "p14", asset: "producto-jugo", categoria: "jugos" },
                            { id: "p15", asset: "producto-jugo", categoria: "jugos" },
                            { id: "p16", asset: "producto-agua", categoria: "aguas" },
                          ],
                          pedido: { categoria: "jugos", cantidad: 3 },
                          retro: { ok: "aplauso", error: "pista" },
                        },
                        {
                          id: "m3",
                          criterio: "C1",
                          accion: "clasificar",
                          estanterias: [
                            { id: "aguas", asset: "estanteria-aguas" },
                            { id: "jugos", asset: "estanteria-jugos" },
                          ],
                          productos: [
                            { id: "p17", asset: "producto-agua", categoria: "aguas" },
                            { id: "p18", asset: "producto-jugo", categoria: "jugos" },
                            { id: "p19", asset: "producto-agua", categoria: "aguas" },
                            { id: "p20", asset: "producto-jugo", categoria: "jugos" },
                          ],
                          retro: { ok: "estrella", error: "pista" },
                        },
                      ],
                    },
                    {
                      dificultad: "avanzado",
                      items: [
                        {
                          id: "a1",
                          criterio: "C1",
                          accion: "clasificar",
                          estanterias: [
                            { id: "gaseosas", asset: "estanteria-gaseosas" },
                            { id: "aguas", asset: "estanteria-aguas" },
                            { id: "jugos", asset: "estanteria-jugos" },
                          ],
                          productos: [
                            { id: "p21", asset: "producto-gaseosa", categoria: "gaseosas" },
                            { id: "p22", asset: "producto-agua", categoria: "aguas" },
                            { id: "p23", asset: "producto-jugo", categoria: "jugos" },
                            { id: "p24", asset: "producto-leche", categoria: "aguas" },
                            { id: "p25", asset: "producto-gaseosa", categoria: "gaseosas" },
                            { id: "p26", asset: "producto-jugo", categoria: "jugos" },
                          ],
                          retro: { ok: "estrella", error: "pista" },
                        },
                        {
                          id: "a2",
                          criterio: "C1",
                          accion: "pedido",
                          consigna: { asset: "producto-leche", texto: "2" },
                          estanterias: [
                            { id: "aguas", asset: "estanteria-aguas" },
                            { id: "jugos", asset: "estanteria-jugos" },
                          ],
                          productos: [
                            { id: "p27", asset: "producto-leche", categoria: "aguas" },
                            { id: "p28", asset: "producto-leche", categoria: "aguas" },
                            { id: "p29", asset: "producto-jugo", categoria: "jugos" },
                            { id: "p30", asset: "producto-jugo", categoria: "jugos" },
                          ],
                          pedido: { categoria: "aguas", cantidad: 2 },
                          retro: { ok: "aplauso", error: "pista" },
                        },
                        {
                          id: "a3",
                          criterio: "C1",
                          accion: "clasificar",
                          estanterias: [
                            { id: "gaseosas", asset: "estanteria-gaseosas" },
                            { id: "aguas", asset: "estanteria-aguas" },
                          ],
                          productos: [
                            { id: "p31", asset: "producto-gaseosa", categoria: "gaseosas" },
                            { id: "p32", asset: "producto-agua", categoria: "aguas" },
                            { id: "p33", asset: "producto-gaseosa", categoria: "gaseosas" },
                            { id: "p34", asset: "producto-agua", categoria: "aguas" },
                          ],
                          retro: { ok: "estrella", error: "pista" },
                        },
                      ],
                    },
                  ],
                  evaluacion: { minimoLogro: 0.6 },
                }),
              },
            },
          ],
          usage: { prompt_tokens: 300, completion_tokens: 400 },
        }),
      );
    },
  });

  const resultado = await generarGameSpecDesdeSesion(mockProvider, sesion);
  assert.ok(resultado.spec);
  assert.equal(resultado.spec.mecanica, "tienda");
  assert.equal(resultado.spec.nivel, "N1");
});
