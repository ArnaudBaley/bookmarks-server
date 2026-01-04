import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EditBookmarkForm from '../EditBookmarkForm.vue'
import { createBookmark } from '@/test-utils'

describe('EditBookmarkForm', () => {
  const mockBookmark = createBookmark({
    id: 'test-id-1',
    name: 'Test Bookmark',
    url: 'https://example.com',
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields correctly', () => {
    const wrapper = mount(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    expect(wrapper.find('input[id="bookmark-name"]').exists()).toBe(true)
    expect(wrapper.find('input[id="bookmark-url"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    // Find cancel button by text content
    const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel')
    expect(cancelButton?.exists()).toBe(true)
  })

  it('renders form title', () => {
    const wrapper = mount(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })
    expect(wrapper.find('h2').text()).toBe('Edit Bookmark')
  })

  it('initializes form fields with bookmark data', async () => {
    const wrapper = mount(EditBookmarkForm, {
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
    const wrapper = mount(EditBookmarkForm, {
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
    const wrapper = mount(EditBookmarkForm, {
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
    const wrapper = mount(EditBookmarkForm, {
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
    const wrapper = mount(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

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
      },
    ])
  })

  it('keeps https:// if already present', async () => {
    const wrapper = mount(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    const urlInput = wrapper.find('input[id="bookmark-url"]')
    await urlInput.setValue('https://example.com')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      'test-id-1',
      {
        name: 'Test Bookmark',
        url: 'https://example.com',
      },
    ])
  })

  it('keeps http:// if already present', async () => {
    const wrapper = mount(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    const urlInput = wrapper.find('input[id="bookmark-url"]')
    await urlInput.setValue('http://example.com')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      'test-id-1',
      {
        name: 'Test Bookmark',
        url: 'http://example.com',
      },
    ])
  })

  it('trims whitespace from name and URL', async () => {
    const wrapper = mount(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

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
      },
    ])
  })

  it('emits submit event with correct data on valid form submission', async () => {
    const wrapper = mount(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

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
      },
    ])
  })

  it('emits cancel event when cancel button is clicked', async () => {
    const wrapper = mount(EditBookmarkForm, {
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
    const wrapper = mount(EditBookmarkForm, {
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
    const wrapper = mount(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    const backdrop = wrapper.find('.fixed.inset-0')
    await backdrop.trigger('click.self')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('does not emit cancel when clicking inside the modal', async () => {
    const wrapper = mount(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

    const modalContent = wrapper.find('.bg-\\[var\\(--color-background\\)\\]')
    await modalContent.trigger('click')

    expect(wrapper.emitted('cancel')).toBeFalsy()
  })

  it('emits delete event when delete button is clicked', async () => {
    const wrapper = mount(EditBookmarkForm, {
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
    const wrapper = mount(EditBookmarkForm, {
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
    const wrapper = mount(EditBookmarkForm, {
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
    const wrapper = mount(EditBookmarkForm, {
      props: {
        bookmark: mockBookmark,
      },
    })

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
})

