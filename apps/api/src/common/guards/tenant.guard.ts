import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TENANT_REQUIRED_KEY } from '../decorators/tenant.decorator';

/**
 * Guard that ensures a valid tenantId exists on the request.
 * Only enforced when the @TenantRequired() decorator is applied.
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
    const tenantId = request.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context is required for this operation');
    }

    // Ensure tenantId is set on request for downstream use
    request.tenantId = tenantId;
    return true;
  }
}
