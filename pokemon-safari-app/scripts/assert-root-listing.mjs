import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const indexPath = join(appRoot, '..', 'index.html')

let html
try {
  html = readFileSync(indexPath, 'utf8')
} catch {
  console.error(`assert-root-listing: missing ${indexPath}`)
  process.exit(1)
}

const errors = []

// Fail if meta refresh still sends visitors solely to food-crawl (hides Safari).
if (/http-equiv\s*=\s*["']refresh["']/i.test(html) && /\/food-crawl\//.test(html)) {
  errors.push(
    'index.html must not use http-equiv refresh to /food-crawl/ as sole discovery path',
  )
}

if (!html.includes('href="/food-crawl/"')) {
  errors.push('index.html must link href="/food-crawl/"')
}

if (!html.includes('href="/pokemon-safari/"')) {
  errors.push('index.html must link href="/pokemon-safari/"')
}

if (!/sitjohnny\s+projects/i.test(html)) {
  errors.push('index.html heading must include "sitjohnny projects"')
}

if (errors.length > 0) {
  console.error('assert-root-listing: FAILED')
  for (const msg of errors) {
    console.error(`  - ${msg}`)
  }
  process.exit(1)
}

console.log('assert-root-listing: OK — dual project listing present, no sole food-crawl refresh')
