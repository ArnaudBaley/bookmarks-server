import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
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

  async findByName(name: string): Promise<Tab | null> {
    return this.tabRepository.findOne({
      where: { name },
    });
  }

  async create(createTabDto: CreateTabDto): Promise<Tab> {
    // Check if a tab with this name already exists
    const existingTab = await this.findByName(createTabDto.name);
    if (existingTab) {
      throw new ConflictException(
        `Tab with name "${createTabDto.name}" already exists`,
      );
    }

    const tab = this.tabRepository.create({
      id: uuidv4(),
      name: createTabDto.name,
      color: createTabDto.color || null,
    });

    try {
      return await this.tabRepository.save(tab);
    } catch (error: unknown) {
      // Handle database unique constraint violation
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as { code: string };
        if (dbError.code === 'SQLITE_CONSTRAINT_UNIQUE' || dbError.code === '23505') {
          throw new ConflictException(
            `Tab with name "${createTabDto.name}" already exists`,
          );
        }
      }
      throw error;
    }
  }

  async update(id: string, updateTabDto: UpdateTabDto): Promise<Tab> {
    const tab = await this.findOne(id);

    if (updateTabDto.name !== undefined) {
      // Check if another tab with this name already exists
      const existingTab = await this.findByName(updateTabDto.name);
      if (existingTab && existingTab.id !== id) {
        throw new ConflictException(
          `Tab with name "${updateTabDto.name}" already exists`,
        );
      }
      tab.name = updateTabDto.name;
    }
    if (updateTabDto.color !== undefined) {
      tab.color = updateTabDto.color || null;
    }

    try {
      await this.tabRepository.save(tab);
      return this.findOne(id);
    } catch (error: unknown) {
      // Handle database unique constraint violation
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as { code: string };
        if (dbError.code === 'SQLITE_CONSTRAINT_UNIQUE' || dbError.code === '23505') {
          throw new ConflictException(
            `Tab with name "${updateTabDto.name}" already exists`,
          );
        }
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const tab = await this.findOne(id);

    // Find all groups associated with this tab
    const groups = await this.groupRepository.find({
      where: { tabId: id },
      relations: ['bookmarks'],
    });

    // Find all bookmarks associated with this tab
    const bookmarks = await this.bookmarkRepository.find({
      where: { tabId: id },
      relations: ['groups'],
    });

    // Remove bookmarks from groups (clean up ManyToMany relationships)
    for (const group of groups) {
      if (group.bookmarks && group.bookmarks.length > 0) {
        group.bookmarks = [];
        await this.groupRepository.save(group);
      }
    }

    // Delete all groups associated with this tab
    if (groups.length > 0) {
      await this.groupRepository.remove(groups);
    }

    // Delete all bookmarks associated with this tab
    if (bookmarks.length > 0) {
      await this.bookmarkRepository.remove(bookmarks);
    }

    // Finally, delete the tab itself
    await this.tabRepository.remove(tab);
  }

  async removeAll(): Promise<void> {
    // Find all groups and bookmarks to clean up relationships
    const groups = await this.groupRepository.find({
      relations: ['bookmarks'],
    });
    const bookmarks = await this.bookmarkRepository.find({
      relations: ['groups'],
    });

    // Remove bookmarks from groups (clean up ManyToMany relationships)
    for (const group of groups) {
      if (group.bookmarks && group.bookmarks.length > 0) {
        group.bookmarks = [];
        await this.groupRepository.save(group);
      }
    }

    // Delete all groups
    if (groups.length > 0) {
      await this.groupRepository.clear();
    }

    // Delete all bookmarks
    if (bookmarks.length > 0) {
      await this.bookmarkRepository.clear();
    }

    // Finally, delete all tabs
    await this.tabRepository.clear();
  }
}
