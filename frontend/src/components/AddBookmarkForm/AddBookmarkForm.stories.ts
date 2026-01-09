import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import AddBookmarkForm from './AddBookmarkForm.vue'

const meta = {
  title: 'Components/AddBookmarkForm',
  component: AddBookmarkForm,
  tags: ['autodocs'],
  argTypes: {},
  args: {
      onSubmit: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof AddBookmarkForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onSubmit: fn(),
    onCancel: fn(),
  },
  render: (args) => ({
    components: { AddBookmarkForm },
    setup() {
      return { args }
    },
    template: '<AddBookmarkForm @submit="args.onSubmit" @cancel="args.onCancel" />',
  }),
}

