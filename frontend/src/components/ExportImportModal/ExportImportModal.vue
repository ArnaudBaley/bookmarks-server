<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useBookmarkStore } from '@/stores/bookmark/bookmark'
import { useGroupStore } from '@/stores/group/group'
import { useTabStore } from '@/stores/tab/tab'
import { useExportData } from '@/composables/useExportData'
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
const { exportUserData } = useExportData()

const error = ref<string | null>(null)
const isImporting = ref(false)
const showConfirmation = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const importType = ref<'json' | 'html'>('json')
const isHtmlImport = ref(false)
const importData = ref<{ 
  bookmarks: Array<Omit<CreateBookmarkDto, 'tabId'> & { groupIndices?: number[]; tabIndex?: number }>; 
  groups: Array<Omit<CreateGroupDto, 'tabId'> & { tabIndex?: number }>
  tabs: CreateTabDto[]
  tabName?: string
} | null>(null)


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
  isHtmlImport.value = false
  importType.value = 'json'
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  emit('cancel')
}

async function handleExport() {
  try {
    error.value = null
    await exportUserData()
    // Close modal after successful export
    handleCancel()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to export data'
    console.error('Export error:', err)
  }
}

function validateImportData(data: unknown): { 
  bookmarks: Array<Omit<CreateBookmarkDto, 'tabId'> & { groupIndices?: number[]; tabIndex?: number }>; 
  groups: Array<Omit<CreateGroupDto, 'tabId'> & { tabIndex?: number }>
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
  const groups: Array<Omit<CreateGroupDto, 'tabId'> & { tabIndex?: number }> = []
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
  const bookmarks: Array<Omit<CreateBookmarkDto, 'tabId'> & { groupIndices?: number[]; tabIndex?: number }> = []
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
    const groupIndicesArray = Array.isArray(b.groupIds) ? b.groupIds : Array.isArray(b.groupIndices) ? b.groupIndices : []
    const groupIndices = groupIndicesArray
      .map((id: unknown): number | null => (typeof id === 'number' ? id : typeof id === 'string' ? parseInt(id, 10) : null))
      .filter((idx): idx is number => idx !== null && !isNaN(idx) && idx >= 0)
    bookmarks.push({
      name: b.name.trim(),
      url: b.url.trim(),
      groupIndices,
      tabIndex,
    })
  }

  return { bookmarks, groups, tabs }
}

interface ParsedHtmlBookmark {
  name: string
  url: string
  folderName?: string
}

interface ParsedHtmlFolder {
  name: string
  bookmarks: ParsedHtmlBookmark[]
}

function parseHtmlBookmarks(htmlText: string): { folders: ParsedHtmlFolder[], bookmarks: ParsedHtmlBookmark[] } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlText, 'text/html')
  
  const folders: ParsedHtmlFolder[] = []
  const bookmarks: ParsedHtmlBookmark[] = []
  const folderMap = new Map<string, ParsedHtmlFolder>()

  function processDl(dlElement: Element, currentFolder?: string) {
    if (!dlElement) return

    const children = Array.from(dlElement.children)
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child) continue
      
      if (child.tagName === 'DT') {
        const h3 = child.querySelector('H3')
        const a = child.querySelector('A')
        
        if (h3) {
          // This is a folder
          const folderName = h3.textContent?.trim() || 'Unnamed Folder'
          const nestedDl = child.querySelector('DL')
          
          if (!folderMap.has(folderName)) {
            const folder: ParsedHtmlFolder = {
              name: folderName,
              bookmarks: []
            }
            folderMap.set(folderName, folder)
            folders.push(folder)
          }
          
          // Process nested content
          if (nestedDl) {
            processDl(nestedDl, folderName)
          }
        } else if (a && a.getAttribute('HREF')) {
          // This is a bookmark
          const href = a.getAttribute('HREF')
          const title = a.textContent?.trim() || href || 'Unnamed Bookmark'
          
          if (href) {
            const bookmark: ParsedHtmlBookmark = {
              name: title,
              url: href,
              folderName: currentFolder
            }
            
            if (currentFolder) {
              const folder = folderMap.get(currentFolder)
              if (folder) {
                folder.bookmarks.push(bookmark)
              }
            } else {
              bookmarks.push(bookmark)
            }
          }
        }
      }
    }
  }

  // Find the main DL element (usually the root)
  const mainDl = doc.querySelector('DL')
  if (mainDl) {
    processDl(mainDl)
  }

  return { folders, bookmarks }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) {
    return
  }

  error.value = null
  isImporting.value = true

  // Detect file type from extension or content
  const fileName = file.name.toLowerCase()
  const isHtml = importType.value === 'html' || fileName.endsWith('.html') || fileName.endsWith('.htm')

  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string
      if (!text) {
        throw new Error('File is empty')
      }

      if (isHtml) {
        // Parse HTML bookmarks
        const { folders, bookmarks } = parseHtmlBookmarks(text)
        
        // Extract filename without extension for tab name
        const fileNameWithoutExt = file.name.replace(/\.(html?|htm)$/i, '') || 'Imported Bookmarks'
        
        // Convert to import data format
        const groups: Array<Omit<CreateGroupDto, 'tabId'> & { tabIndex?: number }> = folders.map((folder) => ({
          name: folder.name,
          color: '#3b82f6', // Default blue color
          tabIndex: 0, // Will be assigned to the new tab
        }))

        // Create a map of folder names to indices
        const folderNameToIndex = new Map<string, number>()
        folders.forEach((folder, index) => {
          folderNameToIndex.set(folder.name, index)
        })

        const importedBookmarks: Array<Omit<CreateBookmarkDto, 'tabId'> & { groupIndices?: number[]; tabIndex?: number }> = []
        
        // Add bookmarks from folders
        folders.forEach((folder) => {
          const groupIndex = folderNameToIndex.get(folder.name)
          if (groupIndex !== undefined) {
            folder.bookmarks.forEach((bookmark) => {
              importedBookmarks.push({
                name: bookmark.name,
                url: bookmark.url,
                groupIndices: [groupIndex],
                tabIndex: 0,
              })
            })
          }
        })

        // Add bookmarks without folders (they will appear in "Ungrouped" section)
        // These bookmarks have no groupIndices, so they won't be assigned to any group
        bookmarks.forEach((bookmark) => {
          importedBookmarks.push({
            name: bookmark.name,
            url: bookmark.url,
            tabIndex: 0,
            // No groupIndices - these will appear in the "Ungrouped" section
          })
        })

        importData.value = {
          tabs: [{ name: fileNameWithoutExt }],
          groups,
          bookmarks: importedBookmarks,
          tabName: fileNameWithoutExt,
        }
        isHtmlImport.value = true
      } else {
        // Parse JSON
        const jsonData = JSON.parse(text)
        const validatedData = validateImportData(jsonData)
        
        if (!validatedData) {
          throw new Error('Validation failed')
        }

        importData.value = validatedData
        isHtmlImport.value = false
      }

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

    if (isHtmlImport.value) {
      // HTML import: Add to existing data (create new tab)
      await handleHtmlImport()
    } else {
      // JSON import: Replace all existing data
      await handleJsonImport()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to import data'
    console.error('Import error:', err)
  } finally {
    isImporting.value = false
  }
}

async function handleHtmlImport() {
  if (!importData.value) {
    return
  }

  // Create new tab with filename as name
  const tabName = importData.value.tabName || 'Imported Bookmarks'
  const newTab = await tabStore.addTab({ name: tabName })
  const newTabId = newTab.id

  // Create groups in the new tab
  const groupIndexToId = new Map<number, string>()
  for (let i = 0; i < importData.value.groups.length; i++) {
    const groupData = importData.value.groups[i]
    if (!groupData) {
      continue
    }
    try {
      const newGroup = await groupStore.addGroup({
        name: groupData.name,
        color: groupData.color || '#3b82f6',
        tabId: newTabId,
      })
      groupIndexToId.set(i, newGroup.id)
    } catch (err) {
      console.error(`Failed to create group ${groupData.name}:`, err)
    }
  }

  // Create bookmarks in the new tab
  for (const bookmarkData of importData.value.bookmarks) {
    try {
      const mappedGroupIds: string[] = []
      
      if (bookmarkData.groupIndices && bookmarkData.groupIndices.length > 0) {
        for (const index of bookmarkData.groupIndices) {
          const groupId = groupIndexToId.get(index)
          if (groupId) {
            mappedGroupIds.push(groupId)
          }
        }
      }

      await bookmarkStore.addBookmark({
        name: bookmarkData.name,
        url: bookmarkData.url,
        tabId: newTabId,
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
}

async function handleJsonImport() {
  if (!importData.value) {
    return
  }

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

  // Refresh tabs to check if any remain (e.g., from backend migration)
  await tabStore.fetchTabs()

  // Create new tabs first (groups and bookmarks need tab IDs)
  // Store mapping from index to new tab ID
  const jsonTabIndexToId = new Map<number, string>()
  for (let i = 0; i < importData.value.tabs.length; i++) {
    const tabData = importData.value.tabs[i]
    if (!tabData) {
      continue
    }
    try {
      const newTab = await tabStore.addTab(tabData)
      jsonTabIndexToId.set(i, newTab.id)
    } catch (err) {
      console.error(`Failed to create tab ${tabData.name}:`, err)
    }
  }

  // If no tabs were imported and no tabs exist, create a default tab for backward compatibility
  // Check both importData and actual tabs to avoid creating duplicate default tabs
  if (importData.value.tabs.length === 0 && tabStore.tabs.length === 0) {
    try {
      const defaultTab = await tabStore.addTab({ name: 'Default' })
      jsonTabIndexToId.set(0, defaultTab.id)
    } catch (err) {
      console.error('Failed to create default tab:', err)
    }
  } else if (importData.value.tabs.length === 0 && tabStore.tabs.length > 0) {
    // If no tabs were imported but tabs exist (e.g., from migration), use the first existing tab
    const existingTab = tabStore.tabs[0]
    if (existingTab) {
      jsonTabIndexToId.set(0, existingTab.id)
    }
  }

  // Create new groups (bookmarks need group IDs)
  // Store mapping from index to new group ID
  const jsonGroupIndexToId = new Map<number, string>()
  for (let i = 0; i < importData.value.groups.length; i++) {
    const groupData = importData.value.groups[i]
    if (!groupData) {
      continue
    }
    try {
      // Map tab index to new tab ID, or use default tab (index 0) if no tabIndex
      let tabId: string | undefined
      if (groupData.tabIndex !== undefined) {
        tabId = jsonTabIndexToId.get(groupData.tabIndex)
      } else {
        // Backward compatibility: use default tab (index 0)
        tabId = jsonTabIndexToId.get(0)
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
      jsonGroupIndexToId.set(i, newGroup.id)
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
        tabId = jsonTabIndexToId.get(bookmarkData.tabIndex)
      } else {
        // Backward compatibility: use default tab (index 0)
        tabId = jsonTabIndexToId.get(0)
      }

      if (!tabId) {
        console.error(`Bookmark ${bookmarkData.name} has invalid tabIndex ${bookmarkData.tabIndex}`)
        continue
      }

      // Map group indices to new group IDs
      const mappedGroupIds: string[] = []
      
      if (bookmarkData.groupIndices && bookmarkData.groupIndices.length > 0) {
        for (const index of bookmarkData.groupIndices) {
          const newGroupId = jsonGroupIndexToId.get(index)
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
          <p class="mb-4" v-if="isHtmlImport">
            This will create a new tab named "{{ importData?.tabName || 'Imported Bookmarks' }}" and add the imported bookmarks and groups to it. Existing data will be preserved.
          </p>
          <p class="mb-4" v-else>
            This will replace all existing tabs, bookmarks and groups with the imported data.
          </p>
          <p class="mb-2 font-semibold">Import Summary:</p>
          <ul class="list-disc list-inside space-y-1 text-sm">
            <li v-if="isHtmlImport">1 new tab: "{{ importData?.tabName || 'Imported Bookmarks' }}"</li>
            <li v-else>{{ importData?.tabs.length || 0 }} tab(s)</li>
            <li>{{ importData?.bookmarks.length || 0 }} bookmark(s)</li>
            <li>{{ importData?.groups.length || 0 }} group(s)</li>
          </ul>
          <p class="mt-4 text-[#dc3545] font-semibold" v-if="!isHtmlImport">
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
            
            <!-- Import Type Selection -->
            <div class="mb-4">
              <label class="block mb-2 text-sm font-medium text-[var(--color-text)]">Import Type:</label>
              <div class="flex gap-4">
                <label class="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="json"
                    v-model="importType"
                    class="mr-2 cursor-pointer"
                  />
                  <span class="text-sm text-[var(--color-text)]">JSON</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="html"
                    v-model="importType"
                    class="mr-2 cursor-pointer"
                  />
                  <span class="text-sm text-[var(--color-text)]">HTML (Browser Bookmarks)</span>
                </label>
              </div>
            </div>

            <p class="m-0 mb-4 text-sm text-[var(--color-text)] opacity-70" v-if="importType === 'json'">
              Import tabs, bookmarks and groups from a JSON file. This will replace all existing data.
            </p>
            <p class="m-0 mb-4 text-sm text-[var(--color-text)] opacity-70" v-else>
              Import bookmarks from a browser-exported HTML file. This will create a new tab with the imported bookmarks and groups. Existing data will be preserved.
            </p>
            <input
              ref="fileInputRef"
              type="file"
              :accept="importType === 'json' ? '.json,application/json' : '.html,.htm,text/html'"
              class="hidden"
              @change="handleFileSelect"
            />
            <button
              type="button"
              class="w-full px-6 py-3 border-none rounded text-base cursor-pointer transition-colors duration-200 bg-[var(--color-background-soft)] text-[var(--color-text)] hover:bg-[var(--color-border)] border border-[var(--color-border)]"
              @click="triggerFileInput"
              :disabled="isImporting"
            >
              {{ isImporting ? 'Processing...' : importType === 'json' ? 'Select JSON File' : 'Select HTML File' }}
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

