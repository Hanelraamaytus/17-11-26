import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { BcryptService } from '../bcrypt/bcrypt.service.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';
import type { JwtPayload } from './types/jwt-payload.type.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcrypt: BcryptService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email sudah terdaftar');

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: await this.bcrypt.hash(dto.password),
        role: 'CUSTOMER', // selalu CUSTOMER, tidak dari client
      },
      select: { id: true, name: true, email: true, role: true, created_at: true },
    });
    return { message: 'Registrasi berhasil', data: user };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await this.bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Email atau password salah');
    }
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return {
      message: 'Login berhasil',
      data: { access_token: await this.jwt.signAsync(payload) },
    };
  }
}