#!/bin/sh
# If the container starts as root (first run, volume is root:root), fix upload directory
# ownership and drop to the nextjs user (uid 1001). Subsequent starts are a no-op chown.
# security_opt: no-new-privileges allows root-to-user drops; it only blocks privilege gains.
set -e
if [ "$(id -u)" = "0" ]; then
    chown -R nextjs:nodejs /data/uploads
    exec gosu nextjs "$@"
fi
exec "$@"
