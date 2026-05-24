import { ForbiddenException } from '@nestjs/common';

/**
 * Tenant-Safe Query Helpers
 *
 * Centralized utilities that ensure every Prisma query
 * is scoped to the authenticated tenant. Prevents cross-tenant
 * data leakage at the service layer.
 */

/**
 * Validates that tenantId is present, then returns a where-clause
 * object with tenantId merged in.
 *
 * Usage:
 *   const where = tenantWhere(tenantId, { isActive: true });
 *   // → { tenantId: 'clxyz...', isActive: true }
 */
export function tenantWhere(
  tenantId: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  assertTenantId(tenantId);
  return { tenantId, ...extra };
}

/**
 * Returns a where-clause for finding a single record by ID
 * within the authenticated tenant.
 *
 * Usage:
 *   const product = await prisma.product.findFirst({ where: tenantFindOne(id, tenantId) });
 */
export function tenantFindOne(
  id: string,
  tenantId: string,
): { id: string; tenantId: string } {
  assertTenantId(tenantId);
  return { id, tenantId };
}

/**
 * Asserts that a tenantId value is present and non-empty.
 * Throws ForbiddenException if missing — this should NEVER happen
 * if TenantGuard is applied correctly.
 */
export function assertTenantId(tenantId: string | null | undefined): asserts tenantId is string {
  if (!tenantId) {
    throw new ForbiddenException(
      'Tenant context is required. Ensure X-Tenant-ID header or JWT tenantId is set.',
    );
  }
}

/**
 * Ensures a record belongs to the given tenant.
 * Use after a findUnique/findFirst to validate ownership
 * before update/delete operations.
 */
export function assertTenantOwnership(
  record: { tenantId: string | null } | null,
  tenantId: string,
  entityName = 'Record',
): void {
  if (!record) {
    return; // Let the caller handle NotFoundException separately
  }
  if (record.tenantId !== tenantId) {
    throw new ForbiddenException(
      `${entityName} does not belong to the current tenant`,
    );
  }
}
