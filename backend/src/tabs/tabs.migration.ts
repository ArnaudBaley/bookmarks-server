import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Tab } from '../entities/tab.entity';
import { Group } from '../entities/group.entity';
import { Bookmark } from '../entities/bookmark.entity';

@Injectable()
export class TabsMigration implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Tab)
    private tabRepository: Repository<Tab>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Bookmark)
    private bookmarkRepository: Repository<Bookmark>,
  ) {}

  async onApplicationBootstrap() {
    await this.migrateExistingData();
  }

  private async migrateExistingData() {
    // Check if any tabs exist
    const existingTabs = await this.tabRepository.count();

    if (existingTabs > 0) {
      // Migration already done
      return;
    }

    // Create default tab
    const defaultTab = this.tabRepository.create({
      id: uuidv4(),
      name: 'Default',
      color: '#3b82f6',
    });
    const savedTab = await this.tabRepository.save(defaultTab);

    // Get all existing groups and bookmarks
    const allGroups = await this.groupRepository.find();
    const allBookmarks = await this.bookmarkRepository.find();

    // Update groups to assign to default tab if they don't have a tabId
    for (const group of allGroups) {
      if (!group.tabId || group.tabId === '') {
        group.tabId = savedTab.id;
        await this.groupRepository.save(group);
      }
    }

    // Update bookmarks to assign to default tab if they don't have a tabId
    for (const bookmark of allBookmarks) {
      if (!bookmark.tabId || bookmark.tabId === '') {
        bookmark.tabId = savedTab.id;
        await this.bookmarkRepository.save(bookmark);
      }
    }
  }
}
