# 页面一闪一空、列表乱跳、输入发卡：前端异步问题的系统解法

很多“前端偶发问题”表面上不一样：页面第一次打开时空白一下，搜索结果偶尔被旧关键词覆盖，按钮连续点击会重复提交，列表数据一多滚动就卡。它们背后的共同点，通常不是某个 CSS 属性写错了，而是页面没有明确表达异步状态，也没有处理请求之间的竞态。

这篇文章用 Vue 3 的组合式 API 举例，把问题拆成状态、请求生命周期和性能边界三个层次。目标不是堆更多 loading，而是让每一个可见结果都能解释、能恢复、能验证。

## 一、先把页面状态画出来

最常见的反模式是只有一个 `loading` 布尔值：请求开始设为 `true`，结束设为 `false`，模板再用 `v-if="loading"` 和 `v-else` 二选一。这样做无法区分首次加载、刷新已有数据、空结果、错误和重试，结果就是骨架屏闪烁、空状态误出现，用户不知道下一步该做什么。

更清晰的状态至少包括 `idle`、`loading`、`success`、`empty`、`error` 和 `refreshing`：

<figure class="article-figure">
[[FRONTEND_STATE_MACHINE]]
<figcaption>图 1：页面应该渲染“请求所处的状态”，而不是只判断“有没有数组数据”。</figcaption>
</figure>

~~~js
const state = ref("idle")
const items = ref([])
const errorMessage = ref("")

const loadItems = async ({ refresh = false } = {}) => {
  state.value = items.value.length && refresh ? "refreshing" : "loading"
  errorMessage.value = ""
  try {
    const result = await fetchItems()
    items.value = result.items
    state.value = items.value.length ? "success" : "empty"
  } catch (error) {
    errorMessage.value = error.message || "加载失败，请稍后重试"
    state.value = "error"
  }
}
~~~

模板中再分别处理这些状态：首次 `loading` 显示骨架屏；`refreshing` 保留旧列表并在顶部显示轻量进度；`empty` 给出筛选条件和清空入口；`error` 显示重试按钮。这样用户不会在刷新时看到整块内容突然消失。

## 二、解决搜索框的请求竞态

假设用户快速输入“vue”“vue3”“vue3 性能”，浏览器会同时发出三次请求。网络返回顺序不一定和发出顺序一致，最慢的“vue”可能最后回来，把最新结果覆盖掉。这不是后端返回错了，而是前端没有确认“这个响应是否仍属于当前输入”。

一种稳妥做法是同时使用递增序号和 `AbortController`：序号负责防止旧响应写入，控制器负责尽量取消已经无用的网络请求。

~~~js
import { onBeforeUnmount, ref } from "vue"

const keyword = ref("")
const results = ref([])
const loading = ref(false)
let sequence = 0
let controller

async function search(value) {
  keyword.value = value
  const current = ++sequence
  controller?.abort()
  controller = new AbortController()
  if (!value.trim()) {
    results.value = []
    return
  }

  loading.value = true
  try {
    const response = await fetch(`/api/blog/search/?q=${encodeURIComponent(value)}`, {
      signal: controller.signal,
    })
    const payload = await response.json()
    if (current !== sequence) return
    results.value = payload.data?.items || []
  } catch (error) {
    if (error.name !== "AbortError" && current === sequence) {
      // 只把当前请求的错误展示给用户
      console.error(error)
    }
  } finally {
    if (current === sequence) loading.value = false
  }
}

onBeforeUnmount(() => controller?.abort())
~~~

输入事件再配合 250～400ms 防抖，能明显减少请求量。但防抖不是竞态解决方案：它只减少请求，不能保证响应顺序；取消请求也不是唯一保障，因为请求可能已经到达服务端，序号校验仍然需要保留。

## 三、让重复提交在交互层先被阻断

保存按钮至少需要三个保护：提交期间禁用、显示进行中状态、失败后恢复可操作。如果写操作本身具备幂等键，还应在请求层生成并复用它，避免用户因为网络慢而重复点击。

~~~js
const saving = ref(false)

async function submit(form) {
  if (saving.value) return
  saving.value = true
  const idempotencyKey = crypto.randomUUID()
  try {
    await api.post("/api/dynamics/", form, {
      headers: { "Idempotency-Key": idempotencyKey },
    })
    showMessage("保存成功")
  } catch (error) {
    showMessage(error.message || "保存失败，请重试")
  } finally {
    saving.value = false
  }
}
~~~

注意不要在 `finally` 之外只写一个“成功后解锁”。异常、超时、组件卸载都会让按钮卡在 disabled；`finally` 是还原交互状态的稳定边界。

## 四、性能排查先定位阶段，再动代码

“页面很卡”不是一个足够具体的问题。先用 Performance、Network、Coverage 和真实设备数据判断瓶颈属于网络、脚本、渲染还是交互，再选择对应动作：

<figure class="article-figure">
[[FRONTEND_PERFORMANCE_BOUNDARY]]
<figcaption>图 2：性能优化要对应具体边界，不要在没有数据时全站重构。</figcaption>
</figure>

### 1. 网络慢：先减少等待

检查 TTFB、接口响应大小和图片传输大小。首屏不需要的模块做路由懒加载，图片使用合适尺寸和 `loading="lazy"`，重复公共数据用缓存，真正稳定后再考虑 CDN。不要把“所有接口并行”当成万能解：互相不依赖的请求可以并行，带有依赖关系的请求应该明确串联，否则只会制造更多失败分支。

### 2. 脚本慢：关注下载和执行两笔账

构建产物里，编辑器、图表库和完整语言包往往是大头。按路由拆包、按需加载语言包、移除重复依赖后，再用 Coverage 查看真正执行了多少代码。只看 gzip 后体积不够，还要观察主线程执行时间。

### 3. 渲染慢：限制一次参与布局的节点

长列表不要一次渲染几千个节点。可以先做分页或虚拟滚动；图片和复杂子组件在进入视口后再创建。骨架屏应该和真实内容的大致高度接近，避免加载完成后发生大幅布局偏移。

### 4. 交互慢：把输入和渲染拆开

高频输入使用防抖，拖拽和滚动使用节流；昂贵计算用 `computed` 缓存或移到 worker；搜索结果更新时先丢弃过期响应。性能优化最后要回到真实设备、真实网络和真实数据量上验证，开发机上的“感觉变快”不能作为结论。

## 五、把这些问题变成可测试的行为

异步页面最值得写的不是内部实现测试，而是用户能观察到的状态测试：首次进入显示骨架屏；接口返回空数组显示空状态；接口失败显示错误和重试；连续输入只展示最后一次结果；提交期间按钮不能触发第二个请求；组件卸载后不会再更新状态；大列表不会在首屏创建全部复杂节点。

当页面的状态转换和请求边界清楚后，很多“偶发”的前端 bug 会从玄学变成可复现的时序问题。解决它们的关键不是让页面永远显示 loading，而是让每一次等待、成功、为空和失败都拥有明确的 UI 反馈，以及一条可验证的恢复路径。

## 发布前检查清单

- [ ] 首次加载、刷新、空数据、失败和重试有不同反馈。
- [ ] 搜索或筛选处理了旧响应覆盖新响应的竞态。
- [ ] 重复提交在交互层和服务端都有保护。
- [ ] 性能瓶颈已经被 Network/Performance 数据定位。
- [ ] 真实设备和真实数据量下验证过优化结果。
- [ ] 关键时序已经转成自动化测试。
