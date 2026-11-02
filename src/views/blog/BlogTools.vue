<template>
  <div class="tools-page cinematic-page">
    <section class="tools-hero app-container">
      <h1>{{ t('nav.tools') }}</h1>
      <p class="hero-intro">{{ t('tools.intro') }}</p>
    </section>

    <!-- 工具卡片墙 -->
    <section v-if="!openedTool" class="tools-grid app-container">
      <article
        v-for="tool in tools"
        :key="tool.id"
        class="tool-card"
        tabindex="0"
        role="button"
        :aria-label="t(`tools.${tool.id}.name`)"
        @click="openTool(tool)"
        @keydown.enter="openTool(tool)"
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
      </article>
    </section>

    <!-- 工具运行视图 -->
    <section v-else class="tool-view app-container">
      <div class="tool-view-bar">
        <button class="back-btn" type="button" @click="closeTool">
          <arrow-left-outlined />
          {{ t('tools.backToList') }}
        </button>
        <span class="tool-view-title">{{ t(`tools.${openedTool.id}.name`) }}</span>
      </div>
      <div class="iframe-wrap">
        <div v-if="iframeLoading" class="iframe-loading">
          <a-spin />
          <span>{{ t('tools.loading') }}</span>
        </div>
        <iframe
          ref="toolFrame"
          :src="openedTool.url"
          class="tool-iframe"
          frameborder="0"
          @load="onFrameLoad"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRightOutlined, ArrowLeftOutlined, ThunderboltOutlined } from '@ant-design/icons-vue'
import { t } from '@/i18n'

defineOptions({ name: 'BlogTools' })

const route = useRoute()
const router = useRouter()
const toolFrame = ref(null)
const iframeLoading = ref(false)

// 工具注册表：后续追加文档转换、媒体转换等只需在此加一项
const tools = [
  { id: 'random-lex', url: '/tools/random-lex/index.html', icon: ThunderboltOutlined }
]

const openedTool = computed(() => {
  const id = route.query.tool
  return tools.find((tool) => tool.id === id) || null
})

function openTool(tool) {
  router.push({ path: '/blog/tools', query: { tool: tool.id } })
}

function closeTool() {
  router.push({ path: '/blog/tools' })
}

function onFrameLoad() {
  iframeLoading.value = false
  // 文章页「在御器学习本文」入口带 ?article=<slug>，iframe 加载完成后
  // postMessage 通知工具定位到该文词条
  const articleSlug = route.query.article
  if (articleSlug && typeof articleSlug === 'string' && toolFrame.value?.contentWindow) {
    toolFrame.value.contentWindow.postMessage(
      { source: 'yuqi-tools', type: 'focus-term', slug: articleSlug },
      '*'
    )
  }
}

// 切换工具时重置加载态
watch(openedTool, (tool) => {
  if (tool) {
    iframeLoading.value = true
    nextTick(() => {
      // iframe 切换后重新触发 load 检测
      const frame = toolFrame.value
      if (frame && frame.getAttribute('src') === tool.url) {
        // src 未变则不会触发 load，手动设加载态为 false
        iframeLoading.value = false
        onFrameLoad()
      }
    })
  }
})
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
  cursor: pointer;
  transition: border-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease;
  outline: none;
}
.tool-card:hover, .tool-card:focus-visible {
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

/* ---------- 工具运行视图 ---------- */
.tool-view { display: flex; flex-direction: column; gap: 18px; }
.tool-view-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 2px;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--blog-line);
  border-radius: 999px;
  background: var(--blog-surface);
  color: var(--blog-text-soft);
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
  transition: border-color 0.28s, color 0.28s;
}
.back-btn:hover { border-color: var(--blog-accent); color: var(--blog-accent-strong); }
.tool-view-title { font-size: 15px; font-weight: 700; color: var(--blog-text); }

.iframe-wrap {
  position: relative;
  border: 1px solid var(--blog-line);
  border-radius: 18px;
  background: var(--blog-paper);
  overflow: hidden;
  box-shadow: 0 16px 40px rgb(89 61 34 / 9%);
}
.tool-iframe {
  display: block;
  width: 100%;
  height: 72vh;
  min-height: 480px;
  border: 0;
  background: #111;
}
.iframe-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--blog-text-muted);
  font-size: 13px;
  z-index: 1;
}

@media (max-width: 620px) {
  .tools-hero h1 { font-size: 30px; }
  .tool-iframe { height: 65vh; }
}
</style>
