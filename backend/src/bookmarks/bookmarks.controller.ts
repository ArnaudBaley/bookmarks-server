import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  async findAll(@Query('tabId') tabId?: string) {
    const bookmarks = await this.bookmarksService.findAll(tabId);
    return bookmarks.map((bookmark) => ({
      id: bookmark.id,
      name: bookmark.name,
      url: bookmark.url,
      tabId: bookmark.tabId, // Keep for backward compatibility
      tabIds: bookmark.tabs?.map((tab) => tab.id) || [],
      groupIds: bookmark.groups?.map((group) => group.id) || [],
      createdAt: bookmark.createdAt?.toISOString(),
      updatedAt: bookmark.updatedAt?.toISOString(),
    }));
  }

  @Post()
  async create(@Body() createBookmarkDto: CreateBookmarkDto) {
    const bookmark = await this.bookmarksService.create(createBookmarkDto);
    return {
      id: bookmark.id,
      name: bookmark.name,
      url: bookmark.url,
      tabId: bookmark.tabId, // Keep for backward compatibility
      tabIds: bookmark.tabs?.map((tab) => tab.id) || [],
      groupIds: bookmark.groups?.map((group) => group.id) || [],
      createdAt: bookmark.createdAt?.toISOString(),
      updatedAt: bookmark.updatedAt?.toISOString(),
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBookmarkDto: UpdateBookmarkDto,
  ) {
    const bookmark = await this.bookmarksService.update(id, updateBookmarkDto);
    return {
      id: bookmark.id,
      name: bookmark.name,
      url: bookmark.url,
      tabId: bookmark.tabId, // Keep for backward compatibility
      tabIds: bookmark.tabs?.map((tab) => tab.id) || [],
      groupIds: bookmark.groups?.map((group) => group.id) || [],
      createdAt: bookmark.createdAt?.toISOString(),
      updatedAt: bookmark.updatedAt?.toISOString(),
    };
  }

  @Delete('all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAll() {
    await this.bookmarksService.removeAll();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.bookmarksService.remove(id);
  }
}
