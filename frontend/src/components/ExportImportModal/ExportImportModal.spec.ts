import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestPinia } from '@/test-utils'
import ExportImportModal from './ExportImportModal.vue'
import { useBookmarkStore } from '@/stores/bookmark/bookmark'
import { useGroupStore } from '@/stores/group/group'
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
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
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
      const bookmarkStore = useBookmarkStore()
      const groupStore = useGroupStore()

      bookmarkStore.bookmarks = createBookmarkArray(2)
      groupStore.groups = createGroupArray(2)

      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      // Create a real anchor element and spy on click
      const realLink = document.createElement('a')
      const clickSpy = vi.spyOn(realLink, 'click').mockImplementation(() => {})
      
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(realLink)

      const exportButton = wrapper.findAll('button').find((btn) => btn.text().includes('Export to JSON'))
      expect(exportButton).toBeDefined()
      await exportButton!.trigger('click')

      await wrapper.vm.$nextTick()

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(clickSpy).toHaveBeenCalled()
      expect(global.URL.createObjectURL).toHaveBeenCalled()
      
      // Clean up
      createElementSpy.mockRestore()
      clickSpy.mockRestore()
    })

    it('creates blob with correct data structure', async () => {
      const pinia = createTestPinia()
      const bookmarkStore = useBookmarkStore()
      const groupStore = useGroupStore()

      const bookmark = createBookmark({ name: 'Test Bookmark', url: 'https://example.com' })
      const group = createGroup({ name: 'Test Group', color: '#3b82f6' })
      bookmark.groupIds = [group.id]

      bookmarkStore.bookmarks = [bookmark]
      groupStore.groups = [group]

      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      // Create a real anchor element and spy on click
      const realLink = document.createElement('a')
      const clickSpy = vi.spyOn(realLink, 'click').mockImplementation(() => {})
      
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(realLink)

      const exportButton = wrapper.findAll('button').find((btn) => btn.text().includes('Export to JSON'))
      expect(exportButton).toBeDefined()
      await exportButton!.trigger('click')

      await wrapper.vm.$nextTick()

      expect(global.URL.createObjectURL).toHaveBeenCalled()
      const blobCall = (global.URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(blobCall).toBeInstanceOf(Blob)
      
      // Clean up
      createElementSpy.mockRestore()
      clickSpy.mockRestore()
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
      simulateFileInput(fileInput.element as HTMLInputElement, file)

      // Wait for async operations
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Should show error
      expect(wrapper.text()).toContain('Failed to read file')
    })

    it('shows confirmation dialog with import summary', async () => {
      const pinia = createTestPinia()
      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      const validImportData = {
        bookmarks: [
          { name: 'Bookmark 1', url: 'https://example.com', groupIds: [0] },
        ],
        groups: [
          { name: 'Group 1', color: '#3b82f6' },
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
              callbacks.onload({ target: { result: JSON.stringify(validImportData) } } as unknown as ProgressEvent<FileReader>)
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
      simulateFileInput(fileInput.element as HTMLInputElement, file)

      // Wait for async operations
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))
      await wrapper.vm.$nextTick()

      // Should show confirmation dialog
      expect(wrapper.text()).toContain('Confirm Import')
      expect(wrapper.text()).toContain('1 bookmark(s)')
      expect(wrapper.text()).toContain('1 group(s)')
    })

    it('validates import data structure', async () => {
      const pinia = createTestPinia()
      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      const invalidData = { invalid: 'data' }

      // Create a mock FileReader that captures callbacks
      const callbacks = {
        onload: null as ((e: { target: { result: string } }) => void) | null,
        onerror: null as (() => void) | null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        readAsTextImpl: (_file: File) => {
          // Simulate success by calling onload callback
          setTimeout(() => {
            if (callbacks.onload) {
              callbacks.onload({ target: { result: JSON.stringify(invalidData) } } as unknown as ProgressEvent<FileReader>)
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
      simulateFileInput(fileInput.element as HTMLInputElement, file)

      // Wait for async operations
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))
      await wrapper.vm.$nextTick()

      // Should show validation error
      expect(wrapper.text()).toContain('Invalid file format')
    })

    it('cancels import confirmation', async () => {
      const pinia = createTestPinia()
      const wrapper = mount(ExportImportModal, {
        global: {
          plugins: [pinia],
        },
      })

      const validImportData = {
        bookmarks: [{ name: 'Bookmark 1', url: 'https://example.com' }],
        groups: [{ name: 'Group 1', color: '#3b82f6' }],
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
              callbacks.onload({ target: { result: JSON.stringify(validImportData) } } as unknown as ProgressEvent<FileReader>)
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
      simulateFileInput(fileInput.element as HTMLInputElement, file)

      // Wait for async operations
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 10))
      await wrapper.vm.$nextTick()

      // Find cancel button in confirmation dialog
      const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel')
      expect(cancelButton).toBeDefined()
      await cancelButton!.trigger('click')
      await wrapper.vm.$nextTick()

      // Should hide confirmation dialog
      expect(wrapper.text()).not.toContain('Confirm Import')
    })
  })
})

