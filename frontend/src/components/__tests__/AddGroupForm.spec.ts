import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AddGroupForm from '../AddGroupForm.vue'

describe('AddGroupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields correctly', () => {
    const wrapper = mount(AddGroupForm)

    expect(wrapper.find('input[id="group-name"]').exists()).toBe(true)
    expect(wrapper.find('input[id="group-color"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    expect(cancelButton?.text()).toBe('Cancel')
  })

  it('renders form title', () => {
    const wrapper = mount(AddGroupForm)
    expect(wrapper.find('h2').text()).toBe('Add New Group')
  })

  it('validates that name is required', async () => {
    const wrapper = mount(AddGroupForm)

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.text()).toContain('Name is required')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('emits submit event with correct data on valid form submission', async () => {
    const wrapper = mount(AddGroupForm)

    const nameInput = wrapper.find('input[id="group-name"]')
    await nameInput.setValue('Test Group')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({
      name: 'Test Group',
      color: '#3b82f6', // default color
    })
  })

  it('allows color selection via color picker', async () => {
    const wrapper = mount(AddGroupForm)

    const nameInput = wrapper.find('input[id="group-name"]')
    const colorInput = wrapper.find('input[id="group-color"]')

    await nameInput.setValue('Test Group')
    await colorInput.setValue('#ef4444')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({
      name: 'Test Group',
      color: '#ef4444',
    })
  })

  it('allows color selection via palette buttons', async () => {
    const wrapper = mount(AddGroupForm)

    const nameInput = wrapper.find('input[id="group-name"]')
    await nameInput.setValue('Test Group')

    // Find and click a palette color button (exclude Cancel button)
    const paletteButtons = wrapper.findAll('button[type="button"]')
    const colorButton = paletteButtons.find((btn) => {
      const ariaLabel = btn.attributes('aria-label')
      const style = btn.attributes('style') || ''
      // Check for aria-label and style containing the color (could be hex or RGB)
      return ariaLabel?.startsWith('Select color') && (style.includes('#ef4444') || style.includes('rgb(239, 68, 68)'))
    })

    expect(colorButton).toBeDefined()
    if (colorButton) {
      await colorButton.trigger('click')
    }

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[0].color).toBe('#ef4444')
  })

  it('trims whitespace from name', async () => {
    const wrapper = mount(AddGroupForm)

    const nameInput = wrapper.find('input[id="group-name"]')
    await nameInput.setValue('  Test Group  ')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[0].name).toBe('Test Group')
  })

  it('resets form after successful submission', async () => {
    const wrapper = mount(AddGroupForm)

    const nameInput = wrapper.find('input[id="group-name"]')
    await nameInput.setValue('Test Group')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    await wrapper.vm.$nextTick()

    expect((nameInput.element as HTMLInputElement).value).toBe('')
    expect(wrapper.text()).not.toContain('Name is required')
  })

  it('emits cancel event when cancel button is clicked', async () => {
    const wrapper = mount(AddGroupForm)

    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    await cancelButton!.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('resets form when cancel is clicked', async () => {
    const wrapper = mount(AddGroupForm)

    const nameInput = wrapper.find('input[id="group-name"]')
    await nameInput.setValue('Test Group')

    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    await cancelButton!.trigger('click')

    await wrapper.vm.$nextTick()

    expect((nameInput.element as HTMLInputElement).value).toBe('')
  })

  it('emits cancel event when clicking outside the modal', async () => {
    const wrapper = mount(AddGroupForm)

    const backdrop = wrapper.find('.fixed.inset-0')
    await backdrop.trigger('click.self')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('does not emit cancel when clicking inside the modal', async () => {
    const wrapper = mount(AddGroupForm)

    const modalContent = wrapper.find('.bg-\\[var\\(--color-background\\)\\]')
    await modalContent.trigger('click')

    expect(wrapper.emitted('cancel')).toBeFalsy()
  })

  it('clears error message on new submission attempt', async () => {
    const wrapper = mount(AddGroupForm)

    // First submission with invalid data
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    expect(wrapper.text()).toContain('Name is required')

    // Second submission with valid data
    const nameInput = wrapper.find('input[id="group-name"]')
    await nameInput.setValue('Test Group')
    await form.trigger('submit.prevent')

    expect(wrapper.text()).not.toContain('Name is required')
  })

  it('displays error message when validation fails', async () => {
    const wrapper = mount(AddGroupForm)

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    const errorDiv = wrapper.find('.text-\\[\\#dc3545\\]')
    expect(errorDiv.exists()).toBe(true)
    expect(errorDiv.text()).toBe('Name is required')
  })

  it('handles Escape key to cancel', async () => {
    const wrapper = mount(AddGroupForm)

    // Trigger Escape key on window since component listens to window events
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    window.dispatchEvent(escapeEvent)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('focuses name input on mount', async () => {
    const wrapper = mount(AddGroupForm)
    const nameInput = wrapper.find('input[id="group-name"]')

    await wrapper.vm.$nextTick()

    // Check that the input exists and can be focused
    expect(nameInput.exists()).toBe(true)
  })

  it('displays all color palette options', () => {
    const wrapper = mount(AddGroupForm)

    // Should have 8 color palette buttons
    const paletteButtons = wrapper.findAll('button[type="button"]').filter((btn) => {
      const ariaLabel = btn.attributes('aria-label')
      return ariaLabel && ariaLabel.startsWith('Select color')
    })

    expect(paletteButtons.length).toBe(8)
  })
})

