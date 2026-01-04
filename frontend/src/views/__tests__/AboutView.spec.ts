import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AboutView from '../AboutView.vue'

describe('AboutView', () => {
  it('renders the about page heading', () => {
    const wrapper = mount(AboutView)
    const heading = wrapper.find('h1')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toBe('This is an about page')
  })

  it('renders the about page container', () => {
    const wrapper = mount(AboutView)
    const container = wrapper.find('.lg\\:min-h-screen')
    expect(container.exists()).toBe(true)
  })

  it('has correct structure', () => {
    const wrapper = mount(AboutView)
    expect(wrapper.html()).toContain('This is an about page')
  })
})

