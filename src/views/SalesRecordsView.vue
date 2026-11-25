<template>
  <div class="page-shell sales-records-page">
    <PageHeader
      eyebrow="SALES LEDGER"
      title="销售记录"
      description="按日期、客户和销售单号查询历史出库单，查看每笔成交的配件明细与实际金额。"
    >
      <template #actions>
        <el-tag type="info" effect="plain" round>
          共 {{ formatNumber(total) }} 单
        </el-tag>
      </template>
    </PageHeader>

    <section class="surface-card filter-bar records-filters">
      <div class="filter-left">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          unlink-panels
          class="records-date"
        />
        <el-select
          v-model="filters.customerId"
          clearable
          filterable
          placeholder="全部客户"
          class="records-customer"
        >
          <el-option
            v-for="customer in customers"
            :key="customer.id"
            :label="customer.display_name || customer.name || `客户 #${customer.id}`"
            :value="customer.id"
          />
        </el-select>
        <el-input
          v-model="filters.keyword"
          clearable
          placeholder="销售单号关键词"
          :prefix-icon="Search"
          class="records-keyword"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button type="primary" :loading="loading" @click="handleSearch">
          查询
        </el-button>
        <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
      </div>
      <span class="result-hint">
        筛选总额
        <strong class="money">¥{{ formatYuan(totalAmount) }}</strong>
      </span>
    </section>

    <div class="summary-grid">
      <article class="summary-card summary-card--featured">
        <div class="summary-head">
          <span>筛选销售额</span>
          <span class="summary-icon"><el-icon><Wallet /></el-icon></span>
        </div>
        <strong class="summary-value money">
          <small>¥</small>{{ formatYuan(totalAmount) }}
        </strong>
        <p>当前筛选条件下的实收金额合计</p>
      </article>
      <article class="summary-card">
        <div class="summary-head">
          <span>销售单数</span>
          <span class="summary-icon"><el-icon><Tickets /></el-icon></span>
        </div>
        <strong class="summary-value">
          {{ formatNumber(total) }}<small class="summary-unit">单</small>
        </strong>
        <p>已完成销售出库单</p>
      </article>
      <article class="summary-card">
        <div class="summary-head">
          <span>平均单额</span>
          <span class="summary-icon summary-icon--gold"><el-icon><TrendCharts /></el-icon></span>
        </div>
        <strong class="summary-value money">
          <small>¥</small>{{ formatYuan(averageAmount) }}
        </strong>
        <p>筛选销售额 ÷ 销售单数</p>
      </article>
    </div>

    <section class="surface-card records-table-card">
      <header class="records-head">
        <div>
          <span class="card-kicker">OUTBOUND DOCUMENTS</span>
          <h2>销售单列表</h2>
          <p>点开任意一单，可以查看客户、操作人和配件明细。</p>
        </div>
        <span class="records-tip">
          <el-icon><InfoFilled /></el-icon>
          金额为实际成交金额
        </span>
      </header>

      <el-table
        v-loading="loading"
        :data="rows"
        row-key="id"
        stripe
        table-layout="fixed"
        class="records-table"
        :header-cell-style="{ background: '#f7f8f4' }"
      >
        <el-table-column label="销售单号" width="144">
          <template #default="{ row }">
            <div class="order-no-cell">
              <strong>{{ row.order_no }}</strong>
              <small>{{ statusText(row.status) }}</small>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="客户" width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="partner-cell">
              <span class="partner-avatar">{{ firstChar(row.customer_display_name || row.customer_name) }}</span>
              <strong>{{ row.customer_display_name || row.customer_name || `客户 #${row.customer_id}` }}</strong>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="配件明细" min-width="230" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="items-cell">
              <span>{{ itemSummary(row) }}</span>
              <small v-if="row.items?.length > 1">共 {{ row.items.length }} 种配件</small>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="数量" width="56" align="right">
          <template #default="{ row }">
            {{ formatNumber(orderQuantity(row)) }}
          </template>
        </el-table-column>

        <el-table-column label="金额" width="94" align="right">
          <template #default="{ row }">
            <span class="amount-cell money">¥{{ formatYuan(row.total_amount) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作人" width="82" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.operator_name || '—' }}
          </template>
        </el-table-column>

        <el-table-column label="时间" width="150" class-name="time-cell">
          <template #default="{ row }">
            {{ formatTableTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="68">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>

        <template #empty>
          <div class="table-empty">
            <span class="empty-icon"><el-icon><Tickets /></el-icon></span>
            <strong>没有找到销售记录</strong>
            <p>调整日期、客户或单号条件后再试，或者先去开一张销售出库单。</p>
            <el-button type="primary" @click="goCreateSale">去开销售单</el-button>
          </div>
        </template>
      </el-table>

      <footer class="table-footer">
        <span class="page-hint">
          第 {{ page }} 页，每页 {{ pageSize }} 条
        </span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          background
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="loadSales"
        />
      </footer>
    </section>

    <el-dialog
      v-model="detailVisible"
      width="780px"
      align-center
      destroy-on-close
      class="sale-detail-dialog"
    >
      <template #header>
        <div class="dialog-heading">
          <span class="dialog-icon"><el-icon><Tickets /></el-icon></span>
          <div>
            <h3>销售单详情</h3>
            <p>{{ selectedOrder?.order_no || '—' }}</p>
          </div>
        </div>
      </template>

      <template v-if="selectedOrder">
        <el-descriptions :column="isMobile ? 1 : 3" border size="small">
          <el-descriptions-item label="客户">
            {{ selectedOrder.customer_display_name || selectedOrder.customer_name || `客户 #${selectedOrder.customer_id}` }}
          </el-descriptions-item>
          <el-descriptions-item label="操作人">
            {{ selectedOrder.operator_name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="时间">
            {{ formatDateTime(selectedOrder.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag type="success" effect="light" round>
              {{ statusText(selectedOrder.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="销售金额">
            <strong class="detail-amount money">
              ¥{{ formatYuan(selectedOrder.total_amount) }}
            </strong>
          </el-descriptions-item>
          <el-descriptions-item label="备注">
            {{ selectedOrder.remark || '—' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-table-head">
          <span>配件明细</span>
          <small>实际成交单价</small>
        </div>
        <div v-if="isMobile" class="detail-items-mobile">
          <div
            v-for="item in selectedOrder.items || []"
            :key="item.part_id"
            class="detail-item-row"
          >
            <div class="detail-item-main">
              <strong>{{ item.part_name || `配件 #${item.part_id}` }}</strong>
              <small>
                {{ formatNumber(item.quantity) }} 件 × ¥{{ formatYuan(item.price) }}
              </small>
            </div>
            <strong class="money">¥{{ formatYuan(item.amount) }}</strong>
          </div>
        </div>
        <el-table v-else :data="selectedOrder.items || []" size="small" border>
          <el-table-column label="配件" min-width="220">
            <template #default="{ row }">
              <strong>{{ row.part_name || `配件 #${row.part_id}` }}</strong>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="90" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.quantity) }}
            </template>
          </el-table-column>
          <el-table-column label="成交单价" width="120" align="right">
            <template #default="{ row }">
              ¥{{ formatYuan(row.price) }}
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120" align="right">
            <template #default="{ row }">
              <strong class="money">¥{{ formatYuan(row.amount) }}</strong>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  InfoFilled,
  RefreshLeft,
  Search,
  Tickets,
  TrendCharts,
  Wallet,
} from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { listSales } from '@/api/sales'
import { getCustomers } from '@/api/customers'
import { formatYuan, formatNumber } from '@/utils/format'

const router = useRouter()

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const totalAmount = ref(0)
const page = ref(1)
const pageSize = ref(20)
const dateRange = ref([])
const customers = ref([])
const filters = reactive({
  customerId: '',
  keyword: '',
})

const detailVisible = ref(false)
const selectedOrder = ref(null)

const averageAmount = computed(() =>
  total.value > 0 ? totalAmount.value / total.value : 0,
)

const isMobile = ref(typeof window !== 'undefined' && window.innerWidth < 720)

function firstChar(name) {
  return String(name || '客').trim().slice(0, 1).toUpperCase()
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function formatTableTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function statusText(status) {
  return status === 'completed' ? '已完成' : status === 'pending' ? '待处理' : status || '—'
}

function orderQuantity(order) {
  return (order.items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0,
  )
}

function itemSummary(order) {
  const items = order.items || []
  if (!items.length) return '—'
  const first = items[0].part_name || `配件 #${items[0].part_id}`
  return items.length > 1 ? `${first} 等 ${items.length} 种` : first
}

async function loadCustomers() {
  try {
    customers.value = await getCustomers()
  } catch {
    customers.value = []
  }
}

async function loadSales() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: pageSize.value,
    }
    if (filters.customerId !== '' && filters.customerId !== null) {
      params.customer_id = filters.customerId
    }
    if (filters.keyword.trim()) {
      params.keyword = filters.keyword.trim()
    }
    if (dateRange.value?.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }

    const result = await listSales(params)
    rows.value = result?.items || []
    total.value = Number(result?.total) || 0
    totalAmount.value = Number(result?.total_amount) || 0
  } catch {
    // 错误提示由 Axios 拦截器统一处理。
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadSales()
}

function handleReset() {
  dateRange.value = []
  filters.customerId = ''
  filters.keyword = ''
  page.value = 1
  loadSales()
}

function handleSizeChange() {
  page.value = 1
  loadSales()
}

function openDetail(row) {
  selectedOrder.value = row
  detailVisible.value = true
}

function goCreateSale() {
  router.push('/sale')
}

function syncViewport() {
  isMobile.value = window.innerWidth < 720
}

onMounted(() => {
  syncViewport()
  window.addEventListener('resize', syncViewport)
  loadCustomers()
  loadSales()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewport)
})
</script>

<style scoped>
.sales-records-page {
  padding-bottom: 10px;
}

.records-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 14px 16px;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.records-date {
  width: 250px;
}

.records-customer {
  width: 160px;
}

.records-keyword {
  width: 190px;
}

.result-hint {
  color: var(--erp-muted);
  font-size: 12px;
  white-space: nowrap;
}

.result-hint strong {
  margin-left: 4px;
  color: var(--erp-green);
  font-size: 14px;
}

.summary-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 1.25fr 1fr 1fr;
  margin-bottom: 18px;
}

.summary-card {
  position: relative;
  display: flex;
  min-height: 128px;
  overflow: hidden;
  padding: 18px 20px;
  border: 1px solid var(--erp-line);
  border-radius: 18px;
  flex-direction: column;
  background: #fff;
  box-shadow: var(--erp-shadow-sm);
}

.summary-card--featured {
  color: #f9faf3;
  border-color: transparent;
  background:
    radial-gradient(circle at 100% 0, rgba(204, 226, 141, 0.18), transparent 44%),
    linear-gradient(150deg, #275b40 0%, #173f2c 100%);
}

.summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #7c887e;
  font-size: 11.5px;
  font-weight: 600;
}

.summary-card--featured .summary-head {
  color: rgba(241, 246, 234, 0.62);
}

.summary-icon {
  display: grid;
  width: 29px;
  height: 29px;
  place-items: center;
  border-radius: 8px;
  color: var(--erp-green);
  background: #f0f5e9;
  font-size: 14px;
}

.summary-icon--gold {
  color: #a27a3d;
  background: #faf3e5;
}

.summary-card--featured .summary-icon {
  color: var(--erp-lime);
  background: rgba(255, 255, 255, 0.09);
}

.summary-value {
  margin-top: auto;
  padding-top: 16px;
  color: var(--erp-ink);
  font-size: clamp(23px, 2.1vw, 29px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.04em;
}

.summary-card--featured .summary-value {
  color: #fdfdf7;
}

.summary-value small {
  margin-right: 2px;
  font-size: 0.58em;
  font-weight: 550;
}

.summary-value .summary-unit {
  margin-right: 0;
  margin-left: 5px;
  font-size: 0.45em;
  font-weight: 500;
}

.summary-card p {
  margin-top: 8px;
  color: #8b968d;
  font-size: 10.5px;
}

.summary-card--featured p {
  color: rgba(236, 243, 228, 0.46);
}

.records-table :deep(.time-cell .cell) {
  white-space: nowrap;
}

.records-table-card {
  padding: 22px 24px 16px;
}

.records-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding-bottom: 15px;
}

.card-kicker {
  color: var(--erp-sage);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.records-head h2 {
  margin-top: 6px;
  color: var(--erp-ink);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.035em;
}

.records-head p {
  margin-top: 6px;
  color: var(--erp-muted);
  font-size: 11.5px;
}

.records-tip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding-top: 4px;
  color: var(--erp-muted);
  font-size: 10.5px;
  white-space: nowrap;
}

.order-no-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.order-no-cell strong {
  color: var(--erp-ink);
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.01em;
}

.order-no-cell small {
  color: var(--erp-muted);
  font-size: 10px;
}

.partner-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.partner-avatar {
  display: grid;
  width: 27px;
  height: 27px;
  flex: 0 0 27px;
  place-items: center;
  border-radius: 8px;
  color: var(--erp-green);
  background: #edf4e8;
  font-size: 11px;
  font-weight: 700;
}

.partner-cell strong {
  overflow: hidden;
  color: var(--erp-ink-soft);
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.items-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  color: var(--erp-ink-soft);
  font-size: 12px;
}

.items-cell small {
  color: var(--erp-muted);
  font-size: 10px;
}

.amount-cell {
  color: var(--erp-ink);
  font-size: 13px;
  font-weight: 650;
}

.dialog-heading {
  display: flex;
  align-items: center;
  gap: 11px;
}

.dialog-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 11px;
  color: var(--erp-green);
  background: var(--erp-lime-soft);
  font-size: 18px;
}

.dialog-heading h3 {
  color: var(--erp-ink);
  font-size: 17px;
  font-weight: 700;
}

.dialog-heading p {
  margin-top: 3px;
  color: var(--erp-muted);
  font-size: 11px;
}

.detail-amount {
  color: var(--erp-green);
  font-size: 16px;
}

.detail-table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 18px 0 9px;
}

.detail-table-head span {
  color: var(--erp-ink);
  font-size: 13px;
  font-weight: 650;
}

.detail-table-head small {
  color: var(--erp-muted);
  font-size: 10.5px;
}

.table-empty {
  display: flex;
  align-items: center;
  padding: 44px 20px;
  flex-direction: column;
  text-align: center;
}

.empty-icon {
  display: grid;
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  place-items: center;
  border-radius: 14px;
  color: var(--erp-green);
  background: var(--erp-lime-soft);
  font-size: 21px;
}

.table-empty strong {
  color: var(--erp-ink);
  font-size: 13px;
}

.table-empty p {
  max-width: 380px;
  margin: 6px 0 14px;
  color: var(--erp-muted);
  font-size: 11.5px;
  line-height: 1.6;
}

.detail-items-mobile {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--erp-line);
  border-radius: 10px;
}

.detail-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 12px;
  border-bottom: 1px solid #f1f3ec;
}

.detail-item-row:last-child {
  border-bottom: 0;
}

.detail-item-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.detail-item-main strong {
  overflow: hidden;
  color: var(--erp-ink);
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-item-main small {
  color: var(--erp-muted);
  font-size: 10px;
}

.detail-item-row > strong {
  flex: 0 0 auto;
  color: var(--erp-green);
  font-size: 12px;
}

@media (max-width: 1080px) {
  .summary-grid {
    grid-template-columns: 1fr 1fr;
  }

  .summary-card--featured {
    grid-column: span 2;
  }
}

@media (max-width: 720px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-card--featured {
    grid-column: auto;
  }

  .records-filters,
  .filter-left {
    align-items: stretch;
    flex-direction: column;
  }

  .records-date,
  .records-customer,
  .records-keyword {
    width: 100%;
  }

  .result-hint {
    align-self: stretch;
    line-height: 1.6;
    text-align: right;
    white-space: normal;
  }

  .records-table :deep(.time-cell .cell) {
  white-space: nowrap;
}

.records-table-card {
    padding: 18px 14px 12px;
  }

  .records-head {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
