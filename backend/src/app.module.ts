import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Bookmark } from './entities/bookmark.entity';
import { Group } from './entities/group.entity';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { GroupsModule } from './groups/groups.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_PATH || 'bookmarks.db',
      entities: [Bookmark, Group],
      synchronize: true, // Auto-sync schema in development
    }),
    BookmarksModule,
    GroupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
