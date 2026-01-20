<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTabStore } from '@/stores/tab/tab'
import { bookmarkApi } from '@/services/bookmarkApi/bookmarkApi'
import type { Tab } from '@/types/tab'
import type { Bookmark } from '@/types/bookmark'

interface Props {
  onFoldAllGroups: () => void
  onUnfoldAllGroups: () => void
  onCreateBookmark: () => void
  onCreateGroup: () => void
  onCreateTab: () => void
  onBackupData: () => void | Promise<void>
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const router = useRouter()
const tabStore = useTabStore()

const searchQuery = ref('')
const selectedIndex = ref(0)
const allBookmarks = ref<Bookmark[]>([])
const isLoadingBookmarks = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

type CommandAction = {
  id: string
  type: 'action'
  label: string
  keywords: string[]
  icon: string
  execute: () => void
}

type SearchResult = 
  | { type: 'tab', id: string, name: string, color: string | null }
  | { type: 'bookmark', id: string, name: string, url: string }

type CommandResult = CommandAction | SearchResult

// Define actions
const actions: CommandAction[] = [
  {
    id: 'fold-all-groups',
    type: 'action',
    label: 'Fold all groups',
    keywords: ['fold', 'collapse', 'close'],
    icon: 'fold',
    execute: () => {
      props.onFoldAllGroups()
      handleClose()
    },
  },
  {
    id: 'unfold-all-groups',
    type: 'action',
    label: 'Unfold all groups',
    keywords: ['unfold', 'expand', 'open'],
    icon: 'unfold',
    execute: () => {
      props.onUnfoldAllGroups()
      handleClose()
    },
  },
  {
    id: 'create-bookmark',
    type: 'action',
    label: 'Create new bookmark',
    keywords: ['bookmark', 'add bookmark', 'new bookmark'],
    icon: 'bookmark',
    execute: () => {
      props.onCreateBookmark()
      handleClose()
    },
  },
  {
    id: 'create-group',
    type: 'action',
    label: 'Create new group',
    keywords: ['group', 'add group', 'new group'],
    icon: 'group',
    execute: () => {
      props.onCreateGroup()
      handleClose()
    },
  },
  {
    id: 'create-tab',
    type: 'action',
    label: 'Create new tab',
    keywords: ['tab', 'add tab', 'new tab'],
    icon: 'tab',
    execute: () => {
      props.onCreateTab()
      handleClose()
    },
  },
  {
    id: 'backup-data',
    type: 'action',
    label: 'Backup user data',
    keywords: ['backup', 'export', 'download', 'save'],
    icon: 'download',
    execute: async () => {
      try {
        await props.onBackupData()
        handleClose()
      } catch (error) {
        console.error('Failed to export data:', error)
        // Keep modal open on error so user can see what happened
      }
    },
  },
]

// Filter actions based on search query
const filteredActions = computed<CommandAction[]>(() => {
  const query = searchQuery.value.toLowerCase().trim()
  
  if (!query) {
    return actions
  }
  
  return actions.filter((action) => {
    // Check if query matches label or any keyword
    const labelMatch = action.label.toLowerCase().includes(query)
    const keywordMatch = action.keywords.some((keyword) => 
      keyword.toLowerCase().includes(query)
    )
    return labelMatch || keywordMatch
  })
})

// Search results for tabs and bookmarks
const searchResults = computed<SearchResult[]>(() => {
  const query = searchQuery.value.toLowerCase().trim()
  
  if (!query) {
    return []
  }

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

// Combined results: actions first, then search results
const allResults = computed<CommandResult[]>(() => {
  const query = searchQuery.value.toLowerCase().trim()
  
  // If query is empty, show only actions
  if (!query) {
    return filteredActions.value
  }
  
  // If query matches actions, show actions first, then search results
  // Otherwise, show only search results
  if (filteredActions.value.length > 0) {
    return [...filteredActions.value, ...searchResults.value]
  }
  
  return searchResults.value
})

// Reset selected index when search query changes
watch(searchQuery, () => {
  selectedIndex.value = 0
})

// Reset selected index when results change
watch(allResults, () => {
  if (selectedIndex.value >= allResults.value.length) {
    selectedIndex.value = Math.max(0, allResults.value.length - 1)
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
    if (allResults.value.length > 0) {
      selectedIndex.value = (selectedIndex.value + 1) % allResults.value.length
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (allResults.value.length > 0) {
      selectedIndex.value = selectedIndex.value === 0 
        ? allResults.value.length - 1 
        : selectedIndex.value - 1
    }
  } else if (event.key === 'Enter') {
    event.preventDefault()
    if (allResults.value.length > 0 && allResults.value[selectedIndex.value]) {
      handleSelectResult(allResults.value[selectedIndex.value])
    }
  }
}

function handleSelectResult(result: CommandResult): void {
  if (result.type === 'action') {
    result.execute()
  } else if (result.type === 'tab') {
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
          placeholder="Search actions, tabs and bookmarks..."
          class="w-full px-4 py-3 text-base border border-[var(--color-border)] rounded bg-[var(--color-background-soft)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[hsla(160,100%,37%,0.5)] focus:border-[hsla(160,100%,37%,1)] transition-all duration-200"
          autocomplete="off"
        />
      </div>

      <!-- Results -->
      <div class="flex-1 overflow-y-auto min-h-0">
        <div v-if="isLoadingBookmarks" class="text-center py-8 text-[var(--color-text)] opacity-70">
          Loading...
        </div>
        <div v-else-if="searchQuery.trim() && allResults.length === 0" class="text-center py-8 text-[var(--color-text)] opacity-70">
          No results found
        </div>
        <div v-else-if="!searchQuery.trim() && allResults.length === 0" class="text-center py-8 text-[var(--color-text)] opacity-70">
          Start typing to search...
        </div>
        <ul v-else class="space-y-1">
          <li
            v-for="(result, index) in allResults"
            :key="result.type === 'action' ? result.id : `${result.type}-${result.id}`"
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
              <!-- Action Icon -->
              <div v-if="result.type === 'action'" class="flex-shrink-0">
                <svg
                  v-if="result.icon === 'fold'"
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
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <svg
                  v-else-if="result.icon === 'unfold'"
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
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                <svg
                  v-else-if="result.icon === 'bookmark'"
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
                <svg
                  v-else-if="result.icon === 'group'"
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
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <svg
                  v-else-if="result.icon === 'tab'"
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
                <svg
                  v-else-if="result.icon === 'download'"
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <!-- Tab Icon/Indicator -->
              <div v-else-if="result.type === 'tab'" class="flex items-center gap-2 flex-shrink-0">
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
              <div v-else-if="result.type === 'bookmark'" class="flex-shrink-0">
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
                  {{ result.type === 'action' ? result.label : result.name }}
                </div>
                <div v-if="result.type === 'bookmark'" class="text-sm text-[var(--color-text)] opacity-60 truncate">
                  {{ result.url }}
                </div>
                <div v-else-if="result.type === 'tab'" class="text-xs text-[var(--color-text)] opacity-50 mt-1">
                  Tab
                </div>
                <div v-else-if="result.type === 'action'" class="text-xs text-[var(--color-text)] opacity-50 mt-1">
                  Action
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
