import type { ITabApi } from './tabApi.interface'
import { MockTabApi } from './tabApi.mock'
import { HttpTabApi } from './tabApi.http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

/**
 * Factory function to create the appropriate tab API implementation
 * @returns An instance of ITabApi (either MockTabApi or HttpTabApi)
 */
function createTabApi(): ITabApi {
  // Force mock mode if explicitly set
  if (USE_MOCK_API) {
    console.log('[TabApi] Using MockTabApi (forced by VITE_USE_MOCK_API)')
    return new MockTabApi()
  }

  // Use mock if no API URL is configured
  if (!import.meta.env.VITE_API_BASE_URL) {
    console.log('[TabApi] Using MockTabApi (no VITE_API_BASE_URL configured)')
    return new MockTabApi()
  }

  // Use HTTP API directly - errors will propagate to stores for proper error handling
  console.log(`[TabApi] Using HttpTabApi with base URL: ${API_BASE_URL}`)
  return new HttpTabApi(API_BASE_URL)
}

// Export the singleton instance
export const tabApi: ITabApi = createTabApi()

// Export types and implementations for testing
export { MockTabApi, HttpTabApi }
export type { ITabApi }
