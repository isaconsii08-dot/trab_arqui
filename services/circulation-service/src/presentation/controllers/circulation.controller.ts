import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
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
import { CreateLoanSaga } from '../../application/sagas/create-loan.saga';
import { ReturnItemSaga } from '../../application/sagas/return-item.saga';
import { CreateLoanDto } from '../dtos/create-loan.dto';
import { ReturnItemDto } from '../dtos/return-item.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { ILoanRepository, LOAN_REPOSITORY } from '../../domain/repositories/loan.repository.interface';
import { LoanMapper } from '../../application/mappers/loan.mapper';
import { IPatronServiceClient, PATRON_SERVICE_CLIENT } from '../../application/ports/patron-service-client.interface';

@ApiTags('Circulation')
@Controller('circulation')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CirculationController {
  constructor(
    private readonly createLoanSaga: CreateLoanSaga,
    private readonly returnItemSaga: ReturnItemSaga,
    @Inject(LOAN_REPOSITORY) private readonly loanRepo: ILoanRepository,
    @Inject(PATRON_SERVICE_CLIENT) private readonly patronClient: IPatronServiceClient,
  ) {}

  @Post('loans')
  @HttpCode(HttpStatus.CREATED)
  @Roles('administrator', 'librarian', 'patron')
  @ApiOperation({ summary: 'Registrar préstamo (activa el Saga)' })
  @ApiResponse({ status: 201, description: 'Préstamo creado correctamente' })
  @ApiResponse({ status: 422, description: 'Socio suspendido o material no disponible' })
  async createLoan(@Body() dto: CreateLoanDto) {
    try {
      return await this.createLoanSaga.execute(dto);
    } catch (err: any) {
      let mensaje = err.message;
      if (mensaje.includes('not available') && mensaje.includes('loaned')) {
        mensaje = `El ejemplar ${dto.itemBarcode} ya está prestado.`;
      } else if (mensaje.includes('not found')) {
        mensaje = `No se encontró el ejemplar o el socio.`;
      } else if (mensaje.includes('suspended')) {
        mensaje = `El socio está suspendido y no puede realizar préstamos.`;
      }
      throw new HttpException(mensaje, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  @Post('returns')
  @HttpCode(HttpStatus.OK)
  @Roles('administrator', 'librarian')
  @ApiOperation({ summary: 'Registrar devolución por código de barras' })
  @ApiResponse({ status: 200, description: 'Material devuelto correctamente' })
  async returnItem(@Body() dto: ReturnItemDto) {
    try {
      return await this.returnItemSaga.execute(dto);
    } catch (err: any) {
      let mensaje = err.message;
      if (mensaje.includes('not found')) {
        mensaje = `El ejemplar ${dto.itemBarcode} no tiene un préstamo activo.`;
      }
      throw new HttpException(mensaje, HttpStatus.UNPROCESSABLE_ENTITY);
    }
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
    const loans = await this.loanRepo.findAllActiveLoans();
    return { data: loans.map((l) => LoanMapper.toDto(l)), total: loans.length };
  }

  @Get('stats')
  @Roles('administrator', 'librarian', 'assistant')
  @ApiOperation({ summary: 'Estadísticas de circulación del día' })
  async getStats() {
    const [allActive, overdue] = await Promise.all([
      this.loanRepo.findAllActiveLoans(),
      this.loanRepo.findOverdueLoans(),
    ]);
    return {
      prestamosActivos: allActive.length,
      prestamosVencidos: overdue.length,
    };
  }

  @Get('loans/:id')
  @Roles('administrator', 'librarian', 'assistant')
  @ApiOperation({ summary: 'Obtener préstamo por ID' })
  async getLoan(@Param('id') id: string) {
    const loan = await this.loanRepo.findById(id);
    if (!loan) throw new NotFoundException('Préstamo no encontrado');
    return LoanMapper.toDto(loan);
  }

  @Patch('loans/:id')
  @Roles('administrator', 'librarian')
  @ApiOperation({ summary: 'Actualizar préstamo (cambiar fecha de vencimiento, estado)' })
  async updateLoan(@Param('id') id: string, @Body() body: { dueDate?: string; status?: string }) {
    const loan = await this.loanRepo.findById(id);
    if (!loan) throw new NotFoundException('Préstamo no encontrado');
    let updated = loan;
    if (body.dueDate) {
      updated = updated.updateDueDate(new Date(body.dueDate));
    }
    if (body.status === 'overdue') {
      updated = updated.markOverdue();
    }
    if (body.status === 'active') {
      updated = updated.updateDueDate(updated.dueDate);
    }
    const saved = await this.loanRepo.save(updated);

    // Si el cambio de fecha generó multa, crearla en patron-service
    if (body.dueDate && saved.fineAmount > 0) {
      const daysLate = Math.ceil(saved.fineAmount / 1000);
      await this.patronClient.createFine(
        saved.patronId,
        saved.id,
        saved.fineAmount,
        `Préstamo vencido hace ${daysLate} día${daysLate !== 1 ? 's' : ''} (fecha ajustada por personal)`,
      );
    }

    return LoanMapper.toDto(saved);
  }

  @Delete('loans/:id')
  @Roles('administrator', 'librarian')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar préstamo (cierre forzado sin multa)' })
  async cancelLoan(@Param('id') id: string) {
    const loan = await this.loanRepo.findById(id);
    if (!loan) throw new NotFoundException('Préstamo no encontrado');
    await this.loanRepo.save(loan.forceClose());
  }
}
