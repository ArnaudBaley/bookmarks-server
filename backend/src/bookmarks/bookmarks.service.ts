import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Bookmark } from '../entities/bookmark.entity';
import { Group } from '../entities/group.entity';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private bookmarkRepository: Repository<Bookmark>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
  ) {}

  async findAll(tabId?: string): Promise<Bookmark[]> {
    const where = tabId ? { tabId } : {};
    return this.bookmarkRepository.find({
      where,
      relations: ['groups'],
    });
  }

  async findOne(id: string): Promise<Bookmark> {
    const bookmark = await this.bookmarkRepository.findOne({
      where: { id },
      relations: ['groups'],
    });
    if (!bookmark) {
      throw new NotFoundException(`Bookmark with ID ${id} not found`);
    }
    return bookmark;
  }

  async create(createBookmarkDto: CreateBookmarkDto): Promise<Bookmark> {
    const bookmark = this.bookmarkRepository.create({
      id: uuidv4(),
      name: createBookmarkDto.name,
      url: createBookmarkDto.url,
      tabId: createBookmarkDto.tabId || null,
    });

    if (createBookmarkDto.groupIds && createBookmarkDto.groupIds.length > 0) {
      const groups = await this.groupRepository.findBy({
        id: In(createBookmarkDto.groupIds),
      });
      bookmark.groups = groups;
    }

    const saved = await this.bookmarkRepository.save(bookmark);
    return this.findOne(saved.id);
  }

  async update(
    id: string,
    updateBookmarkDto: UpdateBookmarkDto,
  ): Promise<Bookmark> {
    const bookmark = await this.findOne(id);

    if (updateBookmarkDto.name !== undefined) {
      bookmark.name = updateBookmarkDto.name;
    }
    if (updateBookmarkDto.url !== undefined) {
      bookmark.url = updateBookmarkDto.url;
    }
    if (updateBookmarkDto.tabId !== undefined) {
      bookmark.tabId = updateBookmarkDto.tabId;
    }

    if (updateBookmarkDto.groupIds !== undefined) {
      if (updateBookmarkDto.groupIds.length > 0) {
        const groups = await this.groupRepository.findBy({
          id: In(updateBookmarkDto.groupIds),
        });
        bookmark.groups = groups;
      } else {
        bookmark.groups = [];
      }
    }

    await this.bookmarkRepository.save(bookmark);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const bookmark = await this.findOne(id);
    await this.bookmarkRepository.remove(bookmark);
  }

  async removeAll(): Promise<void> {
    await this.bookmarkRepository.clear();
  }
}
