import { Test, TestingModule } from '@nestjs/testing';
import { TabsController } from './tabs.controller';
import { TabsService } from './tabs.service';
import { CreateTabDto } from './dto/create-tab.dto';
import { UpdateTabDto } from './dto/update-tab.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('TabsController', () => {
  let controller: TabsController;
  let service: TabsService;

  const mockTabsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    removeAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TabsController],
      providers: [
        {
          provide: TabsService,
          useValue: mockTabsService,
        },
      ],
    }).compile();

    controller = module.get<TabsController>(TabsController);
    service = module.get<TabsService>(TabsService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all tabs', async () => {
      const mockTabs = [
        {
          id: '1',
          name: 'Tab 1',
          color: '#3b82f6',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          name: 'Tab 2',
          color: '#ef4444',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];
      mockTabsService.findAll.mockResolvedValue(mockTabs);

      const result = await controller.findAll();

      expect(result).toEqual([
        {
          id: '1',
          name: 'Tab 1',
          color: '#3b82f6',
          createdAt: mockTabs[0].createdAt.toISOString(),
          updatedAt: mockTabs[0].updatedAt.toISOString(),
        },
        {
          id: '2',
          name: 'Tab 2',
          color: '#ef4444',
          createdAt: mockTabs[1].createdAt.toISOString(),
          updatedAt: mockTabs[1].updatedAt.toISOString(),
        },
      ]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a tab', async () => {
      const mockTab = {
        id: '1',
        name: 'Tab 1',
        color: '#3b82f6',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };
      mockTabsService.findOne.mockResolvedValue(mockTab);

      const result = await controller.findOne('1');

      expect(result).toEqual({
        id: '1',
        name: 'Tab 1',
        color: '#3b82f6',
        createdAt: mockTab.createdAt.toISOString(),
        updatedAt: mockTab.updatedAt.toISOString(),
      });
      expect(service.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when tab not found', async () => {
      mockTabsService.findOne.mockRejectedValue(
        new NotFoundException('Tab with ID 1 not found'),
      );

      await expect(controller.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a tab', async () => {
      const createDto: CreateTabDto = {
        name: 'New Tab',
        color: '#3b82f6',
      };
      const mockTab = {
        id: 'new-id',
        ...createDto,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };
      mockTabsService.create.mockResolvedValue(mockTab);

      const result = await controller.create(createDto);

      expect(result).toEqual({
        id: 'new-id',
        name: 'New Tab',
        color: '#3b82f6',
        createdAt: mockTab.createdAt.toISOString(),
        updatedAt: mockTab.updatedAt.toISOString(),
      });
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when tab with same name exists', async () => {
      const createDto: CreateTabDto = {
        name: 'Existing Tab',
        color: '#3b82f6',
      };
      mockTabsService.create.mockRejectedValue(
        new ConflictException('Tab with name "Existing Tab" already exists'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a tab', async () => {
      const updateDto: UpdateTabDto = {
        name: 'Updated Tab',
      };
      const mockTab = {
        id: '1',
        name: 'Updated Tab',
        color: '#3b82f6',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      mockTabsService.update.mockResolvedValue(mockTab);

      const result = await controller.update('1', updateDto);

      expect(result).toEqual({
        id: '1',
        name: 'Updated Tab',
        color: '#3b82f6',
        createdAt: mockTab.createdAt.toISOString(),
        updatedAt: mockTab.updatedAt.toISOString(),
      });
      expect(service.update).toHaveBeenCalledWith('1', updateDto);
    });

    it('should throw NotFoundException when tab not found', async () => {
      const updateDto: UpdateTabDto = {
        name: 'Updated Tab',
      };
      mockTabsService.update.mockRejectedValue(
        new NotFoundException('Tab with ID 1 not found'),
      );

      await expect(controller.update('1', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when updating to duplicate name', async () => {
      const updateDto: UpdateTabDto = {
        name: 'Existing Tab',
      };
      mockTabsService.update.mockRejectedValue(
        new ConflictException('Tab with name "Existing Tab" already exists'),
      );

      await expect(controller.update('1', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a tab', async () => {
      mockTabsService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when tab not found', async () => {
      mockTabsService.remove.mockRejectedValue(
        new NotFoundException('Tab with ID 1 not found'),
      );

      await expect(controller.remove('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeAll', () => {
    it('should remove all tabs', async () => {
      mockTabsService.removeAll.mockResolvedValue(undefined);

      await controller.removeAll();

      expect(service.removeAll).toHaveBeenCalled();
    });
  });
});
