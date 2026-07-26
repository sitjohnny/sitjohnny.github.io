import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const indexPath = join(root, 'dist', 'index.html')

let html
try {
  html = readFileSync(indexPath, 'utf8')
} catch {
  console.error(`assert-build-base: missing ${indexPath} — run npm run build first`)
  process.exit(1)
}

const marker = '/pokemon-safari/assets/'
if (!html.includes(marker)) {
  console.error(
    `assert-build-base: dist/index.html must contain "${marker}" (BOOT-01 Vite base)`,
  )
  process.exit(1)
}

console.log(`assert-build-base: OK — found ${marker}`)
