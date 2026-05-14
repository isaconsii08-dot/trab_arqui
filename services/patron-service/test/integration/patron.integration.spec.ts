/**
 * Pruebas de Integración – patron-service
 *
 * Prueban la capa HTTP completa usando NestJS Testing + supertest.
 * Los repositorios e infraestructura externa se reemplazan por mocks
 * para aislar la lógica de aplicación y dominio.
 *
 * Mocks utilizados:
 *  1. mockPatronRepo  – sustituye IPatronRepository (Prisma)
 *  2. mockEventPub    – sustituye IEventPublisher (Redis)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const supertest = require('supertest') as (app: unknown) => unknown;
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { PatronController } from '../../src/presentation/controllers/patron.controller';
import { AuthController } from '../../src/presentation/controllers/auth.controller';
import { RegisterPatronUseCase } from '../../src/application/use-cases/register-patron.use-case';
import { AuthenticateUseCase } from '../../src/application/use-cases/authenticate.use-case';
import { PATRON_REPOSITORY } from '../../src/domain/repositories/patron.repository.interface';
import { STAFF_REPOSITORY } from '../../src/domain/repositories/staff.repository.interface';
import { EVENT_PUBLISHER } from '../../src/application/ports/event-publisher.interface';
import { JwtAuthGuard } from '../../src/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/presentation/guards/roles.guard';
import { DomainExceptionFilter } from '../../src/presentation/filters/domain-exception.filter';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { Email } from '../../src/domain/value-objects/email.vo';
import { CardNumber } from '../../src/domain/value-objects/card-number.vo';
import { Patron } from '../../src/domain/entities/patron.entity';
import { InvalidCredentialsError } from '@biblioflow/shared-errors';

// ─── Mock 1: IPatronRepository ────────────────────────────────────────────────
const mockPatronRepo = {
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
const mockEventPub = {
  publish: jest.fn().mockResolvedValue(undefined),
};

// ─── Mock: IStaffRepository ───────────────────────────────────────────────────
const mockStaffRepo = {
  findByEmail: jest.fn().mockResolvedValue(null),
  findById: jest.fn().mockResolvedValue(null),
};

// ─── Mock: PrismaService ─────────────────────────────────────────────────────
const mockPrisma = {
  fine: {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    updateMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

// ─── Helper: construir un Patron de prueba ────────────────────────────────────
function makePatron(overrides: Partial<{ id: string; email: string; status: string }> = {}): Patron {
  const email = Email.create(overrides.email ?? 'test@biblioteca.es');
  const card = CardNumber.generate('LIB');
  return Patron.create({
    id: overrides.id ?? 'patron-uuid-001',
    libraryId: 'lib-001',
    cardNumber: card,
    fullName: 'Test Socio',
    email,
    phone: null,
    address: null,
    passwordHash: '$2b$12$hashedvalue',
    registrationDate: new Date('2024-06-01'),
    status: (overrides.status as 'active' | 'suspended' | 'blocked' | 'expired') ?? 'active',
    pendingFinesAmount: 0,
  });
}

// =============================================================================
describe('Pruebas de Integración – patron-service (HTTP)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.example' }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [PatronController, AuthController],
      providers: [
        RegisterPatronUseCase,
        AuthenticateUseCase,
        { provide: PATRON_REPOSITORY, useValue: mockPatronRepo },
        { provide: STAFF_REPOSITORY, useValue: mockStaffRepo },
        { provide: EVENT_PUBLISHER, useValue: mockEventPub },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    })
      // Desactivar guards JWT y Roles para probar endpoints protegidos
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    jwtService = module.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventPub.publish.mockResolvedValue(undefined);
    mockStaffRepo.findByEmail.mockResolvedValue(null);
  });

  // ─── TEST 1: Registro exitoso de un nuevo socio ──────────────────────────────
  it('TEST 1 – POST /patrons registra un nuevo socio y retorna 201', async () => {
    mockPatronRepo.existsByEmail.mockResolvedValue(false);
    mockPatronRepo.existsByCardNumber.mockResolvedValue(false);
    mockPatronRepo.save.mockImplementation(async (p: Patron) => p);

    const res = await supertest(app.getHttpServer())
      .post('/patrons')
      .send({
        libraryId: 'lib-001',
        fullName: 'María Rodríguez',
        email: 'maria@test.com',
        password: 'Secure1Password',
        phone: '+34 600 000 001',
        address: 'Calle Luna 5',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('email', 'maria@test.com');
    expect(res.body).toHaveProperty('status', 'active');
    expect(res.body).toHaveProperty('cardNumber');
    expect(mockPatronRepo.save).toHaveBeenCalledTimes(1);
  });

  // ─── TEST 2: Registro con email duplicado retorna 409 ────────────────────────
  it('TEST 2 – POST /patrons retorna 409 cuando el email ya está registrado', async () => {
    mockPatronRepo.existsByEmail.mockResolvedValue(true);
    mockPatronRepo.existsByCardNumber.mockResolvedValue(false);

    const res = await supertest(app.getHttpServer())
      .post('/patrons')
      .send({
        libraryId: 'lib-001',
        fullName: 'Duplicado',
        email: 'duplicado@test.com',
        password: 'Secure1Password',
      });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('code', 'EMAIL_ALREADY_REGISTERED');
  });

  // ─── TEST 3: Listado de socios (staff autenticado) retorna 200 ───────────────
  it('TEST 3 – GET /patrons retorna lista paginada de socios', async () => {
    const patron = makePatron();
    mockPatronRepo.findAllByLibrary.mockResolvedValue({
      data: [patron],
      total: 1,
    });

    const res = await supertest(app.getHttpServer())
      .get('/patrons')
      .query({ libraryId: 'lib-001', page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body).toHaveProperty('total', 1);
  });

  // ─── TEST 4: Buscar socio por número de tarjeta ──────────────────────────────
  it('TEST 4 – GET /patrons/card/:cardNumber retorna el socio correspondiente', async () => {
    const patron = makePatron({ id: 'patron-card-test' });
    const cardStr = patron.cardNumber.toString();
    mockPatronRepo.findByCardNumber.mockResolvedValue(patron);

    const res = await supertest(app.getHttpServer())
      .get(`/patrons/card/${cardStr}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('cardNumber', cardStr);
    expect(res.body).toHaveProperty('id', 'patron-card-test');
  });

  // ─── TEST 5: Login inválido retorna 401 ──────────────────────────────────────
  it('TEST 5 – POST /auth/login retorna 401 con credenciales incorrectas', async () => {
    // Mock 1 (staffRepo): no existe staff con ese email
    mockStaffRepo.findByEmail.mockResolvedValue(null);
    // Mock 1 (patronRepo): no existe patrón con ese email
    mockPatronRepo.findByEmail.mockResolvedValue(null);

    const res = await supertest(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'inexistente@test.com', password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('code', 'INVALID_CREDENTIALS');
  });

  // ─── TEST EXTRA: GET /patrons/:id retorna vacío si no existe ────────────────
  it('TEST EXTRA – GET /patrons/:id retorna 200 vacío cuando el socio no existe', async () => {
    mockPatronRepo.findById.mockResolvedValue(null);

    const res = await supertest(app.getHttpServer()).get('/patrons/id-inexistente');

    // NestJS serializa `return null` como body vacío
    expect(res.status).toBe(200);
    expect(res.body == null || Object.keys(res.body).length === 0).toBe(true);
  });

  // ─── TEST EXTRA: PATCH /patrons/:id actualiza estado ─────────────────────────
  it('TEST EXTRA – PATCH /patrons/:id suspende al socio', async () => {
    const patron = makePatron({ id: 'patron-patch-001' });
    mockPatronRepo.findById.mockResolvedValue(patron);
    mockPatronRepo.save.mockImplementation(async (p: Patron) => p);

    const res = await supertest(app.getHttpServer())
      .patch('/patrons/patron-patch-001')
      .send({ status: 'suspended' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'patron-patch-001');
  });

  // ─── TEST EXTRA: GET /patrons/stats retorna estadísticas ─────────────────────
  it('TEST EXTRA – GET /patrons/stats retorna conteo de estados', async () => {
    const activo = makePatron({ status: 'active' });
    const suspendido = makePatron({ status: 'suspended' });
    mockPatronRepo.findAllByLibrary.mockResolvedValue({
      data: [activo, suspendido],
      total: 2,
    });

    const res = await supertest(app.getHttpServer()).get('/patrons/stats');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total', 2);
    expect(res.body).toHaveProperty('activos', 1);
    expect(res.body).toHaveProperty('suspendidos', 1);
  });

  // ─── TEST EXTRA: DELETE /patrons/:id elimina el socio ───────────────────────
  it('TEST EXTRA – DELETE /patrons/:id retorna 204 al eliminar socio', async () => {
    mockPatronRepo.delete.mockResolvedValue(undefined);

    const res = await supertest(app.getHttpServer()).delete('/patrons/patron-to-delete');

    expect(res.status).toBe(204);
    expect(mockPatronRepo.delete).toHaveBeenCalledWith('patron-to-delete');
  });

  // ─── TEST 6: Login válido como patrón retorna token ──────────────────────────
  it('TEST 6 – POST /auth/login retorna accessToken para socio válido', async () => {
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('Secure1Password', 10);
    const patron = makePatron({ email: 'valido@test.com' });
    // Sobrescribir passwordHash en el patron (creamos uno nuevo)
    const patronConHash = Patron.create({
      id: patron.id,
      libraryId: patron.libraryId,
      cardNumber: patron.cardNumber,
      fullName: patron.fullName,
      email: patron.email,
      phone: null,
      address: null,
      passwordHash: hash,
      registrationDate: patron.registrationDate,
      status: 'active',
      pendingFinesAmount: 0,
    });

    mockStaffRepo.findByEmail.mockResolvedValue(null);
    mockPatronRepo.findByEmail.mockResolvedValue(patronConHash);

    const res = await supertest(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'valido@test.com', password: 'Secure1Password' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(typeof res.body.accessToken).toBe('string');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('role', 'patron');
  });
});
