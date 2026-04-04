import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'ana.garcia@universidad.es' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secur3P@ssw0rd' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
