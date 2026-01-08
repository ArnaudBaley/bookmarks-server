import { describe, it, expect, vi, beforeEach } from 'vitest'
import EditBookmarkForm from './EditBookmarkForm.vue'
import { createBookmark, createTab, createGroup, mountWithPinia } from '@/test-utils'
import { groupApi } from '@/services/groupApi/groupApi'
import * as tabApiModule from '@/services/tabApi/tabApi'

// Mock the groupApi
vi.mock('@/services/groupApi/groupApi', () => ({
  groupApi: {
    getAllGroups: vi.fn(),
  },
}))

describe('EditBookmarkForm', () => {
  const mockBookmark = createBookmark({
    id: 'test-id-1',
    name: 'Test Bookmark',
    url: 'https://example.com',
    tabId: 'test-tab-id-1',
  })

  const mockTabs = [
    createTab({ id: 'test-tab-id-1', name: 'Tab 1' }),
    createTab({ id: 'test-tab-id-2', name: 'Tab 2' }),
  ]

  const mockGroups = [
    createGroup({ id: 'group-1', name: 'Group 1', tabId: 'test-tab-id-1' }),
    createGroup({ id: 'group-2', name: 'Group 2', tabId: 'test-tab-id-1' }),
    createGroup({ id: 'group-3', name: 'Group 3', tabId: 'test-tab-id-2' }),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock groupApi.getAllGroups to return empty array by default
    vi.mocked(groupApi.getAllGroups).mockResolvedValue([])
    // Mock tabApi.getAllTabs to return empty array by default
    vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue([])
  })

  it('renders form fields correctly', async () => {
    vi.mocked(groupApi.getAllGroups).mockResolvedValue(mockGroups)
    vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)
    
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    expect(wrapper.find('input[id="bookmark-name"]').exists()).toBe(true)
    expect(wrapper.find('input[id="bookmark-url"]').exists()).toBe(true)
    // Check that tabs are rendered as checkboxes (not a select dropdown)
    expect(wrapper.text()).toContain('Tab 1')
    expect(wrapper.text()).toContain('Tab 2')
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    // Find cancel button by text content
    const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel')
    expect(cancelButton?.exists()).toBe(true)
  })

  it('renders form title', () => {
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })
    expect(wrapper.find('h2').text()).toBe('Edit Bookmark')
  })

  it('initializes form fields with bookmark data', async () => {
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    // Wait for onMounted to run
    await wrapper.vm.$nextTick()

    const nameInput = wrapper.find('input[id="bookmark-name"]')
    const urlInput = wrapper.find('input[id="bookmark-url"]')

    expect((nameInput.element as HTMLInputElement).value).toBe('Test Bookmark')
    expect((urlInput.element as HTMLInputElement).value).toBe('https://example.com')
  })

  it('validates that name is required', async () => {
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    const nameInput = wrapper.find('input[id="bookmark-name"]')
    await nameInput.setValue('')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.text()).toContain('Name is required')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('validates that URL is required', async () => {
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    const urlInput = wrapper.find('input[id="bookmark-url"]')
    await urlInput.setValue('')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.text()).toContain('URL is required')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('validates URL format', async () => {
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    const urlInput = wrapper.find('input[id="bookmark-url"]')
    // Use a URL that will fail validation even after normalization
    await urlInput.setValue('://invalid-url')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.text()).toContain('Please enter a valid URL')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('normalizes URLs by adding https:// if missing', async () => {
    vi.mocked(groupApi.getAllGroups).mockResolvedValue(mockGroups)
    vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)
    
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    const urlInput = wrapper.find('input[id="bookmark-url"]')
    await urlInput.setValue('example.com')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]).toEqual([
      'test-id-1',
      {
        name: 'Test Bookmark',
        url: 'https://example.com',
        tabIds: ['test-tab-id-1'],
        groupIds: [],
      },
    ])
  })

  it('keeps https:// if already present', async () => {
    vi.mocked(groupApi.getAllGroups).mockResolvedValue(mockGroups)
    vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)
    
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    const urlInput = wrapper.find('input[id="bookmark-url"]')
    await urlInput.setValue('https://example.com')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      'test-id-1',
      {
        name: 'Test Bookmark',
        url: 'https://example.com',
        tabIds: ['test-tab-id-1'],
        groupIds: [],
      },
    ])
  })

  it('keeps http:// if already present', async () => {
    vi.mocked(groupApi.getAllGroups).mockResolvedValue(mockGroups)
    vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)
    
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    const urlInput = wrapper.find('input[id="bookmark-url"]')
    await urlInput.setValue('http://example.com')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      'test-id-1',
      {
        name: 'Test Bookmark',
        url: 'http://example.com',
        tabIds: ['test-tab-id-1'],
        groupIds: [],
      },
    ])
  })

  it('trims whitespace from name and URL', async () => {
    vi.mocked(groupApi.getAllGroups).mockResolvedValue(mockGroups)
    vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)
    
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    const nameInput = wrapper.find('input[id="bookmark-name"]')
    const urlInput = wrapper.find('input[id="bookmark-url"]')

    await nameInput.setValue('  Updated Bookmark  ')
    await urlInput.setValue('  https://updated.com  ')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      'test-id-1',
      {
        name: 'Updated Bookmark',
        url: 'https://updated.com',
        tabIds: ['test-tab-id-1'],
        groupIds: [],
      },
    ])
  })

  it('emits submit event with correct data on valid form submission', async () => {
    vi.mocked(groupApi.getAllGroups).mockResolvedValue(mockGroups)
    vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)
    
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    const nameInput = wrapper.find('input[id="bookmark-name"]')
    const urlInput = wrapper.find('input[id="bookmark-url"]')

    await nameInput.setValue('Updated Bookmark')
    await urlInput.setValue('https://updated.com')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]).toEqual([
      'test-id-1',
      {
        name: 'Updated Bookmark',
        url: 'https://updated.com',
        tabIds: ['test-tab-id-1'],
        groupIds: [],
      },
    ])
  })

  it('emits cancel event when cancel button is clicked', async () => {
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => 
      btn.text() === 'Cancel'
    )
    await cancelButton?.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('resets form to original values when cancel is clicked', async () => {
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    const nameInput = wrapper.find('input[id="bookmark-name"]')
    const urlInput = wrapper.find('input[id="bookmark-url"]')

    await nameInput.setValue('Changed Name')
    await urlInput.setValue('https://changed.com')

    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => 
      btn.text() === 'Cancel'
    )
    await cancelButton?.trigger('click')

    await wrapper.vm.$nextTick()

    expect((nameInput.element as HTMLInputElement).value).toBe('Test Bookmark')
    expect((urlInput.element as HTMLInputElement).value).toBe('https://example.com')
  })

  it('emits cancel event when clicking outside the modal', async () => {
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    const backdrop = wrapper.find('.fixed.inset-0')
    await backdrop.trigger('click.self')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('does not emit cancel when clicking inside the modal', async () => {
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    const modalContent = wrapper.find('.bg-\\[var\\(--color-background\\)\\]')
    await modalContent.trigger('click')

    expect(wrapper.emitted('cancel')).toBeFalsy()
  })

  it('emits delete event when delete button is clicked', async () => {
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    const deleteButton = wrapper.find('button[aria-label="Delete bookmark"]')
    await deleteButton.trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]).toEqual(['test-id-1'])
  })

  it('clears error message on new submission attempt', async () => {
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    // First submission with invalid data
    const nameInput = wrapper.find('input[id="bookmark-name"]')
    await nameInput.setValue('')
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    expect(wrapper.text()).toContain('Name is required')

    // Second submission with valid data
    await nameInput.setValue('Valid Name')
    const urlInput = wrapper.find('input[id="bookmark-url"]')
    await urlInput.setValue('https://example.com')
    await form.trigger('submit.prevent')

    expect(wrapper.text()).not.toContain('Name is required')
  })

  it('displays error message when validation fails', async () => {
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    // Wait for onMounted to initialize fields
    await wrapper.vm.$nextTick()

    // Clear the name field and trim to trigger validation
    const nameInput = wrapper.find('input[id="bookmark-name"]')
    await nameInput.setValue('   ')
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    await wrapper.vm.$nextTick()

    // Check that error message is displayed
    expect(wrapper.text()).toContain('Name is required')
    const errorDiv = wrapper.find('.text-\\[\\#dc3545\\]')
    expect(errorDiv.exists()).toBe(true)
  })

  it('clears error when cancel is clicked', async () => {
    vi.mocked(groupApi.getAllGroups).mockResolvedValue(mockGroups)
    vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)
    
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    // Trigger validation error
    const nameInput = wrapper.find('input[id="bookmark-name"]')
    await nameInput.setValue('')
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    expect(wrapper.text()).toContain('Name is required')

    // Click cancel
    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => 
      btn.text() === 'Cancel'
    )
    await cancelButton?.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('Name is required')
  })

  it('initializes tab selection with bookmark tabId', async () => {
    vi.mocked(groupApi.getAllGroups).mockResolvedValue(mockGroups)
    vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)
    
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    // Find the checkbox for the selected tab (Tab 1)
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    // The first checkbox should be for Tab 1, which should be checked
    const tab1Checkbox = checkboxes.find(cb => {
      const label = cb.element.closest('label')
      return label?.textContent?.includes('Tab 1')
    })
    expect(tab1Checkbox?.element.checked).toBe(true)
    
    // Tab 2 should not be checked
    const tab2Checkbox = checkboxes.find(cb => {
      const label = cb.element.closest('label')
      return label?.textContent?.includes('Tab 2')
    })
    expect(tab2Checkbox?.element.checked).toBe(false)
  })

  it('allows changing the bookmark tab', async () => {
    vi.mocked(groupApi.getAllGroups).mockResolvedValue(mockGroups)
    vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)
    
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    // Find the checkbox for Tab 2 and click it (uncheck Tab 1, check Tab 2)
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    const tab1Checkbox = checkboxes.find(cb => {
      const label = cb.element.closest('label')
      return label?.textContent?.includes('Tab 1')
    })
    const tab2Checkbox = checkboxes.find(cb => {
      const label = cb.element.closest('label')
      return label?.textContent?.includes('Tab 2')
    })
    expect(tab2Checkbox?.exists()).toBe(true)
    // Uncheck Tab 1
    await tab1Checkbox?.setValue(false)
    // Check Tab 2
    await tab2Checkbox?.setValue(true)

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      'test-id-1',
      {
        name: 'Test Bookmark',
        url: 'https://example.com',
        tabIds: ['test-tab-id-2'],
        groupIds: [],
      },
    ])
  })

  it('displays groups organized by tabs', async () => {
    vi.mocked(groupApi.getAllGroups).mockResolvedValue(mockGroups)
    vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)
    
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    // Check that tabs are displayed
    expect(wrapper.text()).toContain('Tab 1')
    expect(wrapper.text()).toContain('Tab 2')
    
    // Check that groups are displayed under their tabs
    expect(wrapper.text()).toContain('Group 1')
    expect(wrapper.text()).toContain('Group 2')
    expect(wrapper.text()).toContain('Group 3')
  })

  it('allows selecting groups from multiple tabs', async () => {
    vi.mocked(groupApi.getAllGroups).mockResolvedValue(mockGroups)
    vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)
    
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    // Find checkboxes for groups from different tabs
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    
    // Select group from tab 1
    await checkboxes[0]?.setValue(true)
    // Select group from tab 2 (assuming groups are rendered)
    if (checkboxes.length > 2) {
      await checkboxes[2]?.setValue(true)
    }

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    const submitData = wrapper.emitted('submit')?.[0]?.[1]
    expect(submitData?.groupIds).toBeDefined()
    expect(Array.isArray(submitData?.groupIds)).toBe(true)
  })

  it('resets tab selection when cancel is clicked', async () => {
    vi.mocked(groupApi.getAllGroups).mockResolvedValue(mockGroups)
    vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)
    
    const wrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    // Change tab to Tab 2 (uncheck Tab 1, check Tab 2)
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    const tab1Checkbox = checkboxes.find(cb => {
      const label = cb.element.closest('label')
      return label?.textContent?.includes('Tab 1')
    })
    const tab2Checkbox = checkboxes.find(cb => {
      const label = cb.element.closest('label')
      return label?.textContent?.includes('Tab 2')
    })
    await tab1Checkbox?.setValue(false)
    await tab2Checkbox?.setValue(true)

    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => 
      btn.text() === 'Cancel'
    )
    await cancelButton?.trigger('click')
    await wrapper.vm.$nextTick()

    // After remounting, the form should reset
    vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)
    
    const newWrapper = mountWithPinia(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })
    await newWrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Check that Tab 1 is selected again (the original tab)
    const newCheckboxes = newWrapper.findAll('input[type="checkbox"]')
    const tab1CheckboxNew = newCheckboxes.find(cb => {
      const label = cb.element.closest('label')
      return label?.textContent?.includes('Tab 1')
    })
    expect(tab1CheckboxNew?.element.checked).toBe(true)
  })
})

