import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        businessName: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    if (payload.tenantId && user.role !== 'PLATFORM_ADMIN') {
      const membership = await this.prisma.tenantUser.findFirst({
        where: {
          tenantId: payload.tenantId,
          userId: user.id,
          isActive: true,
          tenant: { isActive: true },
        },
        select: { role: true },
      });
      if (!membership) {
        throw new UnauthorizedException('Tenant membership is inactive or invalid');
      }
      user.role = membership.role;
    }

    // Attach tenantId from JWT payload to the user object
    return {
      ...user,
      tenantId: payload.tenantId || null,
    };
  }
}
