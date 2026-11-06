<template>
  <div class="about-page cinematic-page">
    <section class="about-hero app-container">
      <div class="hero-copy">
        <p class="eyebrow"><span></span> {{ t("about.title") }}</p>
        <h1>{{ t("about.heroTitle") }}</h1>
        <p class="hero-intro">
          {{ t("about.intro") }}
        </p>
        <div class="hero-actions">
          <a
            class="primary-action"
            href="https://github.com/Kylinlixd"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="t('about.github')"
          >
            <github-outlined /> GitHub <arrow-right-outlined />
          </a>
          <a class="secondary-action" href="mailto:946951925@qq.com">
            <mail-outlined /> {{ t("about.sendEmail") }}
          </a>
        </div>
      </div>

      <div class="profile-card">
        <div class="profile-head">
          <div class="profile-headline">
            <strong>{{ t("about.siteName") }}</strong>
            <p>Full-stack developer</p>
          </div>
          <p class="profile-status"><span class="pulse-dot" aria-hidden="true"></span>{{ t("about.creating") }}</p>
        </div>
        <dl class="profile-facts">
          <div><dt>{{ t("about.currentFocus") }}</dt><dd>{{ t("about.reliableWeb") }}</dd></div>
          <div><dt>{{ t("about.techDirection") }}</dt><dd>{{ t("about.techStack") }}</dd></div>
          <div><dt>{{ t("about.beyondLife") }}</dt><dd>{{ t("about.lifeBeyond") }}</dd></div>
        </dl>
      </div>
    </section>

    <section class="about-body app-container">
      <div class="section-heading">
        <p class="eyebrow">{{ t("about.howIWork") }}</p>
        <h2>{{ t("about.engineeringTitle") }}</h2>
      </div>

      <div class="principles-grid">
        <article v-for="(item, index) in principles" :key="item.title" class="principle-card">
          <span class="card-index">0{{ index + 1 }}</span>
          <component :is="item.icon" class="principle-icon" />
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </article>
      </div>

      <div class="stack-section">
        <div>
          <p class="eyebrow">{{ t("about.commonTech") }}</p>
          <h2>{{ t("about.deliveryTitle") }}</h2>
          <p class="stack-description">
            {{ t("about.stackDesc") }}
          </p>
        </div>
        <div class="stack-groups">
          <div v-for="group in stack" :key="group.label" class="stack-group">
            <span>{{ group.label }}</span>
            <ul>
              <li v-for="item in group.items" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
      </div>

      <aside class="contact-banner">
        <div>
          <p class="eyebrow">{{ t("about.stayConnected") }}</p>
          <h2>{{ t("about.contactTitle") }}</h2>
        </div>
        <a href="mailto:946951925@qq.com">946951925@qq.com <arrow-right-outlined /></a>
      </aside>
    </section>
  </div>
</template>

<script setup>
import {
  ArrowRightOutlined,
  CodeOutlined,
  GithubOutlined,
  MailOutlined,
  ReadOutlined,
  RocketOutlined
} from '@ant-design/icons-vue'
import { computed } from 'vue'
import { t } from '@/i18n'

const principles = computed(() => [
  {
    title: t('about.principle1Title'),
    description: t('about.principle1Desc'),
    icon: ReadOutlined
  },
  {
    title: t('about.principle2Title'),
    description: t('about.principle2Desc'),
    icon: CodeOutlined
  },
  {
    title: t('about.principle3Title'),
    description: t('about.principle3Desc'),
    icon: RocketOutlined
  }
])

const stack = computed(() => [
  { label: t('about.stackFrontend'), items: ['Vue', 'React', 'TypeScript', 'CSS'] },
  { label: t('about.stackBackend'), items: ['Django', 'Python', 'Spring Boot', 'Java'] },
  { label: t('about.stackData'), items: ['PostgreSQL', 'MySQL', 'Redis', 'Docker'] }
])
</script>

<style scoped>
.about-page {
  overflow: hidden;
  padding-block: 48px 64px;
  background: transparent;
}

.about-hero {
  display: grid;
  align-items: center;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 360px);
  gap: clamp(40px, 6vw, 64px);
  padding-block: 32px 48px;
}

.about-hero {
  width: min(calc(100% - 40px), 1120px);
  max-width: none;
  margin-bottom: 0;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 18px;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 750;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.eyebrow span {
  width: 28px;
  height: 2px;
  background: currentColor;
}

.hero-copy h1 {
  max-width: 700px;
  margin: 0;
  color: var(--color-text);
  font-size: clamp(52px, 5.2vw, 60px);
  font-weight: 750;
  letter-spacing: -0.02em;
  line-height: 1.18;
}

.hero-intro {
  max-width: 650px;
  margin: 22px 0 0;
  color: var(--color-text-secondary);
  font-size: clamp(16px, 1.7vw, 18px);
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 26px;
}

.hero-actions a {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 20px;
  border-radius: 999px;
  font-weight: 680;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.hero-actions a:hover { transform: translateY(-2px); }
.primary-action { background: var(--color-text); color: white; box-shadow: 0 14px 30px rgb(15 23 42 / 18%); }
.secondary-action { border: 1px solid var(--color-border); background: white; color: var(--color-text); }

.profile-card {
  position: relative;
  padding: 30px 30px 12px;
  border: 1px solid var(--blog-line);
  border-radius: 20px;
  background: var(--blog-surface);
  box-shadow: 0 8px 24px rgb(92 65 37 / 6%);
  overflow: hidden;
}

.profile-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: linear-gradient(to right, var(--blog-accent, #c86f37), rgb(200 111 55 / 0%));
}

.profile-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.profile-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin: 0;
  padding: 6px 13px;
  border: 1px solid var(--blog-line);
  border-radius: 999px;
  background: rgb(34 197 94 / 8%);
  color: #3f7a52;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 0 rgb(34 197 94 / 45%);
  animation: profile-pulse 2.2s ease-out infinite;
}

@keyframes profile-pulse {
  0% { box-shadow: 0 0 0 0 rgb(34 197 94 / 45%); }
  70% { box-shadow: 0 0 0 9px rgb(34 197 94 / 0%); }
  100% { box-shadow: 0 0 0 0 rgb(34 197 94 / 0%); }
}

@media (prefers-reduced-motion: reduce) {
  .pulse-dot { animation: none; }
}

.profile-headline strong {
  display: block;
  color: var(--color-text);
  font-size: 28px;
  letter-spacing: -0.01em;
}

.profile-headline p {
  margin: 7px 0 0;
  color: var(--color-text-muted);
  font-size: 15px;
}

.profile-card dl { display: grid; gap: 0; margin: 28px 0 0; }
.profile-card dl div { display: flex; justify-content: space-between; align-items: baseline; gap: 20px; padding: 16px 0 17px; border-top: 1px solid var(--color-border); }
.profile-card dt { color: var(--color-text-muted); font-size: 13px; letter-spacing: 0.08em; }
.profile-card dd { position: relative; z-index: 1; min-width: 0; margin: 0; color: #243041; font-weight: 680; overflow-wrap: anywhere; text-align: right; }

.about-body { width: min(calc(100% - 40px), 1120px); padding-bottom: 0; }
.section-heading { max-width: 700px; margin-bottom: 24px; }
.section-heading h2, .stack-section h2, .contact-banner h2 { margin: 0; color: var(--blog-text); font-size: clamp(28px, 3.2vw, 34px); letter-spacing: -0.02em; line-height: 1.35; }
.principles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.principle-card { position: relative; min-height: 0; padding: 24px; border: 1px solid var(--blog-line); border-radius: 18px; background: var(--blog-surface); box-shadow: 0 8px 24px rgb(92 65 37 / 6%); }
.card-index { position: absolute; top: 28px; right: 28px; color: var(--color-text-muted); font-size: 12px; font-weight: 700; }
.principle-icon { color: var(--color-primary); font-size: 28px; }
.principle-card h3 { margin: 34px 0 10px; color: var(--blog-text); font-size: 20px; }
.principle-card p { margin: 0; color: var(--blog-text-soft); line-height: 1.75; }

.stack-section {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: 32px;
  margin-top: 64px;
  padding: 32px;
  align-items: start;
}
.stack-section > div, .stack-groups, .stack-group, .stack-group ul { min-width: 0; }
.stack-section h2, .stack-description { overflow-wrap: anywhere; }
.stack-description { max-width: 480px; margin: 20px 0 0; color: var(--blog-text-soft); font-size: 16px; line-height: 1.75; }
.stack-groups { border-top: 1px solid var(--blog-line); }
.stack-group { display: grid; grid-template-columns: 96px 1fr; gap: 20px; padding: 16px 0; border-bottom: 1px solid var(--blog-line); }
.stack-group > span { color: var(--color-text-muted); font-size: 13px; font-weight: 700; }
.stack-group ul { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
.stack-group li { padding: 7px 12px; border-radius: 999px; background: rgb(200 111 55 / 10%); color: var(--blog-accent-strong); font-size: 13px; font-weight: 650; }

.contact-banner {
  display: flex;
  margin-top: 64px;
  align-items: end;
  justify-content: space-between;
  gap: 36px;
  padding: 32px;
  border: 1px solid var(--blog-line);
  border-radius: 20px;
  background: var(--blog-surface);
  box-shadow: 0 8px 24px rgb(92 65 37 / 6%);
}
.contact-banner .eyebrow { color: var(--blog-accent); }
.contact-banner h2 { max-width: 650px; color: var(--blog-text); }
.contact-banner a { display: inline-flex; flex-shrink: 0; align-items: center; gap: 9px; padding-bottom: 6px; border-bottom: 1px solid var(--blog-accent); color: var(--blog-accent-strong); font-weight: 700; transition: color var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast); }
.contact-banner a:hover { border-bottom-color: var(--blog-text); color: var(--blog-text); transform: translateX(3px); }
.contact-banner a:focus-visible { outline: 3px solid rgb(241 182 120 / 62%); outline-offset: 6px; }

@media (max-width: 900px) {
  .about-hero, .stack-section { grid-template-columns: 1fr; }
  .about-hero { min-height: auto; }
  .profile-card { max-width: 520px; }
  .principles-grid { grid-template-columns: 1fr; }
  .principle-card { min-height: 0; }
  .contact-banner { align-items: flex-start; flex-direction: column; }
}

@media (max-width: 560px) {
  .about-hero { gap: 24px; padding-block: 24px 40px; }
  .hero-copy h1 { font-size: 44px; }
  .hero-actions a { width: 100%; }
  .profile-card, .principle-card { padding: 20px; }
  .about-body { width: min(calc(100% - 40px), 1120px); }
  .stack-group { grid-template-columns: 1fr; gap: 12px; }
  .contact-banner { border-radius: 16px; padding: 20px; }
  .contact-banner a { overflow-wrap: anywhere; }
}
</style>
