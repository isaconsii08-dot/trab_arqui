import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Librarian2026!', 10);

  // Cuenta de servicio que usa la intranet del staff
  await prisma.staff.upsert({
    where: { email: 'herrera@biblioflow.edu.co' },
    update: {},
    create: {
      libraryId: 'lib-001',
      fullName: 'Admin Herrera',
      email: 'herrera@biblioflow.edu.co',
      passwordHash: hash,
      role: 'administrator',
      isActive: true,
    },
  });

  console.log('Seed completado: cuenta de servicio lista.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
