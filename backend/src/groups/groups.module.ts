import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { Group } from '../entities/group.entity';
import { Bookmark } from '../entities/bookmark.entity';
import { BookmarkGroup } from '../entities/bookmark-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Group, Bookmark, BookmarkGroup])],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
