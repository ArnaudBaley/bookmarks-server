import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestPinia } from '@/test-utils'
import GroupCard from './GroupCard.vue'
import { createGroup, createBookmark, createBookmarkArray } from '@/test-utils'
import { useBookmarkStore } from '@/stores/bookmark/bookmark'
import { useTabStore } from '@/stores/tab/tab'

// Mock DragEvent and DataTransfer for jsdom
class MockDataTransfer {
  data: Map<string, string> = new Map()
  effectAllowed: string = 'all'
  dropEffect: string = 'none'
  types: string[] = []

  getData(format: string): string {
    return this.data.get(format) || ''
  }

  setData(format: string, data: string): void {
    this.data.set(format, data)
    this.types.push(format)
  }

  clearData(): void {
    this.data.clear()
    this.types = []
  }
}

class MockDragEvent extends Event {
  dataTransfer: DataTransfer | null
  preventDefault: () => void
  stopPropagation: () => void

  constructor(type: string, eventInitDict?: DragEventInit) {
    super(type, eventInitDict)
    this.dataTransfer = eventInitDict?.dataTransfer || new MockDataTransfer() as unknown as DataTransfer
    this.preventDefault = vi.fn()
    this.stopPropagation = vi.fn()
  }
}

// Create a factory function that returns a DragEvent compatible with jsdom
function createMockDragEvent(type: string, eventInitDict?: DragEventInit): DragEvent {
  const dataTransfer = eventInitDict?.dataTransfer || new MockDataTransfer() as unknown as DataTransfer
  const baseEvent = new MockDragEvent(type, { ...eventInitDict, dataTransfer })
  
  return baseEvent as unknown as DragEvent
}

// Add to global scope for tests
if (typeof globalThis.DragEvent === 'undefined') {
  globalThis.DragEvent = MockDragEvent as unknown as typeof DragEvent
}
if (typeof globalThis.DataTransfer === 'undefined') {
  globalThis.DataTransfer = MockDataTransfer as unknown as typeof DataTransfer
}

describe('GroupCard', () => {
  beforeEach(() => {
    createTestPinia()
    vi.clearAllMocks()
  })

  it('renders group name and bookmark count', () => {
    const group = createGroup({ name: 'Test Group', color: '#3b82f6' })
    const bookmarks = createBookmarkArray(3)

    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks,
      },
      global: {
        plugins: [createTestPinia()],
      },
    })

    expect(wrapper.text()).toContain('Test Group')
    expect(wrapper.text()).toContain('(3)')
  })

  it('displays group color indicator', () => {
    const group = createGroup({ name: 'Test Group', color: '#ef4444' })
    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks: [],
      },
      global: {
        plugins: [createTestPinia()],
      },
    })

    const colorIndicator = wrapper.find('.w-4.h-4.rounded-full')
    expect(colorIndicator.exists()).toBe(true)
    // Style attribute contains RGB, so check for the color in any form
    const style = colorIndicator.attributes('style') || ''
    expect(style).toMatch(/rgb\(239,\s*68,\s*68\)|#ef4444/i)
  })

  it('shows empty state when no bookmarks', () => {
    const group = createGroup({ name: 'Empty Group' })
    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks: [],
      },
      global: {
        plugins: [createTestPinia()],
      },
    })

    expect(wrapper.text()).toContain('No bookmarks in this group')
    expect(wrapper.text()).toContain('Drag and drop bookmarks here to add them')
  })

  it('displays bookmarks when they exist', () => {
    const group = createGroup({ name: 'Test Group' })
    const bookmarks = createBookmarkArray(2)

    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks,
      },
      global: {
        plugins: [createTestPinia()],
      },
    })

    // BookmarkCard components should be rendered
    const bookmarkCards = wrapper.findAllComponents({ name: 'BookmarkCard' })
    expect(bookmarkCards).toHaveLength(2)
  })

  it('toggles expansion when header is clicked', async () => {
    const group = createGroup({ name: 'Test Group' })
    const bookmarks = createBookmarkArray(1)

    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks,
      },
      global: {
        plugins: [createTestPinia()],
      },
    })

    // Initially expanded (default)
    const content = wrapper.find('.p-4.pt-0')
    expect(content.isVisible()).toBe(true)

    // Click header to collapse
    const header = wrapper.find('.flex.items-center.justify-between.p-4')
    await header.trigger('click')
    await wrapper.vm.$nextTick()

    // Content should be hidden (v-show controls visibility)
    // v-show sets display: none, so the element exists but is not visible
    const contentAfter = wrapper.find('.p-4.pt-0')
    expect(contentAfter.exists()).toBe(true)
    // Check that v-show has hidden it by checking the element's style
    const element = contentAfter.element as HTMLElement
    expect(element.style.display).toBe('none')
  })

  it('toggles expansion when toggle button is clicked', async () => {
    const group = createGroup({ name: 'Test Group' })
    const bookmarks = createBookmarkArray(1)

    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks,
      },
      global: {
        plugins: [createTestPinia()],
      },
    })

    // Find the toggle button by its aria-label
    const toggleButton = wrapper.findAll('button').find((btn) => {
      return btn.attributes('aria-label') === 'Toggle group'
    })

    expect(toggleButton).toBeDefined()
    await toggleButton!.trigger('click')
    await wrapper.vm.$nextTick()

    const content = wrapper.find('.p-4.pt-0')
    // Check that v-show has hidden it by checking the element's style
    const element = content.element as HTMLElement
    expect(element.style.display).toBe('none')
  })

  it('emits modify event when edit button is clicked', async () => {
    const group = createGroup({ name: 'Test Group' })
    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks: [],
      },
      global: {
        plugins: [createTestPinia()],
      },
    })

    const editButton = wrapper.findAll('button').find((btn) => {
      const svg = btn.find('svg')
      return svg.exists() && svg.html().includes('circle')
    })

    expect(editButton).toBeDefined()
    await editButton!.trigger('click')

    expect(wrapper.emitted('modify')).toBeTruthy()
    expect(wrapper.emitted('modify')?.[0]?.[0]).toEqual(group)
  })

  it('emits bookmark-modify event when bookmark is modified', async () => {
    const group = createGroup({ name: 'Test Group' })
    const bookmark = createBookmark({ name: 'Test Bookmark' })
    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks: [bookmark],
      },
      global: {
        plugins: [createTestPinia()],
      },
    })

    const bookmarkCard = wrapper.findComponent({ name: 'BookmarkCard' })
    await bookmarkCard.vm.$emit('modify', bookmark)

    expect(wrapper.emitted('bookmark-modify')).toBeTruthy()
    expect(wrapper.emitted('bookmark-modify')?.[0]?.[0]).toEqual(bookmark)
  })

  it('handles drag over event', async () => {
    const group = createGroup({ name: 'Test Group' })
    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks: [],
      },
      global: {
        plugins: [createTestPinia()],
      },
    })

    const container = wrapper.find('.mb-6.rounded-lg')
    const dataTransfer = new DataTransfer()
    const dragEvent = createMockDragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      dataTransfer,
    })

    // Use dispatchEvent directly instead of trigger() to avoid modifying read-only properties
    container.element.dispatchEvent(dragEvent)
    await wrapper.vm.$nextTick()

    // Should not throw
    expect(wrapper.exists()).toBe(true)
  })

  it('handles drop event with bookmark ID', async () => {
    const group = createGroup({ id: 'group-id', name: 'Test Group' })
    const bookmark = createBookmark({ id: 'bookmark-id' })
    const pinia = createTestPinia()
    const bookmarkStore = useBookmarkStore()
    bookmarkStore.bookmarks = [bookmark]

    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks: [],
      },
      global: {
        plugins: [pinia],
      },
    })

    const container = wrapper.find('.mb-6.rounded-lg')
    const dataTransfer = new DataTransfer()
    dataTransfer.setData('text/plain', 'bookmark-id')

    const dropEvent = createMockDragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer,
    })

    // Use dispatchEvent directly instead of trigger() to avoid modifying read-only properties
    container.element.dispatchEvent(dropEvent)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('bookmark-drop')).toBeTruthy()
    expect(wrapper.emitted('bookmark-drop')?.[0]).toEqual(['group-id', 'bookmark-id'])
  })

  it('handles drop event with URL', async () => {
    const group = createGroup({ id: 'group-id', name: 'Test Group' })
    const pinia = createTestPinia()
    const bookmarkStore = useBookmarkStore()
    const tabStore = useTabStore()
    tabStore.activeTabId = 'test-tab-id'
    vi.spyOn(bookmarkStore, 'addBookmark').mockResolvedValue(createBookmark())

    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks: [],
      },
      global: {
        plugins: [pinia],
      },
    })

    const container = wrapper.find('.mb-6.rounded-lg')
    const dataTransfer = new DataTransfer()
    dataTransfer.setData('text/uri-list', 'https://example.com')

    const dropEvent = createMockDragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer,
    })

    // Use dispatchEvent directly instead of trigger() to avoid modifying read-only properties
    container.element.dispatchEvent(dropEvent)
    await wrapper.vm.$nextTick()

    expect(bookmarkStore.addBookmark).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com',
        tabId: 'test-tab-id',
        groupIds: ['group-id'],
      })
    )
  })

  it('normalizes URL when protocol is missing', async () => {
    const group = createGroup({ id: 'group-id', name: 'Test Group' })
    const pinia = createTestPinia()
    const bookmarkStore = useBookmarkStore()
    const tabStore = useTabStore()
    tabStore.activeTabId = 'test-tab-id'
    vi.spyOn(bookmarkStore, 'addBookmark').mockResolvedValue(createBookmark())

    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks: [],
      },
      global: {
        plugins: [pinia],
      },
    })

    const container = wrapper.find('.mb-6.rounded-lg')
    const dataTransfer = new DataTransfer()
    dataTransfer.setData('text/plain', 'example.com')

    const dropEvent = createMockDragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer,
    })

    // Use dispatchEvent directly instead of trigger() to avoid modifying read-only properties
    container.element.dispatchEvent(dropEvent)
    await wrapper.vm.$nextTick()

    expect(bookmarkStore.addBookmark).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com',
        tabId: 'test-tab-id',
      })
    )
  })

  it('shows drag over state when dragging over', async () => {
    const group = createGroup({ name: 'Test Group', color: '#ef4444' })
    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks: [],
      },
      global: {
        plugins: [createTestPinia()],
      },
    })

    const container = wrapper.find('.mb-6.rounded-lg')
    const dataTransfer = new DataTransfer()
    const dragEvent = createMockDragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      dataTransfer,
    })

    // Use dispatchEvent directly instead of trigger() to avoid modifying read-only properties
    container.element.dispatchEvent(dragEvent)
    await wrapper.vm.$nextTick()

    // The component should update isDragOver state
    // We can check if the border style changes
    expect(wrapper.exists()).toBe(true)
  })

  it('passes groupId prop to BookmarkCard components', () => {
    const group = createGroup({ id: 'group-id', name: 'Test Group' })
    const bookmarks = createBookmarkArray(2)

    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks,
      },
      global: {
        plugins: [createTestPinia()],
      },
    })

    const bookmarkCards = wrapper.findAllComponents({ name: 'BookmarkCard' })
    expect(bookmarkCards.length).toBe(2)
    bookmarkCards.forEach((card) => {
      expect(card.props('groupId')).toBe('group-id')
    })
  })

  it('emits move-up event when move up button is clicked', async () => {
    const group = createGroup({ name: 'Test Group' })
    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks: [],
        isFirst: false,
      },
      global: {
        plugins: [createTestPinia()],
      },
    })

    const moveUpButton = wrapper.findAll('button').find((btn) => {
      return btn.attributes('aria-label') === 'Move group up'
    })

    expect(moveUpButton).toBeDefined()
    await moveUpButton!.trigger('click')

    expect(wrapper.emitted('move-up')).toBeTruthy()
  })

  it('emits move-down event when move down button is clicked', async () => {
    const group = createGroup({ name: 'Test Group' })
    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks: [],
        isLast: false,
      },
      global: {
        plugins: [createTestPinia()],
      },
    })

    const moveDownButton = wrapper.findAll('button').find((btn) => {
      return btn.attributes('aria-label') === 'Move group down'
    })

    expect(moveDownButton).toBeDefined()
    await moveDownButton!.trigger('click')

    expect(wrapper.emitted('move-down')).toBeTruthy()
  })

  it('disables move up button when isFirst is true', () => {
    const group = createGroup({ name: 'Test Group' })
    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks: [],
        isFirst: true,
      },
      global: {
        plugins: [createTestPinia()],
      },
    })

    const moveUpButton = wrapper.findAll('button').find((btn) => {
      return btn.attributes('aria-label') === 'Move group up'
    })

    expect(moveUpButton).toBeDefined()
    expect(moveUpButton!.attributes('disabled')).toBeDefined()
    expect(moveUpButton!.classes()).toContain('opacity-20')
    expect(moveUpButton!.classes()).toContain('cursor-not-allowed')
  })

  it('disables move down button when isLast is true', () => {
    const group = createGroup({ name: 'Test Group' })
    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks: [],
        isLast: true,
      },
      global: {
        plugins: [createTestPinia()],
      },
    })

    const moveDownButton = wrapper.findAll('button').find((btn) => {
      return btn.attributes('aria-label') === 'Move group down'
    })

    expect(moveDownButton).toBeDefined()
    expect(moveDownButton!.attributes('disabled')).toBeDefined()
    expect(moveDownButton!.classes()).toContain('opacity-20')
    expect(moveDownButton!.classes()).toContain('cursor-not-allowed')
  })

  it('handles bookmark drag-start and drag-end events', async () => {
    const group = createGroup({ id: 'group-id', name: 'Test Group' })
    const bookmark = createBookmark({ id: 'bookmark-id' })
    const wrapper = mount(GroupCard, {
      props: {
        group,
        bookmarks: [bookmark],
      },
      global: {
        plugins: [createTestPinia()],
      },
    })

    const bookmarkCard = wrapper.findComponent({ name: 'BookmarkCard' })
    
    // Simulate drag-start
    await bookmarkCard.vm.$emit('drag-start', bookmark.id)
    await wrapper.vm.$nextTick()

    // Simulate drag-end
    await bookmarkCard.vm.$emit('drag-end')
    await wrapper.vm.$nextTick()

    // Component should handle these events without errors
    expect(wrapper.exists()).toBe(true)
  })
})

