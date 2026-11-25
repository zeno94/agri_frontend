<template>
  <div class="category-wrap">
    <div ref="chartRef" class="category-canvas" aria-label="分类销售占比图" />
    <div v-if="!data.length" class="chart-empty">
      <span class="empty-mark"><el-icon><PieChart /></el-icon></span>
      <strong>暂无分类销售数据</strong>
      <p>当前区间没有销售出库记录。</p>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PieChart } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { PieChart as EChartsPie } from 'echarts/charts'
import {
  AriaComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([EChartsPie, TooltipComponent, LegendComponent, AriaComponent, CanvasRenderer])

const props = defineProps({
  data: { type: Array, default: () => [] },
})

const chartRef = ref(null)
let chart = null
let resizeObserver = null

const palette = [
  '#2f6b4b',
  '#6f9379',
  '#a8bd8e',
  '#c59a56',
  '#d8c59b',
  '#8d9b85',
  '#5b7d68',
  '#b7c6ab',
]

function renderChart() {
  if (!chart) return
  const items = props.data || []
  const option = {
    animationDuration: 650,
    aria: {
      enabled: true,
      label: { description: '各配件分类销售额占比' },
    },
    tooltip: {
      trigger: 'item',
      confine: true,
      renderMode: 'richText',
      backgroundColor: 'rgba(25, 44, 32, 0.94)',
      borderWidth: 0,
      padding: [10, 13],
      textStyle: { color: '#f8f8f1', fontSize: 12, lineHeight: 20 },
      formatter(params) {
        return `${params.name}\n销售额  ¥${Number(params.value || 0).toFixed(0)}\n占比  ${params.percent}%`
      },
    },
    legend: {
      orient: 'vertical',
      right: 2,
      top: 'middle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 11,
      textStyle: { color: '#738076', fontSize: 10.5 },
      formatter(name) {
        return name.length > 7 ? `${name.slice(0, 7)}…` : name
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['54%', '74%'],
        center: ['34%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#fff', borderWidth: 3 },
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          scaleSize: 6,
          itemStyle: { shadowBlur: 18, shadowColor: 'rgba(32, 72, 50, 0.16)' },
        },
        data: items.map((item, index) => ({
          name: item.name,
          value: Number(item.amount) || 0,
          itemStyle: { color: palette[index % palette.length] },
        })),
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
.category-wrap {
  position: relative;
  width: 100%;
  min-height: 300px;
}

.category-canvas {
  width: 100%;
  height: 300px;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 20px;
  background: rgba(255, 255, 255, 0.82);
  text-align: center;
}

.empty-mark {
  display: grid;
  width: 46px;
  height: 46px;
  margin-bottom: 11px;
  place-items: center;
  border-radius: 14px;
  color: var(--erp-green);
  background: var(--erp-lime-soft);
  font-size: 20px;
}

.chart-empty strong {
  color: var(--erp-ink);
  font-size: 12.5px;
}

.chart-empty p {
  margin-top: 5px;
  color: var(--erp-muted);
  font-size: 10.5px;
}

@media (max-width: 640px) {
  .category-canvas,
  .category-wrap {
    height: 260px;
    min-height: 260px;
  }
}
</style>
