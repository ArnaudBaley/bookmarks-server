import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { Bookmark } from '../entities/bookmark.entity';
import { Group } from '../entities/group.entity';
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
  };

  const mockGroupRepository = {
    findBy: jest.fn(),
  };

  beforeEach(async () => {
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
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);
    bookmarkRepository = module.get<Repository<Bookmark>>(
      getRepositoryToken(Bookmark),
    );
    groupRepository = module.get<Repository<Group>>(getRepositoryToken(Group));

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
        },
        {
          id: '2',
          name: 'Bookmark 2',
          url: 'https://example2.com',
          tabId: 'tab-2',
          groups: [],
        },
      ];
      mockBookmarkRepository.find.mockResolvedValue(mockBookmarks);

      const result = await service.findAll();

      expect(result).toEqual(mockBookmarks);
      expect(mockBookmarkRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: ['groups'],
      });
    });

    it('should return bookmarks filtered by tabId', async () => {
      const mockBookmarks = [
        {
          id: '1',
          name: 'Bookmark 1',
          url: 'https://example.com',
          tabId: 'tab-1',
          groups: [],
        },
      ];
      mockBookmarkRepository.find.mockResolvedValue(mockBookmarks);

      const result = await service.findAll('tab-1');

      expect(result).toEqual(mockBookmarks);
      expect(mockBookmarkRepository.find).toHaveBeenCalledWith({
        where: { tabId: 'tab-1' },
        relations: ['groups'],
      });
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
        relations: ['groups'],
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
        relations: ['groups'],
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
});
