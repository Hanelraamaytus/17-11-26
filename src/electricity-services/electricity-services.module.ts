import { Module } from '@nestjs/common';
import { ElectricityServicesService } from './electricity-services.service.js';
import { ElectricityServicesController } from './electricity-services.controller.js';

@Module({
  providers: [ElectricityServicesService],
  controllers: [ElectricityServicesController]
})
export class ElectricityServicesModule {}
