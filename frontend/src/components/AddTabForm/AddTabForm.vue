<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useTabStore } from '@/stores/tab/tab'
import type { CreateTabDto } from '@/types/tab'

interface Emits {
  (e: 'submit', data: CreateTabDto): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()
const tabStore = useTabStore()

const name = ref('')
const color = ref('#3b82f6')
const error = ref<string | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)

// Watch for errors from the store
watch(() => tabStore.error, (newError) => {
  if (newError) {
    error.value = newError
  }
})

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleCancel()
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleEscapeKey)
  await nextTick()
  nameInputRef.value?.focus()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscapeKey)
})

// Predefined color palette
const colorPalette = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

function handleSubmit() {
  error.value = null
  tabStore.error = null

  if (!name.value.trim()) {
    error.value = 'Name is required'
    return
  }

  emit('submit', {
    name: name.value.trim(),
    color: color.value,
  })

  // Only reset form if no error occurred
  // If there's an error, keep the form open so user can see it
  if (!tabStore.error) {
    name.value = ''
    color.value = '#3b82f6'
    error.value = null
  }
}

function handleCancel() {
  name.value = ''
  color.value = '#3b82f6'
  error.value = null
  tabStore.error = null
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
      <h2 class="m-0 mb-6 text-[var(--color-text)]">Add New Tab</h2>
      <form @submit.prevent="handleSubmit">
        <div class="mb-6">
          <label for="tab-name" class="block mb-2 text-[var(--color-text)] font-medium">
            Name
          </label>
          <input
            ref="nameInputRef"
            id="tab-name"
            v-model="name"
            type="text"
            placeholder="Enter tab name"
            required
            class="w-full px-3 py-3 border border-[var(--color-border)] rounded text-base bg-[var(--color-background-soft)] text-[var(--color-text)] box-border focus:outline focus:outline-2 focus:outline-[var(--color-text)] focus:outline-offset-2"
          />
        </div>
        <div class="mb-6">
          <label for="tab-color" class="block mb-2 text-[var(--color-text)] font-medium">
            Color
          </label>
          <div class="flex gap-3 items-center">
            <input
              id="tab-color"
              v-model="color"
              type="color"
              class="w-16 h-16 border border-[var(--color-border)] rounded cursor-pointer"
            />
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="paletteColor in colorPalette"
                :key="paletteColor"
                type="button"
                class="w-10 h-10 rounded border-2 transition-all duration-200 hover:scale-110"
                :class="color === paletteColor ? 'border-[var(--color-text)] scale-110' : 'border-[var(--color-border)]'"
                :style="{ backgroundColor: paletteColor }"
                @click="color = paletteColor"
                :aria-label="`Select color ${paletteColor}`"
              />
            </div>
          </div>
        </div>
        <div v-if="error || tabStore.error" class="text-[#dc3545] mb-4 text-sm p-3 bg-[#dc3545]/10 rounded">{{ error || tabStore.error }}</div>
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
            Add Tab
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

