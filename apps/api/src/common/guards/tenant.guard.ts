import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { TENANT_REQUIRED_KEY } from '../decorators/tenant.decorator';

/**
 * Guard that ensures a valid tenantId exists on the request.
 * Only enforced when the @TenantRequired() decorator is applied.
 *
 * PLATFORM_ADMIN users bypass tenant requirement — they operate
 * at the platform level (no specific tenant context).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const tenantRequired = this.reflector.getAllAndOverride<boolean>(TENANT_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If route doesn't require tenant, pass through
    if (!tenantRequired) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // PLATFORM_ADMIN operates at platform level — no tenant context needed
    if (user?.role === Role.PLATFORM_ADMIN) return true;

    // Prefer explicit header/slug/subdomain (middleware), then JWT claim
    const tenantId = request.tenantId ?? user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException(
        'Tenant context is required. Send X-Tenant-ID or X-Tenant-Slug, or use a login token with tenantId.',
      );
    }

    request.tenantId = tenantId;
    return true;
  }
}
