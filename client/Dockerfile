FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared package
COPY ../shared ./shared
WORKDIR /app/shared
RUN npm install && npm run build

# Copy client package
WORKDIR /app/client
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production image with nginx
FROM nginx:alpine

COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
