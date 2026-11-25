<template>
  <div class="page-shell customers-page">
    <PageHeader
      eyebrow="CUSTOMER LEDGER"
      title="客户管理"
      description="把农户的村、作物、农机和购买记录放在一起，知道谁该回访、谁该备货、谁常买什么。"
    >
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增客户</el-button>
      </template>
    </PageHeader>

    <div class="summary-grid">
      <article class="summary-card summary-card--featured">
        <div class="summary-head">
          <span>筛选客户</span>
          <span class="summary-icon"><el-icon><UserFilled /></el-icon></span>
        </div>
        <strong class="summary-value">{{ formatNumber(total) }}<small class="summary-unit">户</small></strong>
        <p>当前筛选条件下有成交记录的农户</p>
      </article>
      <article class="summary-card">
        <div class="summary-head">
          <span>累计消费</span>
          <span class="summary-icon"><el-icon><Wallet /></el-icon></span>
        </div>
        <strong class="summary-value money"><small>¥</small>{{ formatYuan(totalAmount) }}</strong>
        <p>当前页客户的历史消费合计</p>
      </article>
      <article class="summary-card">
        <div class="summary-head">
          <span>累计订单</span>
          <span class="summary-icon summary-icon--gold"><el-icon><Tickets /></el-icon></span>
        </div>
        <strong class="summary-value">{{ formatNumber(totalOrders) }}<small class="summary-unit">单</small></strong>
        <p>当前页客户的历史销售单数</p>
      </article>
    </div>

    <section class="surface-card filter-bar">
      <div class="filter-left">
        <el-input
          v-model="filters.keyword"
          class="search-input"
          placeholder="姓名 / 电话"
          clearable
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-input v-model="filters.town" class="town-input" placeholder="乡镇，如 邢口镇" clearable />
        <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
        <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
      </div>
      <span class="result-hint">共 <strong>{{ formatNumber(total) }}</strong> 户</span>
    </section>

    <section class="surface-card table-card">
      <header class="table-card-head">
        <div>
          <h2>农户档案</h2>
          <p>电话、村、作物和最近购买放在一张表里，方便开单前先看一眼。</p>
        </div>
        <span class="legend"><i class="legend-dot" />按最近购买排序</span>
      </header>

      <el-table v-loading="loading" :data="rows" row-key="id" class="customers-table" :header-cell-style="{ background: '#f7f8f4' }">
        <el-table-column label="客户" min-width="190">
          <template #default="{ row }">
            <div class="person-cell">
              <span class="person-avatar">{{ firstChar(row.name) }}</span>
              <span class="person-copy">
                <strong>{{ row.name }}</strong>
                <small>{{ row.phone || '未留电话' }}</small>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="地区" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ [row.city, row.county, row.town, row.village].filter(Boolean).join(' · ') || '—' }}</template>
        </el-table-column>
        <el-table-column label="标签" width="104">
          <template #default="{ row }"><el-tag :type="isCore(row) ? 'warning' : 'info'" effect="plain" round>{{ isCore(row) ? '核心客户' : '其他' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="累计消费" width="108" align="right">
          <template #default="{ row }"><span class="money">¥{{ formatYuan(row.stats?.total_amount) }}</span></template>
        </el-table-column>
        <el-table-column label="订单" width="60" align="right">
          <template #default="{ row }">{{ formatNumber(row.stats?.order_count) }}</template>
        </el-table-column>
        <el-table-column label="最近购买" width="100">
          <template #default="{ row }">{{ formatTime(row.stats?.last_order_at) }}</template>
        </el-table-column>
        <el-table-column label="下次跟进" width="100">
          <template #default="{ row }">{{ formatTime(row.next_follow_up_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="112" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button link @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="table-empty">
            <span class="empty-icon"><el-icon><UserFilled /></el-icon></span>
            <strong>还没有客户档案</strong>
            <p>先建一个农户，或者去销售页开单时顺手新增。</p>
            <el-button type="primary" :icon="Plus" @click="openCreate">新增客户</el-button>
          </div>
        </template>
      </el-table>

      <footer class="table-footer">
        <span class="page-hint">第 {{ page }} 页，每页 {{ pageSize }} 条</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          background
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="loadCustomers"
        />
      </footer>
    </section>

    <el-dialog v-model="formVisible" width="680px" align-center destroy-on-close :close-on-click-modal="false">
      <template #header>
        <div class="dialog-heading">
          <span class="dialog-icon"><el-icon><UserFilled /></el-icon></span>
          <div>
            <h3>{{ editingId ? '编辑客户' : '新增客户' }}</h3>
            <p>只填姓名和电话也能先建，村和作物可以后补。</p>
          </div>
        </div>
      </template>
      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top">
        <div class="form-grid">
          <el-form-item label="客户姓名" prop="name" class="span-2">
            <el-input v-model="form.name" placeholder="例如：王建军（邢口镇冷屯村）" maxlength="100" />
          </el-form-item>
          <el-form-item label="电话" prop="phone"><el-input v-model="form.phone" placeholder="手机或座机" maxlength="30" /></el-form-item>
          <el-form-item label="市"><el-input v-model="form.city" placeholder="例如：开封市" maxlength="50" /></el-form-item>
          <el-form-item label="县/区"><el-input v-model="form.county" placeholder="例如：杞县" maxlength="50" /></el-form-item>
          <el-form-item label="乡镇"><el-input v-model="form.town" placeholder="例如：邢口镇" maxlength="50" /></el-form-item>
          <el-form-item label="村"><el-input v-model="form.village" placeholder="例如：冷屯村" maxlength="50" /></el-form-item>
          <el-form-item label="客户类型" prop="customer_type">
            <el-select v-model="form.customer_type" placeholder="选择客户类型">
              <el-option v-for="item in customerTypes" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="种植面积（亩）">
            <el-input-number v-model="form.acreage" :min="0" :precision="1" :step="1" controls-position="right" />
          </el-form-item>
          <el-form-item label="下次跟进">
            <el-date-picker v-model="form.next_follow_up_at" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="选择时间" />
          </el-form-item>
          <el-form-item label="主要作物" class="span-2">
            <el-select v-model="form.main_crops" multiple filterable allow-create default-first-option placeholder="小麦、玉米、大蒜……">
              <el-option v-for="item in cropOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="标签" class="span-2">
            <el-select v-model="form.tags" multiple filterable allow-create default-first-option placeholder="核心客户、可送货、价格敏感……">
              <el-option v-for="item in tagOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注" class="span-2"><el-input v-model="form.note" type="textarea" :rows="3" maxlength="500" show-word-limit /></el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="formVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveCustomer">{{ saving ? '正在保存…' : '保存客户' }}</el-button>
        </div>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" size="min(560px, 94vw)" :with-header="false">
      <div v-if="detail" class="customer-detail">
        <header class="detail-head">
          <span class="person-avatar person-avatar--large">{{ firstChar(detail.name) }}</span>
          <div>
            <h2>{{ detail.name }}</h2>
            <p>{{ [detail.city, detail.county, detail.town, detail.village].filter(Boolean).join(' · ') || '未填地址' }} · {{ detail.phone || '未留电话' }}</p>
          </div>
          <el-tag effect="plain" round>{{ detail.customer_type || '其他' }}</el-tag>
        </header>

        <div class="detail-stats">
          <div><span>累计消费</span><strong class="money">¥{{ formatYuan(detail.stats?.total_amount) }}</strong></div>
          <div><span>订单数</span><strong>{{ formatNumber(detail.stats?.order_count) }}</strong></div>
          <div><span>平均单额</span><strong class="money">¥{{ formatYuan(detail.stats?.avg_order_amount) }}</strong></div>
        </div>

        <section class="detail-section">
          <h3>经营画像</h3>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="种植面积">{{ detail.acreage !== null && detail.acreage !== undefined ? `${Number(detail.acreage)} 亩` : '—' }}</el-descriptions-item>
            <el-descriptions-item label="主要作物">{{ (detail.main_crops || []).join('、') || '—' }}</el-descriptions-item>
            <el-descriptions-item label="标签">{{ (detail.tags || []).join('、') || '—' }}</el-descriptions-item>
            <el-descriptions-item label="下次跟进">{{ formatTime(detail.next_follow_up_at) }}</el-descriptions-item>
          </el-descriptions>
          <p v-if="detail.note" class="detail-note">{{ detail.note }}</p>
        </section>

        <section class="detail-section">
          <div class="section-head"><h3>最近购买</h3><span>{{ detail.recent_orders?.length || 0 }} 单</span></div>
          <el-table :data="detail.recent_orders || []" size="small">
            <el-table-column prop="order_no" label="单号" min-width="150" />
            <el-table-column label="金额" width="96" align="right"><template #default="{ row }">¥{{ formatYuan(row.total_amount) }}</template></el-table-column>
            <el-table-column label="时间" width="116"><template #default="{ row }">{{ formatTime(row.created_at) }}</template></el-table-column>
          </el-table>
        </section>

        <section class="detail-section">
          <div class="section-head"><h3>跟进记录</h3><span>{{ detail.followups?.length || 0 }} 条</span></div>
          <div class="followup-form">
            <el-select v-model="followup.method" class="followup-method" filterable allow-create default-first-option placeholder="方式">
              <el-option v-for="item in followupMethods" :key="item" :label="item" :value="item" />
            </el-select>
            <el-date-picker v-model="followup.next_follow_up_at" class="followup-next" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="下次跟进" />
            <el-input v-model="followup.content" class="followup-content" placeholder="这次聊了什么" maxlength="500" />
            <el-button type="primary" :loading="followupSaving" @click="saveFollowup">记一笔</el-button>
          </div>
          <el-timeline v-if="detail.followups?.length" class="followup-list">
            <el-timeline-item v-for="item in detail.followups" :key="item.id" :timestamp="formatTime(item.created_at)" placement="top">
              <div class="followup-item"><strong>{{ item.operator_name || '店员' }} · {{ item.method }}</strong><p>{{ item.content }}</p><small v-if="item.next_follow_up_at">下次：{{ formatTime(item.next_follow_up_at) }}</small></div>
            </el-timeline-item>
          </el-timeline>
          <p v-else class="empty-inline">还没有跟进记录。</p>
        </section>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, RefreshLeft, Search, Tickets, UserFilled, Wallet } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { addCustomerFollowup, createCustomer, getCustomerDetail, getCustomerPage, updateCustomer } from '@/api/customers'
import { formatNumber, formatYuan } from '@/utils/format'

const customerTypes = ['其他']
const cropOptions = ['小麦', '玉米', '大蒜', '棉花', '蔬菜', '其他']
const tagOptions = ['核心客户', '其他']
const followupMethods = ['电话', '微信', '到店', '上门', '其他']

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const filters = reactive({ keyword: '', town: '' })
const totalAmount = ref(0)
const totalOrders = ref(0)

const formVisible = ref(false)
const saving = ref(false)
const editingId = ref(null)
const formRef = ref(null)
const form = reactive(emptyForm())
const formRules = {
  name: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
}

const detailVisible = ref(false)
const detail = ref(null)
const followup = reactive({ method: '电话', content: '', next_follow_up_at: '' })
const followupSaving = ref(false)

function emptyForm() {
  return {
    name: '',
    phone: '',
    city: '开封市',
    county: '杞县',
    town: '',
    village: '',
    customer_type: '其他',
    acreage: 0,
    main_crops: ['其他'],
    tags: ['其他'],
    note: '',
    next_follow_up_at: '',
  }
}

function isCore(row) {
  return (row.tags || []).includes('核心客户')
}

function firstChar(name) {
  return String(name || '客').trim().slice(0, 1).toUpperCase()
}

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

async function loadCustomers() {
  loading.value = true
  try {
    const result = await getCustomerPage({
      page: page.value,
      size: pageSize.value,
      keyword: filters.keyword.trim() || undefined,
      town: filters.town.trim() || undefined,
    })
    rows.value = result.items
    total.value = result.total
    totalAmount.value = result.items.reduce((sum, item) => sum + Number(item.stats?.total_amount || 0), 0)
    totalOrders.value = result.items.reduce((sum, item) => sum + Number(item.stats?.order_count || 0), 0)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadCustomers()
}

function handleReset() {
  filters.keyword = ''
  filters.town = ''
  page.value = 1
  loadCustomers()
}

function handleSizeChange() {
  page.value = 1
  loadCustomers()
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  formVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

async function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    phone: row.phone || '',
    city: row.city || '开封市',
    county: row.county || '杞县',
    town: row.town || '',
    village: row.village || '',
    customer_type: row.customer_type || '其他',
    acreage: row.acreage ?? 0,
    main_crops: [...(row.main_crops || ['其他'])],
    tags: [...(row.tags || ['其他'])],
    note: row.note || '',
    next_follow_up_at: row.next_follow_up_at || '',
  })
  formVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

async function saveCustomer() {
  if (!formRef.value || saving.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    const payload = {
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      next_follow_up_at: form.next_follow_up_at || null,
    }
    if (editingId.value) await updateCustomer(editingId.value, payload)
    else await createCustomer(payload)
    ElMessage.success(editingId.value ? '客户已更新' : '客户已创建')
    formVisible.value = false
    await loadCustomers()
    if (detail.value?.id === editingId.value) await openDetail({ id: editingId.value })
  } finally {
    saving.value = false
  }
}

async function openDetail(row) {
  detailVisible.value = true
  const result = await getCustomerDetail(row.id)
  detail.value = result
  followup.method = '电话'
  followup.content = ''
  followup.next_follow_up_at = ''
}

async function saveFollowup() {
  if (!detail.value || !followup.content.trim() || followupSaving.value) return
  followupSaving.value = true
  try {
    await addCustomerFollowup(detail.value.id, {
      method: followup.method.trim() || '电话',
      content: followup.content.trim(),
      next_follow_up_at: followup.next_follow_up_at || null,
    })
    ElMessage.success('跟进已记录')
    await openDetail({ id: detail.value.id })
    await loadCustomers()
  } finally {
    followupSaving.value = false
  }
}

onMounted(loadCustomers)
</script>

<style scoped>
.summary-grid {
  display: grid;
  margin-bottom: 18px;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-card {
  position: relative;
  overflow: hidden;
  padding: 20px 22px;
  border: 1px solid var(--erp-line);
  border-radius: var(--erp-radius-lg);
  background: var(--erp-surface);
  box-shadow: var(--erp-shadow-sm);
}

.summary-card--featured {
  color: #f7fbf3;
  border-color: transparent;
  background: linear-gradient(145deg, #2f6b4b, #1d4a33);
}

.summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--erp-muted);
  font-size: 12px;
}

.summary-card--featured .summary-head,
.summary-card--featured p {
  color: rgba(247, 251, 243, 0.68);
}

.summary-icon {
  display: grid;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  color: var(--erp-green);
  background: var(--erp-lime-soft);
  place-items: center;
}

.summary-card--featured .summary-icon {
  color: var(--erp-green-deep);
  background: var(--erp-lime);
}

.summary-icon--gold {
  color: var(--erp-warning);
  background: #fbf4e7;
}

.summary-value {
  display: block;
  margin-top: 14px;
  font-size: 28px;
  font-weight: 750;
  letter-spacing: -0.04em;
}

.summary-value small {
  margin-left: 4px;
  color: var(--erp-muted);
  font-size: 12px;
  font-weight: 600;
}

.summary-card p {
  margin-top: 5px;
  color: var(--erp-muted);
  font-size: 12px;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 16px 18px;
  gap: 14px;
}

.filter-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.search-input { width: 200px; }
.town-input { width: 150px; }
.type-select { width: 130px; }
.result-hint { color: var(--erp-muted); font-size: 12px; white-space: nowrap; }
.table-card { padding: 0 18px 14px; }
.table-card-head { display: flex; align-items: flex-end; justify-content: space-between; padding: 18px 2px 14px; gap: 16px; }
.table-card-head h2 { font-size: 16px; }
.table-card-head p { margin-top: 4px; color: var(--erp-muted); font-size: 12px; }
.legend { display: flex; align-items: center; gap: 6px; color: var(--erp-muted); font-size: 11px; }
.legend-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--erp-green); }
.person-cell { display: flex; align-items: center; gap: 10px; }
.person-avatar { display: grid; width: 32px; height: 32px; flex: 0 0 auto; border-radius: 10px; color: var(--erp-green); background: var(--erp-lime-soft); font-size: 13px; font-weight: 700; place-items: center; }
.person-avatar--large { width: 48px; height: 48px; border-radius: 14px; font-size: 18px; }
.person-copy { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
.person-copy strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.person-copy small { color: var(--erp-muted); font-size: 11px; }
.table-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; }
.page-hint { color: var(--erp-muted); font-size: 12px; }
.form-grid { display: grid; gap: 0 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.span-2 { grid-column: span 2; }
.dialog-heading { display: flex; align-items: center; gap: 12px; }
.dialog-icon { display: grid; width: 40px; height: 40px; border-radius: 12px; color: var(--erp-green); background: var(--erp-lime-soft); font-size: 20px; place-items: center; }
.dialog-heading h3 { font-size: 17px; }
.dialog-heading p { margin-top: 3px; color: var(--erp-muted); font-size: 12px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
.customer-detail { padding: 6px 2px 20px; }
.detail-head { display: flex; align-items: center; gap: 12px; padding-bottom: 18px; border-bottom: 1px solid var(--erp-line); }
.detail-head h2 { font-size: 20px; }
.detail-head p { margin-top: 4px; color: var(--erp-muted); font-size: 12px; }
.detail-head .el-tag { margin-left: auto; }
.detail-stats { display: grid; margin: 18px 0; gap: 10px; grid-template-columns: repeat(3, 1fr); }
.detail-stats div { padding: 12px 14px; border-radius: 12px; background: #f7f9f4; }
.detail-stats span { display: block; color: var(--erp-muted); font-size: 11px; }
.detail-stats strong { display: block; margin-top: 5px; font-size: 18px; letter-spacing: -0.03em; }
.detail-section { margin-top: 22px; }
.detail-section h3 { margin-bottom: 10px; font-size: 14px; }
.section-head { display: flex; align-items: center; justify-content: space-between; }
.section-head span { color: var(--erp-muted); font-size: 11px; }
.detail-note { margin-top: 10px; padding: 10px 12px; border-radius: 10px; color: var(--erp-ink-soft); background: #f7f9f4; line-height: 1.7; }
.followup-form { display: flex; margin-bottom: 14px; gap: 8px; }
.followup-form .followup-content { flex: 1; min-width: 180px; height: 38px; }
.followup-form .followup-next { width: 168px; flex: 0 0 auto; height: 38px; }
.followup-method { width: 92px; flex: 0 0 auto; height: 38px; }
.followup-form :deep(.el-select__wrapper),
.followup-form :deep(.el-input__wrapper) { min-height: 38px; }
.followup-form :deep(.el-date-editor) { height: 38px; box-sizing: border-box; }
.followup-form :deep(.el-date-editor .el-input__wrapper) { height: 38px; }
.followup-list { padding-left: 2px; }
.followup-item strong { font-size: 13px; }
.followup-item p { margin-top: 4px; color: var(--erp-ink-soft); font-size: 13px; line-height: 1.6; }
.followup-item small { color: var(--erp-muted); font-size: 11px; }
.empty-inline { color: var(--erp-muted); font-size: 12px; }
@media (max-width: 900px) {
  .summary-grid { grid-template-columns: 1fr; }
  .filter-bar { align-items: flex-start; flex-direction: column; }
  .filter-left { width: 100%; }
  .search-input, .town-input, .type-select { width: 100%; }
  .form-grid { grid-template-columns: 1fr; }
  .span-2 { grid-column: span 1; }
  .followup-form { flex-direction: column; }
  .followup-form .el-date-editor { width: 100%; }
}
</style>
