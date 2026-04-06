import { Patron } from '../entities/patron.entity';

// ─────────────────────────────────────────────────────────────────────────────
// IPatronRepository – Domain Port (interface)
// The infrastructure layer provides the concrete implementation
// ─────────────────────────────────────────────────────────────────────────────

export interface IPatronRepository {
  findById(id: string): Promise<Patron | null>;
  findByEmail(email: string): Promise<Patron | null>;
  findByCardNumber(cardNumber: string): Promise<Patron | null>;
  findAllByLibrary(libraryId: string, page: number, limit: number, query?: string): Promise<{ data: Patron[]; total: number }>;
  save(patron: Patron): Promise<Patron>;
  delete(id: string): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
  existsByCardNumber(cardNumber: string): Promise<boolean>;
}

export const PATRON_REPOSITORY = Symbol('IPatronRepository');
