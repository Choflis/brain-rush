import {
  GameSpecSchema,
  GRADOS_POR_NIVEL,
  LIMITE_PALABRAS,
  UNIDADES,
  type GameSpec,
  type ItemCarrera,
  type ItemTienda,
  type Unidad,
} from "./schema.ts";

export type ResultadoValidacion =
  | { ok: true; spec: GameSpec }
  | { ok: false; errores: string[] };

export type OpcionesValidacion = {
  assets?: ReadonlySet<string>;
};

const EPSILON = 1e-9;

export function resultadoConversion(cantidad: number, desde: Unidad, hasta: Unidad): number {
  const k = UNIDADES.indexOf(hasta) - UNIDADES.indexOf(desde);
  return k >= 0 ? cantidad * 10 ** k : cantidad / 10 ** -k;
}

function contarPalabras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

type Recurso = { asset?: string; texto?: string };

function recursosDeItem(item: Record<string, unknown>): Recurso[] {
  const recursos: Recurso[] = [];
  for (const campo of ["pregunta", "enunciado", "consigna"]) {
    const r = item[campo] as Recurso | undefined;
    if (r) recursos.push(r);
  }
  if (Array.isArray(item.opciones)) {
    for (const o of item.opciones) if (o && typeof o === "object") recursos.push(o as Recurso);
  }
  return recursos;
}

export function validarGameSpec(input: unknown, opts: OpcionesValidacion = {}): ResultadoValidacion {
  const parsed = GameSpecSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errores: parsed.error.issues.map((i) => `${i.path.join(".") || "(raíz)"}: ${i.message}`),
    };
  }
  const spec = parsed.data;
  const errores: string[] = [];

  const permitidos = GRADOS_POR_NIVEL[spec.nivel] as readonly number[];
  if (!spec.grados.every((g) => permitidos.includes(g))) {
    errores.push(`grados: ${spec.grados.join(",")} no corresponden al nivel ${spec.nivel}`);
  }
  if (!permitidos.includes(spec.origen.grado)) {
    errores.push(`origen.grado: ${spec.origen.grado} no corresponde al nivel ${spec.nivel}`);
  }

  const criterioIds = new Set(spec.criterios.map((c) => c.id));
  const dificultades = new Set(spec.niveles.map((n) => n.dificultad));
  if (dificultades.size !== 3) errores.push("niveles: deben existir facil, medio y avanzado");

  if (spec.mecanica === "tienda" && spec.tipo === "activacion" && !spec.meta) {
    errores.push("meta: una activación de tienda necesita meta colectiva (camión)");
  }

  const limite = LIMITE_PALABRAS[spec.nivel];
  const revisarTexto = (ruta: string, texto: string) => {
    if (contarPalabras(texto) > limite) {
      errores.push(`${ruta}: ${contarPalabras(texto)} palabras, máximo ${limite} para ${spec.nivel}`);
    }
  };
  if (spec.tutorial.texto) revisarTexto("tutorial.texto", spec.tutorial.texto);

  const assetsUsados: [string, string][] = [
    ["personaje.id", spec.personaje.id],
    ["escenario.id", spec.escenario.id],
    ["tutorial.animacion", spec.tutorial.animacion],
  ];

  spec.niveles.forEach((nivel, ni) => {
    nivel.items.forEach((raw, ii) => {
      const ruta = `niveles[${ni}].items[${ii}]`;
      const item = raw as Record<string, unknown>;
      if (typeof item.criterio === "string" && !criterioIds.has(item.criterio)) {
        errores.push(`${ruta}.criterio: "${item.criterio}" no existe en criterios`);
      }
      for (const r of recursosDeItem(item)) {
        if (r.texto) revisarTexto(ruta, r.texto);
        if (r.asset) assetsUsados.push([`${ruta}.asset`, r.asset]);
      }

      if (spec.mecanica === "tienda") {
        const t = item as unknown as ItemTienda;
        const estanteriaIds = t.estanterias.map((e) => e.id);
        if (new Set(estanteriaIds).size !== estanteriaIds.length) {
          errores.push(`${ruta}: ids de estantería repetidos`);
        }
        t.estanterias.forEach((e) => assetsUsados.push([`${ruta}.estanterias.${e.id}`, e.asset]));
        const productoIds = t.productos.map((p) => p.id);
        if (new Set(productoIds).size !== productoIds.length) {
          errores.push(`${ruta}: ids de producto repetidos`);
        }
        for (const p of t.productos) {
          assetsUsados.push([`${ruta}.productos.${p.id}`, p.asset]);
          if (!estanteriaIds.includes(p.categoria)) {
            errores.push(`${ruta}.productos.${p.id}: categoría "${p.categoria}" no tiene estantería`);
          }
        }
        if (t.accion === "pedido") {
          if (!t.pedido) {
            errores.push(`${ruta}: accion pedido requiere pedido`);
          } else {
            const disponibles = t.productos.filter((p) => p.categoria === t.pedido!.categoria).length;
            if (!estanteriaIds.includes(t.pedido.categoria)) {
              errores.push(`${ruta}.pedido.categoria: "${t.pedido.categoria}" no tiene estantería`);
            } else if (t.pedido.cantidad > disponibles) {
              errores.push(
                `${ruta}.pedido: pide ${t.pedido.cantidad} de "${t.pedido.categoria}" pero hay ${disponibles} en juego`,
              );
            }
          }
        } else if (t.pedido) {
          errores.push(`${ruta}: accion clasificar no admite pedido`);
        }
        if (!t.consigna && t.accion === "pedido") {
          errores.push(`${ruta}: el pedido necesita consigna visual`);
        }
      }

      if (spec.mecanica === "carrera") {
        const c = item as unknown as ItemCarrera;
        if (c.desde === c.hasta) errores.push(`${ruta}: desde y hasta no pueden ser iguales`);
        const esperado = resultadoConversion(c.cantidad, c.desde, c.hasta);
        const marcada = c.opciones[c.correcta];
        if (marcada === undefined || Math.abs(marcada - esperado) > EPSILON) {
          errores.push(`${ruta}: la opción correcta es ${marcada} y debería ser ${esperado}`);
        }
        if (new Set(c.opciones).size !== c.opciones.length) {
          errores.push(`${ruta}: las opciones deben ser distintas`);
        }
      }
    });
  });

  if (opts.assets) {
    for (const [ruta, id] of assetsUsados) {
      if (!opts.assets.has(id)) errores.push(`${ruta}: asset "${id}" no está en la biblioteca`);
    }
  }

  return errores.length ? { ok: false, errores } : { ok: true, spec };
}
