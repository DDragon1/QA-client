#!/bin/sh
set -e

API_URL="${API_URL:-/api}"
PORT="${PORT:-8080}"
HTML_ROOT="${HTML_ROOT:-/usr/share/nginx/html}"

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

API_URL_NORMALIZED=$(printf '%s' "$API_URL" | sed 's:/*$::')
if [ -z "$API_URL_NORMALIZED" ]; then
  API_URL_NORMALIZED="/api"
fi

printf '{"apiUrl":"%s"}\n' "$(json_escape "$API_URL_NORMALIZED")" > "$HTML_ROOT/config.json"

PROXY_BLOCK=""
if [ -n "${BACKEND_URL:-}" ]; then
  BACKEND_URL_NORMALIZED=$(printf '%s' "$BACKEND_URL" | sed 's:/*$::')
  PROXY_BLOCK=$(cat <<EOF
    location /api/ {
        proxy_pass ${BACKEND_URL_NORMALIZED}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
EOF
)
fi

cat > /tmp/nginx-server.conf <<EOF
server {
    listen ${PORT};
    server_name _;
    root ${HTML_ROOT};
    index index.html;

    location = /healthz {
        access_log off;
        add_header Content-Type text/plain;
        return 200 'ok';
    }

${PROXY_BLOCK}

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

exec nginx -g 'daemon off;'
