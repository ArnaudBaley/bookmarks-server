<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import type { UpdateGroupDto, Group } from '@/types/group'

interface Props {
  group: Group
}

interface Emits {
  (e: 'submit', id: string, data: UpdateGroupDto): void
  (e: 'delete', id: string): void
  (e: 'duplicate', group: Group): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const name = ref('')
const color = ref('#3b82f6')
const error = ref<string | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleCancel()
  }
}

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

onMounted(async () => {
  name.value = props.group.name
  color.value = props.group.color
  window.addEventListener('keydown', handleEscapeKey)
  await nextTick()
  nameInputRef.value?.focus()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscapeKey)
})

function handleSubmit() {
  error.value = null

  if (!name.value.trim()) {
    error.value = 'Name is required'
    return
  }

  emit('submit', props.group.id, {
    name: name.value.trim(),
    color: color.value,
  })
}

function handleDelete() {
  emit('delete', props.group.id)
}

function handleDuplicate() {
  emit('duplicate', props.group)
}

function handleCancel() {
  name.value = props.group.name
  color.value = props.group.color
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
      <div class="flex justify-between items-center mb-6">
        <h2 class="m-0 text-[var(--color-text)]">Edit Group</h2>
        <div class="flex gap-2">
          <button
            type="button"
            class="p-2 text-[var(--color-text)] hover:bg-[var(--color-background-mute)] rounded transition-colors duration-200 cursor-pointer"
            @click="handleDuplicate"
            aria-label="Duplicate group"
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
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <button
            type="button"
            class="p-2 text-[#dc3545] hover:bg-[#dc3545]/10 rounded transition-colors duration-200 cursor-pointer"
            @click="handleDelete"
            aria-label="Delete group"
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
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="mb-6">
          <label for="group-name" class="block mb-2 text-[var(--color-text)] font-medium">
            Name
          </label>
          <input
            ref="nameInputRef"
            id="group-name"
            v-model="name"
            type="text"
            placeholder="Enter group name"
            required
            class="w-full px-3 py-3 border border-[var(--color-border)] rounded text-base bg-[var(--color-background-soft)] text-[var(--color-text)] box-border focus:outline focus:outline-2 focus:outline-[var(--color-text)] focus:outline-offset-2"
          />
        </div>
        <div class="mb-6">
          <label for="group-color" class="block mb-2 text-[var(--color-text)] font-medium">
            Color
          </label>
          <div class="flex gap-3 items-center">
            <input
              id="group-color"
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
            Update Group
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

