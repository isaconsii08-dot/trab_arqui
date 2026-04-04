import { Controller, Get, Patch, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Holdings')
@Controller('holdings')
export class HoldingsController {
  @Get('items/:barcode')
  @ApiOperation({ summary: 'Get item by barcode' })
  async getByBarcode(@Param('barcode') barcode: string) {
    return { barcode, status: 'available', location: 'Sala General' };
  }

  @Get('records/:recordId/items')
  @ApiOperation({ summary: 'Get all items for a bibliographic record' })
  async getByRecord(@Param('recordId') recordId: string) {
    return { recordId, items: [] };
  }

  @Patch('items/:barcode/reserve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atomically reserve an item for loan (called by Circulation)' })
  async reserveItem(@Param('barcode') barcode: string) {
    return { barcode, status: 'loaned', reservedAt: new Date().toISOString() };
  }

  @Patch('items/:barcode/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release an item back to available (called by Circulation)' })
  async releaseItem(@Param('barcode') barcode: string) {
    return { barcode, status: 'available', releasedAt: new Date().toISOString() };
  }
}
