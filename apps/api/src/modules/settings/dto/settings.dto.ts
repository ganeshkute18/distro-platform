import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyLogoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentQrUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  upiId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankDetails?: string;
}

