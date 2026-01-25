import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Bookmark } from '../entities/bookmark.entity';
import { Group } from '../entities/group.entity';
import { Tab } from '../entities/tab.entity';
import { BookmarkGroup } from '../entities/bookmark-group.entity';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { FaviconService } from './favicon.service';

@Injectable()
export class BookmarksService {
  private readonly logger = new Logger(BookmarksService.name);

  constructor(
    @InjectRepository(Bookmark)
    private bookmarkRepository: Repository<Bookmark>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Tab)
    private tabRepository: Repository<Tab>,
    @InjectRepository(BookmarkGroup)
    private bookmarkGroupRepository: Repository<BookmarkGroup>,
    private faviconService: FaviconService,
  ) {}

  async findAll(tabId?: string): Promise<Bookmark[]> {
    const queryBuilder = this.bookmarkRepository
      .createQueryBuilder('bookmark')
      .distinct(true)
      .leftJoinAndSelect('bookmark.bookmarkGroups', 'bookmarkGroups')
      .leftJoinAndSelect('bookmarkGroups.group', 'group')
      .leftJoinAndSelect('bookmark.tabs', 'tabs');

    if (tabId) {
      // Return bookmarks where tabId matches OR the bookmark belongs to the tab via tabs relationship
      queryBuilder.where('(bookmark.tabId = :tabId OR tabs.id = :tabId)', {
        tabId,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Bookmark> {
    const bookmark = await this.bookmarkRepository.findOne({
      where: { id },
      relations: ['bookmarkGroups', 'bookmarkGroups.group', 'tabs'],
    });
    if (!bookmark) {
      throw new NotFoundException(`Bookmark with ID ${id} not found`);
    }
    return bookmark;
  }

  async create(createBookmarkDto: CreateBookmarkDto): Promise<Bookmark> {
    // Fetch favicon for the URL
    const favicon = await this.faviconService.fetchFavicon(
      createBookmarkDto.url,
    );

    const bookmark = this.bookmarkRepository.create({
      id: uuidv4(),
      name: createBookmarkDto.name,
      url: createBookmarkDto.url,
      favicon,
      tabId: createBookmarkDto.tabId || null, // Keep for backward compatibility
    });

    // Handle tabIds (new) or tabId (backward compatibility)
    if (createBookmarkDto.tabIds && createBookmarkDto.tabIds.length > 0) {
      const tabs = await this.tabRepository.findBy({
        id: In(createBookmarkDto.tabIds),
      });
      bookmark.tabs = tabs;
      // Also set tabId to first tab for backward compatibility
      if (tabs.length > 0) {
        bookmark.tabId = tabs[0].id;
      }
    } else if (createBookmarkDto.tabId) {
      // Backward compatibility: if only tabId is provided, add it to tabs
      const tab = await this.tabRepository.findOne({
        where: { id: createBookmarkDto.tabId },
      });
      if (tab) {
        bookmark.tabs = [tab];
      }
    }

    const saved = await this.bookmarkRepository.save(bookmark);

    // Handle group assignments with orderIndex
    if (createBookmarkDto.groupIds && createBookmarkDto.groupIds.length > 0) {
      for (const groupId of createBookmarkDto.groupIds) {
        // Calculate the next orderIndex for this group
        const maxOrderResult = await this.bookmarkGroupRepository
          .createQueryBuilder('bg')
          .where('bg.group_id = :groupId', { groupId })
          .select('MAX(bg.orderIndex)', 'max')
          .getRawOne();
        const orderIndex = (maxOrderResult?.max ?? -1) + 1;

        const bookmarkGroup = this.bookmarkGroupRepository.create({
          bookmarkId: saved.id,
          groupId,
          orderIndex,
        });
        await this.bookmarkGroupRepository.save(bookmarkGroup);
      }
    }

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
      // Fetch new favicon when URL changes
      bookmark.favicon = await this.faviconService.fetchFavicon(
        updateBookmarkDto.url,
      );
    }

    // Handle tabIds (new) or tabId (backward compatibility)
    if (updateBookmarkDto.tabIds !== undefined) {
      if (updateBookmarkDto.tabIds.length > 0) {
        const tabs = await this.tabRepository.findBy({
          id: In(updateBookmarkDto.tabIds),
        });

        // Preserve original tabId if it's still in the selected tabs (for backward compatibility)
        const originalTabId = bookmark.tabId;
        const originalTabStillSelected =
          originalTabId && updateBookmarkDto.tabIds.includes(originalTabId);

        // If original tab is still selected, put it first in the array
        if (originalTabStillSelected) {
          const originalTab = tabs.find((tab) => tab.id === originalTabId);
          const otherTabs = tabs.filter((tab) => tab.id !== originalTabId);
          bookmark.tabs = originalTab ? [originalTab, ...otherTabs] : tabs;
          bookmark.tabId = originalTabId;
        } else {
          bookmark.tabs = tabs;
          // Set tabId to first tab for backward compatibility
          bookmark.tabId = tabs.length > 0 ? tabs[0].id : null;
        }
      } else {
        bookmark.tabs = [];
        bookmark.tabId = null;
      }
    } else if (updateBookmarkDto.tabId !== undefined) {
      // Backward compatibility: if only tabId is provided
      bookmark.tabId = updateBookmarkDto.tabId;
      const tab = await this.tabRepository.findOne({
        where: { id: updateBookmarkDto.tabId },
      });
      if (tab) {
        bookmark.tabs = [tab];
      } else {
        bookmark.tabs = [];
      }
    }

    if (updateBookmarkDto.groupIds !== undefined) {
      // Get current group IDs
      const currentGroupIds =
        bookmark.bookmarkGroups?.map((bg) => bg.groupId) || [];
      const newGroupIds = updateBookmarkDto.groupIds;

      // Find groups to remove and groups to add
      const groupsToRemove = currentGroupIds.filter(
        (gid) => !newGroupIds.includes(gid),
      );
      const groupsToAdd = newGroupIds.filter(
        (gid) => !currentGroupIds.includes(gid),
      );

      // Remove old group relationships
      for (const groupId of groupsToRemove) {
        await this.bookmarkGroupRepository.delete({
          bookmarkId: id,
          groupId,
        });
      }

      // Add new group relationships
      for (const groupId of groupsToAdd) {
        // Calculate the next orderIndex for this group
        const maxOrderResult = await this.bookmarkGroupRepository
          .createQueryBuilder('bg')
          .where('bg.group_id = :groupId', { groupId })
          .select('MAX(bg.orderIndex)', 'max')
          .getRawOne();
        const orderIndex = (maxOrderResult?.max ?? -1) + 1;

        const bookmarkGroup = this.bookmarkGroupRepository.create({
          bookmarkId: id,
          groupId,
          orderIndex,
        });
        await this.bookmarkGroupRepository.save(bookmarkGroup);
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

  async refreshAllFavicons(): Promise<{ updated: number; failed: number }> {
    const bookmarks = await this.bookmarkRepository.find();
    let updated = 0;
    let failed = 0;

    for (const bookmark of bookmarks) {
      try {
        const favicon = await this.faviconService.fetchFavicon(bookmark.url);
        if (favicon) {
          bookmark.favicon = favicon;
          await this.bookmarkRepository.save(bookmark);
          updated++;
        } else {
          failed++;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to refresh favicon for bookmark ${bookmark.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        failed++;
      }
    }

    this.logger.log(
      `Favicon refresh complete: ${updated} updated, ${failed} failed`,
    );
    return { updated, failed };
  }
}
