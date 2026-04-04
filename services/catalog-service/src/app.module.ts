import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { PrismaCatalogRepository } from './infrastructure/persistence/prisma-catalog.repository';
import { NoopSearchEngine } from './infrastructure/search/noop-search-engine';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { SearchCatalogUseCase } from './application/use-cases/search-catalog.use-case';
import { GetRecordUseCase } from './application/use-cases/get-record.use-case';
import { CatalogController } from './presentation/controllers/catalog.controller';
import { CATALOG_REPOSITORY } from './domain/repositories/catalog.repository.interface';
import { SEARCH_ENGINE } from './application/ports/search-engine.interface';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env['JWT_SECRET'] ?? 'default_secret',
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [CatalogController],
  providers: [
    PrismaService,
    JwtStrategy,
    { provide: CATALOG_REPOSITORY, useClass: PrismaCatalogRepository },
    { provide: SEARCH_ENGINE, useClass: NoopSearchEngine },
    // Use-cases need injected tokens
    {
      provide: SearchCatalogUseCase,
      useFactory: (repo: PrismaCatalogRepository, engine: NoopSearchEngine) =>
        new SearchCatalogUseCase(repo, engine),
      inject: [{ token: CATALOG_REPOSITORY, optional: false }, { token: SEARCH_ENGINE, optional: false }],
    },
    {
      provide: GetRecordUseCase,
      useFactory: (repo: PrismaCatalogRepository) => new GetRecordUseCase(repo),
      inject: [{ token: CATALOG_REPOSITORY, optional: false }],
    },
  ],
})
export class AppModule {}
