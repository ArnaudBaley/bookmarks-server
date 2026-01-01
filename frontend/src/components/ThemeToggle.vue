<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>

<template>
  <button
    class="w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-background-soft)] text-[var(--color-text)] text-2xl cursor-pointer flex items-center justify-center transition-[transform,background-color,border-color] duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:scale-110 hover:bg-[var(--color-background-mute)] hover:border-[var(--color-border-hover)] active:scale-95"
    @click="themeStore.toggleTheme()"
    :aria-label="`Switch to ${themeStore.theme === 'light' ? 'dark' : 'light'} theme`"
    :title="`Switch to ${themeStore.theme === 'light' ? 'dark' : 'light'} theme`"
  >
    <span v-if="themeStore.theme === 'light'" class="leading-none flex items-center justify-center">🌙</span>
    <span v-else class="leading-none flex items-center justify-center">☀️</span>
  </button>
</template>

