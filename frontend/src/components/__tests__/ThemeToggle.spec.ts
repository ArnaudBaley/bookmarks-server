import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountWithPinia } from '@/test-utils'
import ThemeToggle from '../ThemeToggle.vue'
import { useThemeStore } from '@/stores/theme'

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Reset localStorage
    localStorage.clear()
    // Reset document class
    document.documentElement.classList.remove('dark')
  })

  it('renders moon icon when theme is light', () => {
    const wrapper = mountWithPinia(ThemeToggle)
    const store = useThemeStore()
    store.setTheme('light')

    const icon = wrapper.find('span')
    expect(icon.text()).toBe('🌙')
  })

  it('renders sun icon when theme is dark', async () => {
    const wrapper = mountWithPinia(ThemeToggle)
    const store = useThemeStore()
    store.setTheme('dark')
    await wrapper.vm.$nextTick()

    const icon = wrapper.find('span')
    expect(icon.text()).toBe('☀️')
  })

  it('calls toggleTheme when button is clicked', async () => {
    const wrapper = mountWithPinia(ThemeToggle)
    const store = useThemeStore()
    store.setTheme('light')

    const button = wrapper.find('button')
    const toggleSpy = vi.spyOn(store, 'toggleTheme')

    await button.trigger('click')

    expect(toggleSpy).toHaveBeenCalledTimes(1)
  })

  it('updates aria-label based on current theme', async () => {
    const wrapper = mountWithPinia(ThemeToggle)
    const store = useThemeStore()
    store.setTheme('light')
    await wrapper.vm.$nextTick()

    const button = wrapper.find('button')
    expect(button.attributes('aria-label')).toBe('Switch to dark theme')

    store.setTheme('dark')
    await wrapper.vm.$nextTick()
    expect(button.attributes('aria-label')).toBe('Switch to light theme')
  })

  it('updates title attribute based on current theme', async () => {
    const wrapper = mountWithPinia(ThemeToggle)
    const store = useThemeStore()
    store.setTheme('light')
    await wrapper.vm.$nextTick()

    const button = wrapper.find('button')
    expect(button.attributes('title')).toBe('Switch to dark theme')

    store.setTheme('dark')
    await wrapper.vm.$nextTick()
    expect(button.attributes('title')).toBe('Switch to light theme')
  })

  it('displays moon icon for light theme', () => {
    const wrapper = mountWithPinia(ThemeToggle)
    const store = useThemeStore()
    store.setTheme('light')

    const icon = wrapper.find('span')
    expect(icon.exists()).toBe(true)
    expect(icon.text()).toBe('🌙')
    expect(icon.classes()).toContain('leading-none')
  })

  it('displays sun icon for dark theme', async () => {
    const wrapper = mountWithPinia(ThemeToggle)
    const store = useThemeStore()
    store.setTheme('dark')
    await wrapper.vm.$nextTick()

    const icon = wrapper.find('span')
    expect(icon.exists()).toBe(true)
    expect(icon.text()).toBe('☀️')
    expect(icon.classes()).toContain('leading-none')
  })

  it('has correct button styling classes', () => {
    const wrapper = mountWithPinia(ThemeToggle)
    const button = wrapper.find('button')

    expect(button.classes()).toContain('w-10')
    expect(button.classes()).toContain('h-10')
    expect(button.classes()).toContain('rounded-full')
  })

  it('toggles theme when clicked', async () => {
    const wrapper = mountWithPinia(ThemeToggle)
    const store = useThemeStore()
    store.setTheme('light')

    expect(store.theme).toBe('light')

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(store.theme).toBe('dark')
  })
})

