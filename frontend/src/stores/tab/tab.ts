import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Tab, CreateTabDto, UpdateTabDto } from '@/types/tab'
import { tabApi } from '@/services/tabApi/tabApi'

export const useTabStore = defineStore('tab', () => {
  const tabs = ref<Tab[]>([])
  const activeTabId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const tabsCount = computed(() => tabs.value.length)

  const activeTab = computed(() => {
    if (!activeTabId.value) return null
    return tabs.value.find((tab) => tab.id === activeTabId.value) || null
  })

  const getTabById = computed(() => {
    return (id: string) => tabs.value.find((tab) => tab.id === id)
  })

  async function fetchTabs() {
    loading.value = true
    error.value = null
    try {
      tabs.value = await tabApi.getAllTabs()
      
      // Set active tab if none is set and tabs exist
      if (!activeTabId.value && tabs.value.length > 0) {
        activeTabId.value = tabs.value[0].id
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch tabs'
      console.error('Error fetching tabs:', err)
    } finally {
      loading.value = false
    }
  }

  async function addTab(data: CreateTabDto) {
    loading.value = true
    error.value = null
    try {
      const newTab = await tabApi.createTab(data)
      tabs.value.push(newTab)
      
      // Set as active if it's the first tab
      if (tabs.value.length === 1) {
        activeTabId.value = newTab.id
      }
      
      return newTab
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create tab'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateTab(id: string, data: UpdateTabDto) {
    loading.value = true
    error.value = null
    try {
      const updatedTab = await tabApi.updateTab(id, data)
      const index = tabs.value.findIndex((tab) => tab.id === id)
      if (index !== -1) {
        tabs.value[index] = updatedTab
      }
      return updatedTab
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update tab'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeTab(id: string) {
    loading.value = true
    error.value = null
    try {
      await tabApi.deleteTab(id)
      tabs.value = tabs.value.filter((tab) => tab.id !== id)
      
      // If the removed tab was active, switch to first available tab
      if (activeTabId.value === id) {
        if (tabs.value.length > 0) {
          activeTabId.value = tabs.value[0].id
        } else {
          activeTabId.value = null
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete tab'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setActiveTab(id: string | null) {
    activeTabId.value = id
  }

  return {
    tabs,
    activeTabId,
    loading,
    error,
    tabsCount,
    activeTab,
    getTabById,
    fetchTabs,
    addTab,
    updateTab,
    removeTab,
    setActiveTab,
  }
})
