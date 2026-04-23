import { IsInt, IsString, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AdjustInventoryDto {
  @ApiProperty({ description: 'Positive to add stock, negative to remove' })
  @IsInt()
  @Type(() => Number)
  delta: number;

  @ApiProperty({ example: 'MANUAL_RESTOCK' })
  @IsString()
  reason: string;
}

export class InventoryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  lowStock?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}
