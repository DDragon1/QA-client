FROM node:20-alpine

WORKDIR /app

# Chromium for Hebrew RTL PDF rendering via puppeteer-core
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    ttf-dejavu

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_PATH=/usr/bin/chromium

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json vitest.config.mts ./
COPY src ./src
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN npm test
RUN npm run build

RUN mkdir -p /tmp \
    && sed -i 's/\r$//' /app/docker-entrypoint.sh \
    && chmod +x /app/docker-entrypoint.sh \
    && chgrp -R 0 /app /tmp \
    && chmod -R g+rwX /app /tmp

ENV PORT=3000 \
    HOST=0.0.0.0

EXPOSE 3000

CMD ["./docker-entrypoint.sh"]
