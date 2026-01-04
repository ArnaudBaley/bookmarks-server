<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useBookmarkStore } from '@/stores/bookmark'
import { useGroupStore } from '@/stores/group'
import type { CreateBookmarkDto } from '@/types/bookmark'
import type { CreateGroupDto } from '@/types/group'

interface Emits {
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

const bookmarkStore = useBookmarkStore()
const groupStore = useGroupStore()

const error = ref<string | null>(null)
const isImporting = ref(false)
const showConfirmation = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const importData = ref<{ 
  bookmarks: Array<CreateBookmarkDto & { groupIndices?: number[] }>; 
  groups: CreateGroupDto[] 
} | null>(null)

interface ExportData {
  bookmarks: Array<{
    name: string
    url: string
    groupIds?: string[]
  }>
  groups: Array<{
    name: string
    color: string
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
    
    // Create a map from group ID to index for reference
    const groupIdToIndex = new Map<string, number>()
    groupStore.groups.forEach((group, index) => {
      groupIdToIndex.set(group.id, index)
    })
    
    // Prepare export data (exclude IDs and timestamps)
    // Use group indices instead of IDs to maintain relationships
    const exportData: ExportData = {
      bookmarks: bookmarkStore.bookmarks.map((bookmark) => ({
        name: bookmark.name,
        url: bookmark.url,
        groupIds: (bookmark.groupIds || [])
          .map((groupId) => groupIdToIndex.get(groupId))
          .filter((index): index is number => index !== undefined),
      })),
      groups: groupStore.groups.map((group) => ({
        name: group.name,
        color: group.color,
      })),
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
  bookmarks: Array<CreateBookmarkDto & { groupIndices?: number[] }>; 
  groups: CreateGroupDto[] 
} | null {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid file format: data must be an object')
  }

  const obj = data as Record<string, unknown>

  if (!Array.isArray(obj.bookmarks)) {
    throw new Error('Invalid file format: bookmarks must be an array')
  }

  if (!Array.isArray(obj.groups)) {
    throw new Error('Invalid file format: groups must be an array')
  }

    // Validate bookmarks
    // groupIds in export are indices (numbers) referring to groups array position
    const bookmarks: Array<CreateBookmarkDto & { groupIndices?: number[] }> = []
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
      // groupIds can be numbers (indices) or strings (for backward compatibility)
      const groupIndices = Array.isArray(b.groupIds)
        ? b.groupIds
            .map((id) => (typeof id === 'number' ? id : typeof id === 'string' ? parseInt(id, 10) : null))
            .filter((idx): idx is number => idx !== null && !isNaN(idx) && idx >= 0)
        : []
      bookmarks.push({
        name: b.name.trim(),
        url: b.url.trim(),
        groupIndices,
      })
    }

  // Validate groups
  const groups: CreateGroupDto[] = []
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
    groups.push({
      name: g.name.trim(),
      color: g.color.trim(),
    })
  }

  return { bookmarks, groups }
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

    // Create new groups first (bookmarks need group IDs)
    // Store mapping from index to new group ID
    const groupIndexToId = new Map<number, string>()
    for (let i = 0; i < importData.value.groups.length; i++) {
      const groupData = importData.value.groups[i]
      try {
        const newGroup = await groupStore.addGroup(groupData)
        groupIndexToId.set(i, newGroup.id)
      } catch (err) {
        console.error(`Failed to create group ${groupData.name}:`, err)
      }
    }

    // Create new bookmarks with updated group IDs
    for (const bookmarkData of importData.value.bookmarks) {
      try {
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
          groupIds: mappedGroupIds,
        })
      } catch (err) {
        console.error(`Failed to create bookmark ${bookmarkData.name}:`, err)
      }
    }

    // Refresh data
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
            This will replace all existing bookmarks and groups with the imported data.
          </p>
          <p class="mb-2 font-semibold">Import Summary:</p>
          <ul class="list-disc list-inside space-y-1 text-sm">
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
              Download all your bookmarks and groups as a JSON file.
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
              Import bookmarks and groups from a JSON file. This will replace all existing data.
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

