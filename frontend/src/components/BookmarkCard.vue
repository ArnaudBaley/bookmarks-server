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

function handleDragStart(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.bookmark.id)
    // Add visual feedback
    if (event.target instanceof HTMLElement) {
      event.target.style.opacity = '0.5'
    }
  }
}

function handleDragEnd(event: DragEvent) {
  // Restore opacity
  if (event.target instanceof HTMLElement) {
    event.target.style.opacity = '1'
  }
}

function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
  } catch {
    return '/favicon.ico'
  }
}
</script>

<template>
  <div
    draggable="true"
    class="flex flex-row items-center gap-3 p-3 w-72 border border-[var(--color-border)] rounded-lg bg-[var(--color-background-soft)] transition-[transform,box-shadow] duration-200 cursor-move hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
    @click="handleClick"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    role="button"
    tabindex="0"
    @keyup.enter="handleClick"
  >
    <div
      class="w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-lg transition-transform duration-200"
    >
      <img :src="getFaviconUrl(bookmark.url)" :alt="`${bookmark.name} icon`" class="w-full h-full object-contain" />
    </div>
    <div class="flex-1 min-w-0">
      <h3 class="m-0 text-base font-medium break-words text-[var(--color-text)]">
        {{ bookmark.name }}
      </h3>
    </div>
    <button
      class="p-1.5 opacity-60 hover:opacity-100 flex-shrink-0 rounded cursor-pointer transition-opacity duration-200 active:scale-[0.95] text-[var(--color-text)]"
      @click.stop="handleModify"
      aria-label="Modify bookmark"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="5" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="12" cy="19" r="1.5" />
      </svg>
    </button>
  </div>
</template>

