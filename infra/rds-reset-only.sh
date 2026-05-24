#!/bin/bash
set -euo pipefail
RDS_HOST="${RDS_HOST:?RDS_HOST required}"
RDS_USER="${RDS_USER:-distro_admin}"
RDS_PASS="${RDS_PASS:?RDS_PASS required}"
RDS_DB="${RDS_DB:-distro_platform}"

PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -U "$RDS_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$RDS_DB' AND pid <> pg_backend_pid();" || true
PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -U "$RDS_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS \"$RDS_DB\";"
PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -U "$RDS_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE \"$RDS_DB\" ENCODING 'UTF8' TEMPLATE template0;"
echo "RDS database $RDS_DB reset complete"
