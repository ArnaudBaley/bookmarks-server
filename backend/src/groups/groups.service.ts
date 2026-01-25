import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Group } from '../entities/group.entity';
import { Bookmark } from '../entities/bookmark.entity';
import { BookmarkGroup } from '../entities/bookmark-group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Bookmark)
    private bookmarkRepository: Repository<Bookmark>,
    @InjectRepository(BookmarkGroup)
    private bookmarkGroupRepository: Repository<BookmarkGroup>,
  ) {}

  async findAll(tabId?: string): Promise<Group[]> {
    const where = tabId ? { tabId } : {};
    return this.groupRepository.find({
      where,
      relations: ['bookmarkGroups', 'bookmarkGroups.bookmark'],
      order: { orderIndex: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['bookmarkGroups', 'bookmarkGroups.bookmark'],
    });
    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }
    return group;
  }

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    // Calculate the next orderIndex for the tab
    const tabId = createGroupDto.tabId || null;
    const maxOrderResult = await this.groupRepository
      .createQueryBuilder('group')
      .where('group.tabId = :tabId', { tabId })
      .select('MAX(group.orderIndex)', 'max')
      .getRawOne();
    const orderIndex = (maxOrderResult?.max ?? -1) + 1;

    const group = this.groupRepository.create({
      id: uuidv4(),
      name: createGroupDto.name,
      color: createGroupDto.color,
      tabId,
      orderIndex,
    });
    return this.groupRepository.save(group);
  }

  async update(id: string, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id);
    if (updateGroupDto.name !== undefined) {
      group.name = updateGroupDto.name;
    }
    if (updateGroupDto.color !== undefined) {
      group.color = updateGroupDto.color;
    }
    if (updateGroupDto.tabId !== undefined) {
      group.tabId = updateGroupDto.tabId;
    }
    await this.groupRepository.save(group);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const group = await this.findOne(id);
    await this.groupRepository.remove(group);
  }

  async reorder(id: string, newOrderIndex: number): Promise<Group> {
    const group = await this.findOne(id);
    const oldOrderIndex = group.orderIndex;
    const tabId = group.tabId;

    if (newOrderIndex === oldOrderIndex) {
      return group;
    }

    // Build the tabId condition - use IsNull() for null values
    const tabIdCondition = tabId === null ? IsNull() : tabId;

    // Shift other groups within the same tab
    if (newOrderIndex < oldOrderIndex) {
      // Moving up: shift groups in [newOrderIndex, oldOrderIndex - 1] down by 1
      await this.groupRepository.increment(
        { tabId: tabIdCondition, orderIndex: Between(newOrderIndex, oldOrderIndex - 1) },
        'orderIndex',
        1,
      );
    } else {
      // Moving down: shift groups in [oldOrderIndex + 1, newOrderIndex] up by 1
      await this.groupRepository.decrement(
        { tabId: tabIdCondition, orderIndex: Between(oldOrderIndex + 1, newOrderIndex) },
        'orderIndex',
        1,
      );
    }

    group.orderIndex = newOrderIndex;
    await this.groupRepository.save(group);
    return this.findOne(id);
  }

  async addBookmarkToGroup(groupId: string, bookmarkId: string): Promise<void> {
    // Check if group exists
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    // Check if bookmark exists
    const bookmark = await this.bookmarkRepository.findOne({
      where: { id: bookmarkId },
    });
    if (!bookmark) {
      throw new NotFoundException(`Bookmark with ID ${bookmarkId} not found`);
    }

    // Check if relationship already exists
    const existing = await this.bookmarkGroupRepository.findOne({
      where: { bookmarkId, groupId },
    });
    if (existing) {
      return; // Already in group
    }

    // Calculate the next orderIndex for this group
    const maxOrderResult = await this.bookmarkGroupRepository
      .createQueryBuilder('bg')
      .where('bg.group_id = :groupId', { groupId })
      .select('MAX(bg.orderIndex)', 'max')
      .getRawOne();
    const orderIndex = (maxOrderResult?.max ?? -1) + 1;

    // Create the relationship
    const bookmarkGroup = this.bookmarkGroupRepository.create({
      bookmarkId,
      groupId,
      orderIndex,
    });
    await this.bookmarkGroupRepository.save(bookmarkGroup);
  }

  async removeBookmarkFromGroup(
    groupId: string,
    bookmarkId: string,
  ): Promise<void> {
    const bookmarkGroup = await this.bookmarkGroupRepository.findOne({
      where: { bookmarkId, groupId },
    });

    if (!bookmarkGroup) {
      throw new NotFoundException(
        `Bookmark ${bookmarkId} is not in group ${groupId}`,
      );
    }

    await this.bookmarkGroupRepository.remove(bookmarkGroup);
  }

  async reorderBookmarkInGroup(
    groupId: string,
    bookmarkId: string,
    newOrderIndex: number,
  ): Promise<void> {
    const bookmarkGroup = await this.bookmarkGroupRepository.findOne({
      where: { bookmarkId, groupId },
    });

    if (!bookmarkGroup) {
      throw new NotFoundException(
        `Bookmark ${bookmarkId} is not in group ${groupId}`,
      );
    }

    const oldOrderIndex = bookmarkGroup.orderIndex;

    if (newOrderIndex === oldOrderIndex) {
      return;
    }

    // Shift other bookmarks within the same group
    if (newOrderIndex < oldOrderIndex) {
      // Moving up: shift bookmarks in [newOrderIndex, oldOrderIndex - 1] down by 1
      await this.bookmarkGroupRepository.increment(
        {
          groupId,
          orderIndex: Between(newOrderIndex, oldOrderIndex - 1),
        },
        'orderIndex',
        1,
      );
    } else {
      // Moving down: shift bookmarks in [oldOrderIndex + 1, newOrderIndex] up by 1
      await this.bookmarkGroupRepository.decrement(
        {
          groupId,
          orderIndex: Between(oldOrderIndex + 1, newOrderIndex),
        },
        'orderIndex',
        1,
      );
    }

    bookmarkGroup.orderIndex = newOrderIndex;
    await this.bookmarkGroupRepository.save(bookmarkGroup);
  }

  async getBookmarksInGroup(groupId: string): Promise<Bookmark[]> {
    const bookmarkGroups = await this.bookmarkGroupRepository.find({
      where: { groupId },
      relations: ['bookmark'],
      order: { orderIndex: 'ASC' },
    });
    return bookmarkGroups.map((bg) => bg.bookmark).filter((b) => b !== null);
  }

  async removeAll(): Promise<void> {
    // First, remove all bookmark-group relationships
    await this.bookmarkGroupRepository.clear();
    // Then delete all groups
    await this.groupRepository.clear();
  }
}
