<script setup lang="ts">
import type { Bookmark } from '@/types/bookmark'

interface Props {
  bookmark: Bookmark
}

interface Emits {
  (e: 'delete', id: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleClick() {
  window.open(props.bookmark.url, '_blank', 'noopener,noreferrer')
}

function handleDelete() {
  if (confirm(`Are you sure you want to delete "${props.bookmark.name}"?`)) {
    emit('delete', props.bookmark.id)
  }
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
        class="px-4 py-2 bg-[#dc3545] text-white border-none rounded cursor-pointer text-sm transition-colors duration-200 hover:bg-[#c82333] active:scale-[0.98]"
        @click="handleDelete"
        aria-label="Delete bookmark"
      >
        Delete
      </button>
    </div>
  </div>
</template>

