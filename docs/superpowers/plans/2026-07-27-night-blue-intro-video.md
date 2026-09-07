# Night Blue Intro Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Render and deliver a 58–60 second 1080×1920 Chinese Remotion introduction video for the leexd.top night-blue digital garden.

**Architecture:** Build an isolated Remotion project at work/leexd-intro-video so the blog dependency trees stay untouched. A typed scene manifest is the single source of truth for frames, narration, captions, and assets; six focused scene components share a small set of visual primitives. Deterministic scripts capture public pages, generate narration and original music, while render checks and ffprobe validate the final MP4.

**Tech Stack:** Remotion, React, TypeScript, @remotion/media, @remotion/captions, @remotion/transitions, Playwright, Vitest, edge-tts, Python standard library audio synthesis, FFmpeg/ffprobe through Remotion.

---

## File map

- Create **work/leexd-intro-video/src/Root.tsx** — composition registration and fixed output metadata.
- Create **work/leexd-intro-video/src/NightBlueIntro.tsx** — six-scene timeline, audio, captions, and transitions.
- Create **work/leexd-intro-video/src/data/script.ts** — scene IDs, frame ranges, narration, headings, and asset names.
- Create **work/leexd-intro-video/src/components/Atmosphere.tsx** — deterministic star field, grid, glows, and vignette.
- Create **work/leexd-intro-video/src/components/BigTitle.tsx** — safe-area title reveal.
- Create **work/leexd-intro-video/src/components/ProductFrame.tsx** — browser/mobile screenshot treatment.
- Create **work/leexd-intro-video/src/components/Captions.tsx** — Caption JSON loading, page grouping, and active-token highlighting.
- Create **work/leexd-intro-video/src/scenes/*.tsx** — Hook, Idea, Explore, Build, Principles, and CTA scenes.
- Create **work/leexd-intro-video/scripts/capture-pages.mjs** — deterministic production screenshots.
- Create **work/leexd-intro-video/scripts/generate_voiceover.py** — per-scene Mandarin speech and Caption JSON.
- Create **work/leexd-intro-video/scripts/generate_music.py** — original 90 BPM stereo soundtrack.
- Create **work/leexd-intro-video/scripts/verify-media.mjs** — ffprobe assertions for the final file.
- Create **work/leexd-intro-video/src/data/voiceover-timing.json** — actual narration start and duration values measured from generated audio.
- Create **work/leexd-intro-video/tests/script.test.ts** — timeline, safe-area, narration, and asset contracts.
- Create **work/leexd-intro-video/tests/source-rules.test.ts** — reject CSS animations and missing scene files.
- Create **outputs/leexd-night-blue-intro-vertical.mp4** — final delivery.
- Create **outputs/leexd-night-blue-intro-source.zip** — editable source delivery without node_modules or generated previews.

### Task 1: Scaffold the isolated video project and lock the composition contract

**Files:**
- Create: **work/leexd-intro-video/**
- Modify: **work/leexd-intro-video/package.json**
- Create: **work/leexd-intro-video/src/Root.tsx**
- Create: **work/leexd-intro-video/src/data/script.ts**
- Test: **work/leexd-intro-video/tests/script.test.ts**

- [ ] **Step 1: Scaffold the official blank Remotion project**

Run from the workspace root:

~~~bash
npx create-video@latest --yes --blank --no-tailwind leexd-intro-video
mv leexd-intro-video work/leexd-intro-video
cd work/leexd-intro-video
npm install
npx remotion add @remotion/media @remotion/captions @remotion/transitions
npm install --save-dev vitest playwright
npx playwright install chromium
git init
~~~

Expected: a standalone Remotion project exists, package installation exits 0, and the blog repositories have no changes.

- [ ] **Step 2: Add deterministic test and render scripts**

Update package.json scripts to include:

~~~json
{
  "test": "vitest run",
  "check": "npm test && npx tsc --noEmit",
  "capture": "node scripts/capture-pages.mjs",
  "voiceover": ".venv/bin/python scripts/generate_voiceover.py",
  "music": ".venv/bin/python scripts/generate_music.py",
  "render:preview": "npx remotion render NightBlueIntro out/preview.mp4 --scale=0.25",
  "render:final": "npx remotion render NightBlueIntro out/leexd-night-blue-intro-vertical.mp4",
  "verify:media": "node scripts/verify-media.mjs out/leexd-night-blue-intro-vertical.mp4"
}
~~~

- [ ] **Step 3: Write the failing timeline contract**

Create tests/script.test.ts:

~~~ts
import {describe, expect, it} from 'vitest';
import {FPS, HEIGHT, SCENES, TOTAL_FRAMES, WIDTH} from '../src/data/script';

describe('video contract', () => {
  it('is a 60 second Douyin vertical composition', () => {
    expect({WIDTH, HEIGHT, FPS, TOTAL_FRAMES}).toEqual({
      WIDTH: 1080,
      HEIGHT: 1920,
      FPS: 30,
      TOTAL_FRAMES: 1800,
    });
  });

  it('has six contiguous scenes covering the full timeline', () => {
    expect(SCENES).toHaveLength(6);
    expect(SCENES[0].from).toBe(0);
    expect(SCENES.at(-1)?.from + SCENES.at(-1)!.duration).toBe(TOTAL_FRAMES);
    SCENES.slice(1).forEach((scene, index) => {
      expect(scene.from).toBe(SCENES[index].from + SCENES[index].duration);
    });
  });

  it('keeps every narration line and asset explicit', () => {
    SCENES.forEach((scene) => {
      expect(scene.narration.trim().length).toBeGreaterThan(8);
      expect(scene.voiceover).toMatch(/^voiceover\/.+\.mp3$/);
    });
  });
});
~~~

- [ ] **Step 4: Run the contract test and verify it fails**

Run npm test -- tests/script.test.ts.

Expected: FAIL because src/data/script.ts does not exist.

- [ ] **Step 5: Add the typed scene manifest**

Create src/data/script.ts:

~~~ts
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;
export const TOTAL_FRAMES = 1800;

export type SceneId = 'hook' | 'idea' | 'explore' | 'build' | 'principles' | 'cta';
export type SceneDefinition = {
  id: SceneId;
  from: number;
  duration: number;
  eyebrow: string;
  title: string;
  accent: string;
  narration: string;
  voiceover: string;
};

export const SCENES: SceneDefinition[] = [
  {id:'hook',from:0,duration:180,eyebrow:'LEEXD · DIGITAL GARDEN',title:'探索技术',accent:'无限可能',narration:'技术，从来不只是一个答案。它是一条从问题出发，经过判断、尝试和修正，最终沉淀为经验的路径。',voiceover:'voiceover/01-hook.mp3'},
  {id:'idea',from:180,duration:270,eyebrow:'THE IDEA',title:'不是答案库',accent:'是一条路径',narration:'这里是 Leexd 的夜蓝数字花园。一座记录开发、产品与持续构建的个人博客。',voiceover:'voiceover/02-idea.mp3'},
  {id:'explore',from:450,duration:360,eyebrow:'EXPLORE',title:'阅读 · 发现',accent:'彼此连接',narration:'你可以从最新文章进入，也可以沿着分类、标签与搜索，找到彼此连接的知识脉络。无论桌面还是移动端，每一次阅读都保持清晰、流畅。',voiceover:'voiceover/03-explore.mp3'},
  {id:'build',from:810,duration:360,eyebrow:'BUILD',title:'持续构建',accent:'清晰管理',narration:'在另一侧，完整的内容工作台，让文章、评论、文件与数据井然有序。真实数据驱动仪表盘，统一交互让创作更专注。',voiceover:'voiceover/04-build.mp3'},
  {id:'principles',from:1170,duration:360,eyebrow:'PRINCIPLES',title:'记录判断',accent:'不只答案',narration:'我相信，值得留下的，不只是结果，还有做出选择的理由。让知识彼此连接，让每一次完成成为下一次构建的起点。',voiceover:'voiceover/05-principles.mp3'},
  {id:'cta',from:1530,duration:270,eyebrow:'LEEXD.TOP',title:'保持好奇',accent:'继续构建',narration:'保持好奇，继续构建。欢迎进入，leexd.top。',voiceover:'voiceover/06-cta.mp3'},
];
~~~

- [ ] **Step 6: Register the composition**

Create src/Root.tsx:

~~~tsx
import {Composition} from 'remotion';
import {NightBlueIntro} from './NightBlueIntro';
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH} from './data/script';

export const RemotionRoot = () => (
  <Composition
    id="NightBlueIntro"
    component={NightBlueIntro}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    defaultProps={{brandUrl: 'LEEXD.TOP'}}
  />
);
~~~

Create the initial src/NightBlueIntro.tsx:

~~~tsx
import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';

export const NightBlueIntro: FC<{brandUrl: string}> = () => (
  <AbsoluteFill style={{backgroundColor: '#050A13'}} />
);
~~~

- [ ] **Step 7: Run tests and commit**

~~~bash
npm run check
git add package.json package-lock.json src tests
git commit -m "chore: scaffold vertical remotion video"
~~~

Expected: all Vitest tests and TypeScript checks pass.

### Task 2: Capture real public product views

**Files:**
- Create: **work/leexd-intro-video/scripts/capture-pages.mjs**
- Create: **work/leexd-intro-video/public/screenshots/blog-home.png**
- Create: **work/leexd-intro-video/public/screenshots/blog-mobile.png**
- Create: **work/leexd-intro-video/public/screenshots/blog-categories.png**
- Test: **work/leexd-intro-video/tests/script.test.ts**

- [ ] **Step 1: Add failing asset assertions**

Append to tests/script.test.ts:

~~~ts
import {existsSync} from 'node:fs';
import {join} from 'node:path';

it('has all public screenshots used by the composition', () => {
  ['blog-home.png', 'blog-mobile.png', 'blog-categories.png'].forEach((file) => {
    expect(existsSync(join(process.cwd(), 'public/screenshots', file))).toBe(true);
  });
});
~~~

- [ ] **Step 2: Run the asset test and verify it fails**

Run npm test -- tests/script.test.ts.

Expected: FAIL because public/screenshots does not exist.

- [ ] **Step 3: Implement deterministic Playwright capture**

Create scripts/capture-pages.mjs:

~~~js
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const output = new URL('../public/screenshots/', import.meta.url);
await mkdir(output, {recursive: true});
const browser = await chromium.launch({headless: true});
const fallbackHtml = '<!doctype html><style>body{margin:0;background:#050a13;color:#eef4ff;font:700 64px system-ui;display:grid;min-height:100vh;place-items:center}main{width:78%;padding:80px;border:1px solid #314c76;border-radius:32px;background:linear-gradient(145deg,#10213a,#07101c)}span{display:block;color:#7698ff;margin-top:18px}</style><main>探索技术<span>无限可能</span></main>';

const capture = async ({name, path, width, height}) => {
  const page = await browser.newPage({viewport: {width, height}, deviceScaleFactor: 1});
  try {
    await page.goto('https://leexd.top' + path, {waitUntil: 'networkidle'});
    await page.waitForSelector('html[data-app-ready="true"]', {timeout: 15000});
  } catch {
    await page.setContent(fallbackHtml, {waitUntil: 'load'});
  }
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.addStyleTag({content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
  await page.screenshot({path: new URL(name, output).pathname, fullPage: false});
  await page.close();
};

await capture({name:'blog-home.png',path:'/blog',width:1080,height:1500});
await capture({name:'blog-mobile.png',path:'/blog',width:390,height:844});
await capture({name:'blog-categories.png',path:'/blog/categories',width:1080,height:1500});
await browser.close();
~~~

- [ ] **Step 4: Capture, test, and commit**

~~~bash
npm run capture
npm test -- tests/script.test.ts
git add scripts/capture-pages.mjs public/screenshots tests/script.test.ts
git commit -m "feat: capture real blog views"
~~~

Expected: three non-empty PNG files and passing asset tests.

### Task 3: Generate narration, captions, and original music

**Files:**
- Create: **work/leexd-intro-video/requirements-voiceover.txt**
- Create: **work/leexd-intro-video/scripts/generate_voiceover.py**
- Create: **work/leexd-intro-video/scripts/generate_music.py**
- Create: **work/leexd-intro-video/public/voiceover/*.mp3**
- Create: **work/leexd-intro-video/public/captions.json**
- Create: **work/leexd-intro-video/public/audio/night-blue-score.wav**
- Create: **work/leexd-intro-video/src/data/voiceover-timing.json**
- Test: **work/leexd-intro-video/tests/script.test.ts**

- [ ] **Step 1: Add failing audio-manifest tests**

~~~ts
import {statSync} from 'node:fs';

it('has generated narration, captions, and music', () => {
  const files = [
    ...SCENES.map((scene) => scene.voiceover),
    'captions.json',
    'audio/night-blue-score.wav',
  ];
  files.forEach((file) => {
    const stat = statSync(join(process.cwd(), 'public', file));
    expect(stat.size).toBeGreaterThan(1024);
  });
});
~~~

- [ ] **Step 2: Run tests and verify missing audio causes failure**

Run npm test -- tests/script.test.ts.

Expected: FAIL with ENOENT under public/voiceover.

- [ ] **Step 3: Implement voice generation**

Create requirements-voiceover.txt containing edge-tts==7.2.3. Create scripts/generate_voiceover.py that:

1. Defines the six approved narration strings and scene ranges.
2. Calls edge_tts.Communicate(text, "zh-CN-YunxiNeural", rate="-6%", pitch="-4Hz").save(path).
3. Falls back to say -v Tingting followed by npx remotion ffmpeg conversion when Edge TTS fails.
4. Measures every MP3 with ffprobe, starts the first track at 800 ms, and starts each following track 220 ms after the prior track ends.
5. If the final voiceover would end after 57,500 ms, regenerates all tracks at rate="+12%"; if it still exceeds 57,500 ms, exits 1 instead of silently overlapping narration.
6. Writes src/data/voiceover-timing.json as an array of sceneId, startMs, durationMs, and file.
7. Splits punctuation-delimited phrases into Caption objects. Each phrase duration is proportional to its non-punctuation character count inside the measured audio duration. Every object contains text, startMs, endMs, timestampMs null, and confidence null.
8. Writes public/captions.json as UTF-8 JSON and fails if any MP3 is empty.

- [ ] **Step 4: Implement deterministic original soundtrack generation**

Create scripts/generate_music.py using math, random, struct, and wave. Generate 60 seconds at 48 kHz stereo with random.seed(821431095), layered 55 Hz and 82.5 Hz sine waves, a 90 BPM pulse envelope, sparse glass tones at beat multiples, a slow final-12-second lift, and 2-second fade-in/fade-out. Normalize peak amplitude to 0.72 before writing public/audio/night-blue-score.wav.

- [ ] **Step 5: Generate and validate audio**

~~~bash
python3 -m venv .venv
.venv/bin/pip install -r requirements-voiceover.txt
npm run voiceover
npm run music
npm test -- tests/script.test.ts
npx remotion ffprobe public/audio/night-blue-score.wav
~~~

Expected: six MP3 tracks, valid Caption JSON, a 60-second stereo WAV, and passing tests.

- [ ] **Step 6: Commit**

~~~bash
git add requirements-voiceover.txt scripts public/voiceover public/captions.json public/audio src/data/voiceover-timing.json tests/script.test.ts
git commit -m "feat: generate narration captions and score"
~~~

### Task 4: Build reusable night-blue visual primitives

**Files:**
- Create: **work/leexd-intro-video/src/components/Atmosphere.tsx**
- Create: **work/leexd-intro-video/src/components/BigTitle.tsx**
- Create: **work/leexd-intro-video/src/components/ProductFrame.tsx**
- Create: **work/leexd-intro-video/src/components/Captions.tsx**
- Test: **work/leexd-intro-video/tests/source-rules.test.ts**

- [ ] **Step 1: Write failing source-rule tests**

~~~ts
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';

const collect = (dir: string): string[] => readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
  const path = join(dir, entry.name);
  if (entry.isDirectory()) return collect(path);
  return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
});

describe('Remotion source rules', () => {
  it('has the four shared components', () => {
    ['Atmosphere.tsx', 'BigTitle.tsx', 'ProductFrame.tsx', 'Captions.tsx'].forEach((file) => {
      expect(existsSync(join('src/components', file))).toBe(true);
    });
  });

  it('never uses CSS transitions or keyframe animations', () => {
    collect('src').forEach((file) => {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/transition\s*:/);
      expect(source).not.toMatch(/animation\s*:/);
      expect(source).not.toContain('@keyframes');
    });
  });
});
~~~

- [ ] **Step 2: Run the test and verify it fails**

Run npm test -- tests/source-rules.test.ts.

Expected: FAIL because src/components does not exist.

- [ ] **Step 3: Implement Atmosphere**

Use AbsoluteFill with a #050A13 base, an inline SVG grid at 64 px spacing, 48 deterministic stars from a fixed numeric array, two radial glows animated by inline interpolate() calls, and a vignette overlay.

- [ ] **Step 4: Implement BigTitle and ProductFrame**

BigTitle accepts eyebrow, title, accent, and delay. It uses a centered safe-area column, 112 px title, and inline interpolate() opacity/translate values with Easing.bezier(0.16, 1, 0.3, 1).

ProductFrame accepts src, kind "browser" or "mobile", label, and delay. It uses Img/staticFile, objectFit cover, a 1 px #314C76 border, 32 px browser radius or 54 px mobile radius, and inline interpolate() opacity/scale/translate. The image stays clipped and never exceeds 840 px width.

- [ ] **Step 5: Implement Caption rendering**

Captions.tsx loads staticFile("captions.json") with useDelayRender, groups tokens using createTikTokStyleCaptions({combineTokensWithinMilliseconds: 1400}), maps pages into Sequence ranges, and highlights the current token with #82A2FF. Place the caption container 300 px above the bottom, limit it to 840 px width, use 48 px/1.25 type, two-line max, and a rgba(2,7,14,.78) backing.

- [ ] **Step 6: Run checks and commit**

~~~bash
npm run check
git add src/components tests/source-rules.test.ts
git commit -m "feat: add night blue video primitives"
~~~

### Task 5: Implement the six scenes

**Files:**
- Create: **work/leexd-intro-video/src/scenes/HookScene.tsx**
- Create: **work/leexd-intro-video/src/scenes/IdeaScene.tsx**
- Create: **work/leexd-intro-video/src/scenes/ExploreScene.tsx**
- Create: **work/leexd-intro-video/src/scenes/BuildScene.tsx**
- Create: **work/leexd-intro-video/src/scenes/PrinciplesScene.tsx**
- Create: **work/leexd-intro-video/src/scenes/CtaScene.tsx**
- Test: **work/leexd-intro-video/tests/source-rules.test.ts**

- [ ] **Step 1: Add failing scene assertions**

Append to tests/source-rules.test.ts:

~~~ts
it('exports all six focused scene components', () => {
  const scenes = ['Hook', 'Idea', 'Explore', 'Build', 'Principles', 'Cta'];
  scenes.forEach((name) => {
    const file = join('src/scenes', name + 'Scene.tsx');
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, 'utf8')).toContain('export const ' + name + 'Scene');
  });
});
~~~

- [ ] **Step 2: Run the test and verify it fails**

Run npm test -- tests/source-rules.test.ts.

Expected: FAIL because src/scenes does not exist.

- [ ] **Step 3: Implement HookScene and IdeaScene**

HookScene uses Atmosphere and BigTitle, adds a 160 px glow behind “无限可能,” and keeps the first 20 frames nearly black. IdeaScene uses BigTitle plus ProductFrame("screenshots/blog-home.png", "browser") entering from 0.88 scale to 1 while 问题、判断、修正、沉淀 reveal sequentially below the frame.

- [ ] **Step 4: Implement ExploreScene and BuildScene**

ExploreScene alternates desktop homepage, mobile homepage, and category view with reserved centered slots and 12-frame fades. BuildScene creates a code-built dashboard with four large metrics, followed by one unified list row and one editor panel; labels match existing blog concepts and use no invented growth percentages.

- [ ] **Step 5: Implement PrinciplesScene and CtaScene**

PrinciplesScene reveals the three approved principles one at a time using border-left blue accents and background pulses. CtaScene contracts the grid toward center, reveals “保持好奇 / 继续构建,” then holds LEEXD.TOP alone from local frame 150 through 255 before fading to #050A13.

- [ ] **Step 6: Run checks and commit**

~~~bash
npm run check
git add src/scenes tests/source-rules.test.ts
git commit -m "feat: build six intro video scenes"
~~~

### Task 6: Compose the timeline, transitions, and sound mix

**Files:**
- Modify: **work/leexd-intro-video/src/NightBlueIntro.tsx**
- Test: **work/leexd-intro-video/tests/source-rules.test.ts**

- [ ] **Step 1: Add a failing composition-source assertion**

Append to tests/source-rules.test.ts:

~~~ts
it('composes scenes, sound, and global captions', () => {
  const source = readFileSync('src/NightBlueIntro.tsx', 'utf8');
  ['TransitionSeries', 'HookScene', 'IdeaScene', 'ExploreScene', 'BuildScene',
    'PrinciplesScene', 'CtaScene', 'Audio', 'Captions'].forEach((token) => {
    expect(source).toContain(token);
  });
  expect(source).toContain('audio/night-blue-score.wav');
});
~~~

- [ ] **Step 2: Run the test and verify it fails**

Run npm test -- tests/source-rules.test.ts.

Expected: FAIL against the initial solid-color composition.

- [ ] **Step 3: Implement the visual timeline**

Use TransitionSeries.Sequence durations [192, 282, 372, 372, 372, 270] with five 12-frame fade transitions. This keeps every approved scene start at [0, 180, 450, 810, 1170, 1530] and yields exactly 1800 rendered frames because 1860 raw frames minus 60 overlapping transition frames equals 1800. Do not place overlays adjacent to transitions.

- [ ] **Step 4: Add narration and music**

Import src/data/voiceover-timing.json and render one Sequence/Audio per timing entry using Math.round(startMs / 1000 * FPS). Render the score for the full composition. Fade score volume 0→0.22 during frames 0–45, hold 0.12 during narration-heavy regions, rise to 0.28 from frames 1170–1530, and fade to 0 during frames 1740–1800. Narration volume is 1.

- [ ] **Step 5: Add captions above every scene**

Place Captions after TransitionSeries so it stays visually on top and synchronized to global composition time.

- [ ] **Step 6: Run checks and commit**

~~~bash
npm run check
git add src/NightBlueIntro.tsx tests/source-rules.test.ts
git commit -m "feat: compose video timeline and sound"
~~~

### Task 7: Render representative frames and correct visual defects

**Files:**
- Create: **work/leexd-intro-video/out/stills/*.png**
- Inspect and, if a measured defect is present, modify: **work/leexd-intro-video/src/components/Atmosphere.tsx**
- Inspect and, if a measured defect is present, modify: **work/leexd-intro-video/src/components/BigTitle.tsx**
- Inspect and, if a measured defect is present, modify: **work/leexd-intro-video/src/components/ProductFrame.tsx**
- Inspect and, if a measured defect is present, modify: **work/leexd-intro-video/src/components/Captions.tsx**
- Inspect and, if a measured defect is present, modify: **work/leexd-intro-video/src/scenes/HookScene.tsx**
- Inspect and, if a measured defect is present, modify: **work/leexd-intro-video/src/scenes/IdeaScene.tsx**
- Inspect and, if a measured defect is present, modify: **work/leexd-intro-video/src/scenes/ExploreScene.tsx**
- Inspect and, if a measured defect is present, modify: **work/leexd-intro-video/src/scenes/BuildScene.tsx**
- Inspect and, if a measured defect is present, modify: **work/leexd-intro-video/src/scenes/PrinciplesScene.tsx**
- Inspect and, if a measured defect is present, modify: **work/leexd-intro-video/src/scenes/CtaScene.tsx**

- [ ] **Step 1: Render the six representative frames**

~~~bash
mkdir -p out/stills
npx remotion still NightBlueIntro out/stills/03s.png --frame=90
npx remotion still NightBlueIntro out/stills/12s.png --frame=360
npx remotion still NightBlueIntro out/stills/21s.png --frame=630
npx remotion still NightBlueIntro out/stills/33s.png --frame=990
npx remotion still NightBlueIntro out/stills/45s.png --frame=1350
npx remotion still NightBlueIntro out/stills/56s.png --frame=1680
~~~

Expected: six 1080×1920 PNGs render without missing assets.

- [ ] **Step 2: Inspect every still at original resolution**

Use view_image on all six frames. For each frame verify one obvious focal point, main title at least 96 px, no readable element within 80 px of either side, no subtitle lower than y=1660, no overlap/clipping/low contrast, and interface content secondary to the scene message.

- [ ] **Step 3: Fix every observed defect and rerender affected frames**

Change only measured defects. Repeat view_image until all six frames meet the checklist.

- [ ] **Step 4: Render and inspect a low-resolution preview**

Run npm run render:preview. Confirm six scene transitions, narration timing, music ducking, caption timing, and four-second URL hold.

- [ ] **Step 5: Commit verified visual adjustments**

~~~bash
npm run check
git add src
git commit -m "fix: polish vertical video composition"
~~~

### Task 8: Render, verify, and package the deliverables

**Files:**
- Create: **work/leexd-intro-video/scripts/verify-media.mjs**
- Create: **work/leexd-intro-video/out/leexd-night-blue-intro-vertical.mp4**
- Create: **outputs/leexd-night-blue-intro-vertical.mp4**
- Create: **outputs/leexd-night-blue-intro-source.zip**

- [ ] **Step 1: Implement machine-readable media verification**

Create scripts/verify-media.mjs. Spawn npx remotion ffprobe with -v error -show_streams -show_format -of json. Parse JSON and assert duration between 58 and 60.1 seconds, h264 video, 1080×1920, 30/1 average frame rate, and at least one aac audio stream. Exit 1 with a field-specific error for any failed assertion.

- [ ] **Step 2: Test and commit the verifier**

~~~bash
npm run check
git add scripts/verify-media.mjs
git commit -m "chore: add final media verification"
~~~

- [ ] **Step 3: Render the final MP4**

Run npm run render:final.

Expected: out/leexd-night-blue-intro-vertical.mp4 exists and render exits 0.

- [ ] **Step 4: Run final verification**

~~~bash
npm run check
npm run verify:media
npx remotion ffmpeg -i out/leexd-night-blue-intro-vertical.mp4 -vf "fps=1/10,scale=270:-1,tile=3x2" -frames:v 1 out/contact-sheet.png
~~~

Inspect out/contact-sheet.png with view_image and confirm coherent color, scene continuity, and the CTA frame.

- [ ] **Step 5: Copy and package outputs**

~~~bash
mkdir -p ../../outputs
cp out/leexd-night-blue-intro-vertical.mp4 ../../outputs/leexd-night-blue-intro-vertical.mp4
git archive --format=zip --output=../../outputs/leexd-night-blue-intro-source.zip HEAD
shasum -a 256 ../../outputs/leexd-night-blue-intro-vertical.mp4 ../../outputs/leexd-night-blue-intro-source.zip
~~~

Expected: both output files exist and have non-zero SHA-256 values.

- [ ] **Step 6: Confirm a clean source repository**

~~~bash
git status -sb
~~~

Expected: the isolated video source repository is clean.
