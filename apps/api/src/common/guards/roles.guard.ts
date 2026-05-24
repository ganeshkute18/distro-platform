import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard — enforces role-based access control.
 *
 * Rules:
 *  - PLATFORM_ADMIN can access ANY route that doesn't explicitly exclude them.
 *    This means you (Ganesh) can always call any endpoint.
 *  - If @Roles(...) is applied, the user's role must be in the list.
 *  - If no @Roles() decorator, the route is open to any authenticated user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No role restriction — any authenticated user passes
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Access denied');

    // PLATFORM_ADMIN bypasses all role restrictions
    // (they are the platform owner — full access everywhere)
    if (user.role === Role.PLATFORM_ADMIN) return true;

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Role '${user.role}' is not permitted to access this resource. Required: [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
