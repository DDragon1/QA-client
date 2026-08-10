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

RUN npm test
RUN npm run build

ENV DATABASE_URL=postgresql://qa:qa@postgres:5432/qa_app?schema=public
ENV PORT=3000

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
