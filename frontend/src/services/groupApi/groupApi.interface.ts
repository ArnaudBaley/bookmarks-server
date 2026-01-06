import type { Group, CreateGroupDto, UpdateGroupDto } from '@/types/group'

/**
 * Interface for group API communication
 * This interface defines the contract for all group API implementations
 */
export interface IGroupApi {
  /**
   * Fetch all groups
   * @param tabId - Optional tab ID to filter groups by tab
   * @returns Promise resolving to an array of groups
   */
  getAllGroups(tabId?: string): Promise<Group[]>

  /**
   * Create a new group
   * @param data - The group data to create
   * @returns Promise resolving to the created group
   */
  createGroup(data: CreateGroupDto): Promise<Group>

  /**
   * Update an existing group
   * @param id - The ID of the group to update
   * @param data - The group data to update
   * @returns Promise resolving to the updated group
   */
  updateGroup(id: string, data: UpdateGroupDto): Promise<Group>

  /**
   * Delete a group by ID
   * @param id - The ID of the group to delete
   * @returns Promise that resolves when the group is deleted
   */
  deleteGroup(id: string): Promise<void>

  /**
   * Add a bookmark to a group
   * @param groupId - The ID of the group
   * @param bookmarkId - The ID of the bookmark to add
   * @returns Promise that resolves when the bookmark is added to the group
   */
  addBookmarkToGroup(groupId: string, bookmarkId: string): Promise<void>

  /**
   * Remove a bookmark from a group
   * @param groupId - The ID of the group
   * @param bookmarkId - The ID of the bookmark to remove
   * @returns Promise that resolves when the bookmark is removed from the group
   */
  removeBookmarkFromGroup(groupId: string, bookmarkId: string): Promise<void>
}

