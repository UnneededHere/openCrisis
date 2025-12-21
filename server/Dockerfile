FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install

# Copy source code
COPY shared/ ./shared/
COPY server/ ./server/

# Build shared package
WORKDIR /app/shared
RUN npm run build

# Build server
WORKDIR /app/server
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 5000

CMD ["node", "dist/index.js"]
