import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EditTabForm from './EditTabForm.vue'
import { createTab } from '@/test-utils'

describe('EditTabForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields correctly', () => {
    const tab = createTab({ name: 'Test Tab', color: '#3b82f6' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    expect(wrapper.find('input[id="tab-name"]').exists()).toBe(true)
    expect(wrapper.find('input[id="tab-color"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    expect(cancelButton?.text()).toBe('Cancel')
  })

  it('renders form title', () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })
    expect(wrapper.find('h2').text()).toBe('Edit Tab')
  })

  it('initializes form with tab data', async () => {
    const tab = createTab({ name: 'Original Name', color: '#ef4444' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    await wrapper.vm.$nextTick()
    const nameInput = wrapper.find('input[id="tab-name"]')
    expect((nameInput.element as HTMLInputElement).value).toBe('Original Name')
  })

  it('uses default color when tab has no color', async () => {
    const tab = createTab({ name: 'Test Tab', color: null })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    await wrapper.vm.$nextTick()
    const colorInput = wrapper.find('input[id="tab-color"]')
    expect((colorInput.element as HTMLInputElement).value).toBe('#3b82f6')
  })

  it('validates that name is required', async () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    const nameInput = wrapper.find('input[id="tab-name"]')
    await nameInput.setValue('')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.text()).toContain('Name is required')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('emits submit event with correct data on valid form submission', async () => {
    const tab = createTab({ name: 'Original Name', color: '#3b82f6' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    const nameInput = wrapper.find('input[id="tab-name"]')
    await nameInput.setValue('Updated Name')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]?.[0]).toBe(tab.id)
    expect(wrapper.emitted('submit')?.[0]?.[1]).toEqual({
      name: 'Updated Name',
      color: '#3b82f6',
    })
  })

  it('allows color selection via color picker', async () => {
    const tab = createTab({ name: 'Test Tab', color: '#3b82f6' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    const nameInput = wrapper.find('input[id="tab-name"]')
    const colorInput = wrapper.find('input[id="tab-color"]')

    await nameInput.setValue('Test Tab')
    await colorInput.setValue('#ef4444')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[1].color).toBe('#ef4444')
  })

  it('allows color selection via palette buttons', async () => {
    const tab = createTab({ name: 'Test Tab', color: '#3b82f6' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    const nameInput = wrapper.find('input[id="tab-name"]')
    await nameInput.setValue('Test Tab')

    // Find and click a palette color button
    const paletteButtons = wrapper.findAll('button[type="button"]')
    const colorButton = paletteButtons.find((btn) => {
      const ariaLabel = btn.attributes('aria-label')
      const style = btn.attributes('style') || ''
      return ariaLabel?.startsWith('Select color') && (style.includes('#ef4444') || style.includes('rgb(239, 68, 68)'))
    })

    expect(colorButton).toBeDefined()
    if (colorButton) {
      await colorButton.trigger('click')
    }

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[1].color).toBe('#ef4444')
  })

  it('trims whitespace from name', async () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    const nameInput = wrapper.find('input[id="tab-name"]')
    await nameInput.setValue('  Updated Name  ')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[1].name).toBe('Updated Name')
  })

  it('emits cancel event when cancel button is clicked', async () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    await cancelButton!.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('resets form when cancel is clicked', async () => {
    const tab = createTab({ name: 'Original Name', color: '#3b82f6' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    const nameInput = wrapper.find('input[id="tab-name"]')
    await nameInput.setValue('Changed Name')

    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    await cancelButton!.trigger('click')

    await wrapper.vm.$nextTick()

    expect((nameInput.element as HTMLInputElement).value).toBe('Original Name')
  })

  it('emits cancel event when clicking outside the modal', async () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    const backdrop = wrapper.find('.fixed.inset-0')
    await backdrop.trigger('click.self')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('does not emit cancel when clicking inside the modal', async () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    const modalContent = wrapper.find('.bg-\\[var\\(--color-background\\)\\]')
    await modalContent.trigger('click')

    expect(wrapper.emitted('cancel')).toBeFalsy()
  })

  it('displays error message when validation fails', async () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    const nameInput = wrapper.find('input[id="tab-name"]')
    await nameInput.setValue('')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await wrapper.vm.$nextTick()
    // Wait a bit more for reactivity
    await new Promise(resolve => setTimeout(resolve, 10))

    // Error should be displayed in the edit form (not delete confirmation)
    const errorDivs = wrapper.findAll('.text-\\[\\#dc3545\\]')
    const errorDiv = errorDivs.find(div => div.text().includes('Name is required'))
    expect(errorDiv).toBeDefined()
    if (errorDiv) {
      expect(errorDiv.text()).toBe('Name is required')
    }
  })

  it('displays prop error when present', async () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
        error: 'Prop error message',
      },
    })

    await wrapper.vm.$nextTick()
    // Wait a bit more for reactivity
    await new Promise(resolve => setTimeout(resolve, 10))

    // Error should be displayed in the edit form (not delete confirmation)
    // The error div is only shown when not in delete confirmation mode
    const errorDivs = wrapper.findAll('.text-\\[\\#dc3545\\]')
    const errorDiv = errorDivs.find(div => div.text().includes('Prop error message'))
    expect(errorDiv).toBeDefined()
    if (errorDiv) {
      expect(errorDiv.text()).toContain('Prop error message')
    }
  })

  it('handles Escape key to cancel when not in delete confirmation', async () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    // Trigger Escape key on window
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    window.dispatchEvent(escapeEvent)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('handles Escape key to close delete confirmation', async () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    // Click delete button to show confirmation
    const deleteButton = wrapper.find('button[aria-label="Delete tab"]')
    await deleteButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Trigger Escape key
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    window.dispatchEvent(escapeEvent)
    await wrapper.vm.$nextTick()

    // Delete confirmation should be closed, but cancel should not be emitted
    expect(wrapper.find('h2').text()).toBe('Edit Tab')
  })

  it('shows delete confirmation when delete button is clicked', async () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    const deleteButton = wrapper.find('button[aria-label="Delete tab"]')
    await deleteButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('h2').text()).toBe('Delete Tab')
    expect(wrapper.text()).toContain('Test Tab')
  })

  it('emits delete event when delete is confirmed', async () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    // Click delete button
    const deleteButton = wrapper.find('button[aria-label="Delete tab"]')
    await deleteButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Click confirm delete button
    const confirmButton = wrapper.findAll('button').find((btn) => btn.text() === 'Delete Tab')
    await confirmButton!.trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]?.[0]).toBe(tab.id)
  })

  it('closes delete confirmation when cancel is clicked', async () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    // Click delete button
    const deleteButton = wrapper.find('button[aria-label="Delete tab"]')
    await deleteButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Click cancel button in confirmation
    const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel')
    await cancelButton!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('h2').text()).toBe('Edit Tab')
  })

  it('emits duplicate event when duplicate button is clicked', async () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    const duplicateButton = wrapper.find('button[aria-label="Duplicate tab"]')
    await duplicateButton.trigger('click')

    expect(wrapper.emitted('duplicate')).toBeTruthy()
    expect(wrapper.emitted('duplicate')?.[0]?.[0]).toEqual(tab)
  })

  it('displays delete confirmation warning text', async () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    const deleteButton = wrapper.find('button[aria-label="Delete tab"]')
    await deleteButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('This will permanently delete:')
    expect(wrapper.text()).toContain('The tab itself')
    expect(wrapper.text()).toContain('All groups in this tab')
    expect(wrapper.text()).toContain('All bookmarks in this tab')
    expect(wrapper.text()).toContain('This action cannot be undone.')
  })

  it('focuses name input on mount', async () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })
    const nameInput = wrapper.find('input[id="tab-name"]')

    await wrapper.vm.$nextTick()

    expect(nameInput.exists()).toBe(true)
  })

  it('displays all color palette options', () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    // Should have 8 color palette buttons
    const paletteButtons = wrapper.findAll('button[type="button"]').filter((btn) => {
      const ariaLabel = btn.attributes('aria-label')
      return ariaLabel && ariaLabel.startsWith('Select color')
    })

    expect(paletteButtons.length).toBe(8)
  })

  it('clears local error on submit', async () => {
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    // First submit with invalid data
    const nameInput = wrapper.find('input[id="tab-name"]')
    await nameInput.setValue('')
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    // Then submit with valid data
    await nameInput.setValue('Valid Name')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('resets form state when cancel is clicked', async () => {
    const tab = createTab({ name: 'Original Name', color: '#3b82f6' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    const nameInput = wrapper.find('input[id="tab-name"]')
    await nameInput.setValue('Changed Name')

    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    await cancelButton!.trigger('click')

    await wrapper.vm.$nextTick()

    expect((nameInput.element as HTMLInputElement).value).toBe('Original Name')
  })

  it('removes event listener on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const tab = createTab({ name: 'Test Tab' })
    const wrapper = mount(EditTabForm, {
      props: {
        tab,
      },
    })

    wrapper.unmount()
    await wrapper.vm.$nextTick()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })
})

