import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  HttpException,
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
  @ApiQuery({ name: 'query', required: false })
  async listItems(
    @Query('recordId') recordId?: string,
    @Query('status') status?: string,
    @Query('query') query?: string,
  ) {
    const where: any = {};
    if (recordId) where['recordId'] = recordId;
    if (status) where['status'] = status;
    if (query) {
      where['OR'] = [
        { barcode:    { contains: query, mode: 'insensitive' } },
        { location:   { contains: query, mode: 'insensitive' } },
        { callNumber: { contains: query, mode: 'insensitive' } },
      ];
    }
    const items = await this.prisma.item.findMany({ where, orderBy: { barcode: 'asc' } });
    
    // Enriquecer con títulos del catálogo
    if (items.length > 0) {
      const recordIds = [...new Set(items.map(i => i.recordId))];
      // Nota: En un entorno real llamaríamos al microservicio de catálogo.
      // Por ahora, como el holdings-service es simple, simulamos/asumimos que el cliente de la intranet
      // ya tiene el título o lo pedimos al catálogo. Para ser rápidos, haremos un fetch al catálogo.
      try {
        const CATALOG_URL = 'http://127.0.0.1:3002';
        const titles: Record<string, string> = {};
        await Promise.all(recordIds.map(async (id) => {
          const res = await fetch(`${CATALOG_URL}/api/v1/catalog/${id}`);
          if (res.ok) {
            const data = await res.json() as any;
            titles[id] = data.title;
          }
        }));
        
        return { 
          data: items.map(i => ({ ...i, title: titles[i.recordId] || 'Libro en catálogo' })), 
          total: items.length 
        };
      } catch {
        return { data: items, total: items.length };
      }
    }

    return { data: items, total: items.length };
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo ejemplar' })
  async createItem(
    @Body() body: { barcode: string; recordId: string; libraryId: string; location?: string; callNumber?: string },
  ) {
    try {
      return await this.prisma.item.create({
        data: {
          barcode: body.barcode,
          recordId: body.recordId,
          libraryId: body.libraryId ?? 'lib-001',
          location: body.location ?? 'Sala General',
          callNumber: body.callNumber || null,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new HttpException(
          `El código de barras "${body.barcode}" ya existe`,
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        err?.message ?? 'Error al crear el ejemplar',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('items/:barcode/reserve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reservar ejemplar para préstamo (usa Circulation)' })
  async reserveItem(@Param('barcode') barcode: string) {
    const item = await this.prisma.item.findUnique({ where: { barcode } });
    if (!item) {
      throw new HttpException('Ejemplar no encontrado', HttpStatus.NOT_FOUND);
    }
    if (item.status !== 'available') {
      throw new HttpException(`Ejemplar no disponible (estado: ${item.status})`, HttpStatus.BAD_REQUEST);
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
