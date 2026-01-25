<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Group } from '@/types/group'
import type { Bookmark } from '@/types/bookmark'
import { useBookmarkStore } from '@/stores/bookmark/bookmark'
import { useTabStore } from '@/stores/tab/tab'
import { useGroupStore } from '@/stores/group/group'
import BookmarkCard from '@/components/BookmarkCard/BookmarkCard.vue'

interface Props {
  group: Group
  bookmarks: Bookmark[]
  isFirst?: boolean
  isLast?: boolean
}

interface Emits {
  (e: 'modify', group: Group): void
  (e: 'bookmark-drop', groupId: string, bookmarkId: string): void
  (e: 'bookmark-modify', bookmark: Bookmark): void
  (e: 'bookmark-delete', id: string): void
  (e: 'bookmark-add', groupId: string): void
  (e: 'move-up'): void
  (e: 'move-down'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const bookmarkStore = useBookmarkStore()
const groupStore = useGroupStore()
const isExpanded = ref(true)
const isDragOver = ref(false)
const isDragging = ref(false)

// Bookmark reordering state
const bookmarkDragOverIndex = ref<number | null>(null)
const isDraggingBookmarkReorder = ref(false)
const draggingBookmarkId = ref<string | null>(null)

const bookmarksCount = computed(() => props.bookmarks.length)

// Track when a bookmark from THIS group starts being dragged
function handleBookmarkDragStartInGroup(bookmarkId: string) {
  isDraggingBookmarkReorder.value = true
  draggingBookmarkId.value = bookmarkId
}

function handleBookmarkDragEndInGroup() {
  isDraggingBookmarkReorder.value = false
  draggingBookmarkId.value = null
  bookmarkDragOverIndex.value = null
}

// Expose method to control expansion from parent
function setExpanded(expanded: boolean) {
  isExpanded.value = expanded
}

defineExpose({
  setExpanded,
})

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

function handleModify() {
  emit('modify', props.group)
}

// Bookmark reorder drop zone handlers
function handleBookmarkDropZoneDragOver(event: DragEvent, index: number) {
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  bookmarkDragOverIndex.value = index
}

function handleBookmarkDropZoneDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  // Only reset if leaving to outside the drop zone
  const relatedTarget = event.relatedTarget as HTMLElement | null
  const target = event.target as HTMLElement
  if (!relatedTarget || !target.parentElement?.contains(relatedTarget)) {
    bookmarkDragOverIndex.value = null
  }
}

async function handleBookmarkReorderDrop(event: DragEvent, targetIndex: number) {
  event.preventDefault()
  event.stopPropagation()
  bookmarkDragOverIndex.value = null
  
  // Read bookmark ID from dataTransfer (works during drop event)
  // Fall back to locally tracked ID
  let bookmarkId = event.dataTransfer?.getData('application/x-bookmark-reorder')
  if (!bookmarkId) {
    bookmarkId = draggingBookmarkId.value
  }

  if (!bookmarkId) {
    console.error('No bookmark ID found for reorder')
    return
  }

  console.log('Reordering bookmark', bookmarkId, 'to index', targetIndex)

  // Reorder within this group (we only show drop zones for this group's bookmarks)
  try {
    await groupStore.reorderBookmarkInGroup(
      props.group.id,
      bookmarkId,
      props.bookmarks,
      targetIndex,
    )
  } catch (err) {
    console.error('Failed to reorder bookmark:', err)
  }
}

// Check if a bookmark is the one being dragged
function isBookmarkBeingDragged(bookmarkId: string): boolean {
  return draggingBookmarkId.value === bookmarkId
}

// Group drag handlers for reordering
function handleGroupDragStart(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/x-group-id', props.group.id)
    // Also set text/plain for fallback, but prefix it to distinguish from bookmarks
    event.dataTransfer.setData('text/plain', `group:${props.group.id}`)
  }
  isDragging.value = true
}

function handleGroupDragEnd() {
  isDragging.value = false
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer) {
    // Check if it's a bookmark drag (effectAllowed is 'move' for bookmarks)
    // or if it has URL-specific types (browsers set these for URL drags)
    const hasUrlTypes = event.dataTransfer.types.includes('text/uri-list') || 
                        event.dataTransfer.types.includes('URL') ||
                        event.dataTransfer.types.includes('text/html')
    
    // If effectAllowed is 'move', it's a bookmark drag
    // Otherwise, if it has URL types, it's a URL drag
    if (event.dataTransfer.effectAllowed === 'move' && !hasUrlTypes) {
      event.dataTransfer.dropEffect = 'move'
    } else {
      event.dataTransfer.dropEffect = 'copy'
    }
  }
  isDragOver.value = true
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  // Check if we're actually leaving the main element (not just moving to a child)
  const target = event.target as HTMLElement
  const relatedTarget = event.relatedTarget as HTMLElement | null
  
  if (!relatedTarget || !target.contains(relatedTarget)) {
    isDragOver.value = false
  }
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false

  if (!event.dataTransfer) return

  // Check if this is a group drag - ignore it (handled by HomeView)
  if (event.dataTransfer.types.includes('application/x-group-id')) {
    return
  }

  // Check if this is a bookmark reorder drag - ignore it (handled by bookmark drop zones)
  if (event.dataTransfer.types.includes('application/x-bookmark-reorder')) {
    // If it's a reorder drag from THIS group, ignore (drop zones handle it)
    const sourceGroupId = event.dataTransfer.getData('application/x-bookmark-source-group')
    if (sourceGroupId === props.group.id) {
      console.log('Parent handleDrop: ignoring bookmark reorder (should be handled by drop zones)')
      return
    }
    // If it's from another group, treat as a move operation
    const bookmarkId = event.dataTransfer.getData('application/x-bookmark-reorder')
    if (bookmarkId) {
      emit('bookmark-drop', props.group.id, bookmarkId)
      return
    }
  }

  // Get all possible data types
  const textPlain = event.dataTransfer.getData('text/plain')
  const uriList = event.dataTransfer.getData('text/uri-list')
  const urlData = event.dataTransfer.getData('URL')
  const htmlData = event.dataTransfer.getData('text/html')

  // Check if text/plain is a group drag (prefixed with "group:")
  if (textPlain && textPlain.startsWith('group:')) {
    return // Ignore group drags
  }

  // First, check if text/plain is a bookmark ID (existing bookmark being moved)
  if (textPlain) {
    const bookmark = bookmarkStore.bookmarks.find((b) => b.id === textPlain)
    if (bookmark) {
      // It's a bookmark drag - move existing bookmark
      emit('bookmark-drop', props.group.id, textPlain)
      return
    }
  }

  // If not a bookmark ID, check for URL data
  // Check for URL-specific data types (browsers set these when dragging URLs)
  let url: string | undefined = uriList || urlData

  // If we got HTML, try to extract URL from href attribute
  if (htmlData && htmlData.includes('<a') && htmlData.includes('href=')) {
    const hrefMatch = htmlData.match(/href=["']([^"']+)["']/i)
    if (hrefMatch && hrefMatch[1]) {
      url = hrefMatch[1]
    }
  }

  // Fallback to text/plain if no URL found yet (and it's not a bookmark ID)
  if (!url && textPlain) {
    url = textPlain
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
    // Not a valid URL, ignore
    console.error('Invalid URL dropped:', url)
    return
  }

  // It's a valid URL - create a new bookmark with this group
  const name = extractNameFromUrl(normalizedUrl)

  try {
    const tabStore = useTabStore()
    if (!tabStore.activeTabId) {
      console.error('No active tab selected')
      return
    }
    await bookmarkStore.addBookmark({
      name,
      url: normalizedUrl,
      tabId: tabStore.activeTabId,
      groupIds: [props.group.id],
    })
  } catch (error) {
    console.error('Failed to add bookmark to group:', error)
  }
}
</script>

<template>
  <div
    data-drop-zone="group"
    draggable="true"
    class="mb-6 rounded-lg bg-[var(--color-background-soft)] overflow-hidden transition-all duration-200 group-card"
    :class="[
      isDragOver ? 'border-2' : 'border border-[var(--color-border)]',
      isDragging ? 'opacity-50' : ''
    ]"
    :style="isDragOver ? { borderColor: group.color } : {}"
    @dragstart="handleGroupDragStart"
    @dragend="handleGroupDragEnd"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div
      class="flex items-center justify-between p-4 cursor-pointer transition-colors duration-200 hover:bg-[var(--color-background-mute)]"
      @click="isExpanded = !isExpanded"
    >
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!-- Drag handle -->
        <div
          class="cursor-grab active:cursor-grabbing opacity-40 hover:opacity-70 flex-shrink-0"
          title="Drag to reorder"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
          >
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </div>
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
          class="w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-background-soft)] text-[var(--color-text)] cursor-pointer flex items-center justify-center transition-[transform,background-color,border-color] duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:scale-110 hover:bg-[var(--color-background-mute)] hover:border-[var(--color-border-hover)] active:scale-95"
          @click.stop="$emit('bookmark-add', group.id)"
          aria-label="Add new bookmark"
          title="Add new bookmark"
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
        <button
          class="p-1.5 flex-shrink-0 rounded cursor-pointer transition-opacity duration-200 active:scale-[0.95] text-[var(--color-text)]"
          :class="isFirst ? 'opacity-20 cursor-not-allowed' : 'opacity-60 hover:opacity-100'"
          :disabled="isFirst"
          @click.stop="!isFirst && $emit('move-up')"
          aria-label="Move group up"
          title="Move group up"
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
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
        <button
          class="p-1.5 flex-shrink-0 rounded cursor-pointer transition-opacity duration-200 active:scale-[0.95] text-[var(--color-text)]"
          :class="isLast ? 'opacity-20 cursor-not-allowed' : 'opacity-60 hover:opacity-100'"
          :disabled="isLast"
          @click.stop="!isLast && $emit('move-down')"
          aria-label="Move group down"
          title="Move group down"
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
        <button
          class="p-1.5 opacity-60 hover:opacity-100 flex-shrink-0 rounded cursor-pointer transition-opacity duration-200 active:scale-[0.95] text-[var(--color-text)]"
          @click.stop="handleModify"
          aria-label="Modify group"
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
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
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
        class="flex flex-wrap gap-1"
      >
        <template v-for="(bookmark, index) in bookmarks" :key="bookmark.id">
          <!-- Drop zone before each bookmark -->
          <div
            v-if="isDraggingBookmarkReorder"
            data-bookmark-drop-zone
            class="w-6 min-h-12 self-stretch rounded transition-all duration-150"
            :class="[
              bookmarkDragOverIndex === index ? 'bg-blue-500' : 'bg-blue-200/30 hover:bg-blue-300/50'
            ]"
            @dragover="handleBookmarkDropZoneDragOver($event, index)"
            @dragleave="handleBookmarkDropZoneDragLeave"
            @drop="handleBookmarkReorderDrop($event, index)"
          />
          <BookmarkCard
            :bookmark="bookmark"
            :group-id="group.id"
            :class="{ 'opacity-50': isBookmarkBeingDragged(bookmark.id) }"
            @modify="$emit('bookmark-modify', bookmark)"
            @delete="$emit('bookmark-delete', $event)"
            @drag-start="handleBookmarkDragStartInGroup(bookmark.id)"
            @drag-end="handleBookmarkDragEndInGroup"
          />
        </template>
        <!-- Drop zone after the last bookmark -->
        <div
          v-if="isDraggingBookmarkReorder"
          data-bookmark-drop-zone
          class="w-6 min-h-12 self-stretch rounded transition-all duration-150"
          :class="[
            bookmarkDragOverIndex === bookmarks.length ? 'bg-blue-500' : 'bg-blue-200/30 hover:bg-blue-300/50'
          ]"
          @dragover="handleBookmarkDropZoneDragOver($event, bookmarks.length)"
          @dragleave="handleBookmarkDropZoneDragLeave"
          @drop="handleBookmarkReorderDrop($event, bookmarks.length)"
        />
      </div>
    </div>
  </div>
</template>

