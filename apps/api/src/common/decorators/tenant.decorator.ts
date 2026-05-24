import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

/**
 * Extract tenantId from the request (set by TenantMiddleware or JWT).
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    // TenantGuard sets request.tenantId from header or JWT; fallback for optional routes
    return request.tenantId ?? request.user?.tenantId ?? null;
  },
);

/**
 * Mark a route as requiring tenant context.
 * Routes with this decorator will reject requests without tenantId.
 */
export const TENANT_REQUIRED_KEY = 'tenant_required';
export const TenantRequired = () => SetMetadata(TENANT_REQUIRED_KEY, true);

/**
 * Mark a route as tenant-optional (allows global/cross-tenant queries).
 */
export const TENANT_OPTIONAL_KEY = 'tenant_optional';
export const TenantOptional = () => SetMetadata(TENANT_OPTIONAL_KEY, true);
