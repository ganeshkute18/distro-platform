import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * TenantMiddleware resolves tenant from multiple sources:
 * 1. X-Tenant-ID header (explicit)
 * 2. X-Tenant-Slug header (by slug lookup)
 * 3. Subdomain (e.g., agency1.distropro.com)
 * JWT tenantId is applied later by TenantGuard (after auth) when @TenantRequired() is set.
 *
 * Sets `req.tenantId` for downstream use when resolved from headers/subdomain.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request & { tenantId?: string }, res: Response, next: NextFunction) {
    let tenantId: string | undefined;

    // 1. Explicit header
    const headerTenantId = req.headers['x-tenant-id'] as string;
    if (headerTenantId) {
      tenantId = headerTenantId;
    }

    // 2. Slug header
    if (!tenantId) {
      const slug = req.headers['x-tenant-slug'] as string;
      if (slug) {
        const tenant = await this.prisma.tenant.findUnique({
          where: { slug },
          select: { id: true, isActive: true },
        });
        if (tenant && tenant.isActive) {
          tenantId = tenant.id;
        }
      }
    }

    // 3. Subdomain extraction
    if (!tenantId) {
      const host = req.headers.host || '';
      const parts = host.split('.');
      // For subdomains like agency1.distropro.com (3+ parts)
      if (parts.length >= 3) {
        const subdomain = parts[0];
        if (subdomain !== 'www' && subdomain !== 'api') {
          const tenant = await this.prisma.tenant.findUnique({
            where: { slug: subdomain },
            select: { id: true, isActive: true },
          });
          if (tenant && tenant.isActive) {
            tenantId = tenant.id;
          }
        }
      }
    }

    req.tenantId = tenantId;
    next();
  }
}
