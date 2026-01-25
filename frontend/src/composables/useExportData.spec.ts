import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useExportData } from './useExportData'
import { bookmarkApi } from '@/services/bookmarkApi/bookmarkApi'
import { groupApi } from '@/services/groupApi/groupApi'
import { tabApi } from '@/services/tabApi/tabApi'
import type { Tab } from '@/types/tab'
import type { Group } from '@/types/group'
import type { Bookmark } from '@/types/bookmark'

// Mock the APIs
vi.mock('@/services/bookmarkApi/bookmarkApi', () => ({
  bookmarkApi: {
    getAllBookmarks: vi.fn(),
  },
}))

vi.mock('@/services/groupApi/groupApi', () => ({
  groupApi: {
    getAllGroups: vi.fn(),
  },
}))

vi.mock('@/services/tabApi/tabApi', () => ({
  tabApi: {
    getAllTabs: vi.fn(),
  },
}))

describe('useExportData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
    
    // Mock document.createElement and related DOM methods
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    }
    global.document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'a') {
        return mockLink as unknown as HTMLElement
      }
      return document.createElement(tagName)
    })
    global.document.body.appendChild = vi.fn()
    global.document.body.removeChild = vi.fn()
  })

  it('exports user data to JSON file', async () => {
    const mockTabs = [
      {
        id: 'tab-1',
        name: 'Test Tab',
        color: '#3b82f6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    const mockGroups = [
      {
        id: 'group-1',
        name: 'Test Group',
        color: '#10b981',
        tabId: 'tab-1',
        orderIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    const mockBookmarks = [
      {
        id: 'bookmark-1',
        name: 'Test Bookmark',
        url: 'https://example.com',
        tabId: 'tab-1',
        groupIds: ['group-1'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    vi.mocked(tabApi.getAllTabs).mockResolvedValue(mockTabs as Tab[])
    vi.mocked(groupApi.getAllGroups).mockResolvedValue(mockGroups as Group[])
    vi.mocked(bookmarkApi.getAllBookmarks).mockResolvedValue(mockBookmarks as Bookmark[])

    const { exportUserData } = useExportData()
    await exportUserData()

    // Verify APIs were called
    expect(tabApi.getAllTabs).toHaveBeenCalled()
    expect(groupApi.getAllGroups).toHaveBeenCalled()
    expect(bookmarkApi.getAllBookmarks).toHaveBeenCalled()

    // Verify blob was created
    expect(global.URL.createObjectURL).toHaveBeenCalled()
    
    // Verify link was created and clicked
    expect(global.document.createElement).toHaveBeenCalledWith('a')
    expect(global.document.body.appendChild).toHaveBeenCalled()
    expect(global.document.body.removeChild).toHaveBeenCalled()
    expect(global.URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('handles bookmarks without groups', async () => {
    const mockTabs = [
      {
        id: 'tab-1',
        name: 'Test Tab',
        color: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    const mockBookmarks = [
      {
        id: 'bookmark-1',
        name: 'Ungrouped Bookmark',
        url: 'https://example.com',
        tabId: 'tab-1',
        groupIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    vi.mocked(tabApi.getAllTabs).mockResolvedValue(mockTabs as Tab[])
    vi.mocked(groupApi.getAllGroups).mockResolvedValue([])
    vi.mocked(bookmarkApi.getAllBookmarks).mockResolvedValue(mockBookmarks as Bookmark[])

    const { exportUserData } = useExportData()
    await expect(exportUserData()).resolves.not.toThrow()
  })

  it('handles errors during export', async () => {
    vi.mocked(tabApi.getAllTabs).mockRejectedValue(new Error('API Error'))

    const { exportUserData } = useExportData()
    await expect(exportUserData()).rejects.toThrow('API Error')
  })
})
