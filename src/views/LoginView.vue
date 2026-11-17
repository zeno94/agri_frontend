<template>
  <main class="login-page">
    <div class="ambient ambient-one" aria-hidden="true" />
    <div class="ambient ambient-two" aria-hidden="true" />

    <section class="login-shell">
      <aside class="login-story">
        <div class="story-top">
          <BrandMark light />
          <span class="system-pill">
            <i />
            内部运营系统
          </span>
        </div>

        <div class="story-copy">
          <span class="story-eyebrow">AGRI PARTS · OPERATIONS</span>
          <h1>把每一颗零件，<br />送到丰收的田野。</h1>
          <p>
            一套为农机配件生意打造的进销存工作台，让采购、销售与库存风险始终清晰可见。
          </p>
        </div>

        <ul class="feature-list">
          <li><el-icon><Check /></el-icon>采购入库与销售出库全流程</li>
          <li><el-icon><Check /></el-icon>安全库存实时预警</li>
          <li><el-icon><Check /></el-icon>经营看板一键掌握</li>
        </ul>

        <div class="field-art" aria-hidden="true">
          <svg viewBox="0 0 620 230" fill="none" preserveAspectRatio="xMidYMax slice">
            <circle cx="478" cy="56" r="50" fill="#cce28d" fill-opacity=".16" />
            <circle cx="478" cy="56" r="31" fill="#cce28d" fill-opacity=".12" />
            <path d="M-20 196C92 126 178 136 266 182C344 223 425 219 493 178C548 145 592 139 650 162" stroke="#DFEABF" stroke-opacity=".22" stroke-width="1.4" />
            <path d="M-20 214C95 154 181 162 267 200C356 239 440 229 504 194C558 164 606 160 650 181" stroke="#DFEABF" stroke-opacity=".3" stroke-width="1.2" />
            <path d="M-20 232C105 182 185 188 271 220C358 252 449 246 514 215C565 190 614 187 650 201" stroke="#DFEABF" stroke-opacity=".18" stroke-width="1.2" />
            <path d="M54 168C91 140 132 122 178 113M95 187C135 157 183 139 236 129" stroke="#DFEABF" stroke-opacity=".2" stroke-linecap="round" />
            <path d="M432 125C466 96 505 81 551 77M449 143C482 115 521 101 570 98" stroke="#DFEABF" stroke-opacity=".14" stroke-linecap="round" />
          </svg>
          <div class="art-caption">
            <span>沃野千里</span>
            <span class="art-line" />
            <span>配件有序</span>
          </div>
        </div>
      </aside>

      <section class="login-panel">
        <div class="mobile-brand">
          <BrandMark />
        </div>

        <div class="form-heading">
          <span class="eyebrow">WELCOME BACK</span>
          <h2>登录管理后台</h2>
          <p>请使用管理员分配的账号进入工作台。</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          class="login-form"
          @submit.prevent
        >
          <el-form-item label="账号" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入登录账号"
              autocomplete="username"
              clearable
              :prefix-icon="User"
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入登录密码"
              autocomplete="current-password"
              show-password
              :prefix-icon="Lock"
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <div class="form-assist">
            <span class="secure-note">
              <el-icon><Lock /></el-icon>
              凭证仅用于身份验证
            </span>
            <span class="online-note"><i /> 服务在线</span>
          </div>

          <el-button
            type="primary"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '正在登录…' : '进入管理后台' }}
            <el-icon v-if="!loading"><ArrowRight /></el-icon>
          </el-button>
        </el-form>

        <p class="support-note">
          遇到登录问题，请联系系统管理员或运营负责人。
        </p>

        <footer class="login-footer">
          <span>农机配件进销存 ERP</span>
          <span>v1.0</span>
        </footer>
      </section>
    </section>

    <p class="page-copyright">
      © {{ currentYear }} 农机配件进销存 ERP · 让配件流转更高效
    </p>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowRight,
  Check,
  Lock,
  User,
} from '@element-plus/icons-vue'
import BrandMark from '@/components/BrandMark.vue'
import { loginApi } from '@/api/auth'
import { saveSession } from '@/utils/auth'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const loading = ref(false)
const currentYear = new Date().getFullYear()

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入登录密码', trigger: 'blur' }],
}

function safeRedirect() {
  const target = route.query.redirect
  if (
    typeof target === 'string' &&
    target.startsWith('/') &&
    !target.startsWith('//')
  ) {
    return target
  }
  return '/dashboard'
}

async function handleLogin() {
  if (!formRef.value || loading.value) return
  loading.value = true

  try {
    await formRef.value.validate()
  } catch {
    loading.value = false
    return
  }

  try {
    const { token, user } = await loginApi({
      username: form.username.trim(),
      password: form.password,
    })

    saveSession(token, user)
    const name =
      user?.real_name || user?.name || user?.username || form.username.trim()
    ElMessage.success(`欢迎回来，${name}`)
    await router.replace(safeRedirect())
  } catch (error) {
    // Axios 拦截器已展示网络 / 业务错误；这里兜底处理响应结构异常。
    if (!error?.config && !error?.isBusinessError) {
      ElMessage.error(error?.message || '登录失败，请稍后重试')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  overflow: hidden;
  padding: 32px 24px 22px;
  background:
    linear-gradient(rgba(249, 250, 245, 0.92), rgba(243, 245, 237, 0.96)),
    repeating-linear-gradient(
      90deg,
      transparent 0,
      transparent 79px,
      rgba(66, 93, 72, 0.035) 80px
    ),
    repeating-linear-gradient(
      0deg,
      transparent 0,
      transparent 79px,
      rgba(66, 93, 72, 0.035) 80px
    );
}

.ambient {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
  pointer-events: none;
}

.ambient-one {
  top: -180px;
  right: -120px;
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, rgba(204, 226, 141, 0.35), transparent 66%);
}

.ambient-two {
  bottom: -220px;
  left: -170px;
  width: 590px;
  height: 590px;
  background: radial-gradient(circle, rgba(123, 155, 131, 0.18), transparent 68%);
}

.login-shell {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(1080px, 100%);
  min-height: 620px;
  overflow: hidden;
  border: 1px solid rgba(215, 222, 209, 0.92);
  border-radius: 28px;
  background: #fefefb;
  box-shadow:
    0 40px 100px -44px rgba(28, 63, 41, 0.42),
    0 12px 30px -24px rgba(30, 55, 37, 0.25);
  grid-template-columns: 0.96fr 1.04fr;
}

.login-story {
  position: relative;
  display: flex;
  min-height: 620px;
  overflow: hidden;
  flex-direction: column;
  padding: 38px 42px 34px;
  color: #f9f8f0;
  background:
    radial-gradient(circle at 76% 8%, rgba(204, 226, 141, 0.16), transparent 31%),
    radial-gradient(circle at 8% 92%, rgba(206, 183, 136, 0.12), transparent 36%),
    linear-gradient(158deg, #27583d 0%, #1b4631 44%, #123322 100%);
}

.login-story::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 100%;
  background: rgba(255, 255, 255, 0.08);
  content: '';
}

.story-top {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.system-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  color: rgba(248, 249, 239, 0.6);
  background: rgba(255, 255, 255, 0.04);
  font-size: 10px;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.system-pill i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--erp-lime);
  box-shadow: 0 0 0 3px rgba(204, 226, 141, 0.1);
}

.story-copy {
  position: relative;
  z-index: 2;
  margin-top: 80px;
}

.story-eyebrow {
  color: rgba(222, 236, 197, 0.58);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.19em;
}

.story-copy h1 {
  margin-top: 17px;
  color: #fcfcf5;
  font-size: clamp(34px, 3.6vw, 45px);
  font-weight: 650;
  letter-spacing: -0.055em;
  line-height: 1.28;
}

.story-copy p {
  max-width: 360px;
  margin-top: 22px;
  color: rgba(243, 247, 234, 0.52);
  font-size: 13px;
  line-height: 1.9;
}

.feature-list {
  position: relative;
  z-index: 2;
  display: flex;
  margin: 38px 0 0;
  padding: 0;
  flex-direction: column;
  gap: 13px;
  list-style: none;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(245, 248, 237, 0.7);
  font-size: 12px;
}

.feature-list .el-icon {
  display: grid;
  width: 19px;
  height: 19px;
  flex: 0 0 19px;
  place-items: center;
  border: 1px solid rgba(204, 226, 141, 0.22);
  border-radius: 50%;
  color: var(--erp-lime);
  background: rgba(204, 226, 141, 0.07);
  font-size: 10px;
}

.field-art {
  position: absolute;
  z-index: 1;
  right: 0;
  bottom: 0;
  left: 0;
  height: 260px;
  pointer-events: none;
}

.field-art svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.art-caption {
  position: absolute;
  right: 40px;
  bottom: 28px;
  left: 42px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(230, 237, 216, 0.34);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.15em;
}

.art-line {
  height: 1px;
  flex: 1;
  background: rgba(230, 237, 216, 0.12);
}

.login-panel {
  display: flex;
  min-width: 0;
  justify-content: center;
  flex-direction: column;
  padding: 58px 72px;
  background:
    radial-gradient(circle at 100% 0, rgba(240, 244, 223, 0.65), transparent 30%),
    #fefefb;
}

.mobile-brand {
  display: none;
  margin-bottom: 40px;
}

.form-heading .eyebrow {
  color: var(--erp-sage);
}

.form-heading h2 {
  margin-top: 13px;
  color: var(--erp-ink);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.045em;
}

.form-heading p {
  margin-top: 10px;
  color: var(--erp-muted);
  font-size: 12.5px;
  line-height: 1.7;
}

.login-form {
  margin-top: 36px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 23px;
}

.login-form :deep(.el-form-item__label) {
  padding-bottom: 8px;
  color: #45544a;
  font-size: 12px;
  font-weight: 650;
}

.login-form :deep(.el-input__wrapper) {
  min-height: 48px;
  padding: 1px 15px;
  border-radius: 11px;
  background: #fafbf7;
  box-shadow: 0 0 0 1px #e2e7dc inset;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c2cfc0 inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  background: #fff;
  box-shadow:
    0 0 0 1px var(--erp-green) inset,
    0 8px 24px -20px rgba(31, 77, 54, 0.45);
}

.login-form :deep(.el-input__inner) {
  color: var(--erp-ink);
  font-size: 13.5px;
}

.login-form :deep(.el-input__prefix) {
  color: #91a092;
}

.form-assist {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: -4px 0 26px;
  color: var(--erp-muted);
  font-size: 10.5px;
}

.secure-note,
.online-note {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.secure-note .el-icon {
  font-size: 11px;
}

.online-note {
  color: #64806b;
  white-space: nowrap;
}

.online-note i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #7da566;
  box-shadow: 0 0 0 3px rgba(125, 165, 102, 0.1);
}

.login-button {
  width: 100%;
  height: 50px;
  border-radius: 11px;
  font-size: 13.5px;
  font-weight: 650;
  letter-spacing: 0.02em;
  box-shadow: 0 16px 30px -18px rgba(31, 77, 54, 0.65);
}

.login-button .el-icon {
  margin-left: 7px;
}

.support-note {
  margin-top: 26px;
  color: #a0aaa2;
  font-size: 10.5px;
  line-height: 1.7;
  text-align: center;
}

.login-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 54px;
  padding-top: 17px;
  border-top: 1px solid #eef0e9;
  color: #acb5ad;
  font-size: 9.5px;
  letter-spacing: 0.05em;
}

.page-copyright {
  position: relative;
  z-index: 1;
  margin-top: 22px;
  color: #97a199;
  font-size: 10px;
  letter-spacing: 0.03em;
  text-align: center;
}

@media (max-width: 960px) {
  .login-shell {
    width: min(520px, 100%);
    min-height: auto;
    grid-template-columns: 1fr;
  }

  .login-story {
    display: none;
  }

  .login-panel {
    padding: 44px 48px;
  }

  .mobile-brand {
    display: block;
  }
}

@media (max-width: 560px) {
  .login-page {
    justify-content: flex-start;
    padding: 18px 14px 20px;
  }

  .login-shell {
    border-radius: 22px;
  }

  .login-panel {
    padding: 30px 24px 26px;
  }

  .mobile-brand {
    margin-bottom: 34px;
  }

  .form-heading h2 {
    font-size: 26px;
  }

  .login-form {
    margin-top: 29px;
  }

  .login-footer {
    margin-top: 38px;
  }

  .page-copyright {
    line-height: 1.6;
  }
}
</style>
