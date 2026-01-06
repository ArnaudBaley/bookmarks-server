import type { ITabApi } from './tabApi.interface'
import type { Tab, CreateTabDto, UpdateTabDto } from '@/types/tab'

const STORAGE_KEY = 'tabs-mock-data'

/**
 * Mock implementation of ITabApi for testing purposes
 * Uses localStorage to persist data across page refreshes
 */
export class MockTabApi implements ITabApi {
  private getStorage(): Tab[] {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored)
    } catch {
      // If JSON is corrupted, clear it and return empty array
      localStorage.removeItem(STORAGE_KEY)
      return []
    }
  }

  private setStorage(tabs: Tab[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
  }

  /**
   * Simulate network delay
   */
  private async simulateDelay(ms: number = 300): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }

  async getAllTabs(): Promise<Tab[]> {
    console.log('[MockTabApi] Fetching all tabs')
    await this.simulateDelay()
    return this.getStorage()
  }

  async getTabById(id: string): Promise<Tab> {
    console.log('[MockTabApi] Fetching tab by id:', id)
    await this.simulateDelay()
    
    const tabs = this.getStorage()
    const tab = tabs.find((tab) => tab.id === id)
    
    if (!tab) {
      throw new Error(`Tab with id ${id} not found`)
    }
    
    return tab
  }

  async createTab(data: CreateTabDto): Promise<Tab> {
    console.log('[MockTabApi] Creating tab:', data)
    await this.simulateDelay()

    const tabs = this.getStorage()
    const newTab: Tab = {
      id: crypto.randomUUID(),
      name: data.name,
      color: data.color || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    tabs.push(newTab)
    this.setStorage(tabs)
    return newTab
  }

  async updateTab(id: string, data: UpdateTabDto): Promise<Tab> {
    console.log('[MockTabApi] Updating tab:', id, data)
    await this.simulateDelay()

    const tabs = this.getStorage()
    const tabIndex = tabs.findIndex((tab) => tab.id === id)
    
    if (tabIndex === -1) {
      throw new Error(`Tab with id ${id} not found`)
    }

    const existingTab = tabs[tabIndex]!
    const updatedTab: Tab = {
      id: existingTab.id,
      name: data.name !== undefined ? data.name : existingTab.name,
      color: data.color !== undefined ? (data.color || null) : existingTab.color,
      createdAt: existingTab.createdAt,
      updatedAt: new Date().toISOString(),
    }
    
    tabs[tabIndex] = updatedTab
    this.setStorage(tabs)
    return updatedTab
  }

  async deleteTab(id: string): Promise<void> {
    console.log('[MockTabApi] Deleting tab:', id)
    await this.simulateDelay()

    const tabs = this.getStorage()
    const filtered = tabs.filter((tab) => tab.id !== id)
    this.setStorage(filtered)

    // Cascade delete: Remove all groups and bookmarks associated with this tab
    if (typeof window !== 'undefined') {
      // Delete groups
      const groupsStorage = localStorage.getItem('groups-mock-data')
      if (groupsStorage) {
        try {
          const groups = JSON.parse(groupsStorage)
          const remainingGroups = groups.filter((group: { tabId?: string | null }) => group.tabId !== id)
          localStorage.setItem('groups-mock-data', JSON.stringify(remainingGroups))
        } catch {
          // Ignore parse errors
        }
      }

      // Delete bookmarks
      const bookmarksStorage = localStorage.getItem('bookmarks-mock-data')
      if (bookmarksStorage) {
        try {
          const bookmarks = JSON.parse(bookmarksStorage)
          const remainingBookmarks = bookmarks.filter((bookmark: { tabId?: string | null }) => bookmark.tabId !== id)
          localStorage.setItem('bookmarks-mock-data', JSON.stringify(remainingBookmarks))
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  /**
   * Clear all mock data (useful for testing)
   */
  clearStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }
}
