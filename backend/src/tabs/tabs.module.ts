import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TabsController } from './tabs.controller';
import { TabsService } from './tabs.service';
import { TabsMigration } from './tabs.migration';
import { Tab } from '../entities/tab.entity';
import { Group } from '../entities/group.entity';
import { Bookmark } from '../entities/bookmark.entity';
import { BookmarkGroup } from '../entities/bookmark-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tab, Group, Bookmark, BookmarkGroup])],
  controllers: [TabsController],
  providers: [TabsService, TabsMigration],
  exports: [TabsService],
})
export class TabsModule {}
