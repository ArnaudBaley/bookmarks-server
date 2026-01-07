import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { Group } from '../entities/group.entity';
import { Bookmark } from '../entities/bookmark.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

describe('GroupsService', () => {
  let service: GroupsService;
  let groupRepository: Repository<Group>;
  let bookmarkRepository: Repository<Bookmark>;

  const mockGroupRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockBookmarkRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
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

    service = module.get<GroupsService>(GroupsService);
    groupRepository = module.get<Repository<Group>>(getRepositoryToken(Group));
    bookmarkRepository = module.get<Repository<Bookmark>>(
      getRepositoryToken(Bookmark),
    );

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all groups when no tabId is provided', async () => {
      const mockGroups = [
        {
          id: '1',
          name: 'Group 1',
          color: '#3b82f6',
          tabId: 'tab-1',
          bookmarks: [],
        },
        {
          id: '2',
          name: 'Group 2',
          color: '#ef4444',
          tabId: 'tab-2',
          bookmarks: [],
        },
      ];
      mockGroupRepository.find.mockResolvedValue(mockGroups);

      const result = await service.findAll();

      expect(result).toEqual(mockGroups);
      expect(mockGroupRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: ['bookmarks'],
      });
    });

    it('should return groups filtered by tabId', async () => {
      const mockGroups = [
        {
          id: '1',
          name: 'Group 1',
          color: '#3b82f6',
          tabId: 'tab-1',
          bookmarks: [],
        },
      ];
      mockGroupRepository.find.mockResolvedValue(mockGroups);

      const result = await service.findAll('tab-1');

      expect(result).toEqual(mockGroups);
      expect(mockGroupRepository.find).toHaveBeenCalledWith({
        where: { tabId: 'tab-1' },
        relations: ['bookmarks'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a group when found', async () => {
      const mockGroup = {
        id: '1',
        name: 'Group 1',
        color: '#3b82f6',
        tabId: 'tab-1',
        bookmarks: [],
      };
      mockGroupRepository.findOne.mockResolvedValue(mockGroup);

      const result = await service.findOne('1');

      expect(result).toEqual(mockGroup);
      expect(mockGroupRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['bookmarks'],
      });
    });

    it('should throw NotFoundException when group not found', async () => {
      mockGroupRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Group with ID non-existent not found',
      );
    });
  });

  describe('create', () => {
    it('should create a group', async () => {
      const createDto: CreateGroupDto = {
        name: 'New Group',
        color: '#3b82f6',
        tabId: 'tab-1',
      };
      const mockCreatedGroup = {
        id: 'new-id',
        ...createDto,
      };

      mockGroupRepository.create.mockReturnValue(mockCreatedGroup);
      mockGroupRepository.save.mockResolvedValue(mockCreatedGroup);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedGroup);
      expect(mockGroupRepository.create).toHaveBeenCalledWith({
        id: expect.any(String),
        name: createDto.name,
        color: createDto.color,
        tabId: createDto.tabId,
      });
      expect(mockGroupRepository.save).toHaveBeenCalled();
    });

    it('should handle null tabId', async () => {
      const createDto: CreateGroupDto = {
        name: 'New Group',
        color: '#3b82f6',
      };
      const mockCreatedGroup = {
        id: 'new-id',
        name: createDto.name,
        color: createDto.color,
        tabId: null,
      };

      mockGroupRepository.create.mockReturnValue(mockCreatedGroup);
      mockGroupRepository.save.mockResolvedValue(mockCreatedGroup);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedGroup);
      expect(mockGroupRepository.create).toHaveBeenCalledWith({
        id: expect.any(String),
        name: createDto.name,
        color: createDto.color,
        tabId: null,
      });
    });
  });

  describe('update', () => {
    it('should update group name', async () => {
      const existingGroup = {
        id: '1',
        name: 'Old Name',
        color: '#3b82f6',
        tabId: 'tab-1',
        bookmarks: [],
      };
      const updateDto: UpdateGroupDto = { name: 'New Name' };
      const updatedGroup = { ...existingGroup, name: 'New Name' };

      mockGroupRepository.findOne
        .mockResolvedValueOnce(existingGroup)
        .mockResolvedValueOnce(updatedGroup);
      mockGroupRepository.save.mockResolvedValue(updatedGroup);

      const result = await service.update('1', updateDto);

      expect(result.name).toBe('New Name');
      expect(mockGroupRepository.save).toHaveBeenCalled();
    });

    it('should update group color', async () => {
      const existingGroup = {
        id: '1',
        name: 'Group',
        color: '#3b82f6',
        tabId: 'tab-1',
        bookmarks: [],
      };
      const updateDto: UpdateGroupDto = { color: '#ef4444' };
      const updatedGroup = { ...existingGroup, color: '#ef4444' };

      mockGroupRepository.findOne
        .mockResolvedValueOnce(existingGroup)
        .mockResolvedValueOnce(updatedGroup);
      mockGroupRepository.save.mockResolvedValue(updatedGroup);

      const result = await service.update('1', updateDto);

      expect(result.color).toBe('#ef4444');
    });

    it('should throw NotFoundException when group not found', async () => {
      mockGroupRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a group', async () => {
      const mockGroup = {
        id: '1',
        name: 'Group',
        color: '#3b82f6',
        tabId: 'tab-1',
        bookmarks: [],
      };
      mockGroupRepository.findOne.mockResolvedValue(mockGroup);
      mockGroupRepository.remove.mockResolvedValue(mockGroup);

      await service.remove('1');

      expect(mockGroupRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['bookmarks'],
      });
      expect(mockGroupRepository.remove).toHaveBeenCalledWith(mockGroup);
    });

    it('should throw NotFoundException when group not found', async () => {
      mockGroupRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addBookmarkToGroup', () => {
    it('should add bookmark to group', async () => {
      const mockGroup = {
        id: 'group-1',
        name: 'Group',
        color: '#3b82f6',
        tabId: 'tab-1',
        bookmarks: [],
      };
      const mockBookmark = {
        id: 'bookmark-1',
        name: 'Bookmark',
        url: 'https://example.com',
        groups: [],
      };

      mockGroupRepository.findOne.mockResolvedValue(mockGroup);
      mockBookmarkRepository.findOne.mockResolvedValue(mockBookmark);
      mockGroupRepository.save.mockResolvedValue({
        ...mockGroup,
        bookmarks: [mockBookmark],
      });

      await service.addBookmarkToGroup('group-1', 'bookmark-1');

      expect(mockGroupRepository.save).toHaveBeenCalled();
    });

    it('should not add duplicate bookmark', async () => {
      const mockBookmark = {
        id: 'bookmark-1',
        name: 'Bookmark',
        url: 'https://example.com',
      };
      const mockGroup = {
        id: 'group-1',
        name: 'Group',
        color: '#3b82f6',
        tabId: 'tab-1',
        bookmarks: [mockBookmark],
      };

      mockGroupRepository.findOne.mockResolvedValue(mockGroup);
      mockBookmarkRepository.findOne.mockResolvedValue(mockBookmark);

      await service.addBookmarkToGroup('group-1', 'bookmark-1');

      expect(mockGroupRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when group not found', async () => {
      mockGroupRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addBookmarkToGroup('non-existent', 'bookmark-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when bookmark not found', async () => {
      const mockGroup = {
        id: 'group-1',
        name: 'Group',
        color: '#3b82f6',
        tabId: 'tab-1',
        bookmarks: [],
      };
      mockGroupRepository.findOne.mockResolvedValue(mockGroup);
      mockBookmarkRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addBookmarkToGroup('group-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeBookmarkFromGroup', () => {
    it('should remove bookmark from group', async () => {
      const mockBookmark = {
        id: 'bookmark-1',
        name: 'Bookmark',
        url: 'https://example.com',
      };
      const mockGroup = {
        id: 'group-1',
        name: 'Group',
        color: '#3b82f6',
        tabId: 'tab-1',
        bookmarks: [mockBookmark],
      };

      mockGroupRepository.findOne.mockResolvedValue(mockGroup);
      mockBookmarkRepository.findOne.mockResolvedValue(mockBookmark);
      mockGroupRepository.save.mockResolvedValue({
        ...mockGroup,
        bookmarks: [],
      });

      await service.removeBookmarkFromGroup('group-1', 'bookmark-1');

      expect(mockGroupRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when group not found', async () => {
      mockGroupRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeBookmarkFromGroup('non-existent', 'bookmark-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when bookmark not found', async () => {
      const mockGroup = {
        id: 'group-1',
        name: 'Group',
        color: '#3b82f6',
        tabId: 'tab-1',
        bookmarks: [],
      };
      mockGroupRepository.findOne.mockResolvedValue(mockGroup);
      mockBookmarkRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeBookmarkFromGroup('group-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

