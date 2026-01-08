import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TabsService } from './tabs.service';
import { Tab } from '../entities/tab.entity';
import { Group } from '../entities/group.entity';
import { Bookmark } from '../entities/bookmark.entity';
import { CreateTabDto } from './dto/create-tab.dto';
import { UpdateTabDto } from './dto/update-tab.dto';

describe('TabsService', () => {
  let service: TabsService;

  const mockTabRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockGroupRepository = {
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockBookmarkRepository = {
    find: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TabsService,
        {
          provide: getRepositoryToken(Tab),
          useValue: mockTabRepository,
        },
        {
          provide: getRepositoryToken(Group),
          useValue: mockGroupRepository,
        },
        {
          provide: getRepositoryToken(Bookmark),
          useValue: mockBookmarkRepository,
        },
      ],
    }).compile();

    service = module.get<TabsService>(TabsService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all tabs ordered by createdAt', async () => {
      const mockTabs = [
        {
          id: '1',
          name: 'Tab 1',
          color: '#3b82f6',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          name: 'Tab 2',
          color: '#ef4444',
          createdAt: new Date('2024-01-02'),
        },
      ];
      mockTabRepository.find.mockResolvedValue(mockTabs);

      const result = await service.findAll();

      expect(result).toEqual(mockTabs);
      expect(mockTabRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a tab when found', async () => {
      const mockTab = {
        id: '1',
        name: 'Tab 1',
        color: '#3b82f6',
      };
      mockTabRepository.findOne.mockResolvedValue(mockTab);

      const result = await service.findOne('1');

      expect(result).toEqual(mockTab);
      expect(mockTabRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when tab not found', async () => {
      mockTabRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Tab with ID non-existent not found',
      );
    });
  });

  describe('create', () => {
    it('should create a tab with color', async () => {
      const createDto: CreateTabDto = {
        name: 'New Tab',
        color: '#3b82f6',
      };
      const mockCreatedTab = {
        id: 'new-id',
        ...createDto,
      };

      mockTabRepository.create.mockReturnValue(mockCreatedTab);
      mockTabRepository.save.mockResolvedValue(mockCreatedTab);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedTab);
      expect(mockTabRepository.create).toHaveBeenCalledWith({
        id: expect.any(String) as string,
        name: createDto.name,
        color: createDto.color,
      });
      expect(mockTabRepository.save).toHaveBeenCalled();
    });

    it('should create a tab without color (null)', async () => {
      const createDto: CreateTabDto = {
        name: 'New Tab',
      };
      const mockCreatedTab = {
        id: 'new-id',
        name: createDto.name,
        color: null,
      };

      mockTabRepository.create.mockReturnValue(mockCreatedTab);
      mockTabRepository.save.mockResolvedValue(mockCreatedTab);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedTab);
      expect(mockTabRepository.create).toHaveBeenCalledWith({
        id: expect.any(String) as string,
        name: createDto.name,
        color: null,
      });
    });
  });

  describe('update', () => {
    it('should update tab name', async () => {
      const existingTab = {
        id: '1',
        name: 'Old Name',
        color: '#3b82f6',
      };
      const updateDto: UpdateTabDto = { name: 'New Name' };
      const updatedTab = { ...existingTab, name: 'New Name' };

      // First call: findOne to get existing tab (line 80)
      // Second call: findOne after save to return updated tab (line 98)
      mockTabRepository.findOne
        .mockResolvedValueOnce(existingTab)
        .mockResolvedValueOnce(updatedTab);
      mockTabRepository.save.mockResolvedValue(updatedTab);

      const result = await service.update('1', updateDto);

      expect(result.name).toBe('New Name');
      expect(mockTabRepository.save).toHaveBeenCalled();
      expect(mockTabRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockTabRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { id: '1' },
      });
      expect(mockTabRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { id: '1' },
      });
    });

    it('should update tab color', async () => {
      const existingTab = {
        id: '1',
        name: 'Tab',
        color: '#3b82f6',
      };
      const updateDto: UpdateTabDto = { color: '#ef4444' };
      const updatedTab = { ...existingTab, color: '#ef4444' };

      mockTabRepository.findOne
        .mockResolvedValueOnce(existingTab)
        .mockResolvedValueOnce(updatedTab);
      mockTabRepository.save.mockResolvedValue(updatedTab);

      const result = await service.update('1', updateDto);

      expect(result.color).toBe('#ef4444');
    });

    it('should set color to null when undefined is provided', async () => {
      const existingTab = {
        id: '1',
        name: 'Tab',
        color: '#3b82f6',
      };
      const updateDto: UpdateTabDto = { color: undefined };
      const updatedTab = { ...existingTab, color: null };

      mockTabRepository.findOne
        .mockResolvedValueOnce(existingTab)
        .mockResolvedValueOnce(updatedTab);
      mockTabRepository.save.mockResolvedValue(updatedTab);

      const result = await service.update('1', updateDto);

      expect(result.color).toBeNull();
    });

    it('should throw NotFoundException when tab not found', async () => {
      mockTabRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a tab and cascade delete groups and bookmarks', async () => {
      const mockTab = {
        id: 'tab-1',
        name: 'Tab',
        color: '#3b82f6',
      };
      const mockGroups = [
        {
          id: 'group-1',
          name: 'Group 1',
          tabId: 'tab-1',
          bookmarks: [{ id: 'bookmark-1' }],
        },
      ];
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          name: 'Bookmark',
          url: 'https://example.com',
          tabId: 'tab-1',
        },
      ];

      mockTabRepository.findOne.mockResolvedValue(mockTab);
      mockGroupRepository.find.mockResolvedValue(mockGroups);
      mockBookmarkRepository.find.mockResolvedValue(mockBookmarks);
      mockGroupRepository.save.mockResolvedValue({});
      mockGroupRepository.remove.mockResolvedValue(mockGroups);
      mockBookmarkRepository.remove.mockResolvedValue(mockBookmarks);
      mockTabRepository.remove.mockResolvedValue(mockTab);

      await service.remove('tab-1');

      expect(mockGroupRepository.find).toHaveBeenCalledWith({
        where: { tabId: 'tab-1' },
        relations: ['bookmarks'],
      });
      expect(mockBookmarkRepository.find).toHaveBeenCalledWith({
        where: { tabId: 'tab-1' },
        relations: ['groups'],
      });
      expect(mockGroupRepository.remove).toHaveBeenCalledWith(mockGroups);
      expect(mockBookmarkRepository.remove).toHaveBeenCalledWith(mockBookmarks);
      expect(mockTabRepository.remove).toHaveBeenCalledWith(mockTab);
    });

    it('should remove tab even when no groups or bookmarks exist', async () => {
      const mockTab = {
        id: 'tab-1',
        name: 'Tab',
        color: '#3b82f6',
      };

      mockTabRepository.findOne.mockResolvedValue(mockTab);
      mockGroupRepository.find.mockResolvedValue([]);
      mockBookmarkRepository.find.mockResolvedValue([]);
      mockTabRepository.remove.mockResolvedValue(mockTab);

      await service.remove('tab-1');

      expect(mockTabRepository.remove).toHaveBeenCalledWith(mockTab);
    });

    it('should clean up group-bookmark relationships', async () => {
      const mockTab = {
        id: 'tab-1',
        name: 'Tab',
        color: '#3b82f6',
      };
      const mockGroups = [
        {
          id: 'group-1',
          name: 'Group 1',
          tabId: 'tab-1',
          bookmarks: [{ id: 'bookmark-1' }],
        },
      ];

      mockTabRepository.findOne.mockResolvedValue(mockTab);
      mockGroupRepository.find.mockResolvedValue(mockGroups);
      mockBookmarkRepository.find.mockResolvedValue([]);
      mockGroupRepository.save.mockResolvedValue({});
      mockGroupRepository.remove.mockResolvedValue(mockGroups);
      mockTabRepository.remove.mockResolvedValue(mockTab);

      await service.remove('tab-1');

      expect(mockGroupRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when tab not found', async () => {
      mockTabRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
