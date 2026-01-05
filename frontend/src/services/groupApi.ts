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

  // Use HTTP API directly - errors will propagate to stores for proper error handling
  console.log(`[GroupApi] Using HttpGroupApi with base URL: ${API_BASE_URL}`)
  return new HttpGroupApi(API_BASE_URL)
}

// Export the singleton instance
export const groupApi: IGroupApi = createGroupApi()

// Export types and implementations for testing
export { MockGroupApi, HttpGroupApi }
export type { IGroupApi }

