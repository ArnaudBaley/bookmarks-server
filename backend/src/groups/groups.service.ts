import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Group } from '../entities/group.entity';
import { Bookmark } from '../entities/bookmark.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Bookmark)
    private bookmarkRepository: Repository<Bookmark>,
  ) {}

  async findAll(tabId?: string): Promise<Group[]> {
    const where = tabId ? { tabId } : {};
    return this.groupRepository.find({
      where,
      relations: ['bookmarks'],
      order: { orderIndex: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['bookmarks'],
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
    const group = await this.findOne(groupId);
    const bookmark = await this.bookmarkRepository.findOne({
      where: { id: bookmarkId },
      relations: ['groups'],
    });

    if (!bookmark) {
      throw new NotFoundException(`Bookmark with ID ${bookmarkId} not found`);
    }

    if (!group.bookmarks) {
      group.bookmarks = [];
    }

    const bookmarkAlreadyInGroup = group.bookmarks.some(
      (b) => b.id === bookmarkId,
    );
    if (!bookmarkAlreadyInGroup) {
      group.bookmarks.push(bookmark);
      await this.groupRepository.save(group);
    }
  }

  async removeBookmarkFromGroup(
    groupId: string,
    bookmarkId: string,
  ): Promise<void> {
    const group = await this.findOne(groupId);
    const bookmark = await this.bookmarkRepository.findOne({
      where: { id: bookmarkId },
    });

    if (!bookmark) {
      throw new NotFoundException(`Bookmark with ID ${bookmarkId} not found`);
    }

    if (group.bookmarks) {
      group.bookmarks = group.bookmarks.filter((b) => b.id !== bookmarkId);
      await this.groupRepository.save(group);
    }
  }

  async removeAll(): Promise<void> {
    // First, remove all bookmarks from groups (clean up ManyToMany relationships)
    const groups = await this.groupRepository.find({
      relations: ['bookmarks'],
    });
    for (const group of groups) {
      if (group.bookmarks && group.bookmarks.length > 0) {
        group.bookmarks = [];
        await this.groupRepository.save(group);
      }
    }
    // Then delete all groups
    await this.groupRepository.clear();
  }
}
