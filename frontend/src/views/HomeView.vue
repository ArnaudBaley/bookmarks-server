<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useBookmarkStore } from '@/stores/bookmark'
import BookmarkCard from '@/components/BookmarkCard.vue'
import AddBookmarkForm from '@/components/AddBookmarkForm.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import type { CreateBookmarkDto } from '@/types/bookmark'

const bookmarkStore = useBookmarkStore()
const showAddForm = ref(false)

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

async function handleDeleteBookmark(id: string) {
  try {
    await bookmarkStore.removeBookmark(id)
  } catch (error) {
    console.error('Failed to delete bookmark:', error)
  }
}
</script>

<template>
  <main class="w-full max-w-[1200px] mx-auto p-8 md:p-4">
    <div class="flex justify-between items-center mb-8">
      <h1 class="m-0 text-[var(--color-text)]">My Bookmarks</h1>
      <div class="flex gap-4 items-center">
        <ThemeToggle />
        <button
          class="w-12 h-12 rounded-full border-none bg-[hsla(160,100%,37%,1)] text-white text-3xl cursor-pointer flex items-center justify-center transition-[transform,background-color] duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:scale-110 hover:bg-[hsla(160,100%,37%,0.8)] active:scale-95"
          @click="showAddForm = true"
          aria-label="Add new bookmark"
        >
          <span class="leading-none font-light">+</span>
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
    </div>

    <div
      v-else
      class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6 md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:gap-4"
    >
      <BookmarkCard
        v-for="bookmark in bookmarkStore.bookmarks"
        :key="bookmark.id"
        :bookmark="bookmark"
        @delete="handleDeleteBookmark"
      />
    </div>

    <AddBookmarkForm v-if="showAddForm" @submit="handleAddBookmark" @cancel="showAddForm = false" />
  </main>
</template>
