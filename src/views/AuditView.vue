<template>
  <div class="page-shell audit-page">
    <PageHeader
      eyebrow="AUDIT TRAIL"
      :title="pageTitle"
      description="记录登录、主数据维护、采购、销售、看板与日志查看等关键操作，日志只读不可修改。"
    >
      <template #actions>
        <el-tag type="info" effect="plain" round>
          {{ canSeeAllUsers ? '全部用户' : '仅本人' }}
        </el-tag>
      </template>
    </PageHeader>

    <section class="surface-card filter-bar audit-filters">
      <div class="filter-left">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="audit-date"
        />
        <el-select
          v-model="filters.action"
          clearable
          placeholder="全部动作"
          class="audit-action"
        >
          <el-option
            v-for="option in ACTION_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-select
          v-model="filters.success"
          clearable
          placeholder="全部结果"
          class="audit-success"
        >
          <el-option label="成功" value="true" />
          <el-option label="失败" value="false" />
        </el-select>
        <el-input
          v-if="canSeeAllUsers"
          v-model="filters.username"
          clearable
          placeholder="操作账号"
          class="audit-user"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" :loading="loading" @click="handleSearch">
          查询
        </el-button>
        <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
      </div>
    </section>

    <section class="surface-card audit-table-card">
      <el-table v-loading="loading" :data="rows" stripe>
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作人" width="150">
          <template #default="{ row }">
            <div class="audit-user-cell">
              <strong>{{ row.username || '系统' }}</strong>
              <small>{{ roleText(row.role) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="动作" width="162">
          <template #default="{ row }">
            <el-tag
              :type="row.success ? 'success' : 'danger'"
              effect="light"
              round
            >
              {{ actionText(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内容" min-width="260">
          <template #default="{ row }">
            <span class="audit-summary">{{ summary(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="结果" width="130">
          <template #default="{ row }">
            <span :class="row.success ? 'result-ok' : 'result-fail'">
              {{ row.success ? '成功' : row.error_code || '失败' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" width="135" />
        <el-table-column label="操作" width="86" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>

        <template #empty>
          <div class="table-empty">
            <strong>暂无操作日志</strong>
            <p>调整筛选条件，或等待新的业务操作产生记录。</p>
          </div>
        </template>
      </el-table>

      <footer class="table-footer">
        <span class="page-hint">共 {{ total }} 条记录</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="loadLogs"
        />
      </footer>
    </section>

    <el-dialog
      v-model="detailVisible"
      title="操作详情"
      width="760px"
      align-center
    >
      <template v-if="detailRow">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="时间">
            {{ formatDateTime(detailRow.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="操作人">
            {{ detailRow.username || '系统' }}
            （{{ roleText(detailRow.role) }}）
          </el-descriptions-item>
          <el-descriptions-item label="动作">
            {{ actionText(detailRow.action) }}（{{ detailRow.action }}）
          </el-descriptions-item>
          <el-descriptions-item label="结果">
            {{ detailRow.success ? '成功' : '失败' }}
            <span v-if="detailRow.error_code"> / {{ detailRow.error_code }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="模块">
            {{ detailRow.module || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="资源">
            {{ detailRow.resource_type || '—' }}
            <span v-if="detailRow.resource_id">#{{ detailRow.resource_id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="IP">
            {{ detailRow.ip || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="请求 ID">
            {{ detailRow.request_id || '—' }}
          </el-descriptions-item>
        </el-descriptions>
        <pre class="audit-json">{{ detailJson }}</pre>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RefreshLeft } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { getAuditLogs } from '@/api/audit'
import { isBoss } from '@/utils/permission'

const canSeeAllUsers = isBoss()
const pageTitle = computed(() => (canSeeAllUsers ? '操作日志' : '我的操作日志'))

const ACTION_OPTIONS = [
  { value: 'auth.login', label: '登录' },
  { value: 'auth.login_failed', label: '登录失败' },
  { value: 'auth.logout', label: '退出登录' },
  { value: 'part.create', label: '新增配件' },
  { value: 'part.update', label: '修改配件' },
  { value: 'customer.create', label: '新增客户' },
  { value: 'supplier.create', label: '新增供应商' },
  { value: 'customer.followup', label: '客户跟进' },
  { value: 'user.create', label: '创建用户' },
  { value: 'user.modules', label: '分配模块' },
  { value: 'module.update', label: '修改模块' },
  { value: 'purchase.inbound', label: '采购入库' },
  { value: 'sale.outbound', label: '销售出库' },
  { value: 'dashboard.view', label: '查看经营看板' },
  { value: 'audit.view', label: '查看操作日志' },
]

const ACTION_LABELS = Object.fromEntries(
  ACTION_OPTIONS.map((option) => [option.value, option.label]),
)
const ROLE_LABELS = { boss: '管理员', employee: '普通用户' }

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filters = reactive({
  action: '',
  success: '',
  username: '',
})
const dateRange = ref([])
const detailVisible = ref(false)
const detailRow = ref(null)

const detailJson = computed(() => {
  if (!detailRow.value?.detail) return '无额外明细'
  return JSON.stringify(detailRow.value.detail, null, 2)
})

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('zh-CN', { hour12: false })
}

function actionText(action) {
  return ACTION_LABELS[action] || action
}

function roleText(role) {
  return ROLE_LABELS[String(role || '').toLowerCase()] || role || '系统'
}

function summary(row) {
  const detail = row.detail || {}
  if (detail.order_no) {
    const total = detail.total_amount
    return `${detail.order_no}${total ? ` · ¥${total}` : ''}`
  }
  if (detail.name) return detail.name
  if (detail.request?.customer_id) {
    return `客户 #${detail.request.customer_id}`
  }
  if (detail.request?.supplier_id) {
    return `供应商 #${detail.request.supplier_id}`
  }
  if (row.resource_type) {
    return `${row.resource_type}${row.resource_id ? ` #${row.resource_id}` : ''}`
  }
  return row.path || '—'
}

function openDetail(row) {
  detailRow.value = row
  detailVisible.value = true
}

async function loadLogs() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (filters.action) params.action = filters.action
    if (filters.success) params.success = filters.success === 'true'
    if (canSeeAllUsers && filters.username.trim()) {
      params.username = filters.username.trim()
    }
    if (dateRange.value?.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }

    const result = await getAuditLogs(params)
    rows.value = result?.items || []
    total.value = Number(result?.total) || 0
  } catch {
    // 错误提示由 Axios 拦截器统一处理。
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadLogs()
}

function handleReset() {
  filters.action = ''
  filters.success = ''
  filters.username = ''
  dateRange.value = []
  page.value = 1
  loadLogs()
}

function handleSizeChange() {
  page.value = 1
  loadLogs()
}

onMounted(loadLogs)
</script>

<style scoped>
.audit-filters {
  flex-wrap: wrap;
}

.audit-date {
  width: 260px;
}

.audit-action {
  width: 160px;
}

.audit-success {
  width: 120px;
}

.audit-user {
  width: 150px;
}

.audit-user-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.audit-user-cell strong {
  color: var(--erp-ink);
  font-size: 13px;
}

.audit-user-cell small {
  color: var(--erp-muted);
  font-size: 11px;
}

.audit-summary {
  color: var(--erp-ink-soft);
  font-size: 12.5px;
  line-height: 1.5;
}

.result-ok {
  color: #3f7d51;
  font-weight: 600;
}

.result-fail {
  color: #c45656;
  font-weight: 600;
}

.audit-json {
  max-height: 340px;
  margin-top: 18px;
  overflow: auto;
  padding: 14px 16px;
  border: 1px solid #eef1e7;
  border-radius: 12px;
  background: #f9faf5;
  color: #445347;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.audit-table-card {
  margin-top: 18px;
}
</style>
