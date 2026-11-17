<template>
  <div class="page-shell sale-page">
    <PageHeader
      eyebrow="SALES OUTBOUND"
      title="销售出库"
      description="选择客户与配件完成销售出库，提交成功后对应配件库存将实时扣减。"
    >
      <template #actions>
        <el-button
          :icon="Refresh"
          :loading="optionsLoading"
          @click="loadOptions"
        >
          刷新库存
        </el-button>
      </template>
    </PageHeader>

    <div class="sale-layout">
      <section class="surface-card sale-card">
        <header class="card-heading">
          <div>
            <span class="card-kicker">OUTBOUND DOCUMENT</span>
            <h2>新建销售出库单</h2>
            <p>填写客户与配件信息，系统会校验可售库存。</p>
          </div>
          <span class="document-tag">
            <i />
            销售单
          </span>
        </header>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="sale-form"
        >
          <div class="form-grid">
            <el-form-item label="客户" prop="customer_id">
              <el-select
                v-model="form.customer_id"
                placeholder="请选择本次销售客户"
                filterable
                clearable
                :loading="optionsLoading"
                no-data-text="暂无可选客户"
              >
                <el-option
                  v-for="customer in customers"
                  :key="customer.id"
                  :label="customer.name || `客户 #${customer.id}`"
                  :value="customer.id"
                >
                  <div class="option-line">
                    <span>{{ customer.name || `客户 #${customer.id}` }}</span>
                    <small v-if="customer.contact">{{ customer.contact }}</small>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="配件" prop="part_id">
              <el-select
                v-model="form.part_id"
                placeholder="搜索并选择配件"
                filterable
                clearable
                :loading="optionsLoading"
                no-data-text="暂无可售配件"
                @change="handlePartChange"
              >
                <el-option
                  v-for="part in parts"
                  :key="part.id"
                  :label="`${part.name}${part.model ? ` · ${part.model}` : ''}`"
                  :value="part.id"
                  :disabled="part.stock <= 0"
                >
                  <div class="option-line">
                    <span>
                      {{ part.name }}
                      <em v-if="part.brand">· {{ part.brand }}</em>
                    </span>
                    <small :class="{ 'is-out': part.stock <= 0 }">
                      {{ part.stock <= 0 ? '已售罄' : `库存 ${part.stock}` }}
                    </small>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </div>

          <div v-if="selectedPart" class="part-insight" :class="{ 'is-low': isLowStock(selectedPart) }">
            <div class="insight-top">
              <span class="insight-icon">
                <el-icon><Goods /></el-icon>
              </span>
              <div class="insight-title">
                <strong>{{ selectedPart.name }}</strong>
                <span>
                  {{ selectedPart.model || '未填写型号' }}
                  <i v-if="selectedPart.brand">· {{ selectedPart.brand }}</i>
                </span>
              </div>
              <el-tag
                :type="isLowStock(selectedPart) ? 'danger' : 'success'"
                effect="light"
                round
              >
                {{ isLowStock(selectedPart) ? '库存偏低' : '库存正常' }}
              </el-tag>
            </div>

            <div class="insight-metrics">
              <div>
                <span>当前可售库存</span>
                <strong :class="{ 'is-danger': isLowStock(selectedPart) }">
                  {{ formatNumber(selectedPart.stock) }}<small>件</small>
                </strong>
              </div>
              <div>
                <span>安全库存</span>
                <strong>{{ formatNumber(selectedPart.safe_stock) }}<small>件</small></strong>
              </div>
              <div>
                <span>销售单价</span>
                <strong><small>¥</small>{{ formatMoney(selectedPart.price) }}</strong>
              </div>
            </div>

            <p v-if="isLowStock(selectedPart)" class="insight-warning">
              <el-icon><WarningFilled /></el-icon>
              该配件库存已达到安全线，请确认剩余库存后再出库。
            </p>
          </div>

          <div v-else class="part-placeholder">
            <span><el-icon><Goods /></el-icon></span>
            <div>
              <strong>先选择一件配件</strong>
              <p>这里会显示库存、单价与安全库存信息。</p>
            </div>
          </div>

          <div class="quantity-row">
            <el-form-item label="销售数量" prop="quantity" class="quantity-field">
              <el-input-number
                v-model="form.quantity"
                :min="1"
                :max="selectedPart?.stock || undefined"
                :precision="0"
                :step="1"
                controls-position="right"
                :disabled="!selectedPart"
              />
            </el-form-item>
            <p class="quantity-help">
              <el-icon><InfoFilled /></el-icon>
              最多可售 {{ selectedPart ? formatNumber(selectedPart.stock) : 0 }} 件，提交前会再次校验库存。
            </p>
          </div>

          <div class="form-actions">
            <el-button :disabled="submitting" @click="handleReset">清空重填</el-button>
            <span class="action-hint">确认信息后，在右侧预览并提交出库</span>
          </div>
        </el-form>
      </section>

      <aside class="sale-aside">
        <section class="surface-card bill-card">
          <header class="bill-heading">
            <div>
              <span class="card-kicker">OUTBOUND PREVIEW</span>
              <h2>出库预览</h2>
            </div>
            <span class="bill-tag">待提交</span>
          </header>

          <dl class="bill-list">
            <div>
              <dt>客户</dt>
              <dd :class="{ placeholder: !selectedCustomer }">
                {{ selectedCustomer?.name || '尚未选择' }}
              </dd>
            </div>
            <div>
              <dt>配件</dt>
              <dd :class="{ placeholder: !selectedPart }">
                {{ selectedPart?.name || '尚未选择' }}
              </dd>
            </div>
            <div>
              <dt>销售数量</dt>
              <dd>{{ selectedPart ? `${formatNumber(form.quantity)} 件` : '—' }}</dd>
            </div>
          </dl>

          <div class="bill-amount">
            <span>预计销售金额</span>
            <strong class="money">
              <small>¥</small>{{ formatMoney(estimatedTotal) }}
            </strong>
            <p>实际成交金额以后端出库记录为准</p>
          </div>

          <el-button
            type="primary"
            class="submit-button"
            :loading="submitting"
            @click="handleSubmit"
          >
            {{ submitting ? '正在出库…' : '确认销售出库' }}
          </el-button>

          <p class="submit-hint">
            <el-icon><InfoFilled /></el-icon>
            出库提交后将扣减库存，请确认数量无误。
          </p>
        </section>

        <section class="aside-note">
          <span class="note-icon"><el-icon><Sell /></el-icon></span>
          <div>
            <strong>库存不足会自动拦截</strong>
            <p>若后端校验库存不足，系统会弹窗提示，不会产生销售记录。</p>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Goods,
  InfoFilled,
  Refresh,
  Sell,
  WarningFilled,
} from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { getPartOptions } from '@/api/parts'
import { getCustomers } from '@/api/customers'
import { createSaleOutbound } from '@/api/sales'
import { getErrorMessage } from '@/utils/request'
import { isLowStock } from '@/utils/normalize'
import { formatMoney, formatNumber } from '@/utils/format'

const formRef = ref(null)
const parts = ref([])
const customers = ref([])
const optionsLoading = ref(false)
const submitting = ref(false)

const form = reactive({
  customer_id: null,
  part_id: null,
  quantity: 1,
})

const rules = {
  customer_id: [{ required: true, message: '请选择销售客户', trigger: 'change' }],
  part_id: [{ required: true, message: '请选择销售配件', trigger: 'change' }],
  quantity: [
    {
      validator(_rule, value, callback) {
        const quantity = Number(value)
        if (!Number.isFinite(quantity) || quantity <= 0) {
          callback(new Error('销售数量必须大于 0'))
          return
        }
        if (selectedPart.value && quantity > selectedPart.value.stock) {
          callback(new Error('销售数量不能超过当前库存'))
          return
        }
        callback()
      },
      trigger: 'change',
    },
  ],
}

const selectedPart = computed(
  () =>
    parts.value.find(
      (part) => String(part.id) === String(form.part_id),
    ) || null,
)

const selectedCustomer = computed(
  () =>
    customers.value.find(
      (customer) => String(customer.id) === String(form.customer_id),
    ) || null,
)

const estimatedTotal = computed(
  () =>
    (Number(selectedPart.value?.price) || 0) *
    (Number(form.quantity) || 0),
)

async function loadOptions() {
  if (optionsLoading.value) return
  optionsLoading.value = true

  const [partResult, customerResult] = await Promise.allSettled([
    getPartOptions(),
    getCustomers(),
  ])

  if (partResult.status === 'fulfilled') {
    parts.value = partResult.value
    if (
      form.part_id !== null &&
      !parts.value.some((part) => String(part.id) === String(form.part_id))
    ) {
      form.part_id = null
      form.quantity = 1
    }
  }

  if (customerResult.status === 'fulfilled') {
    customers.value = customerResult.value
    if (
      form.customer_id !== null &&
      !customers.value.some(
        (customer) => String(customer.id) === String(form.customer_id),
      )
    ) {
      form.customer_id = null
    }
  }

  optionsLoading.value = false
}

async function refreshParts() {
  try {
    const latest = await getPartOptions()
    parts.value = latest

    const currentPart = latest.find(
      (part) => String(part.id) === String(form.part_id),
    )

    if (!currentPart) {
      form.part_id = null
      form.quantity = 1
    } else if (currentPart.stock <= 0) {
      form.part_id = null
      form.quantity = 1
      ElMessage.warning('该配件库存已售罄，已为你清空配件选择')
    } else if (currentPart.stock < form.quantity) {
      form.quantity = currentPart.stock
    }
  } catch {
    // 错误提示交由请求拦截器处理。
  }
}

function handlePartChange() {
  form.quantity = 1
  formRef.value?.clearValidate('quantity')
}

function handleReset() {
  if (submitting.value) return
  form.customer_id = null
  form.part_id = null
  form.quantity = 1
  formRef.value?.clearValidate()
  ElMessage.info('已清空当前出库单')
}

function showStockAlert(message) {
  ElMessageBox.alert(message, '库存不足', {
    type: 'error',
    confirmButtonText: '我知道了',
    title: '库存不足',
  }).catch(() => {})
}

function isStockMessage(message = '') {
  return /库存|stock|insufficient|inventory/i.test(message)
}

async function handleSubmit() {
  if (!formRef.value || submitting.value) return

  try {
    await formRef.value.validate()
  } catch {
    ElMessage.warning('请完善客户、配件与销售数量后再提交')
    return
  }

  if (selectedPart.value && Number(form.quantity) > selectedPart.value.stock) {
    showStockAlert(
      `「${selectedPart.value.name}」当前仅剩 ${selectedPart.value.stock} 件库存，无法满足本次出库数量。`,
    )
    return
  }

  submitting.value = true
  try {
    await createSaleOutbound({
      customer_id: form.customer_id,
      part_id: form.part_id,
      quantity: Number(form.quantity),
    })

    ElMessage.success('销售出库成功，配件库存已更新')
    form.quantity = 1
    await refreshParts()
  } catch (error) {
    if (error?.isAuthError || error?.response?.status === 401) return

    const message = getErrorMessage(error, '销售出库失败，请稍后重试')
    if (isStockMessage(message)) {
      showStockAlert(message)
    } else {
      ElMessage.error(message)
    }
  } finally {
    submitting.value = false
  }
}

onMounted(loadOptions)
</script>

<style scoped>
.sale-layout {
  display: grid;
  align-items: start;
  gap: 20px;
  grid-template-columns: minmax(0, 1fr) 344px;
}

.sale-card {
  padding: 25px 26px 24px;
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

.document-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  border: 1px solid #e5ebdb;
  border-radius: 7px;
  color: #74856f;
  background: #f8faf3;
  font-size: 9.5px;
  font-weight: 600;
  white-space: nowrap;
}

.document-tag i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #7e9c64;
}

.sale-form {
  padding-top: 24px;
}

.form-grid {
  display: grid;
  gap: 0 17px;
  grid-template-columns: 1fr 1fr;
}

.form-grid :deep(.el-form-item) {
  margin-bottom: 22px;
}

.part-insight {
  padding: 17px;
  border: 1px solid #e4ebdc;
  border-radius: 15px;
  background:
    radial-gradient(circle at 100% 0, rgba(204, 226, 141, 0.2), transparent 37%),
    #f9faf5;
  transition: border-color 180ms ease;
}

.part-insight.is-low {
  border-color: #efdcd5;
  background:
    radial-gradient(circle at 100% 0, rgba(228, 178, 157, 0.16), transparent 37%),
    #fdf9f6;
}

.insight-top {
  display: flex;
  align-items: center;
  gap: 11px;
}

.insight-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border-radius: 11px;
  color: #5f7c50;
  background: #eaf2df;
  font-size: 17px;
}

.is-low .insight-icon {
  color: #9f6a55;
  background: #f8ece7;
}

.insight-title {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.insight-title strong {
  overflow: hidden;
  color: var(--erp-ink);
  font-size: 13px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.insight-title span {
  overflow: hidden;
  color: var(--erp-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.insight-title i {
  font-style: normal;
}

.insight-top :deep(.el-tag) {
  flex: 0 0 auto;
  font-size: 9.5px;
}

.insight-metrics {
  display: grid;
  margin-top: 17px;
  padding-top: 15px;
  border-top: 1px solid rgba(223, 230, 216, 0.78);
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.insight-metrics > div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.insight-metrics > div + div {
  padding-left: 15px;
  border-left: 1px solid rgba(223, 230, 216, 0.78);
}

.insight-metrics span {
  color: var(--erp-muted);
  font-size: 9.5px;
}

.insight-metrics strong {
  color: var(--erp-ink);
  font-size: 16px;
  font-weight: 650;
  letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums;
}

.insight-metrics strong.is-danger {
  color: var(--erp-danger);
}

.insight-metrics small {
  margin-left: 3px;
  color: #929d94;
  font-size: 9px;
  font-weight: 500;
}

.insight-warning {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin-top: 13px;
  color: #b06b50;
  font-size: 9.5px;
  line-height: 1.55;
}

.insight-warning .el-icon {
  margin-top: 1px;
  flex: 0 0 auto;
}

.part-placeholder {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 22px 18px;
  border: 1px dashed #dfe6d9;
  border-radius: 14px;
  background: #fbfcf8;
}

.part-placeholder > span {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border-radius: 12px;
  color: #96a290;
  background: #f1f5eb;
  font-size: 18px;
}

.part-placeholder strong {
  color: #667366;
  font-size: 11.5px;
  font-weight: 600;
}

.part-placeholder p {
  margin-top: 4px;
  color: #9ba49b;
  font-size: 9.5px;
}

.quantity-row {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  margin-top: 20px;
}

.quantity-field {
  width: 190px;
  flex: 0 0 190px;
  margin-bottom: 0;
}

.quantity-help {
  display: flex;
  align-items: center;
  gap: 5px;
  padding-bottom: 10px;
  color: var(--erp-muted);
  font-size: 9.5px;
  line-height: 1.5;
}

.quantity-help .el-icon {
  flex: 0 0 auto;
  color: #abb6a9;
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid #f0f2ec;
}

.action-hint {
  color: #a1aaa2;
  font-size: 9.5px;
}

.sale-aside {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bill-card {
  padding: 23px 23px 20px;
}

.bill-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.bill-heading h2 {
  margin-top: 6px;
  color: var(--erp-ink);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.035em;
}

.bill-tag {
  padding: 4px 8px;
  border-radius: 6px;
  color: #94703a;
  background: #faf2e2;
  font-size: 9px;
  font-weight: 600;
}

.bill-list {
  display: flex;
  margin: 20px 0 0;
  padding: 0;
  flex-direction: column;
  gap: 13px;
}

.bill-list > div {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.bill-list dt {
  color: var(--erp-muted);
  font-size: 11px;
}

.bill-list dd {
  overflow: hidden;
  margin: 0;
  color: var(--erp-ink-soft);
  font-size: 11.5px;
  font-weight: 600;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bill-list dd.placeholder {
  color: #a5aea6;
  font-weight: 400;
}

.bill-amount {
  margin-top: 19px;
  padding: 16px;
  border: 1px solid #e4eadb;
  border-radius: 12px;
  background:
    radial-gradient(circle at 100% 0, rgba(204, 226, 141, 0.24), transparent 44%),
    #f7f9f0;
}

.bill-amount > span {
  color: #7e8c78;
  font-size: 10.5px;
}

.bill-amount strong {
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

.bill-amount strong small {
  margin-right: 3px;
  color: #8d9d86;
  font-size: 12px;
  font-weight: 550;
}

.bill-amount p {
  margin-top: 4px;
  color: #9aa694;
  font-size: 9px;
}

.submit-button {
  width: 100%;
  height: 43px;
  margin-top: 18px;
}

.submit-hint {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin-top: 12px;
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
  color: #9b7542;
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

.option-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.option-line em {
  color: #a2aca1;
  font-style: normal;
}

.option-line small {
  color: var(--erp-muted);
  font-size: 10px;
}

.option-line small.is-out {
  color: var(--erp-danger);
}

@media (max-width: 1180px) {
  .sale-layout {
    grid-template-columns: minmax(0, 1fr) 312px;
  }
}

@media (max-width: 1020px) {
  .sale-layout {
    grid-template-columns: 1fr;
  }

  .sale-aside {
    position: static;
    display: grid;
    align-items: start;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

@media (max-width: 760px) {
  .sale-card {
    padding: 20px 16px;
  }

  .card-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    padding-bottom: 17px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .form-grid :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  .insight-top {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .insight-title {
    flex-basis: calc(100% - 52px);
  }

  .insight-top :deep(.el-tag) {
    margin-left: 49px;
  }

  .insight-metrics {
    grid-template-columns: 1fr 1fr;
  }

  .insight-metrics > div:nth-child(3) {
    grid-column: span 2;
    padding-top: 10px;
    padding-left: 0;
    border-top: 1px solid rgba(223, 230, 216, 0.78);
    border-left: 0;
  }

  .quantity-row {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
  }

  .quantity-field {
    width: 100%;
    flex-basis: auto;
  }

  .quantity-help {
    padding-bottom: 0;
  }

  .form-actions {
    align-items: flex-start;
    flex-direction: column;
    gap: 9px;
  }

  .sale-aside {
    display: flex;
  }

  .bill-card {
    width: 100%;
  }
}

@media (max-width: 420px) {
  .insight-metrics {
    grid-template-columns: 1fr;
  }

  .insight-metrics > div:nth-child(3) {
    grid-column: auto;
  }

  .insight-metrics > div + div {
    padding-top: 9px;
    padding-left: 0;
    border-top: 1px solid rgba(223, 230, 216, 0.78);
    border-left: 0;
  }
}
</style>
