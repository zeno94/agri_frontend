<template>
  <div class="brand-mark" :class="{ 'is-compact': compact, 'is-light': light }">
    <span class="brand-symbol" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <path
          d="M24 35V21"
          stroke="currentColor"
          stroke-width="2.6"
          stroke-linecap="round"
        />
        <path
          d="M24 25.2c-6.3 0-9.9-3.6-9.9-9.9 6.3 0 9.9 3.6 9.9 9.9Z"
          fill="var(--brand-leaf)"
        />
        <path
          d="M24 30.6c6.3 0 9.9-3.6 9.9-9.9-6.3 0-9.9 3.6-9.9 9.9Z"
          fill="currentColor"
          fill-opacity=".92"
        />
        <circle cx="34.8" cy="35.4" r="2.8" fill="var(--brand-grain)" />
      </svg>
    </span>
    <span v-if="!compact" class="brand-copy">
      <strong>沃野智配</strong>
      <small>农机配件进销存 ERP</small>
    </span>
  </div>
</template>

<script setup>
defineProps({
  compact: { type: Boolean, default: false },
  light: { type: Boolean, default: false },
})
</script>

<style scoped>
.brand-mark {
  --brand-leaf: #cce28d;
  --brand-grain: #d7a660;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--erp-green-deep);
}

.brand-symbol {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  color: #f7f6ee;
  background:
    radial-gradient(circle at 76% 18%, rgba(204, 226, 141, 0.24), transparent 45%),
    linear-gradient(150deg, #2f6b4b 0%, #163f2b 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 10px 22px -14px rgba(20, 66, 42, 0.8);
}

.brand-symbol svg {
  width: 34px;
  height: 34px;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}

.brand-copy strong {
  color: currentColor;
  font-size: 18px;
  font-weight: 750;
  letter-spacing: 0.04em;
}

.brand-copy small {
  margin-top: 4px;
  color: var(--erp-muted);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.is-light {
  color: #fbfaf4;
}

.is-light .brand-copy small {
  color: rgba(239, 242, 230, 0.54);
}

.is-light .brand-symbol {
  --brand-leaf: #557f5e;
  --brand-grain: #a37a3e;
  color: #214d36;
  border-color: rgba(255, 255, 255, 0.22);
  background: linear-gradient(150deg, #eef4df 0%, #cddda9 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    0 10px 24px -14px rgba(0, 0, 0, 0.55);
}

.is-compact .brand-symbol {
  width: 42px;
  height: 42px;
  flex-basis: 42px;
}

@media (max-width: 520px) {
  .brand-symbol {
    width: 42px;
    height: 42px;
    flex-basis: 42px;
  }

  .brand-copy strong {
    font-size: 16px;
  }
}
</style>
