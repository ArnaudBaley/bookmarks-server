import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BookmarkCard from './BookmarkCard.vue'
import { createBookmark, mockWindowOpen } from '@/test-utils'

describe('BookmarkCard', () => {
  let mockOpen: ReturnType<typeof mockWindowOpen>

  beforeEach(() => {
    mockOpen = mockWindowOpen()
    // Mock DragEvent for jsdom
    if (typeof global.DragEvent === 'undefined') {
      global.DragEvent = class DragEvent extends Event {
        dataTransfer: DataTransfer | null = null
        constructor(type: string, eventInitDict?: DragEventInit) {
          super(type, eventInitDict)
          this.dataTransfer = eventInitDict?.dataTransfer || null
        }
      } as typeof DragEvent
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders bookmark name correctly', () => {
    const bookmark = createBookmark({ name: 'Test Bookmark', url: 'https://example.com' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    expect(wrapper.text()).toContain('Test Bookmark')
  })

  it('renders bookmark icon with correct favicon URL when no stored favicon', () => {
    const bookmark = createBookmark({ url: 'https://example.com' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toContain('google.com/s2/favicons')
    expect(img.attributes('src')).toContain('example.com')
    expect(img.attributes('alt')).toBe('Test Bookmark icon')
  })

  it('renders stored favicon when available', () => {
    const storedFavicon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='
    const bookmark = createBookmark({ url: 'https://example.com', favicon: storedFavicon })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe(storedFavicon)
  })

  it('falls back to Google favicon when stored favicon is null', () => {
    const bookmark = createBookmark({ url: 'https://example.com', favicon: null })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toContain('google.com/s2/favicons')
  })

  it('opens URL in new window when card is clicked', () => {
    const bookmark = createBookmark({ url: 'https://example.com' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const card = wrapper.find('[role="button"]')
    card.trigger('click')

    expect(mockOpen).toHaveBeenCalledTimes(1)
    expect(mockOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer')
  })

  it('opens URL when Enter key is pressed on card', () => {
    const bookmark = createBookmark({ url: 'https://example.com' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const card = wrapper.find('[role="button"]')
    card.trigger('keyup.enter')

    expect(mockOpen).toHaveBeenCalledTimes(1)
    expect(mockOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer')
  })

  it('toggles edit mode when option button is clicked', async () => {
    const bookmark = createBookmark({ id: 'test-id', name: 'Test Bookmark' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    // Initially, option button should be visible
    const optionButton = wrapper.find('button[aria-label="Options"]')
    expect(optionButton.exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Modify bookmark"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Delete bookmark"]').exists()).toBe(false)

    // Click option button to enter edit mode
    await optionButton.trigger('click')

    // Now modify and delete buttons should be visible, option button should not
    expect(wrapper.find('button[aria-label="Options"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Modify bookmark"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Delete bookmark"]').exists()).toBe(true)
  })

  it('emits modify event when modify button is clicked in edit mode', async () => {
    const bookmark = createBookmark({ id: 'test-id', name: 'Test Bookmark' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    // Enter edit mode
    const optionButton = wrapper.find('button[aria-label="Options"]')
    await optionButton.trigger('click')

    // Click modify button
    const modifyButton = wrapper.find('button[aria-label="Modify bookmark"]')
    await modifyButton.trigger('click')

    expect(wrapper.emitted('modify')).toBeTruthy()
    expect(wrapper.emitted('modify')?.[0]).toEqual([bookmark])
    // Edit mode should be closed after modify
    expect(wrapper.find('button[aria-label="Options"]').exists()).toBe(true)
  })

  it('emits delete event when delete button is clicked', async () => {
    const bookmark = createBookmark({ id: 'test-id', name: 'Test Bookmark' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    // Enter edit mode
    const optionButton = wrapper.find('button[aria-label="Options"]')
    await optionButton.trigger('click')

    // Click delete button
    const deleteButton = wrapper.find('button[aria-label="Delete bookmark"]')
    await deleteButton.trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]).toEqual(['test-id'])
    // Edit mode should be closed after delete
    expect(wrapper.find('button[aria-label="Options"]').exists()).toBe(true)
  })

  it('handles invalid URLs in getFaviconUrl by returning default favicon', () => {
    const bookmark = createBookmark({ url: 'invalid-url' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe('/favicon.ico')
  })

  it('handles URLs without protocol in getFaviconUrl', () => {
    // This shouldn't happen in practice, but test edge case
    const bookmark = createBookmark({ url: '//example.com' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const img = wrapper.find('img')
    // Should handle the URL parsing gracefully
    expect(img.exists()).toBe(true)
  })

  it('renders option button with correct aria-label', () => {
    const bookmark = createBookmark()
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const optionButton = wrapper.find('button[aria-label="Options"]')
    expect(optionButton.exists()).toBe(true)
    // Check that it contains an SVG (the three dots icon)
    const svg = optionButton.find('svg')
    expect(svg.exists()).toBe(true)
  })

  it('has correct CSS classes for styling', () => {
    const bookmark = createBookmark()
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const card = wrapper.find('[role="button"]')
    expect(card.classes()).toContain('flex')
    expect(card.classes()).toContain('flex-row')
  })

  it('does not open URL when option button is clicked', async () => {
    const bookmark = createBookmark({ url: 'https://example.com' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const optionButton = wrapper.find('button[aria-label="Options"]')
    await optionButton.trigger('click')

    // Should not have opened the URL
    expect(mockOpen).not.toHaveBeenCalled()
    // Should have entered edit mode
    expect(wrapper.find('button[aria-label="Modify bookmark"]').exists()).toBe(true)
  })

  it('does not open URL when in edit mode and card is clicked', async () => {
    const bookmark = createBookmark({ url: 'https://example.com' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    // Enter edit mode
    const optionButton = wrapper.find('button[aria-label="Options"]')
    await optionButton.trigger('click')

    // Click on the card
    const card = wrapper.find('[role="button"]')
    await card.trigger('click')

    // Should not have opened the URL when in edit mode
    expect(mockOpen).not.toHaveBeenCalled()
  })

  it('closes edit mode when clicking outside the card', async () => {
    const bookmark = createBookmark({ id: 'test-id', name: 'Test Bookmark' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
      attachTo: document.body,
    })

    // Enter edit mode
    const optionButton = wrapper.find('button[aria-label="Options"]')
    await optionButton.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button[aria-label="Modify bookmark"]').exists()).toBe(true)

    // Create an element outside the card to click on
    const outsideElement = document.createElement('div')
    document.body.appendChild(outsideElement)

    // Simulate click outside by directly calling the handler with the outside element as target
    const clickEvent = new MouseEvent('click', { bubbles: true })
    Object.defineProperty(clickEvent, 'target', {
      writable: false,
      value: outsideElement,
    })
    document.dispatchEvent(clickEvent)

    await wrapper.vm.$nextTick()

    // Edit mode should be closed
    expect(wrapper.find('button[aria-label="Options"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Modify bookmark"]').exists()).toBe(false)

    // Cleanup
    document.body.removeChild(outsideElement)
    wrapper.unmount()
  })

  it('handles drag start event', async () => {
    const bookmark = createBookmark({ id: 'test-id', name: 'Test Bookmark' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const card = wrapper.find('[role="button"]')
    const setDataSpy = vi.fn()
    const dragEvent = new DragEvent('dragstart', { bubbles: true })
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        effectAllowed: '',
        setData: setDataSpy,
      },
      writable: true,
      configurable: true,
    })

    // Dispatch event directly on the element
    card.element.dispatchEvent(dragEvent)
    await wrapper.vm.$nextTick()

    expect(setDataSpy).toHaveBeenCalledWith('text/plain', 'test-id')
    expect(dragEvent.dataTransfer?.effectAllowed).toBe('move')
    expect(wrapper.emitted('drag-start')).toBeTruthy()
  })

  it('handles drag end event and restores opacity', async () => {
    const bookmark = createBookmark({ id: 'test-id', name: 'Test Bookmark' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const card = wrapper.find('[role="button"]')
    const dragEvent = new DragEvent('dragend', { bubbles: true })
    Object.defineProperty(dragEvent, 'target', {
      value: card.element,
      writable: true,
      configurable: true,
    })

    // Set opacity to 0.5 first
    ;(card.element as HTMLElement).style.opacity = '0.5'

    // Dispatch event directly on the element
    card.element.dispatchEvent(dragEvent)
    await wrapper.vm.$nextTick()

    expect((card.element as HTMLElement).style.opacity).toBe('1')
    expect(wrapper.emitted('drag-end')).toBeTruthy()
  })

  it('handles drag start when dataTransfer is null', async () => {
    const bookmark = createBookmark({ id: 'test-id', name: 'Test Bookmark' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const card = wrapper.find('[role="button"]')
    const dragEvent = new DragEvent('dragstart', { bubbles: true })
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: null,
      writable: true,
      configurable: true,
    })

    // Should not throw error - dispatch event directly
    card.element.dispatchEvent(dragEvent)
    await wrapper.vm.$nextTick()
  })

  it('handles drag end when target is not HTMLElement', async () => {
    const bookmark = createBookmark({ id: 'test-id', name: 'Test Bookmark' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const card = wrapper.find('[role="button"]')
    const dragEvent = new DragEvent('dragend', { bubbles: true })
    Object.defineProperty(dragEvent, 'target', {
      value: null,
      writable: true,
      configurable: true,
    })

    // Should not throw error - dispatch event directly
    card.element.dispatchEvent(dragEvent)
    await wrapper.vm.$nextTick()
  })

  it('shows drag handle when groupId prop is provided', () => {
    const bookmark = createBookmark({ id: 'test-id', name: 'Test Bookmark' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark, groupId: 'group-123' },
    })

    const dragHandle = wrapper.find('.cursor-grab')
    expect(dragHandle.exists()).toBe(true)
  })

  it('does not show drag handle when groupId prop is not provided', () => {
    const bookmark = createBookmark({ id: 'test-id', name: 'Test Bookmark' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const dragHandle = wrapper.find('.cursor-grab')
    expect(dragHandle.exists()).toBe(false)
  })

  it('sets reorder-specific data when groupId is provided', async () => {
    const bookmark = createBookmark({ id: 'test-id', name: 'Test Bookmark' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark, groupId: 'group-123' },
    })

    const card = wrapper.find('[role="button"]')
    const setDataSpy = vi.fn()
    const dragEvent = new DragEvent('dragstart', { bubbles: true })
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        effectAllowed: '',
        setData: setDataSpy,
      },
      writable: true,
      configurable: true,
    })

    card.element.dispatchEvent(dragEvent)
    await wrapper.vm.$nextTick()

    expect(setDataSpy).toHaveBeenCalledWith('text/plain', 'test-id')
    expect(setDataSpy).toHaveBeenCalledWith('application/x-bookmark-reorder', 'test-id')
    expect(setDataSpy).toHaveBeenCalledWith('application/x-bookmark-source-group', 'group-123')
  })

})

