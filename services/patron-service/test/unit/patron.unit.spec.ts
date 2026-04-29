/**
 * Pruebas Unitarias – patron-service
 *
 * Cubren:
 *  - Value Objects: Email, CardNumber
 *  - Aggregate Root: Patron (reglas de dominio)
 *  - Caso de uso: RegisterPatronUseCase (con mocks)
 *
 * Mocks utilizados:
 *  1. mockPatronRepository – simula IPatronRepository
 *  2. mockEventPublisher   – simula IEventPublisher
 */

import { Email } from '../../src/domain/value-objects/email.vo';
import { CardNumber } from '../../src/domain/value-objects/card-number.vo';
import { Patron, PatronProps } from '../../src/domain/entities/patron.entity';
import { Staff } from '../../src/domain/entities/staff.entity';
import { RegisterPatronUseCase } from '../../src/application/use-cases/register-patron.use-case';
import { PatronMapper } from '../../src/application/mappers/patron.mapper';
import {
  EmailAlreadyRegisteredError,
  PatronSuspendedError,
  PatronHasPendingFinesError,
} from '@biblioflow/shared-errors';

// ─── Mock 1: IPatronRepository ────────────────────────────────────────────────
const mockPatronRepository = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByCardNumber: jest.fn(),
  findAllByLibrary: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  existsByEmail: jest.fn(),
  existsByCardNumber: jest.fn(),
};

// ─── Mock 2: IEventPublisher ──────────────────────────────────────────────────
const mockEventPublisher = {
  publish: jest.fn(),
};

// ─── Helper para construir un Patron de prueba ────────────────────────────────
function buildPatron(overrides: Partial<PatronProps> = {}): Patron {
  const email = Email.create('socio@test.com');
  const cardNumber = CardNumber.generate('LIB');
  return Patron.create({
    id: 'patron-id-001',
    libraryId: 'lib-001',
    cardNumber,
    fullName: 'Ana García',
    email,
    phone: null,
    address: null,
    passwordHash: '$2b$12$hashedpassword',
    registrationDate: new Date('2024-01-01'),
    status: 'active',
    pendingFinesAmount: 0,
    ...overrides,
  });
}

// =============================================================================
describe('Pruebas Unitarias – patron-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── TEST 1: Email.create – email válido ─────────────────────────────────────
  describe('Email (Value Object)', () => {
    it('crea una instancia válida y normaliza a minúsculas', () => {
      const email = Email.create('  SOCIO@BIBLIOTECA.ES  ');

      // MATCHER 1: toBe
      expect(email.toString()).toBe('socio@biblioteca.es');
      // MATCHER 2: toBeInstanceOf
      expect(email).toBeInstanceOf(Email);
      // MATCHER 3: toBeTruthy
      expect(email.equals(Email.create('socio@biblioteca.es'))).toBeTruthy();
    });

    // ─── TEST 2: Email.create – email inválido ────────────────────────────────
    it('lanza Error cuando el formato del email es inválido', () => {
      // MATCHER 4: toThrow con mensaje
      expect(() => Email.create('no-es-un-email')).toThrow('Invalid email format');
      expect(() => Email.create('@sinlocal.com')).toThrow(Error);
    });
  });

  // ─── TEST 3: CardNumber.generate ─────────────────────────────────────────────
  describe('CardNumber (Value Object)', () => {
    it('genera un número de tarjeta con el formato correcto', () => {
      const card = CardNumber.generate('LIB');

      // MATCHER: toMatch con expresión regular
      expect(card.toString()).toMatch(/^[A-Z]{2,6}-\d{8}-[A-Z0-9]{4}$/);
      expect(card).toBeInstanceOf(CardNumber);
    });
  });

  // ─── TEST 4: Patron.assertCanBorrow – suspendido ─────────────────────────────
  describe('Patron (Aggregate Root) – reglas de negocio', () => {
    it('lanza PatronSuspendedError cuando el socio está suspendido', () => {
      const patron = buildPatron({ status: 'suspended' });

      expect(() => patron.assertCanBorrow()).toThrow(PatronSuspendedError);
      // MATCHER: toContain en el mensaje
      expect(() => patron.assertCanBorrow()).toThrow('suspended');
    });

    // ─── TEST 5: Patron.assertCanBorrow – multas pendientes ───────────────────
    it('lanza PatronHasPendingFinesError cuando hay multas pendientes', () => {
      const patron = buildPatron({ pendingFinesAmount: 15.5 });

      expect(() => patron.assertCanBorrow()).toThrow(PatronHasPendingFinesError);
      expect(() => patron.assertCanBorrow()).toThrow('15.50');
    });

    it('no lanza error cuando el socio está activo y sin multas', () => {
      const patron = buildPatron({ status: 'active', pendingFinesAmount: 0 });

      // MATCHER: not.toThrow
      expect(() => patron.assertCanBorrow()).not.toThrow();
      expect(patron.isActive).toBe(true);
    });

    it('suspend/activate/block/expire devuelven nuevas instancias con el estado correcto', () => {
      const patron = buildPatron({ status: 'active' });

      expect(patron.suspend().status).toBe('suspended');
      expect(patron.block().status).toBe('blocked');
      expect(patron.expire().status).toBe('expired');
      expect(patron.suspend().activate().status).toBe('active');
    });
  });

  // ─── TEST: CardNumber.create – formato válido ─────────────────────────────────
  describe('CardNumber.create – formato explícito', () => {
    it('crea un CardNumber desde cadena con formato válido', () => {
      const raw = 'LIB-20240101-A1B2';
      const card = CardNumber.create(raw);
      expect(card.toString()).toBe(raw);
      expect(card.equals(CardNumber.create(raw))).toBe(true);
    });

    it('lanza Error cuando el formato no cumple el patrón', () => {
      expect(() => CardNumber.create('invalido')).toThrow('Invalid card number format');
    });
  });

  // ─── TEST: Staff entity ───────────────────────────────────────────────────────
  describe('Staff (Entity)', () => {
    function buildStaff(role: 'administrator' | 'librarian' | 'assistant' = 'librarian'): Staff {
      return Staff.create({
        id: 'staff-001',
        libraryId: 'lib-001',
        fullName: 'Laura Gómez',
        email: Email.create('laura@biblioteca.es'),
        passwordHash: '$2b$12$abc',
        role,
        permissions: ['loans:read', 'loans:create'],
        isActive: true,
      });
    }

    it('retorna los props correctamente via getters', () => {
      const staff = buildStaff();
      expect(staff.id).toBe('staff-001');
      expect(staff.role).toBe('librarian');
      expect(staff.isActive).toBe(true);
      expect(staff.email.toString()).toBe('laura@biblioteca.es');
    });

    it('hasPermission retorna true para permiso asignado y siempre true para admin', () => {
      const librarian = buildStaff('librarian');
      const admin = buildStaff('administrator');

      expect(librarian.hasPermission('loans:read')).toBe(true);
      expect(librarian.hasPermission('catalog:delete')).toBe(false);
      expect(admin.hasPermission('cualquier-permiso')).toBe(true);
    });
  });

  // ─── TEST: PatronMapper.toDto ─────────────────────────────────────────────────
  describe('PatronMapper.toDto', () => {
    it('convierte un Patron a PatronDto con todos los campos requeridos', () => {
      const patron = buildPatron();
      const dto = PatronMapper.toDto(patron);

      expect(dto).toHaveProperty('id', 'patron-id-001');
      expect(dto).toHaveProperty('email', 'socio@test.com');
      expect(dto).toHaveProperty('status', 'active');
      expect(dto).toHaveProperty('pendingFinesTotal', 0);
      expect(typeof dto.registrationDate).toBe('string');
    });
  });

  // ─── TEST 6: RegisterPatronUseCase – prueba con promesa ──────────────────────
  describe('RegisterPatronUseCase (con mocks 1 y 2)', () => {
    let useCase: RegisterPatronUseCase;

    beforeEach(() => {
      useCase = new RegisterPatronUseCase(
        mockPatronRepository as any,
        mockEventPublisher as any,
      );
    });

    it('registra un socio y publica el evento de dominio (prueba con promesa)', async () => {
      // Configurar Mock 1: email y tarjeta disponibles, save retorna el patron
      mockPatronRepository.existsByEmail.mockResolvedValue(false);
      mockPatronRepository.existsByCardNumber.mockResolvedValue(false);
      mockPatronRepository.save.mockImplementation(async (p: Patron) => p);

      // Configurar Mock 2: publish no hace nada
      mockEventPublisher.publish.mockResolvedValue(undefined);

      const result = await useCase.execute({
        libraryId: 'lib-001',
        fullName: 'Carlos Pérez',
        email: 'carlos@test.com',
        password: 'Secure1Password',
        phone: '+34 600 111 222',
        address: 'Calle Mayor 1',
      });

      // MATCHER: toHaveProperty
      expect(result).toHaveProperty('email', 'carlos@test.com');
      expect(result).toHaveProperty('fullName', 'Carlos Pérez');
      expect(result).toHaveProperty('status', 'active');
      // MATCHER: toEqual parcial
      expect(result).toMatchObject({ libraryId: 'lib-001', pendingFinesTotal: 0 });

      // Verificar interacción con mocks
      expect(mockPatronRepository.existsByEmail).toHaveBeenCalledWith('carlos@test.com');
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1);
    });

    it('lanza EmailAlreadyRegisteredError si el email ya existe', async () => {
      mockPatronRepository.existsByEmail.mockResolvedValue(true);
      mockPatronRepository.existsByCardNumber.mockResolvedValue(false);

      // Prueba de promesa rechazada con rejects
      await expect(
        useCase.execute({
          libraryId: 'lib-001',
          fullName: 'Duplicado',
          email: 'duplicado@test.com',
          password: 'Secure1Password',
        }),
      ).rejects.toThrow(EmailAlreadyRegisteredError);

      // El publisher no debe haberse llamado
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });
  });
});
