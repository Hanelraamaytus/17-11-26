import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { ElectricityAccountsService } from './electricity-accounts.service.js';
import { CreateElectricityAccountDto } from './dto/electricity-account.dto.js';

@Controller('electricity-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ElectricityAccountsController {
  constructor(private readonly service: ElectricityAccountsService) {}

  @Post() @Roles('CUSTOMER')
  create(@Body() dto: CreateElectricityAccountDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) { return this.service.findAll(user); }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user);
  }
}