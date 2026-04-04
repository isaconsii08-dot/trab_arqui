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
import { CreateLoanSaga } from '../../application/sagas/create-loan.saga';
import { ReturnItemSaga } from '../../application/sagas/return-item.saga';
import { CreateLoanDto } from '../dtos/create-loan.dto';
import { ReturnItemDto } from '../dtos/return-item.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { ILoanRepository, LOAN_REPOSITORY } from '../../domain/repositories/loan.repository.interface';
import { LoanMapper } from '../../application/mappers/loan.mapper';

@ApiTags('Circulation')
@Controller('circulation')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CirculationController {
  constructor(
    private readonly createLoanSaga: CreateLoanSaga,
    private readonly returnItemSaga: ReturnItemSaga,
    @Inject(LOAN_REPOSITORY) private readonly loanRepo: ILoanRepository,
  ) {}

  @Post('loans')
  @HttpCode(HttpStatus.CREATED)
  @Roles('administrator', 'librarian')
  @ApiOperation({ summary: 'Registrar préstamo (activa el Saga)' })
  @ApiResponse({ status: 201, description: 'Préstamo creado correctamente' })
  @ApiResponse({ status: 422, description: 'Socio suspendido o material no disponible' })
  async createLoan(@Body() dto: CreateLoanDto) {
    return this.createLoanSaga.execute(dto);
  }

  @Post('returns')
  @HttpCode(HttpStatus.OK)
  @Roles('administrator', 'librarian')
  @ApiOperation({ summary: 'Registrar devolución por código de barras' })
  @ApiResponse({ status: 200, description: 'Material devuelto correctamente' })
  async returnItem(@Body() dto: ReturnItemDto) {
    return this.returnItemSaga.execute(dto);
  }

  @Get('loans/patron/:patronId')
  @Roles('administrator', 'librarian', 'assistant', 'patron')
  @ApiOperation({ summary: 'Historial de préstamos de un socio' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPatronLoans(
    @Param('patronId') patronId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const result = await this.loanRepo.findLoansByPatron(patronId, Number(page), Number(limit));
    return {
      data: result.data.map((l) => LoanMapper.toDto(l)),
      total: result.total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  @Get('loans/active')
  @Roles('administrator', 'librarian', 'assistant')
  @ApiOperation({ summary: 'Préstamos activos del día' })
  @ApiQuery({ name: 'patronId', required: false })
  async getActiveLoans(@Query('patronId') patronId?: string) {
    if (patronId) {
      const loans = await this.loanRepo.findActiveLoansByPatron(patronId);
      return { data: loans.map((l) => LoanMapper.toDto(l)), total: loans.length };
    }
    const overdue = await this.loanRepo.findOverdueLoans();
    return { data: overdue.map((l) => LoanMapper.toDto(l)), total: overdue.length };
  }

  @Get('stats')
  @Roles('administrator', 'librarian', 'assistant')
  @ApiOperation({ summary: 'Estadísticas de circulación del día' })
  async getStats() {
    // Préstamos vencidos en tiempo real
    const overdue = await this.loanRepo.findOverdueLoans();
    return {
      prestamosVencidos: overdue.length,
      // Estas métricas se llenarían con un repositorio de eventos de dominio
      // Por ahora devolvemos las que podemos calcular desde el estado actual
      prestamosActivos: 0,
    };
  }
}
