<template><div ref="container" class="dashboard-chart" role="img" :aria-label="label" /></template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { init, use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

use([LineChart, GridComponent, LegendComponent, TooltipComponent, SVGRenderer])
const props = defineProps({ option: { type: Object, required: true }, label: { type: String, required: true } })
const container = ref(null)
let chart
let observer
const resize = () => chart?.resize()
onMounted(() => {
  chart = init(container.value, null, { renderer: 'svg' })
  chart.setOption(props.option)
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(resize)
    observer.observe(container.value)
  }
  window.addEventListener('resize', resize)
})
watch(() => props.option, value => chart?.setOption(value, { notMerge: true }), { deep: true })
onBeforeUnmount(() => { observer?.disconnect(); window.removeEventListener('resize', resize); chart?.dispose() })
</script>

<style scoped>
.dashboard-chart { width: 100%; height: 300px; min-width: 0; }
</style>
