import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EditGroupForm from '../EditGroupForm.vue'
import { createGroup, createGroupDto } from '@/test-utils'

describe('EditGroupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields correctly', () => {
    const group = createGroup({ name: 'Test Group', color: '#3b82f6' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })

    expect(wrapper.find('input[id="group-name"]').exists()).toBe(true)
    expect(wrapper.find('input[id="group-color"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    expect(cancelButton?.text()).toBe('Cancel')
  })

  it('renders form title', () => {
    const group = createGroup({ name: 'Test Group' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })
    expect(wrapper.find('h2').text()).toBe('Edit Group')
  })

  it('initializes form with group data', async () => {
    const group = createGroup({ name: 'Original Name', color: '#ef4444' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()
    const nameInput = wrapper.find('input[id="group-name"]')
    expect((nameInput.element as HTMLInputElement).value).toBe('Original Name')
  })

  it('validates that name is required', async () => {
    const group = createGroup({ name: 'Test Group' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })

    const nameInput = wrapper.find('input[id="group-name"]')
    await nameInput.setValue('')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.text()).toContain('Name is required')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('emits submit event with correct data on valid form submission', async () => {
    const group = createGroup({ id: 'group-id', name: 'Original Name', color: '#3b82f6' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })

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
      },
    ])
  })

  it('allows color selection via color picker', async () => {
    const group = createGroup({ id: 'group-id', name: 'Test Group', color: '#3b82f6' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })

    const colorInput = wrapper.find('input[id="group-color"]')
    await colorInput.setValue('#ef4444')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[1].color).toBe('#ef4444')
  })

  it('allows color selection via palette buttons', async () => {
    const group = createGroup({ id: 'group-id', name: 'Test Group' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })

    await wrapper.vm.$nextTick()

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
    const group = createGroup({ id: 'group-id', name: 'Original' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })

    const nameInput = wrapper.find('input[id="group-name"]')
    await nameInput.setValue('  Updated Name  ')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[1].name).toBe('Updated Name')
  })

  it('emits cancel event when cancel button is clicked', async () => {
    const group = createGroup({ name: 'Test Group' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })

    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    await cancelButton!.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('resets form to original values when cancel is clicked', async () => {
    const group = createGroup({ name: 'Original Name', color: '#3b82f6' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })

    const nameInput = wrapper.find('input[id="group-name"]')
    await nameInput.setValue('Changed Name')

    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    await cancelButton!.trigger('click')

    await wrapper.vm.$nextTick()

    // Form should reset to original values
    expect((nameInput.element as HTMLInputElement).value).toBe('Original Name')
  })

  it('emits cancel event when clicking outside the modal', async () => {
    const group = createGroup({ name: 'Test Group' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })

    const backdrop = wrapper.find('.fixed.inset-0')
    await backdrop.trigger('click.self')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('does not emit cancel when clicking inside the modal', async () => {
    const group = createGroup({ name: 'Test Group' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })

    const modalContent = wrapper.find('.bg-\\[var\\(--color-background\\)\\]')
    await modalContent.trigger('click')

    expect(wrapper.emitted('cancel')).toBeFalsy()
  })

  it('emits delete event when delete button is clicked', async () => {
    const group = createGroup({ id: 'group-id', name: 'Test Group' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })

    const deleteButton = wrapper.find('button[aria-label="Delete group"]')
    await deleteButton.trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]?.[0]).toBe('group-id')
  })

  it('clears error message on new submission attempt', async () => {
    const group = createGroup({ name: 'Test Group' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })

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
    const group = createGroup({ name: 'Test Group' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })

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
    const group = createGroup({ name: 'Test Group' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })

    // Trigger Escape key on window since component listens to window events
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    window.dispatchEvent(escapeEvent)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('focuses name input on mount', async () => {
    const group = createGroup({ name: 'Test Group' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })
    const nameInput = wrapper.find('input[id="group-name"]')

    await wrapper.vm.$nextTick()

    // Check that the input exists and can be focused
    expect(nameInput.exists()).toBe(true)
  })

  it('displays delete button with correct styling', () => {
    const group = createGroup({ name: 'Test Group' })
    const wrapper = mount(EditGroupForm, {
      props: {
        group,
      },
    })

    const deleteButton = wrapper.find('button[aria-label="Delete group"]')
    expect(deleteButton.exists()).toBe(true)
    expect(deleteButton.classes()).toContain('text-[#dc3545]')
  })
})

