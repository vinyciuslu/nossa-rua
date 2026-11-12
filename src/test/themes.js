import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Lê src/index.css e devolve os tokens de cor de cada modo de cor, já mesclados
 * com os valores padrão. Assim os testes validam exatamente o que o CSS declara,
 * sem manter uma segunda cópia da paleta.
 */
export function loadThemes() {
  // Os testes rodam sempre a partir da raiz do projeto (npm test).
  const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
  const blocks = [...css.matchAll(/(:root|\[data-color-mode='([^']+)'\])\s*\{([^}]*)\}/g)]

  const parse = (body) =>
    Object.fromEntries(
      [...body.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [
        m[1],
        m[2],
      ]),
    )

  const base = parse(blocks.find((b) => b[1] === ':root')[3])
  const themes = { default: base }
  for (const [, , mode, body] of blocks) {
    if (mode) themes[mode] = { ...base, ...parse(body) }
  }
  return themes
}
