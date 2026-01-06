import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TabsService } from './tabs.service';
import { CreateTabDto } from './dto/create-tab.dto';
import { UpdateTabDto } from './dto/update-tab.dto';

@Controller('tabs')
export class TabsController {
  constructor(private readonly tabsService: TabsService) {}

  @Get()
  async findAll() {
    const tabs = await this.tabsService.findAll();
    return tabs.map((tab) => ({
      id: tab.id,
      name: tab.name,
      color: tab.color,
      createdAt: tab.createdAt?.toISOString(),
      updatedAt: tab.updatedAt?.toISOString(),
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const tab = await this.tabsService.findOne(id);
    return {
      id: tab.id,
      name: tab.name,
      color: tab.color,
      createdAt: tab.createdAt?.toISOString(),
      updatedAt: tab.updatedAt?.toISOString(),
    };
  }

  @Post()
  async create(@Body() createTabDto: CreateTabDto) {
    const tab = await this.tabsService.create(createTabDto);
    return {
      id: tab.id,
      name: tab.name,
      color: tab.color,
      createdAt: tab.createdAt?.toISOString(),
      updatedAt: tab.updatedAt?.toISOString(),
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTabDto: UpdateTabDto) {
    const tab = await this.tabsService.update(id, updateTabDto);
    return {
      id: tab.id,
      name: tab.name,
      color: tab.color,
      createdAt: tab.createdAt?.toISOString(),
      updatedAt: tab.updatedAt?.toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.tabsService.remove(id);
  }
}
