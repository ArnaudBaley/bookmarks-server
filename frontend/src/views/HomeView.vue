<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useBookmarkStore } from '@/stores/bookmark'
import { useGroupStore } from '@/stores/group'
import BookmarkCard from '@/components/BookmarkCard.vue'
import GroupCard from '@/components/GroupCard.vue'
import AddBookmarkForm from '@/components/AddBookmarkForm.vue'
import EditBookmarkForm from '@/components/EditBookmarkForm.vue'
import AddGroupForm from '@/components/AddGroupForm.vue'
import EditGroupForm from '@/components/EditGroupForm.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import type { CreateBookmarkDto, UpdateBookmarkDto, Bookmark } from '@/types/bookmark'
import type { CreateGroupDto, UpdateGroupDto, Group } from '@/types/group'

const bookmarkStore = useBookmarkStore()
const groupStore = useGroupStore()

const showAddForm = ref(false)
const showAddGroupForm = ref(false)
const editingBookmark = ref<Bookmark | null>(null)
const editingGroup = ref<Group | null>(null)
const isDragOverUngrouped = ref(false)

const ungroupedBookmarks = computed(() => groupStore.getUngroupedBookmarks())

onMounted(() => {
  bookmarkStore.fetchBookmarks()
  groupStore.fetchGroups()
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

async function handleAddGroup(data: CreateGroupDto) {
  try {
    await groupStore.addGroup(data)
    showAddGroupForm.value = false
  } catch (error) {
    console.error('Failed to add group:', error)
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

async function handleBookmarkDrop(groupId: string, bookmarkId: string) {
  try {
    const bookmark = bookmarkStore.bookmarks.find((b) => b.id === bookmarkId)
    if (!bookmark) return

    const currentGroupIds = bookmark.groupIds || []
    
    if (currentGroupIds.includes(groupId)) {
      // Already in group, remove it
      await groupStore.removeBookmarkFromGroup(groupId, bookmarkId)
    } else {
      // Add to group
      await groupStore.addBookmarkToGroup(groupId, bookmarkId)
    }
  } catch (error) {
    console.error('Failed to handle bookmark drop:', error)
  }
}

function handleUngroupedDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragOverUngrouped.value = true
}

function handleUngroupedDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragOverUngrouped.value = false
}

async function handleUngroupedDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragOverUngrouped.value = false

  const bookmarkId = event.dataTransfer?.getData('text/plain')
  if (!bookmarkId) return

  try {
    const bookmark = bookmarkStore.bookmarks.find((b) => b.id === bookmarkId)
    if (!bookmark || !bookmark.groupIds || bookmark.groupIds.length === 0) return

    // Remove from all groups
    const groupIds = [...bookmark.groupIds]
    for (const groupId of groupIds) {
      await groupStore.removeBookmarkFromGroup(groupId, bookmarkId)
    }
  } catch (error) {
    console.error('Failed to remove bookmark from groups:', error)
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
        <ThemeToggle />
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
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="3" y1="9" x2="21" y2="9" />
          </svg>
        </button>
        <button
          class="w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-background-soft)] text-[var(--color-text)] cursor-pointer flex items-center justify-center transition-[transform,background-color,border-color] duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:scale-110 hover:bg-[var(--color-background-mute)] hover:border-[var(--color-border-hover)] active:scale-95"
          @click="showAddForm = true"
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
      </div>
    </div>

    <div
      v-if="(bookmarkStore.loading || groupStore.loading) && bookmarkStore.bookmarks.length === 0 && groupStore.groups.length === 0"
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

    <div v-else-if="bookmarkStore.bookmarks.length === 0 && groupStore.groups.length === 0" class="text-center py-12 text-[var(--color-text)]">
      <p>No bookmarks yet. Click the + button to add your first bookmark!</p>
      <p class="mt-4 text-sm opacity-70">Or drag and drop a URL from your browser here</p>
    </div>

    <div v-else>
      <!-- Groups -->
      <div v-if="groupStore.groups.length > 0">
        <GroupCard
          v-for="group in groupStore.groups"
          :key="group.id"
          :group="group"
          :bookmarks="groupStore.getBookmarksByGroup(group.id)"
          @modify="handleModifyGroup"
          @bookmark-drop="handleBookmarkDrop"
          @bookmark-modify="handleModifyBookmark"
        />
      </div>

      <!-- Ungrouped Bookmarks -->
      <div
        v-if="ungroupedBookmarks.length > 0"
        class="mb-6"
        :class="{ 'ring-2 ring-offset-2 ring-blue-500': isDragOverUngrouped }"
        @dragover="handleUngroupedDragOver"
        @dragleave="handleUngroupedDragLeave"
        @drop="handleUngroupedDrop"
      >
        <div class="flex items-center gap-3 mb-4">
          <h2 class="m-0 text-xl font-semibold text-[var(--color-text)]">Ungrouped</h2>
          <span class="text-sm text-[var(--color-text)] opacity-60">
            ({{ ungroupedBookmarks.length }})
          </span>
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(288px,1fr))] gap-3">
          <BookmarkCard
            v-for="bookmark in ungroupedBookmarks"
            :key="bookmark.id"
            :bookmark="bookmark"
            @modify="handleModifyBookmark"
          />
        </div>
      </div>

      <!-- Empty state when no groups and no ungrouped bookmarks -->
      <div
        v-if="groupStore.groups.length === 0 && ungroupedBookmarks.length === 0 && bookmarkStore.bookmarks.length > 0"
        class="text-center py-12 text-[var(--color-text)]"
      >
        <p>All bookmarks are organized in groups.</p>
      </div>
    </div>

    <AddBookmarkForm v-if="showAddForm" @submit="handleAddBookmark" @cancel="showAddForm = false" />
    <EditBookmarkForm
      v-if="editingBookmark"
      :bookmark="editingBookmark"
      @submit="handleUpdateBookmark"
      @delete="handleDeleteFromEditForm"
      @cancel="editingBookmark = null"
    />
    <AddGroupForm v-if="showAddGroupForm" @submit="handleAddGroup" @cancel="showAddGroupForm = false" />
    <EditGroupForm
      v-if="editingGroup"
      :group="editingGroup"
      @submit="handleUpdateGroup"
      @delete="handleDeleteGroup"
      @cancel="editingGroup = null"
    />
  </main>
</template>
