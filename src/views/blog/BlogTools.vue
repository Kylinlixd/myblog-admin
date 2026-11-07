<template>
  <div class="tools-page cinematic-page">
    <section class="tools-hero app-container">
      <h1>{{ t('nav.tools') }}</h1>
      <p class="hero-intro">{{ t('tools.intro') }}</p>
    </section>

    <section class="tools-grid app-container">
      <a
        v-for="tool in tools"
        :key="tool.id"
        :href="tool.url"
        target="_blank"
        rel="noopener noreferrer"
        class="tool-card"
      >
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
    </section>
  </div>
</template>

<script setup>
import {
  ArrowRightOutlined,
  CodeOutlined,
  FileExcelOutlined,
  FileMarkdownOutlined,
  PictureOutlined,
  SafetyOutlined,
  SearchOutlined,
  SnippetsOutlined,
  ThunderboltOutlined
} from '@ant-design/icons-vue'
import { t } from '@/i18n'

defineOptions({ name: 'BlogTools' })

// 工具注册表：后续追加文档转换、媒体转换等只需在此加一项
const tools = [
  { id: 'random-lex', url: '/tools/random-lex/index.html', icon: ThunderboltOutlined },
  { id: 'img-press', url: '/tools/img-press/index.html', icon: PictureOutlined },
  { id: 'codec-box', url: '/tools/codec-box/index.html', icon: CodeOutlined },
  { id: 'regex-lab', url: '/tools/regex-lab/index.html', icon: SearchOutlined },
  { id: 'hash-kit', url: '/tools/hash-kit/index.html', icon: SafetyOutlined },
  { id: 'json-kit', url: '/tools/json-kit/index.html', icon: SnippetsOutlined },
  { id: 'md-convert', url: '/tools/md-convert/index.html', icon: FileMarkdownOutlined },
  { id: 'xlsx-convert', url: '/tools/xlsx-convert/index.html', icon: FileExcelOutlined }
]
</script>

<style scoped>
.tools-page { padding-block: 16px 40px; }

.tools-hero { padding: 0 0 36px; }
.tools-hero h1 { font-size: 38px; font-weight: 750; letter-spacing: -0.01em; margin: 10px 0 16px; color: var(--blog-text); }
.tools-hero .hero-intro { font-size: 15px; line-height: 1.7; color: var(--blog-text-soft); max-width: 56ch; margin: 0; }

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
.tool-card h3 { font-size: 18px; font-weight: 700; color: var(--blog-text); margin: 0; }
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

@media (max-width: 620px) {
  .tools-hero h1 { font-size: 30px; }
}
</style>
