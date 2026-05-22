import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsInt, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CustomerType, PriceType } from '@prisma/client';

export class CreatePricingRuleDto {
  @ApiPropertyOptional({ description: 'Human-readable rule name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  // Target
  @ApiPropertyOptional({ description: 'Specific customer ID (for customer-specific pricing)' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ enum: CustomerType, description: 'Customer type (for type-based pricing)' })
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  // Scope
  @ApiPropertyOptional({ description: 'Specific product ID' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Category ID (applies to all products in category)' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  // Pricing
  @ApiProperty({ enum: PriceType })
  @IsEnum(PriceType)
  priceType: PriceType;

  @ApiProperty({ description: 'Price value: fixed price in paise, percentage, or flat discount' })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({ description: 'Minimum quantity for this rule to apply' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ description: 'Maximum quantity for this rule' })
  @IsOptional()
  @IsInt()
  maxQuantity?: number;

  @ApiPropertyOptional({ description: 'Priority (higher = checked first)' })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class UpdatePricingRuleDto extends PartialType(CreatePricingRuleDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ResolvePriceDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ enum: CustomerType })
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class BulkResolvePriceDto {
  @ApiProperty({ type: [ResolvePriceDto] })
  items: ResolvePriceDto[];
}
