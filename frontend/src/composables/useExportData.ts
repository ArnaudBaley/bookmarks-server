import { bookmarkApi } from '@/services/bookmarkApi/bookmarkApi'
import { groupApi } from '@/services/groupApi/groupApi'
import { tabApi } from '@/services/tabApi/tabApi'

interface ExportData {
  tabs: Array<{
    name: string
    color?: string | null
  }>
  groups: Array<{
    name: string
    color: string
    tabIndex: number
  }>
  bookmarks: Array<{
    name: string
    url: string
    tabIndex: number
    groupIndices?: number[]
  }>
}

/**
 * Composable for exporting user data to JSON file
 * @returns Function to export all user data
 */
export function useExportData() {
  async function exportUserData(): Promise<void> {
    // Fetch all data from API to ensure we get complete data from all tabs
    // (stores only contain filtered data for the active tab)
    const allTabs = await tabApi.getAllTabs()
    const allBookmarks = await bookmarkApi.getAllBookmarks()
    const allGroups = await groupApi.getAllGroups()
    
    // Create maps from IDs to indices for reference
    const tabIdToIndex = new Map<string, number>()
    allTabs.forEach((tab, index) => {
      tabIdToIndex.set(tab.id, index)
    })
    
    const groupIdToIndex = new Map<string, number>()
    allGroups.forEach((group, index) => {
      groupIdToIndex.set(group.id, index)
    })
    
    // Prepare export data (exclude IDs and timestamps)
    // Use indices instead of IDs to maintain relationships
    const exportData: ExportData = {
      tabs: allTabs.map((tab) => ({
        name: tab.name,
        color: tab.color,
      })),
      groups: allGroups
        .filter((group) => {
          // Skip groups with null tabId if no tabs exist
          if (!group.tabId && allTabs.length === 0) {
            console.warn(`Skipping group ${group.name} with null tabId (no tabs available)`)
            return false
          }
          return true
        })
        .map((group) => {
          // Handle null tabId by assigning to first tab (index 0) if tabs exist
          const tabId = group.tabId
          let tabIndex: number
          if (!tabId) {
            if (allTabs.length === 0) {
              throw new Error(`Group ${group.name} has null tabId and no tabs exist`)
            }
            tabIndex = 0 // Assign to first tab
            console.warn(`Group ${group.name} has null tabId, assigning to first tab (index 0)`)
          } else {
            const foundTabIndex = tabIdToIndex.get(tabId)
            if (foundTabIndex === undefined) {
              throw new Error(`Group ${group.name} references unknown tab ${tabId}`)
            }
            tabIndex = foundTabIndex
          }
          return {
            name: group.name,
            color: group.color,
            tabIndex,
          }
        }),
      bookmarks: allBookmarks
        .filter((bookmark) => {
          // Skip bookmarks with null tabId if no tabs exist
          if (!bookmark.tabId && allTabs.length === 0) {
            console.warn(`Skipping bookmark ${bookmark.name} with null tabId (no tabs available)`)
            return false
          }
          return true
        })
        .map((bookmark) => {
          // Handle null tabId by assigning to first tab (index 0) if tabs exist
          const tabId = bookmark.tabId
          let tabIndex: number
          if (!tabId) {
            if (allTabs.length === 0) {
              throw new Error(`Bookmark ${bookmark.name} has null tabId and no tabs exist`)
            }
            tabIndex = 0 // Assign to first tab
            console.warn(`Bookmark ${bookmark.name} has null tabId, assigning to first tab (index 0)`)
          } else {
            const foundTabIndex = tabIdToIndex.get(tabId)
            if (foundTabIndex === undefined) {
              throw new Error(`Bookmark ${bookmark.name} references unknown tab ${tabId}`)
            }
            tabIndex = foundTabIndex
          }
          return {
            name: bookmark.name,
            url: bookmark.url,
            tabIndex,
            groupIndices: (bookmark.groupIds || [])
              .map((groupId) => groupIdToIndex.get(groupId))
              .filter((index): index is number => index !== undefined),
          }
        }),
    }

    // Create JSON string
    const jsonString = JSON.stringify(exportData, null, 2)
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Generate filename with current date
    const date = new Date()
    const dateStr = date.toISOString().split('T')[0]
    link.download = `bookmarks-export-${dateStr}.json`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return {
    exportUserData,
  }
}
