import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async findAll(): Promise<Group[]> {
    return this.groupRepository.find({
      relations: ['bookmarks'],
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
    const group = this.groupRepository.create({
      id: uuidv4(),
      name: createGroupDto.name,
      color: createGroupDto.color,
    });
    return this.groupRepository.save(group);
  }

  async update(id: string, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id);
    group.name = updateGroupDto.name;
    group.color = updateGroupDto.color;
    await this.groupRepository.save(group);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const group = await this.findOne(id);
    await this.groupRepository.remove(group);
  }

  async addBookmarkToGroup(
    groupId: string,
    bookmarkId: string,
  ): Promise<void> {
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
}

