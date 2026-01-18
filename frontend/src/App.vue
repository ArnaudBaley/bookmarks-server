<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import { useBookmarkStore } from '@/stores/bookmark/bookmark'
import { useTabStore } from '@/stores/tab/tab'

const bookmarkStore = useBookmarkStore()
const tabStore = useTabStore()
const isDraggingOver = ref(false)

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
  // Check if the drag is over a specific drop zone (like Ungrouped or GroupCard)
  // If so, don't handle it here
  const target = event.target as HTMLElement
  if (target) {
    const specificDropZone = target.closest('[data-drop-zone]')
    if (specificDropZone) {
      // This is a specific drop zone, don't handle it here
      return
    }
  }
  
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
  // Check if the drop target is a specific drop zone (like Ungrouped or GroupCard)
  // If so, let that zone handle it instead
  const target = event.target as HTMLElement
  if (target) {
    // Check if the target or any parent has a specific drop handler
    // (Ungrouped section or GroupCard components)
    // Use closest to find any parent with data-drop-zone attribute
    const specificDropZone = target.closest('[data-drop-zone]')
    if (specificDropZone) {
      // This is a specific drop zone, don't handle it here
      // The specific zone will handle it
      return
    }
  }

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

  // Create bookmark without any groups (ungrouped)
  try {
    if (!tabStore.activeTabId) {
      // No active tab - can't create bookmark
      console.warn('No active tab selected, cannot create bookmark')
      return
    }
    await bookmarkStore.addBookmark({
      name,
      url: normalizedUrl,
      tabId: tabStore.activeTabId,
      groupIds: [], // Explicitly set to empty array to ensure it's ungrouped
    })
  } catch (error) {
    console.error('Failed to add bookmark:', error)
  }
}
</script>

<template>
  <div
    class="min-h-screen transition-all duration-200"
    :class="{ 'ring-4 ring-[hsla(160,100%,37%,0.5)] ring-offset-2': isDraggingOver }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <RouterView />
  </div>
</template>

<style scoped>
/* App-level styles are minimal, most styling is in components */
</style>
