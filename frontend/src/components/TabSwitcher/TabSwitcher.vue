<script setup lang="ts">
import { computed } from 'vue'
import { useTabStore } from '@/stores/tab/tab'
import type { Tab } from '@/types/tab'

interface Emits {
  (e: 'tab-edit', tab: Tab): void
  (e: 'tab-add'): void
}

const emit = defineEmits<Emits>()

const tabStore = useTabStore()

const tabs = computed(() => tabStore.tabs)
const activeTabId = computed(() => tabStore.activeTabId)

function handleTabClick(tabId: string) {
  tabStore.setActiveTab(tabId)
}

function handleTabEdit(event: MouseEvent, tab: Tab) {
  event.stopPropagation()
  emit('tab-edit', tab)
}

function handleAddTab() {
  emit('tab-add')
}
</script>

<template>
  <div class="mb-6 border-b border-[var(--color-border)]">
    <div class="flex items-center gap-2 overflow-x-auto pb-2">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="group relative"
      >
        <button
          @click="handleTabClick(tab.id)"
          class="pl-4 pr-8 py-2 rounded-t-lg transition-all duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap border-b-2"
          :class="
            activeTabId === tab.id
              ? 'bg-[var(--color-background-soft)] border-[var(--color-text)] text-[var(--color-text)] font-medium'
              : 'border-transparent text-[var(--color-text)] opacity-70 hover:opacity-100 hover:bg-[var(--color-background-soft)]'
          "
          :style="
            activeTabId === tab.id && tab.color
              ? { borderBottomColor: tab.color }
              : {}
          "
        >
          <span
            v-if="tab.color"
            class="w-3 h-3 rounded-full flex-shrink-0"
            :style="{ backgroundColor: tab.color }"
          ></span>
          <span>{{ tab.name }}</span>
        </button>
        <button
          @click.stop="handleTabEdit($event, tab)"
          class="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 rounded hover:bg-[var(--color-background-mute)] transition-opacity flex-shrink-0"
          aria-label="Edit tab"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
      <button
        @click="handleAddTab"
        class="px-3 py-2 rounded-t-lg transition-all duration-200 cursor-pointer flex items-center justify-center text-[var(--color-text)] opacity-70 hover:opacity-100 hover:bg-[var(--color-background-soft)] border-b-2 border-transparent"
        aria-label="Add new tab"
        title="Add new tab"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
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
</template>
