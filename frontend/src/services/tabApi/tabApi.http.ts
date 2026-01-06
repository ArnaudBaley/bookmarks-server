import type { ITabApi } from './tabApi.interface'
import type { Tab, CreateTabDto, UpdateTabDto } from '@/types/tab'

/**
 * HTTP implementation of ITabApi for real backend communication
 */
export class HttpTabApi implements ITabApi {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async getAllTabs(): Promise<Tab[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tabs`)
      if (!response.ok) {
        throw new Error(`Failed to fetch tabs: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[HttpTabApi] Error fetching tabs:', error)
      throw error
    }
  }

  async getTabById(id: string): Promise<Tab> {
    try {
      const response = await fetch(`${this.baseUrl}/tabs/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch tab: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[HttpTabApi] Error fetching tab:', error)
      throw error
    }
  }

  async createTab(data: CreateTabDto): Promise<Tab> {
    try {
      const response = await fetch(`${this.baseUrl}/tabs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error(`Failed to create tab: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[HttpTabApi] Error creating tab:', error)
      throw error
    }
  }

  async updateTab(id: string, data: UpdateTabDto): Promise<Tab> {
    try {
      const response = await fetch(`${this.baseUrl}/tabs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error(`Failed to update tab: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[HttpTabApi] Error updating tab:', error)
      throw error
    }
  }

  async deleteTab(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/tabs/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`Failed to delete tab: ${response.statusText}`)
      }
    } catch (error) {
      console.error('[HttpTabApi] Error deleting tab:', error)
      throw error
    }
  }
}
