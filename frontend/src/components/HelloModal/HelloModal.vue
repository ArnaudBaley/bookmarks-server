<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

interface Emits {
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

function handleEscapeKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    handleClose()
  }
}

function handleClose(): void {
  emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscapeKey)
})
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
    @click.self="handleClose"
  >
    <div
      class="bg-[var(--color-background)] p-8 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.3)] w-[90%] max-w-[400px]"
    >
      <h2 class="m-0 text-[var(--color-text)] text-2xl mb-6 text-center">Hello</h2>
      <div class="flex justify-end">
        <button
          type="button"
          class="px-6 py-3 border-none rounded text-base cursor-pointer transition-colors duration-200 bg-[var(--color-background-soft)] text-[var(--color-text)] hover:bg-[var(--color-border)]"
          @click="handleClose"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>
