import type { IGroupApi } from './groupApi.interface'
import type { Group, CreateGroupDto, UpdateGroupDto } from '@/types/group'

/**
 * HTTP implementation of IGroupApi for real backend communication
 */
export class HttpGroupApi implements IGroupApi {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async getAllGroups(tabId?: string): Promise<Group[]> {
    try {
      const url = tabId ? `${this.baseUrl}/groups?tabId=${tabId}` : `${this.baseUrl}/groups`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch groups: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[HttpGroupApi] Error fetching groups:', error)
      throw error
    }
  }

  async createGroup(data: CreateGroupDto): Promise<Group> {
    try {
      const response = await fetch(`${this.baseUrl}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error(`Failed to create group: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[HttpGroupApi] Error creating group:', error)
      throw error
    }
  }

  async updateGroup(id: string, data: UpdateGroupDto): Promise<Group> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error(`Failed to update group: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[HttpGroupApi] Error updating group:', error)
      throw error
    }
  }

  async deleteGroup(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`Failed to delete group: ${response.statusText}`)
      }
    } catch (error) {
      console.error('[HttpGroupApi] Error deleting group:', error)
      throw error
    }
  }

  async addBookmarkToGroup(groupId: string, bookmarkId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${groupId}/bookmarks/${bookmarkId}`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error(`Failed to add bookmark to group: ${response.statusText}`)
      }
    } catch (error) {
      console.error('[HttpGroupApi] Error adding bookmark to group:', error)
      throw error
    }
  }

  async removeBookmarkFromGroup(groupId: string, bookmarkId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${groupId}/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`Failed to remove bookmark from group: ${response.statusText}`)
      }
    } catch (error) {
      console.error('[HttpGroupApi] Error removing bookmark from group:', error)
      throw error
    }
  }

  async deleteAllGroups(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/all`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`Failed to delete all groups: ${response.statusText}`)
      }
    } catch (error) {
      console.error('[HttpGroupApi] Error deleting all groups:', error)
      throw error
    }
  }

  async reorderGroup(id: string, newOrderIndex: number): Promise<Group> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${id}/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newOrderIndex }),
      })
      if (!response.ok) {
        throw new Error(`Failed to reorder group: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[HttpGroupApi] Error reordering group:', error)
      throw error
    }
  }
}

