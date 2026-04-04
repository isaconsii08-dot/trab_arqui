/**
 * Script de datos iniciales para BiblioFlow
 * Pobla todas las bases de datos con información real para demostración
 */

import { PrismaClient as PatronPrisma } from '../services/patron-service/src/generated/prisma';
import { PrismaClient as CatalogPrisma } from '../services/catalog-service/src/generated/prisma';
import { PrismaClient as CirculationPrisma } from '../services/circulation-service/src/generated/prisma';
import * as bcrypt from 'bcrypt';

const patronDb = new PatronPrisma({
  datasources: { db: { url: 'postgresql://patron_user:patron_secret@localhost:5432/patron_db' } },
});

const catalogDb = new CatalogPrisma({
  datasources: { db: { url: 'postgresql://catalog_user:catalog_secret@localhost:5433/catalog_db' } },
});

const circulationDb = new CirculationPrisma({
  datasources: { db: { url: 'postgresql://circulation_user:circulation_secret@localhost:5435/circulation_db' } },
});

// ─── Datos de libros reales ──────────────────────────────────────────────────

const LIBROS = [
  {
    id: 'rec-001',
    title: 'Cien años de soledad',
    isbn: '9780307474728',
    publicationYear: 1967,
    publisher: 'Editorial Sudamericana',
    summary: 'La historia de la familia Buendía a lo largo de siete generaciones en el pueblo mítico de Macondo. Obra cumbre del realismo mágico latinoamericano.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780307474728-L.jpg',
    authors: [{ name: 'Gabriel García Márquez', role: 'author' }],
    subjects: ['Realismo mágico', 'Literatura colombiana', 'Novela'],
    copies: 4,
    location: 'Sala General',
    callNumber: 'CO GAR c',
  },
  {
    id: 'rec-002',
    title: 'El nombre de la rosa',
    isbn: '9780156001311',
    publicationYear: 1980,
    publisher: 'Lumen',
    summary: 'Una novela policial ambientada en una abadía benedictina italiana en el siglo XIV, donde un monje franciscano investiga una serie de misteriosas muertes.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780156001311-L.jpg',
    authors: [{ name: 'Umberto Eco', role: 'author' }],
    subjects: ['Novela histórica', 'Misterio', 'Edad Media'],
    copies: 2,
    location: 'Sala General',
    callNumber: 'IT ECO n',
  },
  {
    id: 'rec-003',
    title: 'Sapiens: De animales a dioses',
    isbn: '9780062316097',
    publicationYear: 2011,
    publisher: 'Debate',
    summary: 'Un recorrido por la historia de la humanidad desde los primeros humanos hasta la era moderna, explorando cómo Homo sapiens llegó a dominar el planeta.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg',
    authors: [{ name: 'Yuval Noah Harari', role: 'author' }],
    subjects: ['Historia', 'Antropología', 'Evolución humana'],
    copies: 3,
    location: 'Sala de Ciencias',
    callNumber: 'HIS HAR s',
  },
  {
    id: 'rec-004',
    title: 'La casa de los espíritus',
    isbn: '9780553383805',
    publicationYear: 1982,
    publisher: 'Plaza & Janés',
    summary: 'La saga de la familia Trueba a través de cuatro generaciones en un país latinoamericano, mezclando lo político con lo mágico.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780553383805-L.jpg',
    authors: [{ name: 'Isabel Allende', role: 'author' }],
    subjects: ['Literatura latinoamericana', 'Realismo mágico', 'Política'],
    copies: 3,
    location: 'Sala General',
    callNumber: 'CL ALL c',
  },
  {
    id: 'rec-005',
    title: 'Ficciones',
    isbn: '9780802130303',
    publicationYear: 1944,
    publisher: 'Sur',
    summary: 'Una colección de cuentos que exploran laberintos, espejos, enciclopedias y la naturaleza misma de la ficción y la realidad.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780802130303-L.jpg',
    authors: [{ name: 'Jorge Luis Borges', role: 'author' }],
    subjects: ['Cuento', 'Literatura argentina', 'Fantástico'],
    copies: 2,
    location: 'Sala General',
    callNumber: 'AR BOR f',
  },
  {
    id: 'rec-006',
    title: 'El amor en los tiempos del cólera',
    isbn: '9780307389732',
    publicationYear: 1985,
    publisher: 'Oveja Negra',
    summary: 'Una historia de amor que dura más de cincuenta años, ambientada en una ciudad portuaria del Caribe colombiano.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780307389732-L.jpg',
    authors: [{ name: 'Gabriel García Márquez', role: 'author' }],
    subjects: ['Novela', 'Literatura colombiana', 'Amor'],
    copies: 3,
    location: 'Sala General',
    callNumber: 'CO GAR a',
  },
  {
    id: 'rec-007',
    title: 'Pedro Páramo',
    isbn: '9780802133908',
    publicationYear: 1955,
    publisher: 'Fondo de Cultura Económica',
    summary: 'Un hombre viaja a Comala en busca de su padre y encuentra solo voces de muertos. Obra fundamental de la literatura mexicana.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780802133908-L.jpg',
    authors: [{ name: 'Juan Rulfo', role: 'author' }],
    subjects: ['Novela', 'Literatura mexicana', 'Realismo mágico'],
    copies: 2,
    location: 'Sala General',
    callNumber: 'MX RUL p',
  },
  {
    id: 'rec-008',
    title: '1984',
    isbn: '9780451524935',
    publicationYear: 1949,
    publisher: 'Secker & Warburg',
    summary: 'Una distopía totalitaria donde el Gran Hermano todo lo ve. Obra icónica de la literatura política del siglo XX.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg',
    authors: [{ name: 'George Orwell', role: 'author' }],
    subjects: ['Distopía', 'Ciencia ficción', 'Política'],
    copies: 4,
    location: 'Sala General',
    callNumber: 'UK ORW n',
  },
  {
    id: 'rec-009',
    title: 'Rayuela',
    isbn: '9788437604572',
    publicationYear: 1963,
    publisher: 'Sudamericana',
    summary: 'Una novela que puede leerse en orden convencional o saltando entre capítulos siguiendo las instrucciones del autor. La antinovela por excelencia.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9788437604572-L.jpg',
    authors: [{ name: 'Julio Cortázar', role: 'author' }],
    subjects: ['Literatura argentina', 'Novela experimental', 'París'],
    copies: 2,
    location: 'Sala General',
    callNumber: 'AR COR r',
  },
  {
    id: 'rec-010',
    title: 'El Aleph',
    isbn: '9788437604978',
    publicationYear: 1949,
    publisher: 'Losada',
    summary: 'Cuentos que incluyen el famoso relato del Aleph, un punto del espacio que contiene todos los puntos, y otras exploraciones de lo infinito.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9788437604978-L.jpg',
    authors: [{ name: 'Jorge Luis Borges', role: 'author' }],
    subjects: ['Cuento', 'Literatura argentina', 'Metaficción'],
    copies: 2,
    location: 'Sala General',
    callNumber: 'AR BOR a',
  },
  {
    id: 'rec-011',
    title: 'Crimen y castigo',
    isbn: '9780140449136',
    publicationYear: 1866,
    publisher: 'El Mensajero de la Europa',
    summary: 'Un estudiante de San Petersburgo comete un crimen y lucha con su conciencia. Una profunda exploración de la psicología humana.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780140449136-L.jpg',
    authors: [{ name: 'Fiódor Dostoyevski', role: 'author' }],
    subjects: ['Novela rusa', 'Psicología', 'Siglo XIX'],
    copies: 3,
    location: 'Sala de Literatura',
    callNumber: 'RU DOS c',
  },
  {
    id: 'rec-012',
    title: 'El principito',
    isbn: '9780156012195',
    publicationYear: 1943,
    publisher: 'Reynal & Hitchcock',
    summary: 'Un aviador varado en el Sahara conoce a un pequeño príncipe llegado de un asteroide. Una fábula filosófica sobre la infancia y la vida adulta.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg',
    authors: [{ name: 'Antoine de Saint-Exupéry', role: 'author' }],
    subjects: ['Fábula', 'Literatura francesa', 'Filosofía'],
    copies: 5,
    location: 'Sala Infantil',
    callNumber: 'FR SAI p',
  },
  {
    id: 'rec-013',
    title: 'Don Quijote de la Mancha',
    isbn: '9788424117528',
    publicationYear: 1605,
    publisher: 'Francisco de Robles',
    summary: 'Las aventuras del ingenioso hidalgo Don Quijote y su fiel escudero Sancho Panza. La primera novela moderna de la literatura occidental.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9788424117528-L.jpg',
    authors: [{ name: 'Miguel de Cervantes', role: 'author' }],
    subjects: ['Clásico español', 'Novela', 'Siglo de Oro'],
    copies: 3,
    location: 'Sala de Literatura',
    callNumber: 'ES CER d',
  },
  {
    id: 'rec-014',
    title: 'Breve historia del tiempo',
    isbn: '9780553175196',
    publicationYear: 1988,
    publisher: 'Bantam Books',
    summary: 'Una exploración accesible del universo, el tiempo, los agujeros negros y la naturaleza del cosmos, escrita por el famoso físico teórico.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9780553175196-L.jpg',
    authors: [{ name: 'Stephen Hawking', role: 'author' }],
    subjects: ['Física', 'Cosmología', 'Ciencia popular'],
    copies: 3,
    location: 'Sala de Ciencias',
    callNumber: 'FIS HAW b',
  },
  {
    id: 'rec-015',
    title: 'El túnel',
    isbn: '9788432250071',
    publicationYear: 1948,
    publisher: 'Sur',
    summary: 'Un pintor obsesionado narra el crimen que cometió. Un análisis agudo de la soledad y la incomunicación humana.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9788432250071-L.jpg',
    authors: [{ name: 'Ernesto Sábato', role: 'author' }],
    subjects: ['Literatura argentina', 'Novela psicológica', 'Existencialismo'],
    copies: 2,
    location: 'Sala General',
    callNumber: 'AR SAB t',
  },
  {
    id: 'rec-016',
    title: 'La vorágine',
    isbn: '9789583002045',
    publicationYear: 1924,
    publisher: 'Cromos',
    summary: 'Un poeta colombiano huye con su amante a los Llanos Orientales y luego a la selva amazónica. Obra fundamental de la literatura colombiana.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9789583002045-L.jpg',
    authors: [{ name: 'José Eustasio Rivera', role: 'author' }],
    subjects: ['Literatura colombiana', 'Novela', 'Selva amazónica'],
    copies: 2,
    location: 'Sala General',
    callNumber: 'CO RIV v',
  },
  {
    id: 'rec-017',
    title: 'Introducción al cálculo diferencial e integral',
    isbn: '9789701060131',
    publicationYear: 2007,
    publisher: 'McGraw-Hill',
    summary: 'Texto universitario fundamental que cubre límites, derivadas e integrales con ejemplos aplicados a ingeniería y ciencias.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9789701060131-L.jpg',
    authors: [{ name: 'Larson, Ron', role: 'author' }, { name: 'Hostetler, Robert P.', role: 'coauthor' }],
    subjects: ['Matemáticas', 'Cálculo', 'Ingeniería'],
    copies: 6,
    location: 'Sala de Ciencias',
    callNumber: 'MAT LAR c',
  },
  {
    id: 'rec-018',
    title: 'Fundamentos de programación',
    isbn: '9788497323796',
    publicationYear: 2010,
    publisher: 'Paraninfo',
    summary: 'Introducción a los conceptos básicos de la programación estructurada y orientada a objetos, con ejercicios prácticos.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9788497323796-L.jpg',
    authors: [{ name: 'Joyanes Aguilar, Luis', role: 'author' }],
    subjects: ['Informática', 'Programación', 'Algoritmos'],
    copies: 5,
    location: 'Sala de Tecnología',
    callNumber: 'INF JOY f',
  },
  {
    id: 'rec-019',
    title: 'Derecho constitucional colombiano',
    isbn: '9789587495645',
    publicationYear: 2017,
    publisher: 'Universidad Externado',
    summary: 'Análisis sistemático de la Constitución Política de Colombia de 1991, sus principios fundamentales y jurisprudencia de la Corte Constitucional.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9789587495645-L.jpg',
    authors: [{ name: 'Naranjo Mesa, Vladimiro', role: 'author' }],
    subjects: ['Derecho', 'Derecho constitucional', 'Colombia'],
    copies: 4,
    location: 'Sala de Derecho',
    callNumber: 'DER NAR d',
  },
  {
    id: 'rec-020',
    title: 'Administración: una perspectiva global',
    isbn: '9786071505972',
    publicationYear: 2012,
    publisher: 'McGraw-Hill',
    summary: 'Texto de referencia en administración de empresas que abarca planeación, organización, dirección y control con casos prácticos globales.',
    materialType: 'book' as const,
    language: 'es',
    coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9786071505972-L.jpg',
    authors: [{ name: 'Koontz, Harold', role: 'author' }, { name: 'Weihrich, Heinz', role: 'coauthor' }],
    subjects: ['Administración', 'Gestión empresarial', 'Liderazgo'],
    copies: 5,
    location: 'Sala de Ciencias Económicas',
    callNumber: 'ADM KOO a',
  },
];

// ─── Personal de la biblioteca ───────────────────────────────────────────────

const STAFF = [
  {
    id: 'staff-001',
    libraryId: 'lib-001',
    fullName: 'Catalina Ospina Ramírez',
    email: 'admin@biblioflow.edu.co',
    password: 'Admin2026!',
    role: 'administrator' as const,
    permissions: ['read', 'write', 'delete', 'manage_users'],
  },
  {
    id: 'staff-002',
    libraryId: 'lib-001',
    fullName: 'Andrés Felipe Herrera',
    email: 'herrera@biblioflow.edu.co',
    password: 'Librarian2026!',
    role: 'librarian' as const,
    permissions: ['read', 'write', 'circulation'],
  },
  {
    id: 'staff-003',
    libraryId: 'lib-001',
    fullName: 'María Fernanda Ríos',
    email: 'mrios@biblioflow.edu.co',
    password: 'Assistant2026!',
    role: 'assistant' as const,
    permissions: ['read', 'circulation'],
  },
];

// ─── Socios de la biblioteca ─────────────────────────────────────────────────

const PATRONS = [
  { id: 'pat-001', fullName: 'Santiago Gómez Vargas', email: 'sgomez@ucc.edu.co', phone: '3001234567', program: 'Ingeniería de Sistemas', status: 'active' as const },
  { id: 'pat-002', fullName: 'Valentina Torres Mejía', email: 'vtorres@ucc.edu.co', phone: '3109876543', program: 'Derecho', status: 'active' as const },
  { id: 'pat-003', fullName: 'Camilo Andrade Pardo', email: 'candrade@ucc.edu.co', phone: '3204567890', program: 'Administración de Empresas', status: 'active' as const },
  { id: 'pat-004', fullName: 'Laura Marcela Jiménez', email: 'ljimenez@ucc.edu.co', phone: '3151112233', program: 'Literatura', status: 'active' as const },
  { id: 'pat-005', fullName: 'David Reyes Cárdenas', email: 'dreyes@ucc.edu.co', phone: '3013456789', program: 'Ingeniería Civil', status: 'suspended' as const },
  { id: 'pat-006', fullName: 'Isabella Moreno Salcedo', email: 'imoreno@ucc.edu.co', phone: '3187654321', program: 'Psicología', status: 'active' as const },
  { id: 'pat-007', fullName: 'Felipe Castillo Rueda', email: 'fcastillo@ucc.edu.co', phone: '3002345678', program: 'Medicina', status: 'active' as const },
  { id: 'pat-008', fullName: 'Daniela Peña Cifuentes', email: 'dpena@ucc.edu.co', phone: '3118765432', program: 'Contaduría Pública', status: 'active' as const },
  { id: 'pat-009', fullName: 'Sebastián Rojas Molina', email: 'srojas@ucc.edu.co', phone: '3204321098', program: 'Filosofía', status: 'expired' as const },
  { id: 'pat-010', fullName: 'Natalia Bermúdez López', email: 'nbermudez@ucc.edu.co', phone: '3056789012', program: 'Diseño Gráfico', status: 'active' as const },
  { id: 'pat-011', fullName: 'Juan Carlos Medina', email: 'jmedina@ucc.edu.co', phone: '3143210987', program: 'Economía', status: 'active' as const },
  { id: 'pat-012', fullName: 'Mariana Ossa Betancur', email: 'nossa@ucc.edu.co', phone: '3179876543', program: 'Trabajo Social', status: 'active' as const },
];

function generarCarnet(libraryId: string, index: number): string {
  const hoy = new Date();
  const fecha = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`;
  const sufijo = String(index).padStart(4, '0');
  return `${libraryId.slice(0, 3).toUpperCase()}-${fecha}-${sufijo}`;
}

function diasAtras(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function diasAdelante(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function limpiarDatos() {
  console.log('Limpiando datos existentes...');
  await circulationDb.fine.deleteMany();
  await circulationDb.loan.deleteMany();
  await patronDb.fine.deleteMany();
  await patronDb.auditLog.deleteMany();
  await patronDb.patron.deleteMany();
  await patronDb.staff.deleteMany();
  await catalogDb.recordSubject.deleteMany();
  await catalogDb.recordAuthor.deleteMany();
  await catalogDb.subject.deleteMany();
  await catalogDb.author.deleteMany();
  await catalogDb.bibliographicRecord.deleteMany();
}

async function crearCatalogo() {
  console.log('Creando registros bibliográficos...');

  for (const libro of LIBROS) {
    // Crear o encontrar autores
    const autoresCreados: Array<{ id: string; name: string; role: string }> = [];
    for (const a of libro.authors) {
      const autor = await catalogDb.author.upsert({
        where: { authorityId: `auth-${a.name.toLowerCase().replace(/\s+/g, '-')}` },
        update: {},
        create: {
          name: a.name,
          authorityId: `auth-${a.name.toLowerCase().replace(/\s+/g, '-')}`,
        },
      });
      autoresCreados.push({ id: autor.id, name: a.name, role: a.role });
    }

    // Crear materias
    const materiasCreadas: Array<{ id: string }> = [];
    for (const s of libro.subjects) {
      const materia = await catalogDb.subject.upsert({
        where: { authorityId: `sub-${s.toLowerCase().replace(/\s+/g, '-')}` },
        update: {},
        create: {
          term: s,
          authorityId: `sub-${s.toLowerCase().replace(/\s+/g, '-')}`,
        },
      });
      materiasCreadas.push({ id: materia.id });
    }

    // Crear registro bibliográfico
    await catalogDb.bibliographicRecord.upsert({
      where: { id: libro.id },
      update: {},
      create: {
        id: libro.id,
        title: libro.title,
        isbn: libro.isbn,
        publicationYear: libro.publicationYear,
        publisher: libro.publisher,
        summary: libro.summary,
        coverImageUrl: libro.coverImageUrl,
        materialType: libro.materialType,
        libraryId: 'lib-001',
        recordAuthors: {
          create: autoresCreados.map((a) => ({ authorId: a.id, role: a.role })),
        },
        recordSubjects: {
          create: materiasCreadas.map((m) => ({ subjectId: m.id })),
        },
      },
    });
  }

  console.log(`  → ${LIBROS.length} registros bibliográficos creados`);
}

async function crearEjemplares() {
  console.log('Creando ejemplares en holdings...');

  // Limpiar primero
  const holdingsDb = new (require('../services/holdings-service/src/generated/prisma').PrismaClient)({
    datasources: { db: { url: 'postgresql://holdings_user:holdings_secret@localhost:5434/holdings_db' } },
  });

  await holdingsDb.item.deleteMany();

  let totalEjemplares = 0;
  for (const libro of LIBROS) {
    for (let i = 1; i <= libro.copies; i++) {
      const barcode = `${libro.id.replace('rec-', 'EJ')}-${String(i).padStart(2, '0')}`;
      await holdingsDb.item.create({
        data: {
          barcode,
          recordId: libro.id,
          libraryId: 'lib-001',
          location: libro.location,
          callNumber: libro.callNumber,
          status: 'available',
        },
      });
      totalEjemplares++;
    }
  }

  await holdingsDb.$disconnect();
  console.log(`  → ${totalEjemplares} ejemplares creados`);

  return LIBROS.flatMap((l) =>
    Array.from({ length: l.copies }, (_, i) => ({
      barcode: `${l.id.replace('rec-', 'EJ')}-${String(i + 1).padStart(2, '0')}`,
      recordId: l.id,
    }))
  );
}

async function crearPersonal() {
  console.log('Creando personal de biblioteca...');
  for (const s of STAFF) {
    const hash = await bcrypt.hash(s.password, 10);
    await patronDb.staff.upsert({
      where: { id: s.id },
      update: { passwordHash: hash },
      create: {
        id: s.id,
        libraryId: s.libraryId,
        fullName: s.fullName,
        email: s.email,
        passwordHash: hash,
        role: s.role,
        permissions: s.permissions,
        isActive: true,
      },
    });
  }
  console.log(`  → ${STAFF.length} miembros del personal creados`);
}

async function crearSocios(): Promise<Array<{ id: string; cardNumber: string }>> {
  console.log('Creando socios...');
  const password = await bcrypt.hash('Socio2026!', 10);
  const resultado: Array<{ id: string; cardNumber: string }> = [];

  for (let i = 0; i < PATRONS.length; i++) {
    const p = PATRONS[i]!;
    const cardNumber = generarCarnet('lib', i + 1);
    await patronDb.patron.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        libraryId: 'lib-001',
        cardNumber,
        fullName: p.fullName,
        email: p.email,
        phone: p.phone,
        address: `Calle ${(i + 1) * 5} # ${(i + 1) * 3}-${(i + 1) * 7}, Bogotá`,
        passwordHash: password,
        status: p.status,
      },
    });
    resultado.push({ id: p.id, cardNumber });
  }

  console.log(`  → ${PATRONS.length} socios creados`);
  return resultado;
}

async function crearPrestamos(ejemplares: Array<{ barcode: string; recordId: string }>) {
  console.log('Creando préstamos históricos y activos...');

  // Préstamos activos (libros actualmente prestados)
  const prestamosActivos = [
    { patronId: 'pat-001', barcode: 'EJ001-01', diasDesde: 5, diasVence: 16 },
    { patronId: 'pat-001', barcode: 'EJ003-01', diasDesde: 3, diasVence: 18 },
    { patronId: 'pat-002', barcode: 'EJ008-01', diasDesde: 10, diasVence: 11 },
    { patronId: 'pat-003', barcode: 'EJ017-01', diasDesde: 7, diasVence: 14 },
    { patronId: 'pat-004', barcode: 'EJ005-01', diasDesde: 12, diasVence: 9 },
    { patronId: 'pat-006', barcode: 'EJ012-01', diasDesde: 1, diasVence: 20 },
    { patronId: 'pat-007', barcode: 'EJ014-01', diasDesde: 4, diasVence: 17 },
    { patronId: 'pat-008', barcode: 'EJ020-01', diasDesde: 6, diasVence: 15 },
    { patronId: 'pat-010', barcode: 'EJ016-01', diasDesde: 2, diasVence: 19 },
    { patronId: 'pat-011', barcode: 'EJ019-01', diasDesde: 8, diasVence: 13 },
  ];

  // Préstamos vencidos
  const prestamosVencidos = [
    { patronId: 'pat-004', barcode: 'EJ009-01', diasDesde: 30, diasVence: -9 },
    { patronId: 'pat-007', barcode: 'EJ011-01', diasDesde: 25, diasVence: -4 },
    { patronId: 'pat-012', barcode: 'EJ006-01', diasDesde: 28, diasVence: -7 },
  ];

  // Préstamos históricos devueltos
  const prestamosDevueltos = [
    { patronId: 'pat-001', barcode: 'EJ002-01', diasDesde: 45, diasDevuelto: 30 },
    { patronId: 'pat-002', barcode: 'EJ004-01', diasDesde: 40, diasDevuelto: 25 },
    { patronId: 'pat-003', barcode: 'EJ006-02', diasDesde: 35, diasDevuelto: 20 },
    { patronId: 'pat-004', barcode: 'EJ013-01', diasDesde: 50, diasDevuelto: 35 },
    { patronId: 'pat-005', barcode: 'EJ008-02', diasDesde: 60, diasDevuelto: 45 },
    { patronId: 'pat-006', barcode: 'EJ015-01', diasDesde: 38, diasDevuelto: 22 },
    { patronId: 'pat-007', barcode: 'EJ007-01', diasDesde: 42, diasDevuelto: 28 },
    { patronId: 'pat-008', barcode: 'EJ018-01', diasDesde: 55, diasDevuelto: 40 },
    { patronId: 'pat-010', barcode: 'EJ010-01', diasDesde: 33, diasDevuelto: 18 },
    { patronId: 'pat-011', barcode: 'EJ004-02', diasDesde: 20, diasDevuelto: 8 },
    { patronId: 'pat-012', barcode: 'EJ003-02', diasDesde: 15, diasDevuelto: 5 },
  ];

  // Actualizar status de ejemplares prestados activamente
  const holdingsDb = new (require('../services/holdings-service/src/generated/prisma').PrismaClient)({
    datasources: { db: { url: 'postgresql://holdings_user:holdings_secret@localhost:5434/holdings_db' } },
  });

  let contador = 1;

  for (const p of [...prestamosActivos, ...prestamosVencidos]) {
    const esVencido = prestamosVencidos.includes(p as typeof prestamosVencidos[0]);
    const fechaPrestamo = diasAtras(p.diasDesde);
    const fechaVencimiento = diasAdelante(p.diasVence);
    const estado = esVencido ? 'overdue' : 'active';

    await circulationDb.loan.create({
      data: {
        id: `loan-act-${String(contador).padStart(3, '0')}`,
        itemId: p.barcode,
        patronId: p.patronId,
        libraryId: 'lib-001',
        staffId: 'staff-002',
        loanDate: fechaPrestamo,
        dueDate: fechaVencimiento,
        status: estado,
        renewedCount: 0,
      },
    });

    // Marcar el ejemplar como prestado
    try {
      await holdingsDb.item.update({
        where: { barcode: p.barcode },
        data: { status: 'loaned' },
      });
    } catch {
      // El ejemplar puede no existir en la seed, lo ignoramos
    }

    // Multa para préstamos vencidos
    if (esVencido) {
      const diasVencido = Math.abs((p as typeof prestamosVencidos[0]).diasVence);
      const montoMulta = diasVencido * 0.5;
      await circulationDb.fine.create({
        data: {
          loanId: `loan-act-${String(contador).padStart(3, '0')}`,
          patronId: p.patronId,
          amount: montoMulta,
          reason: `Devolución con ${diasVencido} días de retraso`,
          isPaid: false,
        },
      });
    }

    contador++;
  }

  for (const p of prestamosDevueltos) {
    const fechaPrestamo = diasAtras(p.diasDesde);
    const fechaDevolucion = diasAtras(p.diasDevuelto);
    const vencimiento = new Date(fechaPrestamo);
    vencimiento.setDate(vencimiento.getDate() + 21);

    await circulationDb.loan.create({
      data: {
        id: `loan-ret-${String(contador).padStart(3, '0')}`,
        itemId: p.barcode,
        patronId: p.patronId,
        libraryId: 'lib-001',
        staffId: 'staff-002',
        loanDate: fechaPrestamo,
        dueDate: vencimiento,
        returnDate: fechaDevolucion,
        status: 'returned',
        renewedCount: 0,
      },
    });
    contador++;
  }

  await holdingsDb.$disconnect();
  console.log(`  → ${contador - 1} préstamos creados (${prestamosActivos.length} activos, ${prestamosVencidos.length} vencidos, ${prestamosDevueltos.length} devueltos)`);
}

async function main() {
  console.log('\n BiblioFlow – Script de datos iniciales\n');

  try {
    await limpiarDatos();
    await crearCatalogo();
    const ejemplares = await crearEjemplares();
    await crearPersonal();
    await crearSocios();
    await crearPrestamos(ejemplares);

    console.log('\n Datos iniciales cargados correctamente');
    console.log('\n Credenciales de acceso:');
    console.log('  Administrador: admin@biblioflow.edu.co / Admin2026!');
    console.log('  Bibliotecario: herrera@biblioflow.edu.co / Librarian2026!');
    console.log('  Asistente:     mrios@biblioflow.edu.co / Assistant2026!');
    console.log('  Socios:        [email]@ucc.edu.co / Socio2026!');
  } catch (err) {
    console.error('Error en seed:', err);
    process.exit(1);
  } finally {
    await patronDb.$disconnect();
    await catalogDb.$disconnect();
    await circulationDb.$disconnect();
  }
}

main();
