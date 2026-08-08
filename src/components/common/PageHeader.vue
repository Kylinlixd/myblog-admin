<template>
  <header class="page-header">
    <div class="page-header__copy">
      <div class="page-header__title">
        <slot name="icon">
          <component :is="icon" v-if="icon" />
        </slot>
        <h1>{{ title }}</h1>
      </div>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions"></slot>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  }
})
</script>
