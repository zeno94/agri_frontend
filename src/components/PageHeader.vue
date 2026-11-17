<template>
  <header class="page-heading">
    <div class="heading-main">
      <span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span>
      <h1>{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="heading-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
})
</script>

<style scoped>
.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 24px;
}

.heading-main {
  min-width: 0;
}

h1 {
  margin-top: 10px;
  color: var(--erp-ink);
  font-size: clamp(26px, 2.4vw, 34px);
  font-weight: 750;
  letter-spacing: -0.045em;
  line-height: 1.16;
}

p {
  max-width: 640px;
  margin-top: 9px;
  color: var(--erp-ink-soft);
  font-size: 13.5px;
  line-height: 1.65;
}

.heading-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
}

@media (max-width: 720px) {
  .page-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 20px;
  }

  .heading-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  h1 {
    font-size: 26px;
  }
}
</style>
