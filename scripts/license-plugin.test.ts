import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EXTRA_TEXTS, missingTexts, packageRoot } from './license-plugin'

describe('Lizenzliste: Paket eines Moduls', () => {
  it.each([
    ['C:/app/node_modules/react-dom/cjs/react-dom.production.js', 'C:/app/node_modules/react-dom'],
    ['C:\\app\\node_modules\\@huggingface\\transformers\\dist\\transformers.web.js', 'C:/app/node_modules/@huggingface/transformers'],
    ['\0C:/app/node_modules/zustand/esm/middleware.mjs?commonjs-proxy', 'C:/app/node_modules/zustand'],
    ['C:/app/node_modules/a/node_modules/b/index.js', 'C:/app/node_modules/a/node_modules/b'],
  ])('%s', (id, root) => {
    expect(packageRoot(id)).toBe(root)
  })

  it('eigene Module gehören zu keinem Paket', () => {
    expect(packageRoot('C:/app/src/main.tsx')).toBeNull()
  })
})

describe('Lizenzliste: Pakete ohne eigenen Lizenztext', () => {
  it('jede Zusatzdatei liegt in third-party-licenses/', () => {
    const files = [...new Set(Object.values(EXTRA_TEXTS).flat())]
    expect(files.filter((f) => !existsSync(join(__dirname, '..', 'third-party-licenses', f)))).toEqual([])
  })

  it('meldet Pakete ohne Text', () => {
    const list = {
      npm: [{ name: 'a', version: '1.0.0', license: 'MIT', text: 'abc' }],
      cargo: [{ name: 'b', version: '0.1.0', license: 'BSD-3-Clause' }],
    }
    expect(missingTexts(list)).toEqual(['b 0.1.0 (BSD-3-Clause)'])
  })
})
