import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IStaffRepository } from '../../domain/repositories/staff.repository.interface';
import { Staff } from '../../domain/entities/staff.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { StaffRole } from '@biblioflow/shared-types';

@Injectable()
export class PrismaStaffRepository implements IStaffRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Staff | null> {
    const record = await this.prisma.staff.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<Staff | null> {
    const record = await this.prisma.staff.findUnique({ where: { email } });
    return record ? this.toDomain(record) : null;
  }

  async findAllByLibrary(libraryId: string): Promise<Staff[]> {
    const records = await this.prisma.staff.findMany({ where: { libraryId } });
    return records.map((r) => this.toDomain(r));
  }

  async save(staff: Staff): Promise<Staff> {
    const data = {
      libraryId: staff.libraryId,
      fullName: staff.fullName,
      email: staff.email.toString(),
      passwordHash: staff.passwordHash,
      role: staff.role,
      permissions: staff.permissions,
      isActive: staff.isActive,
    };
    const record = await this.prisma.staff.upsert({
      where: { id: staff.id },
      create: { id: staff.id, ...data },
      update: data,
    });
    return this.toDomain(record);
  }

  private toDomain(record: {
    id: string;
    libraryId: string;
    fullName: string;
    email: string;
    passwordHash: string;
    role: string;
    permissions: string[];
    isActive: boolean;
  }): Staff {
    return Staff.create({
      id: record.id,
      libraryId: record.libraryId,
      fullName: record.fullName,
      email: Email.create(record.email),
      passwordHash: record.passwordHash,
      role: record.role as StaffRole,
      permissions: record.permissions,
      isActive: record.isActive,
    });
  }
}
