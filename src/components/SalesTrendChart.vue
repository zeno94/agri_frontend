<template>
  <div class="trend-wrap">
    <div ref="chartRef" class="trend-canvas" aria-label="销售趋势图" />
    <div v-if="!data.length" class="chart-empty">
      <span class="empty-mark"><el-icon><TrendCharts /></el-icon></span>
      <strong>当前区间暂无销售数据</strong>
      <p>换一个日期区间，或开一张销售出库单后再看。</p>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { TrendCharts } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  AriaComponent,
  CanvasRenderer,
])

const props = defineProps({
  data: { type: Array, default: () => [] },
  granularity: { type: String, default: 'day' },
})

const chartRef = ref(null)
let chart = null
let resizeObserver = null

function periodLabel(period) {
  if (!period) return ''
  return props.granularity === 'month' ? period : period.slice(5)
}

function compactMoney(value) {
  const number = Number(value) || 0
  if (Math.abs(number) >= 10000) return `¥${(number / 10000).toFixed(1)}万`
  return `¥${Math.round(number)}`
}

function renderChart() {
  if (!chart) return

  const items = props.data || []
  const option = {
    animationDuration: 650,
    animationEasing: 'cubicOut',
    aria: {
      enabled: true,
      label: { description: '销售额与订单数趋势图' },
    },
    color: ['#2f6b4b', '#c59a56'],
    grid: { left: 12, right: 18, top: 44, bottom: 8, outerBoundsMode: 'same' },
    legend: {
      top: 4,
      right: 8,
      itemWidth: 9,
      itemHeight: 9,
      itemGap: 18,
      textStyle: { color: '#77847a', fontSize: 10.5 },
      data: ['销售额', '订单数'],
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      renderMode: 'richText',
      backgroundColor: 'rgba(25, 44, 32, 0.94)',
      borderWidth: 0,
      padding: [10, 13],
      textStyle: { color: '#f8f8f1', fontSize: 12, lineHeight: 20 },
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(60, 101, 73, 0.06)' } },
      formatter(params) {
        const list = Array.isArray(params) ? params : [params]
        const point = list[0]
        const item = items[point?.dataIndex] || {}
        return `${point?.axisValue || ''}\n销售额  ¥${Number(item.salesAmount || 0).toFixed(0)}\n订单数  ${item.orderCount || 0} 单`
      },
    },
    xAxis: {
      type: 'category',
      data: items.map((item) => periodLabel(item.period)),
      axisLine: { lineStyle: { color: '#dfe4da' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#7c887e',
        fontSize: 10.5,
        interval: items.length > 20 ? 'auto' : 0,
        margin: 12,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '销售额',
        nameTextStyle: { color: '#9aa49b', fontSize: 10, padding: [0, 0, 4, 0] },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#9aa49b', fontSize: 10, formatter: compactMoney },
        splitLine: { lineStyle: { color: '#edf0e9', type: 'dashed' } },
      },
      {
        type: 'value',
        name: '订单数',
        nameTextStyle: { color: '#b3a17d', fontSize: 10, padding: [0, 0, 4, 0] },
        minInterval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#b3a17d', fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '销售额',
        type: 'bar',
        barMaxWidth: 30,
        data: items.map((item) => Number(item.salesAmount) || 0),
        itemStyle: {
          borderRadius: [6, 6, 2, 2],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#356f50' },
            { offset: 1, color: '#9fbea4' },
          ]),
        },
        emphasis: {
          itemStyle: { shadowBlur: 14, shadowColor: 'rgba(35, 83, 56, 0.2)' },
        },
      },
      {
        name: '订单数',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        data: items.map((item) => Number(item.orderCount) || 0),
        lineStyle: { width: 2, color: '#c59a56' },
        itemStyle: { color: '#c59a56', borderColor: '#fff', borderWidth: 1.5 },
        emphasis: { scale: 1.5 },
      },
    ],
  }

  chart.setOption(option, true)
}

onMounted(() => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  renderChart()
  resizeObserver = new ResizeObserver(() => chart?.resize())
  resizeObserver.observe(chartRef.value)
})

watch(
  () => [props.data, props.granularity],
  () => renderChart(),
  { deep: true },
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.trend-wrap {
  position: relative;
  width: 100%;
  min-height: 320px;
}

.trend-canvas {
  width: 100%;
  height: 320px;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 24px;
  background: rgba(255, 255, 255, 0.82);
  text-align: center;
}

.empty-mark {
  display: grid;
  width: 50px;
  height: 50px;
  margin-bottom: 12px;
  place-items: center;
  border-radius: 15px;
  color: var(--erp-green);
  background: var(--erp-lime-soft);
  font-size: 22px;
}

.chart-empty strong {
  color: var(--erp-ink);
  font-size: 13px;
}

.chart-empty p {
  margin-top: 5px;
  color: var(--erp-muted);
  font-size: 11px;
}

@media (max-width: 640px) {
  .trend-canvas,
  .trend-wrap {
    height: 280px;
    min-height: 280px;
  }
}
</style>
