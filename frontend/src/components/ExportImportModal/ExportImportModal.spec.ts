import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestPinia } from '@/test-utils'
import ExportImportModal from './ExportImportModal.vue'
import { useTabStore } from '@/stores/tab/tab'
import { createBookmark, createBookmarkArray, createGroup, createGroupArray } from '@/test-utils'

/**
 * Helper function to simulate file input selection
 * Uses direct DOM manipulation since setValue() doesn't work on file inputs in jsdom
 */
function simulateFileInput(inputElement: HTMLInputElement, file: File): void {
  // Create a FileList containing the file
  const fileList = {
    0: file,
    length: 1,
    item: (index: number) => (index === 0 ? file : null),
    [Symbol.iterator]: function* () {
      yield file
    },
  } as FileList

  // Set the files property using Object.defineProperty
  Object.defineProperty(inputElement, 'files', {
    value: fileList,
    writable: false,
    configurable: true,
  })

  // Dispatch change event
  const changeEvent = new Event('change', { bubbles: true })
  inputElement.dispatchEvent(changeEvent)
}

/**
 * Creates a mock FileReader class that can be used as a constructor
 * Uses getters/setters to allow dynamic callback assignment
 */
function createMockFileReaderClass(callbacks: {
  onload: ((e: { target: { result: string } }) => void) | null
  onerror: (() => void) | null
  readAsTextImpl: (file: File) => void
  result: string
}) {
  class MockFileReader {
    private _onload: ((e: { target: { result: string } }) => void) | null = null
    private _onerror: (() => void) | null = null
    result = callbacks.result

    get onload() {
      return this._onload
    }

    set onload(callback: ((e: { target: { result: string } }) => void) | null) {
      this._onload = callback
      callbacks.onload = callback
    }

    get onerror() {
      return this._onerror
    }

    set onerror(callback: (() => void) | null) {
      this._onerror = callback
      callbacks.onerror = callback
    }

    readAsText(file: File) {
      callbacks.readAsTextImpl(file)
    }
  }
  return MockFileReader as unknown as typeof FileReader
}

describe('ExportImportModal', () => {
  beforeEach(() => {
    createTestPinia()
    vi.clearAllMocks()
    // Clear localStorage
    localStorage.clear()
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
    
    // Set up a default tab in localStorage for tests that need it
    const defaultTab = {
      id: 'test-tab-id',
      name: 'Test Tab',
      color: '#3b82f6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem('tabs-mock-data', JSON.stringify([defaultTab]))
  })

  it('renders modal with export and import sections', () => {
    const pinia = createTestPinia()
    const wrapper = mount(ExportImportModal, {
      global: {
        plugins: [pinia],
      },
    })

    expect(wrapper.text()).toContain('Export / Import')
    expect(wrapper.text()).toContain('Export Data')
    expect(wrapper.text()).toContain('Import Data')
  })

  it('emits cancel event when close button is clicked', async () => {
    const pinia = createTestPinia()
    const wrapper = mount(ExportImportModal, {
      global: {
        plugins: [pinia],
      },
    })

    const closeButton = wrapper.find('button[aria-label="Close modal"]')
    await closeButton.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('emits cancel event when clicking outside the modal', async () => {
    const pinia = createTestPinia()
    const wrapper = mount(ExportImportModal, {
      global: {
        plugins: [pinia],
      },
    })

    const backdrop = wrapper.find('.fixed.inset-0')
    await backdrop.trigger('click.self')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('handles Escape key to cancel', async () => {
    const pinia = createTestPinia()
    const wrapper = mount(ExportImportModal, {
      global: {
        plugins: [pinia],
      },
    })

    // Trigger Escape key on window since component listens to window events
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    window.dispatchEvent(escapeEvent)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  describe('Export functionality', () => {
    it('exports bookmarks and groups to JSON', async () => {
      const pinia = createTestPinia()
      const tabStore = useTabStore()

      // Set up tabs in store
      const testTab = {
        id: 'test-tab-id',
        name: 'Test Tab',
        color: '#3b82f6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      tabStore.tabs = [testTab]
      
      // Set up bookmarks and groups with tabId
      const bookmarks = createBookmarkArray(2)
      bookmarks.forEach(b => { 
        b.tabId = 'test-tab-id'
        b.groupIds = [] // Ensure groupIds is set
      })
      const groups = createGroupArray(2)
      groups.forEach(g => { g.tabId = 'test-tab-id' })
      
      // Store in localStorage for API calls (must match the format expected by mock APIs)
      localStorage.setItem('bookmarks-mock-data', JSON.stringify(bookmarks))
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
      localStorage.setItem('tabs-mock-data', JSON.stringify([testTab]))

      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      // Spy on createElement to verify it's called
      const createElementSpy = vi.spyOn(document, 'createElement')
      // Spy on appendChild and removeChild to avoid DOM issues
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)

      const exportButton = wrapper.findAll('button').find((btn) => btn.text().includes('Export to JSON'))
      expect(exportButton).toBeDefined()
      
      // Click the export button
      await exportButton!.trigger('click')

      // Wait for async operations to complete (API calls + DOM manipulation)
      // The mock APIs have a 300ms delay, so we need to wait longer
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 1000))
      await wrapper.vm.$nextTick()

      // Check for any errors first by accessing the component's error ref
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vm = wrapper.vm as any
      const errorValue = vm.error
      const errorText = wrapper.text()
      
      if (errorValue) {
        // Export failed - log the error for debugging
        console.error('Export error from component:', errorValue)
        // Fail the test with the actual error
        throw new Error(`Export failed with error: ${errorValue}`)
      }
      
      // Check that no error was set (export should succeed)
      expect(errorText).not.toContain('Failed to export')
      expect(errorValue).toBeNull()
      
      // Check that URL.createObjectURL was called (indicates export succeeded)
      // This is the most reliable indicator that the export completed
      expect(global.URL.createObjectURL).toHaveBeenCalled()
      
      // Check that createElement was called with 'a' (indicates export completed)
      const createElementCalls = createElementSpy.mock.calls
      const hasAnchorCall = createElementCalls.some(call => call[0] === 'a')
      expect(hasAnchorCall).toBe(true)
      
      // Clean up
      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })

    it('creates blob with correct data structure', async () => {
      const pinia = createTestPinia()
      const tabStore = useTabStore()

      // Set up tabs in store
      const testTab = {
        id: 'test-tab-id',
        name: 'Test Tab',
        color: '#3b82f6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      tabStore.tabs = [testTab]

      const bookmark = createBookmark({ name: 'Test Bookmark', url: 'https://example.com' })
      bookmark.tabId = 'test-tab-id'
      const group = createGroup({ name: 'Test Group', color: '#3b82f6' })
      group.tabId = 'test-tab-id'
      bookmark.groupIds = [group.id]

      // Store in localStorage for API calls (must match the format expected by mock APIs)
      localStorage.setItem('bookmarks-mock-data', JSON.stringify([bookmark]))
      localStorage.setItem('groups-mock-data', JSON.stringify([group]))
      localStorage.setItem('tabs-mock-data', JSON.stringify([testTab]))

      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      // Spy on appendChild and removeChild to avoid DOM issues
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)

      const exportButton = wrapper.findAll('button').find((btn) => btn.text().includes('Export to JSON'))
      expect(exportButton).toBeDefined()
      
      // Click the export button
      await exportButton!.trigger('click')

      // Wait for async operations to complete (API calls + DOM manipulation)
      // The mock APIs have a 300ms delay, so we need to wait longer
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 1000))
      await wrapper.vm.$nextTick()

      // Check for any errors first by accessing the component's error ref
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vm = wrapper.vm as any
      const errorValue = vm.error
      const errorText = wrapper.text()
      
      if (errorValue) {
        // Export failed - log the error for debugging
        console.error('Export error from component:', errorValue)
        // Fail the test with the actual error
        throw new Error(`Export failed with error: ${errorValue}`)
      }
      
      // Check that no error was set (export should succeed)
      expect(errorText).not.toContain('Failed to export')
      expect(errorValue).toBeNull()
      
      expect(global.URL.createObjectURL).toHaveBeenCalled()
      const mockCalls = (global.URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls
      expect(mockCalls[0]).toBeDefined()
      const blobCall = mockCalls[0]?.[0]
      expect(blobCall).toBeInstanceOf(Blob)
      
      // Clean up
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })
  })

  describe('Import functionality', () => {
    it('shows file input when import button is clicked', async () => {
      const pinia = createTestPinia()
      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.exists()).toBe(true)
      expect(fileInput.attributes('accept')).toBe('.json,application/json')
    })

    it('validates import file format', async () => {
      const pinia = createTestPinia()
      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      const fileInput = wrapper.find('input[type="file"]')
      const file = new File(['invalid json'], 'test.json', { type: 'application/json' })

      // Create a mock FileReader that captures callbacks
      const callbacks = {
        onload: null as ((e: { target: { result: string } }) => void) | null,
        onerror: null as (() => void) | null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        readAsTextImpl: (_file: File) => {
          // Simulate error by calling onerror callback
          setTimeout(() => {
            if (callbacks.onerror) {
              callbacks.onerror()
            }
          }, 0)
        },
        result: '',
      }

      // Mock FileReader constructor
      const MockFileReader = createMockFileReaderClass(callbacks)
      global.FileReader = MockFileReader

      // Use direct DOM manipulation instead of setValue()
      const inputElement = fileInput.element as HTMLInputElement
      if (inputElement) {
        simulateFileInput(inputElement, file)

        // Wait for async operations
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 50))
        await wrapper.vm.$nextTick()

        // Should show error
        expect(wrapper.text()).toContain('Failed to read file')
      }
    })

    it('shows confirmation dialog with import summary', async () => {
      const pinia = createTestPinia()
      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      const validImportData = {
        tabs: [
          { name: 'Tab 1', color: '#3b82f6' },
        ],
        bookmarks: [
          { name: 'Bookmark 1', url: 'https://example.com', tabIndex: 0, groupIndices: [0] },
        ],
        groups: [
          { name: 'Group 1', color: '#3b82f6', tabIndex: 0 },
        ],
      }

      // Create a mock FileReader that captures callbacks
      const callbacks = {
        onload: null as ((e: { target: { result: string } }) => void) | null,
        onerror: null as (() => void) | null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        readAsTextImpl: (_file: File) => {
          // Simulate success by calling onload callback
          setTimeout(() => {
            if (callbacks.onload) {
              callbacks.onload({ target: { result: JSON.stringify(validImportData) } })
            }
          }, 0)
        },
        result: JSON.stringify(validImportData),
      }

      // Mock FileReader constructor
      const MockFileReader = createMockFileReaderClass(callbacks)
      global.FileReader = MockFileReader

      const fileInput = wrapper.find('input[type="file"]')
      const file = new File([JSON.stringify(validImportData)], 'test.json', { type: 'application/json' })

      // Use direct DOM manipulation instead of setValue()
      const inputElement = fileInput.element as HTMLInputElement
      if (inputElement) {
        simulateFileInput(inputElement, file)

        // Wait for async operations
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 50))
        await wrapper.vm.$nextTick()

        // Should show confirmation dialog
        expect(wrapper.text()).toContain('Confirm Import')
        expect(wrapper.text()).toContain('1 tab(s)')
        expect(wrapper.text()).toContain('1 bookmark(s)')
        expect(wrapper.text()).toContain('1 group(s)')
      }
    })

    it('validates import data structure', async () => {
      const pinia = createTestPinia()
      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      // Use data that will fail validation - missing required fields in bookmarks
      const invalidData = {
        bookmarks: [
          { name: 'Invalid Bookmark' }, // Missing required 'url' field
        ],
        groups: [
          { name: 'Invalid Group' }, // Missing required 'color' field
        ],
      }

      // Create a mock FileReader that captures callbacks
      const callbacks = {
        onload: null as ((e: { target: { result: string } }) => void) | null,
        onerror: null as (() => void) | null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        readAsTextImpl: (_file: File) => {
          // Simulate success by calling onload callback
          setTimeout(() => {
            if (callbacks.onload) {
              callbacks.onload({ target: { result: JSON.stringify(invalidData) } })
            }
          }, 0)
        },
        result: JSON.stringify(invalidData),
      }

      // Mock FileReader constructor
      const MockFileReader = createMockFileReaderClass(callbacks)
      global.FileReader = MockFileReader

      const fileInput = wrapper.find('input[type="file"]')
      const file = new File([JSON.stringify(invalidData)], 'test.json', { type: 'application/json' })

      // Use direct DOM manipulation instead of setValue()
      const inputElement = fileInput.element as HTMLInputElement
      if (inputElement) {
        simulateFileInput(inputElement, file)

        // Wait for async operations
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 50))
        await wrapper.vm.$nextTick()

        // Should show validation error (the actual error message is more specific)
        const errorText = wrapper.text()
        expect(errorText).toMatch(/Invalid (file format|group|bookmark)/)
      }
    })

    it('cancels import confirmation', async () => {
      const pinia = createTestPinia()
      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      const validImportData = {
        tabs: [{ name: 'Tab 1', color: '#3b82f6' }],
        bookmarks: [{ name: 'Bookmark 1', url: 'https://example.com', tabIndex: 0 }],
        groups: [{ name: 'Group 1', color: '#3b82f6', tabIndex: 0 }],
      }

      // Create a mock FileReader that captures callbacks
      const callbacks = {
        onload: null as ((e: { target: { result: string } }) => void) | null,
        onerror: null as (() => void) | null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        readAsTextImpl: (_file: File) => {
          // Simulate success by calling onload callback
          setTimeout(() => {
            if (callbacks.onload) {
              callbacks.onload({ target: { result: JSON.stringify(validImportData) } })
            }
          }, 0)
        },
        result: JSON.stringify(validImportData),
      }

      // Mock FileReader constructor
      const MockFileReader = createMockFileReaderClass(callbacks)
      global.FileReader = MockFileReader

      const fileInput = wrapper.find('input[type="file"]')
      const file = new File([JSON.stringify(validImportData)], 'test.json', { type: 'application/json' })

      // Use direct DOM manipulation instead of setValue()
      const inputElement = fileInput.element as HTMLInputElement
      if (inputElement) {
        simulateFileInput(inputElement, file)

        // Wait for async operations
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 50))
        await wrapper.vm.$nextTick()

        // Find cancel button in confirmation dialog
        const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel')
        expect(cancelButton).toBeDefined()
        await cancelButton!.trigger('click')
        await wrapper.vm.$nextTick()

        // Should hide confirmation dialog
        expect(wrapper.text()).not.toContain('Confirm Import')
      }
    })
  })
})

