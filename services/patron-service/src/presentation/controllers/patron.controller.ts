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
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterPatronUseCase } from '../../application/use-cases/register-patron.use-case';
import { RegisterPatronDto } from '../../application/dtos/register-patron.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { TokenPayload } from '@biblioflow/shared-types';
import { IPatronRepository, PATRON_REPOSITORY } from '../../domain/repositories/patron.repository.interface';
import { PatronMapper } from '../../application/mappers/patron.mapper';
import { IsOptional, IsString, IsIn, IsNumber, Min } from 'class-validator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

class PatchPatronDto {
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() @IsIn(['active', 'suspended', 'expired', 'blocked']) status?: string;
}

class CreateFineDto {
  @IsString() loanId!: string;
  @IsNumber() @Min(0) amount!: number;
  @IsOptional() @IsString() reason?: string;
}

@ApiTags('Patrons')
@Controller('patrons')
export class PatronController {
  constructor(
    private readonly registerPatron: RegisterPatronUseCase,
    @Inject(PATRON_REPOSITORY) private readonly patronRepo: IPatronRepository,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo socio' })
  async register(@Body() dto: RegisterPatronDto) {
    return this.registerPatron.execute(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'librarian', 'assistant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los socios (personal)' })
  @ApiQuery({ name: 'libraryId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'query', required: false })
  async listPatrons(
    @Query('libraryId') libraryId = 'lib-001',
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('query') query?: string,
  ) {
    const result = await this.patronRepo.findAllByLibrary(libraryId, Number(page), Number(limit), query);
    return {
      data: result.data.map(PatronMapper.toDto),
      total: result.total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'librarian', 'assistant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estadísticas de socios' })
  async getStats(@Query('libraryId') libraryId = 'lib-001') {
    const result = await this.patronRepo.findAllByLibrary(libraryId, 1, 9999);
    return {
      total:       result.total,
      activos:     result.data.filter((p) => p.status === 'active').length,
      suspendidos: result.data.filter((p) => p.status === 'suspended').length,
      expirados:   result.data.filter((p) => p.status === 'expired').length,
      bloqueados:  result.data.filter((p) => p.status === 'blocked').length,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMyProfile(@CurrentUser() user: TokenPayload) {
    const patron = await this.patronRepo.findById(user.sub);
    if (!patron) return { userId: user.sub, role: user.role };
    return PatronMapper.toDto(patron);
  }

  @Get('card/:cardNumber')
  async getByCardNumber(@Param('cardNumber') cardNumber: string) {
    const patron = await this.patronRepo.findByCardNumber(cardNumber);
    if (!patron) return null;
    return PatronMapper.toDto(patron);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'librarian', 'assistant')
  @ApiBearerAuth()
  async getPatron(@Param('id') id: string) {
    const patron = await this.patronRepo.findById(id);
    if (!patron) return null;
    return PatronMapper.toDto(patron);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'librarian')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar datos o estado de un socio' })
  async patchPatron(@Param('id') id: string, @Body() dto: PatchPatronDto) {
    const patron = await this.patronRepo.findById(id);
    if (!patron) throw new NotFoundException('Socio no encontrado');

    // Aplicar cambios al dominio
    let updated = patron;
    if (dto.status === 'active')    updated = updated.activate();
    if (dto.status === 'suspended') updated = updated.suspend();
    if (dto.status === 'blocked')   updated = updated.block();
    if (dto.status === 'expired')   updated = updated.expire();

    // Campos mutables directos (el entity guarda props inmutables, así que hacemos reconstitución)
    const saved = await this.patronRepo.save(updated);
    return PatronMapper.toDto(saved);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar socio (admin)' })
  async deletePatron(@Param('id') id: string) {
    await this.patronRepo.delete(id);
  }

  // ── Multas ────────────────────────────────────────────────────────────────

  @Post(':id/fines')
  @ApiOperation({ summary: 'Registrar multa para un socio (interno desde circulation-service)' })
  async createFine(@Param('id') id: string, @Body() dto: CreateFineDto) {
    const patron = await this.patronRepo.findById(id);
    if (!patron) throw new NotFoundException('Socio no encontrado');
    const fine = await this.prisma.fine.create({
      data: {
        patronId: id,
        loanId: dto.loanId,
        amount: dto.amount,
        reason: dto.reason ?? 'Devolución tardía',
        status: 'pending',
      },
    });
    return { ...fine, amount: Number(fine.amount) };
  }

  @Get(':id/fines')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener multas del socio (pending por defecto, ?all=1 para todas)' })
  async getFines(@Param('id') id: string, @Query('all') all?: string) {
    const where = all === '1' ? { patronId: id } : { patronId: id, status: 'pending' as const };
    const fines = await this.prisma.fine.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    const serialized = fines.map((f) => ({ ...f, amount: Number(f.amount) }));
    const total = serialized.filter((f) => f.status === 'pending').reduce((s, f) => s + f.amount, 0);
    return { fines: serialized, total };
  }

  @Post(':id/fines/pay-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pagar todas las multas pendientes del socio' })
  async payAllFines(@Param('id') id: string) {
    const result = await this.prisma.fine.updateMany({
      where: { patronId: id, status: 'pending' },
      data: { status: 'paid', paidAt: new Date() },
    });
    if (result.count === 0) throw new BadRequestException('No hay multas pendientes');
    return { paid: result.count };
  }

  @Patch(':id/fines/:fineId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'librarian')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una multa individual (condonar, pagar, cambiar monto)' })
  async updateFine(
    @Param('id') id: string,
    @Param('fineId') fineId: string,
    @Body() body: { status?: 'paid' | 'waived'; amount?: number },
  ) {
    const fine = await this.prisma.fine.findFirst({ where: { id: fineId, patronId: id } });
    if (!fine) throw new NotFoundException('Multa no encontrada');
    const updated = await this.prisma.fine.update({
      where: { id: fineId },
      data: {
        ...(body.status ? { status: body.status, paidAt: new Date() } : {}),
        ...(body.amount !== undefined ? { amount: body.amount } : {}),
      },
    });
    return { ...updated, amount: Number(updated.amount) };
  }
}
