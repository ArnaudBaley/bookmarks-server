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
  <main class="home-view">
    <div class="header">
      <h1>My Bookmarks</h1>
      <div class="header-actions">
        <ThemeToggle />
        <button class="add-button" @click="showAddForm = true" aria-label="Add new bookmark">
          <span class="add-icon">+</span>
        </button>
      </div>
    </div>

    <div v-if="bookmarkStore.loading && bookmarkStore.bookmarks.length === 0" class="loading">
      Loading bookmarks...
    </div>

    <div v-else-if="bookmarkStore.error && bookmarkStore.bookmarks.length === 0" class="error">
      <p>Error: {{ bookmarkStore.error }}</p>
      <button @click="bookmarkStore.fetchBookmarks()">Retry</button>
    </div>

    <div v-else-if="bookmarkStore.bookmarks.length === 0" class="empty-state">
      <p>No bookmarks yet. Click the + button to add your first bookmark!</p>
    </div>

    <div v-else class="bookmarks-grid">
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

<style scoped>
.home-view {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.header h1 {
  margin: 0;
  color: var(--color-text);
}

.add-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background-color: hsla(160, 100%, 37%, 1);
  color: white;
  font-size: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, background-color 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.add-button:hover {
  transform: scale(1.1);
  background-color: hsla(160, 100%, 37%, 0.8);
}

.add-button:active {
  transform: scale(0.95);
}

.add-icon {
  line-height: 1;
  font-weight: 300;
}

.loading,
.error,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text);
}

.error button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: hsla(160, 100%, 37%, 1);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error button:hover {
  background-color: hsla(160, 100%, 37%, 0.8);
}

.bookmarks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .bookmarks-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .home-view {
    padding: 1rem;
  }
}
</style>
