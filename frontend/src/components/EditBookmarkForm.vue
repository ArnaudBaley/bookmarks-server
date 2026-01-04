<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { UpdateBookmarkDto, Bookmark } from '@/types/bookmark'
import { useGroupStore } from '@/stores/group'

interface Props {
  bookmark: Bookmark
}

interface Emits {
  (e: 'submit', id: string, data: UpdateBookmarkDto): void
  (e: 'delete', id: string): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const groupStore = useGroupStore()

const name = ref('')
const url = ref('')
const selectedGroupIds = ref<string[]>([])
const error = ref<string | null>(null)

onMounted(() => {
  name.value = props.bookmark.name
  url.value = props.bookmark.url
  selectedGroupIds.value = props.bookmark.groupIds ? [...props.bookmark.groupIds] : []
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

  emit('submit', props.bookmark.id, {
    name: name.value.trim(),
    url: normalizedUrl,
    groupIds: selectedGroupIds.value,
  })
}

function handleDelete() {
  emit('delete', props.bookmark.id)
}

function handleCancel() {
  name.value = props.bookmark.name
  url.value = props.bookmark.url
  selectedGroupIds.value = props.bookmark.groupIds ? [...props.bookmark.groupIds] : []
  error.value = null
  emit('cancel')
}

function toggleGroup(groupId: string) {
  const index = selectedGroupIds.value.indexOf(groupId)
  if (index === -1) {
    selectedGroupIds.value.push(groupId)
  } else {
    selectedGroupIds.value.splice(index, 1)
  }
}

const availableGroups = computed(() => groupStore.groups)
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
    @click.self="handleCancel"
  >
    <div
      class="bg-[var(--color-background)] p-8 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.3)] w-[90%] max-w-[500px]"
    >
      <div class="flex justify-between items-center mb-6">
        <h2 class="m-0 text-[var(--color-text)]">Edit Bookmark</h2>
        <button
          type="button"
          class="p-2 text-[#dc3545] hover:bg-[#dc3545]/10 rounded transition-colors duration-200 cursor-pointer"
          @click="handleDelete"
          aria-label="Delete bookmark"
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
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </div>
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
        <div class="mb-6">
          <label class="block mb-2 text-[var(--color-text)] font-medium">
            Groups
          </label>
          <div
            v-if="availableGroups.length === 0"
            class="text-sm text-[var(--color-text)] opacity-60 py-2"
          >
            No groups available. Create a group first.
          </div>
          <div
            v-else
            class="flex flex-col gap-2 max-h-48 overflow-y-auto p-2 border border-[var(--color-border)] rounded bg-[var(--color-background-soft)]"
          >
            <label
              v-for="group in availableGroups"
              :key="group.id"
              class="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-[var(--color-background-mute)] transition-colors duration-200"
            >
              <input
                type="checkbox"
                :checked="selectedGroupIds.includes(group.id)"
                @change="toggleGroup(group.id)"
                class="w-4 h-4 cursor-pointer"
              />
              <div
                class="w-4 h-4 rounded-full flex-shrink-0"
                :style="{ backgroundColor: group.color }"
              />
              <span class="text-[var(--color-text)]">{{ group.name }}</span>
            </label>
          </div>
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
            Update Bookmark
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

