import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    async me(userId: string){
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, created_at: true},
        });
        if (!user) throw new NotFoundException('User tidak ditemukan');
        return { message: 'Profil user', data: user};
    }
}
