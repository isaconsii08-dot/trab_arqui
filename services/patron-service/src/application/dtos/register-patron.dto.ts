import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterPatronDto {
  @ApiProperty({ example: 'lib-001' })
  @IsString()
  @IsNotEmpty()
  libraryId: string;

  @ApiProperty({ example: 'Ana García López' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @ApiProperty({ example: 'ana.garcia@universidad.es' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secur3P@ssw0rd', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiPropertyOptional({ example: '+34 612 345 678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Calle Mayor 10, 28001 Madrid' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
