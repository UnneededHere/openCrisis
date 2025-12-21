FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install

# Copy source code
COPY shared/ ./shared/
COPY client/ ./client/

# Build shared package
WORKDIR /app/shared
RUN npm run build

# Build client
WORKDIR /app/client
RUN npm run build

# Production image with nginx
FROM nginx:alpine

COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
