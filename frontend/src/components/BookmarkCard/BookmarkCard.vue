<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Bookmark } from '@/types/bookmark'

interface Props {
  bookmark: Bookmark
}

interface Emits {
  (e: 'modify', bookmark: Bookmark): void
  (e: 'delete', id: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isEditMode = ref(false)
const cardRef = ref<HTMLElement | null>(null)

function handleClick() {
  if (!isEditMode.value) {
    window.open(props.bookmark.url, '_blank', 'noopener,noreferrer')
  }
}

function handleOptionClick() {
  isEditMode.value = !isEditMode.value
}

function handleModify() {
  emit('modify', props.bookmark)
  isEditMode.value = false
}

function handleDelete() {
  emit('delete', props.bookmark.id)
  isEditMode.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (cardRef.value && !cardRef.value.contains(event.target as Node)) {
    isEditMode.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleDragStart(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    // Set bookmark ID in text/plain - we'll identify it by checking if it exists in the store
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
    ref="cardRef"
    draggable="true"
    class="flex flex-row items-center gap-3 p-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-background-soft)] transition-[transform,box-shadow] duration-200 cursor-move hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
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
    <div class="flex-shrink-0">
      <h3 class="m-0 text-base font-medium whitespace-nowrap text-[var(--color-text)]">
        {{ bookmark.name }}
      </h3>
    </div>
    <div v-if="!isEditMode" class="flex items-center">
      <button
        class="p-1.5 opacity-60 hover:opacity-100 flex-shrink-0 rounded cursor-pointer transition-opacity duration-200 active:scale-[0.95] text-[var(--color-text)]"
        @click.stop="handleOptionClick"
        aria-label="Options"
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
    <div v-else class="flex items-center gap-2">
      <button
        class="p-1.5 opacity-60 hover:opacity-100 flex-shrink-0 rounded cursor-pointer transition-opacity duration-200 active:scale-[0.95] text-[#dc3545]"
        @click.stop="handleDelete"
        aria-label="Delete bookmark"
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
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
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
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>
  </div>
</template>

