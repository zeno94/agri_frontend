<template>
  <div class="page-shell purchase-page">
    <PageHeader
      eyebrow="PURCHASE INBOUND"
      title="采购入库"
      description="登记供应商到货明细，完成入库后对应配件库存将同步增加。"
    >
      <template #actions>
        <el-button
          :icon="Refresh"
          :loading="optionsLoading"
          @click="loadOptions"
        >
          刷新选项
        </el-button>
      </template>
    </PageHeader>

    <div class="purchase-layout">
      <section class="surface-card purchase-card">
        <header class="card-heading">
          <div>
            <span class="card-kicker">INBOUND DOCUMENT</span>
            <h2>新建入库单</h2>
            <p>选择供应商并添加本次到货的配件明细。</p>
          </div>
          <span class="date-note">
            <el-icon><Calendar /></el-icon>
            {{ todayText }}
          </span>
        </header>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="purchase-form"
        >
          <div class="supplier-panel">
            <span class="supplier-icon"><el-icon><Van /></el-icon></span>
            <el-form-item label="供应商" prop="supplier_id" class="supplier-field">
              <el-select
                v-model="form.supplier_id"
                placeholder="请选择本次采购的供应商"
                filterable
                clearable
                :loading="optionsLoading"
                no-data-text="暂无可选供应商"
              >
                <el-option
                  v-for="supplier in suppliers"
                  :key="supplier.id"
                  :label="supplier.name || `供应商 #${supplier.id}`"
                  :value="supplier.id"
                >
                  <div class="option-line">
                    <span>{{ supplier.name || `供应商 #${supplier.id}` }}</span>
                    <small v-if="supplier.contact">{{ supplier.contact }}</small>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            <div class="document-date">
              <span>入库日期</span>
              <strong>{{ todayText }}</strong>
            </div>
          </div>

          <div class="details-heading">
            <div>
              <h3>配件明细</h3>
              <p>支持添加多条配件，系统将按明细汇总入库金额。</p>
            </div>
            <el-button :icon="Plus" plain @click="addLine">添加明细</el-button>
          </div>

          <div class="line-list">
            <article
              v-for="(line, index) in form.items"
              :key="line._key"
              class="line-card"
            >
              <header class="line-head">
                <span class="line-number">
                  <i>{{ String(index + 1).padStart(2, '0') }}</i>
                  配件明细
                </span>
                <el-button
                  text
                  class="remove-button"
                  :disabled="form.items.length === 1"
                  :icon="Delete"
                  @click="removeLine(index)"
                >
                  移除
                </el-button>
              </header>

              <div class="line-grid">
                <el-form-item
                  label="配件"
                  :prop="`items.${index}.part_id`"
                  :rules="itemRules.part"
                  class="part-field"
                >
                  <el-select
                    v-model="line.part_id"
                    placeholder="搜索并选择配件"
                    filterable
                    :loading="optionsLoading"
                    @change="handlePartChange(line, index)"
                  >
                    <el-option
                      v-for="part in parts"
                      :key="part.id"
                      :label="`${part.name}${part.model ? ` · ${part.model}` : ''}`"
                      :value="part.id"
                    >
                      <div class="option-line">
                        <span>{{ part.name }}</span>
                        <small>
                          {{ part.model || '无型号' }} · 库存 {{ part.stock }}
                        </small>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>

                <el-form-item
                  label="采购数量"
                  :prop="`items.${index}.quantity`"
                  :rules="itemRules.quantity"
                >
                  <el-input-number
                    v-model="line.quantity"
                    :min="1"
                    :precision="0"
                    :step="1"
                    controls-position="right"
                  />
                </el-form-item>

                <el-form-item
                  label="采购单价（元）"
                  :prop="`items.${index}.unit_price`"
                  :rules="itemRules.unit_price"
                >
                  <el-input-number
                    v-model="line.unit_price"
                    :min="0"
                    :precision="2"
                    :step="10"
                    controls-position="right"
                  />
                </el-form-item>

                <div class="line-subtotal">
                  <span>小计</span>
                  <strong class="money">
                    <small>¥</small>{{ formatMoney(lineTotal(line)) }}
                  </strong>
                </div>
              </div>
            </article>
          </div>

          <button type="button" class="add-line" @click="addLine">
            <span><el-icon><Plus /></el-icon></span>
            继续添加配件明细
          </button>
        </el-form>
      </section>

      <aside class="purchase-aside">
        <section class="surface-card summary-card">
          <span class="card-kicker">INBOUND SUMMARY</span>
          <h2>入库摘要</h2>

          <dl class="summary-list">
            <div>
              <dt>供应商</dt>
              <dd :class="{ placeholder: !selectedSupplier }">
                {{ selectedSupplier?.name || '尚未选择' }}
              </dd>
            </div>
            <div>
              <dt>配件明细</dt>
              <dd>{{ form.items.length }} 项</dd>
            </div>
            <div>
              <dt>采购总量</dt>
              <dd>{{ formatNumber(totalQuantity) }} 件</dd>
            </div>
          </dl>

          <div class="amount-panel">
            <span>预计采购金额</span>
            <strong class="money">
              <small>¥</small>{{ formatMoney(totalAmount) }}
            </strong>
            <p>最终金额以后端入库结果为准</p>
          </div>

          <el-button
            type="primary"
            class="submit-button"
            :loading="submitting"
            @click="handleSubmit"
          >
            {{ submitting ? '正在入库…' : '确认采购入库' }}
          </el-button>
          <el-button class="reset-button" :disabled="submitting" @click="handleReset">
            清空单据
          </el-button>

          <p class="submit-hint">
            <el-icon><InfoFilled /></el-icon>
            入库成功后将自动增加对应配件的库存数量。
          </p>
        </section>

        <section class="aside-note">
          <span class="note-icon"><el-icon><Tickets /></el-icon></span>
          <div>
            <strong>采购单价为本次实际进价</strong>
            <p>选择配件后会自动带出售价作为参考，请按实际采购价格修改。</p>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Calendar,
  Delete,
  InfoFilled,
  Plus,
  Refresh,
  Tickets,
  Van,
} from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { getPartOptions } from '@/api/parts'
import { getSuppliers } from '@/api/suppliers'
import { createPurchaseInbound } from '@/api/purchases'
import { formatDate, formatMoney, formatNumber } from '@/utils/format'
import { newIdempotencyKey } from '@/utils/idempotency'

const route = useRoute()
const parts = ref([])
const suppliers = ref([])
const optionsLoading = ref(false)
const submitting = ref(false)
// 幂等键：一次入库尝试一个，失败重试时复用，成功后换新的
const submitKey = ref(newIdempotencyKey())
const formRef = ref(null)
let lineSeed = 1

function createLine(partId = null) {
  return {
    _key: lineSeed++,
    part_id: partId,
    quantity: 1,
    unit_price: 0,
  }
}

const form = reactive({
  supplier_id: null,
  items: [createLine()],
})

const rules = {
  supplier_id: [
    { required: true, message: '请选择供应商', trigger: 'change' },
  ],
}

const itemRules = {
  part: [{ required: true, message: '请选择配件', trigger: 'change' }],
  quantity: [
    {
      validator(_rule, value, callback) {
        if (Number(value) > 0) callback()
        else callback(new Error('采购数量必须大于 0'))
      },
      trigger: 'change',
    },
  ],
  unit_price: [
    {
      validator(_rule, value, callback) {
        if (Number(value) >= 0) callback()
        else callback(new Error('采购单价不能为负数'))
      },
      trigger: 'change',
    },
  ],
}

const todayText = formatDate(new Date(), false)

const selectedSupplier = computed(() =>
  suppliers.value.find(
    (supplier) => String(supplier.id) === String(form.supplier_id),
  ),
)

const totalQuantity = computed(() =>
  form.items.reduce((total, line) => total + (Number(line.quantity) || 0), 0),
)

const totalAmount = computed(() =>
  form.items.reduce((total, line) => total + lineTotal(line), 0),
)

function lineTotal(line) {
  return (Number(line.quantity) || 0) * (Number(line.unit_price) || 0)
}

async function loadOptions() {
  if (optionsLoading.value) return
  optionsLoading.value = true
  const [partResult, supplierResult] = await Promise.allSettled([
    getPartOptions(),
    getSuppliers(),
  ])

  if (partResult.status === 'fulfilled') {
    parts.value = partResult.value
    applyQueryPart()
  }
  if (supplierResult.status === 'fulfilled') {
    suppliers.value = supplierResult.value
  }
  optionsLoading.value = false
}

async function refreshParts() {
  try {
    parts.value = await getPartOptions()
  } catch {
    // 错误提示由拦截器统一处理。
  }
}

function applyQueryPart() {
  const queryPartId = route.query.part_id
  if (!queryPartId || !parts.value.length) return
  const matched = parts.value.find(
    (part) => String(part.id) === String(queryPartId),
  )
  if (!matched) return

  const firstLine = form.items[0]
  if (!firstLine.part_id) {
    firstLine.part_id = matched.id
    firstLine.unit_price = Number(
      matched.purchase_price ?? matched.price ?? 0,
    )
  }
}

function handlePartChange(line, index) {
  const part = parts.value.find(
    (item) => String(item.id) === String(line.part_id),
  )
  if (part) {
    line.unit_price = Number(part.purchase_price ?? part.price ?? 0)
  }

  const duplicated = form.items.some(
    (item, itemIndex) =>
      itemIndex !== index &&
      String(item.part_id) === String(line.part_id) &&
      line.part_id !== null,
  )

  if (duplicated) {
    line.part_id = null
    line.unit_price = 0
    ElMessage.warning('该配件已在明细中，请调整数量而不是重复添加')
  }
}

function addLine() {
  if (form.items.length >= 20) {
    ElMessage.warning('一张入库单最多添加 20 条明细')
    return
  }
  form.items.push(createLine())
}

function removeLine(index) {
  if (form.items.length === 1) return
  form.items.splice(index, 1)
}

function handleReset() {
  if (submitting.value) return
  formRef.value?.clearValidate()
  form.supplier_id = null
  form.items = [createLine()]
  submitKey.value = newIdempotencyKey()
  ElMessage.info('已清空当前入库单')
}

async function handleSubmit() {
  if (!formRef.value || submitting.value) return

  try {
    await formRef.value.validate()
  } catch {
    ElMessage.warning('请完善供应商和配件明细后再提交')
    return
  }

  const partIds = form.items.map((line) => String(line.part_id))
  if (new Set(partIds).size !== partIds.length) {
    ElMessage.warning('同一配件不能重复添加，请合并采购数量')
    return
  }

  const payload = {
    supplier_id: form.supplier_id,
    items: form.items.map((line) => ({
      part_id: line.part_id,
      quantity: Number(line.quantity),
      unit_price: Number(line.unit_price),
    })),
  }

  submitting.value = true
  try {
    await createPurchaseInbound(payload, submitKey.value)
    ElMessage.success('采购入库成功，库存已更新')
    form.supplier_id = null
    form.items = [createLine()]
    formRef.value?.clearValidate()
    submitKey.value = newIdempotencyKey()
    await refreshParts()
  } catch {
    // 保留当前明细，方便修正后重试。
  } finally {
    submitting.value = false
  }
}

onMounted(loadOptions)
</script>

<style scoped>
.purchase-layout {
  display: grid;
  align-items: start;
  gap: 20px;
  grid-template-columns: minmax(0, 1fr) 336px;
}

.purchase-card {
  padding: 25px 26px 26px;
}

.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 22px;
  border-bottom: 1px solid #f0f2ec;
}

.card-kicker {
  color: var(--erp-sage);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.card-heading h2 {
  margin-top: 6px;
  color: var(--erp-ink);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.035em;
}

.card-heading p {
  margin-top: 6px;
  color: var(--erp-muted);
  font-size: 11.5px;
}

.date-note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding-top: 4px;
  color: var(--erp-muted);
  font-size: 10.5px;
  white-space: nowrap;
}

.date-note .el-icon {
  color: var(--erp-sage);
}

.purchase-form {
  padding-top: 21px;
}

.supplier-panel {
  display: grid;
  align-items: start;
  gap: 18px;
  padding: 17px 18px 17px 16px;
  border: 1px solid #e9eee1;
  border-radius: 14px;
  background:
    radial-gradient(circle at 100% 0, rgba(204, 226, 141, 0.18), transparent 40%),
    #f9faf5;
  grid-template-columns: auto minmax(240px, 1fr) auto;
}

.supplier-icon {
  display: grid;
  width: 38px;
  height: 38px;
  margin-top: 27px;
  place-items: center;
  border-radius: 11px;
  color: var(--erp-green);
  background: #eaf2df;
  font-size: 17px;
}

.supplier-field {
  margin-bottom: 0;
}

.supplier-field :deep(.el-form-item__label) {
  padding-bottom: 6px;
  font-size: 11px;
}

.document-date {
  display: flex;
  padding: 24px 4px 2px 20px;
  border-left: 1px solid #e6ebde;
  flex-direction: column;
  gap: 8px;
  white-space: nowrap;
}

.document-date span {
  color: var(--erp-muted);
  font-size: 10.5px;
}

.document-date strong {
  color: var(--erp-ink-soft);
  font-size: 12px;
  font-weight: 600;
}

.details-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 27px;
}

.details-heading h3 {
  color: var(--erp-ink);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.details-heading p {
  margin-top: 4px;
  color: var(--erp-muted);
  font-size: 10.5px;
}

.line-list {
  display: flex;
  margin-top: 13px;
  flex-direction: column;
  gap: 11px;
}

.line-card {
  padding: 13px 15px 4px;
  border: 1px solid #e8ece2;
  border-radius: 13px;
  background: #fdfefb;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.line-card:focus-within {
  border-color: #bfd1bc;
  box-shadow: 0 10px 24px -22px rgba(34, 75, 49, 0.35);
}

.line-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.line-number {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #839087;
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.02em;
}

.line-number i {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 6px;
  color: #6d8267;
  background: #f0f4e9;
  font-size: 9px;
  font-style: normal;
  font-weight: 700;
}

.remove-button {
  height: 28px;
  min-height: 28px;
  padding: 0 6px;
  color: #a6afa7;
  font-size: 10px;
}

.remove-button:hover:not(.is-disabled) {
  color: var(--erp-danger);
  background: #fcf3f0;
}

.remove-button .el-icon {
  margin-right: 2px;
}

.line-grid {
  display: grid;
  align-items: start;
  gap: 0 13px;
  grid-template-columns: minmax(220px, 1.65fr) minmax(110px, 0.85fr) minmax(135px, 1fr) 112px;
}

.line-grid :deep(.el-form-item) {
  margin-bottom: 9px;
}

.line-grid :deep(.el-form-item__label) {
  padding-bottom: 5px;
  font-size: 10.5px;
  font-weight: 600;
}

.line-subtotal {
  display: flex;
  min-height: 31px;
  align-items: flex-end;
  justify-content: flex-end;
  flex-direction: column;
  gap: 6px;
  padding-top: 21px;
  text-align: right;
}

.line-subtotal span {
  color: var(--erp-muted);
  font-size: 9.5px;
}

.line-subtotal strong {
  color: var(--erp-ink);
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
}

.line-subtotal small {
  margin-right: 2px;
  color: #98a299;
  font-size: 9.5px;
  font-weight: 500;
}

.add-line {
  display: flex;
  width: 100%;
  height: 40px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 12px;
  border: 1px dashed #d9e1d3;
  border-radius: 10px;
  color: #6d7e6d;
  background: transparent;
  font-size: 11px;
  font-weight: 550;
  cursor: pointer;
  transition: all 160ms ease;
}

.add-line:hover {
  border-color: #adc2a7;
  color: var(--erp-green);
  background: #f8faf4;
}

.add-line span {
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border-radius: 5px;
  background: #f0f4e9;
  font-size: 11px;
}

.option-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.option-line small {
  color: var(--erp-muted);
  font-size: 10px;
}

.purchase-aside {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.summary-card {
  padding: 23px 23px 20px;
}

.summary-card h2 {
  margin-top: 6px;
  color: var(--erp-ink);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.035em;
}

.summary-list {
  display: flex;
  margin: 20px 0 0;
  padding: 0;
  flex-direction: column;
  gap: 13px;
}

.summary-list > div {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.summary-list dt {
  color: var(--erp-muted);
  font-size: 11px;
}

.summary-list dd {
  overflow: hidden;
  margin: 0;
  color: var(--erp-ink-soft);
  font-size: 11.5px;
  font-weight: 600;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-list dd.placeholder {
  color: #a5aea6;
  font-weight: 400;
}

.amount-panel {
  margin-top: 19px;
  padding: 16px;
  border: 1px solid #e4eadb;
  border-radius: 12px;
  background:
    radial-gradient(circle at 100% 0, rgba(204, 226, 141, 0.24), transparent 44%),
    #f7f9f0;
}

.amount-panel > span {
  color: #7e8c78;
  font-size: 10.5px;
}

.amount-panel strong {
  display: block;
  overflow: hidden;
  margin-top: 5px;
  color: var(--erp-green-deep);
  font-size: 27px;
  font-weight: 700;
  letter-spacing: -0.045em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.amount-panel strong small {
  margin-right: 3px;
  color: #8d9d86;
  font-size: 12px;
  font-weight: 550;
}

.amount-panel p {
  margin-top: 4px;
  color: #9aa694;
  font-size: 9px;
}

.submit-button {
  width: 100%;
  height: 43px;
  margin-top: 18px;
}

.reset-button {
  width: 100%;
  height: 38px;
  margin-top: 8px;
  border-color: transparent;
  color: var(--erp-muted);
  background: transparent;
  font-size: 11px;
}

.reset-button:hover {
  color: var(--erp-ink-soft);
  background: #f6f8f2;
}

.submit-hint {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin-top: 11px;
  color: #9ca69e;
  font-size: 9px;
  line-height: 1.6;
}

.submit-hint .el-icon {
  margin-top: 1px;
  flex: 0 0 auto;
  color: #b3bdb1;
}

.aside-note {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 16px 17px;
  border: 1px solid #e7e8dd;
  border-radius: 14px;
  background: rgba(251, 250, 244, 0.7);
}

.note-icon {
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  place-items: center;
  border-radius: 8px;
  color: #a57f46;
  background: #f7f0e2;
}

.aside-note strong {
  color: #5e6359;
  font-size: 10.5px;
  font-weight: 650;
}

.aside-note p {
  margin-top: 5px;
  color: #959f94;
  font-size: 9.5px;
  line-height: 1.7;
}

@media (max-width: 1180px) {
  .purchase-layout {
    grid-template-columns: minmax(0, 1fr) 306px;
  }

  .line-grid {
    grid-template-columns: minmax(190px, 1.5fr) minmax(100px, 0.8fr) minmax(120px, 0.9fr) 100px;
  }
}

@media (max-width: 1020px) {
  .purchase-layout {
    grid-template-columns: 1fr;
  }

  .purchase-aside {
    position: static;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
  }
}

@media (max-width: 760px) {
  .purchase-card {
    padding: 20px 16px;
  }

  .card-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    padding-bottom: 17px;
  }

  .date-note {
    padding-top: 0;
  }

  .supplier-panel {
    gap: 12px;
    padding: 14px;
    grid-template-columns: auto minmax(0, 1fr);
  }

  .supplier-icon {
    width: 34px;
    height: 34px;
    margin-top: 25px;
  }

  .document-date {
    display: none;
  }

  .details-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .line-grid {
    grid-template-columns: 1fr 1fr;
  }

  .part-field {
    grid-column: span 2;
  }

  .line-subtotal {
    min-height: 50px;
    align-items: flex-start;
    justify-content: flex-end;
    padding-top: 18px;
  }

  .purchase-aside {
    display: flex;
  }

  .summary-card {
    width: 100%;
  }
}

@media (max-width: 460px) {
  .line-grid {
    grid-template-columns: 1fr;
  }

  .part-field {
    grid-column: auto;
  }

  .line-subtotal {
    align-items: flex-start;
    min-height: auto;
    padding: 3px 0 12px;
  }

  .line-subtotal strong {
    font-size: 15px;
  }
}
</style>
