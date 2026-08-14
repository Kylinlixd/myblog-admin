<template>
  <a-drawer
    :open="open"
    title="文件中心使用教程"
    placement="right"
    :width="drawerWidth"
    @close="closeDrawer"
  >
    <div class="tutorial-intro">
      <span class="tutorial-kicker">五步完成资源管理</span>
      <p>文件链接由博客统一提供。你不需要配置存储地址，也不要在文章中粘贴服务器内部地址。</p>
    </div>

    <ol class="tutorial-steps">
      <li>
        <span class="tutorial-index">01</span>
        <div>
          <h3>上传文件</h3>
          <p>拖入文件或点击“上传文件”。单个文件不超过 1 GB；图片、PDF、Word、Excel、音视频均会自动识别。</p>
        </div>
      </li>
      <li>
        <span class="tutorial-index">02</span>
        <div>
          <h3>复制链接</h3>
          <p>上传完成后选择“复制链接”。公开文件链接可直接用于博客正文、封面或下载按钮。</p>
        </div>
      </li>
      <li>
        <span class="tutorial-index">03</span>
        <div>
          <h3>插入文章</h3>
          <p>在内容编辑器中粘贴链接。图片使用图片组件，PDF 或文档使用普通链接，发布前先预览一次。</p>
        </div>
      </li>
      <li>
        <span class="tutorial-index">04</span>
        <div>
          <h3>下载与删除</h3>
          <p>下载会保留原文件名。删除前确认文章不再引用该链接；存储暂时不可用时，系统会保留文件记录供稍后重试。</p>
        </div>
      </li>
      <li>
        <span class="tutorial-index">05</span>
        <div>
          <h3>常见问题</h3>
          <p>上传失败时先核对格式与大小；如果提示“存储空间已达到安全阈值”，请先删除不需要的文件，空间释放后上传会自动恢复。预览失败但文件可下载时，通常是浏览器不支持该格式。</p>
        </div>
      </li>
    </ol>

    <a-alert
      type="info"
      show-icon
      message="历史文件仍可用"
      description="旧的 /media/ 文件与新的 AstraStoreXion 文件会同时显示，无需手动迁移。"
    />
  </a-drawer>
</template>

<script setup>
import { computed } from 'vue'

defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open'])
const drawerWidth = computed(() => (
  typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 480
))

const closeDrawer = () => emit('update:open', false)
</script>

<style scoped lang="scss">
.tutorial-intro {
  max-width: 60ch;
  margin-bottom: 28px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--color-border);

  p {
    margin: 8px 0 0;
    color: var(--color-text-secondary);
    line-height: 1.75;
  }
}

.tutorial-kicker {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
}

.tutorial-steps {
  display: grid;
  gap: 0;
  margin: 0 0 28px;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    grid-template-columns: 44px 1fr;
    gap: 16px;
    padding: 0 0 26px;
  }

  li:not(:last-child) .tutorial-index::after {
    position: absolute;
    top: 30px;
    bottom: -28px;
    left: 50%;
    width: 1px;
    background: var(--color-border);
    content: '';
  }

  h3 {
    margin: 0 0 7px;
    color: var(--color-text);
    font-size: 16px;
    font-weight: 680;
  }

  p {
    max-width: 58ch;
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.7;
  }
}

.tutorial-index {
  position: relative;
  display: grid;
  place-items: center;
  width: 36px;
  height: 28px;
  border-radius: 7px;
  background: color-mix(in srgb, var(--color-primary) 10%, white);
  color: var(--color-primary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  font-weight: 760;
}
</style>
