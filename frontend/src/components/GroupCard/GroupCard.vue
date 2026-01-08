<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Group } from '@/types/group'
import type { Bookmark } from '@/types/bookmark'
import { useBookmarkStore } from '@/stores/bookmark/bookmark'
import { useTabStore } from '@/stores/tab/tab'
import BookmarkCard from '@/components/BookmarkCard/BookmarkCard.vue'

interface Props {
  group: Group
  bookmarks: Bookmark[]
}

interface Emits {
  (e: 'modify', group: Group): void
  (e: 'bookmark-drop', groupId: string, bookmarkId: string): void
  (e: 'bookmark-modify', bookmark: Bookmark): void
  (e: 'bookmark-delete', id: string): void
  (e: 'bookmark-add', groupId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const bookmarkStore = useBookmarkStore()
const isExpanded = ref(true)
const isDragOver = ref(false)

const bookmarksCount = computed(() => props.bookmarks.length)

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

  // Get all possible data types
  const textPlain = event.dataTransfer.getData('text/plain')
  const uriList = event.dataTransfer.getData('text/uri-list')
  const urlData = event.dataTransfer.getData('URL')
  const htmlData = event.dataTransfer.getData('text/html')

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
        class="grid grid-cols-[repeat(auto-fill,minmax(288px,1fr))] gap-3"
      >
        <BookmarkCard
          v-for="bookmark in bookmarks"
          :key="bookmark.id"
          :bookmark="bookmark"
          @modify="$emit('bookmark-modify', bookmark)"
          @delete="$emit('bookmark-delete', $event)"
        />
      </div>
    </div>
  </div>
</template>

