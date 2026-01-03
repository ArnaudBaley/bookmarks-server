import { mount, type MountingOptions } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import type { Component } from 'vue'
import { vi } from 'vitest'
import type { Bookmark, CreateBookmarkDto } from '@/types/bookmark'

/**
 * Creates a fresh Pinia instance for testing
 * Call this before each test to ensure test isolation
 */
export function createTestPinia(): Pinia {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * Mounts a component with Pinia store support
 * Automatically creates a fresh Pinia instance
 */
export function mountWithPinia<T extends Component>(
  component: T,
  options?: MountingOptions<Record<string, unknown>>
) {
  const pinia = createTestPinia()
  return mount(component, {
    global: {
      plugins: [pinia],
    },
    ...options,
  })
}

/**
 * Test data factory for creating bookmark objects
 */
export function createBookmark(overrides?: Partial<Bookmark>): Bookmark {
  return {
    id: 'test-id-1',
    name: 'Test Bookmark',
    url: 'https://example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Test data factory for creating CreateBookmarkDto objects
 */
export function createBookmarkDto(overrides?: Partial<CreateBookmarkDto>): CreateBookmarkDto {
  return {
    name: 'Test Bookmark',
    url: 'https://example.com',
    ...overrides,
  }
}

/**
 * Creates an array of test bookmarks
 */
export function createBookmarkArray(count: number): Bookmark[] {
  return Array.from({ length: count }, (_, i) =>
    createBookmark({
      id: `test-id-${i + 1}`,
      name: `Test Bookmark ${i + 1}`,
      url: `https://example${i + 1}.com`,
    })
  )
}

/**
 * Mocks window.open for testing
 */
export function mockWindowOpen() {
  const mockOpen = vi.fn()
  window.open = mockOpen
  return mockOpen
}

/**
 * Mocks localStorage for testing
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key])
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
}

/**
 * Mocks fetch for testing API calls
 */
export function mockFetch(responseData: unknown, options?: { ok?: boolean; status?: number }) {
  const mockResponse = {
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    statusText: options?.ok === false ? 'Error' : 'OK',
    json: vi.fn().mockResolvedValue(responseData),
    text: vi.fn().mockResolvedValue(JSON.stringify(responseData)),
  }
  
  global.fetch = vi.fn().mockResolvedValue(mockResponse)
  return global.fetch
}

/**
 * Mocks matchMedia for testing theme detection
 */
export function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

/**
 * Waits for the next tick in Vue's reactivity system
 */
export async function waitForNextTick() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

