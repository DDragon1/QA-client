FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

ENV DATABASE_URL=postgresql://qa:qa@postgres:5432/qa_app?schema=public
ENV PORT=3000

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
