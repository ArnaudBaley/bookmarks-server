import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { NotFoundException } from '@nestjs/common';

describe('GroupsController', () => {
  let controller: GroupsController;
  let service: GroupsService;

  const mockGroupsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    removeAll: jest.fn(),
    addBookmarkToGroup: jest.fn(),
    removeBookmarkFromGroup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: GroupsService,
          useValue: mockGroupsService,
        },
      ],
    }).compile();

    controller = module.get<GroupsController>(GroupsController);
    service = module.get<GroupsService>(GroupsService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all groups', async () => {
      const mockGroups = [
        {
          id: '1',
          name: 'Group 1',
          color: '#3b82f6',
          tabId: 'tab-1',
          bookmarks: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          name: 'Group 2',
          color: '#ef4444',
          tabId: 'tab-2',
          bookmarks: [],
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];
      mockGroupsService.findAll.mockResolvedValue(mockGroups);

      const result = await controller.findAll();

      expect(result).toEqual([
        {
          id: '1',
          name: 'Group 1',
          color: '#3b82f6',
          tabId: 'tab-1',
          createdAt: mockGroups[0].createdAt.toISOString(),
          updatedAt: mockGroups[0].updatedAt.toISOString(),
        },
        {
          id: '2',
          name: 'Group 2',
          color: '#ef4444',
          tabId: 'tab-2',
          createdAt: mockGroups[1].createdAt.toISOString(),
          updatedAt: mockGroups[1].updatedAt.toISOString(),
        },
      ]);
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return groups filtered by tabId', async () => {
      const mockGroups = [
        {
          id: '1',
          name: 'Group 1',
          color: '#3b82f6',
          tabId: 'tab-1',
          bookmarks: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];
      mockGroupsService.findAll.mockResolvedValue(mockGroups);

      const result = await controller.findAll('tab-1');

      expect(result).toEqual([
        {
          id: '1',
          name: 'Group 1',
          color: '#3b82f6',
          tabId: 'tab-1',
          createdAt: mockGroups[0].createdAt.toISOString(),
          updatedAt: mockGroups[0].updatedAt.toISOString(),
        },
      ]);
      expect(service.findAll).toHaveBeenCalledWith('tab-1');
    });
  });

  describe('create', () => {
    it('should create a group', async () => {
      const createDto: CreateGroupDto = {
        name: 'New Group',
        color: '#3b82f6',
        tabId: 'tab-1',
      };
      const mockGroup = {
        id: 'new-id',
        ...createDto,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };
      mockGroupsService.create.mockResolvedValue(mockGroup);

      const result = await controller.create(createDto);

      expect(result).toEqual({
        id: 'new-id',
        name: 'New Group',
        color: '#3b82f6',
        tabId: 'tab-1',
        createdAt: mockGroup.createdAt.toISOString(),
        updatedAt: mockGroup.updatedAt.toISOString(),
      });
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update a group', async () => {
      const updateDto: UpdateGroupDto = {
        name: 'Updated Group',
      };
      const mockGroup = {
        id: '1',
        name: 'Updated Group',
        color: '#3b82f6',
        tabId: 'tab-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      mockGroupsService.update.mockResolvedValue(mockGroup);

      const result = await controller.update('1', updateDto);

      expect(result).toEqual({
        id: '1',
        name: 'Updated Group',
        color: '#3b82f6',
        tabId: 'tab-1',
        createdAt: mockGroup.createdAt.toISOString(),
        updatedAt: mockGroup.updatedAt.toISOString(),
      });
      expect(service.update).toHaveBeenCalledWith('1', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a group', async () => {
      mockGroupsService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when group not found', async () => {
      mockGroupsService.remove.mockRejectedValue(
        new NotFoundException('Group with ID 1 not found'),
      );

      await expect(controller.remove('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeAll', () => {
    it('should remove all groups', async () => {
      mockGroupsService.removeAll.mockResolvedValue(undefined);

      await controller.removeAll();

      expect(service.removeAll).toHaveBeenCalled();
    });
  });

  describe('addBookmarkToGroup', () => {
    it('should add bookmark to group', async () => {
      mockGroupsService.addBookmarkToGroup.mockResolvedValue(undefined);

      await controller.addBookmarkToGroup('group-1', 'bookmark-1');

      expect(service.addBookmarkToGroup).toHaveBeenCalledWith(
        'group-1',
        'bookmark-1',
      );
    });

    it('should throw NotFoundException when group not found', async () => {
      mockGroupsService.addBookmarkToGroup.mockRejectedValue(
        new NotFoundException('Group with ID group-1 not found'),
      );

      await expect(
        controller.addBookmarkToGroup('group-1', 'bookmark-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeBookmarkFromGroup', () => {
    it('should remove bookmark from group', async () => {
      mockGroupsService.removeBookmarkFromGroup.mockResolvedValue(undefined);

      await controller.removeBookmarkFromGroup('group-1', 'bookmark-1');

      expect(service.removeBookmarkFromGroup).toHaveBeenCalledWith(
        'group-1',
        'bookmark-1',
      );
    });

    it('should throw NotFoundException when group not found', async () => {
      mockGroupsService.removeBookmarkFromGroup.mockRejectedValue(
        new NotFoundException('Group with ID group-1 not found'),
      );

      await expect(
        controller.removeBookmarkFromGroup('group-1', 'bookmark-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
