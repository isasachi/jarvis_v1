#!/bin/sh

# Reemplazar WebSocket URL
sed -i "s|__BACKEND_WS_URL__|${BACKEND_WS_URL:-ws://localhost:8000/ws}|g" /usr/share/nginx/html/index.html

# Reemplazar puerto dinámico de Railway
export PORT=${PORT:-80}
sed -i "s/\$PORT/$PORT/g" /etc/nginx/conf.d/default.conf

exec "$@"