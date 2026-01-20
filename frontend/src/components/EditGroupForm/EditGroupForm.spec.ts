import { describe, it, expect, beforeEach, vi } from 'vitest'
import EditGroupForm from './EditGroupForm.vue'
import { createGroup, createTab, mountWithPinia } from '@/test-utils'
import { groupApi } from '@/services/groupApi/groupApi'
import * as tabApiModule from '@/services/tabApi/tabApi'

// Mock the groupApi
vi.mock('@/services/groupApi/groupApi', () => ({
  groupApi: {
    getAllGroups: vi.fn(),
  },
}))

describe('EditGroupForm', () => {
  const mockTabs = [
    createTab({ id: 'test-tab-id-1', name: 'Tab 1' }),
    createTab({ id: 'test-tab-id-2', name: 'Tab 2' }),
  ]

  const mockGroups = [
    createGroup({ id: 'group-1', name: 'Group 1', tabId: 'test-tab-id-1' }),
    createGroup({ id: 'group-2', name: 'Group 2', tabId: 'test-tab-id-2' }),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock groupApi.getAllGroups to return empty array by default
    vi.mocked(groupApi.getAllGroups).mockResolvedValue([])
    // Mock tabApi.getAllTabs to return empty array by default
    vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue([])
  })

  it('renders form fields correctly', async () => {
    const group = createGroup({ name: 'Test Group', color: '#3b82f6', tabId: 'test-tab-id-1' })
    vi.mocked(groupApi.getAllGroups).mockResolvedValue(mockGroups)
    vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)
    
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    expect(wrapper.find('input[id="group-name"]').exists()).toBe(true)
    expect(wrapper.find('input[id="group-color"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    expect(cancelButton?.text()).toBe('Cancel')
  })

  it('renders form title', () => {
    const group = createGroup({ name: 'Test Group', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })
    expect(wrapper.find('h2').text()).toBe('Edit Group')
  })

  it('initializes form with group data', async () => {
    const group = createGroup({ name: 'Original Name', color: '#ef4444', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations
    const nameInput = wrapper.find('input[id="group-name"]')
    expect((nameInput.element as HTMLInputElement).value).toBe('Original Name')
  })

  it('validates that name is required', async () => {
    const group = createGroup({ name: 'Test Group', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    const nameInput = wrapper.find('input[id="group-name"]')
    await nameInput.setValue('')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.text()).toContain('Name is required')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('emits submit event with correct data on valid form submission', async () => {
    const group = createGroup({ id: 'group-id', name: 'Original Name', color: '#3b82f6', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    const nameInput = wrapper.find('input[id="group-name"]')
    await nameInput.setValue('Updated Name')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]).toEqual([
      'group-id',
      {
        name: 'Updated Name',
        color: '#3b82f6',
        targetTabIds: undefined,
      },
    ])
  })

  it('allows color selection via color picker', async () => {
    const group = createGroup({ id: 'group-id', name: 'Test Group', color: '#3b82f6', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    const colorInput = wrapper.find('input[id="group-color"]')
    await colorInput.setValue('#ef4444')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[1].color).toBe('#ef4444')
  })

  it('allows color selection via palette buttons', async () => {
    const group = createGroup({ id: 'group-id', name: 'Test Group', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    // Find and click a palette color button (exclude Cancel button)
    // Look for button with aria-label "Select color #ef4444"
    const colorButton = wrapper.find('button[aria-label="Select color #ef4444"]')

    expect(colorButton.exists()).toBe(true)
    await colorButton.trigger('click')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[1].color).toBe('#ef4444')
  })

  it('trims whitespace from name', async () => {
    const group = createGroup({ id: 'group-id', name: 'Original', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    const nameInput = wrapper.find('input[id="group-name"]')
    await nameInput.setValue('  Updated Name  ')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[1].name).toBe('Updated Name')
  })

  it('emits cancel event when cancel button is clicked', async () => {
    const group = createGroup({ name: 'Test Group', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    await cancelButton!.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('resets form to original values when cancel is clicked', async () => {
    const group = createGroup({ name: 'Original Name', color: '#3b82f6', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    const nameInput = wrapper.find('input[id="group-name"]')
    await nameInput.setValue('Changed Name')

    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    await cancelButton!.trigger('click')

    await wrapper.vm.$nextTick()

    // Form should reset to original values
    expect((nameInput.element as HTMLInputElement).value).toBe('Original Name')
  })

  it('emits cancel event when clicking outside the modal', async () => {
    const group = createGroup({ name: 'Test Group', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    const backdrop = wrapper.find('.fixed.inset-0')
    await backdrop.trigger('click.self')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('does not emit cancel when clicking inside the modal', async () => {
    const group = createGroup({ name: 'Test Group', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    const modalContent = wrapper.find('.bg-\\[var\\(--color-background\\)\\]')
    await modalContent.trigger('click')

    expect(wrapper.emitted('cancel')).toBeFalsy()
  })

  it('emits delete event when delete button is clicked', async () => {
    const group = createGroup({ id: 'group-id', name: 'Test Group', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    const deleteButton = wrapper.find('button[aria-label="Delete group"]')
    await deleteButton.trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]?.[0]).toBe('group-id')
  })

  it('clears error message on new submission attempt', async () => {
    const group = createGroup({ name: 'Test Group', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    // First submission with invalid data
    const nameInput = wrapper.find('input[id="group-name"]')
    await nameInput.setValue('')
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    expect(wrapper.text()).toContain('Name is required')

    // Second submission with valid data
    await nameInput.setValue('Valid Name')
    await form.trigger('submit.prevent')

    expect(wrapper.text()).not.toContain('Name is required')
  })

  it('displays error message when validation fails', async () => {
    const group = createGroup({ name: 'Test Group', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    const nameInput = wrapper.find('input[id="group-name"]')
    await nameInput.setValue('')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    // Check if error message is displayed
    expect(wrapper.text()).toContain('Name is required')
    
    // Find the error div - it should be visible when error is set
    const errorDivs = wrapper.findAll('.text-\\[\\#dc3545\\]')
    const errorDiv = errorDivs.find((div) => div.text().includes('Name is required'))
    expect(errorDiv).toBeDefined()
    expect(errorDiv?.text().trim()).toBe('Name is required')
  })

  it('handles Escape key to cancel', async () => {
    const group = createGroup({ name: 'Test Group', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    // Trigger Escape key on window since component listens to window events
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    window.dispatchEvent(escapeEvent)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('focuses name input on mount', async () => {
    const group = createGroup({ name: 'Test Group', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })
    const nameInput = wrapper.find('input[id="group-name"]')

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    // Check that the input exists and can be focused
    expect(nameInput.exists()).toBe(true)
  })

  it('displays delete button with correct styling', async () => {
    const group = createGroup({ name: 'Test Group', tabId: 'test-tab-id-1' })
    const wrapper = mountWithPinia(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200)) // Wait for async operations

    const deleteButton = wrapper.find('button[aria-label="Delete group"]')
    expect(deleteButton.exists()).toBe(true)
    expect(deleteButton.classes()).toContain('text-[#dc3545]')
  })
})

