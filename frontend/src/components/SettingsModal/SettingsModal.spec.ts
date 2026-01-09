import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountWithPinia } from '@/test-utils'
import SettingsModal from './SettingsModal.vue'
import { useThemeStore } from '@/stores/theme/theme'
import { useBookmarkStore } from '@/stores/bookmark/bookmark'
import { useGroupStore } from '@/stores/group/group'
import { useTabStore } from '@/stores/tab/tab'

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders settings modal', () => {
    const wrapper = mountWithPinia(SettingsModal)

    expect(wrapper.find('h2').text()).toBe('Settings')
  })

  it('emits cancel event when cancel button is clicked', async () => {
    const wrapper = mountWithPinia(SettingsModal)

    const closeButton = wrapper.find('button[aria-label="Close modal"]')
    await closeButton.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('emits cancel event when clicking outside the modal', async () => {
    const wrapper = mountWithPinia(SettingsModal)

    const backdrop = wrapper.find('.fixed.inset-0')
    await backdrop.trigger('click.self')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('does not emit cancel when clicking inside the modal', async () => {
    const wrapper = mountWithPinia(SettingsModal)

    const modalContent = wrapper.find('.bg-\\[var\\(--color-background\\)\\]')
    await modalContent.trigger('click')

    expect(wrapper.emitted('cancel')).toBeFalsy()
  })

  it('handles Escape key to cancel', async () => {
    const wrapper = mountWithPinia(SettingsModal)

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    window.dispatchEvent(escapeEvent)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('handles Escape key to close delete confirmation', async () => {
    const wrapper = mountWithPinia(SettingsModal)

    // Click delete all data button
    const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete All Data') && !btn.text().includes('Deleting'))
    expect(deleteButton).toBeDefined()
    await deleteButton!.trigger('click')
    await wrapper.vm.$nextTick()

    // Trigger Escape key
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    window.dispatchEvent(escapeEvent)
    await wrapper.vm.$nextTick()

    // Delete confirmation should be closed
    expect(wrapper.find('h2').text()).toBe('Settings')
  })

  it('handles Escape key to close export/import modal', async () => {
    const wrapper = mountWithPinia(SettingsModal)

    // Click export/import button
    const exportImportButton = wrapper.findAll('button').find((btn) => btn.text().includes('Export / Import Data') || btn.text().includes('Export/Import'))
    expect(exportImportButton).toBeDefined()
    await exportImportButton!.trigger('click')
    await wrapper.vm.$nextTick()

    // Trigger Escape key
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    window.dispatchEvent(escapeEvent)
    await wrapper.vm.$nextTick()

    // Export/import modal should be closed
    expect(wrapper.find('h2').text()).toBe('Settings')
  })

  it('shows delete confirmation when delete all data button is clicked', async () => {
    const wrapper = mountWithPinia(SettingsModal)

    const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete All Data') && !btn.text().includes('Deleting'))
    await deleteButton!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('h2').text()).toBe('Delete All Data')
    expect(wrapper.text()).toContain('Are you sure you want to delete')
    expect(wrapper.text()).toContain('All tabs')
    expect(wrapper.text()).toContain('All groups')
    expect(wrapper.text()).toContain('All bookmarks')
  })

  it('closes delete confirmation when cancel is clicked', async () => {
    const wrapper = mountWithPinia(SettingsModal)

    // Click delete all data button
    const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete All Data') && !btn.text().includes('Deleting'))
    expect(deleteButton).toBeDefined()
    await deleteButton!.trigger('click')
    await wrapper.vm.$nextTick()

    // Click cancel button
    const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel')
    expect(cancelButton).toBeDefined()
    await cancelButton!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('h2').text()).toBe('Settings')
  })

  it('deletes all data when confirmed', async () => {
    const wrapper = mountWithPinia(SettingsModal)
    const bookmarkStore = useBookmarkStore()
    const groupStore = useGroupStore()
    const tabStore = useTabStore()

    const deleteAllBookmarksSpy = vi.spyOn(bookmarkStore, 'deleteAllBookmarks').mockResolvedValue()
    const deleteAllGroupsSpy = vi.spyOn(groupStore, 'deleteAllGroups').mockResolvedValue()
    const deleteAllTabsSpy = vi.spyOn(tabStore, 'deleteAllTabs').mockResolvedValue()

    // Click delete all data button
    const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete All Data') && !btn.text().includes('Deleting'))
    await deleteButton!.trigger('click')
    await wrapper.vm.$nextTick()

    // Click confirm delete button
    const confirmButton = wrapper.findAll('button').find((btn) => btn.text() === 'Delete All Data' && btn.attributes('disabled') === undefined)
    await confirmButton!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(deleteAllBookmarksSpy).toHaveBeenCalled()
    expect(deleteAllGroupsSpy).toHaveBeenCalled()
    expect(deleteAllTabsSpy).toHaveBeenCalled()
  })

  it('closes modal after successful deletion', async () => {
    const wrapper = mountWithPinia(SettingsModal)
    const bookmarkStore = useBookmarkStore()
    const groupStore = useGroupStore()
    const tabStore = useTabStore()

    vi.spyOn(bookmarkStore, 'deleteAllBookmarks').mockResolvedValue()
    vi.spyOn(groupStore, 'deleteAllGroups').mockResolvedValue()
    vi.spyOn(tabStore, 'deleteAllTabs').mockResolvedValue()

    // Click delete all data button
    const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete All Data') && !btn.text().includes('Deleting'))
    await deleteButton!.trigger('click')
    await wrapper.vm.$nextTick()

    // Click confirm delete button
    const confirmButton = wrapper.findAll('button').find((btn) => btn.text() === 'Delete All Data' && btn.attributes('disabled') === undefined)
    await confirmButton!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('displays error message when deletion fails', async () => {
    const wrapper = mountWithPinia(SettingsModal)
    const bookmarkStore = useBookmarkStore()

    vi.spyOn(bookmarkStore, 'deleteAllBookmarks').mockRejectedValue(new Error('Deletion failed'))

    // Click delete all data button
    const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete All Data') && !btn.text().includes('Deleting'))
    expect(deleteButton).toBeDefined()
    await deleteButton!.trigger('click')
    await wrapper.vm.$nextTick()

    // Click confirm delete button
    const confirmButton = wrapper.findAll('button').find((btn) => btn.text() === 'Delete All Data' && btn.attributes('disabled') === undefined)
    expect(confirmButton).toBeDefined()
    await confirmButton!.trigger('click')
    // Wait for async operation and error to be set
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    // Wait a bit more for error to be displayed
    await new Promise(resolve => setTimeout(resolve, 10))

    // Error should be in the delete confirmation section
    const errorDivs = wrapper.findAll('.text-\\[\\#dc3545\\]')
    const errorDiv = errorDivs.find(div => div.text().includes('Deletion failed'))
    expect(errorDiv).toBeDefined()
    if (errorDiv) {
      expect(errorDiv.text()).toContain('Deletion failed')
    }
  })

  it('disables delete button while deleting', async () => {
    const wrapper = mountWithPinia(SettingsModal)
    const bookmarkStore = useBookmarkStore()
    const groupStore = useGroupStore()
    const tabStore = useTabStore()

    // Create a promise that we can control
    let resolvePromise: () => void
    const deletePromise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })

    vi.spyOn(bookmarkStore, 'deleteAllBookmarks').mockReturnValue(deletePromise)
    vi.spyOn(groupStore, 'deleteAllGroups').mockResolvedValue()
    vi.spyOn(tabStore, 'deleteAllTabs').mockResolvedValue()

    // Click delete all data button
    const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete All Data') && !btn.text().includes('Deleting'))
    await deleteButton!.trigger('click')
    await wrapper.vm.$nextTick()

    // Click confirm delete button
    const confirmButton = wrapper.findAll('button').find((btn) => btn.text() === 'Delete All Data' && btn.attributes('disabled') === undefined)
    await confirmButton!.trigger('click')
    await wrapper.vm.$nextTick()

    // Button should be disabled and show "Deleting..."
    const updatedButton = wrapper.findAll('button').find((btn) => btn.text().includes('Deleting'))
    expect(updatedButton).toBeDefined()
    expect(updatedButton!.attributes('disabled')).toBeDefined()

    // Resolve the promise
    resolvePromise!()
    await wrapper.vm.$nextTick()
  })

  it('shows export/import modal when export/import button is clicked', async () => {
    const wrapper = mountWithPinia(SettingsModal)

    const exportImportButton = wrapper.findAll('button').find((btn) => btn.text().includes('Export / Import Data'))
    await exportImportButton!.trigger('click')
    await wrapper.vm.$nextTick()

    // Should show ExportImportModal component
    expect(wrapper.findComponent({ name: 'ExportImportModal' }).exists()).toBe(true)
  })

  it('closes export/import modal when cancel is emitted', async () => {
    const wrapper = mountWithPinia(SettingsModal)

    // Click export/import button
    const exportImportButton = wrapper.findAll('button').find((btn) => btn.text().includes('Export / Import Data'))
    await exportImportButton!.trigger('click')
    await wrapper.vm.$nextTick()

    // Find and trigger cancel on ExportImportModal
    const exportImportModal = wrapper.findComponent({ name: 'ExportImportModal' })
    await exportImportModal.vm.$emit('cancel')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('h2').text()).toBe('Settings')
  })

  it('toggles theme when theme button is clicked', async () => {
    const wrapper = mountWithPinia(SettingsModal)
    const themeStore = useThemeStore()

    const toggleThemeSpy = vi.spyOn(themeStore, 'toggleTheme')

    const themeButton = wrapper.find('button[aria-label*="theme"]')
    await themeButton.trigger('click')

    expect(toggleThemeSpy).toHaveBeenCalled()
  })

  it('displays correct theme icon based on current theme', async () => {
    const wrapper = mountWithPinia(SettingsModal)
    const themeStore = useThemeStore()

    themeStore.theme = 'light'
    await wrapper.vm.$nextTick()

    // Should show moon icon for light theme
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)

    themeStore.theme = 'dark'
    await wrapper.vm.$nextTick()

    // Should show sun icon for dark theme
    const svg2 = wrapper.find('svg')
    expect(svg2.exists()).toBe(true)
  })

  it('displays theme section', () => {
    const wrapper = mountWithPinia(SettingsModal)

    expect(wrapper.text()).toContain('Theme')
  })

  it('displays export/import section', () => {
    const wrapper = mountWithPinia(SettingsModal)

    expect(wrapper.text()).toContain('Export / Import')
    expect(wrapper.text()).toContain('Export / Import Data')
  })

  it('displays delete all data section', () => {
    const wrapper = mountWithPinia(SettingsModal)

    expect(wrapper.text()).toContain('Delete All Data')
  })

  it('resets all state when cancel is called', async () => {
    const wrapper = mountWithPinia(SettingsModal)

    // Open delete confirmation
    const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete All Data') && !btn.text().includes('Deleting'))
    expect(deleteButton).toBeDefined()
    await deleteButton!.trigger('click')
    await wrapper.vm.$nextTick()

    // Click cancel button in delete confirmation
    const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Cancel')
    expect(cancelButton).toBeDefined()
    await cancelButton!.trigger('click')
    await wrapper.vm.$nextTick()

    // State should be reset - we should be back to main settings view
    // The cancel button in delete confirmation just closes the confirmation, not the modal
    // So we check that we're back to settings view
    expect(wrapper.find('h2').text()).toBe('Settings')
  })

  it('removes event listener on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mountWithPinia(SettingsModal)

    wrapper.unmount()
    await wrapper.vm.$nextTick()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('handles non-Error exceptions during deletion', async () => {
    const wrapper = mountWithPinia(SettingsModal)
    const bookmarkStore = useBookmarkStore()

    vi.spyOn(bookmarkStore, 'deleteAllBookmarks').mockRejectedValue('String error')

    // Click delete all data button
    const deleteButton = wrapper.findAll('button').find((btn) => btn.text().includes('Delete All Data') && !btn.text().includes('Deleting'))
    expect(deleteButton).toBeDefined()
    await deleteButton!.trigger('click')
    await wrapper.vm.$nextTick()

    // Click confirm delete button
    const confirmButton = wrapper.findAll('button').find((btn) => btn.text() === 'Delete All Data' && btn.attributes('disabled') === undefined)
    expect(confirmButton).toBeDefined()
    await confirmButton!.trigger('click')
    // Wait for async operation and error to be set
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    // Wait a bit more for error to be displayed
    await new Promise(resolve => setTimeout(resolve, 10))

    // Error should be in the delete confirmation section
    const errorDivs = wrapper.findAll('.text-\\[\\#dc3545\\]')
    const errorDiv = errorDivs.find(div => div.text().includes('Failed to delete all data'))
    expect(errorDiv).toBeDefined()
    if (errorDiv) {
      expect(errorDiv.text()).toContain('Failed to delete all data')
    }
  })
})

