import type { Bookmark, CreateBookmarkDto } from '@/types/bookmark'

/**
 * Interface for bookmark API communication
 * This interface defines the contract for all bookmark API implementations
 */
export interface IBookmarkApi {
  /**
   * Fetch all bookmarks
   * @returns Promise resolving to an array of bookmarks
   */
  getAllBookmarks(): Promise<Bookmark[]>

  /**
   * Create a new bookmark
   * @param data - The bookmark data to create
   * @returns Promise resolving to the created bookmark
   */
  createBookmark(data: CreateBookmarkDto): Promise<Bookmark>

  /**
   * Delete a bookmark by ID
   * @param id - The ID of the bookmark to delete
   * @returns Promise that resolves when the bookmark is deleted
   */
  deleteBookmark(id: string): Promise<void>
}

