export interface Bookmark {
  id: string
  name: string
  url: string
  tabId: string
  groupIds?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateBookmarkDto {
  name: string
  url: string
  tabId: string
  groupIds?: string[]
}

export interface UpdateBookmarkDto {
  name?: string
  url?: string
  tabId?: string
  groupIds?: string[]
}

