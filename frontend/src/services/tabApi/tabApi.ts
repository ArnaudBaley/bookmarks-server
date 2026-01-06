import type { ITabApi } from './tabApi.interface'
import { HttpTabApi } from './tabApi.http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/**
 * Factory function to create the appropriate tab API implementation
 * @returns An instance of ITabApi (HttpTabApi)
 */
function createTabApi(): ITabApi {
  console.log(`[TabApi] Using HttpTabApi with base URL: ${API_BASE_URL}`)
  return new HttpTabApi(API_BASE_URL)
}

// Export the singleton instance
export const tabApi: ITabApi = createTabApi()

// Export types and implementations for testing
export { HttpTabApi }
export type { ITabApi }
