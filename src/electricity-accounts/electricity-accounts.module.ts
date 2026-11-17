import { Module } from '@nestjs/common';
import { ElectricityAccountsService } from './electricity-accounts.service.js';
import { ElectricityAccountsController } from './electricity-accounts.controller.js';

@Module({
  providers: [ElectricityAccountsService],
  controllers: [ElectricityAccountsController]
})
export class ElectricityAccountsModule {}
