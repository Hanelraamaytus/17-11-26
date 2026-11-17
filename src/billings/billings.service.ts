import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { CreateBillingDto, UpdateBillingDto } from './dto/billing.dto.js';

const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class BillingsService {
  constructor(private readonly prisma: PrismaService) {}

  private ownerFilter(user: AuthUser) {
    return user.role === 'ADMIN' ? {} : { electricity_account: { user_id: user.userId } };
  }

  private readonly include = {
    electricity_account: { select: { customer_number: true, customer_name: true } },
    payment: { select: { id: true, status: true } },
  };

  private calculate(previous: number, current: number, tariff: number) {
    if (current < previous) throw new BadRequestException('current_meter harus lebih besar atau sama dengan previous_meter');
    const consumption = round2(current - previous);
    return { consumption, amount: round2(consumption * tariff) };
  }

  async create(dto: CreateBillingDto) {
    const account = await this.prisma.electricityAccount.findUnique({
      where: { id: dto.electricity_account_id },
      include: { electricity_service: true },
    });
    if (!account) throw new NotFoundException('Akun listrik tidak ditemukan');
    if (account.status !== 'ACTIVE') throw new BadRequestException('Akun listrik tidak aktif');

    const dup = await this.prisma.billing.findUnique({
      where: {
        electricity_account_id_period_month_period_year: {
          electricity_account_id: dto.electricity_account_id,
          period_month: dto.period_month,
          period_year: dto.period_year,
        },
      },
    });
    if (dup) throw new ConflictException('Billing untuk akun dan periode ini sudah ada');

    const tariff = Number(account.electricity_service.price_per_kwh); // snapshot tarif
    const { consumption, amount } = this.calculate(dto.previous_meter, dto.current_meter, tariff);

    const data = await this.prisma.billing.create({
      data: {
        electricity_account_id: dto.electricity_account_id,
        period_month: dto.period_month,
        period_year: dto.period_year,
        previous_meter: dto.previous_meter,
        current_meter: dto.current_meter,
        consumption,
        tariff_per_kwh: tariff,
        amount,
        due_date: new Date(dto.due_date),
        status: 'UNPAID',
      },
      include: this.include,
    });
    return { message: 'Billing berhasil dibuat', data };
  }

  async findAll(user: AuthUser) {
    const data = await this.prisma.billing.findMany({
      where: this.ownerFilter(user),
      include: this.include,
      orderBy: { created_at: 'desc' },
    });
    return { message: 'Daftar billing', data };
  }

  async findOne(id: string, user: AuthUser) {
    const data = await this.prisma.billing.findFirst({
      where: { id, ...this.ownerFilter(user) },
      include: this.include,
    });
    if (!data) throw new NotFoundException('Billing tidak ditemukan');
    return { message: 'Detail billing', data };
  }

  async update(id: string, dto: UpdateBillingDto) {
    const current = await this.prisma.billing.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Billing tidak ditemukan');
    if (current.status !== 'UNPAID') {
      throw new ConflictException('Billing yang sedang diverifikasi atau sudah lunas tidak dapat diubah');
    }
    const previous = dto.previous_meter ?? Number(current.previous_meter);
    const currentMeter = dto.current_meter ?? Number(current.current_meter);
    const { consumption, amount } = this.calculate(previous, currentMeter, Number(current.tariff_per_kwh)); // tarif snapshot tetap

    const data = await this.prisma.billing.update({
      where: { id },
      data: {
        previous_meter: previous,
        current_meter: currentMeter,
        consumption,
        amount,
        ...(dto.due_date ? { due_date: new Date(dto.due_date) } : {}),
      },
      include: this.include,
    });
    return { message: 'Billing berhasil diubah', data };
  }

  async remove(id: string) {
    const current = await this.prisma.billing.findUnique({ where: { id }, include: { payment: true } });
    if (!current) throw new NotFoundException('Billing tidak ditemukan');
    if (current.payment) throw new ConflictException('Billing sudah memiliki pembayaran, tidak dapat dihapus');
    await this.prisma.billing.delete({ where: { id } });
    return { message: 'Billing berhasil dihapus', data: null };
  }
}