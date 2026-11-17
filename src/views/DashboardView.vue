<template>
  <div class="page-shell dashboard-page">
    <PageHeader
      eyebrow="OPERATIONS OVERVIEW"
      title="数据看板"
      :description="description"
    >
      <template #actions>
        <span v-if="updatedAt" class="updated-at">更新于 {{ updatedAt }}</span>
        <el-button :icon="Refresh" :loading="loading" @click="refreshData">
          刷新数据
        </el-button>
      </template>
    </PageHeader>

    <div v-if="!isReady" class="stat-grid">
      <div v-for="index in 4" :key="index" class="stat-card skeleton-card">
        <el-skeleton :rows="3" animated />
      </div>
    </div>

    <div v-else class="stat-grid">
      <article class="stat-card stat-card--featured">
        <div class="stat-head">
          <span>今日销售额</span>
          <span class="stat-icon"><el-icon><Sell /></el-icon></span>
        </div>
        <strong class="stat-value money">
          <small>¥</small>{{ formatMoney(dashboard.todaySales) }}
        </strong>
        <p class="stat-foot">今日销售出库实时汇总</p>
        <span class="featured-orbit" aria-hidden="true" />
      </article>

      <article class="stat-card stat-card--cream">
        <div class="stat-head">
          <span>本月销售额</span>
          <span class="stat-icon"><el-icon><Wallet /></el-icon></span>
        </div>
        <strong class="stat-value money">
          <small>¥</small>{{ formatMoney(dashboard.monthSales) }}
        </strong>
        <p class="stat-foot">本月累计销售金额</p>
      </article>

      <article class="stat-card">
        <div class="stat-head">
          <span>销量冠军</span>
          <span class="stat-icon stat-icon--gold">
            <el-icon><Trophy /></el-icon>
          </span>
        </div>
        <strong class="stat-value stat-value--text" :title="topPart?.name">
          {{ topPart?.name || '暂无数据' }}
        </strong>
        <p class="stat-foot">
          {{ topPart ? `${topPart.model || '未填写型号'} · 售出 ${formatNumber(topPart.quantity)} 件` : '暂无销售记录' }}
        </p>
      </article>

      <article class="stat-card">
        <div class="stat-head">
          <span>TOP 5 总销量</span>
          <span class="stat-icon"><el-icon><TrendCharts /></el-icon></span>
        </div>
        <strong class="stat-value money">
          {{ formatNumber(topSalesTotal) }}<small class="stat-unit">件</small>
        </strong>
        <p class="stat-foot">热销前五名配件累计销量</p>
      </article>
    </div>

    <div class="dashboard-main">
      <section v-loading="loading" class="surface-card chart-card">
        <header class="card-head">
          <div>
            <span class="card-kicker">SALES RANKING</span>
            <h2>销量 Top 5 配件</h2>
            <p>按本期销售数量排序，洞察最受欢迎的农机配件。</p>
          </div>
          <span class="unit-legend"><i /> 单位：件</span>
        </header>

        <TopPartsChart :data="dashboard.topParts" />

        <footer v-if="topPart" class="chart-insight">
          <span class="insight-mark"><el-icon><Trophy /></el-icon></span>
          <p>
            <strong>{{ topPart.name }}</strong>
            暂居销量榜首，已售出 {{ formatNumber(topPart.quantity) }} 件。
          </p>
          <router-link to="/sale" class="text-link">
            去开销售单
            <el-icon><ArrowRight /></el-icon>
          </router-link>
        </footer>
      </section>

      <aside class="dashboard-side">
        <section class="surface-card quick-card">
          <header class="side-head">
            <div>
              <span class="card-kicker">QUICK START</span>
              <h2>常用操作</h2>
            </div>
            <span class="side-badge">快捷入口</span>
          </header>

          <div class="quick-list">
            <router-link to="/purchase" class="quick-link">
              <span class="quick-icon quick-icon--green">
                <el-icon><ShoppingCart /></el-icon>
              </span>
              <span class="quick-copy">
                <strong>采购入库</strong>
                <small>登记到货与采购成本</small>
              </span>
              <el-icon class="quick-arrow"><ArrowRight /></el-icon>
            </router-link>

            <router-link to="/sale" class="quick-link">
              <span class="quick-icon quick-icon--gold">
                <el-icon><Sell /></el-icon>
              </span>
              <span class="quick-copy">
                <strong>销售出库</strong>
                <small>为客户快速开具销售单</small>
              </span>
              <el-icon class="quick-arrow"><ArrowRight /></el-icon>
            </router-link>

            <router-link to="/parts" class="quick-link">
              <span class="quick-icon quick-icon--sage">
                <el-icon><Box /></el-icon>
              </span>
              <span class="quick-copy">
                <strong>配件档案</strong>
                <small>维护配件与安全库存</small>
              </span>
              <el-icon class="quick-arrow"><ArrowRight /></el-icon>
            </router-link>
          </div>
        </section>

        <section class="care-card">
          <span class="care-icon"><el-icon><Warning /></el-icon></span>
          <span class="care-eyebrow">INVENTORY CARE</span>
          <h3>让库存始终保持在<br />安全线之上</h3>
          <p>当配件库存低于或等于安全库存，系统会自动将其列入预警清单。</p>
          <router-link to="/warning" class="care-link">
            查看库存预警
            <el-icon><ArrowRight /></el-icon>
          </router-link>
          <span class="care-decoration" aria-hidden="true" />
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ArrowRight,
  Box,
  Refresh,
  Sell,
  ShoppingCart,
  TrendCharts,
  Trophy,
  Wallet,
  Warning,
} from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import TopPartsChart from '@/components/TopPartsChart.vue'
import { getDashboard } from '@/api/dashboard'
import { getCurrentUser } from '@/utils/auth'
import {
  formatMoney,
  formatNumber,
  getGreeting,
} from '@/utils/format'

const currentUser = getCurrentUser()
const displayName =
  currentUser?.real_name ||
  currentUser?.name ||
  currentUser?.username ||
  '管理员'

const loading = ref(false)
const isReady = ref(false)
const updatedAt = ref('')
const dashboard = reactive({
  todaySales: 0,
  monthSales: 0,
  topParts: [],
})

const description = computed(
  () =>
    `${getGreeting()}，${displayName}。这里汇总了今日经营表现与热销配件走势，方便你及时安排补货与销售。`,
)

const topPart = computed(() => dashboard.topParts[0] || null)
const topSalesTotal = computed(() =>
  dashboard.topParts.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0,
  ),
)

function setUpdatedTime() {
  updatedAt.value = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

async function loadDashboard(showSuccess = false) {
  if (loading.value) return
  loading.value = true
  try {
    const result = await getDashboard()
    dashboard.todaySales = result.todaySales
    dashboard.monthSales = result.monthSales
    dashboard.topParts = result.topParts
    if (showSuccess) {
      ElMessage.success('看板数据已更新')
    }
  } catch {
    // 错误信息由 Axios 响应拦截器统一提示。
  } finally {
    isReady.value = true
    loading.value = false
    setUpdatedTime()
  }
}

function refreshData() {
  loadDashboard(true)
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.updated-at {
  color: var(--erp-muted);
  font-size: 11px;
  white-space: nowrap;
}

.stat-grid {
  display: grid;
  margin-bottom: 20px;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.stat-card {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 172px;
  overflow: hidden;
  padding: 21px 22px 20px;
  border: 1px solid var(--erp-line);
  border-radius: 18px;
  flex-direction: column;
  background: #fff;
  box-shadow: var(--erp-shadow-sm);
}

.skeleton-card {
  display: flex;
  justify-content: center;
  flex-direction: column;
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
  font-size: 12px;
  font-weight: 600;
}

.stat-card--featured .stat-head {
  color: rgba(241, 246, 234, 0.6);
}

.stat-icon {
  display: grid;
  width: 31px;
  height: 31px;
  flex: 0 0 31px;
  place-items: center;
  border-radius: 9px;
  color: var(--erp-green);
  background: #f0f5e9;
  font-size: 15px;
}

.stat-card--featured .stat-icon {
  color: var(--erp-lime);
  background: rgba(255, 255, 255, 0.09);
}

.stat-icon--gold {
  color: #a27a3d;
  background: #faf3e5;
}

.stat-value {
  position: relative;
  z-index: 1;
  display: block;
  overflow: hidden;
  margin-top: auto;
  padding-top: 22px;
  color: var(--erp-ink);
  font-size: clamp(25px, 2.3vw, 33px);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.045em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-card--featured .stat-value {
  color: #fdfdf7;
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

.stat-value--text {
  font-size: clamp(20px, 1.8vw, 25px);
  letter-spacing: -0.04em;
}

.stat-foot {
  position: relative;
  z-index: 1;
  overflow: hidden;
  margin-top: 11px;
  color: #8b968d;
  font-size: 10.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-card--featured .stat-foot {
  color: rgba(236, 243, 228, 0.44);
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

.dashboard-main {
  display: grid;
  align-items: stretch;
  gap: 20px;
  grid-template-columns: minmax(0, 1fr) 304px;
}

.chart-card {
  min-width: 0;
  padding: 24px 26px 20px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 12px;
}

.card-kicker {
  color: var(--erp-sage);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.card-head h2,
.side-head h2 {
  margin-top: 6px;
  color: var(--erp-ink);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.035em;
}

.card-head p {
  margin-top: 7px;
  color: var(--erp-muted);
  font-size: 11.5px;
  line-height: 1.6;
}

.unit-legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding-top: 5px;
  color: var(--erp-muted);
  font-size: 10px;
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
  gap: 10px;
  margin: 4px -2px 0;
  padding: 12px 14px;
  border-top: 1px solid #f0f2eb;
  color: var(--erp-ink-soft);
  font-size: 11px;
}

.insight-mark {
  display: grid;
  width: 25px;
  height: 25px;
  flex: 0 0 25px;
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
  font-size: 11px;
  font-weight: 600;
}

.text-link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.dashboard-side {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 20px;
}

.quick-card {
  padding: 22px;
}

.side-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.side-badge {
  padding: 4px 7px;
  border-radius: 6px;
  color: #7d8a7e;
  background: #f4f6f0;
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
}

.quick-list {
  display: flex;
  margin-top: 8px;
  flex-direction: column;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 2px;
  border-bottom: 1px solid #f2f4ee;
  transition: transform 160ms ease;
}

.quick-link:last-child {
  border-bottom: 0;
}

.quick-link:hover {
  transform: translateX(3px);
}

.quick-icon {
  display: grid;
  width: 37px;
  height: 37px;
  flex: 0 0 37px;
  place-items: center;
  border-radius: 11px;
  font-size: 16px;
}

.quick-icon--green {
  color: var(--erp-green);
  background: #edf4e8;
}

.quick-icon--gold {
  color: #a77935;
  background: #faf2e2;
}

.quick-icon--sage {
  color: #637765;
  background: #f0f3eb;
}

.quick-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.quick-copy strong {
  color: var(--erp-ink);
  font-size: 12.5px;
  font-weight: 600;
}

.quick-copy small {
  color: var(--erp-muted);
  font-size: 10px;
}

.quick-arrow {
  color: #bcc5ba;
  font-size: 12px;
  transition: color 160ms ease;
}

.quick-link:hover .quick-arrow {
  color: var(--erp-green);
}

.care-card {
  position: relative;
  overflow: hidden;
  flex: 1;
  min-height: 220px;
  padding: 23px 23px 21px;
  border: 1px solid #e1e7d5;
  border-radius: 20px;
  background:
    radial-gradient(circle at 100% 0, rgba(204, 226, 141, 0.42), transparent 38%),
    linear-gradient(150deg, #f5f7e9 0%, #ebf0dd 100%);
}

.care-icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid rgba(83, 112, 72, 0.14);
  border-radius: 10px;
  color: #66824f;
  background: rgba(255, 255, 255, 0.52);
  font-size: 16px;
}

.care-eyebrow {
  display: block;
  margin-top: 18px;
  color: #82936f;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.care-card h3 {
  position: relative;
  z-index: 1;
  margin-top: 6px;
  color: #33482f;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: -0.035em;
}

.care-card p {
  position: relative;
  z-index: 1;
  margin-top: 10px;
  color: #78866f;
  font-size: 10.5px;
  line-height: 1.75;
}

.care-link {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 17px;
  color: #46663c;
  font-size: 11px;
  font-weight: 650;
}

.care-link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.care-decoration {
  position: absolute;
  right: -46px;
  bottom: -58px;
  width: 150px;
  height: 150px;
  border: 1px solid rgba(98, 123, 80, 0.12);
  border-radius: 50%;
  box-shadow:
    0 0 0 22px rgba(255, 255, 255, 0.2),
    0 0 0 44px rgba(255, 255, 255, 0.12);
}

@media (max-width: 1260px) {
  .dashboard-main {
    grid-template-columns: minmax(0, 1fr) 286px;
  }

  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1080px) {
  .dashboard-main {
    grid-template-columns: 1fr;
  }

  .dashboard-side {
    display: grid;
    align-items: stretch;
    grid-template-columns: 1fr 1fr;
  }

  .quick-card {
    min-height: 250px;
  }

  .care-card {
    min-height: 250px;
  }
}

@media (max-width: 700px) {
  .stat-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    min-height: 154px;
    padding: 19px 20px 18px;
  }

  .dashboard-side {
    grid-template-columns: 1fr;
  }

  .chart-card {
    padding: 20px 16px 16px;
  }

  .updated-at {
    display: none;
  }

  .card-head {
    flex-direction: column;
    gap: 8px;
  }

  .unit-legend {
    padding-top: 0;
  }

  .chart-insight {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .text-link {
    margin-left: 35px;
  }

  .quick-card {
    min-height: auto;
  }
}
</style>
