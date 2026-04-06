import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReturnItemDto {
  @ApiProperty({ example: 'BF-20240101-A3K9' })
  @IsString()
  @IsNotEmpty()
  itemBarcode: string;

  @ApiProperty({ example: 'staff-uuid-here' })
  @IsString()
  @IsNotEmpty()
  staffId: string;
}
