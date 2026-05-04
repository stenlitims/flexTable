/**
 * Tailwind v4 emits `@layer base { ... }` etc. Re-processing that file through
 * Tailwind v3 PostCSS in a host app fails with:
 * "`@layer base` is used but no matching `@tailwind base` directive is present."
 *
 * Unwrap all @layer blocks so the shipped CSS is plain rules + @property.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cssPath = path.resolve(__dirname, '../dist/flex-table-vue.css')

function hasNestedLayer(atRule) {
  let nested = false
  atRule.walkAtRules('layer', () => {
    nested = true
    return false
  })
  return nested
}

function unwrapAllLayers(root) {
  let guard = 0
  while (guard++ < 500) {
    const candidates = []
    root.walkAtRules('layer', (atRule) => {
      if (!hasNestedLayer(atRule))
        candidates.push(atRule)
    })
    if (!candidates.length)
      return
    for (const atRule of candidates) {
      const nodes = atRule.nodes ? [...atRule.nodes] : []
      if (nodes.length)
        atRule.replaceWith(...nodes)
      else
        atRule.remove()
    }
  }
}

const css = fs.readFileSync(cssPath, 'utf8')
const root = postcss.parse(css)
unwrapAllLayers(root)

// Ensure no stray @layer remains (e.g. empty)
root.walkAtRules('layer', (atRule) => {
  if (!atRule.nodes?.length)
    atRule.remove()
})

fs.writeFileSync(cssPath, `${root.toString()}\n`)
