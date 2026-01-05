import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import BookmarkCard from './BookmarkCard.vue'
import type { Bookmark } from '@/types/bookmark'

const meta = {
  title: 'Components/BookmarkCard',
  component: BookmarkCard,
  tags: ['autodocs'],
  argTypes: {
    bookmark: {
      control: 'object',
      description: 'The bookmark object to display',
    },
  },
  args: {
    onDelete: fn(),
  },
} satisfies Meta<typeof BookmarkCard>

export default meta
type Story = StoryObj<typeof meta>

const sampleBookmark: Bookmark = {
  id: '1',
  name: 'Vue.js',
  url: 'https://vuejs.org',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

export const Default: Story = {
  args: {
    bookmark: sampleBookmark,
    onDelete: fn(),
  },
  render: (args) => ({
    components: { BookmarkCard },
    setup() {
      return { args }
    },
    template: '<BookmarkCard :bookmark="args.bookmark" @delete="args.onDelete" />',
  }),
}

export const LongName: Story = {
  args: {
    bookmark: {
      ...sampleBookmark,
      name: 'This is a very long bookmark name that might wrap to multiple lines',
    },
    onDelete: fn(),
  },
  render: (args) => ({
    components: { BookmarkCard },
    setup() {
      return { args }
    },
    template: '<BookmarkCard :bookmark="args.bookmark" @delete="args.onDelete" />',
  }),
}

export const GitHub: Story = {
  args: {
    bookmark: {
      ...sampleBookmark,
      name: 'GitHub',
      url: 'https://github.com',
    },
    onDelete: fn(),
  },
  render: (args) => ({
    components: { BookmarkCard },
    setup() {
      return { args }
    },
    template: '<BookmarkCard :bookmark="args.bookmark" @delete="args.onDelete" />',
  }),
}

export const StackOverflow: Story = {
  args: {
    bookmark: {
      ...sampleBookmark,
      name: 'Stack Overflow',
      url: 'https://stackoverflow.com',
    },
    onDelete: fn(),
  },
  render: (args) => ({
    components: { BookmarkCard },
    setup() {
      return { args }
    },
    template: '<BookmarkCard :bookmark="args.bookmark" @delete="args.onDelete" />',
  }),
}

