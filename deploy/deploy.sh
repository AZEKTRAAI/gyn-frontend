#!/usr/bin/env bash
# GYN production deployment script.
# Run from the repo root on the VPS after cloning (or inside the repo).
# Usage: ./deploy/deploy.sh
#
# What it does:
#   1. Refuses to run with uncommitted changes or a missing .env.
#   2. Takes a pre-deploy pg_dump into backups/ (git-ignored).
#   3. git pull.
#   4. docker compose build.
#   5. docker compose up -d (rolling restart: existing containers stop, new ones start).
#   6. Waits for the web and admin healthchecks to pass, then prints status.
#
# Zero-downtime blue/green is planned for Phase 11.
# When that arrives, replace step 5 with:
#   - docker compose up -d --no-recreate --scale web=2 (and the same for admin)
#   - wait for the new container to be healthy
#   - update Caddy's upstream to point to the new container
#   - docker compose stop the old container

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_DIR"

echo "=== GYN deploy: $(date -u '+%Y-%m-%dT%H:%M:%SZ') ==="

# 1. Refuse if working tree is dirty (uncommitted changes could mean a half-applied edit).
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "ERROR: working tree has uncommitted changes." >&2
    echo "       Stash or commit before deploying." >&2
    exit 1
fi

# 2. Refuse without a .env (the stack cannot start without secrets).
if [[ ! -f .env ]]; then
    echo "ERROR: .env not found." >&2
    echo "       Copy .env.production.example to .env and fill in every value." >&2
    exit 1
fi

# 3. Pre-deploy database dump.
BACKUP_DIR="$REPO_DIR/backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/pre-deploy-$(date +%Y%m%dT%H%M%S).sql.gz"

if docker compose ps db 2>/dev/null | grep -q "running"; then
    echo "Taking pre-deploy database dump..."
    # Pull POSTGRES_PASSWORD from .env; cut -d= -f2- handles passwords that contain '='.
    PG_PASS="$(grep '^POSTGRES_PASSWORD=' .env | head -1 | cut -d= -f2-)"
    docker compose exec -T -e PGPASSWORD="$PG_PASS" db \
        pg_dump -U gyn -d gyn | gzip > "$BACKUP_FILE"
    echo "Dump saved: $BACKUP_FILE"
    # Remove pre-deploy dumps older than 7 days to avoid filling the disk.
    find "$BACKUP_DIR" -name "pre-deploy-*.sql.gz" -mtime +7 -delete
else
    echo "WARNING: db service not running; skipping pre-deploy dump (first deploy?)."
fi

# 4. Pull latest code.
echo "Pulling latest commits..."
git pull

# 5. Build images and restart services.
echo "Building images..."
docker compose build

echo "Starting services..."
docker compose up -d

# 6. Wait for the web and admin healthchecks (up to 90 seconds each).
for SERVICE in web admin; do
    echo "Waiting for $SERVICE to become healthy..."
    CONTAINER="$(docker compose ps -q "$SERVICE" 2>/dev/null | head -1 || echo '')"
    HEALTHY=0
    for i in $(seq 1 45); do
        STATUS="$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo 'unknown')"
        if [[ "$STATUS" == "healthy" ]]; then
            HEALTHY=1
            break
        fi
        sleep 2
    done
    if [[ $HEALTHY -eq 1 ]]; then
        echo "$SERVICE is healthy."
    else
        echo "WARNING: $SERVICE did not become healthy within 90 seconds." >&2
        echo "         Check logs: docker compose logs $SERVICE" >&2
    fi
done

echo ""
docker compose ps
echo ""
echo "Done. To follow logs: docker compose logs -f"
