<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useBookmarkStore } from '@/stores/bookmark/bookmark'
import { useGroupStore } from '@/stores/group/group'
import { useTabStore } from '@/stores/tab/tab'
import { bookmarkApi } from '@/services/bookmarkApi/bookmarkApi'
import { groupApi } from '@/services/groupApi/groupApi'
import { tabApi } from '@/services/tabApi/tabApi'
import type { CreateBookmarkDto } from '@/types/bookmark'
import type { CreateGroupDto } from '@/types/group'
import type { CreateTabDto } from '@/types/tab'

interface Emits {
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

const bookmarkStore = useBookmarkStore()
const groupStore = useGroupStore()
const tabStore = useTabStore()

const error = ref<string | null>(null)
const isImporting = ref(false)
const showConfirmation = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const importData = ref<{ 
  bookmarks: Array<CreateBookmarkDto & { groupIndices?: number[]; tabIndex?: number }>; 
  groups: Array<CreateGroupDto & { tabIndex?: number }>
  tabs: CreateTabDto[]
} | null>(null)

interface ExportData {
  tabs: Array<{
    name: string
    color?: string | null
  }>
  groups: Array<{
    name: string
    color: string
    tabIndex: number
  }>
  bookmarks: Array<{
    name: string
    url: string
    tabIndex: number
    groupIndices?: number[]
  }>
}

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && !showConfirmation.value) {
    handleCancel()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscapeKey)
})

function handleCancel() {
  error.value = null
  showConfirmation.value = false
  importData.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  emit('cancel')
}

async function handleExport() {
  try {
    error.value = null
    
    // Fetch all data from API to ensure we get complete data from all tabs
    // (stores only contain filtered data for the active tab)
    const allTabs = await tabApi.getAllTabs()
    const allBookmarks = await bookmarkApi.getAllBookmarks()
    const allGroups = await groupApi.getAllGroups()
    
    // Create maps from IDs to indices for reference
    const tabIdToIndex = new Map<string, number>()
    allTabs.forEach((tab, index) => {
      tabIdToIndex.set(tab.id, index)
    })
    
    const groupIdToIndex = new Map<string, number>()
    allGroups.forEach((group, index) => {
      groupIdToIndex.set(group.id, index)
    })
    
    // Prepare export data (exclude IDs and timestamps)
    // Use indices instead of IDs to maintain relationships
    const exportData: ExportData = {
      tabs: allTabs.map((tab) => ({
        name: tab.name,
        color: tab.color,
      })),
      groups: allGroups
        .filter((group) => {
          // Skip groups with null tabId if no tabs exist
          if (!group.tabId && allTabs.length === 0) {
            console.warn(`Skipping group ${group.name} with null tabId (no tabs available)`)
            return false
          }
          return true
        })
        .map((group) => {
          // Handle null tabId by assigning to first tab (index 0) if tabs exist
          const tabId = group.tabId
          let tabIndex: number
          if (!tabId) {
            if (allTabs.length === 0) {
              throw new Error(`Group ${group.name} has null tabId and no tabs exist`)
            }
            tabIndex = 0 // Assign to first tab
            console.warn(`Group ${group.name} has null tabId, assigning to first tab (index 0)`)
          } else {
            tabIndex = tabIdToIndex.get(tabId)
            if (tabIndex === undefined) {
              throw new Error(`Group ${group.name} references unknown tab ${tabId}`)
            }
          }
          return {
            name: group.name,
            color: group.color,
            tabIndex,
          }
        }),
      bookmarks: allBookmarks
        .filter((bookmark) => {
          // Skip bookmarks with null tabId if no tabs exist
          if (!bookmark.tabId && allTabs.length === 0) {
            console.warn(`Skipping bookmark ${bookmark.name} with null tabId (no tabs available)`)
            return false
          }
          return true
        })
        .map((bookmark) => {
          // Handle null tabId by assigning to first tab (index 0) if tabs exist
          const tabId = bookmark.tabId
          let tabIndex: number
          if (!tabId) {
            if (allTabs.length === 0) {
              throw new Error(`Bookmark ${bookmark.name} has null tabId and no tabs exist`)
            }
            tabIndex = 0 // Assign to first tab
            console.warn(`Bookmark ${bookmark.name} has null tabId, assigning to first tab (index 0)`)
          } else {
            tabIndex = tabIdToIndex.get(tabId)
            if (tabIndex === undefined) {
              throw new Error(`Bookmark ${bookmark.name} references unknown tab ${tabId}`)
            }
          }
          return {
            name: bookmark.name,
            url: bookmark.url,
            tabIndex,
            groupIndices: (bookmark.groupIds || [])
              .map((groupId) => groupIdToIndex.get(groupId))
              .filter((index): index is number => index !== undefined),
          }
        }),
    }

    // Create JSON string
    const jsonString = JSON.stringify(exportData, null, 2)
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Generate filename with current date
    const date = new Date()
    const dateStr = date.toISOString().split('T')[0]
    link.download = `bookmarks-export-${dateStr}.json`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    // Close modal after successful export
    handleCancel()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to export data'
    console.error('Export error:', err)
  }
}

function validateImportData(data: unknown): { 
  bookmarks: Array<CreateBookmarkDto & { groupIndices?: number[]; tabIndex?: number }>; 
  groups: Array<CreateGroupDto & { tabIndex?: number }>
  tabs: CreateTabDto[]
} | null {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid file format: data must be an object')
  }

  const obj = data as Record<string, unknown>

  // Validate tabs (required for new format, optional for backward compatibility)
  const tabs: CreateTabDto[] = []
  if (Array.isArray(obj.tabs)) {
    for (let i = 0; i < obj.tabs.length; i++) {
      const tab = obj.tabs[i]
      if (!tab || typeof tab !== 'object') {
        throw new Error(`Invalid tab at index ${i}: must be an object`)
      }
      const t = tab as Record<string, unknown>
      if (typeof t.name !== 'string' || !t.name.trim()) {
        throw new Error(`Invalid tab at index ${i}: name is required and must be a string`)
      }
      tabs.push({
        name: t.name.trim(),
        color: typeof t.color === 'string' ? t.color.trim() : undefined,
      })
    }
  }

  if (!Array.isArray(obj.groups)) {
    throw new Error('Invalid file format: groups must be an array')
  }

  // Validate groups
  const groups: Array<CreateGroupDto & { tabIndex?: number }> = []
  for (let i = 0; i < obj.groups.length; i++) {
    const group = obj.groups[i]
    if (!group || typeof group !== 'object') {
      throw new Error(`Invalid group at index ${i}: must be an object`)
    }
    const g = group as Record<string, unknown>
    if (typeof g.name !== 'string' || !g.name.trim()) {
      throw new Error(`Invalid group at index ${i}: name is required and must be a string`)
    }
    if (typeof g.color !== 'string' || !g.color.trim()) {
      throw new Error(`Invalid group at index ${i}: color is required and must be a string`)
    }
    // tabIndex can be a number (new format) or undefined (backward compatibility)
    const tabIndex = typeof g.tabIndex === 'number' && g.tabIndex >= 0 ? g.tabIndex : undefined
    groups.push({
      name: g.name.trim(),
      color: g.color.trim(),
      tabIndex,
    })
  }

  if (!Array.isArray(obj.bookmarks)) {
    throw new Error('Invalid file format: bookmarks must be an array')
  }

  // Validate bookmarks
  // groupIds/groupIndices in export are indices (numbers) referring to groups array position
  // tabIndex refers to tabs array position
  const bookmarks: Array<CreateBookmarkDto & { groupIndices?: number[]; tabIndex?: number }> = []
  for (let i = 0; i < obj.bookmarks.length; i++) {
    const bookmark = obj.bookmarks[i]
    if (!bookmark || typeof bookmark !== 'object') {
      throw new Error(`Invalid bookmark at index ${i}: must be an object`)
    }
    const b = bookmark as Record<string, unknown>
    if (typeof b.name !== 'string' || !b.name.trim()) {
      throw new Error(`Invalid bookmark at index ${i}: name is required and must be a string`)
    }
    if (typeof b.url !== 'string' || !b.url.trim()) {
      throw new Error(`Invalid bookmark at index ${i}: url is required and must be a string`)
    }
    // tabIndex can be a number (new format) or undefined (backward compatibility)
    const tabIndex = typeof b.tabIndex === 'number' && b.tabIndex >= 0 ? b.tabIndex : undefined
    // groupIds/groupIndices can be numbers (indices) or strings (for backward compatibility)
    const groupIndices = Array.isArray(b.groupIds) || Array.isArray(b.groupIndices)
      ? (b.groupIndices || b.groupIds || [])
          .map((id) => (typeof id === 'number' ? id : typeof id === 'string' ? parseInt(id, 10) : null))
          .filter((idx): idx is number => idx !== null && !isNaN(idx) && idx >= 0)
      : []
    bookmarks.push({
      name: b.name.trim(),
      url: b.url.trim(),
      groupIndices,
      tabIndex,
    })
  }

  return { bookmarks, groups, tabs }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) {
    return
  }

  error.value = null
  isImporting.value = true

  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string
      if (!text) {
        throw new Error('File is empty')
      }

      const jsonData = JSON.parse(text)
      const validatedData = validateImportData(jsonData)
      
      if (!validatedData) {
        throw new Error('Validation failed')
      }

      importData.value = validatedData
      showConfirmation.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to parse or validate file'
      console.error('Import error:', err)
    } finally {
      isImporting.value = false
    }
  }

  reader.onerror = () => {
    error.value = 'Failed to read file'
    isImporting.value = false
  }

  reader.readAsText(file)
}

async function handleImportConfirm() {
  if (!importData.value) {
    return
  }

  try {
    error.value = null
    isImporting.value = true

    // Delete all existing bookmarks
    const bookmarkIds = [...bookmarkStore.bookmarks.map((b) => b.id)]
    for (const id of bookmarkIds) {
      try {
        await bookmarkStore.removeBookmark(id)
      } catch (err) {
        console.error(`Failed to delete bookmark ${id}:`, err)
      }
    }

    // Delete all existing groups
    const groupIds = [...groupStore.groups.map((g) => g.id)]
    for (const id of groupIds) {
      try {
        await groupStore.removeGroup(id)
      } catch (err) {
        console.error(`Failed to delete group ${id}:`, err)
      }
    }

    // Delete all existing tabs
    const tabIds = [...tabStore.tabs.map((t) => t.id)]
    for (const id of tabIds) {
      try {
        await tabStore.removeTab(id)
      } catch (err) {
        console.error(`Failed to delete tab ${id}:`, err)
      }
    }

    // Create new tabs first (groups and bookmarks need tab IDs)
    // Store mapping from index to new tab ID
    const tabIndexToId = new Map<number, string>()
    for (let i = 0; i < importData.value.tabs.length; i++) {
      const tabData = importData.value.tabs[i]
      try {
        const newTab = await tabStore.addTab(tabData)
        tabIndexToId.set(i, newTab.id)
      } catch (err) {
        console.error(`Failed to create tab ${tabData.name}:`, err)
      }
    }

    // If no tabs were imported, create a default tab for backward compatibility
    if (importData.value.tabs.length === 0) {
      try {
        const defaultTab = await tabStore.addTab({ name: 'Default' })
        tabIndexToId.set(0, defaultTab.id)
      } catch (err) {
        console.error('Failed to create default tab:', err)
      }
    }

    // Create new groups (bookmarks need group IDs)
    // Store mapping from index to new group ID
    const groupIndexToId = new Map<number, string>()
    for (let i = 0; i < importData.value.groups.length; i++) {
      const groupData = importData.value.groups[i]
      try {
        // Map tab index to new tab ID, or use default tab (index 0) if no tabIndex
        let tabId: string | undefined
        if (groupData.tabIndex !== undefined) {
          tabId = tabIndexToId.get(groupData.tabIndex)
        } else {
          // Backward compatibility: use default tab (index 0)
          tabId = tabIndexToId.get(0)
        }
        
        if (!tabId) {
          console.error(`Group ${groupData.name} has invalid tabIndex ${groupData.tabIndex}`)
          continue
        }

        const newGroup = await groupStore.addGroup({
          name: groupData.name,
          color: groupData.color,
          tabId,
        })
        groupIndexToId.set(i, newGroup.id)
      } catch (err) {
        console.error(`Failed to create group ${groupData.name}:`, err)
      }
    }

    // Create new bookmarks with updated group IDs and tab IDs
    for (const bookmarkData of importData.value.bookmarks) {
      try {
        // Map tab index to new tab ID, or use default tab (index 0) if no tabIndex
        let tabId: string | undefined
        if (bookmarkData.tabIndex !== undefined) {
          tabId = tabIndexToId.get(bookmarkData.tabIndex)
        } else {
          // Backward compatibility: use default tab (index 0)
          tabId = tabIndexToId.get(0)
        }

        if (!tabId) {
          console.error(`Bookmark ${bookmarkData.name} has invalid tabIndex ${bookmarkData.tabIndex}`)
          continue
        }

        // Map group indices to new group IDs
        const mappedGroupIds: string[] = []
        
        if (bookmarkData.groupIndices && bookmarkData.groupIndices.length > 0) {
          for (const index of bookmarkData.groupIndices) {
            const newGroupId = groupIndexToId.get(index)
            if (newGroupId) {
              mappedGroupIds.push(newGroupId)
            }
          }
        }

        await bookmarkStore.addBookmark({
          name: bookmarkData.name,
          url: bookmarkData.url,
          tabId,
          groupIds: mappedGroupIds,
        })
      } catch (err) {
        console.error(`Failed to create bookmark ${bookmarkData.name}:`, err)
      }
    }

    // Refresh data
    await tabStore.fetchTabs()
    await bookmarkStore.fetchBookmarks()
    await groupStore.fetchGroups()

    // Close modal on success
    handleCancel()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to import data'
    console.error('Import error:', err)
  } finally {
    isImporting.value = false
  }
}

function handleImportCancel() {
  showConfirmation.value = false
  importData.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  error.value = null
}

function triggerFileInput() {
  fileInputRef.value?.click()
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
    @click.self="handleCancel"
  >
    <div
      class="bg-[var(--color-background)] p-8 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.3)] w-[90%] max-w-[500px]"
    >
      <!-- Confirmation Dialog -->
      <div v-if="showConfirmation" class="space-y-6">
        <h2 class="m-0 text-[var(--color-text)]">Confirm Import</h2>
        <div class="text-[var(--color-text)]">
          <p class="mb-4">
            This will replace all existing tabs, bookmarks and groups with the imported data.
          </p>
          <p class="mb-2 font-semibold">Import Summary:</p>
          <ul class="list-disc list-inside space-y-1 text-sm">
            <li>{{ importData?.tabs.length || 0 }} tab(s)</li>
            <li>{{ importData?.bookmarks.length || 0 }} bookmark(s)</li>
            <li>{{ importData?.groups.length || 0 }} group(s)</li>
          </ul>
          <p class="mt-4 text-[#dc3545] font-semibold">
            This action cannot be undone. Are you sure you want to continue?
          </p>
        </div>
        <div v-if="error" class="text-[#dc3545] text-sm">{{ error }}</div>
        <div class="flex gap-4 justify-end">
          <button
            type="button"
            class="px-6 py-3 border-none rounded text-base cursor-pointer transition-colors duration-200 bg-[var(--color-background-soft)] text-[var(--color-text)] hover:bg-[var(--color-border)]"
            @click="handleImportCancel"
            :disabled="isImporting"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-6 py-3 border-none rounded text-base cursor-pointer transition-colors duration-200 bg-[#dc3545] text-white hover:bg-[#c82333] disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleImportConfirm"
            :disabled="isImporting"
          >
            {{ isImporting ? 'Importing...' : 'Confirm Import' }}
          </button>
        </div>
      </div>

      <!-- Main Modal Content -->
      <div v-else class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="m-0 text-[var(--color-text)]">Export / Import</h2>
          <button
            type="button"
            class="p-2 text-[var(--color-text)] hover:bg-[var(--color-background-soft)] rounded transition-colors duration-200 cursor-pointer"
            @click="handleCancel"
            aria-label="Close modal"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div v-if="error" class="text-[#dc3545] text-sm p-4 bg-[#dc3545]/10 rounded">
          {{ error }}
        </div>

        <div class="space-y-4">
          <!-- Export Section -->
          <div class="p-6 border border-[var(--color-border)] rounded-lg">
            <h3 class="m-0 mb-3 text-lg text-[var(--color-text)]">Export Data</h3>
            <p class="m-0 mb-4 text-sm text-[var(--color-text)] opacity-70">
              Download all your tabs, bookmarks and groups as a JSON file.
            </p>
            <button
              type="button"
              class="w-full px-6 py-3 border-none rounded text-base cursor-pointer transition-colors duration-200 bg-[hsla(160,100%,37%,1)] text-white hover:bg-[hsla(160,100%,37%,0.8)]"
              @click="handleExport"
            >
              Export to JSON
            </button>
          </div>

          <!-- Import Section -->
          <div class="p-6 border border-[var(--color-border)] rounded-lg">
            <h3 class="m-0 mb-3 text-lg text-[var(--color-text)]">Import Data</h3>
            <p class="m-0 mb-4 text-sm text-[var(--color-text)] opacity-70">
              Import tabs, bookmarks and groups from a JSON file. This will replace all existing data.
            </p>
            <input
              ref="fileInputRef"
              type="file"
              accept=".json,application/json"
              class="hidden"
              @change="handleFileSelect"
            />
            <button
              type="button"
              class="w-full px-6 py-3 border-none rounded text-base cursor-pointer transition-colors duration-200 bg-[var(--color-background-soft)] text-[var(--color-text)] hover:bg-[var(--color-border)] border border-[var(--color-border)]"
              @click="triggerFileInput"
              :disabled="isImporting"
            >
              {{ isImporting ? 'Processing...' : 'Select JSON File' }}
            </button>
          </div>
        </div>

        <div class="flex gap-4 justify-end">
          <button
            type="button"
            class="px-6 py-3 border-none rounded text-base cursor-pointer transition-colors duration-200 bg-[var(--color-background-soft)] text-[var(--color-text)] hover:bg-[var(--color-border)]"
            @click="handleCancel"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

