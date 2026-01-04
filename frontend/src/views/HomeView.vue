<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useBookmarkStore } from '@/stores/bookmark'
import BookmarkCard from '@/components/BookmarkCard.vue'
import AddBookmarkForm from '@/components/AddBookmarkForm.vue'
import EditBookmarkForm from '@/components/EditBookmarkForm.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import type { CreateBookmarkDto, UpdateBookmarkDto, Bookmark } from '@/types/bookmark'

const bookmarkStore = useBookmarkStore()
const showAddForm = ref(false)
const editingBookmark = ref<Bookmark | null>(null)
const isDraggingOver = ref(false)

onMounted(() => {
  bookmarkStore.fetchBookmarks()
})

async function handleAddBookmark(data: CreateBookmarkDto) {
  try {
    await bookmarkStore.addBookmark(data)
    showAddForm.value = false
  } catch (error) {
    console.error('Failed to add bookmark:', error)
  }
}

async function handleModifyBookmark(bookmark: Bookmark) {
  editingBookmark.value = bookmark
}

async function handleUpdateBookmark(id: string, data: UpdateBookmarkDto) {
  try {
    await bookmarkStore.updateBookmark(id, data)
    editingBookmark.value = null
  } catch (error) {
    console.error('Failed to update bookmark:', error)
  }
}

async function handleDeleteFromEditForm(id: string) {
  try {
    await bookmarkStore.removeBookmark(id)
    editingBookmark.value = null
  } catch (error) {
    console.error('Failed to delete bookmark:', error)
  }
}

function normalizeUrl(urlString: string): string {
  if (!urlString) return ''
  
  // Add protocol if missing
  if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
    return `https://${urlString}`
  }
  return urlString
}

function validateUrl(urlString: string): boolean {
  try {
    const urlObj = new URL(urlString)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

function extractNameFromUrl(urlString: string): string {
  try {
    const urlObj = new URL(urlString)
    // Use hostname without www prefix
    const hostname = urlObj.hostname.replace(/^www\./, '')
    // Capitalize first letter and remove TLD for cleaner name
    const domainPart = hostname.split('.')[0]
    if (domainPart) {
      return domainPart.charAt(0).toUpperCase() + domainPart.slice(1)
    }
    return hostname
  } catch {
    // Fallback to URL if parsing fails
    return urlString.length > 50 ? urlString.substring(0, 50) + '...' : urlString
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
  isDraggingOver.value = true
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  // Check if we're actually leaving the main element (not just moving to a child)
  const target = event.target as HTMLElement
  const relatedTarget = event.relatedTarget as HTMLElement | null
  
  if (!relatedTarget || !target.contains(relatedTarget)) {
    isDraggingOver.value = false
  }
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDraggingOver.value = false

  if (!event.dataTransfer) return

  // Try to get URL from different data types (browsers use different formats)
  let url: string | undefined = event.dataTransfer.getData('text/uri-list') || 
            event.dataTransfer.getData('text/plain') ||
            event.dataTransfer.getData('URL') ||
            event.dataTransfer.getData('text/html')

  // If we got HTML, try to extract URL from href attribute
  if (url && url.includes('<a') && url.includes('href=')) {
    const hrefMatch = url.match(/href=["']([^"']+)["']/i)
    if (hrefMatch && hrefMatch[1]) {
      url = hrefMatch[1]
    }
  }

  // Clean up the URL (remove newlines, trim, decode HTML entities)
  if (!url) return
  
  url = url.trim().split('\n')[0]?.split('\r')[0] || url.trim()
  
  // Decode HTML entities if present
  if (url && url.includes('&')) {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = url
    const decodedUrl = textarea.value
    if (decodedUrl) {
      url = decodedUrl
    }
  }

  if (!url) return

  // Normalize and validate URL
  const normalizedUrl = normalizeUrl(url)
  
  if (!validateUrl(normalizedUrl)) {
    console.error('Invalid URL dropped:', url)
    return
  }

  // Extract name from URL
  const name = extractNameFromUrl(normalizedUrl)

  // Create bookmark
  await handleAddBookmark({
    name,
    url: normalizedUrl,
  })
}
</script>

<template>
  <main 
    class="w-full max-w-[1200px] mx-auto p-8 md:p-4 transition-all duration-200"
    :class="{ 'ring-4 ring-[hsla(160,100%,37%,0.5)] ring-offset-2 rounded-lg': isDraggingOver }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="flex justify-between items-center mb-8">
      <h1 class="m-0 text-[var(--color-text)]">My Bookmarks</h1>
      <div class="flex gap-4 items-center">
        <ThemeToggle />
        <button
          class="w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-background-soft)] text-[var(--color-text)] cursor-pointer flex items-center justify-center transition-[transform,background-color,border-color] duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:scale-110 hover:bg-[var(--color-background-mute)] hover:border-[var(--color-border-hover)] active:scale-95"
          @click="showAddForm = true"
          aria-label="Add new bookmark"
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>

    <div
      v-if="bookmarkStore.loading && bookmarkStore.bookmarks.length === 0"
      class="text-center py-12 text-[var(--color-text)]"
    >
      Loading bookmarks...
    </div>

    <div
      v-else-if="bookmarkStore.error && bookmarkStore.bookmarks.length === 0"
      class="text-center py-12 text-[var(--color-text)]"
    >
      <p>Error: {{ bookmarkStore.error }}</p>
      <button
        class="mt-4 px-4 py-2 bg-[hsla(160,100%,37%,1)] text-white border-none rounded cursor-pointer hover:bg-[hsla(160,100%,37%,0.8)]"
        @click="bookmarkStore.fetchBookmarks()"
      >
        Retry
      </button>
    </div>

    <div v-else-if="bookmarkStore.bookmarks.length === 0" class="text-center py-12 text-[var(--color-text)]">
      <p>No bookmarks yet. Click the + button to add your first bookmark!</p>
      <p class="mt-4 text-sm opacity-70">Or drag and drop a URL from your browser here</p>
    </div>

    <div
      v-else
      class="grid grid-cols-[repeat(auto-fill,minmax(288px,1fr))] gap-3"
    >
      <BookmarkCard
        v-for="bookmark in bookmarkStore.bookmarks"
        :key="bookmark.id"
        :bookmark="bookmark"
        @modify="handleModifyBookmark"
      />
    </div>

    <AddBookmarkForm v-if="showAddForm" @submit="handleAddBookmark" @cancel="showAddForm = false" />
    <EditBookmarkForm
      v-if="editingBookmark"
      :bookmark="editingBookmark"
      @submit="handleUpdateBookmark"
      @delete="handleDeleteFromEditForm"
      @cancel="editingBookmark = null"
    />
  </main>
</template>
