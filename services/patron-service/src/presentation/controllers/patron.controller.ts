import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterPatronUseCase } from '../../application/use-cases/register-patron.use-case';
import { RegisterPatronDto } from '../../application/dtos/register-patron.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { TokenPayload } from '@biblioflow/shared-types';

@ApiTags('Patrons')
@Controller('patrons')
export class PatronController {
  constructor(private readonly registerPatron: RegisterPatronUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new patron' })
  @ApiResponse({ status: 201, description: 'Patron registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or card number already in use' })
  async register(@Body() dto: RegisterPatronDto) {
    return this.registerPatron.execute(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current patron profile' })
  async getMyProfile(@CurrentUser() user: TokenPayload) {
    return { userId: user.sub, role: user.role };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator', 'librarian')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get patron by ID (staff only)' })
  async getPatron(@Param('id', ParseUUIDPipe) id: string) {
    return { id };
  }
}
