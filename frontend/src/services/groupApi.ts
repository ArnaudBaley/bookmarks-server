import type { IGroupApi } from './groupApi.interface'
import type { CreateGroupDto, UpdateGroupDto } from '@/types/group'
import { MockGroupApi } from './groupApi.mock'
import { HttpGroupApi } from './groupApi.http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

/**
 * Factory function to create the appropriate group API implementation
 * @returns An instance of IGroupApi (either MockGroupApi or HttpGroupApi)
 */
function createGroupApi(): IGroupApi {
  // Force mock mode if explicitly set
  if (USE_MOCK_API) {
    console.log('[GroupApi] Using MockGroupApi (forced by VITE_USE_MOCK_API)')
    return new MockGroupApi()
  }

  // Use mock if no API URL is configured
  if (!import.meta.env.VITE_API_BASE_URL) {
    console.log('[GroupApi] Using MockGroupApi (no VITE_API_BASE_URL configured)')
    return new MockGroupApi()
  }

  // Use HTTP API with fallback to mock on errors
  console.log(`[GroupApi] Using HttpGroupApi with base URL: ${API_BASE_URL}`)
  return new HttpGroupApiWithFallback(API_BASE_URL)
}

/**
 * Wrapper that falls back to mock API if HTTP API fails
 * This provides a seamless experience during development
 */
class HttpGroupApiWithFallback implements IGroupApi {
  private httpApi: HttpGroupApi
  private mockApi: MockGroupApi

  constructor(baseUrl: string) {
    this.httpApi = new HttpGroupApi(baseUrl)
    this.mockApi = new MockGroupApi()
  }

  async getAllGroups() {
    try {
      return await this.httpApi.getAllGroups()
    } catch (error) {
      console.warn('[GroupApi] HTTP API failed, falling back to mock API', error)
      return this.mockApi.getAllGroups()
    }
  }

  async createGroup(data: CreateGroupDto) {
    try {
      return await this.httpApi.createGroup(data)
    } catch (error) {
      console.warn('[GroupApi] HTTP API failed, falling back to mock API', error)
      return this.mockApi.createGroup(data)
    }
  }

  async updateGroup(id: string, data: UpdateGroupDto) {
    try {
      return await this.httpApi.updateGroup(id, data)
    } catch (error) {
      console.warn('[GroupApi] HTTP API failed, falling back to mock API', error)
      return this.mockApi.updateGroup(id, data)
    }
  }

  async deleteGroup(id: string) {
    try {
      return await this.httpApi.deleteGroup(id)
    } catch (error) {
      console.warn('[GroupApi] HTTP API failed, falling back to mock API', error)
      return this.mockApi.deleteGroup(id)
    }
  }

  async addBookmarkToGroup(groupId: string, bookmarkId: string) {
    try {
      return await this.httpApi.addBookmarkToGroup(groupId, bookmarkId)
    } catch (error) {
      console.warn('[GroupApi] HTTP API failed, falling back to mock API', error)
      return this.mockApi.addBookmarkToGroup(groupId, bookmarkId)
    }
  }

  async removeBookmarkFromGroup(groupId: string, bookmarkId: string) {
    try {
      return await this.httpApi.removeBookmarkFromGroup(groupId, bookmarkId)
    } catch (error) {
      console.warn('[GroupApi] HTTP API failed, falling back to mock API', error)
      return this.mockApi.removeBookmarkFromGroup(groupId, bookmarkId)
    }
  }
}

// Export the singleton instance
export const groupApi: IGroupApi = createGroupApi()

// Export types and implementations for testing
export { MockGroupApi, HttpGroupApi }
export type { IGroupApi }

