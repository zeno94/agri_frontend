<template>
  <div class="page-shell parts-page">
    <PageHeader
      eyebrow="PARTS CATALOG"
      title="配件管理"
      description="维护农机配件的基础信息、销售价格与安全库存，库存告急时系统会自动标记。"
    >
      <template #actions>
        <el-button
          v-if="canManage"
          type="primary"
          :icon="Plus"
          @click="openCreateDialog"
        >
          新增配件
        </el-button>
        <el-tag v-else type="info" effect="plain" round>普通用户只读</el-tag>
      </template>
    </PageHeader>

    <section class="surface-card filter-bar">
      <div class="filter-left">
        <el-input
          v-model="filters.name"
          class="search-input"
          placeholder="按配件名称搜索"
          clearable
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button type="primary" :loading="loading" @click="handleSearch">
          查询
        </el-button>
        <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
      </div>
      <span class="result-hint">
        共 <strong>{{ formatNumber(total) }}</strong> 个配件
      </span>
    </section>

    <section class="surface-card table-card">
      <header class="table-card-head">
        <div>
          <h2>配件档案</h2>
          <p>库存数量低于或等于安全库存时，将以红色标签提示。</p>
        </div>
        <span class="legend">
          <i class="legend-dot" />
          安全库存
        </span>
      </header>

      <el-table
        v-loading="loading"
        :data="rows"
        row-key="id"
        class="parts-table"
        :header-cell-style="{ background: '#f7f8f4' }"
      >
        <el-table-column label="配件名称" min-width="190">
          <template #default="{ row }">
            <div class="part-name-cell">
              <span class="part-avatar">{{ firstChar(row.name) }}</span>
              <span class="part-name-copy">
                <strong>{{ row.name || '未命名配件' }}</strong>
                <small>{{ row.id !== undefined ? `配件编号 #${row.id}` : '暂无编号' }}</small>
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="型号" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="model-text">{{ row.model || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="分类" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.category || '未分类' }}
          </template>
        </el-table-column>

        <el-table-column label="品牌" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.brand || '—' }}
          </template>
        </el-table-column>

        <el-table-column label="库存" width="112" align="left">
          <template #default="{ row }">
            <el-tag
              v-if="isLowStock(row)"
              type="danger"
              effect="light"
              round
              class="low-stock-tag"
            >
              <el-icon><WarningFilled /></el-icon>
              {{ formatNumber(row.stock) }}
            </el-tag>
            <span v-else class="stock-normal">{{ formatNumber(row.stock) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="安全库存" width="110" align="left">
          <template #default="{ row }">
            <span class="safe-stock">{{ formatNumber(row.safe_stock) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="售价" width="132" align="right">
          <template #default="{ row }">
            <span class="price-text money">
              <small>¥</small>{{ formatMoney(row.price) }}
            </span>
          </template>
        </el-table-column>

        <template #empty>
          <div class="table-empty">
            <span class="empty-icon"><el-icon><Box /></el-icon></span>
            <strong>{{ filters.name ? '没有找到匹配的配件' : '还没有配件档案' }}</strong>
            <p>
              {{
                filters.name
                  ? '试试更换名称关键词，或重置筛选条件。'
                  : canManage
                    ? '新增第一条配件，开始管理库存。'
                    : '当前还没有配件档案，请联系管理员新增。'
              }}
            </p>
            <el-button
              v-if="filters.name"
              plain
              @click="handleReset"
            >
              清空搜索
            </el-button>
            <el-button
              v-else-if="canManage"
              type="primary"
              :icon="Plus"
              @click="openCreateDialog"
            >
              新增配件
            </el-button>
            <el-tag v-else type="info" effect="plain">普通用户仅可查看配件</el-tag>
          </div>
        </template>
      </el-table>

      <footer class="table-footer">
        <span class="page-hint">
          第 {{ currentPage }} 页，每页 {{ pageSize }} 条
        </span>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          background
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </footer>
    </section>

    <el-dialog
      v-if="canManage"
      v-model="dialogVisible"
      width="640px"
      align-center
      destroy-on-close
      :close-on-click-modal="false"
      class="part-dialog"
      @closed="resetForm"
    >
      <template #header>
        <div class="dialog-heading">
          <span class="dialog-icon"><el-icon><Box /></el-icon></span>
          <div>
            <h3>新增配件</h3>
            <p>完善配件基础资料，便于后续采购与销售。</p>
          </div>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="part-form"
      >
        <div class="form-grid">
          <el-form-item label="配件名称" prop="name" class="span-2">
            <el-input
              v-model="form.name"
              placeholder="例如：液压油缸总成"
              maxlength="60"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="型号" prop="model">
            <el-input v-model="form.model" placeholder="例如：HY-1204" maxlength="40" />
          </el-form-item>

          <el-form-item label="品牌" prop="brand">
            <el-input v-model="form.brand" placeholder="例如：东风农机" maxlength="40" />
          </el-form-item>

          <el-form-item label="分类" prop="category">
            <el-select
              v-model="form.category"
              placeholder="选择或输入分类"
              filterable
              allow-create
              default-first-option
            >
              <el-option
                v-for="category in categoryOptions"
                :key="category"
                :label="category"
                :value="category"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="售价（元）" prop="price">
            <el-input-number
              v-model="form.price"
              :min="0.01"
              :precision="2"
              :step="10"
              controls-position="right"
            />
          </el-form-item>

          <el-form-item label="当前库存" prop="stock">
            <el-input-number
              v-model="form.stock"
              :min="0"
              :precision="0"
              :step="1"
              controls-position="right"
            />
          </el-form-item>

          <el-form-item label="安全库存" prop="safe_stock">
            <el-input-number
              v-model="form.safe_stock"
              :min="0"
              :precision="0"
              :step="1"
              controls-position="right"
            />
          </el-form-item>
        </div>

        <div class="form-tip">
          <el-icon><WarningFilled /></el-icon>
          当当前库存 ≤ 安全库存时，配件会自动进入库存预警清单。
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleCreate">
            {{ submitting ? '正在保存…' : '保存配件' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Box,
  Plus,
  RefreshLeft,
  Search,
  WarningFilled,
} from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { createPart, getParts } from '@/api/parts'
import { canManageMasterData } from '@/utils/permission'
import { isLowStock } from '@/utils/normalize'
import { formatMoney, formatNumber } from '@/utils/format'

const categoryOptions = [
  '发动机配件',
  '传动系统',
  '液压系统',
  '电气系统',
  '制动系统',
  '易损件',
  '其他',
]

function createEmptyForm() {
  return {
    name: '',
    model: '',
    brand: '',
    category: '',
    stock: 0,
    safe_stock: 0,
    price: null,
  }
}

const canManage = canManageMasterData()
const loading = ref(false)
const rows = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const filters = reactive({ name: '' })

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const form = reactive(createEmptyForm())

const rules = {
  name: [{ required: true, message: '请输入配件名称', trigger: 'blur' }],
  model: [{ required: true, message: '请输入配件型号', trigger: 'blur' }],
  brand: [{ required: true, message: '请输入品牌', trigger: 'blur' }],
  category: [{ required: true, message: '请选择配件分类', trigger: 'change' }],
  stock: [{ required: true, message: '请输入当前库存', trigger: 'change' }],
  safe_stock: [{ required: true, message: '请输入安全库存', trigger: 'change' }],
  price: [
    { required: true, message: '请输入配件售价', trigger: 'change' },
    {
      validator(_rule, value, callback) {
        if (Number(value) > 0) callback()
        else callback(new Error('售价必须大于 0'))
      },
      trigger: 'change',
    },
  ],
}

function firstChar(name) {
  return String(name || '配').trim().slice(0, 1).toUpperCase()
}

async function loadParts() {
  loading.value = true
  try {
    const result = await getParts({
      page: currentPage.value,
      page_size: pageSize.value,
      name: filters.name.trim() || undefined,
    })
    rows.value = result.items
    total.value = result.total
  } catch {
    // 统一错误提示在 Axios 拦截器中处理。
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  loadParts()
}

function handleReset() {
  filters.name = ''
  currentPage.value = 1
  loadParts()
}

function handlePageChange() {
  loadParts()
}

function handleSizeChange() {
  currentPage.value = 1
  loadParts()
}

function openCreateDialog() {
  Object.assign(form, createEmptyForm())
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  formRef.value?.resetFields()
}

async function handleCreate() {
  if (!formRef.value || submitting.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    await createPart({
      name: form.name.trim(),
      model: form.model.trim(),
      brand: form.brand.trim(),
      category: form.category,
      stock: Number(form.stock),
      safe_stock: Number(form.safe_stock),
      price: Number(form.price),
    })
    ElMessage.success('新配件已保存')
    dialogVisible.value = false
    currentPage.value = 1
    await loadParts()
  } catch {
    // 保持弹窗开启，便于修正后再次提交。
  } finally {
    submitting.value = false
  }
}

onMounted(loadParts)
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
  padding: 16px 18px;
}

.filter-left {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
}

.search-input {
  width: 300px;
}

.result-hint {
  flex: 0 0 auto;
  color: var(--erp-muted);
  font-size: 11px;
}

.result-hint strong {
  color: var(--erp-green);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.table-card {
  overflow: hidden;
}

.table-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 24px 16px;
}

.table-card-head h2 {
  color: var(--erp-ink);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.table-card-head p {
  margin-top: 5px;
  color: var(--erp-muted);
  font-size: 11px;
}

.legend {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 4px;
  color: var(--erp-muted);
  font-size: 10px;
  white-space: nowrap;
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--erp-danger);
}

.parts-table {
  width: 100%;
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
  border: 1px solid #e2e9d9;
  border-radius: 10px;
  color: #58724f;
  background: linear-gradient(145deg, #f5f8e9, #e9f0dc);
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
  font-variant-numeric: tabular-nums;
}

.model-text {
  color: #536258;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 11.5px;
  letter-spacing: -0.02em;
}

.safe-stock {
  color: #748076;
  font-variant-numeric: tabular-nums;
}

.stock-normal {
  color: #4f6b55;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

.low-stock-tag {
  gap: 4px;
  height: 25px;
  padding: 0 9px;
  border-color: #f0d3cd;
  color: var(--erp-danger);
  background: #fcf1ee;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.low-stock-tag .el-icon {
  font-size: 11px;
}

.price-text {
  color: var(--erp-ink);
  font-size: 13px;
  font-weight: 650;
}

.price-text small {
  margin-right: 2px;
  color: #9ca69e;
  font-size: 10px;
  font-weight: 500;
}

.table-empty {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 38px 20px 34px;
}

.empty-icon {
  display: grid;
  width: 52px;
  height: 52px;
  margin-bottom: 13px;
  place-items: center;
  border-radius: 16px;
  color: #76907a;
  background: #eef4e8;
  font-size: 23px;
}

.table-empty strong {
  color: var(--erp-ink);
  font-size: 13px;
  font-weight: 600;
}

.table-empty p {
  margin-top: 6px;
  margin-bottom: 16px;
  color: var(--erp-muted);
  font-size: 11px;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 22px 17px;
  border-top: 1px solid #f0f2ec;
}

.page-hint {
  color: #a1aaa2;
  font-size: 10px;
  white-space: nowrap;
}

.dialog-heading {
  display: flex;
  align-items: flex-start;
  gap: 13px;
}

.dialog-icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border-radius: 12px;
  color: var(--erp-green);
  background: #edf4e7;
  font-size: 18px;
}

.dialog-heading h3 {
  color: var(--erp-ink);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.dialog-heading p {
  margin-top: 5px;
  color: var(--erp-muted);
  font-size: 11px;
}

.part-form {
  padding-top: 7px;
}

.form-grid {
  display: grid;
  gap: 0 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.span-2 {
  grid-column: span 2;
}

.form-tip {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 11px 13px;
  border: 1px solid #eee5d2;
  border-radius: 9px;
  color: #93743f;
  background: #fcf8ef;
  font-size: 10.5px;
  line-height: 1.6;
}

.form-tip .el-icon {
  margin-top: 2px;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
}

@media (max-width: 720px) {
  .filter-bar {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
  }

  .filter-left {
    flex-wrap: wrap;
  }

  .search-input {
    width: 100%;
    flex-basis: 100%;
  }

  .result-hint {
    text-align: right;
  }

  .table-card-head {
    padding: 19px 16px 13px;
  }

  .legend {
    display: none;
  }

  .table-footer {
    align-items: flex-end;
    flex-direction: column;
    padding: 14px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .span-2 {
    grid-column: auto;
  }
}
</style>
