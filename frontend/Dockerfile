FROM node:20-alpine AS build

WORKDIR /app

RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMIUM_PATH=/usr/bin/chromium

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm test
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

RUN sed -i 's/\r$//' /docker-entrypoint.sh \
    && chmod +x /docker-entrypoint.sh \
    && mkdir -p /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp \
    && chgrp -R 0 /usr/share/nginx/html /var/cache/nginx /var/log/nginx /tmp /etc/nginx \
    && chmod -R g+rwX /usr/share/nginx/html /var/cache/nginx /var/log/nginx /tmp \
    && chmod -R g+rX /etc/nginx

ENV PORT=8080 \
    API_URL=/api

EXPOSE 8080

STOPSIGNAL SIGQUIT

ENTRYPOINT ["/docker-entrypoint.sh"]
