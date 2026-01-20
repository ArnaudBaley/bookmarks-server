import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
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
    clear: jest.fn(),
  };

  const mockGroupRepository = {
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
  };

  const mockBookmarkRepository = {
    find: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
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

    it('should create a default tab when no tabs exist', async () => {
      const defaultTab = {
        id: 'default-id',
        name: 'Default',
        color: '#3b82f6',
        createdAt: new Date(),
      };

      mockTabRepository.find.mockResolvedValue([]);
      mockTabRepository.create.mockReturnValue(defaultTab);
      mockTabRepository.save.mockResolvedValue(defaultTab);

      const result = await service.findAll();

      expect(result).toEqual([defaultTab]);
      expect(mockTabRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'ASC' },
      });
      expect(mockTabRepository.create).toHaveBeenCalledWith({
        id: expect.any(String) as string,
        name: 'Default',
        color: '#3b82f6',
      });
      expect(mockTabRepository.save).toHaveBeenCalledWith(defaultTab);
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

  describe('findByName', () => {
    it('should return a tab when found by name', async () => {
      const mockTab = {
        id: '1',
        name: 'Tab 1',
        color: '#3b82f6',
      };
      mockTabRepository.findOne.mockResolvedValue(mockTab);

      const result = await service.findByName('Tab 1');

      expect(result).toEqual(mockTab);
      expect(mockTabRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Tab 1' },
      });
    });

    it('should return null when tab not found by name', async () => {
      mockTabRepository.findOne.mockResolvedValue(null);

      const result = await service.findByName('Non-existent');

      expect(result).toBeNull();
      expect(mockTabRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Non-existent' },
      });
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

      mockTabRepository.findOne.mockResolvedValue(null); // findByName returns null
      mockTabRepository.create.mockReturnValue(mockCreatedTab);
      mockTabRepository.save.mockResolvedValue(mockCreatedTab);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedTab);
      expect(mockTabRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'New Tab' },
      });
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

      mockTabRepository.findOne.mockResolvedValue(null); // findByName returns null
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

    it('should throw ConflictException when tab with same name exists', async () => {
      const createDto: CreateTabDto = {
        name: 'Existing Tab',
        color: '#3b82f6',
      };
      const existingTab = {
        id: 'existing-id',
        name: 'Existing Tab',
        color: '#3b82f6',
      };

      mockTabRepository.findOne.mockResolvedValue(existingTab);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Tab with name "Existing Tab" already exists',
      );
      expect(mockTabRepository.create).not.toHaveBeenCalled();
      expect(mockTabRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when database constraint violation occurs', async () => {
      const createDto: CreateTabDto = {
        name: 'New Tab',
        color: '#3b82f6',
      };
      const mockCreatedTab = {
        id: 'new-id',
        name: createDto.name,
        color: createDto.color,
      };
      const dbError = { code: 'SQLITE_CONSTRAINT_UNIQUE' };

      mockTabRepository.findOne.mockResolvedValue(null); // findByName returns null
      mockTabRepository.create.mockReturnValue(mockCreatedTab);
      mockTabRepository.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Tab with name "New Tab" already exists',
      );
    });

    it('should throw ConflictException when PostgreSQL constraint violation occurs', async () => {
      const createDto: CreateTabDto = {
        name: 'New Tab',
        color: '#3b82f6',
      };
      const mockCreatedTab = {
        id: 'new-id',
        name: createDto.name,
        color: createDto.color,
      };
      const dbError = { code: '23505' };

      mockTabRepository.findOne.mockResolvedValue(null); // findByName returns null
      mockTabRepository.create.mockReturnValue(mockCreatedTab);
      mockTabRepository.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Tab with name "New Tab" already exists',
      );
    });

    it('should rethrow non-constraint errors', async () => {
      const createDto: CreateTabDto = {
        name: 'New Tab',
        color: '#3b82f6',
      };
      const mockCreatedTab = {
        id: 'new-id',
        name: createDto.name,
        color: createDto.color,
      };
      const dbError = new Error('Database connection failed');

      mockTabRepository.findOne.mockResolvedValue(null);
      mockTabRepository.create.mockReturnValue(mockCreatedTab);
      mockTabRepository.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        'Database connection failed',
      );
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

      // First call: findOne to get existing tab
      // Second call: findByName to check for duplicates (returns null)
      // Third call: findOne after save to return updated tab
      mockTabRepository.findOne
        .mockResolvedValueOnce(existingTab) // findOne for existing tab
        .mockResolvedValueOnce(null) // findByName returns null (no conflict)
        .mockResolvedValueOnce(updatedTab); // findOne after save
      mockTabRepository.save.mockResolvedValue(updatedTab);

      const result = await service.update('1', updateDto);

      expect(result.name).toBe('New Name');
      expect(mockTabRepository.save).toHaveBeenCalled();
      expect(mockTabRepository.findOne).toHaveBeenCalledTimes(3);
      expect(mockTabRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { id: '1' },
      });
      expect(mockTabRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { name: 'New Name' },
      });
      expect(mockTabRepository.findOne).toHaveBeenNthCalledWith(3, {
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

    it('should throw ConflictException when updating to duplicate name', async () => {
      const existingTab = {
        id: '1',
        name: 'Tab 1',
        color: '#3b82f6',
      };
      const updateDto: UpdateTabDto = { name: 'Tab 2' };
      const conflictingTab = {
        id: '2',
        name: 'Tab 2',
        color: '#ef4444',
      };

      // First call: findOne to get existing tab (by id)
      // Second call: findByName to check for duplicates (finds conflicting tab)
      mockTabRepository.findOne.mockImplementation((options) => {
        if (options.where.id === '1') {
          return Promise.resolve(existingTab);
        }
        if (options.where.name === 'Tab 2') {
          return Promise.resolve(conflictingTab);
        }
        return Promise.resolve(null);
      });

      await expect(service.update('1', updateDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('1', updateDto)).rejects.toThrow(
        'Tab with name "Tab 2" already exists',
      );
      expect(mockTabRepository.save).not.toHaveBeenCalled();
    });

    it('should allow updating to same name (no conflict)', async () => {
      const existingTab = {
        id: '1',
        name: 'Tab 1',
        color: '#3b82f6',
      };
      const updateDto: UpdateTabDto = { name: 'Tab 1' };
      const updatedTab = { ...existingTab };

      mockTabRepository.findOne
        .mockResolvedValueOnce(existingTab) // findOne for existing tab
        .mockResolvedValueOnce(existingTab) // findByName returns same tab
        .mockResolvedValueOnce(updatedTab); // findOne after save
      mockTabRepository.save.mockResolvedValue(updatedTab);

      const result = await service.update('1', updateDto);

      expect(result.name).toBe('Tab 1');
      expect(mockTabRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when database constraint violation occurs on update', async () => {
      const existingTab = {
        id: '1',
        name: 'Tab 1',
        color: '#3b82f6',
      };
      const updateDto: UpdateTabDto = { name: 'Tab 2' };
      const dbError = { code: 'SQLITE_CONSTRAINT_UNIQUE' };

      // First call: findOne to get existing tab (by id)
      // Second call: findByName returns null (race condition - no conflict found initially)
      mockTabRepository.findOne.mockImplementation((options) => {
        if (options.where.id === '1') {
          return Promise.resolve(existingTab);
        }
        if (options.where.name === 'Tab 2') {
          return Promise.resolve(null); // Race condition - no conflict found initially
        }
        return Promise.resolve(null);
      });
      mockTabRepository.save.mockRejectedValue(dbError);

      await expect(service.update('1', updateDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('1', updateDto)).rejects.toThrow(
        'Tab with name "Tab 2" already exists',
      );
    });

    it('should rethrow non-constraint errors on update', async () => {
      const existingTab = {
        id: '1',
        name: 'Tab 1',
        color: '#3b82f6',
      };
      const updateDto: UpdateTabDto = { name: 'Tab 2' };
      const dbError = new Error('Database connection failed');

      mockTabRepository.findOne
        .mockResolvedValueOnce(existingTab)
        .mockResolvedValueOnce(null);
      mockTabRepository.save.mockRejectedValue(dbError);

      await expect(service.update('1', updateDto)).rejects.toThrow(
        'Database connection failed',
      );
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

  describe('removeAll', () => {
    it('should remove all tabs and clean up relationships', async () => {
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
          groups: [],
        },
      ];

      mockGroupRepository.find.mockResolvedValue(mockGroups);
      mockBookmarkRepository.find.mockResolvedValue(mockBookmarks);
      mockGroupRepository.save.mockResolvedValue({});
      mockGroupRepository.clear.mockResolvedValue(undefined);
      mockBookmarkRepository.clear.mockResolvedValue(undefined);
      mockTabRepository.clear.mockResolvedValue(undefined);

      await service.removeAll();

      expect(mockGroupRepository.find).toHaveBeenCalledWith({
        relations: ['bookmarks'],
      });
      expect(mockBookmarkRepository.find).toHaveBeenCalledWith({
        relations: ['groups'],
      });
      expect(mockGroupRepository.save).toHaveBeenCalled();
      expect(mockGroupRepository.clear).toHaveBeenCalled();
      expect(mockBookmarkRepository.clear).toHaveBeenCalled();
      expect(mockTabRepository.clear).toHaveBeenCalled();
    });

    it('should remove all tabs when no groups or bookmarks exist', async () => {
      mockGroupRepository.find.mockResolvedValue([]);
      mockBookmarkRepository.find.mockResolvedValue([]);
      mockTabRepository.clear.mockResolvedValue(undefined);

      await service.removeAll();

      expect(mockGroupRepository.save).not.toHaveBeenCalled();
      // clear() is only called when arrays have length > 0
      expect(mockGroupRepository.clear).not.toHaveBeenCalled();
      expect(mockBookmarkRepository.clear).not.toHaveBeenCalled();
      // tabs.clear() is always called
      expect(mockTabRepository.clear).toHaveBeenCalled();
    });
  });
});
