import { Controller, Post, Body, Req, HttpCode, HttpStatus, UseGuards, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, SignupCustomerDto, SignupStaffDto, GenerateInvitationDto, VerifyEmailDto, ResendVerificationEmailDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant, TenantRequired } from '../../common/decorators/tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User, Role } from '@prisma/client';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Public()
  @Post('signup/customer')
  @HttpCode(HttpStatus.CREATED)
  signupCustomer(@Body() dto: SignupCustomerDto, @Req() req: Request & { tenantId?: string }) {
    return this.authService.signupCustomer(dto, req.tenantId);
  }

  @Public()
  @Post('signup/customer/:tenantSlug')
  @HttpCode(HttpStatus.CREATED)
  signupCustomerForTenant(@Param('tenantSlug') tenantSlug: string, @Body() dto: SignupCustomerDto) {
    return this.authService.signupCustomerForTenant(dto, tenantSlug);
  }

  @Public()
  @Post('signup/staff')
  @HttpCode(HttpStatus.CREATED)
  signupStaff(@Body() dto: SignupStaffDto) {
    return this.authService.signupStaff(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Post('resend-verification-email')
  @HttpCode(HttpStatus.OK)
  resendVerificationEmail(@Body() dto: ResendVerificationEmailDto) {
    return this.authService.resendVerificationEmail(dto.email);
  }

  @Roles(Role.OWNER)
  @TenantRequired()
  @Post('invitations/generate')
  @HttpCode(HttpStatus.CREATED)
  generateInvitation(@CurrentUser() user: User, @Body() dto: GenerateInvitationDto, @CurrentTenant() tenantId: string) {
    return this.authService.generateInvitation(user.id, dto, tenantId);
  }

  @Roles(Role.OWNER)
  @TenantRequired()
  @Get('invitations')
  listInvitations(
    @CurrentUser() user: User,
    @CurrentTenant() tenantId: string,
    @Query('used') used?: boolean,
  ) {
    return this.authService.listInvitations(user.id, tenantId, used);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }
}
