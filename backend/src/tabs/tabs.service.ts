import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Tab } from '../entities/tab.entity';
import { Group } from '../entities/group.entity';
import { Bookmark } from '../entities/bookmark.entity';
import { CreateTabDto } from './dto/create-tab.dto';
import { UpdateTabDto } from './dto/update-tab.dto';

@Injectable()
export class TabsService {
  constructor(
    @InjectRepository(Tab)
    private tabRepository: Repository<Tab>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Bookmark)
    private bookmarkRepository: Repository<Bookmark>,
  ) {}

  async findAll(): Promise<Tab[]> {
    return this.tabRepository.find({
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Tab> {
    const tab = await this.tabRepository.findOne({
      where: { id },
    });
    if (!tab) {
      throw new NotFoundException(`Tab with ID ${id} not found`);
    }
    return tab;
  }

  async create(createTabDto: CreateTabDto): Promise<Tab> {
    const tab = this.tabRepository.create({
      id: uuidv4(),
      name: createTabDto.name,
      color: createTabDto.color || null,
    });
    return this.tabRepository.save(tab);
  }

  async update(id: string, updateTabDto: UpdateTabDto): Promise<Tab> {
    const tab = await this.findOne(id);
    
    if (updateTabDto.name !== undefined) {
      tab.name = updateTabDto.name;
    }
    if (updateTabDto.color !== undefined) {
      tab.color = updateTabDto.color || null;
    }
    
    await this.tabRepository.save(tab);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const tab = await this.findOne(id);
    
    // Check if tab has groups or bookmarks
    const groupsCount = await this.groupRepository.count({
      where: { tabId: id },
    });
    const bookmarksCount = await this.bookmarkRepository.count({
      where: { tabId: id },
    });
    
    if (groupsCount > 0 || bookmarksCount > 0) {
      throw new BadRequestException(
        `Cannot delete tab with ID ${id} because it contains ${groupsCount} groups and ${bookmarksCount} bookmarks`,
      );
    }
    
    await this.tabRepository.remove(tab);
  }
}

