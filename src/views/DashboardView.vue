<template>
  <div class="page-shell dashboard-page">
    <PageHeader
      eyebrow="OPERATING REPORTS"
      title="经营报表"
      :description="description"
    >
      <template #actions>
        <span v-if="dataRangeText" class="data-range-chip">
          <el-icon><Calendar /></el-icon>
          数据范围 {{ dataRangeText }}
        </span>
        <span v-if="updatedAt" class="updated-text">更新于 {{ updatedAt }}</span>
        <el-button :icon="Refresh" :loading="loading" @click="loadReport(true)">
          刷新
        </el-button>
      </template>
    </PageHeader>

    <section class="surface-card report-toolbar">
      <div class="toolbar-main">
        <div class="toolbar-label">
          <span>统计区间</span>
          <small>按北京时间自然日</small>
        </div>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          unlink-panels
          :clearable="false"
          class="range-picker"
          @change="handleDateChange"
        />
        <el-button type="primary" :loading="loading" @click="loadReport()">
          查询
        </el-button>
      </div>
      <div class="quick-ranges">
        <button
          v-for="option in QUICK_RANGES"
          :key="option.key"
          type="button"
          class="quick-range"
          :class="{ 'is-active': activeQuick === option.key }"
          @click="applyQuick(option.key)"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <div class="stat-grid">
      <article class="stat-card stat-card--featured">
        <div class="stat-head">
          <span>销售额</span>
          <span class="stat-icon"><el-icon><Sell /></el-icon></span>
        </div>
        <strong class="stat-value money">
          <small>¥</small>{{ formatYuan(report.salesAmount) }}
        </strong>
        <p class="stat-foot">
          {{ formatNumber(report.salesOrderCount) }} 单 ·
          {{ formatNumber(report.itemsSold) }} 件
        </p>
        <span class="featured-orbit" aria-hidden="true" />
      </article>

      <article class="stat-card">
        <div class="stat-head">
          <span>采购额</span>
          <span class="stat-icon stat-icon--sage"><el-icon><ShoppingCart /></el-icon></span>
        </div>
        <strong class="stat-value money">
          <small>¥</small>{{ formatMoney(report.purchaseAmount) }}
        </strong>
        <p class="stat-foot">{{ formatNumber(report.purchaseOrderCount) }} 张采购单</p>
      </article>

      <article class="stat-card stat-card--cream">
        <div class="stat-head">
          <span>销售毛利</span>
          <span class="stat-icon stat-icon--gold"><el-icon><Wallet /></el-icon></span>
        </div>
        <strong class="stat-value money" :class="{ 'is-negative': report.grossProfit < 0 }">
          <small>¥</small>{{ formatMoney(report.grossProfit) }}
        </strong>
        <p class="stat-foot">毛利率 {{ formatPercent(report.grossMargin) }} · 按参考进货价估算</p>
      </article>

      <article class="stat-card">
        <div class="stat-head">
          <span>销售单数</span>
          <span class="stat-icon"><el-icon><Tickets /></el-icon></span>
        </div>
        <strong class="stat-value">
          {{ formatNumber(report.salesOrderCount) }}<small class="stat-unit">单</small>
        </strong>
        <p class="stat-foot">平均单额 ¥{{ formatYuan(report.avgOrderAmount) }}</p>
      </article>
    </div>

    <div class="report-grid report-grid--top">
      <section class="surface-card trend-card">
        <header class="card-head">
          <div>
            <span class="card-kicker">SALES TREND</span>
            <h2>{{ granularityLabel }}销售趋势</h2>
            <p>柱状为销售额，折线为订单数；切换区间会自动调整粒度。</p>
          </div>
          <span class="unit-legend"><i /> 销售额 / 订单数</span>
        </header>
        <SalesTrendChart :data="report.trend" :granularity="report.trendGranularity" />
        <footer v-if="report.trend.length" class="chart-insight">
          <span class="insight-mark"><el-icon><TrendCharts /></el-icon></span>
          <p>
            共 {{ report.trend.length }} 个{{ granularityLabel }}数据点，
            峰值销售额 <strong>¥{{ formatYuan(peakSales) }}</strong>。
          </p>
          <router-link to="/sales" class="text-link">
            查看销售记录
            <el-icon><ArrowRight /></el-icon>
          </router-link>
        </footer>
      </section>

      <section class="surface-card category-card">
        <header class="card-head card-head--compact">
          <div>
            <span class="card-kicker">CATEGORY MIX</span>
            <h2>分类销售占比</h2>
            <p>按销售额排序，展示前 8 个配件分类。</p>
          </div>
        </header>
        <CategoryDonutChart :data="report.categories" />
      </section>
    </div>

    <div class="report-grid report-grid--rank">
      <section class="surface-card rank-card">
        <header class="card-head card-head--compact">
          <div>
            <span class="card-kicker">TOP PARTS</span>
            <h2>销售额 Top 5 配件</h2>
            <p>本期卖得最好的配件，按实际成交金额排序。</p>
          </div>
        </header>
        <ul v-if="report.topParts.length" class="rank-list">
          <li v-for="(item, index) in report.topParts" :key="item.id || item.name">
            <span class="rank-no">{{ String(index + 1).padStart(2, '0') }}</span>
            <div class="rank-main">
              <div class="rank-title">
                <strong>{{ item.name }}</strong>
                <span class="money">¥{{ formatYuan(item.amount) }}</span>
              </div>
              <div class="rank-meta">
                <small>{{ formatNumber(item.quantity) }} 件</small>
                <small>{{ percentOf(item.amount, maxPartAmount) }}%</small>
              </div>
              <div class="rank-track">
                <i :style="{ width: barWidth(item.amount, maxPartAmount) }" />
              </div>
            </div>
          </li>
        </ul>
        <div v-else class="rank-empty">当前区间暂无销售排行</div>
      </section>

      <section class="surface-card rank-card">
        <header class="card-head card-head--compact">
          <div>
            <span class="card-kicker">TOP CUSTOMERS</span>
            <h2>销售额 Top 5 客户</h2>
            <p>贡献销售额最多的客户，括号内为单据数。</p>
          </div>
        </header>
        <ul v-if="report.topCustomers.length" class="rank-list">
          <li v-for="(item, index) in report.topCustomers" :key="item.id || item.name">
            <span class="rank-no">{{ String(index + 1).padStart(2, '0') }}</span>
            <div class="rank-main">
              <div class="rank-title">
                <strong>{{ item.name }}</strong>
                <span class="money">¥{{ formatYuan(item.amount) }}</span>
              </div>
              <div class="rank-meta">
                <small>{{ formatNumber(item.orderCount) }} 单</small>
                <small>{{ percentOf(item.amount, maxCustomerAmount) }}%</small>
              </div>
              <div class="rank-track">
                <i :style="{ width: barWidth(item.amount, maxCustomerAmount) }" />
              </div>
            </div>
          </li>
        </ul>
        <div v-else class="rank-empty">当前区间暂无客户销售数据</div>
      </section>

      <section class="surface-card rank-card">
        <header class="card-head card-head--compact">
          <div>
            <span class="card-kicker">TOP SUPPLIERS</span>
            <h2>采购额 Top 5 供应商</h2>
            <p>本期采购金额最高的供应商。</p>
          </div>
        </header>
        <ul v-if="report.topSuppliers.length" class="rank-list">
          <li v-for="(item, index) in report.topSuppliers" :key="item.id || item.name">
            <span class="rank-no">{{ String(index + 1).padStart(2, '0') }}</span>
            <div class="rank-main">
              <div class="rank-title">
                <strong>{{ item.name }}</strong>
                <span class="money">¥{{ formatYuan(item.amount) }}</span>
              </div>
              <div class="rank-meta">
                <small>{{ formatNumber(item.orderCount) }} 单</small>
                <small>{{ percentOf(item.amount, maxSupplierAmount) }}%</small>
              </div>
              <div class="rank-track">
                <i :style="{ width: barWidth(item.amount, maxSupplierAmount) }" />
              </div>
            </div>
          </li>
        </ul>
        <div v-else class="rank-empty">当前区间暂无采购数据</div>
      </section>
    </div>

    <section class="report-note">
      <span class="note-icon"><el-icon><InfoFilled /></el-icon></span>
      <p>
        销售额为实际成交金额合计；毛利 = 销售额 - 按配件当前参考进货价估算的销售成本，
        未扣除房租、人工、运输和税费。采购额统计已完成采购入库单，不等同于销售成本。
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  ArrowRight,
  Calendar,
  InfoFilled,
  Refresh,
  Sell,
  ShoppingCart,
  Tickets,
  TrendCharts,
  Wallet,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import CategoryDonutChart from '@/components/CategoryDonutChart.vue'
import SalesTrendChart from '@/components/SalesTrendChart.vue'
import { getDashboardReport } from '@/api/dashboard'
import { getCurrentUser } from '@/utils/auth'
import {
  formatMoney,
  formatNumber,
  formatPercent,
  formatYuan,
  getGreeting,
} from '@/utils/format'

const QUICK_RANGES = [
  { key: '7d', label: '近7天' },
  { key: '30d', label: '近30天' },
  { key: '90d', label: '近90天' },
  { key: 'month', label: '本月' },
  { key: 'lastMonth', label: '上月' },
  { key: 'year', label: '今年' },
  { key: 'all', label: '全部' },
]

const currentUser = getCurrentUser()
const displayName =
  currentUser?.real_name ||
  currentUser?.name ||
  currentUser?.username ||
  '管理员'

const loading = ref(false)
const updatedAt = ref('')
const activeQuick = ref('90d')
const dateRange = ref([])
const report = reactive({
  startDate: '',
  endDate: '',
  dataStartDate: '',
  dataEndDate: '',
  salesAmount: 0,
  salesOrderCount: 0,
  itemsSold: 0,
  avgOrderAmount: 0,
  purchaseAmount: 0,
  purchaseOrderCount: 0,
  grossProfit: 0,
  grossMargin: 0,
  topParts: [],
  topCustomers: [],
  topSuppliers: [],
  categories: [],
  trend: [],
  trendGranularity: 'day',
})

const description = computed(() => {
  const range = report.startDate && report.endDate
    ? `${report.startDate} 至 ${report.endDate}`
    : '所选区间'
  return `${getGreeting()}，${displayName}。正在查看 ${range} 的销售、采购、毛利与排行，可用日期组件切换统计周期。`
})

const dataRangeText = computed(() => {
  if (!report.dataStartDate || !report.dataEndDate) return ''
  return `${report.dataStartDate} ~ ${report.dataEndDate}`
})

const granularityLabel = computed(() =>
  report.trendGranularity === 'month' ? '按月' : '按日',
)

const peakSales = computed(() =>
  report.trend.reduce(
    (peak, item) => Math.max(peak, Number(item.salesAmount) || 0),
    0,
  ),
)

const maxPartAmount = computed(() => maxAmount(report.topParts))
const maxCustomerAmount = computed(() => maxAmount(report.topCustomers))
const maxSupplierAmount = computed(() => maxAmount(report.topSuppliers))

function maxAmount(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.amount) || 0), 0)
}

function percentOf(value, max) {
  if (!max) return '0.0'
  return ((Number(value) || 0) / max * 100).toFixed(1)
}

function barWidth(value, max) {
  if (!max) return '0%'
  return `${Math.max(4, (Number(value) || 0) / max * 100)}%`
}

function inputDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function rangeFor(key) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const year = today.getFullYear()
  const month = today.getMonth()

  switch (key) {
    case '7d':
      return [inputDate(addDays(today, -6)), inputDate(today)]
    case '30d':
      return [inputDate(addDays(today, -29)), inputDate(today)]
    case '90d':
      return [inputDate(addDays(today, -89)), inputDate(today)]
    case 'month':
      return [inputDate(new Date(year, month, 1)), inputDate(today)]
    case 'lastMonth':
      return [
        inputDate(new Date(year, month - 1, 1)),
        inputDate(new Date(year, month, 0)),
      ]
    case 'year':
      return [inputDate(new Date(year, 0, 1)), inputDate(today)]
    case 'all':
      return [report.dataStartDate || '2000-01-01', inputDate(today)]
    default:
      return [inputDate(addDays(today, -89)), inputDate(today)]
  }
}

function setUpdatedTime() {
  updatedAt.value = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

function handleDateChange() {
  activeQuick.value = ''
}

function applyQuick(key) {
  activeQuick.value = key
  dateRange.value = rangeFor(key)
  loadReport()
}

async function loadReport(showSuccess = false) {
  if (loading.value) return

  const [startDate, endDate] = dateRange.value || []
  if (!startDate || !endDate) {
    ElMessage.warning('请选择完整的统计区间')
    return
  }

  loading.value = true
  try {
    const result = await getDashboardReport({
      start_date: startDate,
      end_date: endDate,
    })
    Object.assign(report, result)
    setUpdatedTime()
    if (showSuccess) {
      ElMessage.success('经营报表已刷新')
    }
  } catch {
    // 错误提示由 Axios 拦截器统一处理。
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  dateRange.value = rangeFor(activeQuick.value)
  loadReport()
})
</script>

<style scoped>
.dashboard-page {
  padding-bottom: 12px;
}

.updated-text {
  color: var(--erp-muted);
  font-size: 10px;
  white-space: nowrap;
}

.data-range-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 9px;
  border: 1px solid var(--erp-line);
  border-radius: 8px;
  color: var(--erp-muted);
  background: rgba(255, 255, 255, 0.58);
  font-size: 10.5px;
  white-space: nowrap;
}

.report-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 18px;
  padding: 14px 16px;
}

.toolbar-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-label {
  display: flex;
  min-width: 78px;
  flex-direction: column;
  gap: 2px;
}

.toolbar-label span {
  color: var(--erp-ink);
  font-size: 12px;
  font-weight: 650;
}

.toolbar-label small {
  color: var(--erp-muted);
  font-size: 9.5px;
}

.range-picker {
  width: 260px;
}

.quick-ranges {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border: 1px solid #edf0e8;
  border-radius: 9px;
  background: #f7f8f3;
}

.quick-range {
  padding: 6px 9px;
  border: 0;
  border-radius: 7px;
  color: #7c887e;
  background: transparent;
  font-size: 10.5px;
  cursor: pointer;
  transition: color 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
}

.quick-range:hover {
  color: var(--erp-green);
}

.quick-range.is-active {
  color: var(--erp-green);
  background: #fff;
  box-shadow: 0 2px 7px rgba(44, 74, 54, 0.09);
  font-weight: 650;
}

.stat-grid {
  display: grid;
  margin-bottom: 18px;
  gap: 14px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.stat-card {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 152px;
  overflow: hidden;
  padding: 19px 20px 17px;
  border: 1px solid var(--erp-line);
  border-radius: 18px;
  flex-direction: column;
  background: #fff;
  box-shadow: var(--erp-shadow-sm);
}

.stat-card--featured {
  color: #f9faf3;
  border-color: transparent;
  background:
    radial-gradient(circle at 100% 0, rgba(204, 226, 141, 0.2), transparent 42%),
    linear-gradient(150deg, #275b40 0%, #173f2c 100%);
  box-shadow: 0 18px 34px -24px rgba(21, 63, 42, 0.55);
}

.stat-card--cream {
  background:
    radial-gradient(circle at 100% 0, rgba(202, 181, 125, 0.17), transparent 44%),
    linear-gradient(150deg, #fbfaf4 0%, #f4f1e6 100%);
}

.stat-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #778379;
  font-size: 11.5px;
  font-weight: 600;
}

.stat-card--featured .stat-head {
  color: rgba(241, 246, 234, 0.62);
}

.stat-icon {
  display: grid;
  width: 29px;
  height: 29px;
  flex: 0 0 29px;
  place-items: center;
  border-radius: 8px;
  color: var(--erp-green);
  background: #f0f5e9;
  font-size: 14px;
}

.stat-icon--gold {
  color: #a27a3d;
  background: #faf3e5;
}

.stat-icon--sage {
  color: #637765;
  background: #f0f3eb;
}

.stat-card--featured .stat-icon {
  color: var(--erp-lime);
  background: rgba(255, 255, 255, 0.09);
}

.stat-value {
  position: relative;
  z-index: 1;
  display: block;
  overflow: hidden;
  margin-top: auto;
  padding-top: 18px;
  color: var(--erp-ink);
  font-size: clamp(23px, 2.1vw, 30px);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.045em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-card--featured .stat-value {
  color: #fdfdf7;
}

.stat-value.is-negative {
  color: var(--erp-danger);
}

.stat-value small {
  margin-right: 3px;
  font-size: 0.56em;
  font-weight: 550;
  letter-spacing: 0;
}

.stat-value small.stat-unit {
  margin-right: 0;
  margin-left: 5px;
  font-size: 0.42em;
  font-weight: 500;
}

.stat-foot {
  position: relative;
  z-index: 1;
  overflow: hidden;
  margin-top: 9px;
  color: #8b968d;
  font-size: 10.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-card--featured .stat-foot {
  color: rgba(236, 243, 228, 0.48);
}

.featured-orbit {
  position: absolute;
  right: -58px;
  bottom: -92px;
  width: 210px;
  height: 210px;
  border: 1px solid rgba(204, 226, 141, 0.11);
  border-radius: 50%;
  box-shadow:
    0 0 0 28px rgba(204, 226, 141, 0.035),
    0 0 0 56px rgba(204, 226, 141, 0.022);
}

.report-grid {
  display: grid;
  align-items: stretch;
  gap: 18px;
}

.report-grid--top {
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.9fr);
  margin-bottom: 18px;
}

.report-grid--rank {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.trend-card,
.category-card,
.rank-card {
  min-width: 0;
  padding: 22px 24px 18px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding-bottom: 12px;
}

.card-head--compact {
  padding-bottom: 8px;
}

.card-kicker {
  color: var(--erp-sage);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.card-head h2 {
  margin-top: 6px;
  color: var(--erp-ink);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.035em;
}

.card-head p {
  margin-top: 6px;
  color: var(--erp-muted);
  font-size: 11px;
  line-height: 1.55;
}

.unit-legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding-top: 5px;
  color: var(--erp-muted);
  font-size: 9.5px;
  white-space: nowrap;
}

.unit-legend i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--erp-green);
}

.chart-insight {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 2px -2px 0;
  padding: 11px 12px;
  border-top: 1px solid #f0f2eb;
  color: var(--erp-ink-soft);
  font-size: 10.5px;
}

.insight-mark {
  display: grid;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  place-items: center;
  border-radius: 7px;
  color: #9a753d;
  background: #faf3e5;
  font-size: 12px;
}

.chart-insight p {
  flex: 1;
  min-width: 0;
  line-height: 1.55;
}

.chart-insight strong {
  color: var(--erp-ink);
  font-weight: 650;
}

.text-link {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 3px;
  color: var(--erp-green);
  font-size: 10.5px;
  font-weight: 600;
}

.text-link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.rank-list {
  display: flex;
  margin: 2px 0 0;
  padding: 0;
  flex-direction: column;
  list-style: none;
}

.rank-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f2f4ee;
}

.rank-list li:last-child {
  border-bottom: 0;
  padding-bottom: 2px;
}

.rank-no {
  display: grid;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  margin-top: 1px;
  place-items: center;
  border-radius: 6px;
  color: #7f8d82;
  background: #f4f6f0;
  font-size: 9.5px;
  font-weight: 700;
}

.rank-list li:first-child .rank-no {
  color: #8b6428;
  background: #faf1df;
}

.rank-main {
  min-width: 0;
  flex: 1;
}

.rank-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.rank-title strong {
  overflow: hidden;
  color: var(--erp-ink);
  font-size: 11.5px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-title span {
  flex: 0 0 auto;
  color: var(--erp-green);
  font-size: 11px;
  font-weight: 650;
}

.rank-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 3px;
  color: var(--erp-muted);
  font-size: 9.5px;
}

.rank-track {
  overflow: hidden;
  height: 3px;
  margin-top: 6px;
  border-radius: 999px;
  background: #f0f3eb;
}

.rank-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #4d805f, #b6c99a);
  transition: width 400ms ease;
}

.rank-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: var(--erp-muted);
  font-size: 11px;
  text-align: center;
}

.report-note {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid #e6ebdc;
  border-radius: 12px;
  background: #f7f8f0;
  color: #7b887b;
  font-size: 10.5px;
  line-height: 1.65;
}

.note-icon {
  display: grid;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  margin-top: 1px;
  place-items: center;
  border-radius: 6px;
  color: #83955f;
  background: #edf2dc;
  font-size: 12px;
}

@media (max-width: 1260px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .report-grid--rank {
    grid-template-columns: 1fr 1fr;
  }

  .report-grid--rank .rank-card:last-child {
    grid-column: span 2;
  }
}

@media (max-width: 1080px) {
  .report-grid--top {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .report-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar-main {
    align-items: stretch;
    flex-direction: column;
  }

  .range-picker {
    width: 100%;
  }

  .quick-ranges {
    overflow-x: auto;
    justify-content: flex-start;
  }

  .quick-range {
    flex: 0 0 auto;
  }

  .stat-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    min-height: 140px;
  }

  .report-grid--rank {
    grid-template-columns: 1fr;
  }

  .report-grid--rank .rank-card:last-child {
    grid-column: auto;
  }

  .trend-card,
  .category-card,
  .rank-card {
    padding: 18px 15px 15px;
  }

  .card-head {
    flex-direction: column;
    gap: 6px;
  }

  .data-range-chip {
    display: none;
  }
}
</style>
