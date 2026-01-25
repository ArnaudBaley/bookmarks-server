export interface Bookmark {
  id: string
  name: string
  url: string
  tabId?: string // Keep for backward compatibility, but prefer tabIds
  tabIds?: string[]
  groupIds?: string[]
  groupOrderIndexes?: Record<string, number> // Per-group order index
  createdAt?: string
  updatedAt?: string
}

export interface CreateBookmarkDto {
  name: string
  url: string
  tabId?: string // Keep for backward compatibility
  tabIds?: string[]
  groupIds?: string[]
}

export interface UpdateBookmarkDto {
  name?: string
  url?: string
  tabId?: string // Keep for backward compatibility
  tabIds?: string[]
  groupIds?: string[]
}

