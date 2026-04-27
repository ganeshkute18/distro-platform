import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { LoginDto, SignupCustomerDto, SignupStaffDto, GenerateInvitationDto } from './dto/auth.dto';
import { AuditAction, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
    private emailService: EmailService,
  ) {}

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    // Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    // Check if user is approved (for staff members)
    if (user.role === Role.STAFF && user.approvalStatus === 'PENDING') {
      throw new UnauthorizedException('Your account is pending approval. Please wait for admin confirmation.');
    }

    if (user.role === Role.STAFF && user.approvalStatus === 'REJECTED') {
      throw new UnauthorizedException('Your account has been rejected. Please contact support.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      entity: 'User',
      entityId: user.id,
      ipAddress: ip,
      userAgent,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessName: user.businessName,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; role: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.refreshToken || !user.isActive) {
      throw new ForbiddenException('Access denied');
    }

    const tokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatches) throw new ForbiddenException('Access denied');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.LOGOUT,
      entity: 'User',
      entityId: userId,
    });
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  async verifyEmail(token: string) {
    // Find user with this verification token
    const user = await this.prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Check token expiration
    if (user.verificationTokenExpiresAt && new Date() > user.verificationTokenExpiresAt) {
      throw new BadRequestException('Verification token has expired');
    }

    // Mark email as verified
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });

    return {
      message: 'Email verified successfully',
      email: updatedUser.email,
    };
  }

  async resendVerificationEmail(email: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return {
        message: 'If an account with this email exists, a verification link will be sent',
      };
    }

    if (user.emailVerified) {
      return {
        message: 'This email is already verified',
      };
    }

    // Generate new verification token
    const token = this.generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Save token to database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: token,
        verificationTokenExpiresAt: expiresAt,
      },
    });

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(user.email, token);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    return {
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  // ============================================================================
  // SIGNUP ENDPOINTS - ROLE-BASED
  // ============================================================================

  async signupCustomer(dto: SignupCustomerDto) {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Create customer user
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: Role.CUSTOMER,
        businessName: dto.businessName,
        phone: dto.phone,
        address: dto.address,
        isActive: true,
        emailVerified: true,
        approvalStatus: 'APPROVED', // Customers auto-approved
      },
    });

    // Log user creation
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.USER_CREATED,
      entity: 'User',
      entityId: user.id,
    });

    return {
      message: 'Account created successfully. You can sign in now.',
      email: user.email,
      requiresEmailVerification: false,
    };
  }

  async signupStaff(dto: SignupStaffDto) {
    // Validate invitation code
    const invitation = await this.prisma.invitation.findUnique({
      where: { code: dto.invitationCode },
    });

    if (!invitation) {
      throw new BadRequestException('Invalid invitation code');
    }

    if (invitation.isUsed) {
      throw new BadRequestException('Invitation already used');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Invitation expired');
    }

    if (invitation.email && invitation.email !== dto.email) {
      throw new BadRequestException('Email does not match invitation');
    }

    // Check if email already exists
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Generate verification token
    const verificationToken = this.generateVerificationToken();
    const verificationTokenExpiresAt = new Date();
    verificationTokenExpiresAt.setHours(verificationTokenExpiresAt.getHours() + 24);

    // Create staff user with PENDING approval status
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: Role.STAFF,
        businessName: dto.businessName,
        isActive: true,
        emailVerified: false,
        verificationToken,
        verificationTokenExpiresAt,
        approvalStatus: 'PENDING', // Staff requires approval
      },
    });

    // Mark invitation as used
    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        isUsed: true,
        usedBy: user.id,
        usedAt: new Date(),
      },
    });

    // Log user creation
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.USER_CREATED,
      entity: 'User',
      entityId: user.id,
    });

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(user.email, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    return {
      message: 'Account created successfully. Please verify your email to proceed.',
      email: user.email,
      requiresEmailVerification: true,
      requiresApproval: true,
    };
  }

  // ============================================================================
  // INVITATION MANAGEMENT - OWNER ONLY
  // ============================================================================

  async generateInvitation(ownerId: string, dto: GenerateInvitationDto) {
    // Verify owner exists
    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can generate invitations');
    }

    // Generate unique code
    const randomBytes = crypto.randomBytes(6).toString('hex').toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const code = `${dto.role}_${randomBytes}_${timestamp}`;

    // Set expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (dto.expiresInDays || 7));

    // Create invitation
    const invitation = await this.prisma.invitation.create({
      data: {
        code,
        role: dto.role === 'STAFF' ? Role.STAFF : Role.STAFF,
        email: dto.email || null,
        expiresAt,
        createdBy: ownerId,
      },
    });

    return {
      code: invitation.code,
      role: invitation.role,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      message: `Share this code with the user: ${invitation.code}`,
    };
  }

  async listInvitations(ownerId: string, used?: boolean) {
    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can view invitations');
    }

    const where: any = { createdBy: ownerId };
    if (used !== undefined) {
      where.isUsed = used;
    }

    return this.prisma.invitation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        code: true,
        role: true,
        email: true,
        isUsed: true,
        usedBy: true,
        usedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '48h'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const hashed = await bcrypt.hash(token, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }

  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
