<template>
  <div class="page-shell suppliers-page">
    <PageHeader
      eyebrow="SUPPLIER DIRECTORY"
      title="供应商管理"
      description="维护县城/市区的本地供货商、主营品类和送货时效；采购开单只从这里选。"
    >
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增供应商</el-button>
      </template>
    </PageHeader>

    <section class="surface-card filter-bar">
      <div class="filter-left">
        <el-input
          v-model="keyword"
          class="search-input"
          placeholder="名称 / 电话 / 联系人"
          clearable
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
        <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
      </div>
      <span class="result-hint">共 <strong>{{ formatNumber(total) }}</strong> 家</span>
    </section>

    <section class="surface-card table-card">
      <header class="table-card-head">
        <div>
          <h2>本地供货商</h2>
          <p>公司制为主，镇级不设批发商；采购单的供应商只能从这张表里选。</p>
        </div>
      </header>
      <el-table v-loading="loading" :data="rows" row-key="id" :header-cell-style="{ background: '#f7f8f4' }">
        <el-table-column label="供应商" min-width="230">
          <template #default="{ row }">
            <div class="supplier-cell">
              <span class="supplier-avatar"><el-icon><Van /></el-icon></span>
              <span class="supplier-copy">
                <strong>{{ row.name }}</strong>
                <small>{{ row.address || '未填地址' }}</small>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="联系人" width="110">
          <template #default="{ row }">{{ row.contact_person || '—' }}</template>
        </el-table-column>
        <el-table-column label="电话" width="140">
          <template #default="{ row }">{{ row.phone || '—' }}</template>
        </el-table-column>
        <el-table-column label="主营" min-width="180">
          <template #default="{ row }">
            <div class="tag-row">
              <el-tag v-for="item in row.main_categories || []" :key="item" size="small" effect="plain">{{ item }}</el-tag>
              <span v-if="!(row.main_categories || []).length" class="text-muted">—</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="送货" width="90" align="right">
          <template #default="{ row }">{{ row.delivery_days != null ? `${row.delivery_days} 天` : '—' }}</template>
        </el-table-column>
        <el-table-column label="累计采购" width="120" align="right">
          <template #default="{ row }"><span class="money">¥{{ formatMoney(row.total_amount) }}</span></template>
        </el-table-column>
        <el-table-column label="采购单" width="84" align="right">
          <template #default="{ row }">{{ formatNumber(row.order_count) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="86">
          <template #default="{ row }"><el-tag :type="row.is_active ? 'success' : 'info'" effect="plain">{{ row.is_active ? '启用' : '停用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="76" fixed="right">
          <template #default="{ row }"><el-button link type="primary" @click="openEdit(row)">编辑</el-button></template>
        </el-table-column>
        <template #empty>
          <div class="table-empty">
            <span class="empty-icon"><el-icon><Van /></el-icon></span>
            <strong>还没有供应商</strong>
            <p>先新增一个本地供货商，再去采购入库。</p>
            <el-button type="primary" :icon="Plus" @click="openCreate">新增供应商</el-button>
          </div>
        </template>
      </el-table>
      <footer class="table-footer">
        <span class="page-hint">第 {{ page }} 页，每页 {{ pageSize }} 条</span>
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[10, 20, 50]" :total="total" background layout="total, sizes, prev, pager, next" @size-change="handleSizeChange" @current-change="loadSuppliers" />
      </footer>
    </section>

    <el-dialog v-model="formVisible" width="640px" align-center destroy-on-close :close-on-click-modal="false">
      <template #header>
        <div class="dialog-heading">
          <span class="dialog-icon"><el-icon><Van /></el-icon></span>
          <div><h3>{{ editingId ? '编辑供应商' : '新增供应商' }}</h3><p>本地公司/销售中心，不写镇级批发部。</p></div>
        </div>
      </template>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="form-grid">
          <el-form-item label="供应商名称" prop="name" class="span-2"><el-input v-model="form.name" placeholder="例如：杞县丰农农机配件有限公司" maxlength="100" /></el-form-item>
          <el-form-item label="联系人"><el-input v-model="form.contact_person" maxlength="50" /></el-form-item>
          <el-form-item label="电话"><el-input v-model="form.phone" maxlength="30" /></el-form-item>
          <el-form-item label="地址" class="span-2"><el-input v-model="form.address" placeholder="县/区 + 路/市场" maxlength="200" /></el-form-item>
          <el-form-item label="主营品类" class="span-2">
            <el-select v-model="form.main_categories" multiple filterable allow-create default-first-option placeholder="传动带、轴承、水泵……">
              <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="送货天数"><el-input-number v-model="form.delivery_days" :min="0" :max="30" :precision="0" controls-position="right" /></el-form-item>
          <el-form-item label="结算方式"><el-input v-model="form.payment_terms" placeholder="现结 / 月结 / 账期" maxlength="100" /></el-form-item>
          <el-form-item label="备注" class="span-2"><el-input v-model="form.note" type="textarea" :rows="2" maxlength="500" show-word-limit /></el-form-item>
          <el-form-item label="状态"><el-switch v-model="form.is_active" active-text="启用" inactive-text="停用" /></el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer"><el-button @click="formVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveSupplier">{{ saving ? '正在保存…' : '保存供应商' }}</el-button></div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, RefreshLeft, Search, Van } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { createSupplier, getSupplierPage, updateSupplier } from '@/api/suppliers'
import { formatMoney, formatNumber } from '@/utils/format'

const categoryOptions = ['整机', '农机具', '传动带', '轴承', '紧固件', '水泵', '灌溉水带', '滤清器', '机油/润滑', '轮胎', '制动/传动', '发动机件', '液压件', '电器/灯具', '植保配件']
const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const formVisible = ref(false)
const saving = ref(false)
const editingId = ref(null)
const formRef = ref(null)
const form = reactive(emptyForm())
const rules = { name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }] }

function emptyForm() {
  return { name: '', phone: '', address: '', contact_person: '', main_categories: [], delivery_days: 1, payment_terms: '现结', note: '', is_active: true }
}

async function loadSuppliers() {
  loading.value = true
  try {
    const result = await getSupplierPage({ page: page.value, size: pageSize.value, keyword: keyword.value.trim() || undefined })
    rows.value = result.items
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function handleSearch() { page.value = 1; loadSuppliers() }
function handleReset() { keyword.value = ''; page.value = 1; loadSuppliers() }
function handleSizeChange() { page.value = 1; loadSuppliers() }

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  formVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    phone: row.phone || '',
    address: row.address || '',
    contact_person: row.contact_person || '',
    main_categories: [...(row.main_categories || [])],
    delivery_days: row.delivery_days ?? 1,
    payment_terms: row.payment_terms || '现结',
    note: row.note || '',
    is_active: row.is_active !== false,
  })
  formVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

async function saveSupplier() {
  if (!formRef.value || saving.value) return
  try { await formRef.value.validate() } catch { return }
  saving.value = true
  try {
    const payload = { ...form, name: form.name.trim(), phone: form.phone.trim() || null }
    if (editingId.value) await updateSupplier(editingId.value, payload)
    else await createSupplier(payload)
    ElMessage.success(editingId.value ? '供应商已更新' : '供应商已创建')
    formVisible.value = false
    await loadSuppliers()
  } finally {
    saving.value = false
  }
}

onMounted(loadSuppliers)
</script>

<style scoped>
.filter-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding: 16px 18px; gap: 14px; }
.filter-left { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.search-input { width: 240px; }
.result-hint { color: var(--erp-muted); font-size: 12px; white-space: nowrap; }
.table-card { padding: 0 18px 14px; }
.table-card-head { display: flex; align-items: flex-end; justify-content: space-between; padding: 18px 2px 14px; }
.table-card-head h2 { font-size: 16px; }
.table-card-head p { margin-top: 4px; color: var(--erp-muted); font-size: 12px; }
.supplier-cell { display: flex; align-items: center; gap: 10px; }
.supplier-avatar { display: grid; width: 32px; height: 32px; flex: 0 0 auto; border-radius: 10px; color: var(--erp-green); background: var(--erp-lime-soft); font-size: 15px; place-items: center; }
.supplier-copy { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
.supplier-copy strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.supplier-copy small { color: var(--erp-muted); font-size: 11px; }
.tag-row { display: flex; flex-wrap: wrap; gap: 4px; }
.table-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; }
.page-hint { color: var(--erp-muted); font-size: 12px; }
.form-grid { display: grid; gap: 0 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.span-2 { grid-column: span 2; }
.dialog-heading { display: flex; align-items: center; gap: 12px; }
.dialog-icon { display: grid; width: 40px; height: 40px; border-radius: 12px; color: var(--erp-green); background: var(--erp-lime-soft); font-size: 20px; place-items: center; }
.dialog-heading h3 { font-size: 17px; }
.dialog-heading p { margin-top: 3px; color: var(--erp-muted); font-size: 12px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
@media (max-width: 900px) { .filter-bar { align-items: flex-start; flex-direction: column; } .search-input { width: 100%; } .form-grid { grid-template-columns: 1fr; } .span-2 { grid-column: span 1; } }
</style>
