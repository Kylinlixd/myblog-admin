const blue = '#315bea'
const purple = '#b0a0ee'
const tooltip = { trigger: 'axis', confine: true, backgroundColor: '#fff', borderColor: '#e5eaf2', textStyle: { color: '#26344b' }, axisPointer: { type: 'line', lineStyle: { color: '#cbd5e1' } } }
const axis = { type: 'value', min: 0, minInterval: 1, axisLabel: { color: '#8691a4', fontSize: 10 }, splitLine: { lineStyle: { color: '#edf0f5', type: 'dashed' } } }
const xAxis = (daily) => ({ type: 'category', boundaryGap: false, data: daily.map(item => item.day), axisLabel: { color: '#8691a4', fontSize: 10, formatter: value => value.slice(-5) }, axisLine: { lineStyle: { color: '#e5eaf2' } }, axisTick: { show: false } })
const line = (name, data, color) => ({ name, type: 'line', smooth: 0.25, data, symbol: 'circle', symbolSize: 6, showSymbol: false, lineStyle: { width: 3, color }, itemStyle: { color }, emphasis: { focus: 'series' } })

export function publishingOption(daily) {
  return {
    color: [blue, purple], tooltip, animationDuration: 350,
    legend: { top: 4, right: 8, icon: 'roundRect', itemWidth: 14, itemHeight: 4, textStyle: { color: '#68758b', fontSize: 11 } },
    grid: { top: 64, right: 44, bottom: 30, left: 40 },
    xAxis: xAxis(daily),
    yAxis: [{ ...axis, name: '文章 / 篇' }, { ...axis, name: '访问 / PV', splitLine: { show: false } }],
    series: [line('发布文章', daily.map(item => item.count), blue), { ...line('访问 PV', daily.map(item => item.pv), purple), yAxisIndex: 1 }]
  }
}

export function visitsOption(daily) {
  return {
    tooltip, animationDuration: 350, grid: { top: 18, right: 12, bottom: 26, left: 38 },
    xAxis: xAxis(daily), yAxis: { ...axis, splitNumber: 2 },
    series: [{ ...line('访问 PV', daily.map(item => item.pv), blue), areaStyle: { color: '#edf2ff', opacity: 0.8 } }]
  }
}
