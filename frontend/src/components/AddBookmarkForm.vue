<script setup lang="ts">
import { ref } from 'vue'
import type { CreateBookmarkDto } from '@/types/bookmark'

interface Emits {
  (e: 'submit', data: CreateBookmarkDto): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

const name = ref('')
const url = ref('')
const error = ref<string | null>(null)

function validateUrl(urlString: string): boolean {
  try {
    const urlObj = new URL(urlString)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
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

function handleSubmit() {
  error.value = null

  if (!name.value.trim()) {
    error.value = 'Name is required'
    return
  }

  if (!url.value.trim()) {
    error.value = 'URL is required'
    return
  }

  const normalizedUrl = normalizeUrl(url.value.trim())

  if (!validateUrl(normalizedUrl)) {
    error.value = 'Please enter a valid URL'
    return
  }

  emit('submit', {
    name: name.value.trim(),
    url: normalizedUrl,
  })

  // Reset form
  name.value = ''
  url.value = ''
  error.value = null
}

function handleCancel() {
  name.value = ''
  url.value = ''
  error.value = null
  emit('cancel')
}
</script>

<template>
  <div class="form-overlay" @click.self="handleCancel">
    <div class="form-container">
      <h2>Add New Bookmark</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="bookmark-name">Name</label>
          <input
            id="bookmark-name"
            v-model="name"
            type="text"
            placeholder="Enter bookmark name"
            required
            autofocus
          />
        </div>
        <div class="form-group">
          <label for="bookmark-url">URL</label>
          <input
            id="bookmark-url"
            v-model="url"
            type="text"
            placeholder="https://example.com"
            required
          />
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div class="form-actions">
          <button type="button" class="cancel-button" @click="handleCancel">Cancel</button>
          <button type="submit" class="submit-button">Add Bookmark</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.form-container {
  background-color: var(--color-background);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
}

.form-container h2 {
  margin: 0 0 1.5rem 0;
  color: var(--color-text);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text);
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
  background-color: var(--color-background-soft);
  color: var(--color-text);
  box-sizing: border-box;
}

.form-group input:focus {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}

.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-button,
.submit-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-button {
  background-color: var(--color-background-soft);
  color: var(--color-text);
}

.cancel-button:hover {
  background-color: var(--color-border);
}

.submit-button {
  background-color: hsla(160, 100%, 37%, 1);
  color: white;
}

.submit-button:hover {
  background-color: hsla(160, 100%, 37%, 0.8);
}
</style>

