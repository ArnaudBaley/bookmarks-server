<script setup lang="ts">
import type { Bookmark } from '@/types/bookmark'

interface Props {
  bookmark: Bookmark
}

interface Emits {
  (e: 'delete', id: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleClick() {
  window.open(props.bookmark.url, '_blank', 'noopener,noreferrer')
}

function handleDelete() {
  if (confirm(`Are you sure you want to delete "${props.bookmark.name}"?`)) {
    emit('delete', props.bookmark.id)
  }
}

function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
  } catch {
    return '/favicon.ico'
  }
}
</script>

<template>
  <div class="bookmark-card">
    <div class="bookmark-icon" @click="handleClick" role="button" tabindex="0" @keyup.enter="handleClick">
      <img :src="getFaviconUrl(bookmark.url)" :alt="`${bookmark.name} icon`" />
    </div>
    <div class="bookmark-content">
      <h3 class="bookmark-name">{{ bookmark.name }}</h3>
      <button class="delete-button" @click="handleDelete" aria-label="Delete bookmark">
        Delete
      </button>
    </div>
  </div>
</template>

<style scoped>
.bookmark-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-background-soft);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: default;
}

.bookmark-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.bookmark-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  transition: transform 0.2s;
  margin-bottom: 1rem;
}

.bookmark-icon:hover {
  transform: scale(1.1);
}

.bookmark-icon:focus {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}

.bookmark-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.bookmark-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.bookmark-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
  word-break: break-word;
  color: var(--color-text);
}

.delete-button {
  padding: 0.5rem 1rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.delete-button:hover {
  background-color: #c82333;
}

.delete-button:active {
  transform: scale(0.98);
}
</style>

