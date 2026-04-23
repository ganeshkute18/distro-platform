import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto, UpdateAgencyDto } from './dto/agency.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Agencies')
@ApiBearerAuth()
@Controller('agencies')
export class AgenciesController {
  constructor(private service: AgenciesService) {}

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.service.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.OWNER)
  @Post()
  create(@Body() dto: CreateAgencyDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.id);
  }

  @Roles(Role.OWNER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAgencyDto, @CurrentUser() user: User) {
    return this.service.update(id, dto, user.id);
  }

  @Roles(Role.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
