<script setup lang="ts">
import type { Bookmark } from '@/types/bookmark'

interface Props {
  bookmark: Bookmark
}

interface Emits {
  (e: 'modify', bookmark: Bookmark): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleClick() {
  window.open(props.bookmark.url, '_blank', 'noopener,noreferrer')
}

function handleModify() {
  emit('modify', props.bookmark)
}

function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
  } catch {
    return '/favicon.ico'
  }
}
</script>

<template>
  <div
    class="flex flex-col items-center p-6 border border-[var(--color-border)] rounded-lg bg-[var(--color-background-soft)] transition-[transform,box-shadow] duration-200 cursor-default hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
  >
    <div
      class="w-16 h-16 flex items-center justify-center cursor-pointer rounded-lg transition-transform duration-200 mb-4 hover:scale-110 focus:outline focus:outline-2 focus:outline-[var(--color-text)] focus:outline-offset-2"
      @click="handleClick"
      role="button"
      tabindex="0"
      @keyup.enter="handleClick"
    >
      <img :src="getFaviconUrl(bookmark.url)" :alt="`${bookmark.name} icon`" class="w-full h-full object-contain" />
    </div>
    <div class="w-full flex flex-col items-center gap-3">
      <h3 class="m-0 text-base font-medium text-center break-words text-[var(--color-text)]">
        {{ bookmark.name }}
      </h3>
      <button
        class="p-2 bg-[var(--color-background-soft)] border border-[var(--color-border)] rounded cursor-pointer transition-colors duration-200 hover:bg-[var(--color-border)] active:scale-[0.98] text-[var(--color-text)]"
        @click="handleModify"
        aria-label="Modify bookmark"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>
  </div>
</template>

