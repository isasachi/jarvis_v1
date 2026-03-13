#!/bin/sh

sed -i "s|__BACKEND_WS_URL__|${BACKEND_WS_URL:-ws://localhost:8000/ws}|g" /usr/share/nginx/html/index.html

exec "$@"
