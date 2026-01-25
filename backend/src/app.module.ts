import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Bookmark } from './entities/bookmark.entity';
import { Group } from './entities/group.entity';
import { Tab } from './entities/tab.entity';
import { BookmarkGroup } from './entities/bookmark-group.entity';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { GroupsModule } from './groups/groups.module';
import { TabsModule } from './tabs/tabs.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_PATH || 'bookmarks.db',
      entities: [Bookmark, Group, Tab, BookmarkGroup],
      synchronize: true, // Auto-sync schema in development
    }),
    BookmarksModule,
    GroupsModule,
    TabsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
