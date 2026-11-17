<template>
  <div class="chart-wrap">
    <div ref="chartRef" class="chart-canvas" aria-label="销量 Top 5 配件柱状图" />
    <div v-if="!data.length" class="chart-empty">
      <span class="empty-mark">
        <el-icon><TrendCharts /></el-icon>
      </span>
      <strong>暂无销量数据</strong>
      <p>产生销售出库后，热销排行会显示在这里。</p>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { TrendCharts } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  AriaComponent,
  GridComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, GridComponent, TooltipComponent, AriaComponent, CanvasRenderer])

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
})

const chartRef = ref(null)
let chart = null
let resizeObserver = null

const gradients = [
  ['#2a6144', '#7aa083'],
  ['#4a7b5b', '#9fbaa1'],
  ['#9a7a48', '#d4b982'],
  ['#73836d', '#b8c4ad'],
  ['#97a28f', '#cbd2c2'],
]

function shortenName(name = '') {
  return name.length > 8 ? `${name.slice(0, 8)}…` : name
}

function renderChart() {
  if (!chart) return

  const items = props.data || []
  const option = {
    animationDuration: 700,
    animationEasing: 'cubicOut',
    aria: {
      enabled: true,
      label: { description: '各配件销量柱状图' },
    },
    grid: {
      left: 8,
      right: 8,
      top: 38,
      bottom: 4,
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel',
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      renderMode: 'richText',
      backgroundColor: 'rgba(25, 44, 32, 0.94)',
      borderWidth: 0,
      padding: [10, 13],
      textStyle: {
        color: '#f8f8f1',
        fontSize: 12,
        lineHeight: 20,
      },
      axisPointer: {
        type: 'shadow',
        shadowStyle: { color: 'rgba(60, 101, 73, 0.06)' },
      },
      formatter(params) {
        const point = Array.isArray(params) ? params[0] : params
        const item = items[point?.dataIndex] || {}
        const model = item.model ? ` · ${item.model}` : ''
        return `${item.name || '未知配件'}${model}\n销量  ${item.quantity || 0} 件`
      },
    },
    xAxis: {
      type: 'category',
      data: items.map((item) => shortenName(item.name)),
      axisLine: {
        lineStyle: { color: '#dfe4da' },
      },
      axisTick: { show: false },
      axisLabel: {
        color: '#6c796f',
        fontSize: 12,
        interval: 0,
        margin: 14,
      },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#97a198',
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: '#edf0e9',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 46,
        barMinWidth: 22,
        data: items.map((item, index) => {
          const [from, to] = gradients[index % gradients.length]
          return {
            value: Number(item.quantity) || 0,
            itemStyle: {
              borderRadius: [8, 8, 2, 2],
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: from },
                { offset: 1, color: to },
              ]),
            },
          }
        }),
        itemStyle: {
          borderRadius: [8, 8, 2, 2],
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 16,
            shadowColor: 'rgba(35, 83, 56, 0.2)',
          },
        },
        label: {
          show: true,
          position: 'top',
          distance: 8,
          color: '#3c4e41',
          fontSize: 12,
          fontWeight: 700,
          formatter: '{c}',
        },
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
  () => props.data,
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
.chart-wrap {
  position: relative;
  width: 100%;
  min-height: 340px;
}

.chart-canvas {
  width: 100%;
  height: 340px;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 24px;
  background: rgba(255, 255, 255, 0.78);
  text-align: center;
}

.empty-mark {
  display: grid;
  width: 54px;
  height: 54px;
  margin-bottom: 14px;
  place-items: center;
  border-radius: 17px;
  color: var(--erp-green);
  background: var(--erp-lime-soft);
  font-size: 24px;
}

.chart-empty strong {
  color: var(--erp-ink);
  font-size: 14px;
}

.chart-empty p {
  margin-top: 6px;
  color: var(--erp-muted);
  font-size: 12px;
}

@media (max-width: 640px) {
  .chart-canvas,
  .chart-wrap {
    height: 300px;
    min-height: 300px;
  }
}
</style>
