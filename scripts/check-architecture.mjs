#!/usr/bin/env node
/**
 * Confere se as dependencias do codigo respeitam as camadas desenhadas no C3.
 *
 * Le os imports de cada arquivo em src/ e falha se alguma camada importar de onde nao deveria.
 * Roda com `npm run arch`. Serve para o diagrama e o codigo nao divergirem em silencio.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const SRC = resolve(dirname(new URL(import.meta.url).pathname), '..', 'src');

/** Camada de cada arquivo, pelo primeiro diretorio dentro de src/. */
function layerOf(file) {
  const rel = relative(SRC, file).replaceAll('\\', '/');
  if (rel.startsWith('services/simulated/')) return 'simulated';
  if (rel.startsWith('services/')) return 'contracts';
  const top = rel.split('/')[0];
  if (['pages', 'components', 'contexts', 'hooks'].includes(top)) return 'ui';
  if (['App.tsx', 'main.tsx', 'lib', 'styles'].includes(top)) return top === 'lib' ? 'ui' : 'entry';
  return top; // types, domain, infrastructure, mocks, composition
}

/**
 * O que cada camada pode importar. Espelha as setas do C3:
 * dominio puro; interface so ve contratos; infraestrutura so implementa portas;
 * so o composition root conhece as classes concretas.
 */
const ALLOWED = {
  types: ['types'],
  domain: ['types', 'domain'],
  contracts: ['types', 'contracts', 'domain'],
  simulated: ['types', 'domain', 'contracts', 'simulated'],
  infrastructure: ['types', 'contracts', 'simulated', 'infrastructure'],
  mocks: ['types', 'mocks'],
  composition: ['types', 'domain', 'contracts', 'simulated', 'infrastructure', 'mocks', 'composition'],
  ui: ['types', 'domain', 'contracts', 'ui', 'composition'],
  entry: ['ui', 'composition', 'types', 'entry', 'styles'],
};

/** A interface so pode usar do composition root o contexto de servicos, nunca o container. */
const UI_COMPOSITION_ALLOWED = ['composition/servicesContext.ts', 'composition/ServicesProvider.tsx'];

/** Da infraestrutura, a camada `simulated` so pode ser usada pelas portas. */
const INFRA_SIMULATED_ALLOWED = ['services/simulated/ports.ts'];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
}

function resolveImport(from, spec) {
  const base = resolve(dirname(from), spec);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')]) {
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // tenta o proximo
    }
  }
  return null;
}

const violations = [];

for (const file of walk(SRC)) {
  const source = readFileSync(file, 'utf8');
  const layer = layerOf(file);

  for (const [, spec] of source.matchAll(/from\s+'(\.[^']+)'/g)) {
    if (spec.endsWith('.css')) continue;
    const target = resolveImport(file, spec);
    if (!target) continue;

    const targetLayer = layerOf(target);
    const targetRel = relative(SRC, target).replaceAll('\\', '/');
    const fileRel = relative(SRC, file).replaceAll('\\', '/');

    const allowed = ALLOWED[layer] ?? [];
    let ok = allowed.includes(targetLayer);

    if (ok && layer === 'ui' && targetLayer === 'composition') {
      ok = UI_COMPOSITION_ALLOWED.includes(targetRel);
    }
    if (ok && layer === 'infrastructure' && targetLayer === 'simulated') {
      ok = INFRA_SIMULATED_ALLOWED.includes(targetRel);
    }
    // servicesContext so pode importar o TIPO AppServices do container.
    if (fileRel.startsWith('composition/servicesContext') && targetRel === 'composition/container.ts') {
      ok = /import\s+type\s+\{[^}]*\}\s+from\s+'\.\/container'/.test(source);
    }

    if (!ok) violations.push(`${fileRel} (${layer}) -> ${targetRel} (${targetLayer})`);
  }
}

if (violations.length > 0) {
  console.error('Dependencias fora das camadas do C3:\n  ' + violations.join('\n  '));
  process.exit(1);
}

console.log('Arquitetura OK: todas as dependencias respeitam as camadas do C3.');
