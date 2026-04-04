import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InvalidCredentialsError } from '@biblioflow/shared-errors';
import { TokenPayload } from '@biblioflow/shared-types';
import { IPatronRepository, PATRON_REPOSITORY } from '../../domain/repositories/patron.repository.interface';
import { IStaffRepository, STAFF_REPOSITORY } from '../../domain/repositories/staff.repository.interface';
import { LoginDto } from '../dtos/login.dto';

// ─────────────────────────────────────────────────────────────────────────────
// AuthenticateUseCase
// Supports both patron and staff login, returns signed JWT
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthResult {
  accessToken: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    cardNumber?: string;
  };
}

@Injectable()
export class AuthenticateUseCase {
  constructor(
    @Inject(PATRON_REPOSITORY) private readonly patronRepo: IPatronRepository,
    @Inject(STAFF_REPOSITORY) private readonly staffRepo: IStaffRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResult> {
    // Try staff first (most common for internal use)
    const staff = await this.staffRepo.findByEmail(dto.email.toLowerCase().trim());
    if (staff) {
      const valid = await bcrypt.compare(dto.password, staff.passwordHash);
      if (!valid) throw new InvalidCredentialsError();

      const payload: TokenPayload = {
        sub: staff.id,
        email: staff.email.toString(),
        role: staff.role,
        libraryId: staff.libraryId,
      };

      return {
        accessToken: this.jwtService.sign(payload),
        expiresIn: '24h',
        user: {
          id: staff.id,
          email: staff.email.toString(),
          fullName: staff.fullName,
          role: staff.role,
        },
      };
    }

    // Try patron
    const patron = await this.patronRepo.findByEmail(dto.email.toLowerCase().trim());
    if (!patron) throw new InvalidCredentialsError();

    const valid = await bcrypt.compare(dto.password, patron.passwordHash);
    if (!valid) throw new InvalidCredentialsError();

    const payload: TokenPayload = {
      sub: patron.id,
      email: patron.email.toString(),
      role: 'patron',
      libraryId: patron.libraryId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: '24h',
      user: {
        id: patron.id,
        email: patron.email.toString(),
        fullName: patron.fullName,
        role: 'patron',
        cardNumber: patron.cardNumber.toString(),
      },
    };
  }
}
