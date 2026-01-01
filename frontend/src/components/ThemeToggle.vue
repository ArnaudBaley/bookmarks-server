<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>

<template>
  <button
    class="theme-toggle"
    @click="themeStore.toggleTheme()"
    :aria-label="`Switch to ${themeStore.theme === 'light' ? 'dark' : 'light'} theme`"
    :title="`Switch to ${themeStore.theme === 'light' ? 'dark' : 'light'} theme`"
  >
    <span v-if="themeStore.theme === 'light'" class="theme-icon">🌙</span>
    <span v-else class="theme-icon">☀️</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background-color: var(--color-background-soft);
  color: var(--color-text);
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, background-color 0.2s, border-color 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.theme-toggle:hover {
  transform: scale(1.1);
  background-color: var(--color-background-mute);
  border-color: var(--color-border-hover);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.theme-icon {
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

