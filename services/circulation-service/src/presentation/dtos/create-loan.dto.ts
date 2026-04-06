import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanDto {
  @ApiProperty({ example: 'BF-20240101-A3K9', description: 'Item barcode' })
  @IsString()
  @IsNotEmpty()
  itemBarcode: string;

  @ApiProperty({ example: 'UCC-20260101-X4Z2', description: 'Patron card number' })
  @IsString()
  @IsNotEmpty()
  patronCardNumber: string;

  @ApiProperty({ example: 'staff-uuid-here' })
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @ApiProperty({ example: 'lib-001' })
  @IsString()
  @IsNotEmpty()
  libraryId: string;
}
