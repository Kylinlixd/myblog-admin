#!/usr/bin/env node
// 将 .content 下的博客文章浓缩成词条，输出到 public/tools/random-lex/blog-terms.json
// 词条格式：{ term: 标题, def: 摘要, cat: 分类, source: '/blog/dynamics/<slug>' }
// 在 predev / prebuild 阶段自动运行，保证新增文章自动注入工具词库。
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, relative, dirname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CONTENT_DIR = join(ROOT, '.content')
const OUT_DIR = join(ROOT, 'public', 'tools', 'random-lex')
const OUT_FILE = join(OUT_DIR, 'blog-terms.json')

// 剥掉 markdown 语法，得到纯文本（用于 summary 缺失时的回退）
function stripMarkdown(text = '') {
  return String(text)
    .replace(/```[\s\S]*?```/g, ' ')      // 代码块
    .replace(/`[^`]*`/g, ' ')             // 行内代码
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接 → 文本
    .replace(/^\s{0,3}#{1,6}\s+/gm, ' ')   // 标题标记
    .replace(/^\s{0,3}>\s?/gm, ' ')       // 引用
    .replace(/[*_~]/g, ' ')               // 强调/行内代码标记
    .replace(/^\s{0,3}[-*+]\s+/gm, ' ')   // 列表
    .replace(/[ \t]+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()
}

// 极简 YAML frontmatter 解析：只取我们关心的字段，兼容引号/中文/全角冒号
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return {}
  const fields = {}
  for (const line of match[1].split(/\r?\n/)) {
    // 匹配 key: value（key 不含冒号，value 含中文冒号）
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/)
    if (!kv) continue
    const key = kv[1]
    let value = kv[2].trim()
    // 去包裹引号
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    fields[key] = value
  }
  return fields
}

function collectMdFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectMdFiles(full))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full)
    }
  }
  return files
}

function main() {
  const files = collectMdFiles(CONTENT_DIR)
  const terms = []
  const seen = new Set()

  for (const file of files) {
    const raw = readFileSync(file, 'utf-8')
    const fm = parseFrontmatter(raw)
    const title = fm.title?.trim()
    const slug = fm.slug?.trim()
    if (!title || !slug) continue

    // 去重：同 slug 只取一条
    if (seen.has(slug)) continue
    seen.add(slug)

    let def = fm.summary?.trim()
    if (!def) {
      // 回退：正文首段
      const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
      def = stripMarkdown(body.split(/\r?\n/).find((l) => l.trim()) || '')
    }
    if (!def) def = fm.title?.trim() || slug

    terms.push({
      term: title,
      def,
      cat: fm.category?.trim() || '随笔',
      source: `/blog/dynamics/${slug}`
    })
  }

  mkdirSync(OUT_DIR, { recursive: true })
  // 带缩进便于人工核对；末尾换行符合 POSIX
  writeFileSync(OUT_FILE, JSON.stringify(terms, null, 2) + '\n', 'utf-8')
  console.log(`[gen-blog-terms] ${terms.length} 条词条 → ${relative(ROOT, OUT_FILE)}`)
}

main()
