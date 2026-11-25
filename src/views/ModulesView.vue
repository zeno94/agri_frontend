<template>
  <div class="page-shell modules-page">
    <PageHeader
      eyebrow="MODULE REGISTRY"
      title="模块配置"
      description="管理员可以启用/停用系统模块、调整导航名称与排序；普通用户只能在「用户管理」里分配已启用的模块。"
    >
      <template #actions><el-tag type="info" effect="plain" round>系统内置模块</el-tag></template>
    </PageHeader>

    <section class="surface-card notice-card">
      <el-icon><InfoFilled /></el-icon>
      <p>停用模块后，所有普通用户立即失去该模块入口；管理员仍可访问。管理员专属模块不能分配给普通用户。</p>
    </section>

    <section class="surface-card table-card">
      <el-table v-loading="loading" :data="modules" row-key="id" :header-cell-style="{ background: '#f7f8f4' }">
        <el-table-column label="模块" min-width="220">
          <template #default="{ row }">
            <div class="module-cell">
              <span class="module-icon"><el-icon><component :is="iconFor(row.icon)" /></el-icon></span>
              <span><strong>{{ row.name }}</strong><small>{{ row.code }} · {{ row.path }}</small></span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ row.description || '—' }}</template>
        </el-table-column>
        <el-table-column label="类型" width="144">
          <template #default="{ row }">
            <div class="role-tags">
              <el-tag type="warning" effect="plain">管理员</el-tag>
              <el-tag v-if="!row.is_admin_only" type="info" effect="plain">业务员</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="排序" width="80" align="right">
          <template #default="{ row }">{{ row.sort_order }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-switch :model-value="row.is_active" @change="(value) => toggle(row, 'is_active', value)" /></template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }"><el-button link type="primary" @click="openEdit(row)">编辑</el-button></template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="editVisible" width="520px" align-center destroy-on-close>
      <template #header><div class="dialog-heading"><span class="dialog-icon"><el-icon><Setting /></el-icon></span><div><h3>编辑模块</h3><p>{{ form.code }}</p></div></div></template>
      <el-form label-position="top">
        <el-form-item label="导航名称"><el-input v-model="form.name" maxlength="50" /></el-form-item>
        <el-form-item label="图标"><el-select v-model="form.icon"><el-option v-for="icon in iconOptions" :key="icon" :label="icon" :value="icon" /></el-select></el-form-item>
        <el-form-item label="说明"><el-input v-model="form.description" type="textarea" :rows="2" maxlength="255" show-word-limit /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort_order" :min="0" :max="9999" :precision="0" controls-position="right" /></el-form-item>
        <el-form-item label="管理员专属"><el-switch v-model="form.is_admin_only" active-text="仅管理员" inactive-text="可分配" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="form.is_active" active-text="启用" inactive-text="停用" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button @click="editVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存配置</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, Setting } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { listModules, updateModule } from '@/api/modules'
import { moduleIcon } from '@/utils/modules'

const iconOptions = ['DataBoard', 'Box', 'ShoppingCart', 'Sell', 'Tickets', 'UserFilled', 'Van', 'Warning', 'Document', 'User', 'Setting', 'Grid']
const loading = ref(false)
const saving = ref(false)
const modules = ref([])
const editVisible = ref(false)
const form = reactive({ id: null, code: '', name: '', icon: 'Grid', description: '', sort_order: 0, is_active: true, is_admin_only: false })

function iconFor(name) { return moduleIcon(name) }

async function load() {
  loading.value = true
  try { modules.value = await listModules() } finally { loading.value = false }
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id, code: row.code, name: row.name, icon: row.icon || 'Grid',
    description: row.description || '', sort_order: row.sort_order,
    is_active: row.is_active, is_admin_only: row.is_admin_only,
  })
  editVisible.value = true
}

async function patch(row, payload, successMessage) {
  const result = await updateModule(row.id, payload)
  Object.assign(row, result)
  ElMessage.success(successMessage)
}

async function toggle(row, key, value) {
  try { await patch(row, { [key]: value }, value ? '模块已启用' : '模块已停用') } catch { /* handled globally */ }
}

async function save() {
  if (saving.value) return
  saving.value = true
  try {
    const result = await updateModule(form.id, {
      name: form.name.trim(), icon: form.icon, description: form.description,
      sort_order: Number(form.sort_order), is_active: form.is_active, is_admin_only: form.is_admin_only,
    })
    const index = modules.value.findIndex((item) => item.id === result.id)
    if (index >= 0) modules.value[index] = result
    ElMessage.success('模块配置已保存')
    editVisible.value = false
  } finally { saving.value = false }
}

onMounted(load)
</script>

<style scoped>
.notice-card { display: flex; align-items: flex-start; margin-bottom: 16px; padding: 14px 18px; gap: 10px; color: var(--erp-ink-soft); font-size: 12px; line-height: 1.7; }
.notice-card .el-icon { flex: 0 0 auto; margin-top: 3px; color: var(--erp-warning); }
.table-card { padding: 0 18px 16px; }
.module-cell { display: flex; align-items: center; gap: 10px; }
.module-cell > span:last-child { display: flex; flex-direction: column; gap: 2px; }
.module-cell small { color: var(--erp-muted); font-size: 11px; }
.module-icon { display: grid; width: 32px; height: 32px; border-radius: 10px; color: var(--erp-green); background: var(--erp-lime-soft); font-size: 15px; place-items: center; }
.dialog-heading { display: flex; align-items: center; gap: 12px; }
.dialog-icon { display: grid; width: 40px; height: 40px; border-radius: 12px; color: var(--erp-green); background: var(--erp-lime-soft); font-size: 20px; place-items: center; }
.dialog-heading h3 { font-size: 17px; }
.dialog-heading p { margin-top: 3px; color: var(--erp-muted); font-size: 12px; }
.role-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
</style>
