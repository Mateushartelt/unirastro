#!/usr/bin/env node
/**
 * Confere se as dependencias da API respeitam as camadas do C3 do container API Backend.
 *
 * Le os imports de cada arquivo em backend/src e falha se alguma camada importar de onde nao
 * deveria. Roda com `npm run arch`. Mesmo papel do script homonimo do frontend.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..', '..');
const SRC = join(ROOT, 'backend', 'src');

/** Camada de cada arquivo. O dominio e os tipos compartilhados vem de src/ do frontend. */
function layerOf(file) {
  const rel = relative(ROOT, file).replaceAll('\\', '/');
  if (rel.startsWith('src/domain/')) return 'domain';
  if (rel.startsWith('src/types/')) return 'types';
  if (rel.startsWith('src/mocks/')) return 'seed';
  if (rel.startsWith('src/')) return 'frontend';
  const inner = relative(SRC, file).replaceAll('\\', '/');
  if (inner === 'server.ts') return 'entry';
  return inner.split('/')[0]; // http, controllers, application, repositories, integrations, composition
}

/**
 * O que cada camada pode importar. Espelha as setas do C3:
 * controllers so falam com servicos; servicos so com portas e dominio;
 * repositorios e integracoes so implementam portas; so o composition root conhece concretos.
 */
const ALLOWED = {
  http: ['http', 'application', 'controllers', 'domain', 'types'],
  controllers: ['application', 'http', 'repositories', 'types'],
  application: ['application', 'repositories', 'domain', 'types'],
  repositories: ['repositories', 'types'],
  integrations: ['repositories', 'types'],
  composition: ['http', 'controllers', 'application', 'repositories', 'integrations', 'domain', 'types', 'seed'],
  entry: ['composition'],
};

/** De repositories/, controllers, servicos e integracoes so podem usar as portas. */
const PORTS = 'backend/src/repositories/ports.ts';
const PORTS_ONLY = ['controllers', 'application', 'integrations'];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : /\.ts$/.test(name) ? [path] : [];
  });
}

function resolveImport(from, spec) {
  const base = resolve(dirname(from), spec);
  for (const candidate of [base, `${base}.ts`, join(base, 'index.ts')]) {
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
  const layer = layerOf(file);
  const source = readFileSync(file, 'utf8');

  for (const [, spec] of source.matchAll(/from\s+'(\.[^']+)'/g)) {
    const target = resolveImport(file, spec);
    if (!target) continue;

    const targetLayer = layerOf(target);
    const targetRel = relative(ROOT, target).replaceAll('\\', '/');
    let ok = (ALLOWED[layer] ?? []).includes(targetLayer);

    if (ok && PORTS_ONLY.includes(layer) && targetLayer === 'repositories') {
      ok = targetRel === PORTS;
    }

    if (!ok) {
      violations.push(`${relative(ROOT, file)} (${layer}) -> ${targetRel} (${targetLayer})`);
    }
  }
}

if (violations.length > 0) {
  console.error('Dependencias fora das camadas do C3 da API:\n  ' + violations.join('\n  '));
  process.exit(1);
}

console.log('Arquitetura OK: a API respeita as camadas do C3.');
