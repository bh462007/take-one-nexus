#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo ".env file not found at $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/${DB_NAME:-take_one}-$STAMP.sql"

mysqldump \
  --host="${DB_HOST:-localhost}" \
  --port="${DB_PORT:-3306}" \
  --user="${DB_USER:-root}" \
  --password="${DB_PASSWORD:-}" \
  "${DB_NAME:-take_one}" > "$OUT"

gzip "$OUT"

echo "Backup created: $OUT.gz"
