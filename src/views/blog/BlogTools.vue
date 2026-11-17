<template>
  <div class="tools-page cinematic-page">
    <section class="tools-hero app-container">
      <h1>{{ t('nav.tools') }}</h1>
      <p class="hero-intro">{{ t('tools.intro') }}</p>
      <div class="tools-search">
        <search-outlined class="search-icon" />
        <input
          v-model.trim="query"
          type="search"
          :placeholder="t('tools.searchPlaceholder')"
          :aria-label="t('tools.searchPlaceholder')"
        >
      </div>
    </section>

    <!-- 无搜索词：按分组展示 -->
    <template v-if="!query">
      <section v-for="group in GROUP_ORDER" :key="group" class="tool-group">
        <h2 class="group-title app-container">{{ t(`tools.group.${group}`) }}</h2>
        <div class="tools-grid app-container">
          <a
            v-for="tool in byGroup(group)"
            :key="tool.id"
            :href="tool.url"
            target="_blank"
            rel="noopener noreferrer"
            class="tool-card"
          >
            <span v-if="tool.tag" class="tool-tag">{{ t(tool.tag) }}</span>
            <div class="tool-icon">
              <component :is="tool.icon" />
            </div>
            <h3>{{ t(`tools.${tool.id}.name`) }}</h3>
            <p>{{ t(`tools.${tool.id}.desc`) }}</p>
            <span class="tool-open">
              {{ t('tools.open') }}
              <arrow-right-outlined />
            </span>
          </a>
        </div>
      </section>
    </template>

    <!-- 搜索中：扁平匹配列表 -->
    <template v-else>
      <div v-if="filtered.length" class="tools-grid app-container">
        <a
          v-for="tool in filtered"
          :key="tool.id"
          :href="tool.url"
          target="_blank"
          rel="noopener noreferrer"
          class="tool-card"
        >
          <span v-if="tool.tag" class="tool-tag">{{ t(tool.tag) }}</span>
          <div class="tool-icon">
            <component :is="tool.icon" />
          </div>
          <h3>{{ t(`tools.${tool.id}.name`) }}</h3>
          <p>{{ t(`tools.${tool.id}.desc`) }}</p>
          <span class="tool-open">
            {{ t('tools.open') }}
            <arrow-right-outlined />
          </span>
        </a>
      </div>
      <p v-else class="tools-empty app-container">{{ t('tools.empty') }}</p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  ArrowRightOutlined,
  CodeOutlined,
  FileMarkdownOutlined,
  FileSyncOutlined,
  PictureOutlined,
  SafetyOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  SnippetsOutlined,
  ThunderboltOutlined
} from '@ant-design/icons-vue'
import { t } from '@/i18n'

defineOptions({ name: 'BlogTools' })

const query = ref('')

// 分组展示顺序
const GROUP_ORDER = ['learning', 'text', 'doc', 'media']

// 工具注册表：后续追加工具只需在此加一项（group 决定所在分区，tag 为可选徽标 i18n 键）
const tools = [
  {
    id: 'random-lex', url: '/tools/random-lex/index.html', icon: ThunderboltOutlined,
    group: 'learning', tag: 'tools.tag.sync',
    keywords: ['单词', '记忆', '专注', '番茄钟', '抽签', '复习', '博客联动']
  },
  {
    id: 'codec-box', url: '/tools/codec-box/index.html', icon: CodeOutlined,
    group: 'text',
    keywords: ['base64', 'url', 'unicode', 'jwt', '时间戳', '编码', '解码']
  },
  {
    id: 'regex-lab', url: '/tools/regex-lab/index.html', icon: SearchOutlined,
    group: 'text',
    keywords: ['正则', 'regexp', '匹配', '替换', '调试']
  },
  {
    id: 'hash-kit', url: '/tools/hash-kit/index.html', icon: SafetyOutlined,
    group: 'text',
    keywords: ['sha256', 'md5', '哈希', '摘要', '密码', '随机', '校验']
  },
  {
    id: 'json-kit', url: '/tools/json-kit/index.html', icon: SnippetsOutlined,
    group: 'text',
    keywords: ['json', 'yaml', 'typescript', '格式化', '压缩', '接口']
  },
  {
    id: 'md-convert', url: '/tools/md-convert/index.html', icon: FileMarkdownOutlined,
    group: 'text',
    keywords: ['markdown', 'html', 'word', 'pdf', '预览', '导出']
  },
  {
    id: 'img-press', url: '/tools/img-press/index.html', icon: PictureOutlined,
    group: 'doc',
    keywords: ['图片', '压缩', 'webp', 'avif', '格式转换', 'exif']
  },
  {
    id: 'convert-box', url: '/tools/convert-box/index.html', icon: FileSyncOutlined,
    group: 'doc', tag: 'tools.tag.new',
    keywords: ['pdf', 'word', 'excel', 'csv', '表格', '文档转换']
  },
  {
    id: 'media-convert', url: '/tools/media-convert/index.html', icon: PlayCircleOutlined,
    group: 'media', tag: 'tools.tag.beta',
    keywords: ['视频', '音频', 'mp4', 'mp3', 'ffmpeg', '转码', 'gif']
  }
]

// 匹配工具的 i18n 名称、描述与关键词
function matchTool(tool, q) {
  const hay = [
    t(`tools.${tool.id}.name`),
    t(`tools.${tool.id}.desc`),
    ...(tool.keywords || [])
  ].join(' ').toLowerCase()
  return hay.indexOf(q) >= 0
}

const filtered = computed(() => {
  const q = query.value.toLowerCase()
  if (!q) return tools
  return tools.filter((tool) => matchTool(tool, q))
})

function byGroup(group) {
  return tools.filter((tool) => tool.group === group)
}
</script>

<style scoped>
.tools-page { padding-block: 16px 40px; }

.tools-hero { padding: 0 0 32px; }
.tools-hero h1 { font-size: 38px; font-weight: 750; letter-spacing: -0.01em; margin: 10px 0 16px; color: var(--blog-text); }
.tools-hero .hero-intro { font-size: 15px; line-height: 1.7; color: var(--blog-text-soft); max-width: 56ch; margin: 0 0 20px; }

/* ---------- 搜索框 ---------- */
.tools-search {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 420px;
  height: 42px;
  padding: 0 16px;
  border: 1px solid var(--blog-line);
  border-radius: 999px;
  background: rgb(255 253 248 / 84%);
  color: var(--blog-text-muted);
  transition: border-color 0.28s, box-shadow 0.28s;
}
.tools-search:focus-within {
  border-color: var(--blog-accent);
  box-shadow: 0 0 0 3px rgb(200 111 55 / 12%);
}
.search-icon { flex: 0 0 auto; font-size: 14px; }
.tools-search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--blog-text);
  font-size: 14px;
}
.tools-search input::placeholder { color: #8d857a; }

/* ---------- 分组 ---------- */
.tool-group { margin-bottom: 28px; }
.group-title {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 650;
  letter-spacing: 0.18em;
  color: var(--blog-text-muted);
}

/* ---------- 工具卡片墙 ---------- */
.tools-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }

.tool-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 28px 24px 22px;
  border: 1px solid var(--blog-line);
  border-radius: 18px;
  background: var(--blog-surface);
  text-decoration: none;
  transition: border-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease;
}
.tool-card:hover {
  border-color: var(--blog-accent);
  box-shadow: 0 16px 40px rgb(89 61 34 / 10%);
  transform: translateY(-2px);
}
.tool-tag {
  position: absolute;
  top: 14px;
  right: 14px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgb(200 111 55 / 12%);
  color: var(--blog-accent-strong);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.tool-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 12px;
  background: rgb(200 111 55 / 12%);
  color: var(--blog-accent-strong);
  font-size: 22px;
  margin-bottom: 4px;
}
.tool-card h3 { font-size: 18px; font-weight: 700; color: var(--blog-text); margin: 0; padding-right: 40px; }
.tool-card p { font-size: 13.5px; line-height: 1.6; color: var(--blog-text-soft); margin: 0; flex: 1; }
.tool-open {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 13px;
  font-weight: 650;
  color: var(--blog-accent-strong);
}

.tools-empty {
  padding: 48px 0;
  text-align: center;
  color: var(--blog-text-muted);
  font-size: 14px;
}

@media (max-width: 620px) {
  .tools-hero h1 { font-size: 30px; }
}
</style>
