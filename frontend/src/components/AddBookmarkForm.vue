<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { CreateBookmarkDto } from '@/types/bookmark'

interface Emits {
  (e: 'submit', data: CreateBookmarkDto): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

const name = ref('')
const url = ref('')
const error = ref<string | null>(null)

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleCancel()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscapeKey)
})

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
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
    @click.self="handleCancel"
  >
    <div
      class="bg-[var(--color-background)] p-8 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.3)] w-[90%] max-w-[500px]"
    >
      <h2 class="m-0 mb-6 text-[var(--color-text)]">Add New Bookmark</h2>
      <form @submit.prevent="handleSubmit">
        <div class="mb-6">
          <label for="bookmark-name" class="block mb-2 text-[var(--color-text)] font-medium">
            Name
          </label>
          <input
            id="bookmark-name"
            v-model="name"
            type="text"
            placeholder="Enter bookmark name"
            required
            autofocus
            class="w-full px-3 py-3 border border-[var(--color-border)] rounded text-base bg-[var(--color-background-soft)] text-[var(--color-text)] box-border focus:outline focus:outline-2 focus:outline-[var(--color-text)] focus:outline-offset-2"
          />
        </div>
        <div class="mb-6">
          <label for="bookmark-url" class="block mb-2 text-[var(--color-text)] font-medium">
            URL
          </label>
          <input
            id="bookmark-url"
            v-model="url"
            type="text"
            placeholder="https://example.com"
            required
            class="w-full px-3 py-3 border border-[var(--color-border)] rounded text-base bg-[var(--color-background-soft)] text-[var(--color-text)] box-border focus:outline focus:outline-2 focus:outline-[var(--color-text)] focus:outline-offset-2"
          />
        </div>
        <div v-if="error" class="text-[#dc3545] mb-4 text-sm">{{ error }}</div>
        <div class="flex gap-4 justify-end">
          <button
            type="button"
            class="px-6 py-3 border-none rounded text-base cursor-pointer transition-colors duration-200 bg-[var(--color-background-soft)] text-[var(--color-text)] hover:bg-[var(--color-border)]"
            @click="handleCancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-6 py-3 border-none rounded text-base cursor-pointer transition-colors duration-200 bg-[hsla(160,100%,37%,1)] text-white hover:bg-[hsla(160,100%,37%,0.8)]"
          >
            Add Bookmark
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

