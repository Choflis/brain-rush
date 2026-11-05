import {
  catalogoIds,
  resultadoConversion,
  validarGameSpec,
  type GameSpec,
  type Mecanica,
  type Nivel,
  type TipoJuego,
  type Unidad,
} from "@brain-rush/gamespec";
import type { SesionPedagogica } from "./pipeline.ts";

const ASSETS_ESTANTERIAS_VALIDOS = [
  "estanteria-bebidas",
  "estanteria-gaseosas",
  "estanteria-aguas",
  "estanteria-jugos",
  "estanteria-galletas",
];

const ASSETS_PRODUCTOS_VALIDOS = [
  "producto-gaseosa",
  "producto-jugo",
  "producto-agua",
  "producto-galleta",
  "producto-leche",
];

const ASSETS_CARRERA_VALIDOS = [
  "objeto-lapiz",
  "objeto-cuerda",
  "objeto-puerta",
  "objeto-mesa",
  "objeto-cuaderno",
  "objeto-pizarra",
  "puerta-guardian",
];

function truncarPalabras(texto: string, maxPalabras: number): string {
  const palabras = texto.trim().split(/\s+/).filter(Boolean);
  if (palabras.length <= maxPalabras) return texto;
  return palabras.slice(0, maxPalabras).join(" ");
}

export function autoRepararGameSpec(
  raw: unknown,
  sesion: SesionPedagogica,
  mecanicaDeseada: Mecanica,
  tipoDeseado: TipoJuego,
  nivelDeseado: Nivel,
): GameSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;

  const permitidosAssets = catalogoIds();
  const maxPalabras = nivelDeseado === "N1" ? 8 : nivelDeseado === "N2" ? 15 : 25;

  // 1. Campos base
  obj.specVersion = "1.0";
  obj.titulo =
    typeof obj.titulo === "string" && obj.titulo.trim()
      ? obj.titulo.trim().slice(0, 60)
      : `${sesion.titulo.slice(0, 40)} con Reglita`;
  obj.tipo = tipoDeseado;
  obj.mecanica = mecanicaDeseada;
  obj.nivel = nivelDeseado;
  obj.grados = nivelDeseado === "N1" ? [1, 2] : nivelDeseado === "N2" ? [3, 4] : [5, 6];
  obj.duracionMin =
    typeof obj.duracionMin === "number" && obj.duracionMin > 0 ? obj.duracionMin : 10;

  obj.personaje = { id: "personaje-reglita", nombre: "Reglita" };
  obj.escenario = {
    id: mecanicaDeseada === "tienda" ? "escenario-tiendita" : "escenario-patio",
    tema: mecanicaDeseada === "tienda" ? "tienda" : "patio",
  };
  obj.evaluacion = { minimoLogro: 0.6 };

  const tutTexto =
    typeof (obj.tutorial as any)?.texto === "string"
      ? truncarPalabras((obj.tutorial as any).texto, maxPalabras)
      : mecanicaDeseada === "tienda"
        ? "Arrastra cada producto a su estantería."
        : "Reglita corre por el patio. Convierte las medidas.";
  obj.tutorial = {
    animacion: mecanicaDeseada === "tienda" ? "anim-tutorial-tienda" : "anim-tutorial-escalera",
    texto: tutTexto,
  };

  obj.origen = {
    sesion: sesion.titulo,
    grado: sesion.grado,
    area: sesion.area,
    competencia: sesion.competencia,
  };

  const criterios = sesion.criterios.map((c) => ({ id: c.id, texto: c.texto }));
  obj.criterios = criterios;
  const criterioIds = new Set(criterios.map((c) => c.id));
  const primerCriterio = criterios[0]?.id || "C1";

  if (mecanicaDeseada === "tienda" && tipoDeseado === "activacion") {
    obj.meta = { tipo: "camion", objetivo: 10 };
  }

  // 2. Niveles de dificultad
  if (!Array.isArray(obj.niveles) || obj.niveles.length === 0) {
    return null;
  }

  const nivelesDificultad: ("facil" | "medio" | "avanzado")[] = ["facil", "medio", "avanzado"];
  const nivelesReparados = nivelesDificultad.map((dif, idx) => {
    let encontrado = (obj.niveles as any[]).find((n) => n?.dificultad === dif);
    if (!encontrado) {
      encontrado = (obj.niveles as any[])[idx] || (obj.niveles as any[])[0];
    }
    const items = Array.isArray(encontrado?.items) ? encontrado.items : [];

    const itemsReparados = items.map((it: any, itemIdx: number) => {
      const itRep = { ...it };
      if (!itRep.criterio || !criterioIds.has(itRep.criterio)) {
        itRep.criterio = primerCriterio;
      }
      if (!itRep.retro) {
        itRep.retro = { ok: "estrella", error: "pista" };
      }

      if (mecanicaDeseada === "tienda") {
        itRep.accion = itRep.accion === "pedido" ? "pedido" : "clasificar";

        // Estanterías
        let estanterias = Array.isArray(itRep.estanterias) ? itRep.estanterias : [];
        if (estanterias.length < 2) {
          estanterias = [
            { id: "e1", nombre: "Bebidas", asset: "estanteria-bebidas" },
            { id: "e2", nombre: "Galletas", asset: "estanteria-galletas" },
          ];
        }
        // Asegurar assets únicos y válidos
        const usadas = new Set<string>();
        estanterias = estanterias.slice(0, 3).map((e: any, eIdx: number) => {
          let asset = e.asset;
          if (!permitidosAssets.has(asset) || usadas.has(asset)) {
            asset = ASSETS_ESTANTERIAS_VALIDOS[eIdx % ASSETS_ESTANTERIAS_VALIDOS.length];
          }
          usadas.add(asset);
          return {
            id: e.id || `e${eIdx + 1}`,
            nombre: e.nombre || `Estantería ${eIdx + 1}`,
            asset,
          };
        });
        itRep.estanterias = estanterias;
        const estIds = estanterias.map((e: any) => e.id);

        // Productos
        let productos = Array.isArray(itRep.productos) ? itRep.productos : [];
        if (productos.length < 4) {
          productos = [
            { id: "p1", categoria: estIds[0], asset: "producto-gaseosa" },
            { id: "p2", categoria: estIds[0], asset: "producto-agua" },
            { id: "p3", categoria: estIds[1] || estIds[0], asset: "producto-galleta" },
            { id: "p4", categoria: estIds[1] || estIds[0], asset: "producto-leche" },
          ];
        }
        itRep.productos = productos.map((p: any, pIdx: number) => {
          let cat = p.categoria;
          if (!estIds.includes(cat)) cat = estIds[pIdx % estIds.length];
          let asset = p.asset;
          if (!permitidosAssets.has(asset)) {
            asset = ASSETS_PRODUCTOS_VALIDOS[pIdx % ASSETS_PRODUCTOS_VALIDOS.length];
          }
          return {
            id: p.id || `p${itemIdx}_${pIdx + 1}`,
            categoria: cat,
            asset,
          };
        });

        if (itRep.accion === "pedido") {
          const cat = estIds[0];
          const count = itRep.productos.filter((p: any) => p.categoria === cat).length;
          itRep.pedido = {
            categoria: cat,
            cantidad: Math.max(1, Math.min(count, Number(itRep.pedido?.cantidad) || 2)),
          };
          itRep.consigna = {
            asset: "anim-tutorial-tienda",
            texto: truncarPalabras(
              itRep.consigna?.texto || `Lleva ${itRep.pedido.cantidad} a la bolsa`,
              maxPalabras,
            ),
          };
        } else {
          delete itRep.pedido;
          delete itRep.consigna;
        }
      }

      if (mecanicaDeseada === "carrera") {
        const unidadesValidas: Unidad[] = ["km", "hm", "dam", "m", "dm", "cm", "mm"];
        const desde: Unidad = unidadesValidas.includes(itRep.desde) ? itRep.desde : "m";
        let hasta: Unidad = unidadesValidas.includes(itRep.hasta) ? itRep.hasta : "cm";
        if (desde === hasta) hasta = desde === "m" ? "cm" : "m";

        const cantidad = Number(itRep.cantidad) > 0 ? Number(itRep.cantidad) : 2;
        const esperado = resultadoConversion(cantidad, desde, hasta);
        const opciones = [esperado, esperado * 10, Math.max(1, Math.round(esperado / 10))];
        itRep.desde = desde;
        itRep.hasta = hasta;
        itRep.cantidad = cantidad;
        itRep.opciones = Array.from(new Set(opciones));
        itRep.correcta = itRep.opciones.indexOf(esperado);

        let assetEnunciado = itRep.enunciado?.asset;
        if (!permitidosAssets.has(assetEnunciado)) {
          assetEnunciado = ASSETS_CARRERA_VALIDOS[itemIdx % ASSETS_CARRERA_VALIDOS.length];
        }
        itRep.enunciado = {
          asset: assetEnunciado,
          texto: truncarPalabras(
            itRep.enunciado?.texto || `Convierte ${cantidad} ${desde} a ${hasta}`,
            maxPalabras,
          ),
        };
      }

      return itRep;
    });

    // Asegurar al menos 3 items por nivel
    while (itemsReparados.length < 3) {
      const clon = JSON.parse(JSON.stringify(itemsReparados[0] || {}));
      clon.id = `${clon.id || "item"}_bis_${itemsReparados.length}`;
      itemsReparados.push(clon);
    }

    return {
      dificultad: dif,
      items: itemsReparados,
    };
  });

  obj.niveles = nivelesReparados;

  const validacion = validarGameSpec(obj, { assets: permitidosAssets });
  return validacion.ok ? validacion.spec : null;
}
