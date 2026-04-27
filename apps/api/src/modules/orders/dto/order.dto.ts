import {
  IsString, IsOptional, IsArray, IsInt, IsDateString,
  ValidateNested, Min, ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum } from 'class-validator';

export class OrderItemDto {
  @ApiProperty() @IsString() productId: string;
  @ApiProperty() @IsInt() @Min(1) @Type(() => Number) quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() deliveryDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() deliveryAddress?: string;
  @ApiPropertyOptional({ enum: ['COD', 'QR'], default: 'COD' })
  @IsOptional()
  @IsEnum(['COD', 'QR'])
  paymentMethod?: 'COD' | 'QR';
  @ApiPropertyOptional() @IsOptional() @IsString() paymentReceiptUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentReceiptNote?: string;
}

export class RejectOrderDto {
  @ApiProperty() @IsString() reason: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['PROCESSING', 'DISPATCHED', 'DELIVERED'] })
  @IsString()
  status: 'PROCESSING' | 'DISPATCHED' | 'DELIVERED';

  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class OrderQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() to?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 20;
}
