<template>
  <div class="admin-layout">
    <transition name="mask-fade">
      <div
        v-if="isMobile && mobileMenuOpen"
        class="sidebar-mask"
        @click="mobileMenuOpen = false"
      />
    </transition>

    <el-container class="layout-container">
      <el-aside
        :width="asideWidth"
        class="app-sidebar"
        :class="{
          'is-mobile-open': mobileMenuOpen,
          'is-collapsed': isCollapse && !isMobile,
        }"
      >
        <div class="sidebar-inner">
          <div class="sidebar-brand">
            <BrandMark :compact="isCollapse && !isMobile" light />
          </div>

          <p v-if="!isCollapse || isMobile" class="nav-caption">运营导航</p>

          <el-menu
            :default-active="activeMenu"
            :collapse="isCollapse && !isMobile"
            :collapse-transition="false"
            class="sidebar-menu"
            router
          >
            <el-menu-item
              v-for="item in navItems"
              :key="item.path"
              :index="item.path"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <template #title>
                <span class="menu-title">{{ item.label }}</span>
                <span v-if="item.badge" class="menu-badge">{{ item.badge }}</span>
              </template>
            </el-menu-item>
          </el-menu>

          <div class="sidebar-footer">
            <div v-if="!isCollapse || isMobile" class="field-note">
              <span class="field-icon">
                <el-icon><Box /></el-icon>
              </span>
              <div>
                <strong>配件有数，经营有方</strong>
                <p>让每一件配件准时抵达田间</p>
              </div>
            </div>
            <p v-if="!isCollapse || isMobile" class="version-line">
              AGRI PARTS ERP · V1.0
            </p>
          </div>
        </div>
      </el-aside>

      <el-container class="workspace">
        <el-header height="76px" class="app-header">
          <div class="header-left">
            <button
              class="menu-toggle"
              type="button"
              :aria-label="isMobile ? '打开导航菜单' : '折叠侧边栏'"
              @click="toggleSidebar"
            >
              <el-icon :size="19">
                <Expand v-if="isCollapse || (isMobile && !mobileMenuOpen)" />
                <Fold v-else />
              </el-icon>
            </button>

            <div class="header-context">
              <span class="context-label">运营中心</span>
              <span class="context-slash">/</span>
              <strong>{{ currentTitle }}</strong>
            </div>
          </div>

          <div class="header-right">
            <span class="date-chip">
              <el-icon><Calendar /></el-icon>
              {{ todayText }}
            </span>

            <span class="header-divider" />

            <div class="user-chip">
              <span class="user-avatar">{{ avatarText }}</span>
              <span class="user-meta">
                <strong>{{ displayName }}</strong>
                <small>{{ roleName }}</small>
              </span>
            </div>

            <el-button class="logout-button" plain @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              <span class="logout-text">退出登录</span>
            </el-button>
          </div>
        </el-header>

        <el-main class="app-main">
          <router-view v-slot="{ Component }">
            <transition name="page-fade" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Box,
  Calendar,
  DataBoard,
  Expand,
  Fold,
  Sell,
  ShoppingCart,
  SwitchButton,
  Warning,
} from '@element-plus/icons-vue'
import BrandMark from '@/components/BrandMark.vue'
import { clearSession, getCurrentUser } from '@/utils/auth'
import { formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const navItems = [
  { path: '/dashboard', label: '数据看板', icon: DataBoard },
  { path: '/parts', label: '配件管理', icon: Box },
  { path: '/purchase', label: '采购入库', icon: ShoppingCart },
  { path: '/sale', label: '销售出库', icon: Sell },
  { path: '/warning', label: '库存预警', icon: Warning },
]

const currentUser = getCurrentUser()
const displayName =
  currentUser?.real_name ||
  currentUser?.name ||
  currentUser?.nickname ||
  currentUser?.username ||
  '管理员'
const roleName =
  currentUser?.role_name ||
  currentUser?.role?.name ||
  currentUser?.role ||
  '系统管理员'
const avatarText = String(displayName).slice(0, 1).toUpperCase()
const todayText = formatDate(new Date())

const isCollapse = ref(false)
const isMobile = ref(false)
const mobileMenuOpen = ref(false)
const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '数据看板')
const asideWidth = computed(() => {
  if (isMobile.value) return '252px'
  return isCollapse.value ? '86px' : '248px'
})

function syncViewport() {
  isMobile.value = window.innerWidth < 960
  if (!isMobile.value) {
    mobileMenuOpen.value = false
  }
}

function toggleSidebar() {
  if (isMobile.value) {
    mobileMenuOpen.value = !mobileMenuOpen.value
    return
  }
  isCollapse.value = !isCollapse.value
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm(
      '退出后需要重新登录才能继续使用系统。',
      '确认退出登录？',
      {
        confirmButtonText: '退出登录',
        cancelButtonText: '继续使用',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )
  } catch {
    return
  }

  clearSession()
  ElMessage.success('已安全退出登录')
  await router.replace({ name: 'Login' })
}

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  },
)

onMounted(() => {
  syncViewport()
  window.addEventListener('resize', syncViewport)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewport)
})
</script>

<style scoped>
.admin-layout {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.layout-container {
  height: 100%;
}

.app-sidebar {
  position: relative;
  z-index: 2;
  height: 100%;
  flex-shrink: 0;
  overflow: hidden;
  color: #f7f7ef;
  background:
    radial-gradient(circle at 10% 4%, rgba(204, 226, 141, 0.14), transparent 28%),
    radial-gradient(circle at 100% 65%, rgba(125, 161, 133, 0.12), transparent 36%),
    linear-gradient(168deg, #1d4d35 0%, #163d2b 54%, #123523 100%);
  transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1);
}

.app-sidebar::before {
  position: absolute;
  top: 92px;
  right: -88px;
  width: 220px;
  height: 220px;
  border: 1px solid rgba(255, 255, 255, 0.055);
  border-radius: 50%;
  content: '';
  box-shadow:
    0 0 0 32px rgba(255, 255, 255, 0.018),
    0 0 0 64px rgba(255, 255, 255, 0.014);
  pointer-events: none;
}

.sidebar-inner {
  position: relative;
  z-index: 1;
  display: flex;
  height: 100%;
  flex-direction: column;
  padding: 22px 0 20px;
}

.sidebar-brand {
  display: flex;
  height: 52px;
  align-items: center;
  padding: 0 22px;
  overflow: hidden;
  white-space: nowrap;
}

.nav-caption {
  margin: 37px 26px 13px;
  color: rgba(240, 244, 231, 0.36);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
  white-space: nowrap;
}

.sidebar-menu {
  --el-menu-bg-color: transparent;
  --el-menu-text-color: rgba(241, 245, 234, 0.68);
  --el-menu-hover-text-color: #ffffff;
  --el-menu-active-color: #fcfdf7;
  --el-menu-hover-bg-color: rgba(255, 255, 255, 0.07);
  --el-menu-item-height: 50px;
  border-right: 0;
  background: transparent;
}

.sidebar-menu .el-menu-item {
  position: relative;
  height: 50px;
  margin: 3px 14px;
  padding: 0 16px !important;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 550;
  letter-spacing: 0.01em;
  transition:
    background-color 180ms ease,
    color 180ms ease;
}

.sidebar-menu .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.065);
}

.sidebar-menu .el-menu-item.is-active {
  color: #fffdf5;
  background: linear-gradient(
    90deg,
    rgba(204, 226, 141, 0.2) 0%,
    rgba(204, 226, 141, 0.075) 100%
  );
}

.sidebar-menu .el-menu-item.is-active::before {
  position: absolute;
  top: 13px;
  left: 0;
  width: 3px;
  height: 24px;
  border-radius: 3px;
  background: var(--erp-lime);
  content: '';
}

.sidebar-menu .el-menu-item.is-active .el-icon {
  color: var(--erp-lime);
}

.sidebar-menu .el-icon {
  margin-right: 12px;
  font-size: 18px;
}

.sidebar-menu.el-menu--collapse {
  width: 100%;
}

.sidebar-menu.el-menu--collapse .el-menu-item {
  justify-content: center;
  margin: 3px 10px;
  padding: 0 !important;
}

.sidebar-menu.el-menu--collapse .el-icon {
  margin-right: 0;
}

.app-sidebar.is-collapsed .sidebar-brand {
  justify-content: center;
  padding: 0;
}

.app-sidebar.is-collapsed .sidebar-footer {
  padding-right: 12px;
  padding-left: 12px;
}

.menu-title {
  flex: 1;
}

.menu-badge {
  display: inline-flex;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border-radius: 999px;
  color: var(--erp-green-deep);
  background: var(--erp-lime);
  font-size: 10px;
  font-weight: 700;
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px 18px 0;
}

.field-note {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 14px 13px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.045);
}

.field-icon {
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  place-items: center;
  border-radius: 9px;
  color: var(--erp-lime);
  background: rgba(204, 226, 141, 0.12);
}

.field-note strong {
  display: block;
  color: rgba(252, 253, 246, 0.82);
  font-size: 11.5px;
  font-weight: 600;
}

.field-note p {
  margin-top: 5px;
  color: rgba(236, 242, 229, 0.38);
  font-size: 10px;
  line-height: 1.5;
}

.version-line {
  margin-top: 16px;
  color: rgba(236, 242, 229, 0.25);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-align: center;
}

.workspace {
  min-width: 0;
  height: 100%;
  flex-direction: column;
}

.app-header {
  display: flex;
  height: 76px;
  flex: 0 0 76px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 0 30px;
  border-bottom: 1px solid rgba(222, 227, 216, 0.84);
  background: rgba(251, 252, 248, 0.9);
  backdrop-filter: blur(18px);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
}

.header-left {
  min-width: 0;
  gap: 18px;
}

.header-right {
  flex-shrink: 0;
  gap: 18px;
}

.menu-toggle {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border: 1px solid var(--erp-line);
  border-radius: 11px;
  color: var(--erp-ink-soft);
  background: #fff;
  cursor: pointer;
  transition: all 160ms ease;
}

.menu-toggle:hover {
  border-color: #c7d2c6;
  color: var(--erp-green);
  background: #f8faf5;
}

.header-context {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  white-space: nowrap;
}

.context-label {
  color: var(--erp-muted);
}

.context-slash {
  color: #c6cec3;
}

.header-context strong {
  overflow: hidden;
  color: var(--erp-ink);
  font-weight: 650;
  text-overflow: ellipsis;
}

.date-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--erp-ink-soft);
  font-size: 12px;
  white-space: nowrap;
}

.date-chip .el-icon {
  color: var(--erp-sage);
}

.header-divider {
  width: 1px;
  height: 24px;
  background: var(--erp-line);
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.user-avatar {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-items: center;
  border: 1px solid #dbe7d1;
  border-radius: 11px;
  color: var(--erp-green-deep);
  background:
    radial-gradient(circle at 80% 15%, rgba(255, 255, 255, 0.9), transparent 34%),
    linear-gradient(145deg, #eef4de, #d3e2b6);
  font-size: 14px;
  font-weight: 750;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.25;
}

.user-meta strong {
  color: var(--erp-ink);
  font-size: 12.5px;
  font-weight: 650;
}

.user-meta small {
  color: var(--erp-muted);
  font-size: 10px;
}

.logout-button {
  height: 36px;
  min-height: 36px;
  padding: 0 13px;
  border-color: var(--erp-line);
  border-radius: 9px;
  color: var(--erp-ink-soft);
  background: #fff;
  font-size: 12px;
}

.logout-button:hover {
  border-color: #e8cbc4;
  color: var(--erp-danger);
  background: #fcf7f5;
}

.logout-button .el-icon {
  margin-right: 5px;
}

.app-main {
  flex: 1;
  min-height: 0;
  padding: 30px 32px 44px;
  overflow-y: auto;
  background-color: var(--erp-bg);
  background-image:
    radial-gradient(circle at 92% -4%, rgba(204, 226, 141, 0.2), transparent 30%),
    radial-gradient(circle at 2% 100%, rgba(219, 210, 183, 0.22), transparent 28%);
}

.sidebar-mask {
  position: fixed;
  z-index: 1100;
  inset: 0;
  background: rgba(17, 33, 23, 0.44);
  backdrop-filter: blur(2px);
}

.mask-fade-enter-active,
.mask-fade-leave-active {
  transition: opacity 180ms ease;
}

.mask-fade-enter-from,
.mask-fade-leave-to {
  opacity: 0;
}

@media (max-width: 1280px) {
  .app-header {
    padding: 0 24px;
  }

  .app-main {
    padding: 26px 24px 36px;
  }

  .date-chip {
    display: none;
  }

  .header-right {
    gap: 14px;
  }
}

@media (max-width: 960px) {
  .app-sidebar {
    position: fixed;
    z-index: 1200;
    inset: 0 auto 0 0;
    box-shadow: 18px 0 50px -28px rgba(6, 25, 15, 0.7);
    transition: transform 240ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .app-sidebar:not(.is-mobile-open) {
    transform: translateX(-105%);
  }

  .app-header {
    padding: 0 20px;
  }

  .app-main {
    padding: 24px 20px 32px;
  }
}

@media (max-width: 640px) {
  .app-header {
    height: 68px;
    flex-basis: 68px;
    gap: 10px;
  }

  .app-main {
    padding: 20px 15px 28px;
  }

  .header-context .context-label,
  .context-slash,
  .user-meta {
    display: none;
  }

  .header-left {
    gap: 12px;
  }

  .header-right {
    gap: 9px;
  }

  .header-divider {
    display: none;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    flex-basis: 32px;
  }

  .logout-button {
    width: 34px;
    height: 34px;
    min-height: 34px;
    padding: 0;
  }

  .logout-button .el-icon {
    margin: 0;
  }

  .logout-text {
    display: none;
  }
}
</style>
