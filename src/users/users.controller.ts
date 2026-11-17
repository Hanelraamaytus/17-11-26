import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UsersService } from './users.service.js';
import type { AuthUser } from '../auth/types/jwt-payload.type.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';


@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly users: UsersService){}

    @Get('me')
    me(@CurrentUser() user: AuthUser) {return this.users.me(user.userId);}
}
