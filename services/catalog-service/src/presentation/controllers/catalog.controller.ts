import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchCatalogUseCase } from '../../application/use-cases/search-catalog.use-case';
import { GetRecordUseCase } from '../../application/use-cases/get-record.use-case';
import { CreateRecordDto } from '../dtos/create-record.dto';
import { SearchFilters } from '@biblioflow/shared-types';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Public } from '../decorators/public.decorator';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly searchCatalog: SearchCatalogUseCase,
    private readonly getRecord: GetRecordUseCase,
  ) {}

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search the bibliographic catalog (public)' })
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
  @ApiOperation({ summary: 'Get bibliographic record details (public)' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async getOne(@Param('id') id: string) {
    return this.getRecord.execute(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'librarian')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new bibliographic record (staff only)' })
  async create(@Body() dto: CreateRecordDto) {
    return dto;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'librarian')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a bibliographic record (staff only)' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateRecordDto>) {
    return { id, ...dto };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a bibliographic record (admin only)' })
  async remove(@Param('id') _id: string): Promise<void> {}
}
