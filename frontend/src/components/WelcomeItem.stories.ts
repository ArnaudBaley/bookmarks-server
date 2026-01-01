import type { Meta, StoryObj } from '@storybook/vue3-vite'
import WelcomeItem from './WelcomeItem.vue'
import IconDocumentation from './icons/IconDocumentation.vue'
import IconTooling from './icons/IconTooling.vue'

const meta = {
  title: 'Components/WelcomeItem',
  component: WelcomeItem,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof WelcomeItem>

export default meta
type Story = StoryObj<typeof meta>

export const WithDocumentationIcon: Story = {
  render: () => ({
    components: { WelcomeItem, IconDocumentation },
    template: `
      <WelcomeItem>
        <template #icon>
          <IconDocumentation />
        </template>
        <template #heading>Documentation</template>
        Vue's
        <a href="https://vuejs.org/" target="_blank" rel="noopener">official documentation</a>
        provides you with all information you need to get started.
      </WelcomeItem>
    `,
  }),
}

export const WithToolingIcon: Story = {
  render: () => ({
    components: { WelcomeItem, IconTooling },
    template: `
      <WelcomeItem>
        <template #icon>
          <IconTooling />
        </template>
        <template #heading>Tooling</template>
        This project is served and bundled with
        <a href="https://vite.dev/guide/features.html" target="_blank" rel="noopener">Vite</a>.
      </WelcomeItem>
    `,
  }),
}

export const WithCustomContent: Story = {
  render: () => ({
    components: { WelcomeItem, IconDocumentation },
    template: `
      <WelcomeItem>
        <template #icon>
          <IconDocumentation />
        </template>
        <template #heading>Custom Heading</template>
        This is custom content that demonstrates how the WelcomeItem component
        can be used with different icons and text content.
      </WelcomeItem>
    `,
  }),
}

