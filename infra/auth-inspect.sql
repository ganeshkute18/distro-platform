\pset pager off
\x off

select
  id,
  email,
  role,
  "isActive",
  "emailVerified",
  "approvalStatus",
  ("passwordHash" is not null) as has_hash,
  length("passwordHash") as hash_len,
  "createdAt"
from users
where role in ('PLATFORM_ADMIN','OWNER')
order by role, email;

select
  u.email,
  tu."tenantId",
  t.slug as tenant_slug,
  tu.role as tenant_role,
  tu."isActive" as membership_active
from "tenant_users" tu
join users u on u.id = tu."userId"
join tenants t on t.id = tu."tenantId"
where u.role = 'OWNER'
order by u.email, t.slug;