<template>
  <div class="page-shell warning-page">
    <PageHeader
      eyebrow="STOCK ALERTS"
      title="库存预警"
      description="关注库存低于安全线的配件，及时安排采购补货，避免影响销售与农忙作业。"
    >
      <template #actions>
        <el-button :icon="Refresh" :loading="loading" @click="refreshWarnings">
          刷新预警
        </el-button>
        <el-button type="primary" :icon="ShoppingCart" @click="goPurchase">
          去采购入库
        </el-button>
      </template>
    </PageHeader>

    <section class="warning-banner" :class="{ 'is-clear': !loading && rows.length === 0 }">
      <div class="banner-main">
        <span class="banner-mark">
          <el-icon><WarningFilled v-if="rows.length || loading" /><CircleCheckFilled v-else /></el-icon>
        </span>
        <div class="banner-copy">
          <span class="banner-kicker">
            {{ rows.length ? 'ATTENTION REQUIRED' : 'INVENTORY HEALTHY' }}
          </span>
          <h2 v-if="loading && !isReady">正在检查库存状态…</h2>
          <h2 v-else-if="rows.length">当前有 {{ formatNumber(rows.length) }} 种配件需要补货关注</h2>
          <h2 v-else>所有配件库存均处于安全线之上</h2>
          <p v-if="rows.length">建议优先处理库存缺口较大的配件，保障后续销售供应。</p>
          <p v-else>暂无预警配件，继续保持库存健康。</p>
        </div>
      </div>

      <div v-if="rows.length" class="banner-stats">
        <div>
          <span>预警配件</span>
          <strong>{{ formatNumber(rows.length) }}<small>种</small></strong>
        </div>
        <div>
          <span>库存总缺口</span>
          <strong>{{ formatNumber(totalGap) }}<small>件</small></strong>
        </div>
      </div>

      <span class="banner-decoration" aria-hidden="true" />
    </section>

    <section class="surface-card warning-table-card">
      <header class="table-card-head">
        <div>
          <span class="card-kicker">WARNING LIST</span>
          <h2>预警清单</h2>
          <p>当前库存小于或等于安全库存的配件会自动出现在这里。</p>
        </div>
        <div class="table-meta">
          <span v-if="updatedAt">更新于 {{ updatedAt }}</span>
          <el-tag v-if="rows.length" type="danger" effect="light" round>
            {{ rows.length }} 项待处理
          </el-tag>
          <el-tag v-else type="success" effect="light" round>
            库存健康
          </el-tag>
        </div>
      </header>

      <el-table
        v-loading="loading"
        :data="rows"
        row-key="id"
        class="warning-table"
        :row-class-name="({ row }) => (row.stock < row.safe_stock ? 'row-critical' : 'row-borderline')"
      >
        <el-table-column label="配件名称" min-width="210">
          <template #default="{ row }">
            <div class="part-name-cell">
              <span class="part-avatar">{{ firstChar(row.name) }}</span>
              <span class="part-name-copy">
                <strong>{{ row.name || '未命名配件' }}</strong>
                <small>{{ row.model || '未填写型号' }}</small>
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="分类" min-width="115" show-overflow-tooltip>
          <template #default="{ row }">{{ row.category || '未分类' }}</template>
        </el-table-column>

        <el-table-column label="品牌" min-width="115" show-overflow-tooltip>
          <template #default="{ row }">{{ row.brand || '—' }}</template>
        </el-table-column>

        <el-table-column label="当前库存" width="118">
          <template #default="{ row }">
            <el-tag type="danger" effect="light" round class="stock-alert-tag">
              <el-icon><WarningFilled /></el-icon>
              {{ formatNumber(row.stock) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="安全库存" width="106">
          <template #default="{ row }">
            <span class="safe-value">{{ formatNumber(row.safe_stock) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="库存缺口" width="106">
          <template #default="{ row }">
            <span class="gap-value">{{ formatNumber(stockGap(row)) }} 件</span>
          </template>
        </el-table-column>

        <el-table-column label="建议" min-width="134">
          <template #default="{ row }">
            <span class="suggestion">
              {{ row.stock < row.safe_stock ? '尽快安排补货' : '已到安全线，建议补货' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="106" fixed="right">
          <template #default="{ row }">
            <el-button text class="restock-button" @click="goPurchase(row)">
              立即补货
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </template>
        </el-table-column>

        <template #empty>
          <div class="healthy-empty">
            <span class="healthy-mark"><el-icon><CircleCheckFilled /></el-icon></span>
            <strong>库存状态良好</strong>
            <p>所有配件当前库存均高于安全库存，暂无需要补货的配件。</p>
            <el-button plain @click="goPurchase">去采购入库</el-button>
          </div>
        </template>
      </el-table>

      <footer class="warning-footer">
        <span>
          <el-icon><InfoFilled /></el-icon>
          预警口径：当前库存 ≤ 安全库存
        </span>
        <span>请结合销售节奏安排补货数量</span>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowRight,
  CircleCheckFilled,
  InfoFilled,
  Refresh,
  ShoppingCart,
  WarningFilled,
} from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { getWarningParts } from '@/api/parts'
import { formatNumber } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const isReady = ref(false)
const rows = ref([])
const updatedAt = ref('')

const totalGap = computed(() =>
  rows.value.reduce((total, part) => total + stockGap(part), 0),
)

function stockGap(part) {
  return Math.max(0, Number(part.safe_stock || 0) - Number(part.stock || 0))
}

function firstChar(name) {
  return String(name || '配').trim().slice(0, 1).toUpperCase()
}

function setUpdatedTime() {
  updatedAt.value = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

async function loadWarnings(showSuccess = false) {
  if (loading.value) return
  loading.value = true
  try {
    rows.value = await getWarningParts()
    if (showSuccess) {
      // 使用轻提示保持页面聚焦，避免重复弹窗。
      ElMessage.success('库存预警已更新')
    }
  } catch {
    // 错误提示由 Axios 拦截器统一处理。
  } finally {
    loading.value = false
    isReady.value = true
    setUpdatedTime()
  }
}

function refreshWarnings() {
  loadWarnings(true)
}

function goPurchase(part) {
  const query = part?.id !== undefined ? { part_id: part.id } : {}
  router.push({ path: '/purchase', query })
}

onMounted(() => {
  loadWarnings()
})
</script>

<style scoped>
.warning-banner {
  position: relative;
  display: flex;
  min-height: 148px;
  overflow: hidden;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 18px;
  padding: 25px 28px;
  border: 1px solid #eddcd4;
  border-radius: 20px;
  background:
    radial-gradient(circle at 92% 10%, rgba(219, 167, 140, 0.25), transparent 36%),
    linear-gradient(120deg, #fdf8f4 0%, #faf3ed 100%);
}

.warning-banner.is-clear {
  border-color: #dfe9d5;
  background:
    radial-gradient(circle at 92% 10%, rgba(204, 226, 141, 0.32), transparent 36%),
    linear-gradient(120deg, #f8faf3 0%, #f0f5e7 100%);
}

.banner-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.banner-mark {
  display: grid;
  width: 45px;
  height: 45px;
  flex: 0 0 45px;
  place-items: center;
  border: 1px solid #f0d8cd;
  border-radius: 13px;
  color: #b5674d;
  background: rgba(255, 255, 255, 0.6);
  font-size: 20px;
}

.is-clear .banner-mark {
  border-color: #dfe8d4;
  color: #6d8b5c;
}

.banner-kicker {
  color: #b1836c;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.is-clear .banner-kicker {
  color: #8c9e7c;
}

.banner-copy h2 {
  margin-top: 7px;
  color: #4a372f;
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.is-clear .banner-copy h2 {
  color: #33482f;
}

.banner-copy p {
  margin-top: 7px;
  color: #998277;
  font-size: 11px;
  line-height: 1.6;
}

.is-clear .banner-copy p {
  color: #85947c;
}

.banner-stats {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 0 0 auto;
  gap: 28px;
  padding-right: 4px;
}

.banner-stats > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 75px;
}

.banner-stats span {
  color: #a38d80;
  font-size: 9.5px;
}

.banner-stats strong {
  color: #5f4033;
  font-size: 27px;
  font-weight: 700;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}

.banner-stats small {
  margin-left: 3px;
  color: #a58f83;
  font-size: 9px;
  font-weight: 500;
}

.banner-decoration {
  position: absolute;
  right: -44px;
  bottom: -78px;
  width: 190px;
  height: 190px;
  border: 1px solid rgba(168, 119, 89, 0.1);
  border-radius: 50%;
  box-shadow:
    0 0 0 26px rgba(255, 255, 255, 0.16),
    0 0 0 52px rgba(255, 255, 255, 0.1);
}

.is-clear .banner-decoration {
  border-color: rgba(109, 139, 92, 0.1);
}

.warning-table-card {
  overflow: hidden;
}

.table-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px 16px;
}

.card-kicker {
  color: var(--erp-sage);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.table-card-head h2 {
  margin-top: 5px;
  color: var(--erp-ink);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.table-card-head p {
  margin-top: 5px;
  color: var(--erp-muted);
  font-size: 10.5px;
}

.table-meta {
  display: flex;
  align-items: center;
  gap: 11px;
  color: var(--erp-muted);
  font-size: 9.5px;
  white-space: nowrap;
}

.warning-table :deep(.row-critical) {
  background: #fffdfa;
}

.warning-table :deep(.row-critical:hover > td.el-table__cell) {
  background: #fcf8f4 !important;
}

.warning-table :deep(.row-borderline) {
  background: #fffefa;
}

.part-name-cell {
  display: flex;
  align-items: center;
  gap: 11px;
}

.part-avatar {
  display: grid;
  width: 35px;
  height: 35px;
  flex: 0 0 35px;
  place-items: center;
  border: 1px solid #f0ded6;
  border-radius: 10px;
  color: #a16a55;
  background: #fbf1ec;
  font-size: 12px;
  font-weight: 700;
}

.part-name-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.part-name-copy strong {
  overflow: hidden;
  color: var(--erp-ink);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.part-name-copy small {
  color: #a2aca4;
  font-size: 9.5px;
}

.stock-alert-tag {
  gap: 4px;
  height: 25px;
  padding: 0 9px;
  border-color: #f0d3cd;
  color: var(--erp-danger);
  background: #fcf1ee;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.stock-alert-tag .el-icon {
  font-size: 11px;
}

.safe-value {
  color: #6f7d71;
  font-variant-numeric: tabular-nums;
}

.gap-value {
  color: #b96048;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

.suggestion {
  color: #8b796d;
  font-size: 11px;
}

.restock-button {
  height: 28px;
  min-height: 28px;
  padding: 0;
  color: var(--erp-green);
  font-size: 10.5px;
}

.restock-button:hover {
  color: var(--erp-green-deep);
  background: transparent;
}

.restock-button .el-icon {
  margin-left: 2px;
  font-size: 10px;
}

.healthy-empty {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 46px 20px 42px;
}

.healthy-mark {
  display: grid;
  width: 55px;
  height: 55px;
  margin-bottom: 14px;
  place-items: center;
  border-radius: 17px;
  color: #6f915e;
  background: #eff5e7;
  font-size: 25px;
}

.healthy-empty strong {
  color: var(--erp-ink);
  font-size: 14px;
  font-weight: 650;
}

.healthy-empty p {
  margin: 6px 0 18px;
  color: var(--erp-muted);
  font-size: 10.5px;
}

.warning-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 24px 15px;
  border-top: 1px solid #f0f2ec;
  color: #a0aaa1;
  font-size: 9.5px;
}

.warning-footer span:first-child {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.warning-footer .el-icon {
  color: #b3bdb1;
}

@media (max-width: 880px) {
  .warning-banner {
    align-items: flex-start;
    flex-direction: column;
    gap: 20px;
    padding: 22px;
  }

  .banner-stats {
    padding-left: 60px;
  }
}

@media (max-width: 640px) {
  .warning-banner {
    padding: 18px;
  }

  .banner-main {
    gap: 11px;
  }

  .banner-mark {
    width: 38px;
    height: 38px;
    flex-basis: 38px;
    border-radius: 11px;
    font-size: 17px;
  }

  .banner-copy h2 {
    font-size: 18px;
    line-height: 1.45;
  }

  .banner-stats {
    width: 100%;
    gap: 20px;
    padding-left: 49px;
  }

  .banner-stats strong {
    font-size: 23px;
  }

  .table-card-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    padding: 18px 16px 13px;
  }

  .table-meta {
    width: 100%;
    justify-content: space-between;
  }

  .warning-footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
    padding: 13px 16px;
  }
}
</style>
