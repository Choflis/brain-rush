import { test } from 'node:test';
import assert from 'node:assert/strict';
import fixture from '../../../fixtures/juegos/n1-tienda.json' with { type: 'json' };
import { recursoFaltante, recursosVisuales } from '../../../apps/web/src/juego/recursos.ts';
import type { TiendaSpec } from '../src/types.ts';

test('los recursos visuales sobreviven al renombrado de categorías', () => {
  const spec = structuredClone(fixture) as TiendaSpec;
  const item = spec.niveles[0]!.items[0] as { estanterias: { id: string; asset: string }[]; productos: { categoria: string; asset: string }[] };
  item.estanterias[0]!.id = 'refrescos';
  for (const p of item.productos) if (p.categoria === 'gaseosas') p.categoria = 'refrescos';
  assert.equal(recursoFaltante(spec), null);
  assert.equal(recursosVisuales[item.estanterias[0]!.asset], 'gaseosas');
  assert.equal(recursosVisuales[item.productos[0]!.asset], 'gaseosas');
});
test('un recurso no representado se rechaza con su id', () => {
  const spec = structuredClone(fixture) as TiendaSpec;
  const item = spec.niveles[0]!.items[0] as { productos: { asset: string }[] };
  item.productos[0]!.asset = 'producto-desconocido';
  assert.equal(recursoFaltante(spec), 'producto-desconocido');
});
