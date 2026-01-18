<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTabStore } from '@/stores/tab/tab'
import { bookmarkApi } from '@/services/bookmarkApi/bookmarkApi'
import type { Tab } from '@/types/tab'
import type { Bookmark } from '@/types/bookmark'

interface Emits {
  (e: 'close'): void
}

const emit = defineEmits<Emits>()
const router = useRouter()
const tabStore = useTabStore()

const searchQuery = ref('')
const selectedIndex = ref(0)
const allBookmarks = ref<Bookmark[]>([])
const isLoadingBookmarks = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

type SearchResult = 
  | { type: 'tab', id: string, name: string, color: string | null }
  | { type: 'bookmark', id: string, name: string, url: string }

const searchResults = computed<SearchResult[]>(() => {
  if (!searchQuery.value.trim()) {
    return []
  }

  const query = searchQuery.value.toLowerCase().trim()
  const results: SearchResult[] = []

  // Search tabs
  tabStore.tabs.forEach((tab: Tab) => {
    if (tab.name.toLowerCase().includes(query)) {
      results.push({
        type: 'tab',
        id: tab.id,
        name: tab.name,
        color: tab.color,
      })
    }
  })

  // Search bookmarks
  allBookmarks.value.forEach((bookmark: Bookmark) => {
    if (bookmark.name.toLowerCase().includes(query)) {
      results.push({
        type: 'bookmark',
        id: bookmark.id,
        name: bookmark.name,
        url: bookmark.url,
      })
    }
  })

  return results
})

// Reset selected index when search query changes
watch(searchQuery, () => {
  selectedIndex.value = 0
})

// Reset selected index when results change
watch(searchResults, () => {
  if (selectedIndex.value >= searchResults.value.length) {
    selectedIndex.value = Math.max(0, searchResults.value.length - 1)
  }
})

async function fetchAllBookmarks(): Promise<void> {
  isLoadingBookmarks.value = true
  try {
    allBookmarks.value = await bookmarkApi.getAllBookmarks()
  } catch (error) {
    console.error('Failed to fetch all bookmarks:', error)
    allBookmarks.value = []
  } finally {
    isLoadingBookmarks.value = false
  }
}

function handleEscapeKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    handleClose()
  }
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (searchResults.value.length > 0) {
      selectedIndex.value = (selectedIndex.value + 1) % searchResults.value.length
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (searchResults.value.length > 0) {
      selectedIndex.value = selectedIndex.value === 0 
        ? searchResults.value.length - 1 
        : selectedIndex.value - 1
    }
  } else if (event.key === 'Enter') {
    event.preventDefault()
    if (searchResults.value.length > 0 && searchResults.value[selectedIndex.value]) {
      handleSelectResult(searchResults.value[selectedIndex.value])
    }
  }
}

function handleSelectResult(result: SearchResult): void {
  if (result.type === 'tab') {
    // Navigate to tab
    const tab = tabStore.getTabById(result.id)
    if (tab) {
      const encodedName = encodeURIComponent(tab.name)
      router.push({ name: 'tab', params: { tabName: encodedName } })
      handleClose()
    }
  } else if (result.type === 'bookmark') {
    // Open bookmark in new tab
    window.open(result.url, '_blank', 'noopener,noreferrer')
    handleClose()
  }
}

function handleClose(): void {
  searchQuery.value = ''
  selectedIndex.value = 0
  emit('close')
}

// Auto-focus input when modal opens
onMounted(async () => {
  await fetchAllBookmarks()
  await nextTick()
  if (searchInputRef.value) {
    searchInputRef.value.focus()
  }
  window.addEventListener('keydown', handleEscapeKey)
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscapeKey)
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
    @click.self="handleClose"
  >
    <div
      class="bg-[var(--color-background)] p-6 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.3)] w-[90%] max-w-[600px] max-h-[80vh] flex flex-col"
    >
      <!-- Search Input -->
      <div class="mb-4">
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          placeholder="Search tabs and bookmarks..."
          class="w-full px-4 py-3 text-base border border-[var(--color-border)] rounded bg-[var(--color-background-soft)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[hsla(160,100%,37%,0.5)] focus:border-[hsla(160,100%,37%,1)] transition-all duration-200"
          autocomplete="off"
        />
      </div>

      <!-- Search Results -->
      <div class="flex-1 overflow-y-auto min-h-0">
        <div v-if="isLoadingBookmarks" class="text-center py-8 text-[var(--color-text)] opacity-70">
          Loading...
        </div>
        <div v-else-if="searchQuery.trim() && searchResults.length === 0" class="text-center py-8 text-[var(--color-text)] opacity-70">
          No results found
        </div>
        <div v-else-if="!searchQuery.trim()" class="text-center py-8 text-[var(--color-text)] opacity-70">
          Start typing to search...
        </div>
        <ul v-else class="space-y-1">
          <li
            v-for="(result, index) in searchResults"
            :key="`${result.type}-${result.id}`"
            :class="[
              'px-4 py-3 rounded cursor-pointer transition-colors duration-150',
              index === selectedIndex
                ? 'bg-[hsla(160,100%,37%,0.2)] border border-[hsla(160,100%,37%,0.5)]'
                : 'hover:bg-[var(--color-background-soft)] border border-transparent'
            ]"
            @click="handleSelectResult(result)"
            @mouseenter="selectedIndex = index"
          >
            <div class="flex items-center gap-3">
              <!-- Tab Icon/Indicator -->
              <div v-if="result.type === 'tab'" class="flex items-center gap-2 flex-shrink-0">
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
                  class="text-[var(--color-text)] opacity-70"
                >
                  <path d="M4 3h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                  <path d="M8 3v18" />
                </svg>
                <span
                  v-if="result.color"
                  class="w-3 h-3 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: result.color }"
                ></span>
              </div>
              <!-- Bookmark Icon -->
              <div v-else class="flex-shrink-0">
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
                  class="text-[var(--color-text)] opacity-70"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <!-- Result Content -->
              <div class="flex-1 min-w-0">
                <div class="text-[var(--color-text)] font-medium truncate">
                  {{ result.name }}
                </div>
                <div v-if="result.type === 'bookmark'" class="text-sm text-[var(--color-text)] opacity-60 truncate">
                  {{ result.url }}
                </div>
                <div v-else class="text-xs text-[var(--color-text)] opacity-50 mt-1">
                  Tab
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- Footer with instructions -->
      <div class="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text)] opacity-60">
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1">
            <kbd class="px-1.5 py-0.5 bg-[var(--color-background-soft)] rounded border border-[var(--color-border)]">↑↓</kbd>
            <span>Navigate</span>
          </span>
          <span class="flex items-center gap-1">
            <kbd class="px-1.5 py-0.5 bg-[var(--color-background-soft)] rounded border border-[var(--color-border)]">Enter</kbd>
            <span>Select</span>
          </span>
          <span class="flex items-center gap-1">
            <kbd class="px-1.5 py-0.5 bg-[var(--color-background-soft)] rounded border border-[var(--color-border)]">Esc</kbd>
            <span>Close</span>
          </span>
        </div>
        <button
          type="button"
          class="px-4 py-2 text-sm border-none rounded cursor-pointer transition-colors duration-200 bg-[var(--color-background-soft)] text-[var(--color-text)] hover:bg-[var(--color-border)]"
          @click="handleClose"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>
