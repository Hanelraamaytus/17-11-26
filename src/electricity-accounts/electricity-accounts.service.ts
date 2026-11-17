import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { CreateElectricityAccountDto } from './dto/electricity-account.dto.js';

@Injectable()
export class ElectricityAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  private ownerFilter(user: AuthUser) {
    return user.role === 'ADMIN' ? {} : { user_id: user.userId };
  }

  private readonly include = {
    electricity_service: { select: { code: true, name: true, power_va: true, price_per_kwh: true } },
  };

  async create(dto: CreateElectricityAccountDto, user: AuthUser) {
    const service = await this.prisma.electricityService.findUnique({ where: { id: dto.electricity_service_id } });
    if (!service) throw new NotFoundException('Layanan listrik tidak ditemukan');
    if (!service.is_active) throw new BadRequestException('Layanan listrik tidak aktif');

    const dup = await this.prisma.electricityAccount.findUnique({ where: { customer_number: dto.customer_number } });
    if (dup) throw new ConflictException('Nomor pelanggan sudah terdaftar');

    const data = await this.prisma.electricityAccount.create({
      data: { ...dto, user_id: user.userId },
      include: this.include,
    });
    return { message: 'Akun listrik berhasil didaftarkan', data };
  }

  async findAll(user: AuthUser) {
    const data = await this.prisma.electricityAccount.findMany({
      where: this.ownerFilter(user),
      include: this.include,
      orderBy: { created_at: 'desc' },
    });
    return { message: 'Daftar akun listrik', data };
  }

  async findOne(id: string, user: AuthUser) {
    const data = await this.prisma.electricityAccount.findFirst({
      where: { id, ...this.ownerFilter(user) }, // filter kepemilikan di query
      include: this.include,
    });
    if (!data) throw new NotFoundException('Akun listrik tidak ditemukan');
    return { message: 'Detail akun listrik', data };
  }
}