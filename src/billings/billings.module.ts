import { Module } from '@nestjs/common';
import { BillingsService } from './billings.service.js';
import { BillingsController } from './billings.controller.js';

@Module({
  providers: [BillingsService],
  controllers: [BillingsController]
})
export class BillingsModule {}
