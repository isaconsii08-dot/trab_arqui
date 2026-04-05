import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { SearchCatalogUseCase } from '../../application/use-cases/search-catalog.use-case';
import { GetRecordUseCase } from '../../application/use-cases/get-record.use-case';
import { CreateRecordDto } from '../dtos/create-record.dto';
import { SearchFilters } from '@biblioflow/shared-types';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Public } from '../decorators/public.decorator';
import { ICatalogRepository, CATALOG_REPOSITORY } from '../../domain/repositories/catalog.repository.interface';
import { BibliographicRecord } from '../../domain/entities/bibliographic-record.entity';
import { RecordMapper } from '../../application/mappers/record.mapper';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly searchCatalog: SearchCatalogUseCase,
    private readonly getRecord: GetRecordUseCase,
    @Inject(CATALOG_REPOSITORY) private readonly catalogRepo: ICatalogRepository,
  ) {}

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Buscar en el catálogo bibliográfico (público)' })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'author', required: false })
  @ApiQuery({ name: 'subject', required: false })
  @ApiQuery({ name: 'yearFrom', required: false, type: Number })
  @ApiQuery({ name: 'yearTo', required: false, type: Number })
  @ApiQuery({ name: 'materialType', required: false })
  @ApiQuery({ name: 'available', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(@Query() filters: SearchFilters) {
    return this.searchCatalog.execute(filters);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener detalles de un registro (público)' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  async getOne(@Param('id') id: string) {
    return this.getRecord.execute(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'librarian')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo registro bibliográfico (personal)' })
  async create(@Body() dto: CreateRecordDto) {
    const id = `rec-${randomUUID().slice(0, 8)}`;
    const record = BibliographicRecord.create({
      id,
      title: dto.title,
      uniformTitle: dto.uniformTitle ?? null,
      edition: dto.edition ?? null,
      publicationYear: dto.publicationYear ?? null,
      publisher: dto.publisher ?? null,
      isbn: dto.isbn ?? null,
      issn: dto.issn ?? null,
      summary: dto.summary ?? null,
      coverImageUrl: dto.coverImageUrl ?? null,
      materialType: dto.materialType as any,
      libraryId: dto.libraryId,
      authors: [],
      subjects: [],
    });

    const authors = (dto.authors ?? []).map((a) => ({
      name: a.name,
      dates: a.dates ?? null,
      role: a.role ?? 'author',
    }));
    const subjectTerms = (dto.subjects ?? []) as string[];

    const saved = await this.catalogRepo.saveWithRelations(record, authors, subjectTerms);
    return RecordMapper.toDto(saved);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'librarian')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un registro bibliográfico (personal)' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateRecordDto>) {
    const existing = await this.catalogRepo.findById(id);
    if (!existing) throw new NotFoundException('Registro no encontrado');

    const updated = existing.update({
      title: dto.title ?? existing.title,
      uniformTitle: dto.uniformTitle !== undefined ? (dto.uniformTitle ?? null) : existing.uniformTitle,
      edition: dto.edition !== undefined ? (dto.edition ?? null) : existing.edition,
      publicationYear: dto.publicationYear !== undefined ? (dto.publicationYear ?? null) : existing.publicationYear,
      publisher: dto.publisher !== undefined ? (dto.publisher ?? null) : existing.publisher,
      isbn: dto.isbn !== undefined ? (dto.isbn ?? null) : existing.isbn,
      issn: dto.issn !== undefined ? (dto.issn ?? null) : existing.issn,
      summary: dto.summary !== undefined ? (dto.summary ?? null) : existing.summary,
      coverImageUrl: dto.coverImageUrl !== undefined ? (dto.coverImageUrl ?? null) : existing.coverImageUrl,
      materialType: (dto.materialType as any) ?? existing.materialType,
    });

    // Solo reemplazar autores/materias si vienen en el body
    const authors = dto.authors !== undefined
      ? dto.authors.map((a) => ({ name: a.name, dates: a.dates ?? null, role: a.role ?? 'author' }))
      : existing.authors.map((a) => ({ name: a.name, dates: a.dates ?? null, role: a.role }));

    const subjectTerms = dto.subjects !== undefined
      ? (dto.subjects as string[])
      : existing.subjects.map((s) => s.term);

    const saved = await this.catalogRepo.saveWithRelations(updated, authors, subjectTerms);
    return RecordMapper.toDto(saved);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'librarian')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un registro bibliográfico (personal)' })
  async remove(@Param('id') id: string): Promise<void> {
    const existing = await this.catalogRepo.findById(id);
    if (!existing) throw new NotFoundException('Registro no encontrado');
    await this.catalogRepo.delete(id);
  }
}
