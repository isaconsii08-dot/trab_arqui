import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@ApiTags('Holdings')
@Controller('holdings')
export class HoldingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('availability')
  @ApiOperation({ summary: 'Disponibilidad en lote por recordIds (separados por coma)' })
  async getAvailability(@Query('recordIds') recordIds: string) {
    if (!recordIds) return {};
    const ids = recordIds.split(',').map((s) => s.trim()).filter(Boolean);
    const items = await this.prisma.item.findMany({
      where: { recordId: { in: ids } },
      select: { recordId: true, status: true },
    });
    const result: Record<string, { total: number; available: number }> = {};
    for (const id of ids) {
      const grupo = items.filter((i) => i.recordId === id);
      result[id] = {
        total: grupo.length,
        available: grupo.filter((i) => i.status === 'available').length,
      };
    }
    return result;
  }

  @Get('items/:barcode')
  @ApiOperation({ summary: 'Obtener ejemplar por código de barras' })
  async getByBarcode(@Param('barcode') barcode: string) {
    const item = await this.prisma.item.findUnique({ where: { barcode } });
    if (!item) return null;
    return item;
  }

  @Get('records/:recordId/items')
  @ApiOperation({ summary: 'Ejemplares de un registro bibliográfico' })
  async getByRecord(@Param('recordId') recordId: string) {
    const items = await this.prisma.item.findMany({ where: { recordId } });
    const total = items.length;
    const disponibles = items.filter((i) => i.status === 'available').length;
    return { recordId, items, total, disponibles };
  }

  @Get('items')
  @ApiOperation({ summary: 'Listar ejemplares con filtros' })
  @ApiQuery({ name: 'recordId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async listItems(
    @Query('recordId') recordId?: string,
    @Query('status') status?: string,
  ) {
    const where: Record<string, unknown> = {};
    if (recordId) where['recordId'] = recordId;
    if (status) where['status'] = status;
    const items = await this.prisma.item.findMany({ where, orderBy: { barcode: 'asc' } });
    return { data: items, total: items.length };
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo ejemplar' })
  async createItem(
    @Body() body: { barcode: string; recordId: string; libraryId: string; location?: string; callNumber?: string },
  ) {
    return this.prisma.item.create({
      data: {
        barcode: body.barcode,
        recordId: body.recordId,
        libraryId: body.libraryId ?? 'lib-001',
        location: body.location ?? 'Sala General',
        callNumber: body.callNumber ?? null,
      },
    });
  }

  @Patch('items/:barcode/reserve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reservar ejemplar para préstamo (usa Circulation)' })
  async reserveItem(@Param('barcode') barcode: string) {
    const item = await this.prisma.item.findUnique({ where: { barcode } });
    if (!item || item.status !== 'available') {
      return { error: 'Ejemplar no disponible', barcode, status: item?.status ?? 'not_found' };
    }
    const updated = await this.prisma.item.update({
      where: { barcode },
      data: { status: 'loaned' },
    });
    return { barcode: updated.barcode, status: updated.status, reservedAt: new Date().toISOString() };
  }

  @Patch('items/:barcode/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liberar ejemplar (devolución)' })
  async releaseItem(@Param('barcode') barcode: string) {
    const updated = await this.prisma.item.update({
      where: { barcode },
      data: { status: 'available' },
    });
    return { barcode: updated.barcode, status: updated.status, releasedAt: new Date().toISOString() };
  }
}
