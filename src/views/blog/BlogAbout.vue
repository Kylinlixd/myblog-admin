<template>
  <div class="about-page">
    <section class="about-hero app-container">
      <div class="hero-copy">
        <p class="eyebrow"><span></span> 关于 LiXD</p>
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
            aria-label="在 GitHub 查看 Kylinlixd"
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
          <img src="/about-avatar.jpg" alt="LiXD 的头像" />
          <span class="online-dot" aria-label="保持创作中"></span>
        </div>
        <div>
          <strong>LiXD</strong>
          <p>Full-stack developer</p>
        </div>
        <dl>
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
  background:
    radial-gradient(circle at 82% 8%, rgb(49 91 234 / 10%), transparent 28rem),
    var(--color-page);
}

.about-hero {
  display: grid;
  min-height: 620px;
  align-items: center;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.65fr);
  gap: clamp(48px, 8vw, 112px);
  padding-block: clamp(72px, 10vw, 128px);
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
  max-width: 720px;
  margin: 0;
  color: var(--color-text);
  font-size: clamp(44px, 6.5vw, 82px);
  font-weight: 820;
  letter-spacing: -0.055em;
  line-height: 1.04;
}

.hero-intro {
  max-width: 650px;
  margin: 28px 0 0;
  color: var(--color-text-secondary);
  font-size: clamp(17px, 2vw, 20px);
  line-height: 1.85;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 38px;
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
  padding: 34px;
  border: 1px solid rgb(255 255 255 / 75%);
  border-radius: 28px;
  background: rgb(255 255 255 / 78%);
  box-shadow: 0 30px 80px rgb(29 51 84 / 13%);
  backdrop-filter: blur(20px);
}

.profile-card::before {
  position: absolute;
  z-index: -1;
  top: -26px;
  right: -26px;
  width: 116px;
  height: 116px;
  border-radius: 28px;
  background: var(--color-primary);
  content: '';
  opacity: 0.11;
  transform: rotate(13deg);
}

.avatar-wrap { position: relative; width: 92px; height: 92px; margin-bottom: 22px; }
.avatar-wrap img { width: 100%; height: 100%; border-radius: 24px; object-fit: cover; }
.online-dot { position: absolute; right: -3px; bottom: 7px; width: 17px; height: 17px; border: 4px solid white; border-radius: 50%; background: #22c55e; }
.profile-card strong { color: var(--color-text); font-size: 25px; }
.profile-card > div:nth-child(3) p, .profile-card > div:nth-child(2) p { margin: 5px 0 0; color: var(--color-text-muted); }
.profile-card dl { display: grid; gap: 0; margin: 28px 0 0; }
.profile-card dl div { display: flex; justify-content: space-between; gap: 20px; padding: 15px 0; border-top: 1px solid var(--color-border); }
.profile-card dt { color: var(--color-text-muted); }
.profile-card dd { margin: 0; color: var(--color-text); font-weight: 650; text-align: right; }

.about-body { padding-bottom: clamp(72px, 10vw, 128px); }
.section-heading { max-width: 700px; margin-bottom: 42px; }
.section-heading h2, .stack-section h2, .contact-banner h2 { margin: 0; color: var(--color-text); font-size: clamp(30px, 4vw, 46px); letter-spacing: -0.035em; line-height: 1.2; }
.principles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.principle-card { position: relative; min-height: 270px; padding: 32px; border: 1px solid var(--color-border); border-radius: 22px; background: white; }
.card-index { position: absolute; top: 28px; right: 28px; color: var(--color-text-muted); font-size: 12px; font-weight: 700; }
.principle-icon { color: var(--color-primary); font-size: 28px; }
.principle-card h3 { margin: 54px 0 12px; color: var(--color-text); font-size: 20px; }
.principle-card p { margin: 0; color: var(--color-text-secondary); line-height: 1.75; }

.stack-section {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: clamp(48px, 8vw, 104px);
  margin-top: clamp(80px, 12vw, 144px);
  align-items: start;
}
.stack-description { max-width: 480px; margin: 24px 0 0; color: var(--color-text-secondary); font-size: 17px; line-height: 1.8; }
.stack-groups { border-top: 1px solid var(--color-border); }
.stack-group { display: grid; grid-template-columns: 110px 1fr; gap: 24px; padding: 25px 0; border-bottom: 1px solid var(--color-border); }
.stack-group > span { color: var(--color-text-muted); font-size: 13px; font-weight: 700; }
.stack-group ul { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
.stack-group li { padding: 7px 12px; border-radius: 999px; background: var(--color-primary-soft); color: var(--color-primary); font-size: 13px; font-weight: 650; }

.contact-banner {
  display: flex;
  margin-top: clamp(80px, 12vw, 144px);
  align-items: end;
  justify-content: space-between;
  gap: 36px;
  padding: clamp(32px, 6vw, 64px);
  border-radius: 28px;
  background: var(--color-text);
}
.contact-banner .eyebrow { color: #9db4ff; }
.contact-banner h2 { max-width: 650px; color: white; }
.contact-banner a { display: inline-flex; flex-shrink: 0; align-items: center; gap: 9px; padding-bottom: 6px; border-bottom: 1px solid rgb(255 255 255 / 42%); color: white; font-weight: 650; }

@media (max-width: 900px) {
  .about-hero, .stack-section { grid-template-columns: 1fr; }
  .about-hero { min-height: auto; }
  .profile-card { max-width: 520px; }
  .principles-grid { grid-template-columns: 1fr; }
  .principle-card { min-height: 220px; }
  .contact-banner { align-items: flex-start; flex-direction: column; }
}

@media (max-width: 560px) {
  .about-hero { gap: 42px; padding-block: 62px 76px; }
  .hero-copy h1 { font-size: 44px; }
  .hero-actions a { width: 100%; }
  .profile-card, .principle-card { padding: 26px; }
  .stack-group { grid-template-columns: 1fr; gap: 12px; }
  .contact-banner { border-radius: 22px; }
  .contact-banner a { word-break: break-all; }
}
</style>
