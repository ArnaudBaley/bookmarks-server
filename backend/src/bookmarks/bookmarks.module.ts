import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';
import { Bookmark } from '../entities/bookmark.entity';
import { Group } from '../entities/group.entity';
import { Tab } from '../entities/tab.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bookmark, Group, Tab])],
  controllers: [BookmarksController],
  providers: [BookmarksService],
})
export class BookmarksModule {}
