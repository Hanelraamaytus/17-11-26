import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt'

@Injectable()
export class BcryptService {
    private readonly saltRounds = 10;
    hash(plain: string): Promise<string> {return bcrypt.hash(plain, this.saltRounds); }
    compare(plain: string, hash: string): Promise<boolean> { return bcrypt.compare(plain, hash) }
}
