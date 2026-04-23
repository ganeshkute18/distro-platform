import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class LoginDto {
  @ApiProperty({ example: 'owner@distro.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class SignupCustomerDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'John Store', required: false })
  @IsOptional()
  @IsString()
  businessName?: string;
}

export class SignupStaffDto {
  @ApiProperty({ example: 'staff@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Jane Staff' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'STAFF_ABC123_1234567890' })
  @IsString()
  @IsNotEmpty()
  invitationCode: string;

  @ApiProperty({ example: 'My Business', required: false })
  @IsOptional()
  @IsString()
  businessName?: string;
}

export class GenerateInvitationDto {
  @ApiProperty({ enum: ['STAFF'], example: 'STAFF' })
  @IsEnum(['STAFF'])
  role: 'STAFF' = 'STAFF';

  @ApiProperty({ example: 'newstaff@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 7, required: false })
  @IsOptional()
  expiresInDays?: number;
}
