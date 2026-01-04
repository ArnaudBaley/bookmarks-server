<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Group } from '@/types/group'
import type { Bookmark } from '@/types/bookmark'
import BookmarkCard from './BookmarkCard.vue'

interface Props {
  group: Group
  bookmarks: Bookmark[]
}

interface Emits {
  (e: 'modify', group: Group): void
  (e: 'bookmark-drop', groupId: string, bookmarkId: string): void
  (e: 'bookmark-modify', bookmark: Bookmark): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isExpanded = ref(true)
const isDragOver = ref(false)

const bookmarksCount = computed(() => props.bookmarks.length)

function handleModify() {
  emit('modify', props.group)
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = true
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false

  const bookmarkId = event.dataTransfer?.getData('text/plain')
  if (bookmarkId) {
    emit('bookmark-drop', props.group.id, bookmarkId)
  }
}
</script>

<template>
  <div
    class="mb-6 rounded-lg bg-[var(--color-background-soft)] overflow-hidden transition-all duration-200"
    :class="isDragOver ? 'border-2' : 'border border-[var(--color-border)]'"
    :style="isDragOver ? { borderColor: group.color } : {}"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div
      class="flex items-center justify-between p-4 cursor-pointer transition-colors duration-200 hover:bg-[var(--color-background-mute)]"
      @click="isExpanded = !isExpanded"
    >
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div
          class="w-4 h-4 rounded-full flex-shrink-0"
          :style="{ backgroundColor: group.color }"
        />
        <h3 class="m-0 text-lg font-semibold text-[var(--color-text)] truncate">
          {{ group.name }}
        </h3>
        <span class="text-sm text-[var(--color-text)] opacity-60">
          ({{ bookmarksCount }})
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="p-1.5 opacity-60 hover:opacity-100 flex-shrink-0 rounded cursor-pointer transition-opacity duration-200 active:scale-[0.95] text-[var(--color-text)]"
          @click.stop="handleModify"
          aria-label="Edit group"
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
        <button
          class="p-1.5 opacity-60 hover:opacity-100 flex-shrink-0 rounded cursor-pointer transition-transform duration-200 text-[var(--color-text)]"
          :class="{ 'rotate-180': isExpanded }"
          @click.stop="isExpanded = !isExpanded"
          aria-label="Toggle group"
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
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </div>
    <div
      v-show="isExpanded"
      class="p-4 pt-0"
    >
      <div
        v-if="bookmarksCount === 0"
        class="text-center py-8 text-[var(--color-text)] opacity-60"
      >
        <p class="m-0">No bookmarks in this group</p>
        <p class="m-0 mt-2 text-sm">Drag and drop bookmarks here to add them</p>
      </div>
      <div
        v-else
        class="grid grid-cols-[repeat(auto-fill,minmax(288px,1fr))] gap-3"
      >
        <BookmarkCard
          v-for="bookmark in bookmarks"
          :key="bookmark.id"
          :bookmark="bookmark"
          @modify="$emit('bookmark-modify', bookmark)"
        />
      </div>
    </div>
  </div>
</template>

