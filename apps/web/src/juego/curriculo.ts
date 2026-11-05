import type { ItemTienda } from "../../../../packages/engine/src/types";
export interface EvidenciaCurricular { itemId:string; criterio:"C1"|"C2"; fase:"accion"|"numero"; intentos:number; ayudas:number; tiempoMs:number }
export function retoCantidad(item:ItemTienda,dificultad:string) {
 const grupo = item.accion==="clasificar" && dificultad==="avanzado";
 const categoria=item.pedido?.categoria ?? item.estanterias[0]!.id;
 const producto=item.productos.find(p=>p.categoria===categoria)!;
 return {cantidad: grupo ? item.productos.length : item.pedido?.cantidad ?? item.productos.filter(p=>p.categoria===categoria).length, asset:producto.asset, categoria, alcance:grupo?"grupo" as const:"subgrupo" as const,
 pregunta:grupo?"¿Cuántas bebidas hay en total?":item.accion==="pedido"?"¿Cuántos productos preparaste?":"¿Cuántos hay en este grupo?"};
}
export function resumirEvidencias(evidencias:readonly EvidenciaCurricular[]) {
 const criterio=(id:"C1"|"C2")=>{
  const rows=evidencias.filter(e=>e.criterio===id);
  const primeroSinAyuda=rows.filter(e=>e.intentos===1&&e.ayudas===0).length;
  return {observadas:rows.length,primeroSinAyuda,conAyuda:rows.filter(e=>e.ayudas>0).length,correcciones:rows.reduce((s,e)=>s+e.intentos-1,0),numericas:rows.filter(e=>e.fase==="numero").length,tiempoActivoMs:rows.reduce((s,e)=>s+e.tiempoMs,0),porcentajeIndependiente:rows.length?Math.round(primeroSinAyuda/rows.length*100):null};
 };
 return {C1:criterio("C1"),C2:criterio("C2")};
}
