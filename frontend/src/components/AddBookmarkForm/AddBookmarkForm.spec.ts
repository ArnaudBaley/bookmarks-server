import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AddBookmarkForm from './AddBookmarkForm.vue'

describe('AddBookmarkForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields correctly', () => {
    const wrapper = mount(AddBookmarkForm)

    expect(wrapper.find('input[id="bookmark-name"]').exists()).toBe(true)
    expect(wrapper.find('input[id="bookmark-url"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    expect(wrapper.find('button[type="button"]').text()).toBe('Cancel')
  })

  it('renders form title', () => {
    const wrapper = mount(AddBookmarkForm)
    expect(wrapper.find('h2').text()).toBe('Add New Bookmark')
  })

  it('validates that name is required', async () => {
    const wrapper = mount(AddBookmarkForm)

    const urlInput = wrapper.find('input[id="bookmark-url"]')
    await urlInput.setValue('https://example.com')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.text()).toContain('Name is required')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('validates that URL is required', async () => {
    const wrapper = mount(AddBookmarkForm)

    const nameInput = wrapper.find('input[id="bookmark-name"]')
    await nameInput.setValue('Test Bookmark')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.text()).toContain('URL is required')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('validates URL format', async () => {
    const wrapper = mount(AddBookmarkForm)

    const nameInput = wrapper.find('input[id="bookmark-name"]')
    const urlInput = wrapper.find('input[id="bookmark-url"]')

    await nameInput.setValue('Test Bookmark')
    // Use a URL that will fail validation even after normalization
    await urlInput.setValue('://invalid-url')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.text()).toContain('Please enter a valid URL')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('normalizes URLs by adding https:// if missing', async () => {
    const wrapper = mount(AddBookmarkForm)

    const nameInput = wrapper.find('input[id="bookmark-name"]')
    const urlInput = wrapper.find('input[id="bookmark-url"]')

    await nameInput.setValue('Test Bookmark')
    await urlInput.setValue('example.com')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({
      name: 'Test Bookmark',
      url: 'https://example.com',
    })
  })

  it('keeps https:// if already present', async () => {
    const wrapper = mount(AddBookmarkForm)

    const nameInput = wrapper.find('input[id="bookmark-name"]')
    const urlInput = wrapper.find('input[id="bookmark-url"]')

    await nameInput.setValue('Test Bookmark')
    await urlInput.setValue('https://example.com')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({
      name: 'Test Bookmark',
      url: 'https://example.com',
    })
  })

  it('keeps http:// if already present', async () => {
    const wrapper = mount(AddBookmarkForm)

    const nameInput = wrapper.find('input[id="bookmark-name"]')
    const urlInput = wrapper.find('input[id="bookmark-url"]')

    await nameInput.setValue('Test Bookmark')
    await urlInput.setValue('http://example.com')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({
      name: 'Test Bookmark',
      url: 'http://example.com',
    })
  })

  it('trims whitespace from name and URL', async () => {
    const wrapper = mount(AddBookmarkForm)

    const nameInput = wrapper.find('input[id="bookmark-name"]')
    const urlInput = wrapper.find('input[id="bookmark-url"]')

    await nameInput.setValue('  Test Bookmark  ')
    await urlInput.setValue('  https://example.com  ')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({
      name: 'Test Bookmark',
      url: 'https://example.com',
    })
  })

  it('emits submit event with correct data on valid form submission', async () => {
    const wrapper = mount(AddBookmarkForm)

    const nameInput = wrapper.find('input[id="bookmark-name"]')
    const urlInput = wrapper.find('input[id="bookmark-url"]')

    await nameInput.setValue('Test Bookmark')
    await urlInput.setValue('https://example.com')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({
      name: 'Test Bookmark',
      url: 'https://example.com',
    })
  })

  it('resets form after successful submission', async () => {
    const wrapper = mount(AddBookmarkForm)

    const nameInput = wrapper.find('input[id="bookmark-name"]')
    const urlInput = wrapper.find('input[id="bookmark-url"]')

    await nameInput.setValue('Test Bookmark')
    await urlInput.setValue('https://example.com')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    await wrapper.vm.$nextTick()

    expect((nameInput.element as HTMLInputElement).value).toBe('')
    expect((urlInput.element as HTMLInputElement).value).toBe('')
    expect(wrapper.text()).not.toContain('Name is required')
    expect(wrapper.text()).not.toContain('URL is required')
  })

  it('emits cancel event when cancel button is clicked', async () => {
    const wrapper = mount(AddBookmarkForm)

    const cancelButton = wrapper.find('button[type="button"]')
    await cancelButton.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('resets form when cancel is clicked', async () => {
    const wrapper = mount(AddBookmarkForm)

    const nameInput = wrapper.find('input[id="bookmark-name"]')
    const urlInput = wrapper.find('input[id="bookmark-url"]')

    await nameInput.setValue('Test Bookmark')
    await urlInput.setValue('https://example.com')

    const cancelButton = wrapper.find('button[type="button"]')
    await cancelButton.trigger('click')

    await wrapper.vm.$nextTick()

    expect((nameInput.element as HTMLInputElement).value).toBe('')
    expect((urlInput.element as HTMLInputElement).value).toBe('')
  })

  it('emits cancel event when clicking outside the modal', async () => {
    const wrapper = mount(AddBookmarkForm)

    const backdrop = wrapper.find('.fixed.inset-0')
    await backdrop.trigger('click.self')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('does not emit cancel when clicking inside the modal', async () => {
    const wrapper = mount(AddBookmarkForm)

    const modalContent = wrapper.find('.bg-\\[var\\(--color-background\\)\\]')
    await modalContent.trigger('click')

    expect(wrapper.emitted('cancel')).toBeFalsy()
  })

  it('clears error message on new submission attempt', async () => {
    const wrapper = mount(AddBookmarkForm)

    // First submission with invalid data
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    expect(wrapper.text()).toContain('Name is required')

    // Second submission with valid data
    const nameInput = wrapper.find('input[id="bookmark-name"]')
    const urlInput = wrapper.find('input[id="bookmark-url"]')
    await nameInput.setValue('Test Bookmark')
    await urlInput.setValue('https://example.com')
    await form.trigger('submit.prevent')

    expect(wrapper.text()).not.toContain('Name is required')
  })

  it('displays error message when validation fails', async () => {
    const wrapper = mount(AddBookmarkForm)

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    const errorDiv = wrapper.find('.text-\\[\\#dc3545\\]')
    expect(errorDiv.exists()).toBe(true)
    expect(errorDiv.text()).toBe('Name is required')
  })
})

