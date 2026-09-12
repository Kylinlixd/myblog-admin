<template>
  <div class="about-page cinematic-page">
    <section class="about-hero app-container">
      <div class="hero-copy">
        <p class="eyebrow"><span></span> 关于时不语之间</p>
        <h1>持续学习，也持续输出。</h1>
        <p class="hero-intro">
          我是小东，一名全栈开发者。这里记录真实项目里的取舍、踩坑与解法，
          把开发经验整理成能复用的方法。
        </p>
        <div class="hero-actions">
          <a
            class="primary-action"
            href="https://github.com/Kylinlixd"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="在 GitHub 查看时不语之间"
          >
            <github-outlined /> GitHub <arrow-right-outlined />
          </a>
          <a class="secondary-action" href="mailto:946951925@qq.com">
            <mail-outlined /> 发送邮件
          </a>
        </div>
      </div>

      <div class="profile-card">
        <div class="avatar-wrap">
          <img src="/about-avatar.jpg" alt="时不语之间的头像" />
          <span class="online-dot" aria-label="保持创作中"></span>
        </div>
        <div>
          <strong>时不语之间</strong>
          <p>Full-stack developer</p>
        </div>
        <dl class="profile-facts">
          <div><dt>当前关注</dt><dd>可靠的 Web 产品</dd></div>
          <div><dt>技术方向</dt><dd>Vue · Django · Java</dd></div>
          <div><dt>生活之外</dt><dd>阅读 · 旅行 · 摄影</dd></div>
        </dl>
      </div>
    </section>

    <section class="about-body app-container">
      <div class="section-heading">
        <p class="eyebrow">我如何工作</p>
        <h2>用工程化思维，把复杂问题讲清楚</h2>
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
          <p class="eyebrow">常用技术</p>
          <h2>从界面到服务端，关注完整交付链路</h2>
          <p class="stack-description">
            工具会变化，解决问题的能力不会。技术选择以可维护、可验证和适合团队为先。
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
          <p class="eyebrow">保持连接</p>
          <h2>有值得讨论的问题？欢迎来信。</h2>
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

const principles = [
  {
    title: '先理解，再动手',
    description: '从用户目标和系统边界出发，避免用更多代码掩盖没有想清楚的问题。',
    icon: ReadOutlined
  },
  {
    title: '保持简单可靠',
    description: '拆小复杂度，用清晰的数据流、自动化测试和文档守住长期可维护性。',
    icon: CodeOutlined
  },
  {
    title: '持续交付价值',
    description: '让每次迭代都能被看见、被验证，也能为下一次改进留下空间。',
    icon: RocketOutlined
  }
]

const stack = [
  { label: '前端', items: ['Vue', 'React', 'TypeScript', 'CSS'] },
  { label: '后端', items: ['Django', 'Python', 'Spring Boot', 'Java'] },
  { label: '数据与交付', items: ['PostgreSQL', 'MySQL', 'Redis', 'Docker'] }
]
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
  padding: 28px;
  border: 1px solid var(--blog-line);
  border-radius: 20px;
  background: var(--blog-surface);
  box-shadow: 0 8px 24px rgb(92 65 37 / 6%);
}

.avatar-wrap { position: relative; width: 80px; height: 80px; margin-bottom: 18px; }
.avatar-wrap img { width: 100%; height: 100%; border-radius: 24px; object-fit: cover; }
.online-dot { position: absolute; right: -3px; bottom: 7px; width: 17px; height: 17px; border: 4px solid white; border-radius: 50%; background: #22c55e; }
.profile-card strong { color: var(--color-text); font-size: 25px; }
.profile-card > div:nth-child(3) p, .profile-card > div:nth-child(2) p { margin: 5px 0 0; color: var(--color-text-muted); }
.profile-card dl { display: grid; gap: 0; margin: 28px 0 0; }
.profile-card dl div { display: flex; justify-content: space-between; gap: 20px; padding: 15px 0; border-top: 1px solid var(--color-border); }
.profile-card dt { color: var(--color-text-muted); }
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
