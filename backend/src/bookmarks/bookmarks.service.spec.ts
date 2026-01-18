import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { Bookmark } from '../entities/bookmark.entity';
import { Group } from '../entities/group.entity';
import { Tab } from '../entities/tab.entity';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';

describe('BookmarksService', () => {
  let service: BookmarksService;

  const mockBookmarkRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockGroupRepository = {
    findBy: jest.fn(),
  };

  const mockTabRepository = {
    findBy: jest.fn(),
    findOne: jest.fn(),
  };

  let mockQueryBuilder: {
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    mockBookmarkRepository.createQueryBuilder = jest.fn(() => mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        {
          provide: getRepositoryToken(Bookmark),
          useValue: mockBookmarkRepository,
        },
        {
          provide: getRepositoryToken(Group),
          useValue: mockGroupRepository,
        },
        {
          provide: getRepositoryToken(Tab),
          useValue: mockTabRepository,
        },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all bookmarks when no tabId is provided', async () => {
      const mockBookmarks = [
        {
          id: '1',
          name: 'Bookmark 1',
          url: 'https://example.com',
          tabId: 'tab-1',
          groups: [],
          tabs: [],
        },
        {
          id: '2',
          name: 'Bookmark 2',
          url: 'https://example2.com',
          tabId: 'tab-2',
          groups: [],
          tabs: [],
        },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockBookmarks);

      const result = await service.findAll();

      expect(result).toEqual(mockBookmarks);
      expect(mockBookmarkRepository.createQueryBuilder).toHaveBeenCalledWith('bookmark');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('bookmark.groups', 'groups');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('bookmark.tabs', 'tabs');
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should return bookmarks filtered by tabId using query builder', async () => {
      const mockBookmarks = [
        {
          id: '1',
          name: 'Bookmark 1',
          url: 'https://example.com',
          tabId: 'tab-1',
          groups: [],
          tabs: [],
        },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockBookmarks);

      const result = await service.findAll('tab-1');

      expect(result).toEqual(mockBookmarks);
      expect(mockBookmarkRepository.createQueryBuilder).toHaveBeenCalledWith('bookmark');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(bookmark.tabId = :tabId OR tabs.id = :tabId)',
        { tabId: 'tab-1' }
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a bookmark when found', async () => {
      const mockBookmark = {
        id: '1',
        name: 'Bookmark 1',
        url: 'https://example.com',
        tabId: 'tab-1',
        groups: [],
      };
      mockBookmarkRepository.findOne.mockResolvedValue(mockBookmark);

      const result = await service.findOne('1');

      expect(result).toEqual(mockBookmark);
      expect(mockBookmarkRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['groups', 'tabs'],
      });
    });

    it('should throw NotFoundException when bookmark not found', async () => {
      mockBookmarkRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Bookmark with ID non-existent not found',
      );
    });
  });

  describe('create', () => {
    it('should create a bookmark without groups', async () => {
      const createDto: CreateBookmarkDto = {
        name: 'New Bookmark',
        url: 'https://example.com',
        tabId: 'tab-1',
      };
      const mockCreatedBookmark = {
        id: 'new-id',
        ...createDto,
        groups: [],
      };
      const mockSavedBookmark = { id: 'new-id', ...createDto };

      mockBookmarkRepository.create.mockReturnValue(mockSavedBookmark);
      mockBookmarkRepository.save.mockResolvedValue(mockSavedBookmark);
      mockBookmarkRepository.findOne.mockResolvedValue(mockCreatedBookmark);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedBookmark);
      expect(mockBookmarkRepository.create).toHaveBeenCalledWith({
        id: expect.any(String) as string,
        name: createDto.name,
        url: createDto.url,
        tabId: createDto.tabId,
      });
      expect(mockBookmarkRepository.save).toHaveBeenCalled();
    });

    it('should create a bookmark with groups', async () => {
      const createDto: CreateBookmarkDto = {
        name: 'New Bookmark',
        url: 'https://example.com',
        tabId: 'tab-1',
        groupIds: ['group-1', 'group-2'],
      };
      const mockGroups = [
        { id: 'group-1', name: 'Group 1' },
        { id: 'group-2', name: 'Group 2' },
      ];
      const mockCreatedBookmark = {
        id: 'new-id',
        name: createDto.name,
        url: createDto.url,
        tabId: createDto.tabId,
        groups: mockGroups,
      };
      const mockSavedBookmark = {
        id: 'new-id',
        ...createDto,
        groups: mockGroups,
      };

      mockBookmarkRepository.create.mockReturnValue(mockSavedBookmark);
      mockGroupRepository.findBy.mockResolvedValue(mockGroups);
      mockBookmarkRepository.save.mockResolvedValue(mockSavedBookmark);
      mockBookmarkRepository.findOne.mockResolvedValue(mockCreatedBookmark);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedBookmark);
      expect(mockGroupRepository.findBy).toHaveBeenCalledWith({
        id: In(['group-1', 'group-2']),
      });
    });

    it('should handle null tabId', async () => {
      const createDto: CreateBookmarkDto = {
        name: 'New Bookmark',
        url: 'https://example.com',
      };
      const mockCreatedBookmark = {
        id: 'new-id',
        ...createDto,
        tabId: null,
        groups: [],
        tabs: [],
      };
      const mockSavedBookmark = { id: 'new-id', ...createDto, tabId: null };

      mockBookmarkRepository.create.mockReturnValue(mockSavedBookmark);
      mockBookmarkRepository.save.mockResolvedValue(mockSavedBookmark);
      mockBookmarkRepository.findOne.mockResolvedValue(mockCreatedBookmark);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedBookmark);
      expect(mockBookmarkRepository.create).toHaveBeenCalledWith({
        id: expect.any(String) as string,
        name: createDto.name,
        url: createDto.url,
        tabId: null,
      });
    });

    it('should create a bookmark with tabIds array (multiple tabs)', async () => {
      const createDto: CreateBookmarkDto = {
        name: 'New Bookmark',
        url: 'https://example.com',
        tabIds: ['tab-1', 'tab-2'],
      };
      const mockTabs = [
        { id: 'tab-1', name: 'Tab 1', color: '#3b82f6' },
        { id: 'tab-2', name: 'Tab 2', color: '#ef4444' },
      ];
      const mockCreatedBookmark = {
        id: 'new-id',
        name: createDto.name,
        url: createDto.url,
        tabId: 'tab-1', // First tab for backward compatibility
        tabs: mockTabs,
        groups: [],
      };
      const mockSavedBookmark = {
        id: 'new-id',
        name: createDto.name,
        url: createDto.url,
        tabId: 'tab-1',
        tabs: mockTabs,
      };

      mockBookmarkRepository.create.mockReturnValue(mockSavedBookmark);
      mockTabRepository.findBy.mockResolvedValue(mockTabs);
      mockBookmarkRepository.save.mockResolvedValue(mockSavedBookmark);
      mockBookmarkRepository.findOne.mockResolvedValue(mockCreatedBookmark);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedBookmark);
      expect(mockTabRepository.findBy).toHaveBeenCalledWith({
        id: In(['tab-1', 'tab-2']),
      });
      expect(mockBookmarkRepository.create).toHaveBeenCalledWith({
        id: expect.any(String) as string,
        name: createDto.name,
        url: createDto.url,
        tabId: null,
      });
    });

    it('should create a bookmark with tabId (backward compatibility)', async () => {
      const createDto: CreateBookmarkDto = {
        name: 'New Bookmark',
        url: 'https://example.com',
        tabId: 'tab-1',
      };
      const mockTab = { id: 'tab-1', name: 'Tab 1', color: '#3b82f6' };
      const mockCreatedBookmark = {
        id: 'new-id',
        name: createDto.name,
        url: createDto.url,
        tabId: 'tab-1',
        tabs: [mockTab],
        groups: [],
      };
      const mockSavedBookmark = {
        id: 'new-id',
        name: createDto.name,
        url: createDto.url,
        tabId: 'tab-1',
        tabs: [mockTab],
      };

      mockBookmarkRepository.create.mockReturnValue(mockSavedBookmark);
      mockTabRepository.findOne.mockResolvedValue(mockTab);
      mockBookmarkRepository.save.mockResolvedValue(mockSavedBookmark);
      mockBookmarkRepository.findOne.mockResolvedValue(mockCreatedBookmark);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedBookmark);
      expect(mockTabRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'tab-1' },
      });
    });
  });

  describe('update', () => {
    it('should update bookmark name', async () => {
      const existingBookmark = {
        id: '1',
        name: 'Old Name',
        url: 'https://example.com',
        tabId: 'tab-1',
        groups: [],
      };
      const updateDto: UpdateBookmarkDto = { name: 'New Name' };
      const updatedBookmark = { ...existingBookmark, name: 'New Name' };

      mockBookmarkRepository.findOne
        .mockResolvedValueOnce(existingBookmark)
        .mockResolvedValueOnce(updatedBookmark);
      mockBookmarkRepository.save.mockResolvedValue(updatedBookmark);

      const result = await service.update('1', updateDto);

      expect(result.name).toBe('New Name');
      expect(mockBookmarkRepository.save).toHaveBeenCalled();
    });

    it('should update bookmark url', async () => {
      const existingBookmark = {
        id: '1',
        name: 'Bookmark',
        url: 'https://old.com',
        tabId: 'tab-1',
        groups: [],
      };
      const updateDto: UpdateBookmarkDto = { url: 'https://new.com' };
      const updatedBookmark = { ...existingBookmark, url: 'https://new.com' };

      mockBookmarkRepository.findOne
        .mockResolvedValueOnce(existingBookmark)
        .mockResolvedValueOnce(updatedBookmark);
      mockBookmarkRepository.save.mockResolvedValue(updatedBookmark);

      const result = await service.update('1', updateDto);

      expect(result.url).toBe('https://new.com');
    });

    it('should update bookmark groups', async () => {
      const existingBookmark = {
        id: '1',
        name: 'Bookmark',
        url: 'https://example.com',
        tabId: 'tab-1',
        groups: [],
      };
      const updateDto: UpdateBookmarkDto = { groupIds: ['group-1'] };
      const mockGroups = [{ id: 'group-1', name: 'Group 1' }];
      const updatedBookmark = { ...existingBookmark, groups: mockGroups };

      mockBookmarkRepository.findOne
        .mockResolvedValueOnce(existingBookmark)
        .mockResolvedValueOnce(updatedBookmark);
      mockGroupRepository.findBy.mockResolvedValue(mockGroups);
      mockBookmarkRepository.save.mockResolvedValue(updatedBookmark);

      const result = await service.update('1', updateDto);

      expect(result.groups).toEqual(mockGroups);
    });

    it('should clear groups when empty array is provided', async () => {
      const existingBookmark = {
        id: '1',
        name: 'Bookmark',
        url: 'https://example.com',
        tabId: 'tab-1',
        groups: [{ id: 'group-1' }],
      };
      const updateDto: UpdateBookmarkDto = { groupIds: [] };
      const updatedBookmark = { ...existingBookmark, groups: [] };

      mockBookmarkRepository.findOne
        .mockResolvedValueOnce(existingBookmark)
        .mockResolvedValueOnce(updatedBookmark);
      mockBookmarkRepository.save.mockResolvedValue(updatedBookmark);

      const result = await service.update('1', updateDto);

      expect(result.groups).toEqual([]);
    });

    it('should throw NotFoundException when bookmark not found', async () => {
      mockBookmarkRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update bookmark with tabIds array (multiple tabs)', async () => {
      const existingBookmark = {
        id: '1',
        name: 'Bookmark',
        url: 'https://example.com',
        tabId: 'tab-1',
        groups: [],
        tabs: [{ id: 'tab-1', name: 'Tab 1' }],
      };
      const updateDto: UpdateBookmarkDto = { tabIds: ['tab-1', 'tab-2'] };
      const mockTabs = [
        { id: 'tab-1', name: 'Tab 1', color: '#3b82f6' },
        { id: 'tab-2', name: 'Tab 2', color: '#ef4444' },
      ];
      const updatedBookmark = {
        ...existingBookmark,
        tabs: mockTabs,
        tabId: 'tab-1', // Original tabId preserved
      };

      mockBookmarkRepository.findOne
        .mockResolvedValueOnce(existingBookmark)
        .mockResolvedValueOnce(updatedBookmark);
      mockTabRepository.findBy.mockResolvedValue(mockTabs);
      mockBookmarkRepository.save.mockResolvedValue(updatedBookmark);

      const result = await service.update('1', updateDto);

      expect(result.tabs).toEqual(mockTabs);
      expect(result.tabId).toBe('tab-1'); // Original tabId preserved
      expect(mockTabRepository.findBy).toHaveBeenCalledWith({
        id: In(['tab-1', 'tab-2']),
      });
    });

    it('should update bookmark with tabIds array when original tabId not in new tabs', async () => {
      const existingBookmark = {
        id: '1',
        name: 'Bookmark',
        url: 'https://example.com',
        tabId: 'tab-1',
        groups: [],
        tabs: [{ id: 'tab-1', name: 'Tab 1' }],
      };
      const updateDto: UpdateBookmarkDto = { tabIds: ['tab-2', 'tab-3'] };
      const mockTabs = [
        { id: 'tab-2', name: 'Tab 2', color: '#ef4444' },
        { id: 'tab-3', name: 'Tab 3', color: '#10b981' },
      ];
      const updatedBookmark = {
        ...existingBookmark,
        tabs: mockTabs,
        tabId: 'tab-2', // First tab from new array
      };

      mockBookmarkRepository.findOne
        .mockResolvedValueOnce(existingBookmark)
        .mockResolvedValueOnce(updatedBookmark);
      mockTabRepository.findBy.mockResolvedValue(mockTabs);
      mockBookmarkRepository.save.mockResolvedValue(updatedBookmark);

      const result = await service.update('1', updateDto);

      expect(result.tabs).toEqual(mockTabs);
      expect(result.tabId).toBe('tab-2'); // First tab from new array
    });

    it('should clear tabs when empty tabIds array is provided', async () => {
      const existingBookmark = {
        id: '1',
        name: 'Bookmark',
        url: 'https://example.com',
        tabId: 'tab-1',
        groups: [],
        tabs: [{ id: 'tab-1', name: 'Tab 1' }],
      };
      const updateDto: UpdateBookmarkDto = { tabIds: [] };
      const updatedBookmark = {
        ...existingBookmark,
        tabs: [],
        tabId: null,
      };

      mockBookmarkRepository.findOne
        .mockResolvedValueOnce(existingBookmark)
        .mockResolvedValueOnce(updatedBookmark);
      mockBookmarkRepository.save.mockResolvedValue(updatedBookmark);

      const result = await service.update('1', updateDto);

      expect(result.tabs).toEqual([]);
      expect(result.tabId).toBeNull();
    });

    it('should update bookmark with tabId (backward compatibility)', async () => {
      const existingBookmark = {
        id: '1',
        name: 'Bookmark',
        url: 'https://example.com',
        tabId: 'tab-1',
        groups: [],
        tabs: [],
      };
      const updateDto: UpdateBookmarkDto = { tabId: 'tab-2' };
      const mockTab = { id: 'tab-2', name: 'Tab 2', color: '#ef4444' };
      const updatedBookmark = {
        ...existingBookmark,
        tabId: 'tab-2',
        tabs: [mockTab],
      };

      mockBookmarkRepository.findOne
        .mockResolvedValueOnce(existingBookmark)
        .mockResolvedValueOnce(updatedBookmark);
      mockTabRepository.findOne.mockResolvedValue(mockTab);
      mockBookmarkRepository.save.mockResolvedValue(updatedBookmark);

      const result = await service.update('1', updateDto);

      expect(result.tabId).toBe('tab-2');
      expect(result.tabs).toEqual([mockTab]);
      expect(mockTabRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'tab-2' },
      });
    });
  });

  describe('remove', () => {
    it('should remove a bookmark', async () => {
      const mockBookmark = {
        id: '1',
        name: 'Bookmark',
        url: 'https://example.com',
        tabId: 'tab-1',
        groups: [],
      };
      mockBookmarkRepository.findOne.mockResolvedValue(mockBookmark);
      mockBookmarkRepository.remove.mockResolvedValue(mockBookmark);

      await service.remove('1');

      expect(mockBookmarkRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['groups', 'tabs'],
      });
      expect(mockBookmarkRepository.remove).toHaveBeenCalledWith(mockBookmark);
    });

    it('should throw NotFoundException when bookmark not found', async () => {
      mockBookmarkRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeAll', () => {
    it('should remove all bookmarks', async () => {
      mockBookmarkRepository.clear.mockResolvedValue(undefined);

      await service.removeAll();

      expect(mockBookmarkRepository.clear).toHaveBeenCalled();
    });
  });
});
