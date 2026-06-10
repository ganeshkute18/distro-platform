import { IsString, IsOptional, IsEmail, IsEnum, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TenantPlan } from '@prisma/client';

export class CreateTenantDto {
  @ApiProperty({ example: 'Nath Sales Agency' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'nath-sales', description: 'URL-friendly slug (lowercase, hyphens)' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, { message: 'Slug must be lowercase alphanumeric with hyphens' })
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gstNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ enum: TenantPlan })
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;
}

export class UpdateTenantDto extends PartialType(CreateTenantDto) {}

export class OnboardTenantDto extends CreateTenantDto {
  @ApiProperty({ description: 'Owner email for the tenant' })
  @IsEmail()
  ownerEmail: string;

  @ApiProperty({ description: 'Owner name' })
  @IsString()
  @MinLength(2)
  ownerName: string;

  @ApiProperty({ description: 'Owner password' })
  @IsString()
  @MinLength(8)
  ownerPassword: string;
}

export class ResetTenantUserPasswordDto {
  @ApiProperty({ description: 'New password' })
  @IsString()
  @MinLength(8)
  password: string;
}
