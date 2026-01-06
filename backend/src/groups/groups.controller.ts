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
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

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
      createdAt: group.createdAt?.toISOString(),
      updatedAt: group.updatedAt?.toISOString(),
    };
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
}

