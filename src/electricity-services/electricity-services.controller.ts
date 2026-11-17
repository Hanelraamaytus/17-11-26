import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { ElectricityServicesService } from './electricity-services.service.js';
import { CreateElectricityServiceDto, UpdateElectricityServiceDto } from './dto/electricity-service.dto.js';

@Controller('electricity-services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ElectricityServicesController {
  constructor(private readonly service: ElectricityServicesService) {}

  @Post() @Roles('ADMIN')
  create(@Body() dto: CreateElectricityServiceDto) { return this.service.create(dto); }

  @Get()
  findAll(@CurrentUser() user: AuthUser) { return this.service.findAll(user); }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user);
  }

  @Patch(':id') @Roles('ADMIN')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateElectricityServiceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id') @Roles('ADMIN')
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.service.remove(id); }
}