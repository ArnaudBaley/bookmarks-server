import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { ReorderGroupDto } from './dto/reorder-group.dto';
import { ReorderBookmarkDto } from './dto/reorder-bookmark.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async findAll(@Query('tabId') tabId?: string) {
    const groups = await this.groupsService.findAll(tabId);
    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      color: group.color,
      tabId: group.tabId,
      orderIndex: group.orderIndex,
      createdAt: group.createdAt?.toISOString(),
      updatedAt: group.updatedAt?.toISOString(),
    }));
  }

  @Post()
  async create(@Body() createGroupDto: CreateGroupDto) {
    const group = await this.groupsService.create(createGroupDto);
    return {
      id: group.id,
      name: group.name,
      color: group.color,
      tabId: group.tabId,
      orderIndex: group.orderIndex,
      createdAt: group.createdAt?.toISOString(),
      updatedAt: group.updatedAt?.toISOString(),
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    const group = await this.groupsService.update(id, updateGroupDto);
    return {
      id: group.id,
      name: group.name,
      color: group.color,
      tabId: group.tabId,
      orderIndex: group.orderIndex,
      createdAt: group.createdAt?.toISOString(),
      updatedAt: group.updatedAt?.toISOString(),
    };
  }

  @Patch(':id/reorder')
  async reorder(
    @Param('id') id: string,
    @Body() reorderGroupDto: ReorderGroupDto,
  ) {
    const group = await this.groupsService.reorder(
      id,
      reorderGroupDto.newOrderIndex,
    );
    return {
      id: group.id,
      name: group.name,
      color: group.color,
      tabId: group.tabId,
      orderIndex: group.orderIndex,
      createdAt: group.createdAt?.toISOString(),
      updatedAt: group.updatedAt?.toISOString(),
    };
  }

  @Delete('all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAll() {
    await this.groupsService.removeAll();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.groupsService.remove(id);
  }

  @Post(':groupId/bookmarks/:bookmarkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async addBookmarkToGroup(
    @Param('groupId') groupId: string,
    @Param('bookmarkId') bookmarkId: string,
  ) {
    await this.groupsService.addBookmarkToGroup(groupId, bookmarkId);
  }

  @Delete(':groupId/bookmarks/:bookmarkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBookmarkFromGroup(
    @Param('groupId') groupId: string,
    @Param('bookmarkId') bookmarkId: string,
  ) {
    await this.groupsService.removeBookmarkFromGroup(groupId, bookmarkId);
  }

  @Patch(':groupId/bookmarks/:bookmarkId/reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorderBookmarkInGroup(
    @Param('groupId') groupId: string,
    @Param('bookmarkId') bookmarkId: string,
    @Body() reorderBookmarkDto: ReorderBookmarkDto,
  ) {
    await this.groupsService.reorderBookmarkInGroup(
      groupId,
      bookmarkId,
      reorderBookmarkDto.newOrderIndex,
    );
  }
}
