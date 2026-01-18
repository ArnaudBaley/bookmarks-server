<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBookmarkStore } from '@/stores/bookmark/bookmark'
import { useGroupStore } from '@/stores/group/group'
import { useTabStore } from '@/stores/tab/tab'
import { groupApi } from '@/services/groupApi/groupApi'
import { bookmarkApi } from '@/services/bookmarkApi/bookmarkApi'
import BookmarkCard from '@/components/BookmarkCard/BookmarkCard.vue'
import GroupCard from '@/components/GroupCard/GroupCard.vue'
import AddBookmarkForm from '@/components/AddBookmarkForm/AddBookmarkForm.vue'
import EditBookmarkForm from '@/components/EditBookmarkForm/EditBookmarkForm.vue'
import AddGroupForm from '@/components/AddGroupForm/AddGroupForm.vue'
import EditGroupForm from '@/components/EditGroupForm/EditGroupForm.vue'
import TabSwitcher from '@/components/TabSwitcher/TabSwitcher.vue'
import AddTabForm from '@/components/AddTabForm/AddTabForm.vue'
import EditTabForm from '@/components/EditTabForm/EditTabForm.vue'
import SettingsModal from '@/components/SettingsModal/SettingsModal.vue'
import type { CreateBookmarkDto, UpdateBookmarkDto, Bookmark } from '@/types/bookmark'
import type { CreateGroupDto, UpdateGroupDto, Group } from '@/types/group'
import type { CreateTabDto, UpdateTabDto, Tab } from '@/types/tab'

const router = useRouter()
const route = useRoute()
const bookmarkStore = useBookmarkStore()
const groupStore = useGroupStore()
const tabStore = useTabStore()

const showAddForm = ref(false)
const showAddGroupForm = ref(false)
const showAddTabForm = ref(false)
const showSettingsModal = ref(false)
const editingBookmark = ref<Bookmark | null>(null)
const editingGroup = ref<Group | null>(null)
const editingTab = ref<Tab | null>(null)
const isDragOverUngrouped = ref(false)
const isUngroupedExpanded = ref(true)
const selectedGroupIdForBookmark = ref<string | null>(null)
const groupCardRefs = ref<Map<string, InstanceType<typeof GroupCard>>>(new Map())

const ungroupedBookmarks = computed(() => groupStore.getUngroupedBookmarks())
const filteredGroups = computed(() => groupStore.filteredGroups)

// Helper function to decode tab name from URL
function decodeTabName(encodedName: string): string {
  try {
    return decodeURIComponent(encodedName)
  } catch {
    return encodedName
  }
}

// Helper function to encode tab name for URL
function encodeTabName(name: string): string {
  return encodeURIComponent(name)
}

// Sync route with active tab when route changes
watch(() => route.params.tabName, (tabName) => {
  if (tabName && typeof tabName === 'string') {
    const decodedName = decodeTabName(tabName)
    const tab = tabStore.getTabByName(decodedName)
    if (tab) {
      tabStore.setActiveTab(tab.id)
    } else if (tabStore.tabs.length > 0 && tabStore.tabs[0]) {
      // Tab doesn't exist, redirect to first tab
      router.replace({ name: 'tab', params: { tabName: encodeTabName(tabStore.tabs[0].name) } })
    } else if (tabStore.tabs.length === 0) {
      // No tabs exist, navigate to home
      router.replace({ name: 'home' })
    }
  } else if (route.name === 'home') {
    // On home route, redirect to first tab if tabs exist
    if (tabStore.tabs.length > 0 && tabStore.tabs[0]) {
      router.replace({ name: 'tab', params: { tabName: encodeTabName(tabStore.tabs[0].name) } })
    }
  }
})

// Sync route when tabs are loaded
watch(() => tabStore.tabs.length, () => {
  if (tabStore.tabs.length > 0) {
    const currentTabName = route.params.tabName
    if (currentTabName && typeof currentTabName === 'string') {
      const decodedName = decodeTabName(currentTabName)
      const tab = tabStore.getTabByName(decodedName)
      if (tab) {
        tabStore.setActiveTab(tab.id)
      } else if (tabStore.tabs[0]) {
        // Current tab doesn't exist, redirect to first tab
        router.replace({ name: 'tab', params: { tabName: encodeTabName(tabStore.tabs[0].name) } })
      }
    } else if (route.name === 'home' && tabStore.tabs[0]) {
      // On home route, redirect to first tab
      router.replace({ name: 'tab', params: { tabName: encodeTabName(tabStore.tabs[0].name) } })
    }
  } else {
    // No tabs exist, navigate to home route
    if (route.name === 'tab') {
      router.replace({ name: 'home' })
    }
  }
})

// Watch for active tab changes and refetch data
watch(() => tabStore.activeTabId, () => {
  if (tabStore.activeTabId) {
    bookmarkStore.fetchBookmarks()
    groupStore.fetchGroups()
  }
})


onMounted(async () => {
  await tabStore.fetchTabs()
  
  // Handle initial route
  if (route.params.tabName && typeof route.params.tabName === 'string') {
    const decodedName = decodeTabName(route.params.tabName)
    const tab = tabStore.getTabByName(decodedName)
    if (tab) {
      tabStore.setActiveTab(tab.id)
      bookmarkStore.fetchBookmarks()
      groupStore.fetchGroups()
    } else if (tabStore.tabs.length > 0 && tabStore.tabs[0]) {
      // Tab doesn't exist, redirect to first tab
      router.replace({ name: 'tab', params: { tabName: encodeTabName(tabStore.tabs[0].name) } })
    }
  } else if (route.name === 'home') {
    // On home route, redirect to first tab if tabs exist
    if (tabStore.tabs.length > 0 && tabStore.tabs[0]) {
      router.replace({ name: 'tab', params: { tabName: encodeTabName(tabStore.tabs[0].name) } })
    }
  } else if (tabStore.activeTabId) {
    bookmarkStore.fetchBookmarks()
    groupStore.fetchGroups()
  }
  
})

async function handleAddBookmark(data: CreateBookmarkDto) {
  try {
    if (!tabStore.activeTabId) {
      // No active tab - close bookmark form and open add tab form to guide user
      showAddForm.value = false
      selectedGroupIdForBookmark.value = null
      showAddTabForm.value = true
      return
    }
    await bookmarkStore.addBookmark({
      ...data,
      tabId: tabStore.activeTabId,
      groupIds: selectedGroupIdForBookmark.value ? [selectedGroupIdForBookmark.value] : [],
    })
    showAddForm.value = false
    selectedGroupIdForBookmark.value = null
  } catch (error) {
    console.error('Failed to add bookmark:', error)
    // Close the form even on error to prevent it from staying open
    showAddForm.value = false
    selectedGroupIdForBookmark.value = null
  }
}

function handleAddBookmarkFromGroup(groupId: string) {
  selectedGroupIdForBookmark.value = groupId
  showAddForm.value = true
}

function handleAddBookmarkFromUngrouped() {
  selectedGroupIdForBookmark.value = null
  showAddForm.value = true
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

async function handleDuplicateBookmark(bookmark: Bookmark) {
  try {
    const createData: CreateBookmarkDto = {
      name: bookmark.name,
      url: bookmark.url,
      tabIds: bookmark.tabIds || (bookmark.tabId ? [bookmark.tabId] : []),
      groupIds: bookmark.groupIds || [],
    }
    await bookmarkStore.addBookmark(createData)
    // Keep the edit form open so user can continue editing if needed
  } catch (error) {
    console.error('Failed to duplicate bookmark:', error)
  }
}

async function handleDeleteBookmark(id: string) {
  try {
    await bookmarkStore.removeBookmark(id)
  } catch (error) {
    console.error('Failed to delete bookmark:', error)
  }
}

async function handleAddGroup(data: CreateGroupDto) {
  try {
    if (!tabStore.activeTabId) {
      // No active tab - close group form and open add tab form to guide user
      showAddGroupForm.value = false
      showAddTabForm.value = true
      return
    }
    await groupStore.addGroup({
      ...data,
      tabId: tabStore.activeTabId,
    })
    showAddGroupForm.value = false
  } catch (error) {
    console.error('Failed to add group:', error)
    // Close the form even on error to prevent it from staying open
    showAddGroupForm.value = false
  }
}

async function handleModifyGroup(group: Group) {
  editingGroup.value = group
}

async function handleUpdateGroup(id: string, data: UpdateGroupDto) {
  try {
    await groupStore.updateGroup(id, data)
    editingGroup.value = null
  } catch (error) {
    console.error('Failed to update group:', error)
  }
}

async function handleDeleteGroup(id: string) {
  try {
    await groupStore.removeGroup(id)
    editingGroup.value = null
  } catch (error) {
    console.error('Failed to delete group:', error)
  }
}

async function handleDuplicateGroup(group: Group) {
  try {
    if (!tabStore.activeTabId) {
      console.error('No active tab selected')
      return
    }
    // Create the new group
    const newGroup = await groupStore.addGroup({
      name: group.name,
      color: group.color,
      tabId: tabStore.activeTabId,
    })
    
    // Get all bookmarks that belong to the original group (not just filtered ones)
    // We need to fetch all bookmarks, not just the ones in the current tab
    const allBookmarks = await bookmarkApi.getAllBookmarks()
    const bookmarksInGroup = allBookmarks.filter(
      (bookmark) => bookmark.groupIds?.includes(group.id)
    )
    
    // Duplicate each bookmark and assign it only to the new group
    for (const bookmark of bookmarksInGroup) {
      await bookmarkStore.addBookmark({
        name: bookmark.name,
        url: bookmark.url,
        tabIds: bookmark.tabIds || (bookmark.tabId ? [bookmark.tabId] : []),
        groupIds: [newGroup.id],
      })
    }
    // Keep the edit form open so user can continue editing if needed
  } catch (error) {
    console.error('Failed to duplicate group:', error)
  }
}

async function handleAddTab(data: CreateTabDto) {
  try {
    const newTab = await tabStore.addTab(data)
    showAddTabForm.value = false
    // Navigate to the new tab
    if (newTab) {
      router.push({ name: 'tab', params: { tabName: encodeTabName(newTab.name) } })
    }
  } catch (error: unknown) {
    console.error('Failed to add tab:', error)
    // Error is already set in the store, AddTabForm will display it
    // Don't close the form on error so user can see the error message
    // The form will stay open to show the error
  }
}

async function handleModifyTab(tab: Tab) {
  editingTab.value = tab
  // Clear any previous errors when opening the form
  tabStore.error = null
}

async function handleUpdateTab(id: string, data: UpdateTabDto) {
  try {
    const updatedTab = await tabStore.updateTab(id, data)
    // Only close the form if update was successful
    editingTab.value = null
    
    // If the name changed and this is the active tab, navigate to the new URL
    if (data.name && updatedTab && tabStore.activeTabId === id) {
      router.replace({ name: 'tab', params: { tabName: encodeTabName(updatedTab.name) } })
    }
  } catch (error: unknown) {
    console.error('Failed to update tab:', error)
    // Error is already set in the store, EditTabForm will display it via props.error
    // Don't close the form on error so user can see the error message and fix it
  }
}

async function handleDeleteTab(id: string) {
  try {
    const wasActive = tabStore.activeTabId === id
    await tabStore.removeTab(id)
    editingTab.value = null
    
    // Navigate to the new active tab or home if no tabs left
    if (wasActive) {
      if (tabStore.tabs.length > 0 && tabStore.tabs[0]) {
        router.replace({ name: 'tab', params: { tabName: encodeTabName(tabStore.tabs[0].name) } })
      } else {
        router.replace({ name: 'home' })
      }
    }
  } catch (error) {
    console.error('Failed to delete tab:', error)
  }
}

function generateUniqueTabName(baseName: string): string {
  // Check if base name already exists
  if (!tabStore.getTabByName(baseName)) {
    return baseName
  }
  
  // Try with " copy" suffix
  let candidateName = `${baseName} copy`
  if (!tabStore.getTabByName(candidateName)) {
    return candidateName
  }
  
  // Try with numbered suffix
  let counter = 2
  do {
    candidateName = `${baseName} copy ${counter}`
    counter++
  } while (tabStore.getTabByName(candidateName))
  
  return candidateName
}

async function handleDuplicateTab(tab: Tab) {
  try {
    // Generate a unique name for the duplicated tab
    const uniqueName = generateUniqueTabName(tab.name)
    
    // Create the new tab
    const newTab = await tabStore.addTab({
      name: uniqueName,
      color: tab.color || undefined,
    })
    
    if (!newTab) {
      return
    }
    
    // Fetch all groups in the original tab
    const originalGroups = await groupApi.getAllGroups(tab.id)
    
    // Create a mapping of old group IDs to new group IDs
    const groupIdMap = new Map<string, string>()
    
    // Duplicate each group and create the mapping
    for (const group of originalGroups) {
      const newGroup = await groupStore.addGroup({
        name: group.name,
        color: group.color,
        tabId: newTab.id,
      })
      groupIdMap.set(group.id, newGroup.id)
    }
    
    // Fetch all bookmarks in the original tab
    const originalBookmarks = await bookmarkApi.getAllBookmarks(tab.id)
    
    // Duplicate each bookmark
    for (const bookmark of originalBookmarks) {
      // Map old group IDs to new group IDs
      const newGroupIds = bookmark.groupIds
        ? bookmark.groupIds
            .map(oldGroupId => groupIdMap.get(oldGroupId))
            .filter((id): id is string => id !== undefined)
        : []
      
      await bookmarkStore.addBookmark({
        name: bookmark.name,
        url: bookmark.url,
        tabIds: [newTab.id],
        groupIds: newGroupIds,
      })
    }
    
    // Navigate to the new tab
    router.push({ name: 'tab', params: { tabName: encodeTabName(newTab.name) } })
    // Close the edit form after duplicating
    editingTab.value = null
  } catch (error) {
    console.error('Failed to duplicate tab:', error)
  }
}

async function handleBookmarkDrop(groupId: string, bookmarkId: string) {
  try {
    const bookmark = bookmarkStore.bookmarks.find((b) => b.id === bookmarkId)
    if (!bookmark) return

    const currentGroupIds = bookmark.groupIds || []
    
    if (currentGroupIds.includes(groupId)) {
      // Already in group, remove it (toggle behavior)
      await groupStore.removeBookmarkFromGroup(groupId, bookmarkId)
    } else {
      // Move to new group: remove from all current groups first, then add to target group
      const groupIdsToRemove = [...currentGroupIds]
      for (const oldGroupId of groupIdsToRemove) {
        await groupStore.removeBookmarkFromGroup(oldGroupId, bookmarkId)
      }
      // Add to the target group
      await groupStore.addBookmarkToGroup(groupId, bookmarkId)
    }
  } catch (error) {
    console.error('Failed to handle bookmark drop:', error)
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

function handleUngroupedDragOver(event: DragEvent) {
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
  isDragOverUngrouped.value = true
}

function handleUngroupedDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  // Check if we're actually leaving the main element (not just moving to a child)
  const target = event.target as HTMLElement
  const relatedTarget = event.relatedTarget as HTMLElement | null
  
  if (!relatedTarget || !target.contains(relatedTarget)) {
    isDragOverUngrouped.value = false
  }
}

async function handleUngroupedDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragOverUngrouped.value = false

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
      // It's a bookmark drag - remove from all groups
      try {
        const groupIds = bookmark.groupIds || []
        if (groupIds.length > 0) {
          for (const groupId of groupIds) {
            await groupStore.removeBookmarkFromGroup(groupId, textPlain)
          }
        }
      } catch (error) {
        console.error('Failed to remove bookmark from groups:', error)
      }
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

  // It's a valid URL - create a new bookmark without any groups (ungrouped)
  const name = extractNameFromUrl(normalizedUrl)

  try {
    if (!tabStore.activeTabId) {
      // No active tab - open add tab form to guide user
      showAddTabForm.value = true
      return
    }
    await bookmarkStore.addBookmark({
      name,
      url: normalizedUrl,
      tabId: tabStore.activeTabId,
      groupIds: [],
    })
  } catch (error) {
    console.error('Failed to add bookmark:', error)
  }
}

function foldAllGroups() {
  // Fold all regular groups
  groupCardRefs.value.forEach((ref) => {
    if (ref && typeof ref.setExpanded === 'function') {
      ref.setExpanded(false)
    }
  })
  // Fold ungrouped section
  isUngroupedExpanded.value = false
}

function unfoldAllGroups() {
  // Unfold all regular groups
  groupCardRefs.value.forEach((ref) => {
    if (ref && typeof ref.setExpanded === 'function') {
      ref.setExpanded(true)
    }
  })
  // Unfold ungrouped section
  isUngroupedExpanded.value = true
}

function setGroupCardRef(group: Group, el: InstanceType<typeof GroupCard> | null) {
  if (el) {
    groupCardRefs.value.set(group.id, el)
  } else {
    groupCardRefs.value.delete(group.id)
  }
}
</script>

<template>
  <main 
    class="w-full max-w-[1200px] mx-auto p-8 md:p-4"
  >
    <div class="flex justify-between items-center mb-8">
      <h1 class="m-0 text-[var(--color-text)]">My Bookmarks</h1>
      <div class="flex gap-4 items-center">
        <button
          class="w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-background-soft)] text-[var(--color-text)] cursor-pointer flex items-center justify-center transition-[transform,background-color,border-color] duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:scale-110 hover:bg-[var(--color-background-mute)] hover:border-[var(--color-border-hover)] active:scale-95"
          @click="showSettingsModal = true"
          aria-label="Settings"
          title="Settings"
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
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Tab Switcher -->
    <TabSwitcher @tab-edit="handleModifyTab" @tab-add="showAddTabForm = true" />

    <!-- Fold/Unfold All Groups Controls -->
    <div v-if="filteredGroups.length > 0 || ungroupedBookmarks.length > 0" class="mb-4 flex justify-center gap-2">
      <button
        class="w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-background-soft)] text-[var(--color-text)] cursor-pointer flex items-center justify-center transition-[transform,background-color,border-color] duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:scale-110 hover:bg-[var(--color-background-mute)] hover:border-[var(--color-border-hover)] active:scale-95"
        @click="foldAllGroups"
        aria-label="Fold all groups"
        title="Fold all groups"
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
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <button
        class="w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-background-soft)] text-[var(--color-text)] cursor-pointer flex items-center justify-center transition-[transform,background-color,border-color] duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:scale-110 hover:bg-[var(--color-background-mute)] hover:border-[var(--color-border-hover)] active:scale-95"
        @click="unfoldAllGroups"
        aria-label="Unfold all groups"
        title="Unfold all groups"
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
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </div>

    <div
      v-if="(bookmarkStore.loading || groupStore.loading || tabStore.loading) && bookmarkStore.bookmarks.length === 0 && groupStore.groups.length === 0"
      class="text-center py-12 text-[var(--color-text)]"
    >
      Loading bookmarks...
    </div>

    <div
      v-else-if="(bookmarkStore.error || groupStore.error) && bookmarkStore.bookmarks.length === 0 && groupStore.groups.length === 0"
      class="text-center py-12 text-[var(--color-text)]"
    >
      <p>Error: {{ bookmarkStore.error || groupStore.error }}</p>
      <button
        class="mt-4 px-4 py-2 bg-[hsla(160,100%,37%,1)] text-white border-none rounded cursor-pointer hover:bg-[hsla(160,100%,37%,0.8)]"
        @click="bookmarkStore.fetchBookmarks(); groupStore.fetchGroups()"
      >
        Retry
      </button>
    </div>

    <div v-else>
      <!-- Ungrouped Bookmarks - Always displayed -->
      <div
        class="mb-6 transition-all duration-200"
        :class="{ 'ring-2 ring-offset-2 ring-blue-500': isDragOverUngrouped }"
        @dragover="handleUngroupedDragOver"
        @dragleave="handleUngroupedDragLeave"
        @drop="handleUngroupedDrop"
      >
        <div
          class="flex items-center justify-between p-4 cursor-pointer transition-colors duration-200"
          @click="isUngroupedExpanded = !isUngroupedExpanded"
        >
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <h2 class="m-0 text-xl font-semibold text-[var(--color-text)]">Ungrouped</h2>
            <span class="text-sm text-[var(--color-text)] opacity-60">
              ({{ ungroupedBookmarks.length }})
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-background-soft)] text-[var(--color-text)] cursor-pointer flex items-center justify-center transition-[transform,background-color,border-color] duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:scale-110 hover:bg-[var(--color-background-mute)] hover:border-[var(--color-border-hover)] active:scale-95"
              @click.stop="handleAddBookmarkFromUngrouped"
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
              class="p-1.5 opacity-60 hover:opacity-100 flex-shrink-0 rounded cursor-pointer transition-transform duration-200 text-[var(--color-text)]"
              :class="{ 'rotate-180': isUngroupedExpanded }"
              @click.stop="isUngroupedExpanded = !isUngroupedExpanded"
              aria-label="Toggle ungrouped section"
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
          v-show="isUngroupedExpanded"
          class="p-4 pt-0"
          @dragover="handleUngroupedDragOver"
          @dragleave="handleUngroupedDragLeave"
          @drop="handleUngroupedDrop"
        >
          <div class="flex flex-wrap gap-4">
            <BookmarkCard
              v-for="bookmark in ungroupedBookmarks"
              :key="bookmark.id"
              :bookmark="bookmark"
              @modify="handleModifyBookmark"
              @delete="handleDeleteBookmark"
            />
          </div>
        </div>
      </div>

      <!-- Groups -->
      <div v-if="filteredGroups.length > 0">
        <GroupCard
          v-for="group in filteredGroups"
          :key="group.id"
          :ref="(el) => setGroupCardRef(group, el as InstanceType<typeof GroupCard> | null)"
          :group="group"
          :bookmarks="groupStore.getBookmarksByGroup(group.id)"
          @modify="handleModifyGroup"
          @bookmark-drop="handleBookmarkDrop"
          @bookmark-modify="handleModifyBookmark"
          @bookmark-delete="handleDeleteBookmark"
          @bookmark-add="handleAddBookmarkFromGroup"
        />
      </div>

      <!-- Add Group Button -->
      <div class="mb-6 flex justify-center">
        <button
          class="w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-background-soft)] text-[var(--color-text)] cursor-pointer flex items-center justify-center transition-[transform,background-color,border-color] duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:scale-110 hover:bg-[var(--color-background-mute)] hover:border-[var(--color-border-hover)] active:scale-95"
          @click="showAddGroupForm = true"
          aria-label="Add new group"
          title="Add new group"
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

    <AddBookmarkForm v-if="showAddForm" @submit="handleAddBookmark" @cancel="() => { showAddForm = false; selectedGroupIdForBookmark = null }" />
    <EditBookmarkForm
      v-if="editingBookmark"
      :bookmark="editingBookmark"
      @submit="handleUpdateBookmark"
      @delete="handleDeleteFromEditForm"
      @duplicate="handleDuplicateBookmark"
      @cancel="editingBookmark = null"
    />
    <AddGroupForm v-if="showAddGroupForm" @submit="handleAddGroup" @cancel="showAddGroupForm = false" />
    <EditGroupForm
      v-if="editingGroup"
      :group="editingGroup"
      @submit="handleUpdateGroup"
      @delete="handleDeleteGroup"
      @duplicate="handleDuplicateGroup"
      @cancel="editingGroup = null"
    />
    <AddTabForm v-if="showAddTabForm" @submit="handleAddTab" @cancel="showAddTabForm = false" />
    <EditTabForm
      v-if="editingTab"
      :tab="editingTab"
      :error="tabStore.error"
      @submit="handleUpdateTab"
      @delete="handleDeleteTab"
      @duplicate="handleDuplicateTab"
      @cancel="() => { editingTab = null; tabStore.error = null }"
    />
    <SettingsModal v-if="showSettingsModal" @cancel="showSettingsModal = false" />
  </main>
</template>
