import type { Meta, StoryObj } from '@storybook/vue3-vite'
import HelloWorld from './HelloWorld.vue'

const meta = {
  title: 'Components/HelloWorld',
  component: HelloWorld,
  tags: ['autodocs'],
  argTypes: {
    msg: {
      control: 'text',
      description: 'The greeting message to display',
    },
  },
  args: {
    msg: 'Hello World!',
  },
} satisfies Meta<typeof HelloWorld>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    msg: 'Hello World!',
  },
}

export const CustomMessage: Story = {
  args: {
    msg: 'Welcome to Storybook!',
  },
}

export const LongMessage: Story = {
  args: {
    msg: 'This is a longer message that demonstrates how the component handles extended text content.',
  },
}

