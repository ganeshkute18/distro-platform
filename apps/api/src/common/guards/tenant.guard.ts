import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { TENANT_REQUIRED_KEY } from '../decorators/tenant.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Guard that ensures a valid tenantId exists on the request.
 * Only enforced when the @TenantRequired() decorator is applied.
 *
 * PLATFORM_ADMIN users bypass tenant requirement — they operate
 * at the platform level (no specific tenant context).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tenantRequired = this.reflector.getAllAndOverride<boolean>(TENANT_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If route doesn't require tenant, pass through
    if (!tenantRequired) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // PLATFORM_ADMIN operates at platform level — no tenant context needed
    // Prefer explicit header/slug/subdomain (middleware), then JWT claim
    const tenantId = request.tenantId ?? user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException(
        'Tenant context is required. Send X-Tenant-ID or X-Tenant-Slug, or use a login token with tenantId.',
      );
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, isActive: true },
      select: { id: true },
    });
    if (!tenant) {
      throw new ForbiddenException('Tenant is not active or does not exist');
    }

    if (user?.role !== Role.PLATFORM_ADMIN) {
      const membership = await this.prisma.tenantUser.findFirst({
        where: { tenantId, userId: user?.id, isActive: true },
        select: { role: true },
      });
      if (!membership) {
        throw new ForbiddenException('You do not belong to the requested tenant');
      }
      request.user = { ...user, role: membership.role, tenantId };
    }

    request.tenantId = tenantId;
    return true;
  }
}
