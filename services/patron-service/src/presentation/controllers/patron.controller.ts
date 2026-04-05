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
import { IsOptional, IsString, IsIn } from 'class-validator';

class PatchPatronDto {
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() @IsIn(['active', 'suspended', 'expired', 'blocked']) status?: string;
}

@ApiTags('Patrons')
@Controller('patrons')
export class PatronController {
  constructor(
    private readonly registerPatron: RegisterPatronUseCase,
    @Inject(PATRON_REPOSITORY) private readonly patronRepo: IPatronRepository,
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
  async listPatrons(
    @Query('libraryId') libraryId = 'lib-001',
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.patronRepo.findAllByLibrary(libraryId, Number(page), Number(limit));
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
}
