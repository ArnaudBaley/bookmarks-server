import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { NotFoundException } from '@nestjs/common';

describe('BookmarksController', () => {
  let controller: BookmarksController;
  let service: BookmarksService;

  const mockBookmarksService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    removeAll: jest.fn(),
    refreshAllFavicons: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookmarksController],
      providers: [
        {
          provide: BookmarksService,
          useValue: mockBookmarksService,
        },
      ],
    }).compile();

    controller = module.get<BookmarksController>(BookmarksController);
    service = module.get<BookmarksService>(BookmarksService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all bookmarks', async () => {
      const mockBookmarks = [
        {
          id: '1',
          name: 'Bookmark 1',
          url: 'https://example.com',
          favicon: 'data:image/png;base64,abc123',
          tabId: 'tab-1',
          tabs: [{ id: 'tab-1' }, { id: 'tab-2' }],
          bookmarkGroups: [{ groupId: 'group-1', orderIndex: 0 }],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];
      mockBookmarksService.findAll.mockResolvedValue(mockBookmarks);

      const result = await controller.findAll();

      expect(result).toEqual([
        {
          id: '1',
          name: 'Bookmark 1',
          url: 'https://example.com',
          favicon: 'data:image/png;base64,abc123',
          tabId: 'tab-1',
          tabIds: ['tab-1', 'tab-2'],
          groupIds: ['group-1'],
          groupOrderIndexes: { 'group-1': 0 },
          createdAt: mockBookmarks[0].createdAt.toISOString(),
          updatedAt: mockBookmarks[0].updatedAt.toISOString(),
        },
      ]);
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return bookmarks filtered by tabId', async () => {
      const mockBookmarks = [
        {
          id: '1',
          name: 'Bookmark 1',
          url: 'https://example.com',
          favicon: null,
          tabId: 'tab-1',
          tabs: [{ id: 'tab-1' }],
          bookmarkGroups: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];
      mockBookmarksService.findAll.mockResolvedValue(mockBookmarks);

      const result = await controller.findAll('tab-1');

      expect(result).toEqual([
        {
          id: '1',
          name: 'Bookmark 1',
          url: 'https://example.com',
          favicon: null,
          tabId: 'tab-1',
          tabIds: ['tab-1'],
          groupIds: [],
          groupOrderIndexes: {},
          createdAt: mockBookmarks[0].createdAt.toISOString(),
          updatedAt: mockBookmarks[0].updatedAt.toISOString(),
        },
      ]);
      expect(service.findAll).toHaveBeenCalledWith('tab-1');
    });
  });

  describe('create', () => {
    it('should create a bookmark', async () => {
      const createDto: CreateBookmarkDto = {
        name: 'New Bookmark',
        url: 'https://example.com',
        tabId: 'tab-1',
      };
      const mockBookmark = {
        id: 'new-id',
        ...createDto,
        favicon: 'data:image/png;base64,abc123',
        tabs: [{ id: 'tab-1' }],
        bookmarkGroups: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };
      mockBookmarksService.create.mockResolvedValue(mockBookmark);

      const result = await controller.create(createDto);

      expect(result).toEqual({
        id: 'new-id',
        name: 'New Bookmark',
        url: 'https://example.com',
        favicon: 'data:image/png;base64,abc123',
        tabId: 'tab-1',
        tabIds: ['tab-1'],
        groupIds: [],
        groupOrderIndexes: {},
        createdAt: mockBookmark.createdAt.toISOString(),
        updatedAt: mockBookmark.updatedAt.toISOString(),
      });
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should handle bookmark with multiple tabs and groups', async () => {
      const createDto: CreateBookmarkDto = {
        name: 'New Bookmark',
        url: 'https://example.com',
        tabIds: ['tab-1', 'tab-2'],
        groupIds: ['group-1', 'group-2'],
      };
      const mockBookmark = {
        id: 'new-id',
        name: 'New Bookmark',
        url: 'https://example.com',
        favicon: null,
        tabId: 'tab-1',
        tabs: [{ id: 'tab-1' }, { id: 'tab-2' }],
        bookmarkGroups: [
          { groupId: 'group-1', orderIndex: 0 },
          { groupId: 'group-2', orderIndex: 1 },
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };
      mockBookmarksService.create.mockResolvedValue(mockBookmark);

      const result = await controller.create(createDto);

      expect(result.tabIds).toEqual(['tab-1', 'tab-2']);
      expect(result.groupIds).toEqual(['group-1', 'group-2']);
    });
  });

  describe('update', () => {
    it('should update a bookmark', async () => {
      const updateDto: UpdateBookmarkDto = {
        name: 'Updated Bookmark',
      };
      const mockBookmark = {
        id: '1',
        name: 'Updated Bookmark',
        url: 'https://example.com',
        favicon: 'data:image/png;base64,abc123',
        tabId: 'tab-1',
        tabs: [{ id: 'tab-1' }],
        bookmarkGroups: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      mockBookmarksService.update.mockResolvedValue(mockBookmark);

      const result = await controller.update('1', updateDto);

      expect(result).toEqual({
        id: '1',
        name: 'Updated Bookmark',
        url: 'https://example.com',
        favicon: 'data:image/png;base64,abc123',
        tabId: 'tab-1',
        tabIds: ['tab-1'],
        groupIds: [],
        groupOrderIndexes: {},
        createdAt: mockBookmark.createdAt.toISOString(),
        updatedAt: mockBookmark.updatedAt.toISOString(),
      });
      expect(service.update).toHaveBeenCalledWith('1', updateDto);
    });

    it('should handle bookmark with no tabs or groups', async () => {
      const updateDto: UpdateBookmarkDto = {
        name: 'Updated Bookmark',
      };
      const mockBookmark = {
        id: '1',
        name: 'Updated Bookmark',
        url: 'https://example.com',
        favicon: null,
        tabId: null,
        tabs: null,
        bookmarkGroups: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      mockBookmarksService.update.mockResolvedValue(mockBookmark);

      const result = await controller.update('1', updateDto);

      expect(result.tabIds).toEqual([]);
      expect(result.groupIds).toEqual([]);
    });
  });

  describe('remove', () => {
    it('should remove a bookmark', async () => {
      mockBookmarksService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when bookmark not found', async () => {
      mockBookmarksService.remove.mockRejectedValue(
        new NotFoundException('Bookmark with ID 1 not found'),
      );

      await expect(controller.remove('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeAll', () => {
    it('should remove all bookmarks', async () => {
      mockBookmarksService.removeAll.mockResolvedValue(undefined);

      await controller.removeAll();

      expect(service.removeAll).toHaveBeenCalled();
    });
  });

  describe('refreshFavicons', () => {
    it('should refresh all favicons', async () => {
      const expectedResult = { updated: 5, failed: 1 };
      mockBookmarksService.refreshAllFavicons.mockResolvedValue(expectedResult);

      const result = await controller.refreshFavicons();

      expect(result).toEqual(expectedResult);
      expect(service.refreshAllFavicons).toHaveBeenCalled();
    });
  });
});
