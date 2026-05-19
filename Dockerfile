# Stage 1: Build frontend
FROM node:20-alpine AS builder
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine
WORKDIR /app
COPY backend/package.json ./
RUN npm install --production
COPY backend/server.js ./
COPY --from=builder /app/backend/public ./public

EXPOSE 3000
ENV DATA_DIR=/data

VOLUME ["/data"]
CMD ["node", "server.js"]
