<template>
  <a-drawer
    :open="open"
    :title="t('fileMgr.tutorial.title')"
    placement="right"
    :width="drawerWidth"
    @close="closeDrawer"
  >
    <div class="tutorial-intro">
      <span class="tutorial-kicker">{{ t('fileMgr.tutorial.kicker') }}</span>
      <p>{{ t('fileMgr.tutorial.intro') }}</p>
    </div>

    <ol class="tutorial-steps">
      <li>
        <span class="tutorial-index">01</span>
        <div>
          <h3>{{ t('fileMgr.tutorial.uploadTitle') }}</h3>
          <p>{{ t('fileMgr.tutorial.uploadDesc') }}</p>
        </div>
      </li>
      <li>
        <span class="tutorial-index">02</span>
        <div>
          <h3>{{ t('fileMgr.tutorial.linkTitle') }}</h3>
          <p>{{ t('fileMgr.tutorial.linkDesc') }}</p>
        </div>
      </li>
      <li>
        <span class="tutorial-index">03</span>
        <div>
          <h3>{{ t('fileMgr.tutorial.insertTitle') }}</h3>
          <p>{{ t('fileMgr.tutorial.insertDesc') }}</p>
        </div>
      </li>
      <li>
        <span class="tutorial-index">04</span>
        <div>
          <h3>{{ t('fileMgr.tutorial.downloadTitle') }}</h3>
          <p>{{ t('fileMgr.tutorial.downloadDesc') }}</p>
        </div>
      </li>
      <li>
        <span class="tutorial-index">05</span>
        <div>
          <h3>{{ t('fileMgr.tutorial.faqTitle') }}</h3>
          <p>{{ t('fileMgr.tutorial.faqDesc') }}</p>
        </div>
      </li>
    </ol>

    <a-alert
      type="info"
      show-icon
      :message="t('fileMgr.tutorial.legacyTitle')"
      :description="t('fileMgr.tutorial.legacyDesc')"
    />
  </a-drawer>
</template>

<script setup>
import { computed } from 'vue'
import { t } from '@/i18n'

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
