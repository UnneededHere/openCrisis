FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared package
COPY ../shared ./shared
WORKDIR /app/shared
RUN npm install && npm run build

# Copy server package
WORKDIR /app/server
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package*.json ./
COPY --from=builder /app/server/node_modules ./node_modules

EXPOSE 5000

CMD ["node", "dist/index.js"]
