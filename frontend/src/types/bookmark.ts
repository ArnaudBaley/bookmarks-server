export interface Bookmark {
  id: string
  name: string
  url: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateBookmarkDto {
  name: string
  url: string
}

export interface UpdateBookmarkDto {
  name: string
  url: string
}

