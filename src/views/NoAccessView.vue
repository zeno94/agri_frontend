<template>
  <div class="page-shell no-access-page">
    <section class="surface-card no-access-card">
      <span class="no-access-icon"><el-icon><Lock /></el-icon></span>
      <span class="eyebrow">ACCESS CONTROL</span>
      <h1>当前账号还没有分配功能</h1>
      <p>
        管理员还没有给你的账号分配可用模块。请联系管理员，在「用户管理」里勾选你需要使用的功能。
      </p>
      <el-button type="primary" @click="handleLogout">重新登录</el-button>
    </section>
  </div>
</template>

<script setup>
import { Lock } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { clearSession } from '@/utils/auth'

const router = useRouter()

async function handleLogout() {
  clearSession()
  await router.replace({ name: 'Login' })
}
</script>

<style scoped>
.no-access-page {
  display: grid;
  min-height: calc(100vh - 150px);
  place-items: center;
}

.no-access-card {
  display: flex;
  max-width: 560px;
  align-items: center;
  flex-direction: column;
  padding: 48px 42px;
  text-align: center;
}

.no-access-icon {
  display: grid;
  width: 64px;
  height: 64px;
  margin-bottom: 20px;
  border-radius: 18px;
  color: var(--erp-green);
  background: var(--erp-lime-soft);
  font-size: 28px;
  place-items: center;
}

h1 {
  margin-top: 12px;
  font-size: 26px;
  letter-spacing: -0.03em;
}

p {
  max-width: 430px;
  margin: 12px 0 24px;
  color: var(--erp-ink-soft);
  line-height: 1.8;
}
</style>
