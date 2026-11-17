import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { BillingsService } from './billings.service.js';
import { CreateBillingDto, UpdateBillingDto } from './dto/billing.dto.js';

@Controller('billings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingsController {
  constructor(private readonly service: BillingsService) {}

  @Post() @Roles('ADMIN')
  create(@Body() dto: CreateBillingDto) { return this.service.create(dto); }

  @Get()
  findAll(@CurrentUser() user: AuthUser) { return this.service.findAll(user); }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user);
  }

  @Patch(':id') @Roles('ADMIN')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBillingDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id') @Roles('ADMIN')
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.service.remove(id); }
}