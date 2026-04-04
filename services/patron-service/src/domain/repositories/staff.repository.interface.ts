import { Staff } from '../entities/staff.entity';

export interface IStaffRepository {
  findById(id: string): Promise<Staff | null>;
  findByEmail(email: string): Promise<Staff | null>;
  findAllByLibrary(libraryId: string): Promise<Staff[]>;
  save(staff: Staff): Promise<Staff>;
}

export const STAFF_REPOSITORY = Symbol('IStaffRepository');
