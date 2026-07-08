# Multi-stage monorepo Dockerfile
# Build: docker build -t medimemo .

# === Backend stage ===
FROM node:20-slim AS backend-deps
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production

FROM node:20-slim AS backend-build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate

# Final backend image
FROM node:20-slim AS backend
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY --from=backend-deps /app/node_modules ./node_modules
COPY --from=backend-build /app/prisma ./prisma
COPY --from=backend-build /app/src ./src
COPY backend/package.json ./
COPY backend/tsconfig.json ./
RUN npx prisma generate
EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push --skip-generate && npx ts-node src/server.ts"]

# === Frontend stage ===
FROM node:20-slim AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM nginx:alpine AS frontend
COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
