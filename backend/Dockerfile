# Backend Dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN npx prisma migrate deploy || true

EXPOSE 3001

CMD ["npx", "tsx", "src/index.ts"]
