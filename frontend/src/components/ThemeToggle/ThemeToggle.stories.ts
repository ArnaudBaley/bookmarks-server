import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ThemeToggle from './ThemeToggle.vue'
import { useThemeStore } from '@/stores/theme/theme'

const meta = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof ThemeToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { ThemeToggle },
    setup() {
      const themeStore = useThemeStore()
      return { themeStore }
    },
    template: `
      <div style="padding: 2rem;">
        <p>Current theme: {{ themeStore.theme }}</p>
        <ThemeToggle />
      </div>
    `,
  }),
}

export const LightTheme: Story = {
  render: () => ({
    components: { ThemeToggle },
    setup() {
      const themeStore = useThemeStore()
      themeStore.setTheme('light')
      return { themeStore }
    },
    template: `
      <div style="padding: 2rem;">
        <p>Current theme: {{ themeStore.theme }}</p>
        <ThemeToggle />
      </div>
    `,
  }),
}

export const DarkTheme: Story = {
  render: () => ({
    components: { ThemeToggle },
    setup() {
      const themeStore = useThemeStore()
      themeStore.setTheme('dark')
      return { themeStore }
    },
    template: `
      <div style="padding: 2rem;">
        <p>Current theme: {{ themeStore.theme }}</p>
        <ThemeToggle />
      </div>
    `,
  }),
}

