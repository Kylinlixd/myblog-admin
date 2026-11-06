#!/usr/bin/env node
/**
 * i18n 完整性检查：
 *  1. 各语言 JSON 与 zh（源语言）的 key 对齐（复数变体 key_one/key_other 归一为家族比较）
 *  2. 源码中 t('...') 字面量调用引用的 key 必须存在于 zh（防拼错 key 静默回显）
 *  3. zh 中源码未引用的 key 给出警告（可能是死词条或动态调用）
 *
 * 用法：npm run check:i18n ；有缺失时退出码 1，可挂 CI。
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const SRC = path.join(ROOT, 'src')
const LOCALES_DIR = path.join(SRC, 'i18n', 'locales')
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/

// 复数家族归一：articleCount_one / articleCount_other 视作与 articleCount 同族
const familyOf = (key) => key.replace(PLURAL_SUFFIX, '')

const zh = (await import(pathToFileURL(path.join(LOCALES_DIR, 'zh.js'))).then((m) => m.default))
const zhFamilies = new Map()
for (const key of Object.keys(zh)) {
  const family = familyOf(key)
  zhFamilies.set(family, (zhFamilies.get(family) || 0) + 1)
}

let failed = false

/* ---- 1. 各语言与 zh 的 key 家族对齐 ---- */
for (const file of fs.readdirSync(LOCALES_DIR).filter((name) => name.endsWith('.json'))) {
  const code = path.basename(file, '.json')
  const dict = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8'))
  const families = new Set(Object.keys(dict).map(familyOf))
  const missing = [...zhFamilies.keys()].filter((key) => !families.has(key))
  const extra = [...families].filter((key) => !zhFamilies.has(key))
  if (missing.length || extra.length) {
    failed = true
    console.error(`✗ ${code}.json 与 zh 不对齐`)
    if (missing.length) console.error(`  缺失 ${missing.length} 个: ${missing.join(', ')}`)
    if (extra.length) console.error(`  多余 ${extra.length} 个: ${extra.join(', ')}`)
  } else {
    console.log(`✓ ${code}.json 与 zh 对齐（${Object.keys(dict).length} key）`)
  }
}

/* ---- 2/3. 源码 t() 字面量扫描 ---- */
const T_LITERAL = /\bt\(\s*(['"])((?:(?!\1).)+)\1/g
const extensions = new Set(['.js', '.vue'])
const skipDirs = new Set(['__tests__', '__mocks__', 'i18n'])

const used = new Set()
let dynamicCalls = 0
let literalCalls = 0

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) walk(path.join(dir, entry.name))
      continue
    }
    if (!extensions.has(path.extname(entry.name))) continue
    const source = fs.readFileSync(path.join(dir, entry.name), 'utf8')
    for (const match of source.matchAll(/\bt\(/g)) dynamicCalls++
    for (const match of source.matchAll(T_LITERAL)) {
      literalCalls++
      used.add(match[2])
    }
  }
}
walk(SRC)

// 动态调用里也包含字面量参数（如 t(cond ? 'a' : 'b')），上面把每个 t( 都计为动态会高估，
// 这里用差值近似：真实动态调用 ≈ t( 总数 − 字面量数
dynamicCalls = Math.max(0, dynamicCalls - literalCalls)

const missingInZh = [...used].filter((key) => !zhFamilies.has(key))
if (missingInZh.length) {
  failed = true
  console.error(`✗ 源码引用了 ${missingInZh.length} 个 zh 中不存在的 key: ${missingInZh.join(', ')}`)
} else {
  console.log(`✓ 源码 ${literalCalls} 处 t() 字面量引用全部存在于 zh`)
}

const unused = [...zhFamilies.keys()].filter((key) => !used.has(key))
if (unused.length) {
  console.warn(`⚠ zh 中有 ${unused.length} 个 key 未被源码字面量引用（动态调用或待清理）: ${unused.join(', ')}`)
}
console.log(`ℹ 动态 key 调用（无法静态校验）约 ${dynamicCalls} 处`)

if (failed) process.exit(1)
