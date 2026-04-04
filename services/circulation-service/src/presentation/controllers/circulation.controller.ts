import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateLoanSaga } from '../../application/sagas/create-loan.saga';
import { ReturnItemSaga } from '../../application/sagas/return-item.saga';
import { CreateLoanDto } from '../dtos/create-loan.dto';
import { ReturnItemDto } from '../dtos/return-item.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('Circulation')
@Controller('circulation')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CirculationController {
  constructor(
    private readonly createLoanSaga: CreateLoanSaga,
    private readonly returnItemSaga: ReturnItemSaga,
  ) {}

  @Post('loans')
  @HttpCode(HttpStatus.CREATED)
  @Roles('administrator', 'librarian')
  @ApiOperation({ summary: 'Check out an item to a patron (triggers Saga)' })
  @ApiResponse({ status: 201, description: 'Loan created successfully' })
  @ApiResponse({ status: 422, description: 'Patron suspended or item not available' })
  async createLoan(@Body() dto: CreateLoanDto) {
    return this.createLoanSaga.execute(dto);
  }

  @Post('returns')
  @HttpCode(HttpStatus.OK)
  @Roles('administrator', 'librarian')
  @ApiOperation({ summary: 'Return an item by barcode' })
  @ApiResponse({ status: 200, description: 'Item returned successfully' })
  async returnItem(@Body() dto: ReturnItemDto) {
    return this.returnItemSaga.execute(dto);
  }

  @Get('loans/patron/:patronId')
  @Roles('administrator', 'librarian', 'patron')
  @ApiOperation({ summary: 'Get loan history for a patron' })
  async getPatronLoans(
    @Param('patronId') patronId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return { patronId, page, limit };
  }
}
