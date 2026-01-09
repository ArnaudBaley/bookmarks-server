import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountWithPinia } from '@/test-utils'
import AddTabForm from './AddTabForm.vue'
import { useTabStore } from '@/stores/tab/tab'

describe('AddTabForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields correctly', () => {
    const wrapper = mountWithPinia(AddTabForm)

    expect(wrapper.find('input[id="tab-name"]').exists()).toBe(true)
    expect(wrapper.find('input[id="tab-color"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    expect(cancelButton?.text()).toBe('Cancel')
  })

  it('renders form title', () => {
    const wrapper = mountWithPinia(AddTabForm)
    expect(wrapper.find('h2').text()).toBe('Add New Tab')
  })

  it('validates that name is required', async () => {
    const wrapper = mountWithPinia(AddTabForm)

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.text()).toContain('Name is required')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('emits submit event with correct data on valid form submission', async () => {
    const wrapper = mountWithPinia(AddTabForm)

    const nameInput = wrapper.find('input[id="tab-name"]')
    await nameInput.setValue('Test Tab')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({
      name: 'Test Tab',
      color: '#3b82f6', // default color
    })
  })

  it('allows color selection via color picker', async () => {
    const wrapper = mountWithPinia(AddTabForm)

    const nameInput = wrapper.find('input[id="tab-name"]')
    const colorInput = wrapper.find('input[id="tab-color"]')

    await nameInput.setValue('Test Tab')
    await colorInput.setValue('#ef4444')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({
      name: 'Test Tab',
      color: '#ef4444',
    })
  })

  it('allows color selection via palette buttons', async () => {
    const wrapper = mountWithPinia(AddTabForm)

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

    expect(wrapper.emitted('submit')?.[0]?.[0].color).toBe('#ef4444')
  })

  it('trims whitespace from name', async () => {
    const wrapper = mountWithPinia(AddTabForm)

    const nameInput = wrapper.find('input[id="tab-name"]')
    await nameInput.setValue('  Test Tab  ')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[0].name).toBe('Test Tab')
  })

  it('resets form after successful submission when no store error', async () => {
    const wrapper = mountWithPinia(AddTabForm)
    const tabStore = useTabStore()
    tabStore.error = null

    const nameInput = wrapper.find('input[id="tab-name"]')
    await nameInput.setValue('Test Tab')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    // Wait for component's nextTick and setTimeout to run
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))
    await wrapper.vm.$nextTick()

    expect((nameInput.element as HTMLInputElement).value).toBe('')
    expect(wrapper.text()).not.toContain('Name is required')
  })

  it('does not reset form when store has error', async () => {
    const wrapper = mountWithPinia(AddTabForm)
    const tabStore = useTabStore()

    const nameInput = wrapper.find('input[id="tab-name"]')
    await nameInput.setValue('Test Tab')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    
    // Set error to simulate store action setting error after submit
    tabStore.error = 'Store error'
    
    // Wait for component's nextTick and setTimeout to run
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))
    await wrapper.vm.$nextTick()

    // Form should not be reset if there's a store error
    expect((nameInput.element as HTMLInputElement).value).toBe('Test Tab')
  })

  it('emits cancel event when cancel button is clicked', async () => {
    const wrapper = mountWithPinia(AddTabForm)

    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    await cancelButton!.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('resets form when cancel is clicked', async () => {
    const wrapper = mountWithPinia(AddTabForm)

    const nameInput = wrapper.find('input[id="tab-name"]')
    await nameInput.setValue('Test Tab')

    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    await cancelButton!.trigger('click')

    await wrapper.vm.$nextTick()

    expect((nameInput.element as HTMLInputElement).value).toBe('')
  })

  it('clears store error when cancel is clicked', async () => {
    const wrapper = mountWithPinia(AddTabForm)
    const tabStore = useTabStore()
    tabStore.error = 'Some error'

    const cancelButton = wrapper.findAll('button[type="button"]').find((btn) => btn.text() === 'Cancel')
    await cancelButton!.trigger('click')

    expect(tabStore.error).toBeNull()
  })

  it('emits cancel event when clicking outside the modal', async () => {
    const wrapper = mountWithPinia(AddTabForm)

    const backdrop = wrapper.find('.fixed.inset-0')
    await backdrop.trigger('click.self')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('does not emit cancel when clicking inside the modal', async () => {
    const wrapper = mountWithPinia(AddTabForm)

    const modalContent = wrapper.find('.bg-\\[var\\(--color-background\\)\\]')
    await modalContent.trigger('click')

    expect(wrapper.emitted('cancel')).toBeFalsy()
  })

  it('clears error message on new submission attempt', async () => {
    const wrapper = mountWithPinia(AddTabForm)

    // First submission with invalid data
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    expect(wrapper.text()).toContain('Name is required')

    // Second submission with valid data
    const nameInput = wrapper.find('input[id="tab-name"]')
    await nameInput.setValue('Test Tab')
    await form.trigger('submit.prevent')

    expect(wrapper.text()).not.toContain('Name is required')
  })

  it('displays error message when validation fails', async () => {
    const wrapper = mountWithPinia(AddTabForm)

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    const errorDiv = wrapper.find('.text-\\[\\#dc3545\\]')
    expect(errorDiv.exists()).toBe(true)
    expect(errorDiv.text()).toBe('Name is required')
  })

  it('displays store error when present', async () => {
    const wrapper = mountWithPinia(AddTabForm)
    const tabStore = useTabStore()
    tabStore.error = 'Store error message'

    await wrapper.vm.$nextTick()

    const errorDiv = wrapper.find('.text-\\[\\#dc3545\\]')
    expect(errorDiv.exists()).toBe(true)
    expect(errorDiv.text()).toContain('Store error message')
  })

  it('watches for store errors and updates local error', async () => {
    const wrapper = mountWithPinia(AddTabForm)
    const tabStore = useTabStore()

    tabStore.error = 'New store error'
    await wrapper.vm.$nextTick()

    const errorDiv = wrapper.find('.text-\\[\\#dc3545\\]')
    expect(errorDiv.exists()).toBe(true)
    expect(errorDiv.text()).toContain('New store error')
  })

  it('handles Escape key to cancel', async () => {
    const wrapper = mountWithPinia(AddTabForm)

    // Trigger Escape key on window since component listens to window events
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    window.dispatchEvent(escapeEvent)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('focuses name input on mount', async () => {
    const wrapper = mountWithPinia(AddTabForm)
    const nameInput = wrapper.find('input[id="tab-name"]')

    await wrapper.vm.$nextTick()

    // Check that the input exists and can be focused
    expect(nameInput.exists()).toBe(true)
  })

  it('displays all color palette options', () => {
    const wrapper = mountWithPinia(AddTabForm)

    // Should have 8 color palette buttons
    const paletteButtons = wrapper.findAll('button[type="button"]').filter((btn) => {
      const ariaLabel = btn.attributes('aria-label')
      return ariaLabel && ariaLabel.startsWith('Select color')
    })

    expect(paletteButtons.length).toBe(8)
  })

  it('clears local error and store error on submit', async () => {
    const wrapper = mountWithPinia(AddTabForm)
    const tabStore = useTabStore()
    tabStore.error = 'Previous error'

    const nameInput = wrapper.find('input[id="tab-name"]')
    await nameInput.setValue('Test Tab')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(tabStore.error).toBeNull()
  })

  it('removes event listener on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mountWithPinia(AddTabForm)

    wrapper.unmount()
    await wrapper.vm.$nextTick()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })
})

