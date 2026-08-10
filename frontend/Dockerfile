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

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
