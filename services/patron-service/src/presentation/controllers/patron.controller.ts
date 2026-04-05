import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
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
  @ApiResponse({ status: 201, description: 'Socio registrado correctamente' })
  @ApiResponse({ status: 409, description: 'El email o número de carnet ya existe' })
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
    const result = await this.patronRepo.findAllByLibrary(
      libraryId,
      Number(page),
      Number(limit),
    );
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
  @ApiOperation({ summary: 'Estadísticas de socios (personal)' })
  async getStats(@Query('libraryId') libraryId = 'lib-001') {
    const result = await this.patronRepo.findAllByLibrary(libraryId, 1, 9999);
    const total = result.total;
    const activos = result.data.filter((p) => p.status === 'active').length;
    const suspendidos = result.data.filter((p) => p.status === 'suspended').length;
    const expirados = result.data.filter((p) => p.status === 'expired').length;
    const bloqueados = result.data.filter((p) => p.status === 'blocked').length;
    return { total, activos, suspendidos, expirados, bloqueados };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil del socio autenticado' })
  async getMyProfile(@CurrentUser() user: TokenPayload) {
    const patron = await this.patronRepo.findById(user.sub);
    if (!patron) return { userId: user.sub, role: user.role };
    return PatronMapper.toDto(patron);
  }

  @Get('card/:cardNumber')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar socio por número de carnet' })
  async getByCardNumber(@Param('cardNumber') cardNumber: string) {
    const patron = await this.patronRepo.findByCardNumber(cardNumber);
    if (!patron) return null;
    return PatronMapper.toDto(patron);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'librarian', 'assistant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener socio por ID (personal)' })
  async getPatron(@Param('id') id: string) {
    const patron = await this.patronRepo.findById(id);
    if (!patron) return null;
    return PatronMapper.toDto(patron);
  }
}
