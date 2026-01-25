import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestPinia } from '@/test-utils'
import ExportImportModal from './ExportImportModal.vue'
import { useTabStore } from '@/stores/tab/tab'
import { useGroupStore } from '@/stores/group/group'
import { useBookmarkStore } from '@/stores/bookmark/bookmark'
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

  describe('HTML Import functionality', () => {
    it('shows HTML import option in UI', () => {
      const pinia = createTestPinia()
      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.text()).toContain('HTML (Browser Bookmarks)')
      const htmlRadio = wrapper.find('input[value="html"]')
      expect(htmlRadio.exists()).toBe(true)
    })

    it('parses HTML bookmarks file correctly', async () => {
      const pinia = createTestPinia()
      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      const htmlContent = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL>
  <DT><H3>Folder 1</H3>
  <DL>
    <DT><A HREF="https://example.com">Example Bookmark</A>
    <DT><H3>Nested Folder</H3>
    <DL>
      <DT><A HREF="https://example2.com">Another Bookmark</A>
    </DL>
  </DL>
  <DT><A HREF="https://example3.com">Ungrouped Bookmark</A>
</DL>`

      // Create a mock FileReader that captures callbacks
      const callbacks = {
        onload: null as ((e: { target: { result: string } }) => void) | null,
        onerror: null as (() => void) | null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        readAsTextImpl: (_file: File) => {
          // Simulate success by calling onload callback
          setTimeout(() => {
            if (callbacks.onload) {
              callbacks.onload({ target: { result: htmlContent } })
            }
          }, 0)
        },
        result: htmlContent,
      }

      // Mock FileReader constructor
      const MockFileReader = createMockFileReaderClass(callbacks)
      global.FileReader = MockFileReader

      // Select HTML import type
      const htmlRadio = wrapper.find('input[value="html"]')
      await htmlRadio.setValue(true)
      await wrapper.vm.$nextTick()

      const fileInput = wrapper.find('input[type="file"]')
      const file = new File([htmlContent], 'bookmarks.html', { type: 'text/html' })

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
        expect(wrapper.text()).toContain('1 new tab')
        expect(wrapper.text()).toContain('bookmarks')
        // Should show that it's adding, not replacing
        expect(wrapper.text()).toContain('Existing data will be preserved')
        
        // Check that ungrouped bookmarks have no groupIndices (they'll appear in "Ungrouped" section)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vm = wrapper.vm as any
        const importData = vm.importData
        expect(importData).toBeDefined()
        expect(importData.groups).toBeDefined()
        // Should have groups for folders: "Folder 1" and "Nested Folder"
        expect(importData.groups.length).toBeGreaterThanOrEqual(2)
        // Should NOT have an "Ungrouped" group (ungrouped is a UI section, not a group)
        const ungroupedGroup = importData.groups.find((g: { name: string }) => g.name === 'Ungrouped')
        expect(ungroupedGroup).toBeUndefined()
        // Should have 1 ungrouped bookmark (with no groupIndices)
        const ungroupedBookmarks = importData.bookmarks.filter((b: { groupIndices?: number[] }) => {
          return !b.groupIndices || b.groupIndices.length === 0
        })
        expect(ungroupedBookmarks.length).toBeGreaterThanOrEqual(1)
      }
    })

    it('shows correct file input accept attribute for HTML', async () => {
      const pinia = createTestPinia()
      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      // Select HTML import type
      const htmlRadio = wrapper.find('input[value="html"]')
      await htmlRadio.setValue(true)
      await wrapper.vm.$nextTick()

      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.attributes('accept')).toBe('.html,.htm,text/html')
    })

    it('shows correct file input accept attribute for JSON', async () => {
      const pinia = createTestPinia()
      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      // Select JSON import type (default)
      const jsonRadio = wrapper.find('input[value="json"]')
      await jsonRadio.setValue(true)
      await wrapper.vm.$nextTick()

      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.attributes('accept')).toBe('.json,application/json')
    })

    it('creates new tab with filename for HTML import', async () => {
      const pinia = createTestPinia()
      const tabStore = useTabStore()
      const groupStore = useGroupStore()
      const bookmarkStore = useBookmarkStore()

      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      const htmlContent = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL>
  <DT><H3>My Folder</H3>
  <DL>
    <DT><A HREF="https://example.com">Test Bookmark</A>
  </DL>
</DL>`

      // Create a mock FileReader that captures callbacks
      const callbacks = {
        onload: null as ((e: { target: { result: string } }) => void) | null,
        onerror: null as (() => void) | null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        readAsTextImpl: (_file: File) => {
          setTimeout(() => {
            if (callbacks.onload) {
              callbacks.onload({ target: { result: htmlContent } })
            }
          }, 0)
        },
        result: htmlContent,
      }

      const MockFileReader = createMockFileReaderClass(callbacks)
      global.FileReader = MockFileReader

      // Select HTML import type
      const htmlRadio = wrapper.find('input[value="html"]')
      await htmlRadio.setValue(true)
      await wrapper.vm.$nextTick()

      const fileInput = wrapper.find('input[type="file"]')
      const file = new File([htmlContent], 'my-bookmarks.html', { type: 'text/html' })

      const inputElement = fileInput.element as HTMLInputElement
      if (inputElement) {
        simulateFileInput(inputElement, file)

        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 50))
        await wrapper.vm.$nextTick()

        // Confirm import
        const confirmButton = wrapper.findAll('button').find((btn) => btn.text().includes('Confirm Import'))
        expect(confirmButton).toBeDefined()
        
        // Mock the store methods
        const addTabSpy = vi.spyOn(tabStore, 'addTab').mockResolvedValue({
          id: 'new-tab-id',
          name: 'my-bookmarks',
          color: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        const addGroupSpy = vi.spyOn(groupStore, 'addGroup').mockResolvedValue({
          id: 'new-group-id',
          name: 'My Folder',
          color: '#3b82f6',
          tabId: 'new-tab-id',
          orderIndex: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        const addBookmarkSpy = vi.spyOn(bookmarkStore, 'addBookmark').mockResolvedValue({
          id: 'new-bookmark-id',
          name: 'Test Bookmark',
          url: 'https://example.com',
          tabId: 'new-tab-id',
          groupIds: ['new-group-id'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        vi.spyOn(tabStore, 'fetchTabs').mockResolvedValue(undefined)
        vi.spyOn(bookmarkStore, 'fetchBookmarks').mockResolvedValue(undefined)
        vi.spyOn(groupStore, 'fetchGroups').mockResolvedValue(undefined)

        await confirmButton!.trigger('click')

        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 1000))
        await wrapper.vm.$nextTick()

        // Verify tab was created with filename (without extension)
        expect(addTabSpy).toHaveBeenCalledWith({ name: 'my-bookmarks' })
        expect(addGroupSpy).toHaveBeenCalled()
        expect(addBookmarkSpy).toHaveBeenCalled()
      }
    })
  })
})

