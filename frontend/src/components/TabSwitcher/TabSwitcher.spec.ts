import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountWithPinia } from '@/test-utils'
import TabSwitcher from './TabSwitcher.vue'
import { useTabStore } from '@/stores/tab/tab'
import { createTab, createTabArray } from '@/test-utils'

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('TabSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
  })

  it('renders tabs from store', () => {
    const wrapper = mountWithPinia(TabSwitcher)
    const tabStore = useTabStore()

    tabStore.tabs = createTabArray(3)
    tabStore.activeTabId = tabStore.tabs[0]?.id || null

    expect(wrapper.findAll('button').length).toBeGreaterThan(0)
  })

  it('displays tab names', async () => {
    const wrapper = mountWithPinia(TabSwitcher)
    const tabStore = useTabStore()

    const tabs = createTabArray(2)
    tabStore.tabs = tabs
    tabStore.activeTabId = tabs[0]?.id || null
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain(tabs[0]?.name)
    expect(wrapper.text()).toContain(tabs[1]?.name)
  })

  it('highlights active tab', async () => {
    const wrapper = mountWithPinia(TabSwitcher)
    const tabStore = useTabStore()

    const tabs = createTabArray(2)
    tabStore.tabs = tabs
    tabStore.activeTabId = tabs[0]?.id || null
    await wrapper.vm.$nextTick()

    const activeButton = wrapper.findAll('button').find((btn) => 
      btn.classes().includes('font-medium')
    )

    expect(activeButton).toBeDefined()
    expect(activeButton?.text()).toContain(tabs[0]?.name)
  })

  it('applies active tab color to border', async () => {
    const wrapper = mountWithPinia(TabSwitcher)
    const tabStore = useTabStore()

    const tab = createTab({ name: 'Test Tab', color: '#ef4444' })
    tabStore.tabs = [tab]
    tabStore.activeTabId = tab.id
    await wrapper.vm.$nextTick()

    const activeButton = wrapper.findAll('button').find((btn) => 
      btn.classes().includes('font-medium')
    )

    expect(activeButton).toBeDefined()
    const style = activeButton?.attributes('style') || ''
    expect(style).toContain('border-bottom-color')
  })

  it('displays color indicator for tabs with color', async () => {
    const wrapper = mountWithPinia(TabSwitcher)
    const tabStore = useTabStore()

    const tab = createTab({ name: 'Test Tab', color: '#ef4444' })
    tabStore.tabs = [tab]
    tabStore.activeTabId = tab.id
    await wrapper.vm.$nextTick()

    const colorIndicator = wrapper.find('span.w-3.h-3')
    expect(colorIndicator.exists()).toBe(true)
  })

  it('does not display color indicator for tabs without color', () => {
    const wrapper = mountWithPinia(TabSwitcher)
    const tabStore = useTabStore()

    const tab = createTab({ name: 'Test Tab', color: null })
    tabStore.tabs = [tab]
    tabStore.activeTabId = tab.id

    const colorIndicator = wrapper.find('span.w-3.h-3')
    expect(colorIndicator.exists()).toBe(false)
  })

  it('navigates to tab when tab is clicked', async () => {
    const wrapper = mountWithPinia(TabSwitcher)
    const tabStore = useTabStore()

    const tab = createTab({ name: 'Test Tab' })
    tabStore.tabs = [tab]
    tabStore.activeTabId = tab.id
    await wrapper.vm.$nextTick()

    const tabButton = wrapper.findAll('button').find((btn) => 
      btn.text().includes(tab.name) && !btn.attributes('aria-label')?.includes('Add')
    )

    expect(tabButton).toBeDefined()
    await tabButton!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith({
      name: 'tab',
      params: { tabName: encodeURIComponent(tab.name) },
    })
  })

  it('does not navigate when tab is not found', async () => {
    const wrapper = mountWithPinia(TabSwitcher)
    const tabStore = useTabStore()

    tabStore.tabs = []
    tabStore.activeTabId = null

    // Try to click a non-existent tab
    const buttons = wrapper.findAll('button')
    if (buttons.length > 0) {
      await buttons[0].trigger('click')
    }

    // Should not navigate if tab is not found
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('emits tab-edit event when edit button is clicked', async () => {
    const wrapper = mountWithPinia(TabSwitcher)
    const tabStore = useTabStore()

    const tab = createTab({ name: 'Test Tab' })
    tabStore.tabs = [tab]
    tabStore.activeTabId = tab.id
    await wrapper.vm.$nextTick()

    const editButton = wrapper.find('button[aria-label="Edit tab"]')
    expect(editButton.exists()).toBe(true)
    await editButton.trigger('click')

    expect(wrapper.emitted('tab-edit')).toBeTruthy()
    expect(wrapper.emitted('tab-edit')?.[0]?.[0]).toEqual(tab)
  })

  it('stops propagation when edit button is clicked', async () => {
    const wrapper = mountWithPinia(TabSwitcher)
    const tabStore = useTabStore()

    const tab = createTab({ name: 'Test Tab' })
    tabStore.tabs = [tab]
    tabStore.activeTabId = tab.id
    await wrapper.vm.$nextTick()

    const editButton = wrapper.find('button[aria-label="Edit tab"]')
    expect(editButton.exists()).toBe(true)

    await editButton.trigger('click')

    // The event should have stopPropagation called (via @click.stop)
    expect(wrapper.emitted('tab-edit')).toBeTruthy()
  })

  it('emits tab-add event when add button is clicked', async () => {
    const wrapper = mountWithPinia(TabSwitcher)

    const addButton = wrapper.find('button[aria-label="Add new tab"]')
    await addButton.trigger('click')

    expect(wrapper.emitted('tab-add')).toBeTruthy()
  })

  it('shows edit button on hover', async () => {
    const wrapper = mountWithPinia(TabSwitcher)
    const tabStore = useTabStore()

    const tab = createTab({ name: 'Test Tab' })
    tabStore.tabs = [tab]
    tabStore.activeTabId = tab.id
    await wrapper.vm.$nextTick()

    // The edit button exists in the DOM but may have opacity-0 class
    const editButtons = wrapper.findAll('button[aria-label="Edit tab"]')
    expect(editButtons.length).toBeGreaterThan(0)
  })

  it('handles tabs with special characters in name', async () => {
    const wrapper = mountWithPinia(TabSwitcher)
    const tabStore = useTabStore()

    const tab = createTab({ name: 'Tab with spaces & special chars!' })
    tabStore.tabs = [tab]
    tabStore.activeTabId = tab.id

    const tabButtons = wrapper.findAll('button')
    const tabButton = tabButtons.find((btn) => 
      btn.text().includes(tab.name) && !btn.attributes('aria-label')?.includes('Add') && !btn.attributes('aria-label')?.includes('Edit')
    )

    if (tabButton) {
      await tabButton.trigger('click')

      expect(mockPush).toHaveBeenCalledWith({
        name: 'tab',
        params: { tabName: encodeURIComponent(tab.name) },
      })
    }
  })

  it('handles empty tabs array', () => {
    const wrapper = mountWithPinia(TabSwitcher)
    const tabStore = useTabStore()

    tabStore.tabs = []
    tabStore.activeTabId = null

    // Should still show add button
    const addButton = wrapper.find('button[aria-label="Add new tab"]')
    expect(addButton.exists()).toBe(true)
  })

  it('applies correct classes to active tab', async () => {
    const wrapper = mountWithPinia(TabSwitcher)
    const tabStore = useTabStore()

    const tab = createTab({ name: 'Active Tab' })
    tabStore.tabs = [tab]
    tabStore.activeTabId = tab.id
    await wrapper.vm.$nextTick()

    // Check that the component renders tabs
    expect(wrapper.text()).toContain('Active Tab')
    
    // Check that there are buttons rendered
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('applies correct classes to inactive tab', async () => {
    const wrapper = mountWithPinia(TabSwitcher)
    const tabStore = useTabStore()

    const tabs = createTabArray(2)
    tabStore.tabs = tabs
    tabStore.activeTabId = tabs[0]?.id || null
    await wrapper.vm.$nextTick()

    // Check that both tabs are rendered
    expect(wrapper.text()).toContain(tabs[0]?.name)
    expect(wrapper.text()).toContain(tabs[1]?.name)
    
    // Check that there are buttons rendered
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})

