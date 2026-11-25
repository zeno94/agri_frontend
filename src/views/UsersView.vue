<template>
  <div class="page-shell users-page">
    <PageHeader
      eyebrow="ACCESS CONTROL"
      title="用户管理"
      description="管理员创建普通用户，并勾选他能看到的功能模块；普通用户不能自行开通模块。"
    >
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="openCreate">创建普通用户</el-button>
      </template>
    </PageHeader>

    <section class="surface-card table-card">
      <header class="table-card-head">
        <div>
          <h2>账号与功能权限</h2>
          <p>管理员默认拥有全部模块；普通用户只显示已勾选的模块。</p>
        </div>
        <span class="legend"><i class="legend-dot" />{{ formatNumber(users.length) }} 个账号</span>
      </header>

      <el-table v-loading="loading" :data="users" row-key="id" :header-cell-style="{ background: '#f7f8f4' }">
        <el-table-column label="账号" min-width="170">
          <template #default="{ row }">
            <div class="user-cell">
              <span class="user-avatar">{{ firstChar(row.username) }}</span>
              <span><strong>{{ row.username }}</strong><small>#{{ row.id }}</small></span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="110">
          <template #default="{ row }">
            <el-tag :type="row.role === 'boss' ? 'warning' : 'info'" effect="plain" round>{{ row.role === 'boss' ? '管理员' : '普通用户' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }"><el-tag :type="row.is_active ? 'success' : 'info'" effect="plain">{{ row.is_active ? '启用' : '停用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="可用模块" min-width="320">
          <template #default="{ row }">
            <div v-if="row.role === 'boss'" class="module-tags"><el-tag type="warning" effect="plain">全部模块</el-tag></div>
            <div v-else class="module-tags">
              <el-tag v-for="module in row.modules || []" :key="module.code" size="small" effect="plain">{{ module.name }}</el-tag>
              <span v-if="!(row.modules || []).length" class="text-muted">未分配</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="126">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <template v-if="row.role !== 'boss'">
              <el-button link type="primary" @click="openModules(row)">分配功能</el-button>
              <el-button link @click="openReset(row)">重置密码</el-button>
              <el-button link :type="row.is_active ? 'danger' : 'success'" @click="toggleActive(row)">{{ row.is_active ? '停用' : '启用' }}</el-button>
            </template>
            <span v-else class="text-muted">受保护</span>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="createVisible" width="560px" align-center destroy-on-close :close-on-click-modal="false">
      <template #header>
        <div class="dialog-heading"><span class="dialog-icon"><el-icon><User /></el-icon></span><div><h3>创建普通用户</h3><p>账号、初始密码和第一批可用模块。</p></div></div>
      </template>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-position="top">
        <el-form-item label="登录账号" prop="username"><el-input v-model="createForm.username" placeholder="字母/数字，例如 staff02" maxlength="50" /></el-form-item>
        <el-form-item label="初始密码" prop="password"><el-input v-model="createForm.password" type="password" show-password placeholder="至少 8 位" maxlength="128" /></el-form-item>
        <el-form-item label="可用模块">
          <el-checkbox-group v-model="createForm.module_codes" class="module-checks">
            <el-checkbox v-for="module in assignableModules" :key="module.code" :value="module.code">{{ module.name }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button @click="createVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveCreate">创建账号</el-button></div></template>
    </el-dialog>

    <el-dialog v-model="modulesVisible" width="520px" align-center destroy-on-close>
      <template #header>
        <div class="dialog-heading"><span class="dialog-icon"><el-icon><Setting /></el-icon></span><div><h3>分配可用功能</h3><p>{{ editingUser?.username }} 登录后只能看到勾选的模块。</p></div></div>
      </template>
      <el-checkbox-group v-model="selectedModules" class="module-checks">
        <el-checkbox v-for="module in assignableModules" :key="module.code" :value="module.code">{{ module.name }}</el-checkbox>
      </el-checkbox-group>
      <template #footer><div class="dialog-footer"><el-button @click="modulesVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveModules">保存分配</el-button></div></template>
    </el-dialog>

    <el-dialog v-model="resetVisible" width="460px" align-center destroy-on-close>
      <template #header><div class="dialog-heading"><span class="dialog-icon"><el-icon><Key /></el-icon></span><div><h3>重置密码</h3><p>{{ editingUser?.username }} 的新登录密码。</p></div></div></template>
      <el-form label-position="top"><el-form-item label="新密码"><el-input v-model="newPassword" type="password" show-password placeholder="至少 8 位" maxlength="128" /></el-form-item></el-form>
      <template #footer><div class="dialog-footer"><el-button @click="resetVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveReset">确认重置</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Key, Plus, Setting, User } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { listModules } from '@/api/modules'
import { createUser, listUsers, resetUserPassword, setUserModules, updateUser } from '@/api/users'
import { formatNumber } from '@/utils/format'

const loading = ref(false)
const saving = ref(false)
const users = ref([])
const modules = ref([])
const assignableModules = computed(() => modules.value.filter((module) => !module.is_admin_only && module.is_active))

const createVisible = ref(false)
const createFormRef = ref(null)
const createForm = reactive({ username: '', password: '', module_codes: ['parts', 'sale', 'sales', 'customers'] })
const createRules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }, { min: 3, message: '至少 3 位', trigger: 'blur' }],
  password: [{ required: true, message: '请输入初始密码', trigger: 'blur' }, { min: 8, message: '至少 8 位', trigger: 'blur' }],
}

const modulesVisible = ref(false)
const selectedModules = ref([])
const editingUser = ref(null)
const resetVisible = ref(false)
const newPassword = ref('')

function firstChar(name) {
  return String(name || '用').slice(0, 1).toUpperCase()
}

function formatTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

async function load() {
  loading.value = true
  try {
    const [userList, moduleList] = await Promise.all([listUsers(), listModules()])
    users.value = userList || []
    modules.value = moduleList || []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  Object.assign(createForm, { username: '', password: '', module_codes: ['parts', 'sale', 'sales', 'customers'] })
  createVisible.value = true
  nextTick(() => createFormRef.value?.clearValidate())
}

async function saveCreate() {
  if (!createFormRef.value || saving.value) return
  try { await createFormRef.value.validate() } catch { return }
  saving.value = true
  try {
    await createUser({ username: createForm.username.trim(), password: createForm.password, module_codes: createForm.module_codes })
    ElMessage.success('普通用户已创建')
    createVisible.value = false
    await load()
  } finally { saving.value = false }
}

function openModules(row) {
  editingUser.value = row
  selectedModules.value = (row.modules || []).map((module) => module.code)
  modulesVisible.value = true
}

async function saveModules() {
  if (!editingUser.value || saving.value) return
  saving.value = true
  try {
    await setUserModules(editingUser.value.id, selectedModules.value)
    ElMessage.success('功能权限已更新')
    modulesVisible.value = false
    await load()
  } finally { saving.value = false }
}

function openReset(row) {
  editingUser.value = row
  newPassword.value = ''
  resetVisible.value = true
}

async function saveReset() {
  if (!editingUser.value || saving.value) return
  if (newPassword.value.length < 8) { ElMessage.warning('密码至少 8 位'); return }
  saving.value = true
  try {
    await resetUserPassword(editingUser.value.id, newPassword.value)
    ElMessage.success('密码已重置')
    resetVisible.value = false
  } finally { saving.value = false }
}

async function toggleActive(row) {
  try {
    await ElMessageBox.confirm(`确认${row.is_active ? '停用' : '启用'}账号「${row.username}」？`, '账号状态', { type: 'warning' })
  } catch { return }
  await updateUser(row.id, { is_active: !row.is_active })
  ElMessage.success(row.is_active ? '账号已停用' : '账号已启用')
  await load()
}

onMounted(load)
</script>

<style scoped>
.table-card { padding: 0 18px 16px; }
.table-card-head { display: flex; align-items: flex-end; justify-content: space-between; padding: 18px 2px 14px; gap: 16px; }
.table-card-head h2 { font-size: 16px; }
.table-card-head p { margin-top: 4px; color: var(--erp-muted); font-size: 12px; }
.legend { display: flex; align-items: center; gap: 6px; color: var(--erp-muted); font-size: 11px; }
.legend-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--erp-green); }
.user-cell { display: flex; align-items: center; gap: 10px; }
.user-cell > span:last-child { display: flex; flex-direction: column; gap: 2px; }
.user-cell small { color: var(--erp-muted); font-size: 11px; }
.user-avatar { display: grid; width: 32px; height: 32px; border-radius: 10px; color: var(--erp-green); background: var(--erp-lime-soft); font-weight: 700; place-items: center; }
.module-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.module-checks { display: grid; width: 100%; gap: 8px 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.dialog-heading { display: flex; align-items: center; gap: 12px; }
.dialog-icon { display: grid; width: 40px; height: 40px; border-radius: 12px; color: var(--erp-green); background: var(--erp-lime-soft); font-size: 20px; place-items: center; }
.dialog-heading h3 { font-size: 17px; }
.dialog-heading p { margin-top: 3px; color: var(--erp-muted); font-size: 12px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
@media (max-width: 700px) { .module-checks { grid-template-columns: 1fr; } }
</style>
