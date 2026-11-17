import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { CreateElectricityServiceDto, UpdateElectricityServiceDto } from './dto/electricity-service.dto.js';

@Injectable()
export class ElectricityServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private visibleFor(user: AuthUser) {
    return user.role === 'ADMIN' ? {} : { is_active: true }; // customer hanya melihat layanan aktif
  }

  async create(dto: CreateElectricityServiceDto) {
    const dup = await this.prisma.electricityService.findUnique({ where: { code: dto.code } });
    if (dup) throw new ConflictException('Kode layanan sudah digunakan');
    const data = await this.prisma.electricityService.create({ data: dto });
    return { message: 'Layanan listrik berhasil dibuat', data };
  }

  async findAll(user: AuthUser) {
    const data = await this.prisma.electricityService.findMany({
      where: this.visibleFor(user),
      orderBy: { created_at: 'desc' },
    });
    return { message: 'Daftar layanan listrik', data };
  }

  async findOne(id: string, user: AuthUser) {
    const data = await this.prisma.electricityService.findFirst({ where: { id, ...this.visibleFor(user) } });
    if (!data) throw new NotFoundException('Layanan listrik tidak ditemukan');
    return { message: 'Detail layanan listrik', data };
  }

  async update(id: string, dto: UpdateElectricityServiceDto) {
    const current = await this.prisma.electricityService.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Layanan listrik tidak ditemukan');
    if (dto.code && dto.code !== current.code) {
      const dup = await this.prisma.electricityService.findUnique({ where: { code: dto.code } });
      if (dup) throw new ConflictException('Kode layanan sudah digunakan');
    }
    const data = await this.prisma.electricityService.update({ where: { id }, data: dto });
    return { message: 'Layanan listrik berhasil diubah', data };
  }

  async remove(id: string) {
    const current = await this.prisma.electricityService.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Layanan listrik tidak ditemukan');
    const used = await this.prisma.electricityAccount.count({ where: { electricity_service_id: id } });
    if (used > 0) {
      throw new ConflictException('Layanan sudah dipakai akun listrik, nonaktifkan saja (is_active = false)');
    }
    await this.prisma.electricityService.delete({ where: { id } });
    return { message: 'Layanan listrik berhasil dihapus', data: null };
  }
}