import {
  IsArray,
  IsEnum,
  IsISBN,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthorInputDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() dates?: string;
  @IsOptional() @IsString() role?: string;
}

export class CreateRecordDto {
  @ApiProperty() @IsString() @IsNotEmpty() libraryId: string;
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() uniformTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() edition?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1000) @Max(9999) publicationYear?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() publisher?: string;
  @ApiPropertyOptional() @IsOptional() @IsISBN() isbn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() coverImageUrl?: string;

  @ApiProperty({ enum: ['book', 'journal', 'audiovisual', 'map', 'archive', 'digital'] })
  @IsEnum(['book', 'journal', 'audiovisual', 'map', 'archive', 'digital'])
  materialType: string;

  @ApiPropertyOptional({ type: [AuthorInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuthorInputDto)
  authors?: AuthorInputDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];
}
