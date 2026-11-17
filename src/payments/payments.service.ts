import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseStorageService } from '../supabase-storage/supabase-storage.service.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';

export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
  ) {}

  private ownerFilter(user: AuthUser) {
    return user.role === 'ADMIN' ? {} : { billing: { electricity_account: { user_id: user.userId } } };
  }

  private readonly include = {
    billing: {
      select: {
        id: true, period_month: true, period_year: true, amount: true, status: true,
        electricity_account: { select: { customer_number: true, customer_name: true } },
      },
    },
  };

  private withUrl<T extends { payment_proof: string }>(p: T) {
    return { ...p, payment_proof_url: this.storage.getPublicUrl(p.payment_proof) };
  }

  async upload(billingId: string, file: Express.Multer.File | undefined, user: AuthUser) {
    // validasi file
    if (!file) throw new BadRequestException('File bukti pembayaran wajib diunggah (field: file)');
    const ext = ALLOWED_TYPES[file.mimetype];
    if (!ext) throw new BadRequestException('Tipe file harus JPG, PNG, atau PDF');
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException('Ukuran file maksimal 2 MB');

    // billing harus milik user
    const billing = await this.prisma.billing.findFirst({
      where: { id: billingId, electricity_account: { user_id: user.userId } },
      include: { payment: true },
    });
    if (!billing) throw new NotFoundException('Billing tidak ditemukan');
    if (billing.status === 'PAID') throw new ConflictException('Tagihan sudah lunas');
    if (billing.status === 'WAITING_VERIFICATION') {
      throw new ConflictException('Pembayaran sedang menunggu verifikasi admin');
    }

    // nama file unik, bukan nama asli
    const uploaded = await this.storage.uploadFile(file, `payment-proofs/${randomUUID()}.${ext}`);

    try {
      const payment = await this.prisma.$transaction(async (tx) => {
        const saved = billing.payment
          ? await tx.payment.update({
              where: { id: billing.payment.id },
              data: { payment_proof: uploaded.path, status: 'PENDING', verified_by: null, verified_at: null },
            })
          : await tx.payment.create({
              data: { billing_id: billing.id, payment_proof: uploaded.path, status: 'PENDING' },
            });
        await tx.billing.update({ where: { id: billing.id }, data: { status: 'WAITING_VERIFICATION' } });
        return saved;
      });

      if (billing.payment) await this.storage.deleteFile(billing.payment.payment_proof).catch(() => undefined);
      return { message: 'Bukti pembayaran berhasil diunggah', data: this.withUrl(payment) };
    } catch (err) {
      await this.storage.deleteFile(uploaded.path).catch(() => undefined);
      throw err;
    }
  }

  async findAll(user: AuthUser) {
    const rows = await this.prisma.payment.findMany({
      where: this.ownerFilter(user),
      include: this.include,
      orderBy: { created_at: 'desc' },
    });
    return { message: 'Daftar pembayaran', data: rows.map((p) => this.withUrl(p)) };
  }

  async findOne(id: string, user: AuthUser) {
    const row = await this.prisma.payment.findFirst({
      where: { id, ...this.ownerFilter(user) },
      include: this.include,
    });
    if (!row) throw new NotFoundException('Pembayaran tidak ditemukan');
    return { message: 'Detail pembayaran', data: this.withUrl(row) };
  }

  private async verify(id: string, adminId: string, approve: boolean) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Pembayaran tidak ditemukan');
    if (payment.status !== 'PENDING') throw new ConflictException('Pembayaran ini tidak sedang menunggu verifikasi');

    const [updated] = await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id },
        data: { status: approve ? 'APPROVED' : 'REJECTED', verified_by: adminId, verified_at: new Date() },
      }),
      this.prisma.billing.update({
        where: { id: payment.billing_id },
        data: { status: approve ? 'PAID' : 'UNPAID' },
      }),
    ]);
    return {
      message: approve ? 'Pembayaran disetujui' : 'Pembayaran ditolak',
      data: this.withUrl(updated),
    };
  }

  approve(id: string, adminId: string) { return this.verify(id, adminId, true); }
  reject(id: string, adminId: string) { return this.verify(id, adminId, false); }
}