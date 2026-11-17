import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { BcryptModule } from './bcrypt/bcrypt.module.js';
import { SupabaseStorageModule } from './supabase-storage/supabase-storage.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { ElectricityServicesModule } from './electricity-services/electricity-services.module.js';
import { ElectricityAccountsModule } from './electricity-accounts/electricity-accounts.module.js';
import { BillingsModule } from './billings/billings.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BcryptModule,
    SupabaseStorageModule,
    AuthModule,
    UsersModule,
    ElectricityServicesModule,
    ElectricityAccountsModule, // TAMBAHKAN INI
    BillingsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

