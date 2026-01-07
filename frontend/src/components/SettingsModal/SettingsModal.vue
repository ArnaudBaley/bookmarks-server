<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/theme/theme'
import { useBookmarkStore } from '@/stores/bookmark/bookmark'
import { useGroupStore } from '@/stores/group/group'
import { useTabStore } from '@/stores/tab/tab'
import ExportImportModal from '@/components/ExportImportModal/ExportImportModal.vue'

interface Emits {
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

const themeStore = useThemeStore()
const bookmarkStore = useBookmarkStore()
const groupStore = useGroupStore()
const tabStore = useTabStore()

const showDeleteConfirmation = ref(false)
const showExportImportModal = ref(false)
const isDeleting = ref(false)
const error = ref<string | null>(null)

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (showDeleteConfirmation.value) {
      showDeleteConfirmation.value = false
    } else if (showExportImportModal.value) {
      showExportImportModal.value = false
    } else {
      handleCancel()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscapeKey)
})

function handleCancel() {
  showDeleteConfirmation.value = false
  showExportImportModal.value = false
  error.value = null
  emit('cancel')
}

function handleDeleteClick() {
  showDeleteConfirmation.value = true
}

function handleDeleteCancel() {
  showDeleteConfirmation.value = false
}

async function handleDeleteConfirm() {
  isDeleting.value = true
  error.value = null
  
  try {
    // Delete all bookmarks, groups, and tabs
    await bookmarkStore.deleteAllBookmarks()
    await groupStore.deleteAllGroups()
    await tabStore.deleteAllTabs()
    
    // Close confirmation and modal
    showDeleteConfirmation.value = false
    handleCancel()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete all data'
    console.error('Error deleting all data:', err)
  } finally {
    isDeleting.value = false
  }
}

function handleExportImportClick() {
  showExportImportModal.value = true
}

function handleExportImportCancel() {
  showExportImportModal.value = false
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
    @click.self="handleCancel"
  >
    <div
      class="bg-[var(--color-background)] p-8 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.3)] w-[90%] max-w-[500px] max-h-[90vh] overflow-y-auto"
    >
      <!-- Delete Confirmation Dialog -->
      <div v-if="showDeleteConfirmation" class="space-y-6">
        <h2 class="m-0 text-[var(--color-text)]">Delete All Data</h2>
        <div class="text-[var(--color-text)]">
          <p class="mb-4">
            Are you sure you want to delete <strong>all</strong> your data?
          </p>
          <p class="mb-2 text-[#dc3545] font-semibold">
            This will permanently delete:
          </p>
          <ul class="list-disc list-inside space-y-1 text-sm mb-4">
            <li>All tabs</li>
            <li>All groups</li>
            <li>All bookmarks</li>
          </ul>
          <p class="text-[#dc3545] font-semibold">
            This action cannot be undone.
          </p>
        </div>
        <div v-if="error" class="text-[#dc3545] text-sm p-3 bg-[#dc3545]/10 rounded">
          {{ error }}
        </div>
        <div class="flex gap-4 justify-end">
          <button
            type="button"
            class="px-6 py-3 border-none rounded text-base cursor-pointer transition-colors duration-200 bg-[var(--color-background-soft)] text-[var(--color-text)] hover:bg-[var(--color-border)]"
            @click="handleDeleteCancel"
            :disabled="isDeleting"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-6 py-3 border-none rounded text-base cursor-pointer transition-colors duration-200 bg-[#dc3545] text-white hover:bg-[#c82333] disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleDeleteConfirm"
            :disabled="isDeleting"
          >
            {{ isDeleting ? 'Deleting...' : 'Delete All Data' }}
          </button>
        </div>
      </div>

      <!-- Export/Import Modal -->
      <ExportImportModal
        v-else-if="showExportImportModal"
        @cancel="handleExportImportCancel"
      />

      <!-- Main Settings Content -->
      <div v-else class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="m-0 text-[var(--color-text)]">Settings</h2>
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

        <!-- Theme Section -->
        <div class="p-6 border border-[var(--color-border)] rounded-lg">
          <h3 class="m-0 mb-3 text-lg text-[var(--color-text)]">Theme</h3>
          <p class="m-0 mb-4 text-sm text-[var(--color-text)] opacity-70">
            Switch between light and dark theme
          </p>
          <div class="flex items-center gap-4">
            <span class="text-[var(--color-text)]">Current theme: </span>
            <span class="text-[var(--color-text)] font-medium">{{ themeStore.theme === 'light' ? 'Light' : 'Dark' }}</span>
            <button
              type="button"
              class="px-6 py-3 border-none rounded text-base cursor-pointer transition-colors duration-200 bg-[var(--color-background-soft)] text-[var(--color-text)] hover:bg-[var(--color-border)] border border-[var(--color-border)]"
              @click="themeStore.toggleTheme()"
            >
              Switch to {{ themeStore.theme === 'light' ? 'Dark' : 'Light' }} Theme
            </button>
          </div>
        </div>

        <!-- Export/Import Section -->
        <div class="p-6 border border-[var(--color-border)] rounded-lg">
          <h3 class="m-0 mb-3 text-lg text-[var(--color-text)]">Export / Import</h3>
          <p class="m-0 mb-4 text-sm text-[var(--color-text)] opacity-70">
            Export your data to a JSON file or import from a previously exported file
          </p>
          <button
            type="button"
            class="w-full px-6 py-3 border-none rounded text-base cursor-pointer transition-colors duration-200 bg-[var(--color-background-soft)] text-[var(--color-text)] hover:bg-[var(--color-border)] border border-[var(--color-border)]"
            @click="handleExportImportClick"
          >
            Export / Import Data
          </button>
        </div>

        <!-- Delete All Data Section -->
        <div class="p-6 border border-[var(--color-border)] rounded-lg">
          <h3 class="m-0 mb-3 text-lg text-[var(--color-text)]">Delete All Data</h3>
          <p class="m-0 mb-4 text-sm text-[var(--color-text)] opacity-70">
            Permanently delete all tabs, groups, and bookmarks. This action cannot be undone.
          </p>
          <button
            type="button"
            class="w-full px-6 py-3 border-none rounded text-base cursor-pointer transition-colors duration-200 bg-[#dc3545] text-white hover:bg-[#c82333]"
            @click="handleDeleteClick"
          >
            Delete All Data
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

