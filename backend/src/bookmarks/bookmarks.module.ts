import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';
import { FaviconService } from './favicon.service';
import { Bookmark } from '../entities/bookmark.entity';
import { Group } from '../entities/group.entity';
import { Tab } from '../entities/tab.entity';
import { BookmarkGroup } from '../entities/bookmark-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bookmark, Group, Tab, BookmarkGroup])],
  controllers: [BookmarksController],
  providers: [BookmarksService, FaviconService],
})
export class BookmarksModule {}
